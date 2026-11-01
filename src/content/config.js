// The whole book's settings: language, title, cover and back-matter text.
// Each lesson's text is in lessons.js, the quiz in quiz.js, each apparatus in ../lessons/.

/** The cover plate: a sector and the cone it folds into */
function plate(g, w, h) {
  g.strokeStyle = '#15161a'; g.lineWidth = 0.28; g.lineCap = 'round';
  const cx = w / 2;
  g.beginPath(); g.moveTo(cx, h * 0.22);
  g.arc(cx, h * 0.22, 34, Math.PI * 0.2, Math.PI * 0.8);
  g.closePath(); g.stroke();
  g.beginPath(); g.ellipse(cx, h * 0.8, 16, 4.2, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(cx - 16, h * 0.8); g.lineTo(cx, h * 0.58); g.lineTo(cx + 16, h * 0.8); g.stroke();
}

export default {
  lang: 'en',
  title: 'Paper Solids',
  subtitle: 'A book that moves',
  series: 'CAT Quant · Mensuration',
  edition: 'Personal study copy · 2026',
  copyright: 'Paper Solids · personal study',
  runningHead: null,
  cover: { cloth: '#1f5f63', sheen: '#8cc4bf', foil: [0.96, 0.72, 0.34], plate },
  stampMotto: null,

  legend: [
    { kind: 'arrow', color: '#ff7a1c', dir: 'h', name: 'Orange', desc: 'The rim, or the cut: the thing to watch.' },
    { kind: 'arrow', color: '#2a5db0', dir: 'd', name: 'Blue', desc: 'The slant edges that meet to close a cone.' },
    { kind: 'dash', name: 'Dashes', desc: 'Guide lines, like the height of a cone.' },
    { kind: 'tube', colors: ['#ff7a1c', '#2f7bff'], name: 'Glowing cups', desc: 'Live readings: the higher the level, the bigger the number.' },
    { kind: 'tag', sample: ['Sector angle', 'θ = 216°'], name: 'Paper tags', desc: 'Settings in the picture, updated as you change them.' },
    { kind: 'hand', sample: 'r = 6 cm', name: 'Handwriting', desc: 'Your numbers in the margin, rewritten as you play.' },
    { kind: 'stamp', name: 'Dashed ring', desc: 'A stamp lands here when you finish the challenge.' },
    { kind: 'switch', name: 'Switches', desc: 'Beside the caption. The underlined word is the current choice.' },
  ],

  extraTerms: [{ term: 'Diameter', n: 1 }, { term: 'Cone', n: 2 }],

  sources: [
    'CAT Buddy theory library, Mensuration lesson: the formulas and Examples 13 and 15.',
    'Every Joule (iamtechartist.com/every-joule). This book’s layout and rising figures are inspired by it, through the unofficial every-joule-style engine by james123wang5. The text, figures and lessons here were written separately.',
  ],
  notes: [
    { label: 'Numbers', text: 'Lesson 1 uses π = 22/7. Lesson 2 uses a card of radius 10 cm. Lesson 3 uses a cone 8 cm tall.' },
    { label: 'Licence', text: 'Built on an engine licensed for noncommercial use only, under PolyForm Noncommercial 1.0.0. This copy is for personal study.' },
  ],
  teacher: {
    intro: 'This copy is for one reader. Tick a prediction before touching the picture, then use the picture to check it.',
    notes: [
      ['Lesson 1', 'Watch the width dial start at the diameter and end at the circumference.'],
      ['Lesson 2', 'Every length keeps its value. Only its job changes.'],
      ['Lesson 3', 'Say the three halves aloud: wide, deep, tall.'],
    ],
    misconceptions: ['The label is as wide as the tin looks.', 'The cone’s base radius equals the card’s radius.', 'Half the height means half the volume.'],
  },

  strings: {},
};
