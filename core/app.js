// Page shell and run loop shared by every screen.
// A screen supplies: spec (texts, controls, readouts), model (pure physics, no DOM), view (3D drawing).
// Model contract (02_기본틀_설계.md): params, init(p), step(state, dt, p) or at(t, p), observe(state, p), duration(p).
// Spec fields readouts, equations, assumptions, belowNote, sceneTitle may be values or functions of the parameters p.
import { createStage } from './stage3d.js';
import { fmt, fmtFixed } from './format.js';
import { tex } from './math.js';

const el = (tag, attrs = {}, html = '') => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (html) n.innerHTML = html;
  return n;
};

// Units follow the number after one space, except the degree sign (05_디자인_기준.md).
const unitSuffix = u => (!u ? '' : u === '°' ? '°' : ' ' + u);
const decimalsOf = step => (String(step).includes('.') ? String(step).split('.')[1].length : 0);
const resolve = (v, p) => (typeof v === 'function' ? v(p) : v);
const eqHtml = e => (e.tex ? tex(e.tex) : e.html);

export async function mountScreen({ spec, model, view }) {
  document.title = `${spec.module} ${spec.title} · 서강대 일반물리 시뮬레이션`;
  const body = document.body;
  body.innerHTML = '';

  // ---------- header ----------
  const header = el('header', { class: 'page' });
  header.append(el('div', {}, `<div class="crumb"><a href="${spec.home ?? '../../../index.html'}">${spec.course}</a> · ${spec.chapter}장 ${spec.chapterTitle}</div><h1>${spec.module} ${spec.title}</h1>`));
  header.append(el('p', { class: 'header-note' }, spec.headerNote ?? `교재 Principles of Physics 12e · Module ${spec.module}`));
  body.append(header);

  // ---------- controls ----------
  const main = el('main', { class: 'sim' });
  const aside = el('aside', { class: 'panel', 'aria-label': '실험 설정' });
  aside.append(el('div', { class: 'panel-title' }, `실험 설정<span>SI 단위</span>`));
  const controls = el('div', { class: 'controls' });
  const inputs = {}, wrappers = {};
  for (const c of model.params) {
    let wrap;
    if (c.type === 'tabs') {
      wrap = el('div', { class: 'tabs', role: 'tablist', 'aria-label': c.label });
      const group = { value: String(c.value), buttons: [], listeners: [] };
      for (const o of c.options) {
        const b = el('button', { type: 'button', role: 'tab', 'data-value': o.value }, o.label);
        b.addEventListener('click', () => { group.value = o.value; group.paint(); group.listeners.forEach(f => f()); });
        group.buttons.push(b); wrap.append(b);
      }
      group.addEventListener = (_, f) => group.listeners.push(f);
      group.paint = () => group.buttons.forEach(b => b.setAttribute('aria-selected', String(b.dataset.value === group.value)));
      group.paint();
      inputs[c.id] = group;
    } else if (c.type === 'select') {
      wrap = el('label', { class: 'control', for: c.id }, c.label);
      const sel = el('select', { id: c.id });
      for (const o of c.options) sel.append(el('option', { value: o.value }, o.label));
      sel.value = c.value; wrap.append(sel); inputs[c.id] = sel;
    } else if (c.type === 'check') {
      wrap = el('label', { class: 'check', for: c.id });
      const box = el('input', { id: c.id, type: 'checkbox' }); box.checked = !!c.value;
      wrap.append(box, document.createTextNode(c.label)); inputs[c.id] = box;
    } else {
      wrap = el('label', { class: 'control', for: c.id }, `${c.label}${c.sym ? `<span class="sym">${c.sym}</span>` : ''}`);
      const out = el('output', { for: c.id });
      const range = el('input', { id: c.id, type: 'range', min: c.min, max: c.max, step: c.step, value: c.value });
      const show = v => (c.format ? c.format(v) : fmtFixed(v, decimalsOf(c.step)) + unitSuffix(c.unit));
      const ends = el('span', { class: 'range-ends' }, `<span>${show(c.min)}</span><span>${show(c.max)}</span>`);
      wrap.prepend(out); wrap.append(range, ends); inputs[c.id] = range;
      range._show = show; range._out = out; range._ends = ends;
      out.innerHTML = show(+range.value);
    }
    wrappers[c.id] = wrap; controls.append(wrap);
  }
  let timeInput = null, timeOut = null;
  const timed = typeof model.duration === 'function';
  if (timed) {
    const lab = el('label', { class: 'control', for: 'time' }, `시간 (time)<span class="sym"><i>t</i></span>`);
    timeOut = el('output', { for: 'time' });
    timeInput = el('input', { id: 'time', type: 'range', min: 0, max: 1000, step: 1, value: 0 });
    lab.prepend(timeOut); lab.append(timeInput); controls.append(lab);
  }
  const animated = timed || typeof model.step === 'function';
  const run = el('div', { class: 'run' });
  const play = el('button', { class: 'primary', type: 'button' }, spec.playLabel ?? '재생');
  const reset = el('button', { type: 'button' }, '초기화');
  run.append(play, reset); controls.append(run);
  const panel = el('div', { class: 'activity-panel' });
  controls.append(panel);
  const notes = el('div', { class: 'note' });
  controls.append(notes);
  aside.append(controls);
  const eqs = el('div', { class: 'equations', 'aria-label': '식' });
  aside.append(eqs);

  // ---------- stage ----------
  const section = el('section', { class: 'view', 'aria-label': '3D 장면' });
  const stageRoot = el('div', { class: 'stage' });
  stageRoot.append(el('canvas', { class: 'scene', tabindex: '0', 'aria-label': spec.sceneLabel ?? '3D 장면. 드래그나 방향키로 회전, + 와 − 로 확대, Home으로 시점 초기화' }));
  stageRoot.append(el('div', { class: 'world-labels', 'aria-hidden': 'true' }));
  const heading = el('div', { class: 'scene-heading' }, `<small>Module ${spec.module}</small><strong>${resolve(spec.sceneTitle, {}) ?? spec.title}</strong>`);
  stageRoot.append(heading);
  const actions = el('div', { class: 'scene-actions' });
  const resetView = el('button', { type: 'button' }, '시점 초기화');
  actions.append(resetView); stageRoot.append(actions);
  const footer = el('div', { class: 'scene-footer' });
  const legendBox = el('span', { class: 'legend' });
  footer.append(legendBox, el('span', { class: 'hint' }, '드래그로 회전 · 스크롤이나 +/−로 확대 · 방향키'));
  stageRoot.append(footer);
  stageRoot.append(el('canvas', { class: 'compass', width: 152, height: 152, 'aria-hidden': 'true' }));
  const status = el('div', { class: 'status' }, '3D 장면 준비 중');
  stageRoot.append(status);
  section.append(stageRoot);
  const readings = el('div', { class: 'readings', 'aria-live': 'off' });
  section.append(readings);
  const belowNote = el('p', { class: 'below-note' });
  section.append(belowNote);
  const graphBox = el('div', { class: 'graphs' });
  section.append(graphBox);
  main.append(aside, section);
  body.append(main);

  if (spec.objectives) {
    const obj = el('section', { class: 'objectives', 'aria-label': '교재 대응' });
    obj.append(el('h2', {}, '교재 대응'));
    obj.append(el('p', {}, spec.objectives));
    body.append(obj);
  }
  body.append(el('footer', { class: 'page' }, spec.footer ?? '서강대학교 물리학과 · Halliday, Resnick, Walker, Principles of Physics 12판(International Adaptation) 기준. 교재 그림과 본문은 싣지 않았다.'));

  // Initial values from the URL, e.g. ?quantity=mass&n=-3 (links for review and for lecture slides).
  const query = new URLSearchParams(location.search);
  for (const c of model.params) {
    if (!query.has(c.id)) continue;
    const n = inputs[c.id], q = query.get(c.id);
    if (c.type === 'tabs') { n.value = q; n.paint(); }
    else if (c.type === 'check') n.checked = q === '1' || q === 'true';
    else n.value = q;
  }

  // ---------- state ----------
  const stage = createStage(stageRoot);
  const read = () => {
    const p = {};
    for (const c of model.params) {
      const n = inputs[c.id];
      p[c.id] = c.type === 'select' || c.type === 'tabs' ? n.value : c.type === 'check' ? n.checked : +n.value;
    }
    // Sliders whose range depends on other controls (c.bounds(p) -> [min, max]).
    for (const c of model.params) {
      if (!c.bounds) continue;
      const [lo, hi] = c.bounds(p), n = inputs[c.id];
      n.min = lo; n.max = hi;
      if (+n.value < lo) n.value = lo;
      if (+n.value > hi) n.value = hi;
      p[c.id] = +n.value;
      n._ends.children[0].innerHTML = n._show(lo);
      n._ends.children[1].innerHTML = n._show(hi);
    }
    return model.derive ? model.derive(p) : p;
  };
  let p = read();
  let state = model.init(p);
  let playing = false, acc = 0;
  const h = spec.dt ?? 1 / 240;
  let cells = {}, readoutList = [];

  // Lets a view or the run loop move a slider without rebuilding the scene.
  const setParam = (id, value) => {
    const n = inputs[id]; if (!n) return;
    n.value = value; p[id] = +n.value;
    if (n._out) n._out.innerHTML = n._show(+n.value);
  };
  const ctx = { graphBox, legendBox, belowNote, panel, setParam, tex, fmt, refresh: () => refresh(), get params() { return p; } };
  const v = view(stage, ctx);

  function layoutTexts() {
    for (const c of model.params) {
      wrappers[c.id].hidden = c.showIf ? !c.showIf(p) : false;
      if (inputs[c.id]._out) inputs[c.id]._out.innerHTML = inputs[c.id]._show(+inputs[c.id].value);
    }
    run.hidden = !(animated && (spec.runIf ? spec.runIf(p) : true));
    readoutList = resolve(spec.readouts, p) ?? [];
    readings.replaceChildren(); cells = {};
    for (const r of readoutList) {
      const cell = el('div', { class: 'reading' }, `<small>${r.label}</small>`);
      const val = el('strong', { id: 'readout-' + r.id });
      cell.append(val); readings.append(cell); cells[r.id] = val;
    }
    readings.hidden = readoutList.length === 0;
    const eqList = resolve(spec.equations, p) ?? [];
    eqs.replaceChildren();
    for (const e of eqList) eqs.append(el('div', { class: 'eq' }, `<span>${eqHtml(e)}</span><span class="eqno">${e.no ? `(${e.no})` : ''}</span>`));
    eqs.hidden = eqList.length === 0;
    const as = resolve(spec.assumptions, p) ?? [];
    notes.innerHTML = as.length ? '<ul>' + as.map(a => `<li>${a}</li>`).join('') + '</ul>' : '';
    belowNote.innerHTML = resolve(spec.belowNote, p) ?? '';
    const title = resolve(spec.sceneTitle, p);
    if (title) heading.querySelector('strong').innerHTML = title;
  }
  function setLegend(items = []) {
    legendBox.innerHTML = items.map(k => `<span class="key" style="--color:${k.color}"><i></i>${k.label}</span>`).join(' ');
  }
  function refresh() {
    const obs = model.observe(state, p);
    v.render(obs, p);
    for (const r of readoutList) cells[r.id].innerHTML = r.value(obs, p, fmt, tex);
    if (timed) {
      const T = model.duration(p);
      timeOut.textContent = fmt(state.t, { sig: 3, zero: 1e-9 }) + ' s';
      timeInput.value = String(Number.isFinite(T) && T > 0 ? Math.round(state.t / T * 1000) : 0);
    }
    window.screenState = { id: spec.id, params: p, observation: obs };
  }
  function rebuild() {
    p = read();
    layoutTexts();
    const keepT = state.t ?? 0;
    state = model.init(p);
    if (model.at && timed) state = model.at(Math.min(keepT, model.duration(p)), p);
    stage.clear();
    panel.replaceChildren();
    const built = v.build(p) || {};
    setLegend(built.legend);
    refresh();
  }
  function stop() { playing = false; play.textContent = spec.playLabel ?? '재생'; }

  for (const c of model.params) inputs[c.id].addEventListener('input', () => { stop(); rebuild(); });
  if (timed) timeInput.addEventListener('input', () => {
    stop();
    const t = model.duration(p) * (+timeInput.value) / 1000;
    state = model.at ? model.at(t, p) : state;
    refresh();
  });
  play.addEventListener('click', () => {
    if (playing) { stop(); return; }
    if (timed && state.t >= model.duration(p) - 1e-12) state = model.init(p);
    if (model.atEnd && model.atEnd(state, p)) state = model.restart(state, p);
    playing = true; play.textContent = '일시정지';
  });
  reset.addEventListener('click', () => { stop(); rebuild(); });
  resetView.addEventListener('click', () => stage.resetCamera());

  stage.onFrame(dt => {
    if (!playing) return;
    acc += dt * (spec.timeScale ?? 1);
    const T = timed ? model.duration(p) : Infinity;
    while (acc >= h) {
      acc -= h;
      if (model.at) state = model.at(Math.min(state.t + h, T), p);
      else state = model.step(state, h, p);
      if (state.t >= T - 1e-12 || (model.atEnd && model.atEnd(state, p))) { stop(); acc = 0; break; }
    }
    if (model.syncParams) for (const [id, value] of Object.entries(model.syncParams(state, p))) setParam(id, value);
    refresh();
  });

  rebuild();
  status.hidden = true;
  window.screenReady = true;
  return { stage, rebuild, refresh, get params() { return p; }, get state() { return state; }, set state(s) { state = s; refresh(); } };
}
