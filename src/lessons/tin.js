import { DioramaLesson } from './diorama.js';
import { InkLathe } from '../ink/shapes.js';
import { V, ORANGE, KINETIC, makeTag } from '../ink/kit.js';
import { FlexSheet } from './flexsheet.js';

// Lesson 1 · The label on a tin. A paper label flattens off a real tin: the rim straightens
// into the label's long edge. The dial shows the width across, from the diameter up to 2πr.

const Y0 = 5, S = 3.2;           // board top; millimetres per centimetre
const H_CM = 10, PI = 22 / 7;
const RADII = [3.5, 5, 7];
const CZ_FRONT = -22;            // the line where the label touches the tin, and stays
const X = 0;

/** Width across at unroll e (0 wrapped, 1 flat), in units of r: the model, separate from the picture */
export const spanOverR = (e) => {
  const k = Math.max(1 - e, 1e-4), half = Math.PI * k;
  return half > Math.PI / 2 ? 2 / k : (2 / k) * Math.sin(half);
};

export class TinLesson extends DioramaLesson {
  exhibitDefs() { return RADII.map((r) => ({ name: `${r} cm`, rect: [-72, 80, -74, -14], scale: 1.18 })); }

  build(ex) {
    const { pop, pen, ink, faint } = this, rc = RADII[ex], r = rc * S, h = H_CM * S, cz = CZ_FRONT - r;
    const metal = pop.paper({ hatchA: [0, 1, 0.2], hatchB: [1, 0.2, 0.3], spacing: 1.3, seed: 13 + ex, color: '#eceef0' });
    const card = pop.paper({ hatchA: [1, 0.1, 0.1], hatchB: [0.15, 1, 0.2], spacing: 1.9, hatch: 0.32, seed: 21 + ex, color: '#f7e7cf' });

    const tin = new InkLathe(pop, [[0, 0], [r, 0], [r, h], [0, h]], { mat: metal, pen, rims: [1, 2], width: 1.05 });
    tin.group.position.set(X, Y0, cz);
    this.lifters.push(tin);
    this.deferred.push(() => tin.build());

    const label = new FlexSheet(this, 96, 4, { mat: card, edges: ['v1', 'u0', 'u1'] });
    const rig = { rc, r, h, cz, tin, label, rim: this.dyn(ORANGE, 2.1, 500), bands: this.dyn(undefined, 1, 500), schedRim: pen.next(70) };
    (this.rigs ??= [])[ex] = rig;

    // A ruler on the board in front, marked every 10 cm, so the flat label can be read
    const yR = Y0 + 0.2, zR = CZ_FRONT + 3.5, half = 25 * S;
    ink.add([V(X - half, yR, zR), V(X + half, yR, zR)], { sched: pen.next(150), width: 0.8, taper: false });
    for (let c = -20; c <= 20; c += 10) {
      faint.add([V(X + c * S, yR, zR), V(X + c * S, yR, zR + 3)], { sched: pen.next(3), width: 0.7, taper: false });
    }

    [rig.cupW, rig.cupA] = this.rack({ cx: 56, z: -62, legH: 9, r: 5.5, h: 14, items: [
      { color: ORANGE, label: 'Width', unit: 'cm', capacity: 50, digits: 1 },
      { color: KINETIC, label: 'Area', unit: 'cm²', capacity: 500, digits: 0 },
    ] });
    rig.tag = makeTag(pop, 30, 9);
    rig.tag.mesh.position.set(-52, Y0 + 15, -62);
    this.drawTime = 3.4;
  }

  get rig() { return this.rigs[this.ex]; }

  reset() {
    this.e = 0; this.goal = 0;
    this.placeAll();
  }

  placeAll() {
    const rig = this.rig, { r, h, cz, rc } = rig, rl = r + 0.4, e = this.e;
    const rho = rl / Math.max(1 - e, 1e-4), front = cz + rl, y0 = Y0 + 2.5, hh = h - 5;
    rig.label.shape((u, v, o) => {
      const s = (u - 0.5) * 2 * Math.PI * rl, th = s / rho;
      o.x = X + rho * Math.sin(th);
      o.z = front - rho + rho * Math.cos(th);
      o.y = y0 + v * hh;
    });
    const L = rig.label;
    rig.rim.setLines([{ points: L.border('v0'), width: 1.5, taper: false, sched: rig.schedRim }]);
    const band = (j) => Array.from({ length: L.nu + 1 }, (_, i) => L.p(i, j));
    rig.bands.setLines([1, 3].map((j) => ({ points: band(j), width: 0.7, taper: false, sched: rig.schedRim })));

    const rim = 2 * PI * rc, width = e > 0.995 ? rim : rim * spanOverR(e) / (2 * Math.PI);
    rig.cupW.setValue(width);
    rig.cupA.setValue(width * H_CM);
    rig.tag.set('This tin', `r = ${rc}, h = ${H_CM} cm`);
    const flat = e > 0.995;
    this.setNumbers([
      `r = ${rc} cm, h = ${H_CM} cm`,
      `across the tin = 2r = ${2 * rc} cm`,
      `width now = ${width.toFixed(1)} cm`,
      ...(flat ? [`2πr = 2 × 22/7 × ${rc} = ${rim.toFixed(1)} cm`, `CSA = 2πrh = ${(rim * H_CM).toFixed(0)} cm²`] : []),
    ]);
  }

  tick(dt) {
    if (Math.abs(this.goal - this.e) > 1e-4) {
      this.e += (this.goal - this.e) * Math.min(1, dt * 3.2);
      if (Math.abs(this.goal - this.e) < 0.003) {
        this.e = this.goal;
        if (this.e === 1) { this.app.sound?.play('tick'); if (this.ex === 2 && !this.auto) this.earnStamp(); }
      }
    }
    this.placeAll();
  }

  toggle() { this.goal = this.goal > 0.5 ? 0 : 1; }

  handles() {
    return this.rigs.flatMap((rig) => [{
      object: rig.label.mesh, cursor: 'grab',
      onDown: () => { this.moved = false; this.auto = false; },
      onMove: (ray) => {
        const p = this.rayToPlane(ray, V(0, 0, CZ_FRONT), V(0, 0, 1));
        if (!p) return;
        this.moved = true;
        const g = (Math.abs(p.x - X) - rig.r) / (Math.PI * rig.r - rig.r);
        this.goal = g > 0.96 ? 1 : Math.max(0, Math.min(1, g));
      },
      onUp: () => { if (!this.moved) this.toggle(); },
    }, { object: rig.tin.mesh, cursor: 'pointer', onDown: () => { this.auto = false; }, onUp: () => this.toggle() }]);
  }

  shots() {
    const look = (off) => () => this.near(X, Y0 + 12, CZ_FRONT - 16, off);
    return [
      { cam: look(V(-20, 150, 240)), act: () => { this.auto = true; this.switchExhibit(2, true); this.reset(); } },
      { cam: look(V(10, 130, 220)), act: () => { this.goal = 0.5; } },
      { cam: look(V(0, 150, 260)), act: () => { this.goal = 1; } },
      { cam: () => this.near(X, Y0 + 4, CZ_FRONT, V(0, 120, 230)), act: () => { this.goal = 1; } },
      { cam: null },
    ];
  }
}
