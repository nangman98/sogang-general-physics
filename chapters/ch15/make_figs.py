"""15장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch15/make_figs.py -> chapters/ch15/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 15.1.6, 15.4.1, 15.5.2, 15.6.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
sub = lambda s: f'<tspan dy="5" font-size="0.72em" {SYM}>{s}</tspan><tspan dy="-5">​</tspan>'   # 뒤에 빈칸 없는 아래 첨자
sup = lambda s: f'<tspan dy="-8" font-size="0.68em" {SYM}>{s}</tspan><tspan dy="8">​</tspan>'   # 위 첨자

# 1. 단순 조화 운동: phi = 0일 때 x(t), v(t), a(t)를 시간축을 맞춰 위아래로(교재 그림 15.1.6)
XL, XR, AMP, PITCH, TOP = 130, 530, 30, 112, 58
TT = (XR - XL - 20) / 2                                   # 두 주기를 그린다
ts = [i / 200 * 2 for i in range(201)]
X = lambda u: XL + TT * u
b = []
rows = (('x', CRIMSON, lambda u: math.cos(2 * math.pi * u), (it('x', 'm'), f'−{it("x", "m")}')),
        ('v', VEL, lambda u: -math.sin(2 * math.pi * u), (f'{it("ω")}{it("x", "m")}', f'−{it("ω")}{it("x", "m")}')),
        ('a', ACC, lambda u: -math.cos(2 * math.pi * u), (f'{it("ω")}{sup("2")}{it("x", "m")}', f'−{it("ω")}{sup("2")}{it("x", "m")}')))
for k, (name, color, f, (hi, lo)) in enumerate(rows):
    Y = TOP + k * PITCH
    b += [*axes(XL, Y, XR + 8, Y - AMP - 22, it('t'), it(name)), line(XL, Y, XL, Y + AMP + 6, INK, 1.5),
          line(XL - 5, Y - AMP, XL + 5, Y - AMP, INK, 1.2), line(XL - 5, Y + AMP, XL + 5, Y + AMP, INK, 1.2),
          text(XL - 12, Y - AMP + 6, f'+{hi}', 'end', size=17), text(XL - 12, Y + AMP + 6, lo, 'end', size=17),
          poly([(X(u), Y - AMP * f(u)) for u in ts], color, 2.5)]
for j in range(1, 5):                                      # x가 양 끝인 순간: v = 0, a 크기 최대
    b.append(line(X(j / 2), TOP - AMP - 4, X(j / 2), TOP + 2 * PITCH + AMP + 4, GRAY, 1, dash='4 4'))
b += [line(X(1), TOP + 2 * PITCH + AMP + 4, X(1), TOP + 2 * PITCH + AMP + 10, INK, 1.2),
      text(X(1), TOP + 2 * PITCH + AMP + 28, it('T'), size=16)]
svg(OUT, 'f1_shm', 570, TOP + 2 * PITCH + AMP + 40, b)

# 2. 단진자: 줄의 힘 T, 중력 F_g와 그 접선 성분 F_g sin(theta), 지름 성분 F_g cos(theta)(교재 그림 15.4.1)
P0, L, TH, FG, TL = (170, 46), 220, math.radians(35), 130, 86
B = (P0[0] + L * math.sin(TH), P0[1] + L * math.cos(TH))
u = (math.sin(TH), math.cos(TH))                           # 줄을 따라 바깥쪽
tg = (-math.cos(TH), math.sin(TH))                         # 접선, 가운데 쪽
G = (B[0], B[1] + FG)
Rc = (B[0] + FG * math.cos(TH) * u[0], B[1] + FG * math.cos(TH) * u[1])
Tc = (B[0] + FG * math.sin(TH) * tg[0], B[1] + FG * math.sin(TH) * tg[1])
b = [line(P0[0] - 70, P0[1], P0[0] + 70, P0[1], INK, 3)]
b += [line(P0[0] - 60 + 14 * i, P0[1], P0[0] - 70 + 14 * i, P0[1] - 10, INK, 1) for i in range(10)]
b += [line(*P0, P0[0], P0[1] + L, GRAY, 1.2, dash='5 4'),
      line(*P0, *B, INK, 1.8), dot(*P0, 4),
      arc(*P0, 50, -90, -90 + math.degrees(TH)), text(P0[0] + 62 * math.sin(TH / 2), P0[1] + 62 * math.cos(TH / 2) + 6, it('θ'), size=18),
      text(P0[0] + 0.3 * L * math.sin(TH) + 14, P0[1] + 0.3 * L * math.cos(TH) - 2, it('L'), 'start', size=18),
      line(*B, B[0] + 1.25 * FG * u[0], B[1] + 1.25 * FG * u[1], GRAY, 1, dash='3 4'),
      line(*B, B[0] - TL * u[0], B[1] - TL * u[1], FORCE, 3, 'f'), text(B[0] - TL * u[0] + 14, B[1] - TL * u[1] + 16, V('T'), 'start', FORCE, 19),
      line(*B, *G, FORCE, 3, 'f'), text(G[0] + 6, G[1] + 22, V('F', 'g'), 'middle', FORCE, 19),
      line(*B, *Rc, FORCE, 2.5, 'f', dash='6 4'), text(Rc[0] + 8, Rc[1] + 4, f'{it("F", "g")}cos {it("θ")}', 'start', FORCE, 18),
      line(*B, *Tc, FORCE, 2.5, 'f', dash='6 4'), text(Tc[0] + 4, Tc[1] + 30, f'{it("F", "g")}sin {it("θ")}', 'middle', FORCE, 18),
      arc(*B, 34, -90, -90 + math.degrees(TH)), text(B[0] + 48 * math.sin(TH / 2) + 2, B[1] + 48 * math.cos(TH / 2) + 6, it('θ'), size=17),
      circle(*B, 15)]
svg(OUT, 'f2_pendulum', 480, 395, b)
