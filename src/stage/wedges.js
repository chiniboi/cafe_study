import { V } from '../ink/kit.js';
import { FlexSheet } from '../lessons/flexsheet.js';

// "Break it": the flat card splits into thin wedges that fly into a row, alternating point-up
// and point-down, until they make an almost-rectangle: base πr, height l, so area πrl.

const MAX = 16;
const clamp = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => x * x * (3 - 2 * x);

export class WedgeSet {
  constructor(scene) {
    const { pop } = scene;
    const warm = pop.paper({ hatchA: [1, 0.1, 0.2], hatchB: [0.2, 0.3, 1], spacing: 1.7, hatch: 0.5, seed: 51, color: '#f7dcae' });
    const cool = pop.paper({ hatchA: [1, 0.1, 0.2], hatchB: [0.2, 0.3, 1], spacing: 1.7, hatch: 0.5, seed: 52, color: '#cfe0f3' });
    this.pieces = Array.from({ length: MAX }, (_, i) => new FlexSheet(scene, 4, 5, { mat: i % 2 ? cool : warm, edges: ['u1', 'v0', 'v1'], width: 0.9 }));
    this.corners = null;
  }

  /** b: 0 whole card, 1 finished row. geometry in millimetres on the board */
  place({ b, n, R, frac, cx, cz, top }) {
    const span = 2 * Math.PI * frac, dA = span / n, arc = span * R, width = arc / 2;
    const zTop = cz - R / 2 - 6, xLeft = cx + 34 - width / 2, step = arc / (2 * n);
    this.pieces.forEach((p, i) => {
      const on = b > 0.001 && i < n;
      p.mesh.visible = on;
      p.outline.mesh.visible = on;
      if (!on) return;
      const q = smooth(clamp(b * 1.5 - (i / n) * 0.5));
      const startAx = -Math.PI / 2 + (i + 0.5 - n / 2) * dA, up = i % 2 === 0;
      const endAx = up ? Math.PI / 2 : -Math.PI / 2;
      let turn = endAx - startAx;
      while (turn > Math.PI) turn -= 2 * Math.PI;
      while (turn < -Math.PI) turn += 2 * Math.PI;
      const ax = startAx + turn * q;
      const gap = Math.sin(Math.PI * clamp(q * 2.5)) * 8;
      const sx = cx + gap * Math.cos(startAx), sz = cz + gap * Math.sin(startAx);
      const tx = xLeft + (i + 0.5) * step + (up ? 0 : 0), tz = up ? zTop : zTop + R;
      const ox = sx + (tx - sx) * q, oz = sz + (tz - sz) * q;
      const lift = Math.sin(Math.PI * q) * 34 + top + (i % 2 ? 0.25 : 0.5);
      p.shape((u, v, o) => {
        const rho = u * R, phi = (v - 0.5) * dA, d = rho * Math.cos(phi), s = rho * Math.sin(phi);
        o.x = ox + d * Math.cos(ax) - s * Math.sin(ax);
        o.z = oz + d * Math.sin(ax) + s * Math.cos(ax);
        o.y = lift;
      });
    });
    this.corners = {
      row_top_left: V(xLeft, top, zTop), row_top_right: V(xLeft + width, top, zTop),
      row_bottom_left: V(xLeft, top, zTop + R), row_bottom_right: V(xLeft + width, top, zTop + R),
    };
  }
}
