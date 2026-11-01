import { DioramaLesson } from './diorama.js';
import { box, InkSphere } from '../ink/shapes.js';
import { V, RED, dashes, makeTag } from '../ink/kit.js';

// 示例第 1 课 · 滑下斜坡（物理）。两个装置：缓坡 / 陡坡（用“装置”开关切换，切换时钢笔重画）。
// 拖小球沿坡往上放到某个高度，松手滑下；仪表架上两只杯子显示高度 h 和速率 v。
// 物理模型和画面分开：run 里只有 s（沿坡离坡底的距离，米）、v、阶段；placeAll() 把它画出来。
// 挑战：让小球到坡底时正好 2.0 m/s。

const Y0 = 5;          // 底座板上表面（插图坐标，毫米）
const S = 100;         // 每米多少毫米
const G = 9.8;
const H = 0.45;        // 坡顶高度（米）
const Z = -30;         // 轨道中线所在的竖直面
const X_BOT = 100;     // 坡底 x（毫米）
const X_END = 156;     // 挡板 x
const R = 4.5;         // 小球半径（毫米）
const SLOW = 0.5;      // 慢放倍数
const SLOPES = [{ deg: 25, name: '缓坡' }, { deg: 50, name: '陡坡' }];

export class RampLesson extends DioramaLesson {
  /** 每个装置的范围（插图坐标 [x0, x1, z0, z1]，毫米）和放大倍数；底座板按范围外扩一圈画出来 */
  exhibitDefs() {
    return SLOPES.map((sl) => ({ name: sl.name, rect: [-8, 166, -64, -14], scale: 1.0 }));
  }

  /** 搭第 ex 个装置。this.pop / pen / ink / faint 已经切到这个装置 */
  build(ex) {
    const { pop, pen, ink } = this;
    const th = (SLOPES[ex].deg * Math.PI) / 180;
    const xTop = X_BOT - (H * S) / Math.tan(th);
    const rig = { th, xTop, L: H / Math.sin(th) };
    (this.rigs ??= [])[ex] = rig;
    const wood = pop.paper({ hatchA: [1, 0, 0.12], hatchB: [0.2, 0.3, 1], spacing: 1.5, seed: 11 + ex, color: '#f3e4c8' });
    const metal = pop.paper({ hatchA: [0, 1, 0.2], hatchB: [1, 0.2, 0.3], spacing: 1.3, seed: 13, color: '#eceef0' });

    // 楔形坡：截面在 xy 平面，沿 z 拉出轨道宽度；坡顶留一小段平台
    this.prism([[xTop - 8, Y0], [X_BOT, Y0], [xTop, Y0 + H * S], [xTop - 8, Y0 + H * S]], Z - 7, Z + 7, { axis: 'z', mat: wood, width: 1.05 });
    // 平直轨道两侧的细边条和尽头的挡板
    for (const z of [Z - 7, Z + 6]) box(pop, ink, V(X_BOT, Y0, z), V(X_END, Y0 + 1.6, z + 1), { mat: metal, pen, width: 0.8 });
    box(pop, ink, V(X_END, Y0, Z - 9), V(X_END + 4, Y0 + 12, Z + 9), { mat: wood, pen, width: 0.95 });
    // 坡面上每 0.1 m 高度一道刻度
    for (let h = 0.1; h < H; h += 0.1) {
      const x = X_BOT - (h * S) / Math.tan(th), y = Y0 + h * S;
      ink.add([V(x, y + 0.05, Z + 7), V(x - 2.4, y + 0.05, Z + 7)], { sched: pen.next(3), width: 0.6, taper: false });
    }

    // 小球（实时轮廓的球）：登记到 lifters，每帧按视角重算轮廓
    rig.ball = new InkSphere(pop, { r: R, centre: V(X_BOT, Y0 + R, Z), mat: pop.paper({ hatchA: [0.9, 0.12, -0.42], hatchB: [0.2, 0.9, 0.4], spacing: 1.2, seed: 15, color: '#e9eef6' }), sched: pen.next(28) });
    this.lifters.push(rig.ball);
    // 起点高度的纸签 + 竖直的红色虚线（动态线组：每帧重写）
    rig.tag = makeTag(pop, 26, 8);
    rig.tag.mesh.position.set(Math.max(4, xTop - 6), Y0 + H * S + 16, Z + 4);
    rig.drop = this.dyn(RED, 1.2, 80);
    // 仪表架：高度和速率两只杯子（发光液面 + 纸签读数）
    [rig.cupH, rig.cupV] = this.rack({ cx: 128, z: -56, legH: 10, r: 5.5, h: 14, items: [
      { color: '#ff7a1c', label: '高度 h', unit: 'm', capacity: 0.5, digits: 2 },
      { color: '#2f7bff', label: '速率 v', unit: 'm/s', capacity: 3.2, digits: 2 },
    ] });
    this.drawTime = 3.2;
  }

  get rig() { return this.rigs[this.ex]; }

  /** 进入这一页、换装置时调用：回到初始状态 */
  reset() {
    this.h = 0.3;
    this.run = null;
    this.results ??= {};
    this.placeAll();
  }

  /** 坡上距坡底 s 米处的球心（插图坐标） */
  onSlope(rig, s) {
    const x = X_BOT - s * Math.cos(rig.th) * S, y = Y0 + s * Math.sin(rig.th) * S;
    return V(x - R * Math.sin(rig.th), y + R * Math.cos(rig.th), Z);
  }

  placeAll() {
    const rig = this.rig, run = this.run;
    let p, v = 0, h = this.h;
    if (!run) p = this.onSlope(rig, h / Math.sin(rig.th));
    else if (run.phase === 'slope') { p = this.onSlope(rig, run.s); v = run.v; h = run.s * Math.sin(rig.th); }
    else { p = V(Math.min(X_END - R, X_BOT + run.x * S), Y0 + R, Z); v = run.phase === 'done' ? 0 : run.v; h = 0; }
    rig.ball.mesh.position.copy(p);
    rig.cupH.setValue(h);
    rig.cupV.setValue(v);
    rig.tag.set('起点高度 h', `${(run?.h0 ?? this.h).toFixed(2)} m`);
    // 拖动时画一条从球到底座的竖直虚线，标出高度
    const lines = [];
    if (!run) for (const d of dashes([V(p.x, p.y - R, Z + 8), V(p.x, Y0, Z + 8)], 1.4, 1.1)) lines.push({ points: d, width: 0.7, taper: false });
    rig.drop.setLines(lines);
    // 页边手写的“你的数据”：每行一个字符串（手写层不排公式，用 √ ² ₀ 这类字符）
    const h0 = run?.h0 ?? this.h;
    const out = [`h = ${h0.toFixed(2)} m`, `v = √(2gh) = ${Math.sqrt(2 * G * h0).toFixed(2)} m/s`];
    for (const [i, r] of Object.entries(this.results)) out.push(`${SLOPES[i].name}：坡底 ${r.toFixed(2)} m/s`);
    this.setNumbers(out);
  }

  release() {
    if (this.run && this.run.phase !== 'done') return;
    const s = this.h / Math.sin(this.rig.th);
    this.run = { phase: 'slope', s, v: 0, x: 0, h0: this.h };
    this.app.sound?.play('tick');
  }

  /** 每帧（装置立起来、这一页正在看时）推进物理 */
  tick(dt) {
    const run = this.run, rig = this.rig;
    if (run && run.phase !== 'done') {
      const t = dt * SLOW;
      if (run.phase === 'slope') {
        run.v += G * Math.sin(rig.th) * t;
        run.s -= run.v * t;
        if (run.s <= 0) {
          run.phase = 'flat';
          run.v = Math.sqrt(2 * G * run.h0); // 坡底速率按能量守恒取准确值
          this.results[this.ex] = run.v;
          if (Math.abs(run.v - 2.0) < 0.05) this.earnStamp();
        }
      } else {
        run.x += run.v * t;
        if (X_BOT + run.x * S >= X_END - R) { run.phase = 'done'; this.app.sound?.play('thud'); }
      }
    }
    this.placeAll();
  }

  /** 能拖、能点的东西：object 是被射线拾取的网格 */
  handles() {
    return this.rigs.map((rig) => ({
      object: rig.ball.mesh, cursor: 'grab',
      onDown: () => { this.run = null; },
      onMove: (ray) => {
        const p = this.rayToPlane(ray, V(0, 0, Z), V(0, 0, 1));
        if (!p) return;
        // 投影到坡面上，换成高度
        const s = ((X_BOT - p.x) * Math.cos(rig.th) + (p.y - Y0) * Math.sin(rig.th)) / S;
        this.h = Math.round(Math.max(0.05, Math.min(H, s * Math.sin(rig.th))) * 100) / 100;
      },
      onUp: () => this.release(),
    }));
  }

  /** 自动演示：每个镜头 2 秒，字幕在 lessons.js 的 demo 里（一一对应）。cam 用 near() 按真实距离取景 */
  shots() {
    return [
      { cam: () => this.near(60, Y0 + 25, Z, V(-20, 150, 250)), act: () => { this.switchExhibit(0, true); this.reset(); this.h = H; this.placeAll(); } },
      { cam: () => this.near(95, Y0 + 10, Z, V(10, 120, 210)), act: () => this.release() },
      { cam: () => this.near(80, Y0 + 25, Z, V(-10, 150, 250)), act: () => { this.switchExhibit(1, true); this.reset(); this.h = H; this.placeAll(); } },
      { cam: () => this.near(100, Y0 + 10, Z, V(10, 120, 210)), act: () => this.release() },
      { cam: null },
    ];
  }
}
