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


# 1. 뉴턴의 중력 법칙: 두 입자와 입자 1에 작용하는 끌힘 F, 입자 1에서 입자 2로 뻗은 r 축과 단위벡터 r-hat(교재 그림 13.1.2)
P1, P2, YA, YB = 90, 440, 80, 215
b = [circle(P1, YA, 16), circle(P2, YA, 24),
     text(P1, YA - 26, it('m', '1'), size=18), text(P2, YA - 34, it('m', '2'), size=18),
     line(P1 + 16, YA, 230, YA, FORCE, 3, 'f'), text(172, YA - 12, V('F'), 'middle', FORCE, 19),
     line(P1, YA + 32, P1, YA + 52, GRAY, 1.2), line(P2, YA + 32, P2, YA + 52, GRAY, 1.2),
     *dim(P1, YA + 44, P2, YA + 44), text((P1 + P2) / 2, YA + 68, it('r'), size=18),
     line(P1, YB, 575, YB, GRAY, 1.5, 'gray'), text(583, YB + 6, it('r'), 'start', size=18),
     circle(P1, YB, 16), circle(P2, YB, 24),
     line(P1 + 16, YB, 160, YB, INK, 3, 'ink'), text(130, YB - 14, HAT('r'), 'middle', size=19),
     text(300, YB + 42, '입자 1에서 입자 2로 뻗은 축', size=15, c=NOTE)]
svg(OUT, 'f1_gravitation', 610, 275, b)

# 2. 지구 안의 중력: 남극과 북극을 잇는 터널 속 캡슐과 반지름 r 안쪽 질량 M_ins(교재 그림 13.4.1)
C, R, r = (220, 212), 168, 92
b = [circle(*C, R, EARTH), circle(*C, r, INNER, GRAY, 1.5).replace('/>', ' stroke-dasharray="6 5"/>'),
     box(C[0] - 9, C[1] - R, 18, 2 * R, '#ffffff').replace('stroke-width="1.5"', 'stroke-width="1.2"'),
     dot(*C, 4),
     f'<rect x="{C[0] - 7}" y="{C[1] - r - 9}" width="14" height="18" rx="4" fill="{GRAY}" stroke="{INK}" stroke-width="1.2"/>',
     text(C[0] + 16, C[1] - r - 2, it('m'), 'start', size=18),
     line(C[0], C[1] - r + 12, C[0], C[1] - r + 52, FORCE, 3, 'f'), text(C[0] + 16, C[1] - r + 46, V('F'), 'start', FORCE, 19),
     line(C[0] - 26, C[1] - r, C[0] - 13, C[1] - r, GRAY, 1.2), line(C[0] - 26, C[1], C[0] - 13, C[1], GRAY, 1.2),
     *dim(C[0] - 20, C[1], C[0] - 20, C[1] - r), text(C[0] - 28, C[1] - r / 2 + 6, it('r'), 'end', size=18),
     text(C[0] + 46, C[1] + 44, it('M', 'ins'), 'middle', size=18),
     line(*C, *pt(C, R, 215), GRAY, 1.5), text(*pt(C, 0.62 * R, 228), it('R'), size=18),
     text(C[0], C[1] - R - 10, '북극', size=14, c=NOTE), text(C[0], C[1] + R + 22, '남극', size=14, c=NOTE)]
svg(OUT, 'f2_inside', 440, 410, b)

# 3. 탈출 속력: 지구 중심에서 곧장 멀어지게 쏜 공, 지름 방향 r 축 위 중력 F와 변위 dr(교재 그림 13.5.2)
C, R, BX = (120, 150), 100, 410
b = [circle(*C, R, EARTH), line(*C, 590, C[1], GRAY, 1.5, 'gray'), text(598, C[1] + 6, it('r'), 'start', size=18),
     dot(*C, 4), text(C[0] - 8, C[1] + 26, it('M'), size=18),
     line(*C, *pt(C, R, 125), GRAY, 1.5), text(*pt(C, 0.5 * R, 145), it('R'), size=18),
     circle(BX, C[1], 12), text(BX, C[1] + 36, it('m'), size=18),
     line(BX - 12, C[1], BX - 84, C[1], FORCE, 3, 'f'), text(BX - 50, C[1] - 14, V('F'), 'middle', FORCE, 19),
     line(BX + 12, C[1], BX + 70, C[1], INK, 2.5, 'ink'), text(BX + 42, C[1] - 14, it('d') + V('r'), 'middle', size=19),
     text(C[0], C[1] + R + 28, '천체', size=15, c=NOTE)]
svg(OUT, 'f3_escape', 620, 290, b)

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
