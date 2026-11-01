import * as THREE from 'three';
import { DioramaLesson } from './diorama.js';
import { box, InkSphere } from '../ink/shapes.js';
import { V, RED, makeTag } from '../ink/kit.js';

// 示例第 2 课 · 等高线（地理）：示范非物理学科怎么用同一套零件。
// 两个装置：立体地形块（this.terrain，四周是剖面墙，顶上画等高线）/ 压平成的等高线地图（同一个地形，高度压到 4%）。
// 拖小旗在地形上走，纸签和仪表架读出海拔和坡度；挑战：把小旗插到最高的山顶上。

const Y0 = 5;
const RECT = [4, 104, -58, -16];          // 地形范围（插图坐标，毫米）；右边留给仪表架
const M_PER_MM = 10;                      // 水平比例：1 毫米 = 10 米
const ELEV_PER_MM = 20 / 6;               // 竖直：等高线每 6 毫米一条，等高距 20 米
const EXAG = [1, 0.04];                   // 两个装置的竖直缩放：立体 / 地图

/** 地形高度（毫米，相对底座）：两座山，西边高而缓，东边矮而陡 */
const relief = (x, z) => 4
  + 44 * Math.exp(-((x - 36) ** 2) / 620 - ((z + 38) ** 2) / 420)
  + 30 * Math.exp(-((x - 82) ** 2) / 170 - ((z + 33) ** 2) / 160);

export class ContourLesson extends DioramaLesson {
  exhibitDefs() {
    return [
      { name: '立体', rect: [RECT[0], 150, RECT[2], RECT[3]], scale: 1.15 },   // 右边多留一块放仪表架
      { name: '地图', rect: [RECT[0], RECT[1], RECT[2], RECT[3]], scale: 1.55 },
    ];
  }

  build(ex) {
    const { pop, pen } = this;
    const k = EXAG[ex];
    const [x0, x1, z0, z1] = RECT;
    const rig = {};
    (this.rigs ??= [])[ex] = rig;
    // 地形块：等高线间隔跟着竖直缩放，地图上看到的是同一组线
    rig.land = this.terrain({ x0, x1, z0, z1, base: Y0, height: (x, z) => relief(x, z) * k, interval: 6 * k, n: 60 });
    // 小旗：一根旗杆 + 三角旗（动态线组）+ 杆顶的小球（拖它）
    rig.pin = new InkSphere(pop, { r: 2.4, centre: V(30, Y0 + 30, -24), mat: pop.paper({ hatch: 0.6, spacing: 1, seed: 33, color: '#f2c9bd' }), sched: pen.next(16) });
    this.lifters.push(rig.pin);
    rig.flagLines = this.dyn(undefined, 1.4, 20);
    const clothGeo = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, -6, 0), V(9, -3, 0)]);
    clothGeo.computeVertexNormals();
    rig.cloth = new THREE.Mesh(clothGeo, pop.paper({ hatch: 0.3, seed: 34, color: '#e8a08e' }));
    rig.cloth.material.side = THREE.DoubleSide;
    pop.addSurface(rig.cloth);
    rig.tag = makeTag(pop, 24, 8);
    // 北向箭头和比例尺（地图的规矩）
    const nx = x1 - 4, nz = z0 + 8, nTop = Y0 + (ex === 0 ? 2 : 3);
    this.ink.add([V(nx, nTop, nz + 5), V(nx, nTop, nz - 5), V(nx - 1.6, nTop, nz - 2.4)], { sched: pen.next(12), width: 0.8 });
    const bar = [V(x0 + 4, Y0 + 0.3, z1 + 4), V(x0 + 34, Y0 + 0.3, z1 + 4)];
    this.ink.add(bar, { sched: pen.next(30), width: 0.8, taper: false });
    for (const x of [x0 + 4, x0 + 19, x0 + 34]) this.ink.add([V(x, Y0 + 0.3, z1 + 3), V(x, Y0 + 0.3, z1 + 5)], { sched: pen.next(2), width: 0.6, taper: false });
    if (ex === 0) {
      // 仪表架只放在立体装置里：海拔和坡度
      [rig.cupE, rig.cupS] = this.rack({ cx: 128, z: -40, legH: 10, r: 5, h: 13, items: [
        { color: '#ff7a1c', label: '海拔', unit: 'm', capacity: 160, digits: 0 },
        { color: '#2f7bff', label: '坡度', unit: '°', capacity: 40, digits: 0 },
      ] });
    }
    // 地图上山顶的小三角（立体里不需要）
    if (ex === 1) for (const [px, pz] of [[36, -38], [82, -33]]) box(pop, this.ink, V(px - 1, Y0 + relief(px, pz) * k, pz - 1), V(px + 1, Y0 + relief(px, pz) * k + 1, pz + 1), { pen, width: 0.6 });
    this.drawTime = 3.6;
  }

  get rig() { return this.rigs[this.ex]; }

  reset() {
    this.flag ??= { x: 12, z: -22 };
    this.peak ??= this.findPeak();
    this.placeAll();
  }

  /** 网格上找最高点（挑战用） */
  findPeak() {
    let best = { e: -1 };
    for (let x = RECT[0]; x <= RECT[1]; x += 1) for (let z = RECT[2]; z <= RECT[3]; z += 1) {
      const e = relief(x, z);
      if (e > best.e) best = { e, x, z };
    }
    return best;
  }

  /** 海拔（米）和坡度（度）：坡度用水平、竖直两种比例换算成真实的坡 */
  read(x, z) {
    const e = relief(x, z) * ELEV_PER_MM;
    const d = 0.5;
    const gx = (relief(x + d, z) - relief(x - d, z)) / (2 * d), gz = (relief(x, z + d) - relief(x, z - d)) / (2 * d);
    const slope = (Math.atan((Math.hypot(gx, gz) * ELEV_PER_MM) / M_PER_MM) * 180) / Math.PI;
    return { e, slope };
  }

  placeAll() {
    const rig = this.rig, { x, z } = this.flag;
    const y = rig.land.heightAt(x, z);
    const top = V(x, y + 18, z);
    rig.pin.mesh.position.copy(top).add(V(0, 2.4, 0));
    rig.cloth.position.copy(top).add(V(0, -0.5, 0));
    rig.flagLines.setLines([
      { points: [V(x, y, z), top.clone()], width: 1.0, taper: false },
      { points: [top.clone().add(V(0, -0.5, 0)), top.clone().add(V(9, -3.5, 0)), top.clone().add(V(0, -6.5, 0))], width: 0.8, taper: false },
    ]);
    const { e, slope } = this.read(x, z);
    rig.tag.mesh.position.set(Math.min(RECT[1] - 10, x + 15), y + 24, z + 2);
    rig.tag.set('海拔', `${Math.round(e)} m`);
    this.rigs[0].cupE.setValue(e);
    this.rigs[0].cupS.setValue(slope);
    const out = [`海拔 ≈ ${Math.round(e)} m`, `坡度 ≈ ${slope.toFixed(0)}°`, '等高距 20 m'];
    if (Math.abs(e - this.peak.e * ELEV_PER_MM) < 3) out.push('到山顶了！');
    this.setNumbers(out);
  }

  tick() { this.placeAll(); }

  handles() {
    return this.rigs.map((rig) => ({
      object: rig.pin.mesh, cursor: 'grab',
      onMove: (ray) => {
        // 先和底座平面求交，再用地形高度修正两次，落点就贴在地面上
        let y = Y0, p = null;
        for (let i = 0; i < 3; i++) {
          p = this.rayToPlane(ray, V(0, y + 18, 0), V(0, 1, 0));
          if (!p) return;
          y = rig.land.heightAt(Math.max(RECT[0], Math.min(RECT[1], p.x)), Math.max(RECT[2], Math.min(RECT[3], p.z)));
        }
        this.flag = { x: Math.max(RECT[0] + 2, Math.min(RECT[1] - 2, p.x)), z: Math.max(RECT[2] + 2, Math.min(RECT[3] - 2, p.z)) };
      },
      onUp: () => {
        const { e } = this.read(this.flag.x, this.flag.z);
        if (Math.abs(e - this.peak.e * ELEV_PER_MM) < 3) this.earnStamp();
        this.app.sound?.play('tick');
      },
    }));
  }

  shots() {
    return [
      { cam: () => this.near(70, Y0 + 20, -38, V(-40, 190, 250)), act: () => { this.switchExhibit(0, true); this.flag = { x: 12, z: -22 }; this.placeAll(); } },
      { cam: () => this.near(82, Y0 + 20, -33, V(30, 150, 220)), act: () => { this.flag = { x: 74, z: -33 }; this.placeAll(); } },
      { cam: () => this.near(36, Y0 + 30, -38, V(-30, 170, 230)), act: () => { this.flag = { x: 48, z: -38 }; this.placeAll(); } },
      { cam: () => this.near(54, Y0, -37, V(0, 300, 120)), act: () => { this.switchExhibit(1, true); this.placeAll(); } },
      { cam: null },
    ];
  }
}
