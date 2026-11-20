"""13장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch13/make_figs.py -> chapters/ch13/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 13.1.2, 13.4.1, 13.5.2, 13.6.2를 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
EARTH, INNER, SUN = '#e6eef5', '#cbdbe8', '#E69F00'
pt = lambda c, r, a: (c[0] + r * math.cos(math.radians(a)), c[1] - r * math.sin(math.radians(a)))
HAT = lambda s: f'<tspan {SYM} font-weight="700">{s}&#770;</tspan>'


def dim(x1, y1, x2, y2, c=INK, w=1.2):
    """양쪽 화살촉이 있는 치수선."""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    return [line(mx, my, x1, y1, c, w, 'ink'), line(mx, my, x2, y2, c, w, 'ink')]


# 4. 케플러 법칙: 한 초점 F에 태양을 둔 타원 궤도, 빈 초점 F', 긴반지름 a, ea, 근일점 거리 R_p, 원일점 거리 R_a(교재 그림 13.6.2)
C, A, E = (280, 190), 220, 0.7
B, c = A * math.sqrt(1 - E * E), A * E
L, Rt, F, F2 = C[0] - A, C[0] + A, C[0] + c, C[0] - c
Pm = (C[0] + A * math.cos(math.radians(118)), C[1] - B * math.sin(math.radians(118)))
YD = C[1] + B + 30
b = [f'<ellipse cx="{C[0]}" cy="{C[1]}" rx="{A}" ry="{B:.1f}" fill="none" stroke="{INK}" stroke-width="2"/>',
     line(L, C[1], Rt, C[1], GRAY, 1.2, dash='5 4'), dot(*C, 3, GRAY),
     *dim(L, C[1] - 22, C[0], C[1] - 22), text((L + C[0]) / 2, C[1] - 32, it('a'), size=18),
     *dim(C[0], C[1] - 22, F, C[1] - 22), text((C[0] + F) / 2, C[1] - 32, it('ea'), size=18),
     circle(F, C[1], 14, SUN, INK, 1.2), text(F, C[1] + 36, it('F'), size=18),
     dot(F2, C[1], 4), text(F2, C[1] + 26, it('F') + '′', size=18),
     circle(*Pm, 9, VEL, INK, 1.2), text(Pm[0] - 14, Pm[1] - 10, it('m'), 'end', size=18),
     *[line(x, C[1] + 8 if x != F else C[1] + 44, x, YD + 8, GRAY, 1, dash='3 3') for x in (L, F, Rt)],
     *dim(L, YD, F, YD), text((L + F) / 2, YD + 22, it('R', 'a'), size=18),
     *dim(F, YD, Rt, YD), text((F + Rt) / 2, YD + 22, it('R', 'p'), size=18)]
svg(OUT, 'f4_kepler', 560, YD + 36, b)
