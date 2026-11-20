"""16장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch16/make_figs.py -> chapters/ch16/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 16.1.4, 16.5.3, 16.7.3, 16.7.5를 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
sub = lambda s: f'<tspan dy="5" font-size="0.72em" {SYM}>{s}</tspan><tspan dy="-5">​</tspan>'   # 뒤에 빈칸 없는 아래 첨자
TAU = 2 * math.pi


def dbl(x1, y1, x2, y2, c=INK, w=1.2):
    """양쪽 화살표 치수선."""
    return line(x1, y1, x2, y2, c, w, 'ink').replace('/>', ' marker-start="url(#m-ink)"/>')


# 1. 진행하는 횡파: 양의 x 방향으로 가는 파동의 순간 모습 다섯 장, 봉우리 화살표와 x = 0의 줄 요소(교재 그림 16.1.4)
X0, LAM, AMP, PITCH, TOP = 150, 190, 22, 66, 92
XA, XB = X0 - 0.3 * LAM, X0 + 1.75 * LAM
xs = [XA + (XB - XA) * i / 300 for i in range(301)]
labs = ('0', f'{it("T")}/4', f'{it("T")}/2', f'3{it("T")}/4', it('T'))
b = [line(X0, TOP - AMP - 14, X0, TOP + 4 * PITCH + AMP + 6, GRAY, 1.2, dash='5 4'),
     text(X0, TOP - AMP - 22, f'{it("x")} = 0', size=17),
     line(36, TOP - 6, 36, TOP + 4 * PITCH + 6, INK, 1.5, 'ink'), text(36, TOP + 4 * PITCH + 30, it('t'), size=18)]
peaks = []
for j in range(5):
    Y, ph = TOP + j * PITCH, TAU * j / 4                                    # t = jT/4
    y = lambda x: AMP * math.sin(TAU * (x - X0) / LAM - ph)
    xp = X0 + LAM / 4 + LAM * j / 4                                        # 따라가는 봉우리
    peaks.append((xp, Y - AMP))
    b += [line(XA, Y, XB + 10, Y, LIGHT, 1.2), poly([(x, Y - y(x)) for x in xs], INK, 2.2),
          circle(X0, Y - y(X0), 6, VEL, VEL), line(xp - 4, Y - AMP - 9, xp + 30, Y - AMP - 9, CRIMSON, 2.5, 'c'),
          text(XB + 20, Y + 6, f'{it("t")} = {labs[j]}', 'start', size=17, c=NOTE)]
b.insert(0, poly(peaks, CRIMSON, 1.2, dash='2 4'))
b += [dbl(X0 + LAM / 4, TOP - AMP - 44, X0 + 1.25 * LAM, TOP - AMP - 44), text(X0 + 0.75 * LAM, TOP - AMP - 52, it('λ'), size=18),
      line(X0 + LAM / 4, TOP - AMP - 36, X0 + LAM / 4, TOP - AMP - 52, GRAY, 1), line(X0 + 1.25 * LAM, TOP - AMP - 4, X0 + 1.25 * LAM, TOP - AMP - 52, GRAY, 1),
      line(X0 - LAM / 4, TOP, X0 - LAM / 4, TOP + AMP, INK, 1.2, 'ink'), text(X0 - LAM / 4 - 16, TOP + AMP / 2 + 4, it('y', 'm'), 'end', size=18)]
svg(OUT, 'f1_traveling', 610, TOP + 4 * PITCH + 44, b)

# 3. 파동의 간섭: 위상차 phi = 0, pi, 2pi/3일 때 같은 방향으로 가는 두 파동(위)과 합성파(아래)(교재 그림 16.5.3)
CW, GAP, XL0, A1, YT, YR = 168, 28, 76, 20, 94, 198
b = [text(10, YT + 6, f'{it("y")}{sub("1")}, {it("y")}{sub("2")}', 'start', size=18), text(10, YR + 6, it("y′"), 'start', size=19)]
for j, (phi, head, cap) in enumerate(((0, '0', '완전 보강 간섭'), (math.pi, 'π', '완전 상쇄 간섭'), (TAU / 3, '⅔π', '중간 간섭'))):
    x0 = XL0 + j * (CW + GAP)
    xs = [x0 + CW * i / 200 for i in range(201)]
    ph = lambda x: TAU * 1.5 * (x - x0) / CW
    b += [text(x0 + CW / 2, 32, f'{it("ϕ")} = {head}', size=19),
          line(x0, YT, x0 + CW, YT, LIGHT, 1.2), line(x0, YR, x0 + CW, YR, LIGHT, 1.2),
          poly([(x, YT - A1 * math.sin(ph(x))) for x in xs], VEL, 2.2),
          poly([(x, YT - A1 * math.sin(ph(x) + phi)) for x in xs], FORCE, 2.2, dash='6 4'),
          poly([(x, YR - A1 * (math.sin(ph(x)) + math.sin(ph(x) + phi))) for x in xs], CRIMSON, 3),
          text(x0 + CW / 2, 274, cap, size=16, c=NOTE)]
svg(OUT, 'f3_interference', XL0 + 3 * CW + 2 * GAP + 12, 288, b)

# 4. 반사와 공명: 위는 벽에 묶인 줄 끝에서 뒤집혀 되돌아오는 펄스(교재 그림 16.7.3a), 아래는 두 고정점 사이 줄의
#    고리 하나, 둘, 셋인 정상파와 끝 변위 두 개(교재 그림 16.7.5)
XL, XR, AMP, PITCH, TOP = 70, 470, 28, 104, 176
xs = [XL + (XR - XL) * i / 300 for i in range(301)]
RY = 64   # 반사 그림의 줄 높이
bump = lambda c, h: [(x, RY - h * math.exp(-((x - c) / 22) ** 2)) for x in xs]
b = [line(XL, RY - 34, XL, RY + 34, INK, 5)] + [line(XL - 12, y + 8, XL, y, INK, 1.2) for y in range(RY - 30, RY + 34, 10)]
b += [line(XL, RY, XR, RY, LIGHT, 1.2), poly(bump(380, 30), CRIMSON, 2.5), poly(bump(190, -30), CRIMSON, 2.5),
      line(400, RY - 46, 350, RY - 46, NOTE, 1.5, 'ink'), text(410, RY - 41, '들어온 펄스', 'start', size=15, c=NOTE),
      line(170, RY + 46, 220, RY + 46, NOTE, 1.5, 'ink'), text(230, RY + 51, '반사된 펄스', 'start', size=15, c=NOTE)]
for n in (1, 2, 3):
    Y = TOP + (n - 1) * PITCH
    s = lambda x: math.sin(n * math.pi * (x - XL) / (XR - XL))
    b += [line(XL, Y - 22, XL, Y + 22, INK, 5), line(XR, Y - 22, XR, Y + 22, INK, 5),
          line(XL, Y, XR, Y, LIGHT, 1.2),
          poly([(x, Y - AMP * s(x)) for x in xs], CRIMSON, 2.5), poly([(x, Y + AMP * s(x)) for x in xs], CRIMSON, 2, dash='6 5'),
          text(XR + 20, Y + 6, f'{it("n")} = {n}', 'start', size=18)]
    b += [dot(XL + (XR - XL) * i / n, Y, 4.5, INK) for i in range(n + 1)]
b += [dbl(XL, TOP + 44, XR, TOP + 44), text((XL + XR) / 2, TOP + 64, it('L'), size=18)]
Y3 = TOP + 2 * PITCH
xn, xa = XL + (XR - XL) / 3, XL + (XR - XL) / 6
b += [line(xn, Y3 + 8, xn, Y3 + 36, NOTE, 1, 'ink'), text(xn, Y3 + 54, '마디', size=16, c=NOTE),
      line(xa, Y3 + AMP + 8, xa, Y3 + AMP + 30, NOTE, 1).replace('/>', ' marker-start="url(#m-ink)"/>'), text(xa, Y3 + AMP + 48, '배', size=16, c=NOTE)]
svg(OUT, 'f4_standing', 545, Y3 + 74, b)
