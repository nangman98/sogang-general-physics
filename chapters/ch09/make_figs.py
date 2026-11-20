"""9장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch09/make_figs.py -> chapters/ch09/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 9.1.2, 9.4.3, 9.6.2, 9.7.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'

# 2. 충격량: 충돌 동안의 힘 F(t), 곡선 아래 넓이가 J, 같은 넓이의 직사각형 높이가 F_avg(교재 그림 9.4.3)
O, ti, tf, Fm = (60, 250), 130, 350, 170
curve = [(ti + (tf - ti) * k / 80, O[1] - Fm * math.sin(math.pi * k / 80) ** 2) for k in range(81)]
favg = O[1] - Fm / 2
b = [poly(curve + [(tf, O[1]), (ti, O[1])], 'none', 0, fill=FORCE, op=0.18), poly(curve, FORCE, 2.5),
     f'<rect x="{ti}" y="{favg:.1f}" width="{tf - ti}" height="{O[1] - favg:.1f}" fill="none" stroke="{GRAY}" stroke-width="1.5" stroke-dasharray="5 4"/>',
     line(O[0], favg, ti, favg, GRAY, 1, dash='3 4'), text(O[0] - 8, favg + 5, it('F', 'avg'), 'end', size=16),
     text((ti + tf) / 2, O[1] - Fm * 0.3, f'넓이 = {it("J")}', size=16, c=FORCE),
     *axes(O[0], O[1], 430, 40, it('t'), it('F')),
     line(ti, O[1], ti, O[1] + 8, INK, 1.5), line(tf, O[1], tf, O[1] + 8, INK, 1.5),
     text(ti, O[1] + 26, it('t', 'i'), size=16), text(tf, O[1] + 26, it('t', 'f'), size=16),
     line(ti + 4, O[1] + 40, tf - 4, O[1] + 40, INK, 1.2, 'ink').replace('/>', ' marker-start="url(#m-ink)"/>'), text((ti + tf) / 2, O[1] + 58, f'Δ{it("t")}', size=16)]
svg(OUT, 'f2_impulse', 460, 320, b)

# 3. 1차원 충돌: 충돌 전(물체 2 정지), 완전 비탄성 뒤(붙어서 V), 탄성 뒤(m1 < m2라 물체 1이 되튐)(교재 그림 9.6.2, 9.7.1)
def cart(x, y, w, label):
    return [box(x - w / 2, y - 34, w, 34), text(x, y - 11, label, size=16)]
b = []
for Y, cap in ((70, '충돌 전'), (175, '완전 비탄성 충돌 뒤'), (280, '탄성 충돌 뒤')):
    b += [line(30, Y, 570, Y, INK, 1.5), text(30, Y - 48, cap, 'start', size=14, c=NOTE)]
b += cart(150, 70, 44, it('m', '1')) + cart(360, 70, 60, it('m', '2'))
b += [line(176, 52, 236, 52, VEL, 2.5, 'v'), text(244, 57, it('v', '1i'), 'start', VEL, 17), text(360, 98, '정지', size=13, c=NOTE)]
b += cart(388, 175, 44, it('m', '1')) + cart(440, 175, 60, it('m', '2'))
b += [line(474, 157, 506, 157, VEL, 2.5, 'v'), text(512, 162, V('V'), 'start', VEL, 17)]
b += cart(250, 280, 44, it('m', '1')) + cart(450, 280, 60, it('m', '2'))
b += [line(226, 262, 196, 262, VEL, 2.5, 'v'), text(190, 267, it('v', '1f'), 'end', VEL, 17),
      line(484, 262, 528, 262, VEL, 2.5, 'v'), text(534, 267, it('v', '2f'), 'start', VEL, 17)]
svg(OUT, 'f3_collision', 600, 300, b)

# 4. 2차원 충돌: 정지한 물체 2에 비스듬히 부딪힌 물체 1(위)과 운동량 벡터 합(아래). P1f + P2f = P1i(교재 그림 9.8.1)
#    질량이 같은 탄성 충돌이면 theta1 + theta2 = 90도여서 두 나중 운동량은 P1i cos theta 크기다.
T1, T2, PL = 35, 55, 230
O = (200, 200)
d = lambda deg, r, s=1: (O[0] + r * math.cos(math.radians(deg)), O[1] - s * r * math.sin(math.radians(deg)))
b = [line(30, O[1], 380, O[1], GRAY, 1, dash='5 5'), line(O[0] - 150, O[1], O[0] - 22, O[1], GRAY, 1.5, dash='3 4'),
     circle(O[0] - 150, O[1], 13), text(O[0] - 150, O[1] + 5, '1', size=13),
     line(O[0] - 132, O[1] - 26, O[0] - 72, O[1] - 26, VEL, 2.5, 'v'), text(O[0] - 66, O[1] - 21, V('v', '1i'), 'start', VEL, 17),
     circle(*O, 13, fill='#ffffff', stroke=GRAY), text(O[0], O[1] + 34, '2 (정지)', size=13, c=NOTE)]
p1, p2 = d(-T1, 120), d(T2, 120)
b += [line(*O, *p1, GRAY, 1.5, dash='3 4'), line(*O, *p2, GRAY, 1.5, dash='3 4'),
      circle(*p1, 13), text(p1[0], p1[1] + 5, '1', size=13), circle(*p2, 13), text(p2[0], p2[1] + 5, '2', size=13),
      line(*d(-T1, 140), *d(-T1, 190), VEL, 2.5, 'v'), text(*d(-T1 - 8, 200), V('v', '1f'), 'start', VEL, 17),
      line(*d(T2, 140), *d(T2, 190), VEL, 2.5, 'v'), text(*d(T2 + 6, 200), V('v', '2f'), 'end', VEL, 17),
      arc(*O, 52, -T1, 0, INK, 1.2), text(*d(-T1 / 2, 70), it('θ', '1'), size=16),
      arc(*O, 40, 0, T2, INK, 1.2), text(*d(T2 / 2, 58), it('θ', '2'), size=16)]
Q = (80, 377)
q1 = (Q[0] + PL * math.cos(math.radians(T1)) * math.cos(math.radians(T1)), Q[1] + PL * math.cos(math.radians(T1)) * math.sin(math.radians(T1)))
b += [line(*Q, Q[0] + PL, Q[1], CRIMSON, 3, 'c'), text(Q[0] + PL / 2, Q[1] - 12, V('P', '1i'), size=18, c=CRIMSON),
      line(*Q, *q1, VEL, 2.5, 'v'), text((Q[0] + q1[0]) / 2 - 12, (Q[1] + q1[1]) / 2 + 22, V('P', '1f'), 'end', VEL, 17),
      line(*q1, Q[0] + PL, Q[1], ACC, 2.5, 'a'), text((q1[0] + Q[0] + PL) / 2 + 14, (q1[1] + Q[1]) / 2 + 12, V('P', '2f'), 'start', ACC, 17)]
svg(OUT, 'f4_collision2d', 410, 515, b)
