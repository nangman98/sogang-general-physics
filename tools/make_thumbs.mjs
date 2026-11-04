// Catalog thumbnails: the 3D scene of every built screen in its first state, saved as assets/thumbs/<screen id>.jpg.
// Needs the local server at the repository root (python3 -m http.server 8800) and Google Chrome.
// Run: node tools/make_thumbs.mjs [base url]     Then: python3 tools/build_index.py
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] ?? 'http://127.0.0.1:8800';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = join(ROOT, 'assets', 'thumbs');
mkdirSync(OUT, { recursive: true });

const pages = [];
for (const ch of readdirSync(join(ROOT, 'sims')).filter(d => d.startsWith('ch')).sort())
  for (const d of readdirSync(join(ROOT, 'sims', ch)).sort())
    if (existsSync(join(ROOT, 'sims', ch, d, 'index.html'))) pages.push({ id: d.split('-').slice(0, 2).join('-'), path: `sims/${ch}/${d}/index.html` });

const port = 9400 + Math.floor(Math.random() * 400), profile = `/tmp/thumbs_chrome_${port}`;
const chrome = spawn(CHROME, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
  '--window-size=1280,900', '--force-device-scale-factor=1', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = t => new Promise(r => setTimeout(r, t));
let targets;
for (let i = 0; i < 50 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(200); } }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const waiting = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const k = ++id; waiting.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const run = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;

for (const pg of pages) {
  await send('Page.navigate', { url: `${base}/${pg.path}` });
  await sleep(300);
  for (let i = 0; i < 150 && !(await run('!!window.screenReady')); i++) await sleep(100);
  await sleep(1500);
  // Scene only: hide the heading, buttons, legend and compass that sit on top of the canvas.
  const r = await run(`(() => {
    for (const s of ['.scene-heading', '.scene-actions', '.scene-footer', '.compass']) document.querySelector(s).style.visibility = 'hidden';
    const b = document.querySelector('.stage').getBoundingClientRect();
    return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height };
  })()`);
  await sleep(300);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { ...r, scale: 0.66 } });
  writeFileSync(join(OUT, `${pg.id}.jpg`), Buffer.from(shot.data, 'base64'));
  console.log(`${pg.id}  ${pg.path}`);
}
ws.close(); chrome.kill();
await sleep(500);
rmSync(profile, { recursive: true, force: true });
