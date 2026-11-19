"""6장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch06/make_figs.py -> chapters/ch06/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 6.1.1, 6.2.2, 6.3.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'

# 1. 마찰력: 상자를 미는 힘 F와 정지 마찰력, 미는 힘에 대한 마찰력 크기(교재 그림 6.1.1)
O = (330, 250)
b = [line(20, 200, 260, 200, INK, 2), box(110, 140, 80, 60),
     line(40, 162, 106, 162, FORCE, 3, 'f'), text(40, 152, V('F'), 'start', FORCE, 19),
     line(150, 194, 96, 194, FORCE, 3, 'f'), text(96, 222, V('f'), 'middle', FORCE, 19),
     *axes(O[0], O[1], 580, 40, it('F'), it('f')),
     line(O[0], O[1], 460, 120, CRIMSON, 3), line(460, 120, 460, 165, CRIMSON, 3), line(460, 165, 570, 165, CRIMSON, 3),
     line(O[0], 120, 460, 120, GRAY, 1.2, dash='4 4'), line(O[0], 165, 460, 165, GRAY, 1.2, dash='4 4'),
     text(O[0] - 8, 125, it('f', 's,max'), 'end', size=16), text(O[0] - 8, 170, it('f', 'k'), 'end', size=16),
     text(395, 228, '멈춰 있음', size=14, c=NOTE), text(515, 190, '미끄러짐', size=14, c=NOTE)]
svg(OUT, 'f1_friction', 600, 280, b)

# 2. 항력: 떨어지기 시작할 때, 조금 뒤, 종단 속력일 때의 자유물체도(교재 그림 6.2.2)
b = []
for x, d, v, cap in ((90, 0, 14, '떨어지기 시작'), (270, 42, 42, '조금 뒤'), (450, 84, 70, '종단 속력')):
    b += [circle(x, 140, 22), line(x, 140, x, 224, FORCE, 3, 'f'), text(x + 12, 222, V('F', 'g'), 'start', FORCE, 18)]
    if d:
        b += [line(x, 140, x, 140 - d, FORCE, 3, 'f'), text(x + 12, 140 - d + 12, V('D'), 'start', FORCE, 18)]
    b += [line(x - 46, 118, x - 46, 118 + v, VEL, 2.5, 'v'), text(x - 56, 118 + v / 2 + 6, V('v'), 'end', VEL, 18),
          text(x, 270, cap, size=15, c=NOTE)]
svg(OUT, 'f2_drag', 540, 290, b)

# 3. 등속 원운동의 힘: 마찰 없는 수평면에서 줄에 매인 퍽을 위에서 본 그림(교재 그림 6.3.1)
C, R, th = (190, 175), 120, math.radians(30)
P = (C[0] + R * math.cos(th), C[1] - R * math.sin(th))
u_in = ((C[0] - P[0]) / R, (C[1] - P[1]) / R)
tan = (-math.sin(th), -math.cos(th))
b = [circle(C[0], C[1], R, 'none', GRAY, 1.5).replace('/>', ' stroke-dasharray="6 5"/>'), dot(*C),
     line(*C, *P, GRAY, 2), text(C[0] + 0.3 * (P[0] - C[0]) - 4, C[1] + 0.3 * (P[1] - C[1]) - 12, it('R'), size=18),
     line(*P, P[0] + 70 * u_in[0], P[1] + 70 * u_in[1], FORCE, 3, 'f'), text(P[0] + 40 * u_in[0] + 10, P[1] + 40 * u_in[1] + 26, V('T'), 'start', FORCE, 19),
     line(*P, P[0] + 80 * tan[0], P[1] + 80 * tan[1], VEL, 3, 'v'), text(P[0] + 80 * tan[0] - 10, P[1] + 80 * tan[1] + 4, V('v'), 'end', VEL, 19),
     circle(*P, 13), text(C[0], 330, '마찰 없는 수평면을 위에서 본 그림', size=13, c=NOTE)]
svg(OUT, 'f3_circular_force', 380, 345, b)
