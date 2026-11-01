import * as THREE from 'three';
import { PopFigure } from '../ink/pop.js';
import { StrokeSet, Pen } from '../ink/strokes.js';
import { box } from '../ink/shapes.js';
import { V, RED, BLUE, ORANGE, KINETIC, dashes } from '../ink/kit.js';
import { DioramaLesson } from '../lessons/diorama.js';
import { FlexSheet } from '../lessons/flexsheet.js';
import { WedgeSet } from './wedges.js';

// The cone on a bare stage: same ink, paper and glow as the book, no book. The maths lives in
// cone(), the picture only draws it, and clicks, steps and the tutor all go through COMMANDS.

const Y0 = 5, S = 6, OX = 72, OZ = 42, CX = -36, CZ = 0, BAR_Z = 96, BAR_X = -124, BAR_K = 1.75;
const SOFT = 3;     // how fast values ease, per second

export const cone = (R, angle) => {
  const r = (R * angle) / 360, h = Math.sqrt(Math.max(0, R * R - r * r));
  return { R, angle, l: R, r, h, arc: 2 * Math.PI * R * (angle / 360), full: 2 * Math.PI * R, volume: (Math.PI * r * r * h) / 3, csa: Math.PI * r * R };
};

const fix = (x, d = 2) => String(Number(x.toFixed(d)));

const VIEWS = {
  angle: { yaw: 0.32, pitch: 0.62 },
  front: { yaw: 0, pitch: 0.14 },
  above: { yaw: 0, pitch: 1.2 },
  side: { yaw: 1.15, pitch: 0.32 },
};

export class ConeScene {
  constructor(stage, onChange) {
    Object.assign(this, { stage, onChange, lifters: [], tickers: [], glows: [], time: 0 });
    this.L = { Y0 };
    this.v = { fold: 0, cut: 0, angle: 216, R: 10, brk: 0 };
    this.goal = { ...this.v };
    this.ease = SOFT;
    this.parts = { circle: 1, bars: 0, triangle: 0, cylinder: 0, compare: null, pieces: 12 };
    this.view = { ...VIEWS.angle, goalYaw: VIEWS.angle.yaw, goalPitch: VIEWS.angle.pitch };
    this.hl = null;

    const pop = this.pop = new PopFigure(stage.renderer, { frame: new THREE.Matrix4(), printRect: { x0: -150, x1: 150, y0: -4, y1: 150 }, pxPerMm: 3 });
    for (const m of [pop]) m.u.uLiftAll.value = 1;
    this.pen = new Pen();
    this.ink = new StrokeSet(pop.ink({ widthPx: 1.55 }));
    this.faint = new StrokeSet(pop.ink({ widthPx: 1 }));
    const D = [];
    this.deferred = { push: (fn) => D.push(fn) };
    this.build();
    this.pen.fit(Math.min(this.pen.end, 3));
    this.ink.build(); pop.addLines(this.ink);
    this.faint.build(); pop.addLines(this.faint);
    for (const fn of D) fn();
    this.deferred = D;
    stage.scene.add(pop.group);
    pop.set('print');
    this.placeAll();
    pop.draw();
    for (const m of pop.inkMats) m.uniforms.uWidthMm.value = 0.34;
  }

  dyn(color, widthPx = 1.6, capacity = 300) { return DioramaLesson.prototype.dyn.call(this, color, widthPx, capacity); }

  build() {
    const { pop, pen, ink } = this;
    const board = pop.paper({ hatchA: [0.62, 0.62, 0.48], hatchB: [-0.5, 0.45, 0.74], spacing: 2.2, seed: 2, hatch: 0.35 });
    box(pop, ink, V(-132, 0, -88), V(132, Y0, 110), { mat: board, pen, width: 1.05 });
    const card = pop.paper({ hatchA: [1, 0.1, 0.2], hatchB: [0.2, 0.3, 1], spacing: 1.7, hatch: 0.72, seed: 31, color: '#f7e7cf' });
    this.sheet = new FlexSheet(this, 16, 120, { mat: card });
    const face = pop.paper({ hatch: 0.2, spacing: 1.8, seed: 33, color: '#f9d9ad' });
    this.tri = new FlexSheet(this, 24, 8, { mat: face });
    this.circle = this.dyn(undefined, 1, 500);
    this.arc = this.dyn(ORANGE, 2.2, 700);
    this.slant = this.dyn(BLUE, 2.1, 400);
    this.guide = this.dyn(RED, 1.8, 300);
    this.radius = this.dyn('#2f8f5b', 2.1, 200);
    this.bars = this.dyn(undefined, 3, 200);
    this.barArc = this.dyn(ORANGE, 3.2, 200);
    this.glowLine = this.dyn('#ff7a1c', 3.2, 900);
    this.sc = pen.next(80);
    [this.cupR, this.cupH] = this.rack({ cx: 90, z: -50, legH: 10, r: 8, h: 20, items: [
      { color: ORANGE, label: 'Base radius r', unit: 'cm', capacity: 14, digits: 1 },
      { color: KINETIC, label: 'Height h', unit: 'cm', capacity: 14, digits: 1 },
    ] });
    const cool = pop.paper({ hatchA: [1, 0.1, 0.2], hatchB: [0.2, 0.3, 1], spacing: 1.7, hatch: 0.72, seed: 35, color: '#d9e5f3' });
    this.other = new FlexSheet(this, 12, 96, { mat: cool, edges: ['u1', 'v0', 'v1'] });
    this.cyl = this.dyn('#2f8f5b', 1.5, 700);
    this.wedges = new WedgeSet(this);
  }

  rack(o) { return DioramaLesson.prototype.rack.call(this, o); }

  placeAll() {
    const { v, parts } = this, R = v.R * S, frac = v.angle / 360;
    const sinB = 1 + (frac - 1) * v.fold, cosB = Math.sqrt(Math.max(0, 1 - sinB * sinB));
    const span = 2 * Math.PI * frac * (1 - 0.5 * v.cut), top = Y0 + 0.6;
    const placed = (rho, a) => {
      const ph = a / sinB - Math.PI / 2;
      return V(CX + rho * sinB * Math.cos(ph), top + (R - rho) * cosB, CZ + rho * sinB * Math.sin(ph));
    };
    this.sheet.shape((u, w, o) => { const p = placed(u * R, (w - 0.5) * span); o.x = p.x; o.y = p.y; o.z = p.z; });
    const whole = v.brk < 0.02;
    this.sheet.mesh.visible = whole; this.sheet.outline.mesh.visible = whole;
    this.wedges.place({ b: v.brk, n: parts.pieces, R, frac, cx: CX, cz: CZ, top });
    const L = this.sheet, sc = this.sc, line = (points, width = 1.05) => ({ points, width, taper: false, sched: sc });
    this.arc.setLines(whole ? [line(L.border('u1'), 1.2)] : []);
    this.slant.setLines(whole ? ['v0', 'v1'].map((b) => line(L.border(b))) : []);
    const tip = V(CX, top + R * cosB, CZ), base = V(CX, Y0 + 0.5, CZ), rimR = V(CX + R * sinB, Y0 + 0.5, CZ), rimL = V(CX - R * sinB, Y0 + 0.5, CZ);

    const open = parts.triangle * v.cut;
    this.tri.mesh.visible = open > 0.02;
    this.tri.outline.mesh.visible = open > 0.02;
    this.tri.shape((u, w, o) => { o.x = CX + (2 * u - 1) * R * sinB * (1 - w); o.y = Y0 + 0.5 + w * R * cosB; o.z = CZ + 0.15; });
    const guides = [];
    if (whole && (parts.triangle > 0.5 || v.fold > 0.08)) for (const d of dashes([tip, base], 3, 2.2)) guides.push(line(d, 0.9));
    this.guide.setLines(guides);
    this.radius.setLines(whole && (v.fold > 0.5 || open > 0.02) ? [line([base, rimR], 1.1)] : []);

    const ring = Array.from({ length: 121 }, (_, i) => { const a = (i / 120) * Math.PI * 2; return V(CX + R * Math.cos(a), Y0 + 0.2, CZ + R * Math.sin(a)); });
    this.circle.setLines(whole && parts.circle > 0.5 && v.fold < 0.6 ? dashes(ring, 3, 2.4).map((d) => line(d, 0.8)) : []);

    const c = cone(v.R, v.angle), x0 = BAR_X, on = parts.bars > 0.5;
    this.bars.setLines(on ? [line([V(x0, Y0 + 0.3, BAR_Z - 12), V(x0 + c.full * BAR_K, Y0 + 0.3, BAR_Z - 12)], 1.5)] : []);
    this.barArc.setLines(on ? [line([V(x0, Y0 + 0.3, BAR_Z), V(x0 + c.arc * BAR_K, Y0 + 0.3, BAR_Z)], 1.6)] : []);

    // a second cone beside the first, sharing the card radius and the fold
    const cmp = parts.compare, oth = this.other, other = cmp != null;
    oth.mesh.visible = other; oth.outline.mesh.visible = other;
    if (other) {
      const f2 = cmp / 360, s2 = 1 + (f2 - 1) * v.fold, c2 = Math.sqrt(Math.max(0, 1 - s2 * s2)), sp2 = 2 * Math.PI * f2;
      oth.shape((u, w, o) => {
        const rho = u * R, ph = ((w - 0.5) * sp2) / s2 - Math.PI / 2;
        o.x = OX + rho * s2 * Math.cos(ph); o.z = OZ + rho * s2 * Math.sin(ph); o.y = top + (R - rho) * c2;
      });
      this.otherEnds = { tip: V(OX, top + R * c2, OZ), base: V(OX, Y0 + 0.5, OZ), rim: V(OX + R * s2, Y0 + 0.5, OZ) };
    }
    // the cylinder that would hold three of this cone
    const cyl = [];
    if (parts.cylinder > 0.5 && whole) {
      const rr = R * sinB, hh = R * cosB, ringAt = (y) => Array.from({ length: 73 }, (_, i) => { const a = (i / 72) * Math.PI * 2; return V(CX + rr * Math.cos(a), y, CZ + rr * Math.sin(a)); });
      cyl.push(line(ringAt(Y0 + 0.6), 1), line(ringAt(Y0 + hh), 1));
      const ex = Math.cos(this.view.yaw) * rr, ez = -Math.sin(this.view.yaw) * rr;
      for (const k of [1, -1]) cyl.push(line([V(CX + k * ex, Y0 + 0.6, CZ + k * ez), V(CX + k * ex, Y0 + hh, CZ + k * ez)], 1));
    }
    this.cyl.setLines(cyl);

    this.cupR.setValue(v.R * sinB);
    this.cupH.setValue(v.R * cosB);
    this.ends = { tip, base, rimR, rimL };
    this.onChange?.();
  }

  /** Named points on the model. Marks attach to these, so they follow it around. */
  anchors() {
    const e = this.ends;
    if (!e) return {};
    const { tip, base, rimR, rimL } = e, L = this.sheet, nv = L.nv, nu = L.nu, mid = (a, b) => a.clone().add(b).multiplyScalar(0.5);
    const c = cone(this.v.R, this.v.angle), y = Y0 + 0.3;
    const out = {
      centre: V(CX, Y0 + 20, CZ), tip, base_centre: base, rim_right: rimR, rim_left: rimL,
      arc_mid: L.p(nu, nv >> 1), edge_left: L.p(nu >> 1, 0), edge_right: L.p(nu >> 1, nv), edge_left_end: L.p(nu, 0), edge_right_end: L.p(nu, nv),
      height_mid: mid(tip, base), radius_mid: mid(base, rimR),
      bar_full_start: V(BAR_X, y, BAR_Z - 12), bar_full_end: V(BAR_X + c.full * BAR_K, y, BAR_Z - 12),
      bar_arc_start: V(BAR_X, y, BAR_Z), bar_arc_end: V(BAR_X + c.arc * BAR_K, y, BAR_Z),
      ...(this.wedges.corners ?? {}),
    };
    if (this.parts.compare != null && this.otherEnds) { const o = this.otherEnds; Object.assign(out, { other_tip: o.tip, other_base: o.base, other_rim: o.rim }); }
    return out;
  }

  drawHighlight() {
    const hl = this.hl, sc = this.sc;
    if (!hl || this.time > hl.until) { if (this.hlShown) { this.glowLine.setLines([]); this.hlShown = false; } return; }
    const { tip, base, rimR } = this.ends, L = this.sheet, wide = 1.6 + 0.8 * Math.sin(this.time * 7);
    const paths = {
      arc: [L.border('u1')], rim: [L.border('u1')], slant: [L.border('v0'), L.border('v1')],
      height: [[tip, base]], radius: [[base, rimR]], triangle: [[tip, base], [base, rimR], [rimR, tip]],
      tip: [[tip.clone().add(V(-5, 0, 0)), tip.clone().add(V(5, 0, 0))], [tip.clone().add(V(0, -5, 0)), tip.clone().add(V(0, 5, 0))]],
    }[hl.part];
    this.glowLine.setLines(paths.map((points) => ({ points, width: wide, taper: false, sched: sc })));
    this.hlShown = true;
  }

  get settled() { return ['fold', 'cut', 'angle', 'R', 'brk'].every((k) => Math.abs(this.goal[k] - this.v[k]) < 1e-3); }

  update(dt, cam) {
    const { pop, v, goal, view } = this;
    const r = this.stage.renderer.getDrawingBufferSize(new THREE.Vector2());
    pop.setResolution(r.x, r.y);
    pop.update(dt, this.stage.scene);
    const lift = pop.u.uLiftAll.value;
    this.time += dt;
    const k = 1 - Math.exp(-dt * this.ease);
    let moved = false;
    for (const key of Object.keys(v)) {
      const gap = goal[key] - v[key];
      if (Math.abs(gap) < 1e-3) { if (gap) { v[key] = goal[key]; moved = true; } continue; }
      v[key] += gap * k; moved = true;
    }
    if (this.wantBreak && v.fold < 0.02) { this.wantBreak = false; goal.brk = 1; this.ease = 0.9; }
    if (moved || this.needsPlace) { this.needsPlace = false; this.placeAll(); }
    this.drawHighlight();
    for (const o of this.lifters) o.update(cam, lift);
    for (const o of this.tickers) o.update(dt, cam, this.time);
    view.yaw += (view.goalYaw - view.yaw) * 0.08;
    view.pitch += (view.goalPitch - view.pitch) * 0.08;
    const dist = 430, look = new THREE.Vector3(0, 26, 10);
    const pos = look.clone().add(new THREE.Vector3(Math.sin(view.yaw) * Math.cos(view.pitch), Math.sin(view.pitch), Math.cos(view.yaw) * Math.cos(view.pitch)).multiplyScalar(dist));
    this.stage.setView(pos, look, 30);
  }

  describe() {
    const { v, parts } = this, c = cone(v.R, v.angle);
    return `Card radius R=${v.R} cm, sector angle=${Math.round(v.angle)}°, folded ${Math.round(v.fold * 100)}%, `
      + `cone ${v.cut > 0.5 ? 'cut open to show its right triangle' : 'whole'}, whole-circle dashes ${parts.circle ? 'on' : 'off'}, `
      + `length bars ${parts.bars ? 'on' : 'off'}, ${v.brk > 0.5 ? `card broken into ${parts.pieces} wedges and rearranged into a row` : 'card in one piece'}, `
      + `${parts.compare != null ? `second cone of ${parts.compare}° beside it, ` : ''}${parts.cylinder ? 'cylinder outline on, ' : ''}. True values when fully folded: l=${fix(c.l)}, r=${fix(c.r)}, h=${fix(c.h)}, volume=${fix(c.volume, 1)} cm³.`;
  }
}

/** The one control surface: buttons, steps and the tutor all call these, and get back a sentence. */
export function commandsFor(scene) {
  const num = (x, a, b) => Math.min(b, Math.max(a, Number(x)));
  const slow = (seconds) => { scene.ease = seconds ? 3.5 / Math.max(0.3, Number(seconds)) : SOFT; };
  return {
    set_fold({ value, seconds }) { slow(seconds); scene.goal.fold = num(value, 0, 1); return `Folding to ${Math.round(scene.goal.fold * 100)}%.`; },
    set_angle({ degrees, seconds }) { slow(seconds); scene.goal.angle = num(degrees, 60, 330); return `Sector angle going to ${scene.goal.angle}°.`; },
    set_card_radius({ cm, seconds }) { slow(seconds); scene.goal.R = num(cm, 6, 14); return `Card radius going to ${scene.goal.R} cm.`; },
    cut_open({ open = true }) { scene.parts.triangle = open ? 1 : 0; scene.goal.cut = open ? 1 : 0; scene.needsPlace = true; return open ? 'Cone cut open: the right triangle of l, r and h is showing.' : 'Cone closed again.'; },
    show_length_bars({ show = true }) { scene.parts.bars = show ? 1 : 0; scene.needsPlace = true; return show ? 'Bars show the whole circle and the arc to scale.' : 'Bars hidden.'; },
    highlight({ part, seconds = 4 }) {
      if (!['arc', 'rim', 'slant', 'height', 'radius', 'triangle', 'tip'].includes(part)) return `No part called ${part}. Use arc, rim, slant, height, radius, triangle or tip.`;
      scene.hl = { part, until: scene.time + num(seconds, 1, 12) }; return `The ${part} is glowing.`;
    },
    look_from({ view }) {
      const w = VIEWS[view]; if (!w) return `No view called ${view}. Use ${Object.keys(VIEWS).join(', ')}.`;
      scene.view.goalYaw = w.yaw; scene.view.goalPitch = w.pitch; return `Looking from ${view}.`;
    },
    break_into_pieces({ pieces = 12 } = {}) {
      scene.parts.pieces = Math.round(num(pieces, 4, 16) / 2) * 2;
      scene.goal.cut = 0; scene.parts.triangle = 0; scene.goal.fold = 0; scene.wantBreak = true; scene.needsPlace = true;
      return `Unfolding, then breaking the card into ${scene.parts.pieces} wedges and laying them in a row. More pieces makes straighter edges. The row is πr long and l tall.`;
    },
    put_back_together() { scene.wantBreak = false; scene.ease = 1.2; scene.goal.brk = 0; return 'The wedges are going back into one card.'; },
    compare_with({ degrees }) { scene.parts.compare = num(degrees, 60, 330); scene.needsPlace = true; const a = cone(scene.goal.R, scene.goal.angle), b = cone(scene.goal.R, scene.parts.compare); return `Second cone of ${scene.parts.compare}° is beside the first. Main cone: r=${fix(a.r)}, h=${fix(a.h)}, volume=${fix(a.volume, 0)}. Second: r=${fix(b.r)}, h=${fix(b.h)}, volume=${fix(b.volume, 0)}. Anchors other_tip, other_base and other_rim now exist.`; },
    stop_compare() { scene.parts.compare = null; scene.needsPlace = true; return 'Second cone removed.'; },
    show_cylinder({ show = true }) { scene.parts.cylinder = show ? 1 : 0; scene.needsPlace = true; return show ? 'A green cylinder with the same r and h now surrounds the cone. It holds exactly three of these cones.' : 'Cylinder hidden.'; },
    get_state() { return scene.describe(); },
  };
}

export const TOOLS = [
  { name: 'set_fold', description: 'Fold the card: 0 is flat, 1 is a closed cone. Use a few seconds so the student can watch.', parameters: { type: 'OBJECT', properties: { value: { type: 'NUMBER' }, seconds: { type: 'NUMBER' } }, required: ['value'] } },
  { name: 'set_angle', description: 'Change the sector angle, 60 to 330 degrees. The cone updates live.', parameters: { type: 'OBJECT', properties: { degrees: { type: 'NUMBER' }, seconds: { type: 'NUMBER' } }, required: ['degrees'] } },
  { name: 'set_card_radius', description: 'Change the card radius R, 6 to 14 cm.', parameters: { type: 'OBJECT', properties: { cm: { type: 'NUMBER' }, seconds: { type: 'NUMBER' } }, required: ['cm'] } },
  { name: 'cut_open', description: 'Slice the folded cone down the middle to show the right triangle of slant l, radius r and height h, or close it.', parameters: { type: 'OBJECT', properties: { open: { type: 'BOOLEAN' } }, required: ['open'] } },
  { name: 'show_length_bars', description: 'Show or hide two to-scale bars: the whole circle 2πR and the arc. Best with the card flat.', parameters: { type: 'OBJECT', properties: { show: { type: 'BOOLEAN' } }, required: ['show'] } },
  { name: 'highlight', description: 'Make one part glow for a few seconds.', parameters: { type: 'OBJECT', properties: { part: { type: 'STRING', enum: ['arc', 'rim', 'slant', 'height', 'radius', 'triangle', 'tip'] }, seconds: { type: 'NUMBER' } }, required: ['part'] } },
  { name: 'look_from', description: 'Move the camera.', parameters: { type: 'OBJECT', properties: { view: { type: 'STRING', enum: ['angle', 'front', 'above', 'side'] } }, required: ['view'] } },
  { name: 'break_into_pieces', description: 'Break the card into thin wedges and rearrange them into a row that is almost a rectangle, πr long and l tall. This is how to show why the curved area is πrl. It unfolds the card first.', parameters: { type: 'OBJECT', properties: { pieces: { type: 'NUMBER', description: 'An even number from 4 to 16' } } } },
  { name: 'put_back_together', description: 'Join the wedges back into one card.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'compare_with', description: 'Put a second cone with a different sector angle beside the main one, so differences can be pointed at. Same card radius.', parameters: { type: 'OBJECT', properties: { degrees: { type: 'NUMBER' } }, required: ['degrees'] } },
  { name: 'stop_compare', description: 'Remove the second cone.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'show_cylinder', description: 'Draw a green cylinder of the same r and h around the cone, to show why volume has the 1/3.', parameters: { type: 'OBJECT', properties: { show: { type: 'BOOLEAN' } }, required: ['show'] } },
  { name: 'get_state', description: 'Read what the student sees now.', parameters: { type: 'OBJECT', properties: {} } },
];
