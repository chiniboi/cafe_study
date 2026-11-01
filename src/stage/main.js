import './stage.css';
import '@fontsource-variable/source-serif-4/index.css';
import '@fontsource-variable/caveat/index.css';
import * as THREE from 'three';
import { Stage } from '../engine/stage.js';
import { updateIllusLight } from '../ink/paper.js';
import { ConeScene, commandsFor, cone, TOOLS } from './cone.js';
import { createTutor } from './tutor.js';
import { Marks, COLORS } from './marks.js';

const $ = (s) => document.querySelector(s);
const fix = (x, d = 2) => String(Number(x.toFixed(d)));

/** The engine's stage with the oak desk and mat swapped for plain paper */
class PaperStage extends Stage {
  addDesk() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: '#f1f1ef', roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }
}

const stage = new PaperStage($('#app'));
stage.scene.background = new THREE.Color('#f1f1ef');
stage.key.map = null;
stage.camera.layers.enable(1);
await document.fonts.ready;

let ready = false;
const scene = new ConeScene(stage, () => { if (ready) syncReadout(); });
const run = commandsFor(scene);
let current = 0;

const marks = new Marks($('#app'), stage.camera, () => scene.anchors());
const point = (target, text, color = 'ink') => marks.add('point', { target, text, color });
const measure = (from, to, text, color = 'ink', offset) => marks.add('length', { from, to, text, color, offset });

const ANCHORS = ['tip', 'base_centre', 'rim_right', 'rim_left', 'arc_mid', 'edge_left', 'edge_right', 'height_mid', 'radius_mid', 'bar_full_end', 'bar_arc_end', 'row_top_left', 'row_top_right', 'row_bottom_left', 'row_bottom_right', 'other_tip', 'other_base', 'other_rim'];

const STEPS = [
  {
    title: 'Fold the sector',
    text: 'Start with a 216° slice of card, radius 10 cm. Join the two blue edges and it stands up as a cone. Nothing stretches, so every length keeps its value.',
    enter: { R: 10, angle: 216, fold: 1, cut: false, bars: false, view: 'angle', seconds: 3.5 },
    draw: () => { point('tip', 'this point was the circle’s centre'); point('arc_mid', 'the arc', 'orange'); },
  },
  {
    title: 'The arc becomes the rim',
    text: 'Paused partway. The orange arc is curling but it has not stretched. When its two ends meet, that same line is the rim of the base.',
    enter: { R: 10, angle: 216, fold: 0.6, cut: false, bars: false, view: 'angle', glow: 'arc' },
    draw: () => { point('arc_mid', 'same length, just curled', 'orange'); point('edge_left', 'these two meet', 'blue'); },
  },
  {
    title: 'Find the base radius',
    text: 'The arc is 216/360 of the whole circle, and the rim has exactly that length. The bars show it to scale. Cancel 2π from both sides and only r = R × θ/360 is left.',
    formula: '2πr = (θ/360) × 2πR\nr = R × θ/360 = 10 × 216/360 = 6',
    terms: [['2πr', 'rim', 'orange'], [' = ', null], ['θ/360', null, 'ink'], [' × ', null], ['2πR', null, 'ink']],
    enter: { R: 10, angle: 216, fold: 0, cut: false, bars: true, view: 'above', glow: 'arc' },
    draw: () => { measure('bar_full_start', 'bar_full_end', 'whole circle, 2πR', 'ink', -12); measure('bar_arc_start', 'bar_arc_end', 'the arc: 216/360 of it', 'orange', 14); },
  },
  {
    title: 'Cut it open',
    text: 'Slice down the middle and a right triangle appears. The slant is the card’s old radius, so it is the longest side. Pythagoras gives the height.',
    formula: 'l² = r² + h²\nh = √(10² − 6²) = 8',
    terms: [['l²', 'slant', 'blue'], [' = ', null], ['r²', 'radius', 'green'], [' + ', null], ['h²', 'height', 'red']],
    enter: { R: 10, angle: 216, fold: 1, cut: true, bars: false, view: 'front', glow: 'triangle' },
    draw: () => { measure('tip', 'rim_right', 'l = R', 'blue', 20); measure('base_centre', 'rim_right', 'r', 'green', 18); measure('base_centre', 'tip', 'h', 'red', 22); },
  },
  {
    title: 'Break it: the curved area',
    text: 'Cut the card into thin wedges and lay them in a row, alternating point up and point down. They make an almost-rectangle. Half the arc runs along the bottom, which is πr, and the height is the slant.',
    formula: 'area = base × height\nCSA = πr × l',
    terms: [['CSA', null, 'ink'], [' = ', null], ['πr', null, 'orange'], [' × ', null], ['l', 'slant', 'blue']],
    enter: { R: 10, angle: 216, fold: 0, cut: false, bars: false, view: 'above', pieces: 12 },
    draw: () => { measure('row_bottom_left', 'row_bottom_right', 'half the arc = πr', 'orange', 20); measure('row_top_left', 'row_bottom_left', 'l', 'blue', 18); },
  },
  {
    title: 'Change the angle',
    text: 'Move the angle slider. A bigger slice makes a wider, flatter cone, and at 360° the height falls to zero. The slant never changes, because it is still the card’s radius.',
    enter: { R: 10, angle: 216, fold: 1, cut: false, bars: false, view: 'angle', seconds: 3, compare: 300 },
    draw: () => { point('tip', 'taller, narrower', 'ink'); point('other_tip', 'shorter, wider', 'blue'); },
  },
  {
    title: 'Exam question',
    text: 'Find the volume of the cone made by joining the two radii of a semicircle of radius 14 cm.',
    enter: { R: 14, angle: 180, fold: 1, cut: true, bars: false, view: 'front' },
    quiz: { options: ['About 311 cm³', 'About 622 cm³', 'About 1437 cm³'], answer: 1, why: 'The semicircle gives l = 14 and r = 14 × 180/360 = 7, so h = √(196 − 49) = 7√3. Then V = ⅓ × π × 49 × 7√3 ≈ 622 cm³. 311 is half of that, and 1437 uses the card’s 14 as the base radius.' },
  },
];

const setFormula = (terms) => {
  const box = $('#formulaBar');
  box.hidden = !terms?.length;
  box.innerHTML = (terms ?? []).map(([text, part, color]) => `<span class="term" ${part ? `data-part="${part}" role="button" tabindex="0"` : ''} style="color:${COLORS[color] ?? 'inherit'}">${text}</span>`).join('');
};
$('#formulaBar').addEventListener('click', (e) => { const p = e.target.dataset.part; if (p) run.highlight({ part: p, seconds: 4 }); });

function goTo(i, from = 'you') {
  current = Math.max(0, Math.min(STEPS.length - 1, i));
  const s = STEPS[current], e = s.enter;
  run.set_card_radius({ cm: e.R, seconds: e.seconds });
  run.set_angle({ degrees: e.angle, seconds: e.seconds });
  run.set_fold({ value: e.fold, seconds: e.seconds });
  run.cut_open({ open: e.cut });
  run.show_length_bars({ show: e.bars });
  run.look_from({ view: e.view });
  run.put_back_together();
  run.stop_compare();
  run.show_cylinder({ show: false });
  marks.clear();
  if (e.compare) run.compare_with({ degrees: e.compare });
  if (e.pieces) run.break_into_pieces({ pieces: e.pieces });
  if (e.glow) run.highlight({ part: e.glow, seconds: 6 });
  if (from !== 'tutor') { s.draw?.(); setFormula(s.terms); }
  document.querySelectorAll('#steps button').forEach((b, k) => { if (k === current) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  $('#lesson').innerHTML = `<h1>${s.title}</h1><p>${s.text}</p>
    ${s.formula ? `<div class="formula">${s.formula}</div>` : ''}
    ${s.quiz ? `<div>${s.quiz.options.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div><p id="why" hidden>${s.quiz.why}</p>` : ''}
    <div class="nums" id="nums"></div>`;
  document.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    const k = Number(b.dataset.k);
    document.querySelectorAll('.opt').forEach((o, j) => { o.disabled = true; if (j === s.quiz.answer) o.classList.add('right'); else if (j === k) o.classList.add('wrong'); });
    $('#why').hidden = false;
  }));
  syncReadout();
  return `Now on step ${current + 1} of ${STEPS.length}: ${s.title}. ${scene.describe()}`;
}

function syncReadout() {
  const v = scene.v, c = cone(v.R, v.angle), n = $('#nums');
  if (n) n.textContent = `l = ${fix(c.l)}   r = ${fix(c.r)}   h = ${fix(c.h)}\nvolume ≈ ${fix(c.volume, 0)} cm³   CSA ≈ ${fix(c.csa, 0)} cm²`;
  for (const [id, val, out] of [['fold', scene.goal.fold, `${Math.round(v.fold * 100)}%`], ['angle', scene.goal.angle, `${Math.round(v.angle)}°`], ['R', scene.goal.R, `${Math.round(v.R)}`]]) {
    const el = document.getElementById(id);
    if (document.activeElement !== el) el.value = val;
    document.getElementById(`${id}Out`).textContent = out;
  }
}

const commands = {
  ...run,
  go_to_step: ({ step }) => goTo(Number(step) - 1, 'tutor'),
  point_at: ({ target, text = '', color = 'ink' }) => { if (!ANCHORS.includes(target)) return `No point called ${target}. Use ${ANCHORS.join(', ')}.`; point(target, text, color); return `Arrow to ${target}: "${text}".`; },
  mark_length: ({ from, to, text = '', color = 'ink' }) => { if (![from, to].every((a) => ANCHORS.concat('bar_full_start', 'bar_arc_start').includes(a))) return `Unknown point. Use ${ANCHORS.join(', ')}.`; measure(from, to, text, color); return `Measured ${from} to ${to}: "${text}".`; },
  clear_marks: () => { marks.clear(); return 'Pen marks cleared.'; },
  write_note: ({ text }) => { const n = $('#note'); n.textContent = text ?? ''; n.hidden = !text; return text ? 'Note written on the diagram.' : 'Note removed.'; },
  show_formula: ({ terms = [] }) => { setFormula(terms.map((x) => [x.text, x.part ?? null, x.color])); return 'Formula is on the diagram. Terms with a part light up when clicked.'; },
};
const COLOR_ENUM = { type: 'STRING', enum: Object.keys(COLORS) };
const ANCHOR = { type: 'STRING', enum: ANCHORS };
const tools = [...TOOLS,
  { name: 'point_at', description: 'Draw a hand-drawn arrow to a named point with a short label. It follows the model. Use this constantly, like a teacher pointing with a pen. Colours: orange arc and rim, blue slant, green radius, red height.', parameters: { type: 'OBJECT', properties: { target: ANCHOR, text: { type: 'STRING', description: 'At most 5 words' }, color: COLOR_ENUM }, required: ['target', 'text'] } },
  { name: 'mark_length', description: 'Draw a dimension line between two named points with a label, such as r = 6.', parameters: { type: 'OBJECT', properties: { from: ANCHOR, to: ANCHOR, text: { type: 'STRING' }, color: COLOR_ENUM }, required: ['from', 'to', 'text'] } },
  { name: 'clear_marks', description: 'Wipe all arrows and lengths. Do this before starting a new explanation.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'write_note', description: 'Write one handwritten sentence on the diagram, such as an everyday comparison. Empty text removes it.', parameters: { type: 'OBJECT', properties: { text: { type: 'STRING' } }, required: ['text'] } },
  { name: 'show_formula', description: 'Show a formula large on the diagram, split into terms. Give each letter the colour of the thing it means, and a part so it lights up when clicked.', parameters: { type: 'OBJECT', properties: { terms: { type: 'ARRAY', items: { type: 'OBJECT', properties: { text: { type: 'STRING' }, part: { type: 'STRING', enum: ['arc', 'rim', 'slant', 'height', 'radius', 'triangle', 'tip'] }, color: COLOR_ENUM }, required: ['text'] } } }, required: ['terms'] } },
  { name: 'go_to_step', description: `Jump to a lesson step, 1 to ${STEPS.length}: ${STEPS.map((s, i) => `${i + 1} ${s.title}`).join('; ')}.`, parameters: { type: 'OBJECT', properties: { step: { type: 'NUMBER' } }, required: ['step'] } }];

$('#steps').innerHTML = STEPS.map((s, i) => `<li><button data-i="${i}"><b>${i + 1}</b>${s.title}</button></li>`).join('');
$('#steps').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goTo(Number(b.dataset.i)); });
$('#views').innerHTML = ['angle', 'front', 'above', 'side'].map((v) => `<button data-v="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('');
$('#views').addEventListener('click', (e) => { if (e.target.dataset.v) run.look_from({ view: e.target.dataset.v }); });
$('#fold').addEventListener('input', (e) => run.set_fold({ value: e.target.value }));
$('#angle').addEventListener('input', (e) => run.set_angle({ degrees: e.target.value }));
$('#R').addEventListener('input', (e) => run.set_card_radius({ cm: e.target.value }));

let drag = null;
const canvas = stage.renderer.domElement;
canvas.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  scene.view.goalYaw -= (e.clientX - drag[0]) * 0.006;
  scene.view.goalPitch = Math.min(1.45, Math.max(0.05, scene.view.goalPitch + (e.clientY - drag[1]) * 0.005));
  drag = [e.clientX, e.clientY];
});
canvas.addEventListener('pointerup', () => { drag = null; });

createTutor({
  commands, tools,
  context: () => `The student is on step ${current + 1} of ${STEPS.length}: "${STEPS[current].title}". ${STEPS[current].text} On screen now: ${scene.describe()}`,
});

stage.onUpdate((dt) => { updateIllusLight(stage.camera); scene.update(dt, stage.camera); marks.update(); });
ready = true;
goTo(0);
stage.snapView();
window.__lab = { scene, commands, goTo };
