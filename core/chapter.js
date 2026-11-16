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
    if (need > room) k.style.fontSize = `${(1.21 * room / need).toFixed(3)}em`;
  }
}
fit();
document.fonts?.ready.then(fit);
addEventListener('resize', fit);
