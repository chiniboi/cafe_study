import * as THREE from 'three';
import { eyeIn, printDirIn } from '../ink/shapes.js';
import { V } from '../ink/kit.js';

// A paper surface that can change shape every frame: a grid of (nu × nv) quads whose
// positions come from fn(u, v, out). Its ink outline (silhouette plus chosen edges) is
// recomputed from the view, the same way InkLathe does for fixed solids.

export class FlexSheet {
  /** closedU: the last column joins the first (a wall all the way around).
   *  edges: which borders to ink, any of 'u0', 'u1', 'v0', 'v1'. */
  constructor(lesson, nu, nv, { mat, closedU = false, edges = [], width = 1.1, parent } = {}) {
    Object.assign(this, { lesson, nu, nv, closedU, edges, width });
    const pop = lesson.pop, n = (nu + 1) * (nv + 1), idx = [];
    this.pos = new Float32Array(n * 3);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = this.at(i, j), b = this.at(i + 1, j), c = this.at(i, j + 1), d = this.at(i + 1, j + 1);
      idx.push(a, b, d, a, d, c);
    }
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(idx);
    mat.side = THREE.DoubleSide;
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    pop.addSurface(this.mesh, parent);
    this.outline = lesson.dyn(undefined, 1.6, 1600);
    this.sched = lesson.pen.next(120);
    lesson.lifters.push(this);
  }

  at(i, j) { return j * (this.nu + 1) + i; }
  p(i, j) { const k = this.at(i, j) * 3; return V(this.pos[k], this.pos[k + 1], this.pos[k + 2]); }

  /** Rewrite every vertex. fn sets out.x, out.y, out.z for u and v in 0..1. */
  shape(fn) {
    const o = { x: 0, y: 0, z: 0 };
    for (let j = 0; j <= this.nv; j++) for (let i = 0; i <= this.nu; i++) {
      fn(i / this.nu, j / this.nv, o);
      const k = this.at(i, j) * 3;
      this.pos[k] = o.x; this.pos[k + 1] = o.y; this.pos[k + 2] = o.z;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
    this.dirty = true;
  }

  /** +1 / -1 for which way quad (i, j) faces; 0 for a collapsed quad. */
  face(i, j, eye, dir) {
    const a = this.p(i, j), b = this.p(i + 1, j), c = this.p(i, j + 1), d = this.p(i + 1, j + 1);
    const n = b.clone().sub(a).cross(c.clone().sub(a));
    if (n.lengthSq() < 1e-8) n.copy(d.clone().sub(b).cross(d.clone().sub(c)));
    if (n.lengthSq() < 1e-8) return 0;
    const view = eye ? eye.clone().sub(a) : dir.clone().negate();
    return Math.sign(n.dot(view));
  }

  /** Polylines along the fold between faces that point opposite ways. */
  silhouette(eye, dir) {
    const { nu, nv, closedU } = this, f = new Int8Array(nu * nv), links = new Map();
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) f[j * nu + i] = this.face(i, j, eye, dir);
    const link = (a, b) => {
      if (!links.has(a)) links.set(a, []);
      if (!links.has(b)) links.set(b, []);
      links.get(a).push(b); links.get(b).push(a);
    };
    const key = (i, j) => this.at(closedU && i === nu ? 0 : i, j);
    for (let j = 0; j < nv; j++) for (let i = 0; i < (closedU ? nu : nu - 1); i++) {
      const a = f[j * nu + i], b = f[j * nu + (i + 1) % nu];
      if (a && b && a !== b) link(key(i + 1, j), key(i + 1, j + 1));
    }
    for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu; i++) {
      const a = f[j * nu + i], b = f[(j + 1) * nu + i];
      if (a && b && a !== b) link(key(i, j + 1), key(i + 1, j + 1));
    }
    const seen = new Set(), out = [];
    const walk = (start) => {
      const chain = [start];
      let cur = start;
      for (;;) {
        const next = (links.get(cur) ?? []).find((n) => !seen.has(`${Math.min(cur, n)}:${Math.max(cur, n)}`));
        if (next === undefined) break;
        seen.add(`${Math.min(cur, next)}:${Math.max(cur, next)}`);
        chain.push(next); cur = next;
      }
      if (chain.length > 1) out.push(chain.map((k) => V(this.pos[k * 3], this.pos[k * 3 + 1], this.pos[k * 3 + 2])));
    };
    for (const [k, list] of links) if (list.length === 1) walk(k);
    for (const k of links.keys()) walk(k);
    return out;
  }

  border(side) {
    const out = [], { nu, nv } = this;
    if (side[0] === 'v') for (let i = 0; i <= nu; i++) out.push(this.p(i, side[1] === '1' ? nv : 0));
    else for (let j = 0; j <= nv; j++) out.push(this.p(side[1] === '1' ? nu : 0, j));
    return out;
  }

  update(camera, lift = 1) {
    const pop = this.lesson.pop, group = pop.group;
    const eye = eyeIn(group, camera);
    if (!this.dirty && this.lastEye?.distanceToSquared(eye) < 0.25) return;
    this.dirty = false;
    this.lastEye = eye.clone();
    const dir = printDirIn(pop.u.uCab.value, pop.u.uScene.value, group);
    const borders = this.edges.map((e) => this.border(e));
    const mk = (list) => list.map((points, i) => ({ points, sched: this.sched, width: this.width, taper: false, seed: 300 + i }));
    const flat = [...borders, ...this.silhouette(null, dir)];
    this.outline.setLines(mk(lift < 0.001 ? flat : [...borders, ...this.silhouette(eye, null)]), mk(flat));
  }
}
