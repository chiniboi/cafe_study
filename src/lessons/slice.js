import { DioramaLesson } from './diorama.js';
import { V, RED, ORANGE, KINETIC, dashes, makeTag } from '../ink/kit.js';
import { FlexSheet } from './flexsheet.js';

// Lesson 3 · Slice a cone. Drag the lower piece to move the cut, drag the tip to lift it off.
// The tip is a smaller copy of the whole cone, so its share of the volume is the cube of h/H.

const Y0 = 5, S = 6, H_CM = 8, R_CM = 4;
const H = H_CM * S, R = R_CM * S, CX = 0, CZ = -46, LIFT = 30;

/** The tip's share of the whole cone's volume, for a cut at height fraction k */
export const tipShare = (k) => k ** 3;

export class SliceLesson extends DioramaLesson {
  exhibitDefs() { return [{ name: '', rect: [-30, 86, -72, -18], scale: 1.36 }]; }

  build() {
    const { pop, pen, ink } = this;
    const cool = pop.paper({ hatchA: [0, 1, 0.2], hatchB: [1, 0.2, 0.3], spacing: 1.2, seed: 41, color: '#e9eef6' });
    const warm = pop.paper({ hatchA: [0, 1, 0.2], hatchB: [1, 0.2, 0.3], spacing: 1.1, seed: 42, color: '#f6e9e4' });
    const cutCol = '#f9d9ad';
    const face = () => pop.paper({ hatch: 0.25, spacing: 1.6, seed: 43, color: cutCol });
    this.frustum = new FlexSheet(this, 64, 5, { mat: cool, closedU: true, edges: ['v0'] });
    this.frustumCap = new FlexSheet(this, 48, 2, { mat: face(), closedU: true });
    this.tip = new FlexSheet(this, 64, 6, { mat: warm, closedU: true });
    this.tipCap = new FlexSheet(this, 48, 2, { mat: face(), closedU: true });
    this.rings = this.dyn(ORANGE, 2.1, 500);
    this.guide = this.dyn(RED, 1.3, 200);
    this.sc = pen.next(60);
    ink.add([V(CX - 2, Y0 + 0.2, CZ), V(CX + 2, Y0 + 0.2, CZ)], { sched: pen.next(4), width: 0.6, taper: false });
    [this.cupT, this.cupF] = this.rack({ cx: 60, z: -58, legH: 9, r: 5.5, h: 14, items: [
      { color: ORANGE, label: 'Tip', unit: '%', capacity: 100, digits: 1 },
      { color: KINETIC, label: 'Frustum', unit: '%', capacity: 100, digits: 1 },
    ] });
    this.tag = makeTag(pop, 28, 9);
    this.tag.mesh.position.set(60, Y0 + 9, -26);
    this.drawTime = 3.2;
  }

  reset() {
    this.cutAt = 0.7; this.lift = 0; this.goal = 0;
    this.placeAll();
  }

  placeAll() {
    const k = this.cutAt, cut = H * (1 - k), rc = R * k, up = this.lift * LIFT;
    const ring = (rad, y) => (a, o) => { o.x = CX + rad * Math.cos(a); o.y = Y0 + y; o.z = CZ + rad * Math.sin(a); };
    this.frustum.shape((u, v, o) => { const y = v * cut; ring(R * (1 - y / H), y)(u * Math.PI * 2, o); });
    this.tip.shape((u, v, o) => { const y = cut + v * (H - cut); ring(Math.max(R * (1 - y / H), 1e-3), y + up)(u * Math.PI * 2, o); });
    this.frustumCap.shape((u, v, o) => ring(rc * v, cut)(u * Math.PI * 2, o));
    this.tipCap.shape((u, v, o) => ring(rc * v, cut + up + 0.05)(u * Math.PI * 2, o));
    const circle = (y) => Array.from({ length: 73 }, (_, i) => { const o = {}; ring(rc, y)((i / 72) * Math.PI * 2, o); return V(o.x, o.y, o.z); });
    this.rings.setLines([cut, cut + up + 0.05].map((y) => ({ points: circle(y), width: 1.1, taper: false, sched: this.sc })));
    const ax = CX + R + 6, g = [];
    for (const d of dashes([V(ax, Y0, CZ), V(ax, Y0 + cut, CZ)], 2, 1.5)) g.push({ points: d, width: 0.8, taper: false, sched: this.sc });
    this.guide.setLines(g);

    const tipPct = tipShare(k) * 100;
    this.cupT.setValue(tipPct);
    this.cupF.setValue(100 - tipPct);
    this.tag.set('Cut height', `h/H = ${k.toFixed(2)}`);
    this.setNumbers([
      `h/H = ${k.toFixed(2)}`,
      `tip = ${k.toFixed(2)}³ = ${tipPct.toFixed(1)}%`,
      `frustum = ${(100 - tipPct).toFixed(1)}%`,
    ]);
  }

  tick(dt) {
    if (Math.abs(this.goal - this.lift) > 1e-4) this.lift += (this.goal - this.lift) * Math.min(1, dt * 4);
    if (this.lift > 0.9 && Math.abs(this.cutAt - 0.5) < 1e-6 && !this.auto) this.earnStamp();
    this.placeAll();
  }

  handles() {
    return [{
      object: this.tip.mesh, cursor: 'grab',
      onDown: () => { this.moved = false; this.auto = false; },
      onMove: (ray) => {
        const p = this.rayToPlane(ray, V(CX, 0, CZ), V(0, 0, 1));
        if (!p) return;
        this.moved = true;
        const g = (p.y - Y0 - H * (1 - this.cutAt) - (H * this.cutAt) / 3) / LIFT;
        this.goal = Math.max(0, Math.min(1, g));
      },
      onUp: () => { if (!this.moved) this.goal = this.goal > 0.5 ? 0 : 1; },
    }, {
      object: this.frustum.mesh, cursor: 'grab',
      onDown: () => { this.auto = false; },
      onMove: (ray) => {
        const p = this.rayToPlane(ray, V(CX, 0, CZ), V(0, 0, 1));
        if (!p) return;
        const k = 1 - (p.y - Y0) / H;
        this.cutAt = Math.round(Math.max(0.2, Math.min(0.8, k)) * 20) / 20;
      },
      onUp: () => this.app.sound?.play('tick'),
    }];
  }

  shots() {
    const look = (off) => () => this.near(CX, Y0 + 28, CZ, off);
    return [
      { cam: look(V(-20, 130, 250)), act: () => { this.auto = true; this.reset(); this.cutAt = 0.5; this.placeAll(); } },
      { cam: look(V(-20, 130, 250)), act: () => { this.goal = 1; } },
      { cam: look(V(20, 120, 230)), act: () => { this.goal = 1; } },
      { cam: look(V(30, 110, 250)), act: () => { this.goal = 1; } },
      { cam: null },
    ];
  }
}
