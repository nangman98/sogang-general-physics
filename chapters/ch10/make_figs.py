"""10장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch10/make_figs.py -> chapters/ch10/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 10.1.5, 10.3.1, 10.6.1, 10.4.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
DISK = '#ececec'
pt = lambda c, r, a: (c[0] + r * math.cos(math.radians(a)), c[1] - r * math.sin(math.radians(a)))

# 1. 등각가속도 회전: 기준선이 각 theta만큼 돌아간 원판과 theta(t) 포물선, omega(t) 직선(교재 그림 10.1.5)
C, R, TH = (150, 170), 105, 50
b = [circle(*C, R, DISK), line(*C, *pt(C, R + 22, 0), GRAY, 1.5, dash='5 4'), line(*C, *pt(C, R, TH), CRIMSON, 3), dot(*C, 5),
     arc(*C, 38, 0, TH), text(*pt(C, 54, TH / 2), it('θ'), size=19),
     arc(*C, R + 14, 15, 75, VEL, 2.5, 'v'), text(*pt(C, R + 34, 50), it('ω'), size=19, c=VEL),
     text(C[0], 312, '반시계 방향이 +', size=13, c=NOTE)]
GL, GR, H = 350, 580, 105
for k, (name, color, f) in enumerate((('θ', CRIMSON, lambda t: 0.6 + t + 0.5 * t * t), ('ω', VEL, lambda t: 1 + t))):
    top = 30 + k * (H + 45)
    vmax = 9.2 if k == 0 else 4.6
    b += [*axes(GL, top + H, GR + 10, top - 6, it('t'), it(name)),
          poly([(GL + (GR - GL) * i / 60, top + H - H * f(3 * i / 60) / vmax) for i in range(61)], color, 2.5)]
svg(OUT, 'f1_rotation', 610, 325, b)

# 2. 선변수와 각변수: 같은 원판 위 반지름이 다른 두 점과 접선 방향 속도(교재 그림 10.3.1)
C, R, A = (190, 200), 135, 25
b = [circle(*C, R, DISK), dot(*C, 5), line(*C, *pt(C, R, A), GRAY, 1.5),
     arc(*C, R + 14, 60, 110, VEL, 2.5, 'v'), text(*pt(C, R + 34, 85), it('ω'), size=19, c=VEL)]
for r, lab in ((65, '1'), (125, '2')):
    P = pt(C, r, A)
    tdir = (-math.sin(math.radians(A)), -math.cos(math.radians(A)))
    L = 0.55 * r
    b += [dot(*P, 6, INK), line(*P, P[0] + L * tdir[0], P[1] + L * tdir[1], VEL, 3, 'v'),
          text(P[0] + L * tdir[0] - 6, P[1] + L * tdir[1] - 6, it('v', lab), 'end', VEL, 18),
          text(P[0] + 4, P[1] + 22, it('r', lab), 'start', size=17)]
svg(OUT, 'f2_linear_angular', 380, 350, b)

# 3. 돌림힘: 축 O에서 r만큼 떨어진 점 P에 각 phi로 작용하는 힘, 접선 성분 F_t와 모멘트 팔 r_perp(교재 그림 10.6.1)
O, rlen, al, ph, Flen = (90, 280), 300, 20, 60, 130
P = pt(O, rlen, al)
u = (math.cos(math.radians(al + ph)), -math.sin(math.radians(al + ph)))
Fe = (P[0] + Flen * u[0], P[1] + Flen * u[1])
tdir = (math.cos(math.radians(al + 90)), -math.sin(math.radians(al + 90)))
Ft = (P[0] + Flen * math.sin(math.radians(ph)) * tdir[0], P[1] + Flen * math.sin(math.radians(ph)) * tdir[1])
s = (O[0] - P[0]) * u[0] + (O[1] - P[1]) * u[1]
Q = (P[0] + s * u[0], P[1] + s * u[1])
b = [line(*O, *pt(O, rlen + 40, al), LIGHT, 14), line(*Q, *P, GRAY, 1.2, dash='5 4'), line(*O, *Q, INK, 1.5),
     text((O[0] + Q[0]) / 2 + 8, (O[1] + Q[1]) / 2 + 20, it('r', '⊥'), size=18),
     line(*O, *P, INK, 2, 'ink'), text(*pt(O, rlen / 2, al + 6), it('r'), size=19),
     line(*P, *Fe, FORCE, 3, 'f'), text(Fe[0] + 6, Fe[1] + 4, V('F'), 'start', FORCE, 19),
     line(*P, *Ft, FORCE, 2.5, 'f', dash='6 4'), text(Ft[0] - 6, Ft[1], V('F', 't'), 'end', FORCE, 18),
     line(*P, *pt(P, 70, al), GRAY, 1.2, dash='3 4'), arc(*P, 34, al, al + ph), text(*pt(P, 48, al + ph / 2), it('ϕ'), size=18),
     circle(*O, 7, '#ffffff', INK, 2), text(O[0] - 12, O[1] + 22, 'O', size=16)]
svg(OUT, 'f3_torque', 560, 340, b)

# 4. 회전 관성: 같은 두 질량을 축 가까이(작은 I) 또는 멀리(큰 I) 둔 가벼운 막대, 같은 돌림힘(교재 그림 10.4.1 대신 입자 두 개)
b = []
for cx, r, cap in ((160, 40, f'작은 {it("I")}, 큰 {it("α")}'), (440, 100, f'큰 {it("I")}, 작은 {it("α")}')):
    Y = 120
    b += [line(cx, 76, cx, 200, GRAY, 1.2, dash='5 4'), line(cx - 120, Y, cx + 120, Y, INK, 4),
          circle(cx - r, Y, 13), circle(cx + r, Y, 13),
          line(cx, Y + 26, cx + r, Y + 26, INK, 1.2, 'ink'), text(cx + r / 2, Y + 46, it('r'), size=17),
          arc(cx, Y, 52, 50, 130, FORCE, 2.5, 'f'), text(cx, Y - 62, it('τ'), 'middle', FORCE, 19),
          text(cx, 225, cap, size=15)]
svg(OUT, 'f4_inertia', 600, 240, b)
