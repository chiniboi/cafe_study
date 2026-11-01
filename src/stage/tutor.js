// The typed tutor. The local proxy holds the API key; this page only sends the conversation and
// the tool list, runs whatever tools the model picks, and sends back what happened.

const PROXY = 'http://127.0.0.1:5190/ask';
const MAX_ROUNDS = 5;
const $ = (s) => document.querySelector(s);

const SYSTEM = `You are a brilliant, patient maths teacher sitting beside one student preparing for the CAT exam in India. The student has ADHD and cannot hold a picture built from words alone. A live 3D model of a card sector folding into a cone is on screen, and your tools are your hands: you can move it, point at it, write on it, break it, and compare it.
How you teach:
- Explain it the way you would to a curious ten-year-old first, with something from everyday life (an ice cream cone, a party hat, orange slices), then connect it to the real formula.
- Never only describe. Change the diagram. For every why or how question, use tools to make the idea visible: clear_marks first, then move the model, then point_at each thing you mention, then show_formula.
- Every letter in a formula must be tied to something visible: use point_at or mark_length on it, and give it that thing's colour in show_formula. Colours: orange arc and rim, blue slant l, green radius r, red height h.
- Break things to explain them: use break_into_pieces for why the curved area is πrl, cut_open for how r, h and l relate, show_length_bars to compare lengths, show_cylinder for why volume has 1/3.
- For "what is the difference" or "what if" questions use compare_with, then point at the two things that differ.
- Use write_note for one everyday comparison.
- Write plain text only, never LaTeX or dollar signs: use π, ×, ², √.
- Speak in at most four short plain sentences, referring to what is now on screen. Formulas in plain text, one per line.
- If the model cannot show something, say so plainly and answer briefly.`;

// Gemini sometimes writes LaTeX; the chat shows plain text
const plain = (s) => s.replace(/\$/g, '').replace(/\\pi/g, 'π').replace(/\\times/g, '×').replace(/\\theta/g, 'θ').replace(/\\sqrt/g, '√').replace(/\\cdot/g, '·');
const brief = (args = {}) => {
  const words = Object.values(args).filter((v) => typeof v !== 'object').join(', ');
  return args.terms ? `(${args.terms.map((x) => x.text).join('')})` : `(${words})`;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function createTutor({ commands, tools, context }) {
  const log = $('#log'), meter = $('#meter');
  const contents = [];
  let spent = 0, tokens = 0, busy = false;

  const say = (text, cls = '') => {
    const p = document.createElement('p');
    p.className = `msg ${cls}`;
    p.textContent = text;
    log.append(p);
    log.scrollTop = log.scrollHeight;
  };

  async function ask(question) {
    contents.push({ role: 'user', parts: [{ text: `(On screen: ${context()})\n\n${question}` }] });
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await fetch(PROXY, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM, contents, tools }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `The tutor server replied ${res.status}.`);
      tokens += data.usage?.totalTokenCount ?? 0;
      spent += data.costUsd ?? 0;
      meter.textContent = `${tokens} tokens · about $${spent.toFixed(4)} this session`;
      const parts = data.content?.parts ?? [];
      contents.push({ role: 'model', parts });
      const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('').trim();
      if (text) say(plain(text));
      const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);
      if (!calls.length) return;
      const replies = [];
      for (const call of calls) {
        const fn = commands[call.name];
        const output = fn ? fn(call.args ?? {}) : `No tool called ${call.name}.`;
        say(`▸ ${call.name}${brief(call.args)}`, 'act');
        replies.push({ functionResponse: { name: call.name, response: { output } } });
        await wait(350);
      }
      contents.push({ role: 'user', parts: replies });
    }
  }

  $('#ask').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('#q').value.trim();
    if (!q || busy) return;
    $('#q').value = '';
    busy = true;
    say(q, 'you');
    try { await ask(q); } catch (err) {
      say(/fetch/i.test(err.message) ? 'The tutor server is not running.' : err.message, 'err');
    }
    busy = false;
  });

  return { ask };
}
