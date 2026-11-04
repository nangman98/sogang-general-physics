// Prediction and checking panel shared by screens: a question, optional choices, a number answer, feedback.
// Grading lives in each screen's model.js (no DOM there); this file only builds the controls.

const el = (tag, attrs = {}, html = '') => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (html) n.innerHTML = html;
  return n;
};

export function quizBox(panel, title) {
  const box = el('div', { class: 'quiz' });
  box.append(el('h3', {}, title));
  panel.append(box);
  const fb = el('div', { class: 'feedback', hidden: '' });
  let uid = 0;
  const api = {
    box,
    text(html, cls = 'question') { const n = el('div', { class: cls }, html); box.insertBefore(n, fb.parentNode ? fb : null); return n; },
    // items: [{ value, html }]. Returns a getter for the chosen value ('' when none).
    choices(label, items) {
      const name = 'q' + (++uid) + Math.random().toString(36).slice(2, 6);
      const wrap = el('fieldset', { class: 'choices' }, `<legend>${label}</legend>`);
      for (const it of items) {
        const lab = el('label');
        const input = el('input', { type: 'radio', name, value: it.value });
        lab.append(input, el('span', {}, it.html));
        wrap.append(lab);
      }
      box.insertBefore(wrap, fb.parentNode ? fb : null);
      const get = () => wrap.querySelector('input:checked')?.value ?? '';
      get.clear = () => wrap.querySelectorAll('input').forEach(i => { i.checked = false; });
      return get;
    },
    // Number answer with its unit. onEnter runs when the student presses Enter.
    answer({ label = '답', placeholder = '', unit = '', onEnter = null } = {}) {
      const row = el('div', { class: 'answer' + (unit ? ' with-unit' : '') });
      const input = el('input', { type: 'text', inputmode: 'decimal', 'aria-label': label, placeholder });
      row.append(input);
      if (unit) row.append(el('span', { class: 'unit' }, unit));
      box.insertBefore(row, fb.parentNode ? fb : null);
      if (onEnter) input.addEventListener('keydown', e => { if (e.key === 'Enter') onEnter(); });
      return input;
    },
    check(label, onChange) {
      const lab = el('label', { class: 'check' });
      const input = el('input', { type: 'checkbox' });
      lab.append(input, document.createTextNode(label));
      box.insertBefore(lab, fb.parentNode ? fb : null);
      if (onChange) input.addEventListener('change', onChange);
      return input;
    },
    buttons(list) {
      const row = el('div', { class: 'row' });
      for (const b of list) {
        const n = el('button', { type: 'button', class: b.primary ? 'primary' : '' }, b.label);
        n.addEventListener('click', b.onClick); row.append(n);
      }
      box.insertBefore(row, fb.parentNode ? fb : null);
      return row;
    },
    feedback(ok, html) { fb.hidden = false; fb.className = 'feedback ' + (ok === true ? 'ok' : ok === false ? 'no' : ''); fb.innerHTML = html; },
    hideFeedback() { fb.hidden = true; },
  };
  box.append(fb);
  return api;
}
