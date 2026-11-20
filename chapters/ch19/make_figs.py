"""19장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch19/make_figs.py -> chapters/ch19/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 19.2.2, 19.3.1, 19.6.1, 19.7.4, 19.9.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
HATCH = ('<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
         f'<line x1="0" y1="0" x2="0" y2="7" stroke="{GRAY}" stroke-width="1.4"/></pattern></defs>')
GAS = '#eaf2f9'


def hrect(x, y, w, h):
    """빗금 친 단열재(또는 빗금 친 벽)."""
    return (f'<rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" fill="#f4f4f4"/>'
            f'<rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" fill="url(#hatch)" stroke="{INK}" stroke-width="1.5"/>')


def pv_frame(X, P, vmax, pmax):
    """p-V 도표 좌표 변환. X=(왼쪽, 오른쪽), P=(아래, 위) 화면 좌표."""
    return (lambda v: X[0] + (X[1] - X[0]) * v / vmax), (lambda p: P[0] - (P[0] - P[1]) * p / pmax)


# 2. 압력과 rms 속력: 한 변 L인 정육면체 상자, 빗금 친 벽으로 다가가는 질량 m, 속도 v인 분자와 벽의 법선(교재 그림 19.3.1)
A, S, D = (150, 320), 200, (90, -66)          # 앞면 왼쪽 아래 꼭짓점, 한 변 길이, 깊이 방향 이동
fr = {'A': A, 'B': (A[0] + S, A[1]), 'C': (A[0] + S, A[1] - S), 'Dd': (A[0], A[1] - S)}
bk = {k: (x + D[0], y + D[1]) for k, (x, y) in fr.items()}
wall = [fr['B'], bk['B'], bk['C'], fr['C']]
b = [HATCH,
     poly(wall + [wall[0]], INK, 1.5, fill='url(#hatch)'),
     line(*bk['A'], *bk['B'], GRAY, 1.3, dash='5 4'), line(*bk['A'], *bk['Dd'], GRAY, 1.3, dash='5 4'), line(*bk['A'], *fr['A'], GRAY, 1.3, dash='5 4'),
     poly([fr['A'], fr['B'], fr['C'], fr['Dd'], fr['A']], INK, 2), poly([fr['Dd'], bk['Dd'], bk['C'], fr['C']], INK, 2),
     line(*fr['B'], *bk['B'], INK, 2), line(*bk['B'], *bk['C'], INK, 2)]
M = (232, 196)
cen = (sum(p[0] for p in wall) / 4, sum(p[1] for p in wall) / 4)
b += [line(*cen, cen[0] + 110, cen[1], GRAY, 1.6, 'gray', dash='6 4'), text(cen[0] + 114, cen[1] - 10, '법선', 'start', size=15, c=NOTE),
      line(M[0] + 12, M[1] - 3, M[0] + 92, M[1] - 22, VEL, 3, 'v'), text(M[0] + 96, M[1] - 30, V('v'), 'start', VEL, 19),
      circle(*M, 10, '#ffffff', INK, 1.8), text(M[0] - 2, M[1] + 30, it('m'), size=18),
      text(A[0] + S / 2, A[1] + 26, it('L'), size=18), text(A[0] - 12, A[1] - S / 2 + 6, it('L'), 'end', size=18),
      text(fr['B'][0] + D[0] / 2 + 12, fr['B'][1] + D[1] / 2 + 14, it('L'), 'start', size=18)]
T0 = (52, 150)
b += [line(*T0, T0[0] + 54, T0[1], INK, 1.5, 'ink'), line(*T0, T0[0], T0[1] - 54, INK, 1.5, 'ink'), line(*T0, T0[0] - 30, T0[1] + 30, INK, 1.5, 'ink'),
      text(T0[0] + 62, T0[1] + 6, it('x'), 'start', size=17), text(T0[0], T0[1] - 62, it('y'), size=17), text(T0[0] - 36, T0[1] + 46, it('z'), size=17)]
svg(OUT, 'f2_box', 560, 360, b)

# 3. 분자 속력 분포: (a) P(v)와 v_P, v_avg, v_rms, 넓이 P(v)dv인 띠 (b) 두 온도의 곡선(교재 그림 19.6.1). 넓이는 모두 1
Pm = lambda u, s=1.0: math.sqrt(2 / math.pi) * (u / s) ** 2 * math.exp(-(u / s) ** 2 / 2) / s   # u = v/sqrt(RT0/M), s = sqrt(T/T0)
O = (45, 250)
UX, PY = 94, 300                                # 가로 1단위, 세로 1단위의 화면 길이
X = lambda u: O[0] + UX * u
Y = lambda p, py=PY: O[1] - py * p
PV = f'{it("P")}({it("v")})'
us = [3.3 * i / 120 for i in range(121)]
b = [*axes(O[0], O[1], X(3.25), 30, it('v'), '', 18), text(O[0] + 10, 40, PV, 'start', size=20), text(4, 40, '(a)', 'start', size=16)]
u0, du = 2.15, 0.12
strip = [(X(u0), O[1])] + [(X(u0 + du * i / 6), Y(Pm(u0 + du * i / 6))) for i in range(7)] + [(X(u0 + du), O[1])]
b += [poly(strip, 'none', 0, fill=CRIMSON, op=0.35), poly([(X(u), Y(Pm(u))) for u in us], CRIMSON, 2.8)]
for u, lab, row, anc in ((math.sqrt(2), it('v', 'P'), 0, 'middle'), (math.sqrt(8 / math.pi), it('v', 'avg'), 1, 'middle'), (math.sqrt(3), it('v', 'rms'), 0, 'start')):
    b += [line(X(u), Y(Pm(u)), X(u), O[1] + 6 + 22 * row, GRAY, 1.3, dash='4 3')]
    b += [text(X(u) + (-4 if anc == 'start' else 0), O[1] + 26 + 24 * row, lab, anc, size=21)]
b += [text(X(u0 + du) + 22, Y(Pm(u0)) - 44, f'넓이 {PV} {it("dv")}', 'start', size=17, c=CRIMSON),
      line(X(u0 + du) + 26, Y(Pm(u0)) - 38, X(u0 + du / 2) + 4, Y(Pm(u0)) + 14, CRIMSON, 1.3, 'c')]
O2, UX2 = (420, 250), 48
X2 = lambda u: O2[0] + UX2 * u
b += [*axes(O2[0], O2[1], X2(4.3), 30, it('v'), '', 18), text(O2[0] + 10, 40, PV, 'start', size=20), text(380, 40, '(b)', 'start', size=16)]
for s, c, lab in ((0.6, VEL, f'낮은 {it("T")}'), (1.25, FORCE, f'높은 {it("T")}')):
    uu = [4.2 * i / 140 for i in range(141)]
    b += [poly([(X2(u), Y(Pm(u, s), 170)) for u in uu], c, 2.6)]
    up = math.sqrt(2) * s
    b += [text(X2(up) + (10 if s < 1 else 30), Y(Pm(up, s), 170) + (4 if s < 1 else -10), lab, 'start', c, 17)]
svg(OUT, 'f3_speeds', 640, 320, b)

# 5. 단열 팽창: (a) 단열 받침 위 단열 실린더, 피스톤 위 납 알갱이를 덜어 냄 (b) 등온선들을 가로지르는 단열선 i -> f(교재 그림 19.9.1)
b = [HATCH,
     hrect(20, 286, 190, 22),                                     # 단열 받침
     hrect(40, 92, 18, 194), hrect(172, 92, 18, 194), hrect(58, 268, 114, 18),   # 단열 벽과 바닥
     f'<rect x="58" y="160" width="114" height="108" fill="{GAS}"/>',
     box(58, 146, 114, 14, '#bdbdbd')]
for i, cx in enumerate(range(66, 168, 12)):                        # 피스톤 위 납 알갱이 두 줄
    b += [circle(cx, 140, 5.5, '#7a7a7a', INK, 1)]
    if i % 2 == 0 and cx < 160:
        b += [circle(cx + 6, 131, 5.5, '#7a7a7a', INK, 1)]
b += [circle(150, 92, 5.5, '#7a7a7a', INK, 1), circle(162, 86, 5.5, '#7a7a7a', INK, 1),
      line(156, 120, 156, 64, INK, 1.5, 'ink'),
      text(115, 222, '기체', size=16, c=NOTE), text(115, 332, '단열', size=16, c=NOTE),
      text(20, 70, '납 알갱이를 덜어 냄', 'start', size=16, c=NOTE), text(4, 40, '(a)', 'start', size=16)]
O = (270, 300)
xs, ys = pv_frame((O[0], 600), (O[1], 40), 4.2, 2.6)
b += [*axes(O[0], O[1], 618, 30, it('V'), '', 19), text(O[0] + 10, 40, it('p'), 'start', size=19), text(232, 40, '(b)', 'start', size=16)]
TH, TM, TL, g = 2.0, 1.5, 1.0, 5 / 3
for T, v0, lab, anc, dx in ((TH, 0.8, f'높은 {it("T")}', 'start', 10), (TM, 1.0, '', '', 0), (TL, 1.0, f'낮은 {it("T")}', 'end', -8)):
    vs = [v0 + (4.0 - v0) * i / 80 for i in range(81)]
    b += [poly([(xs(v), ys(T / v)) for v in vs], GRAY, 1.6)]
    if lab:
        b += [text(xs(v0) + dx, ys(T / v0) + 6, lab, anc, size=16, c=NOTE)]
Vi = 1.15
Vf = Vi * (TH / TL) ** (1 / (g - 1))
pi_ = TH / Vi
ad = [(xs(v), ys(pi_ * (Vi / v) ** g)) for v in [Vi + (Vf - Vi) * i / 60 for i in range(61)]]
b += [poly(ad, CRIMSON, 3.5), line(*ad[20], *ad[23], CRIMSON, 3.5, 'c'), dot(*ad[0], 6, CRIMSON), dot(*ad[-1], 6, CRIMSON),
      text(ad[0][0] - 10, ad[0][1] + 4, it('i'), 'end', size=19), text(ad[-1][0] - 8, ad[-1][1] + 20, it('f'), 'end', size=19),
      line(462, 64, 494, 64, CRIMSON, 3.5), text(502, 70, '단열선', 'start', size=16),
      line(462, 92, 494, 92, GRAY, 1.6), text(502, 98, '등온선', 'start', size=16)]
svg(OUT, 'f5_adiabatic', 640, 345, b)
