"""9장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch09/make_figs.py -> chapters/ch09/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 9.1.2, 9.4.3, 9.6.2, 9.7.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'

# 1. 질량 중심: x축 위 두 입자(m2가 더 무거움)와 질량 중심(교재 그림 9.1.2)
Y, O, x1, x2, m1, m2 = 110, 60, 150, 410, 1.0, 2.5
xc = (m1 * x1 + m2 * x2) / (m1 + m2)
b = [line(30, Y, 500, Y, INK, 1.5, 'ink'), text(506, Y + 6, it('x'), 'start', size=18),
     line(O, Y - 6, O, Y + 6, INK, 1.5), text(O, Y + 26, '0', size=14, c=NOTE),
     circle(x1, Y, 11), text(x1, Y - 22, it('m', '1'), size=18), line(x1, Y + 14, x1, Y + 22, INK, 1), text(x1, Y + 40, it('x', '1'), size=17),
     circle(x2, Y, 19), text(x2, Y - 30, it('m', '2'), size=18), line(x2, Y + 22, x2, Y + 30, INK, 1), text(x2, Y + 48, it('x', '2'), size=17),
     circle(xc, Y, 9, '#ffffff', CRIMSON, 2.5), line(xc - 9, Y, xc + 9, Y, CRIMSON, 2), line(xc, Y - 9, xc, Y + 9, CRIMSON, 2),
     text(xc, Y - 22, 'com', c=CRIMSON, size=16, weight=600), text(xc, Y + 40, it('x', 'com'), size=17, c=CRIMSON)]
svg(OUT, 'f1_com', 530, 170, b)

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
