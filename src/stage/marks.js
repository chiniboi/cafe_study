import * as THREE from 'three';

// The teacher's pen: arrows, measured lengths and handwritten notes drawn over the 3D model.
// Each mark names anchors on the model, so it follows the model as it folds, breaks or turns.

const NS = 'http://www.w3.org/2000/svg';
export const COLORS = { orange: '#c9610a', blue: '#2a5db0', green: '#2f8f5b', red: '#b8412e', ink: '#1f2937' };

const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export class Marks {
  constructor(host, camera, anchors) {
    Object.assign(this, { host, camera, anchors, list: [] });
    this.svg = el('svg', { class: 'marks' });
    host.append(this.svg);
    this.v = new THREE.Vector3();
  }

  screen(p) {
    const r = this.host.getBoundingClientRect();
    this.v.copy(p).project(this.camera);
    return [(this.v.x + 1) / 2 * r.width, (1 - this.v.y) / 2 * r.height];
  }

  add(kind, spec) {
    const color = COLORS[spec.color] ?? COLORS.ink;
    const g = el('g');
    const path = el('path', { fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const text = el('text', { fill: color, 'text-anchor': 'middle' });
    text.textContent = spec.text ?? '';
    g.append(path, text);
    this.svg.append(g);
    const m = { kind, ...spec, g, path, text, slot: this.list.length };
    this.list.push(m);
    return m;
  }

  clear() { for (const m of this.list) m.g.remove(); this.list = []; }

  update() {
    const a = this.anchors(), r = this.host.getBoundingClientRect();
    if (!a.centre) return;
    const c = this.screen(a.centre);
    for (const m of this.list) {
      if (m.kind === 'point') {
        if (!a[m.target]) continue;
        const t = this.screen(a[m.target]);
        let dx = t[0] - c[0], dy = t[1] - c[1] - 40;
        const n = Math.hypot(dx, dy) || 1, len = 92 + (m.slot % 3) * 26;
        const lx = Math.min(r.width - 70, Math.max(70, t[0] + (dx / n) * len)), ly = Math.min(r.height - 22, Math.max(26, t[1] + (dy / n) * len));
        const mx = (lx + t[0]) / 2 + (dy / n) * 16, my = (ly + t[1]) / 2 - (dx / n) * 16;
        const ang = Math.atan2(t[1] - my, t[0] - mx), h = 11;
        m.path.setAttribute('d', `M${lx} ${ly + (ly > t[1] ? -10 : 8)} Q${mx} ${my} ${t[0]} ${t[1]}`
          + ` M${t[0] - h * Math.cos(ang - 0.45)} ${t[1] - h * Math.sin(ang - 0.45)} L${t[0]} ${t[1]} L${t[0] - h * Math.cos(ang + 0.45)} ${t[1] - h * Math.sin(ang + 0.45)}`);
        m.text.setAttribute('x', lx); m.text.setAttribute('y', ly + (ly > t[1] ? 8 : -2));
      } else {
        if (!a[m.from] || !a[m.to]) continue;
        const p = this.screen(a[m.from]), q = this.screen(a[m.to]);
        const dx = q[0] - p[0], dy = q[1] - p[1], n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n, off = m.offset ?? 16, t = 7;
        const A = [p[0] + nx * off, p[1] + ny * off], B = [q[0] + nx * off, q[1] + ny * off];
        m.path.setAttribute('d', `M${A[0]} ${A[1]} L${B[0]} ${B[1]} M${A[0] - nx * t} ${A[1] - ny * t} L${A[0] + nx * t} ${A[1] + ny * t} M${B[0] - nx * t} ${B[1] - ny * t} L${B[0] + nx * t} ${B[1] + ny * t}`);
        m.text.setAttribute('x', (A[0] + B[0]) / 2 + nx * 18); m.text.setAttribute('y', (A[1] + B[1]) / 2 + ny * 18 + 6);
      }
    }
  }
}
