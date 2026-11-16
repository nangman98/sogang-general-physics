// 장 페이지의 data-tex 요소를 KaTeX로 그린다. class="eq-tex"는 가운데 정렬 식, 나머지는 글 속 식이다.
// 가운데 식이 칸보다 넓으면 끌어서 보게 하지 않고 글자 크기를 줄여 맞춘다(사용자 기준 2026-11-04).
import katex from '../vendor/katex/katex.mjs';

for (const el of document.querySelectorAll('[data-tex]')) {
  katex.render(el.dataset.tex, el, { displayMode: el.classList.contains('eq-tex'), throwOnError: true, output: 'html' });
}

function fit() {
  for (const el of document.querySelectorAll('.eq-tex')) {
    const k = el.querySelector('.katex');
    k.style.fontSize = '';
    const need = k.scrollWidth, room = el.clientWidth;
    if (need > room) k.style.fontSize = `${(1.6 * room / need).toFixed(3)}em`;  // 1.6em은 chapter.css의 가운데 식 크기
  }
}
fit();
document.fonts?.ready.then(fit);
addEventListener('resize', fit);

// 방향키로 페이지를 넘긴다(사용자 요청 2026-11-16). →는 아래 "다음 →" 링크(이론 → 시뮬레이션),
// ←는 맨 위 "←" 링크(시뮬레이션 → 이론, 이론 → 목차). slider나 입력 칸을 잡고 있을 때는 그 칸이 키를 쓴다.
addEventListener('keydown', ev => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.defaultPrevented) return;
  if (ev.target.closest?.('input, select, textarea, [contenteditable]')) return;
  const link = ev.key === 'ArrowRight' ? document.querySelector('.next a') : ev.key === 'ArrowLeft' ? document.querySelector('a.back') : null;
  if (link) { ev.preventDefault(); location.href = link.href; }
});
