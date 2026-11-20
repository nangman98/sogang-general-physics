"""18장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch18/make_figs.py -> chapters/ch18/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 18.3.2, 18.4.1, 18.5.2, 18.6.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
BRASS, STEEL, HOT, COLD, SLAB = '#ecd393', '#c9cdd2', '#f6d2bd', '#cfe2f3', '#e4e4e4'


# 2. 열의 흡수: 계와 환경의 온도에 따른 열 Q의 방향(교재 그림 18.4.1)
b = []
for k, (rel, qs, d) in enumerate(((' &gt; ', '&lt; 0', -1), (' = ', '= 0', 0), (' &lt; ', '&gt; 0', 1))):
    x0 = 12 + 200 * k
    b += [f'<rect x="{x0}" y="16" width="180" height="176" rx="14" fill="#f4f4f4" stroke="{GRAY}" stroke-width="1.5"/>',
          text(x0 + 12, 42, '환경 ' + it('T', 'E'), 'start', size=17),
          box(x0 + 30, 66, 84, 100, LIGHT), text(x0 + 72, 106, '계', size=17), text(x0 + 72, 134, it('T', 'S'), size=19)]
    if d == -1:
        b.append(line(x0 + 98, 150, x0 + 166, 150, CRIMSON, 3, 'c'))
    elif d == 1:
        b.append(line(x0 + 166, 150, x0 + 98, 150, CRIMSON, 3, 'c'))
    if d:
        b.append(text(x0 + 146, 140, it('Q'), size=19, c=CRIMSON))
    b += [text(x0 + 90, 222, it('T', 'S') + rel + it('T', 'E'), size=18), text(x0 + 90, 250, it('Q') + ' ' + qs, size=18, c=CRIMSON)]
svg(OUT, 'f2_heat', 604, 262, b)

# 3. 열역학 제1법칙: 같은 i와 f를 잇는 여러 경로와 경로 아래 넓이 W(교재 그림 18.5.2 a-d)
AW, AH = 210, 150
b = []


def panel(x0, y0, pts, shade, labels):
    r = []
    if shade:
        r.append(poly(shade + [(shade[-1][0], y0), (shade[0][0], y0)], 'none', 0, fill=CRIMSON, op=0.15))
    r += axes(x0, y0, x0 + AW, y0 - AH, it('V'), it('p'))
    for seg in pts:
        r.append(poly(seg, CRIMSON, 2.5))
        for (xa, ya), (xb, yb) in zip(seg, seg[1:]):
            if math.hypot(xb - xa, yb - ya) > 24:
                mx, my = (xa + xb) / 2, (ya + yb) / 2
                ux, uy = (xb - xa) / math.hypot(xb - xa, yb - ya), (yb - ya) / math.hypot(xb - xa, yb - ya)
                r.append(line(mx - 6 * ux, my - 6 * uy, mx + 6 * ux, my + 6 * uy, CRIMSON, 2.5, 'c'))
    for (x, y, s, dx, dy) in labels:
        r += [dot(x, y, 4.5, INK), text(x + dx, y + dy, it(s), size=17)]
    return r


def curve(xi, yi, xf, yf, n=40):
    return [(xi + (xf - xi) * j / n, yi + (yf - yi) * (1 - (1 - j / n) ** 2.4)) for j in range(n + 1)]


for idx, (x0, y0) in enumerate(((40, 186), (330, 186), (40, 392), (330, 392))):
    xi, yi, xf, yf = x0 + 45, y0 - 100, x0 + 175, y0 - 48
    if idx == 0:
        c = curve(xi, yi, xf, yf)
        b += panel(x0, y0, [c], c, [(xi, yi, 'i', -12, -6), (xf, yf, 'f', 10, -8)])
        b.append(text(x0 + 118, y0 - 14, it('W'), size=18, c=CRIMSON))
    elif idx == 1:
        p = [(xi, yi), (xf, yi), (xf, yf)]
        b += panel(x0, y0, [p], p[:2], [(xi, yi, 'i', -12, -6), (xf, yi, 'a', 10, -6), (xf, yf, 'f', 12, 6)])
        b.append(text(x0 + 110, y0 - 40, it('W'), size=18, c=CRIMSON))
    elif idx == 2:
        p = [(xi, yi), (xi, yf), (xf, yf)]
        b += panel(x0, y0, [p], p[1:], [(xi, yi, 'i', -12, -6), (xf, yf, 'f', 10, -8)])
        b.append(text(x0 + 110, y0 - 14, it('W'), size=18, c=CRIMSON))
    else:
        lo, hi = y0 - 14, y0 - 138
        p1 = [(xi, yi), (xi, lo), (xf, lo), (xf, yf)]
        p2 = [(xi, yi), (xi, hi), (xf, hi), (xf, yf)]
        b += panel(x0, y0, [p1, p2], None,
                   [(xi, yi, 'i', -12, 6), (xf, yf, 'f', 12, 6), (xi, lo, 'c', -12, 2), (xf, lo, 'd', 12, 2),
                    (xi, hi, 'g', -12, 6), (xf, hi, 'h', 12, 6)])
svg(OUT, 'f3_pv_paths', 580, 412, b)
