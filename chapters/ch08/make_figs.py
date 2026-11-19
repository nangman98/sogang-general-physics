"""8장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch08/make_figs.py -> chapters/ch08/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 8.2.1, 8.3.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'

# 1. 역학적 에너지 보존: 진자의 세 위치와 K, U 막대(교재 그림 8.2.1). 양 끝은 K = 0, 가장 낮은 곳은 U가 가장 작다
P0, L, A = (280, 30), 190, 40
pos = [(-A, 0, 1), (0, 1, 0), (A, 0, 1)]          # (각, K 비율, U 비율), 높이를 가장 낮은 곳 기준으로 잰다
b = [arc(P0[0], P0[1], L, -90 - A, -90 + A, GRAY, 1.5, dash='5 4'), dot(*P0, 5)]
for a, kf, uf in pos:
    x, y = P0[0] + L * math.sin(math.radians(a)), P0[1] + L * math.cos(math.radians(a))
    b += [line(*P0, x, y, GRAY, 1.5), circle(x, y, 14)]
    bx, by, H = x - 18, 300, 56
    b += [f'<rect x="{bx:.1f}" y="{by - H * kf:.1f}" width="14" height="{H * kf:.1f}" fill="{VEL}"/>',
          f'<rect x="{bx + 22:.1f}" y="{by - H * uf:.1f}" width="14" height="{H * uf:.1f}" fill="{FORCE}"/>',
          line(bx - 4, by, bx + 40, by, INK, 1.2), text(bx + 7, by + 20, it('K'), size=16, c=VEL), text(bx + 29, by + 20, it('U'), size=16, c=FORCE)]
svg(OUT, 'f1_pendulum', 560, 330, b)

# 2. 퍼텐셜 에너지 곡선: U(x)와 수평선 E_mec, 되돌이점, 아래에 F(x) = -dU/dx(교재 그림 8.3.1)
U = lambda u: 1.7 + 3.6 * math.exp(-(u / 0.11) ** 2) - 1.0 * math.exp(-((u - 0.22) / 0.09) ** 2) + 1.9 * math.exp(-((u - 0.47) / 0.1) ** 2) - 1.0 * math.exp(-((u - 0.72) / 0.09) ** 2)   # 매끈한 곡선, 우물 둘과 언덕 하나
XL, XR, UT, UB, FT, FB, E = 60, 470, 30, 200, 250, 360, 2.6
X = lambda u: XL + (XR - XL) * u
Yu = lambda v: UB - (UB - UT) * v / 5.5
us = [i / 400 for i in range(401)]
h = 1e-3
F = lambda u: -(U(u + h) - U(u - h)) / (2 * h)
Fmax = max(abs(F(u)) for u in us)
Yf = lambda v: (FT + FB) / 2 - (FB - FT) / 2 * v / Fmax
turn = [u for u in (us[i] for i in range(1, 401)) if (U(us[us.index(u) - 1]) - E) * (U(u) - E) <= 0][:2]   # 첫 우물의 두 되돌이점
b = [*axes(XL, UB, XR + 14, UT - 6, it('x'), it('U')), poly([(X(u), Yu(U(u))) for u in us], CRIMSON, 2.5),
     line(XL, Yu(E), XR, Yu(E), INK, 1.5, dash='6 4'), text(XR + 4, Yu(E) + 5, it('E', 'mec'), 'start', size=16)]
for u in turn:
    b += [dot(X(u), Yu(E), 5, INK), line(X(u), Yu(E), X(u), FB, GRAY, 1, dash='3 4')]
b += [*axes(XL, (FT + FB) / 2, XR + 14, FT - 8, it('x'), it('F')), poly([(X(u), Yf(F(u))) for u in us], FORCE, 2.5)]
svg(OUT, 'f2_potential_curve', 540, 380, b)
