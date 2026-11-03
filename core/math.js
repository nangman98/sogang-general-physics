// KaTeX 0.19.0 helpers (vendor/katex). Output htmlAndMathml keeps the equations readable by screen readers.
import katex from '../vendor/katex/katex.mjs';

export function tex(src, { display = false } = {}) {
  return katex.renderToString(src, { output: 'htmlAndMathml', throwOnError: false, displayMode: display });
}
