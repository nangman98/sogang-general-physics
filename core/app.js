// Page shell and run loop shared by every screen.
// A screen supplies: spec (texts, controls, readouts), model (pure physics, no DOM), view (3D drawing).
// Model contract (02_기본틀_설계.md): params, init(p), step(state, dt, p) or at(t, p), observe(state, p), duration(p).
import { createStage } from './stage3d.js';
import { fmt, fmtFixed } from './format.js';

const el = (tag, attrs = {}, html = '') => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (html) n.innerHTML = html;
  return n;
};

// Units follow the number after one space, except the degree sign (05_디자인_기준.md).
const unitSuffix = u => (!u ? '' : u === '°' ? '°' : ' ' + u);

function decimalsOf(step) {
  const s = String(step);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

export async function mountScreen({ spec, model, view }) {
  document.title = `${spec.module} ${spec.title} · Sogang General Physics`;
  const body = document.body;
  body.innerHTML = '';

  // ---------- header ----------
  const header = el('header', { class: 'page' });
  header.append(el('div', {}, `<div class="crumb"><a href="${spec.home ?? '../../../index.html'}">${spec.course}</a> · Chapter ${spec.chapter} ${spec.chapterTitle}</div><h1>${spec.module} ${spec.title}</h1>`));
  header.append(el('p', { class: 'header-note' }, spec.headerNote ?? `Principles of Physics 12e · Module ${spec.module}`));
  body.append(header);

  // ---------- controls ----------
  const main = el('main', { class: 'sim' });
  const aside = el('aside', { class: 'panel', 'aria-label': 'Controls' });
  aside.append(el('div', { class: 'panel-title' }, `Controls<span>SI units</span>`));
  const controls = el('div', { class: 'controls' });
  const inputs = {};
  for (const c of model.params) {
    if (c.type === 'select') {
      const lab = el('label', { class: 'control', for: c.id }, c.label);
      const sel = el('select', { id: c.id });
      for (const o of c.options) sel.append(el('option', { value: o.value }, o.label));
      sel.value = c.value; lab.append(sel); controls.append(lab); inputs[c.id] = sel;
    } else if (c.type === 'check') {
      const lab = el('label', { class: 'check', for: c.id });
      const box = el('input', { id: c.id, type: 'checkbox' }); box.checked = !!c.value;
      lab.append(box, document.createTextNode(c.label)); controls.append(lab); inputs[c.id] = box;
    } else {
      const lab = el('label', { class: 'control', for: c.id }, `${c.label}${c.sym ? `<span class="sym">${c.sym}</span>` : ''}`);
      const out = el('output', { for: c.id });
      const range = el('input', { id: c.id, type: 'range', min: c.min, max: c.max, step: c.step, value: c.value });
      const ends = el('span', { class: 'range-ends' }, `<span>${c.endLabels?.[0] ?? fmtFixed(c.min, decimalsOf(c.step)) + unitSuffix(c.unit)}</span><span>${c.endLabels?.[1] ?? fmtFixed(c.max, decimalsOf(c.step)) + unitSuffix(c.unit)}</span>`);
      lab.prepend(out); lab.append(range, ends); controls.append(lab); inputs[c.id] = range;
      range._format = () => (c.format ? c.format(+range.value) : fmtFixed(+range.value, decimalsOf(c.step)) + unitSuffix(c.unit));
      out.textContent = range._format();
    }
  }
  let timeInput = null, timeOut = null;
  const timed = typeof model.duration === 'function';
  if (timed) {
    const lab = el('label', { class: 'control', for: 'time' }, `Time<span class="sym"><i>t</i></span>`);
    timeOut = el('output', { for: 'time' });
    timeInput = el('input', { id: 'time', type: 'range', min: 0, max: 1000, step: 1, value: 0 });
    lab.prepend(timeOut); lab.append(timeInput); controls.append(lab);
  }
  const animated = timed || typeof model.step === 'function';
  const run = el('div', { class: 'run' });
  run.hidden = !animated;
  const play = el('button', { class: 'primary', type: 'button' }, 'Play');
  const reset = el('button', { type: 'button' }, 'Reset');
  run.append(play, reset); controls.append(run);
  if (spec.assumptions?.length) controls.append(el('div', { class: 'note' }, '<ul>' + spec.assumptions.map(a => `<li>${a}</li>`).join('') + '</ul>'));
  aside.append(controls);
  if (spec.equations?.length) {
    const eqs = el('div', { class: 'equations', 'aria-label': 'Equations' });
    for (const e of spec.equations) eqs.append(el('div', { class: 'eq' }, `<span>${e.html}</span><span class="eqno">${e.no ? `(${e.no})` : ''}</span>`));
    aside.append(eqs);
  }

  // ---------- stage ----------
  const section = el('section', { class: 'view', 'aria-label': '3D scene' });
  const stageRoot = el('div', { class: 'stage' });
  stageRoot.append(el('canvas', { class: 'scene', tabindex: '0', 'aria-label': spec.sceneLabel ?? '3D scene. Drag or use arrow keys to rotate, + and − to zoom, Home to reset.' }));
  stageRoot.append(el('div', { class: 'world-labels', 'aria-hidden': 'true' }));
  stageRoot.append(el('div', { class: 'scene-heading' }, `<small>Module ${spec.module}</small><strong>${spec.sceneTitle ?? spec.title}</strong>`));
  const actions = el('div', { class: 'scene-actions' });
  const resetView = el('button', { type: 'button' }, 'Reset view');
  actions.append(resetView); stageRoot.append(actions);
  const footer = el('div', { class: 'scene-footer' });
  const legendBox = el('span', { class: 'legend' });
  footer.append(legendBox, el('span', { class: 'hint' }, 'Drag to rotate · Scroll or +/− to zoom · Arrow keys'));
  stageRoot.append(footer);
  stageRoot.append(el('canvas', { class: 'compass', width: 152, height: 152, 'aria-hidden': 'true' }));
  const status = el('div', { class: 'status' }, 'Loading 3D scene…');
  stageRoot.append(status);
  section.append(stageRoot);

  const readings = el('div', { class: 'readings', 'aria-live': 'off' });
  const cells = {};
  for (const r of spec.readouts) {
    const cell = el('div', { class: 'reading' }, `<small>${r.label}</small>`);
    const val = el('strong', { id: 'readout-' + r.id });
    cell.append(val); readings.append(cell); cells[r.id] = val;
  }
  section.append(readings);
  const belowNote = el('p', { class: 'below-note' }, spec.belowNote ?? '');
  section.append(belowNote);
  const graphBox = el('div', { class: 'graphs' });
  section.append(graphBox);
  main.append(aside, section);
  body.append(main);

  if (spec.objectives) {
    const obj = el('section', { class: 'objectives', 'aria-label': 'Textbook objectives' });
    obj.append(el('h2', {}, 'Textbook link'));
    obj.append(el('p', {}, spec.objectives));
    body.append(obj);
  }
  body.append(el('footer', { class: 'page' }, spec.footer ?? 'Sogang University Department of Physics · Based on Halliday, Resnick, Walker, Principles of Physics, 12th ed. (International Adaptation). No textbook figures or text are reproduced.'));

  // Initial values from the URL, e.g. ?quantity=mass&n=-3 (links for review and for lecture slides).
  const query = new URLSearchParams(location.search);
  for (const c of model.params) {
    if (!query.has(c.id)) continue;
    const n = inputs[c.id], q = query.get(c.id);
    if (c.type === 'check') n.checked = q === '1' || q === 'true';
    else n.value = q;
  }

  // ---------- state ----------
  const stage = createStage(stageRoot);
  const read = () => {
    const p = {};
    for (const c of model.params) {
      const n = inputs[c.id];
      p[c.id] = c.type === 'select' ? n.value : c.type === 'check' ? n.checked : +n.value;
    }
    // Sliders whose range depends on other controls (c.bounds(p) -> [min, max]).
    for (const c of model.params) {
      if (!c.bounds) continue;
      const [lo, hi] = c.bounds(p), n = inputs[c.id];
      n.min = lo; n.max = hi;
      if (+n.value < lo) n.value = lo;
      if (+n.value > hi) n.value = hi;
      p[c.id] = +n.value;
      const ends = n.closest('label').querySelector('.range-ends').children;
      ends[0].textContent = c.format ? c.format(lo) : String(lo);
      ends[1].textContent = c.format ? c.format(hi) : String(hi);
    }
    return model.derive ? model.derive(p) : p;
  };
  let p = read();
  let state = model.init(p);
  let playing = false, acc = 0;
  const h = spec.dt ?? 1 / 240;
  const v = view(stage, { graphBox, legendBox, belowNote });

  function setLegend(items = []) {
    legendBox.innerHTML = items.map(k => `<span class="key" style="--color:${k.color}"><i></i>${k.label}</span>`).join(' ');
  }
  function refresh() {
    const obs = model.observe(state, p);
    v.render(obs, p);
    for (const r of spec.readouts) cells[r.id].innerHTML = r.value(obs, p, fmt);
    if (timed) {
      const T = model.duration(p);
      timeOut.textContent = fmt(state.t, { sig: 3, zero: 1e-9 }) + ' s';
      timeInput.value = String(Number.isFinite(T) && T > 0 ? Math.round(state.t / T * 1000) : 0);
    }
    window.screenState = { id: spec.id, params: p, observation: obs };
  }
  function rebuild() {
    p = read();
    for (const c of model.params) if (c.type !== 'select' && c.type !== 'check') inputs[c.id].closest('label').querySelector('output').textContent = inputs[c.id]._format();
    const keepT = state.t ?? 0;
    state = model.init(p);
    if (model.at && timed) state = model.at(Math.min(keepT, model.duration(p)), p);
    stage.clear();
    const built = v.build(p) || {};
    setLegend(built.legend);
    refresh();
  }
  function stop() { playing = false; play.textContent = 'Play'; }

  for (const c of model.params) inputs[c.id].addEventListener('input', () => { if (!c.live) stop(); rebuild(); });
  if (timed) timeInput.addEventListener('input', () => {
    stop();
    const t = model.duration(p) * (+timeInput.value) / 1000;
    state = model.at ? model.at(t, p) : state;
    refresh();
  });
  play.addEventListener('click', () => {
    if (playing) { stop(); return; }
    if (timed && state.t >= model.duration(p) - 1e-12) state = model.init(p);
    playing = true; play.textContent = 'Pause';
  });
  reset.addEventListener('click', () => { stop(); state = model.init(p); refresh(); });
  resetView.addEventListener('click', () => stage.resetCamera());

  stage.onFrame(dt => {
    if (!playing) return;
    acc += dt * (spec.timeScale ?? 1);
    const T = timed ? model.duration(p) : Infinity;
    while (acc >= h) {
      acc -= h;
      if (model.at) state = model.at(Math.min(state.t + h, T), p);
      else state = model.step(state, h, p);
      if (state.t >= T - 1e-12) { stop(); acc = 0; break; }
    }
    refresh();
  });

  rebuild();
  status.hidden = true;
  window.screenReady = true;
  return { stage, rebuild, refresh, get params() { return p; }, get state() { return state; }, set state(s) { state = s; refresh(); } };
}
