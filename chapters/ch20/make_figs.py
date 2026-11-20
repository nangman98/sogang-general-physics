"""20장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch20/make_figs.py -> chapters/ch20/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 20.1.5, 20.2.2, 20.2.3, 20.3.1, 20.4.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
HATCH = ('<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
         f'<line x1="0" y1="0" x2="0" y2="7" stroke="{GRAY}" stroke-width="1.4"/></pattern></defs>')
HOT, COLD, MIX = '#f6d3bb', '#cfe2f1', '#e3d6e6'      # 따뜻함(주황 계열), 차가움(파랑 계열), 같은 온도


def hrect(x, y, w, h):
    """빗금 친 단열재."""
    return (f'<rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" fill="#f4f4f4"/>'
            f'<rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" fill="url(#hatch)" stroke="{INK}" stroke-width="1.5"/>')


def insul_box(x, y, w, h, t=12):
    """두께 t인 단열 벽으로 둘러싼 상자. 안쪽은 흰색."""
    return [hrect(x, y, w, h), f'<rect x="{f1(x + t)}" y="{f1(y + t)}" width="{f1(w - 2 * t)}" height="{f1(h - 2 * t)}" fill="#ffffff" stroke="{INK}" stroke-width="1.2"/>']


def fill_rect(x, y, w, h, fill):
    return f'<rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" fill="{fill}" stroke="{INK}" stroke-width="1.5"/>'


def mid_arrow(pts, c=INK, w=2.5, m='ink', k=0.5):
    """꺾은선 pts의 k 위치에 방향 화살촉을 단다."""
    i = max(1, min(len(pts) - 1, int(len(pts) * k)))
    return line(*pts[i - 1], *pts[i], c, w, m)


# 1. 엔트로피 변화: 단열 상자 속 두 구리 토막 L, R. (a) 칸막이로 나뉜 따뜻한 L과 차가운 R (b) 칸막이를 치운 뒤 같은 온도 T_f(교재 그림 20.1.5)
b = [HATCH]
for X0, tag in ((10, 'a'), (360, 'b')):
    b += insul_box(X0, 40, 240, 160)
    for bx, lab, Tlab, fill, note in ((X0 + 32, 'L', it('T', 'iL'), HOT, '따뜻함'), (X0 + 138, 'R', it('T', 'iR'), COLD, '차가움')):
        if tag == 'b':
            Tlab, fill, note = it('T', 'f'), MIX, ''
        b += [fill_rect(bx, 92, 70, 60, fill), text(bx + 35, 128, lab, size=19, weight=700),
              text(bx + 35, 82, Tlab, size=19)]
        if note:
            b += [text(bx + 35, 177, note, size=15, c=NOTE)]
    b += [text(X0 + 120, 226, f'({tag})', size=16)]
b += [hrect(125, 52, 10, 136), text(130, 26, '칸막이', size=15, c=NOTE), line(130, 31, 130, 50, GRAY, 1.2),
      text(480, 26, '단열', size=15, c=NOTE), line(480, 31, 480, 40, GRAY, 1.2),
      line(262, 122, 346, 122, CRIMSON, 3, 'c'), text(304, 108, '되돌릴 수 없는', size=15, c=CRIMSON), text(304, 147, '과정', size=15, c=CRIMSON)]
svg(OUT, 'f1_blocks', 610, 240, b)

# 2. 카르노 기관: (a) p-V 도표의 카르노 순환 abcda와 순환 넓이 W (b) 같은 순환의 T-S 도표(교재 그림 20.2.2, 20.2.3)
# 모양 그림이다. 등온선은 p = nRT/V로 그리고 단열선은 순환 넓이가 보이도록 지수 GD로 등온선보다 가파르게 그렸다(실제 기체의 γ보다 크다).
GD, TH, TL = 2.5, 1.8, 1.0
Va, Vb = 1.0, 1.8
Vd, Vc = Va * (TH / TL) ** (1 / (GD - 1)), Vb * (TH / TL) ** (1 / (GD - 1))
pa, pc = TH / Va, TL / Vc
V0, V1 = Va - 0.25 * (Vc - Va), Vc + 0.12 * (Vc - Va)
P0, P1 = pc - 0.32 * (pa - pc), pa + 0.06 * (pa - pc)
O = (40, 300)
xs = lambda v: O[0] + 300 * (v - V0) / (V1 - V0)       # 축 원점은 V = 0, p = 0이 아니다(숫자 없는 모양 그림)
ys = lambda p: O[1] - 255 * (p - P0) / (P1 - P0)
seg = lambda f, v0, v1, n=40: [(xs(v0 + (v1 - v0) * i / n), ys(f(v0 + (v1 - v0) * i / n))) for i in range(n + 1)]
iso = lambda T: (lambda v: T / v)
adi = lambda Vr, Pr: (lambda v: Pr * (Vr / v) ** GD)
ab, bc, cd, da = seg(iso(TH), Va, Vb), seg(adi(Vb, TH / Vb), Vb, Vc), seg(iso(TL), Vc, Vd), seg(adi(Vd, TL / Vd), Vd, Va)
cyc = ab + bc[1:] + cd[1:] + da[1:]
P = {k: pts[0] for k, pts in zip('abcd', (ab, bc, cd, da))}
mab, mcd = ab[20], cd[16]
b = [*axes(O[0], O[1], 375, 30, it('V'), '', 19), text(O[0] + 10, 40, it('p'), 'start', size=19), text(2, 40, '(a)', 'start', size=16),
     poly(seg(iso(TH), Vb, V1 - 0.05), GRAY, 1.3, dash='4 4'), text(xs(V1 - 0.05) + 4, ys(TH / (V1 - 0.05)) - 8, it('T', 'H'), 'start', size=17),
     text(P['c'][0] + 8, P['c'][1] + 4, it('T', 'L'), 'start', size=17),
     poly(cyc + [cyc[0]], 'none', 0, fill=FORCE, op=0.18), poly(cyc + [cyc[0]], INK, 2.5)]
b += [mid_arrow(p, k=0.45) for p in (ab, bc, cd, da)]
b += [dot(*P[k], 4.5) for k in 'abcd']
b += [text(P['a'][0] - 8, P['a'][1] + 4, it('a'), 'end', size=19), text(P['b'][0] + 8, P['b'][1] - 6, it('b'), 'start', size=19),
      text(P['c'][0] - 2, P['c'][1] + 24, it('c'), 'middle', size=19), text(P['d'][0] - 8, P['d'][1] + 18, it('d'), 'end', size=19),
      text(xs(1.62), ys(0.8) + 6, it('W'), c=FORCE, size=20),
      line(mab[0] + 40, mab[1] - 46, mab[0] + 5, mab[1] - 7, CRIMSON, 3, 'c'), text(mab[0] + 44, mab[1] - 46, it('Q', 'H'), 'start', CRIMSON, 18),
      line(mcd[0] - 3, mcd[1] + 6, mcd[0] - 18, mcd[1] + 40, CRIMSON, 3, 'c'), text(mcd[0] - 24, mcd[1] + 42, it('Q', 'L'), 'end', CRIMSON, 18)]
O2 = (450, 300)
S1, S2, YH, YL = 495, 610, 110, 220
rect = {'a': (S1, YH), 'b': (S2, YH), 'c': (S2, YL), 'd': (S1, YL)}
b += [*axes(O2[0], O2[1], 650, 30, it('S'), '', 19), text(O2[0] + 10, 40, it('T'), 'start', size=19), text(408, 40, '(b)', 'start', size=16),
      line(O2[0], YH, S1, YH, GRAY, 1.2, dash='4 4'), line(O2[0], YL, S1, YL, GRAY, 1.2, dash='4 4'),
      text(O2[0] - 8, YH + 6, it('T', 'H'), 'end', size=17), text(O2[0] - 8, YL + 6, it('T', 'L'), 'end', size=17),
      poly([rect[k] for k in 'abcda'], INK, 2.5)]
for k0, k1 in ('ab', 'bc', 'cd', 'da'):
    (x0, y0), (x1, y1) = rect[k0], rect[k1]
    b += [line(x0 + 0.3 * (x1 - x0), y0 + 0.3 * (y1 - y0), x0 + 0.4 * (x1 - x0), y0 + 0.4 * (y1 - y0), INK, 2.5, 'ink')]
b += [dot(*rect[k], 4.5) for k in 'abcd']
QX = S1 + 0.7 * (S2 - S1)
b += [text(S1 - 8, YH - 8, it('a'), 'end', size=19), text(S2 + 8, YH - 8, it('b'), 'start', size=19),
      text(S2 + 8, YL + 20, it('c'), 'start', size=19), text(S1 - 8, YL + 20, it('d'), 'end', size=19),
      line(QX, 58, QX, 104, CRIMSON, 3, 'c'), text(QX + 10, 70, it('Q', 'H'), 'start', CRIMSON, 18),
      line(QX, 226, QX, 272, CRIMSON, 3, 'c'), text(QX + 10, 266, it('Q', 'L'), 'start', CRIMSON, 18)]
svg(OUT, 'f2_carnot', 675, 330, b)
