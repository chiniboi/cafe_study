// Quiz: q, options (2–4), answer (index from 0), why, and n, the lesson it came from.

export const QUIZ = [
  { q: 'A cylinder has radius 7 cm and height 5 cm. What is its curved surface area? (π = 22/7)', options: ['154 cm²', '220 cm²', '308 cm²'], answer: 1, why: '2 × 22/7 × 7 × 5 = 220 cm²', n: 1 },
  { q: 'A label is 88 cm wide when flat. What is the tin’s radius? (π = 22/7)', options: ['7 cm', '14 cm', '28 cm'], answer: 1, why: '2πr = 88, so r = 14 cm', n: 1 },
  { q: 'A semicircle of radius 14 cm is folded into a cone. What is the cone’s base radius?', options: ['7 cm', '14 cm', '3.5 cm'], answer: 0, why: 'r = 14 × 180/360 = 7 cm', n: 2 },
  { q: 'A sector of radius 10 cm folds into a cone with base radius 5 cm. What is its angle?', options: ['90°', '180°', '270°'], answer: 1, why: 'θ = 360 × 5/10 = 180°', n: 2 },
  { q: 'A cone is cut parallel to its base at one third of the way down from the tip. What share of the volume is the tip?', options: ['1/3', '1/9', '1/27'], answer: 2, why: '(1/3)³ = 1/27', n: 3 },
  { q: 'An ice cream cone 8 cm tall has 12.5% left, in the tip. How tall is that piece?', options: ['1 cm', '2 cm', '4 cm'], answer: 2, why: '12.5% is 1/8, and the cube root is 1/2', n: 3 },
];
