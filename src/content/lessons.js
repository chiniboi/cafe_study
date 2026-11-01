// One spread per lesson: the left page is written here, the right page is its class in ../lessons/.

export const LESSONS = [
  {
    n: 1,
    title: 'The label on a tin',
    short: 'Cylinder',
    explanation: [
      'A label wrapped around a tin is just a rectangle that has been rolled up.',
      'Unroll it and the rim of the tin straightens into the long edge of the label.',
    ],
    equation: {
      symbols: '$\\rm{CSA} = 2\\pi rh$',
      words: 'The curved surface is a rectangle, 2πr long and h tall. Add two lids of πr² for the total.',
    },
    keywords: [
      { term: 'Curved surface area', def: 'The area of the wall, without the lids.' },
      { term: 'Total surface area', def: 'The wall plus the two lids.' },
      { term: 'Circumference', def: 'The distance once around the rim, 2πr.' },
    ],
    predict: {
      question: 'A tin has radius 7 cm and height 10 cm. How wide is its label when flat?',
      options: ['14 cm, across the tin', '44 cm', '22 cm'],
      answer: 1,
    },
    explain: 'The label has to go all the way around, so its width is the rim: 2 × 22/7 × 7 = 44 cm. Measuring straight across gives 14 cm, the diameter, which is the trap. Watch the width on the dial start at 14 and climb to 44 as the paper opens.',
    challenge: { text: 'Flatten the label that covers exactly 440 cm².', done: '440 cm²' },
    figure: 'A label on a tin',
    figureNote: 'the orange edge is the rim',
    tryHint: 'Drag the label sideways, or tap the tin.',
    switches: [{ id: 'ex', label: 'Radius', options: ['3.5 cm', '5 cm', '7 cm'] }],
    exhibits: [
      { figure: 'Small tin', note: 'radius 3.5 cm', hint: 'Drag the label sideways, or tap the tin.' },
      { figure: 'Middle tin', note: 'radius 5 cm', hint: 'Drag the label sideways, or tap the tin.' },
      { figure: 'Large tin', note: 'radius 7 cm', hint: 'Open it fully and read the area.' },
    ],
    demo: ['A tin of radius 7 cm.', 'The label starts to open.', 'The rim is straightening out.', 'Flat: width 44 cm, not 14.', 'Your turn: find 440 cm².'],
  },
  {
    n: 2,
    title: 'Fold a sector',
    short: 'Cone',
    explanation: [
      'Join the two straight edges of a card sector and you get a cone.',
      'Nothing stretches, so every length keeps its value and simply takes a new job.',
    ],
    equation: {
      symbols: '$l = R, \\quad r = R \\times \\theta/360$',
      words: 'The radius of the card becomes the slant. The arc becomes the rim of the base.',
    },
    keywords: [
      { term: 'Sector', def: 'A slice of a circle, like a pizza slice.' },
      { term: 'Slant height', def: 'The distance from the tip to the rim.' },
      { term: 'Right circular cone', def: 'A cone with its tip above the base centre.' },
    ],
    predict: {
      question: 'A 216° sector is cut from a card of radius 10 cm. What is the base radius of the cone?',
      options: ['10 cm, same as card', '8 cm', '6 cm'],
      answer: 2,
    },
    explain: 'The arc keeps its length and becomes the rim, so 2πr = 216/360 × 2π × 10, which gives r = 6 cm. The 10 cm did not vanish: it became the slant, running up the side. The height is then √(10² − 6²) = 8 cm, which is the other wrong option.',
    challenge: { text: 'Fold a cone that stands exactly 8 cm tall.', done: 'h = 8 cm' },
    figure: 'A card sector',
    figureNote: 'blue edges meet, orange arc becomes the rim',
    tryHint: 'Drag the card upward, or tap it to fold.',
    switches: [{ id: 'angle', label: 'Angle', options: ['120°', '180°', '216°', '270°'] }],
    demo: ['A 216° sector, radius 10 cm.', 'The blue edges swing together.', 'They meet: now it is a cone.', 'Rim 6 cm, height 8 cm.', 'Your turn: try other angles.'],
  },
  {
    n: 3,
    title: 'Slice a cone',
    short: 'Frustum',
    explanation: [
      'Cut a cone parallel to its base and the top piece is a smaller copy of the whole cone.',
      'The bottom piece is called a frustum. A bucket is one, turned upside down.',
    ],
    equation: {
      symbols: '$\\rm{tip} / \\rm{whole} = (h/H)^3$',
      words: 'Scale the height by k and the volume shrinks by k³, because all three directions shrink.',
    },
    keywords: [
      { term: 'Frustum', def: 'The part of a cone left below a parallel cut.' },
      { term: 'Similar solids', def: 'The same shape at a different size.' },
      { term: 'Scale factor', def: 'The ratio of matching lengths, here h/H.' },
    ],
    predict: {
      question: 'A cone is cut parallel to its base, halfway up. What share of the volume is the tip?',
      options: ['1/2, half the height', '1/4', '1/8'],
      answer: 2,
    },
    explain: 'The tip is half as wide, half as deep and half as tall as the whole cone, so its volume is ½ × ½ × ½ = 1/8. Halving the height alone is the trap, because volume shrinks in all three directions at once. The frustum keeps the other 7/8.',
    challenge: { text: 'Cut so the tip holds 12.5%, then lift it off.', done: '12.5%' },
    figure: 'A sliced cone',
    figureNote: 'the orange ring is the cut',
    tryHint: 'Drag the lower piece to move the cut, drag the tip to lift it.',
    demo: ['A cone, cut halfway up.', 'Lift off the tip.', 'Half the height, one eighth the volume.', 'The frustum keeps 87.5%.', 'Your turn: try 12.5%.'],
  },
];
