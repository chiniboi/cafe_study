import { DioramaLesson } from './diorama.js';
import { V, RED, BLUE, ORANGE, KINETIC, dashes, ringXZ, makeTag } from '../ink/kit.js';
import { FlexSheet } from './flexsheet.js';

// Lesson 2 · Fold a sector. A card sector closes into a cone. Every stage is a true cone of slant R,
// so the paper never stretches: only the angle around the tip changes.

const Y0 = 5, S = 3.4, R_CM = 10;
const R = R_CM * S, CX = 0, CZ = -48, LIFT = 0.7;
const ANGLES = [120, 180, 216, 270];

/** Rim radius and height at fold e, for a sector of angle deg. e = 0 flat, e = 1 closed. */
export const coneAt = (deg, e, rCm = R_CM) => {
  const sinB = 1 + (deg / 360 - 1) * e;
  return { sinB, cosB: Math.sqrt(Math.max(0, 1 - sinB * sinB)), r: rCm * sinB, h: rCm * Math.sqrt(Math.max(0, 1 - sinB * sinB)) };
};

export class FoldLesson extends DioramaLesson {
  exhibitDefs() { return [{ name: '', rect: [-40, 88, -84, -12], scale: 1.15 }]; }

  build() {
    const { pop, pen, faint } = this;
    this.state.switches.angle ??= 1;
    const card = pop.paper({ hatchA: [1, 0.1, 0.2], hatchB: [0.2, 0.3, 1], spacing: 1.5, hatch: 0.75, seed: 31, color: '#f7e7cf' });
    for (const d of dashes(ringXZ(V(CX, Y0 + 0.15, CZ), R, 96), 2.4, 2)) faint.add(d, { sched: pen.next(3), width: 0.7, taper: false });
    this.sheet = new FlexSheet(this, 14, 96, { mat: card });
    this.arc = this.dyn(ORANGE, 2.1, 500);
    this.slant = this.dyn(BLUE, 2, 300);
    this.guides = this.dyn(RED, 1.3, 300);
    this.sc = pen.next(70);
    [this.cupR, this.cupH] = this.rack({ cx: 66, z: -60, legH: 9, r: 5.5, h: 14, items: [
      { color: ORANGE, label: 'Radius r', unit: 'cm', capacity: 10, digits: 1 },
      { color: KINETIC, label: 'Height h', unit: 'cm', capacity: 10, digits: 1 },
    ] });
    this.tag = makeTag(pop, 28, 9);
    this.tag.mesh.position.set(66, Y0 + 9, -26);
    this.drawTime = 3.2;
  }

  get deg() { return ANGLES[this.state.switches.angle ?? 1]; }

  reset() {
    this.e = 0; this.goal = 0;
    this.placeAll();
  }

  placeAll() {
    const frac = this.deg / 360, span = 2 * Math.PI * frac, c = coneAt(this.deg, this.e), s = c.sinB, top = Y0 + LIFT;
    this.sheet.shape((u, v, o) => {
      const rho = u * R, ph = ((v - 0.5) * span) / s + Math.PI / 2;
      o.x = CX + rho * s * Math.cos(ph);
      o.z = CZ + rho * s * Math.sin(ph);
      o.y = top + (R - rho) * c.cosB;
    });
    const L = this.sheet, tip = V(CX, top + R * c.cosB, CZ), base = V(CX, Y0 + 0.4, CZ);
    this.arc.setLines([{ points: L.border('u1'), width: 1.15, taper: false, sched: this.sc }]);
    this.slant.setLines(['v0', 'v1'].map((b) => ({ points: L.border(b), width: 1.05, taper: false, sched: this.sc })));
    const g = [];
    if (this.e > 0.05) {
      for (const d of dashes([tip, base], 2, 1.5)) g.push({ points: d, width: 0.8, taper: false, sched: this.sc });
      for (const d of dashes([base, V(CX + R * s, Y0 + 0.4, CZ)], 2, 1.5)) g.push({ points: d, width: 0.8, taper: false, sched: this.sc });
    }
    this.guides.setLines(g);
    this.cupR.setValue(c.r);
    this.cupH.setValue(c.h);
    this.tag.set('Sector angle', `θ = ${this.deg}°`);
    const closed = this.e > 0.995, exact = coneAt(this.deg, 1);
    this.setNumbers([
      `slant l = R = ${R_CM} cm`,
      `θ = ${this.deg}°`,
      ...(closed ? [
        `r = ${R_CM} × ${this.deg}/360 = ${exact.r.toFixed(2).replace(/\.?0+$/, '')} cm`,
        `h = √(${R_CM}² − r²) = ${exact.h.toFixed(2).replace(/\.?0+$/, '')} cm`,
      ] : [`rim radius now = ${c.r.toFixed(1)} cm`]),
    ]);
  }

  tick(dt) {
    if (Math.abs(this.goal - this.e) > 1e-4) {
      this.e += (this.goal - this.e) * Math.min(1, dt * 2.8);
      if (Math.abs(this.goal - this.e) < 0.003) {
        this.e = this.goal;
        if (this.e === 1) { this.app.sound?.play('tick'); if (this.deg === 216 && !this.auto) this.earnStamp(); }
      }
    }
    this.placeAll();
  }

  onSwitch(id) { if (id === 'angle') this.reset(); else super.onSwitch(id); }

  handles() {
    return [{
      object: this.sheet.mesh, cursor: 'grab',
      onDown: () => { this.moved = false; this.auto = false; },
      onMove: (ray) => {
        const p = this.rayToPlane(ray, V(CX, 0, CZ), V(0, 0, 1));
        if (!p) return;
        this.moved = true;
        const g = (p.y - Y0) / (coneAt(this.deg, 1).h * S);
        this.goal = g > 0.95 ? 1 : Math.max(0, Math.min(1, g));
      },
      onUp: () => { if (!this.moved) this.goal = this.goal > 0.5 ? 0 : 1; },
    }];
  }

  shots() {
    const look = (off) => () => this.near(CX, Y0 + 10, CZ, off);
    const angle = (i) => { this.auto = true; this.state.switches.angle = i; this.book.pages.invalidate(this.k, 'right'); this.reset(); };
    return [
      { cam: look(V(-10, 190, 190)), act: () => angle(2) },
      { cam: look(V(-10, 190, 190)), act: () => { this.goal = 0.45; } },
      { cam: look(V(20, 120, 220)), act: () => { this.goal = 1; } },
      { cam: look(V(30, 80, 220)), act: () => { this.goal = 1; } },
      { cam: null },
    ];
  }
}
