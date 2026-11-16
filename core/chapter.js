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
// 이론 쪽(.page.two)은 화면 한 장에 맞춘다(사용자 기준 2026-11-16). 화면이 남으면 글자·줄 간격·식을 한 배율로 키우고
// (최대 1.6배) 넘치면 줄인다(최소 0.85배). 좁은 화면에서는 위아래로 쌓여 스크롤하므로 맞추지 않는다.
const page = document.querySelector('.page.two');
function fitPage() {
  if (!page || innerWidth <= 860) { page?.style.setProperty('--s', '1'); fit(); return; }
  page.style.minHeight = '0';
  const tall = s => { page.style.setProperty('--s', s.toFixed(3)); fit(); return page.offsetHeight > innerHeight; };
  let lo = 0.85, hi = 1.6;
  if (!tall(hi)) lo = hi;
  else for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; if (tall(m)) hi = m; else lo = m; }
  tall(lo);
  page.style.minHeight = '';
}
fitPage();
document.fonts?.ready.then(fitPage);
addEventListener('resize', fitPage);

// 방향키로 페이지를 넘긴다(사용자 요청 2026-11-16). →는 아래 "다음 →" 링크(이론 → 시뮬레이션),
// ←는 맨 위 "←" 링크(시뮬레이션 → 이론, 이론 → 목차). slider나 입력 칸을 잡고 있을 때는 그 칸이 키를 쓴다.
addEventListener('keydown', ev => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.defaultPrevented) return;
  if (ev.target.closest?.('input, select, textarea, [contenteditable]')) return;
  const link = ev.key === 'ArrowRight' ? document.querySelector('.next a') : ev.key === 'ArrowLeft' ? document.querySelector('a.back') : null;
  if (link) { ev.preventDefault(); location.href = link.href; }
});
