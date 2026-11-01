// A tiny local proxy so the API key never reaches a web page. It listens on this Mac only,
// accepts requests only from the lab page, and stops at a token budget to protect the credit.

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = readFileSync(join(HERE, '.env'), 'utf8').match(/^GOOGLE_API_KEY=(.+)$/m)?.[1]?.trim();
const PORT = 5190;
const ORIGIN = 'http://localhost:5173';
const MODEL = 'gemini-3.8-flash';
const URL_ = `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:generateContent`;
const PRICE = { input: 0.75 / 1e6, output: 3.75 / 1e6 };   // introductory rate through 31 Dec 2026
const TOKEN_BUDGET = 1_000_000;                            // per server run
const MAX_BODY = 500_000;

if (!KEY) { console.error('No GOOGLE_API_KEY in .env'); process.exit(1); }
let used = 0;

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': ORIGIN, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST' || req.url !== '/ask') return send(res, 404, { error: 'Not found' });
  if (req.headers.origin !== ORIGIN) return send(res, 403, { error: 'Only the lab page can use this server.' });
  if (used >= TOKEN_BUDGET) return send(res, 429, { error: 'The token budget for this run is used up. Restart the tutor server to continue.' });
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return send(res, 413, { error: 'That conversation is too long. Reload the page to start a new one.' });
  }
  try {
    const { system, contents, tools } = JSON.parse(raw);
    const upstream = await fetch(URL_, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        tools: [{ functionDeclarations: tools }],
        generationConfig: { maxOutputTokens: 1500 },
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) return send(res, 502, { error: `Gemini said: ${String(data.error?.message ?? upstream.status).slice(0, 200)}` });
    const usage = data.usageMetadata ?? {};
    used += usage.totalTokenCount ?? 0;
    const out = (usage.totalTokenCount ?? 0) - (usage.promptTokenCount ?? 0);
    send(res, 200, { content: data.candidates?.[0]?.content, usage, costUsd: (usage.promptTokenCount ?? 0) * PRICE.input + out * PRICE.output });
  } catch (err) {
    send(res, 500, { error: `The tutor server failed: ${err.message.slice(0, 200)}` });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Tutor proxy on http://127.0.0.1:${PORT}`));
