"""17장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch17/make_figs.py -> chapters/ch17/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 17.2.1, 17.5.3, 17.6.1, 17.7.4를 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
PIPE = '#f4f4f4'


def halo(x, y, s, anchor='middle', c=INK, size=None):
    """흰 테두리를 두른 글자. 선 위에 얹어도 읽힌다."""
    return text(x, y, s, anchor, c, size).replace('<text ', '<text stroke="#ffffff" stroke-width="5" paint-order="stroke" ')


def darrow(x1, y1, x2, y2, c=INK, w=1.2):
    """양쪽 화살표."""
    return line(x1, y1, x2, y2, c, w, 'ink').replace('/>', ' marker-start="url(#m-ink)"/>')


# 1. 진행하는 음파: 긴 공기 관 속 압축과 팽창의 무늬, 아래에 평형 위치 둘레로 진동하는 공기 요소 하나(교재 그림 17.2.1)
X0, X1, YT, YB, LAM = 30, 560, 46, 112, 160
k = 2 * math.pi / LAM
A = 0.7 / k
b = [line(X0, YT, X1, YT, INK, 2), line(X0, YB, X1, YB, INK, 2)]
for j in range(-6, int((X1 - X0) / 8) + 6):
    u = 8 * j
    x = X0 + u + A * math.cos(k * u)
    if X0 + 2 < x < X1 - 2:
        b.append(line(x, YT + 3, x, YB - 3, INK, 1.4))
# 압축 중심은 u = λ/4 + nλ, 팽창 중심은 u = 3λ/4 + nλ
cA, eA = X0 + LAM / 4 + LAM, X0 + 3 * LAM / 4 + LAM
b += [text(cA, YT - 12, '압축', size=16, c=NOTE), text(eA, YT - 12, '팽창', size=16, c=NOTE),
      darrow(cA, YB + 16, cA + LAM, YB + 16), halo(cA + LAM / 2, YB + 36, it('λ'), size=18),
      line(470, YT - 18, 535, YT - 18, VEL, 2.5, 'v'), text(543, YT - 12, it('v'), 'start', VEL, 18)]
# 확대한 관의 한 부분
T2, B2, EQ, S, DX, SM = 196, 260, 280, 46, 26, 70
b += [line(110, T2, 490, T2, INK, 2), line(110, B2, 490, B2, INK, 2),
      line(EQ - SM, T2, EQ - SM, 330, GRAY, 1, dash='3 4'), line(EQ + SM, T2, EQ + SM, 330, GRAY, 1, dash='3 4'),
      line(EQ, T2 - 14, EQ, B2 + 30, GRAY, 1.5, dash='6 4'), text(EQ - 8, T2 - 8, '평형 위치', 'end', size=15, c=NOTE),
      box(EQ + S - DX / 2, T2 + 1, DX, B2 - T2 - 2, '#e8c9d2'),
      text(EQ + S, T2 - 8, f'Δ{it("x")}', size=16),
      text(EQ + SM + 12, (T2 + B2) / 2 + 5, '진동하는 공기 요소', 'start', size=15, c=NOTE),
      line(EQ, B2 + 18, EQ + S, B2 + 18, CRIMSON, 2.5, 'c'), text(EQ + S / 2, B2 + 38, it('s'), size=18, c=CRIMSON),
      darrow(EQ - SM, 318, EQ, 318), darrow(EQ, 318, EQ + SM, 318),
      text(EQ - SM / 2, 340, it('s', 'm'), size=17), text(EQ + SM / 2, 340, it('s', 'm'), size=17)]
svg(OUT, 'f1_sound', 590, 352, b)

# 2. 관의 정상파: 줄 파동 모양으로 그린 조화 진동 무늬. 왼쪽은 양 끝이 열린 관, 오른쪽은 왼쪽 끝이 닫힌 관(교재 그림 17.5.3)
PL, PH = 220, 46


def pipe(x, y, n, closed):
    a = PH / 2 - 5
    g = (lambda u: math.sin(n * math.pi * u / 2)) if closed else (lambda u: math.cos(n * math.pi * u))
    up = [(x + PL * i / 120, y - a * g(i / 120)) for i in range(121)]
    dn = [(px, 2 * y - py) for px, py in up]
    r = [f'<rect x="{x}" y="{y - PH / 2}" width="{PL}" height="{PH}" fill="{PIPE}"/>',
         line(x, y - PH / 2, x + PL, y - PH / 2, INK, 2), line(x, y + PH / 2, x + PL, y + PH / 2, INK, 2),
         poly(up, CRIMSON, 2.2), poly(dn, CRIMSON, 2.2), text(x + PL + 14, y + 6, f'{it("n")} = {n}', 'start', size=18)]
    if closed:
        r.append(line(x, y - PH / 2 - 1, x, y + PH / 2 + 1, INK, 6))
    return r


b = []
for x0, closed, ns, cap in ((30, False, (1, 2, 3), '양 끝이 열린 관'), (350, True, (1, 3, 5), '한쪽 끝만 열린 관')):
    b += [text(x0 + PL / 2, 20, cap, size=17, c=NOTE),
          darrow(x0, 56, x0 + PL, 56), text(x0 + PL / 2, 48, it('L'), size=18),
          line(x0, 48, x0, 64, INK, 1.2), line(x0 + PL, 48, x0 + PL, 64, INK, 1.2)]
    for r_, n in enumerate(ns):
        b += pipe(x0, 104 + 78 * r_, n, closed)
svg(OUT, 'f2_pipes', 640, 284, b)

# 3. 맥놀이: 따로 검출한 두 음파의 압력 변화와 함께 검출한 합성 압력 변화, 합성파의 진폭 모양은 점선(교재 그림 17.6.1)
GL, GR, N1, N2 = 70, 560, 13, 11
b = []
rows = ((56, 22, '진동수 ' + it('f', '1')), (140, 22, '진동수 ' + it('f', '2')), (262, 46, '함께 검출'))
for k_, (yc, amp, cap) in enumerate(rows):
    b += [line(GL, yc, GR + 14, yc, INK, 1.3, 'ink'), text(GR + 20, yc + 6, it('t'), 'start', size=17),
          line(GL, yc + amp + 6, GL, yc - amp - 14, INK, 1.3, 'ink'), text(GL - 8, yc - amp - 6, f'Δ{it("p")}', 'end', size=16),
          text(GR + 14, yc - amp - (14 if k_ == 2 else 6), cap, 'end', size=15, c=NOTE)]
    if k_ < 2:
        n = N1 if k_ == 0 else N2
        b.append(poly([(GL + (GR - GL) * i / 600, yc - amp * math.sin(2 * math.pi * n * i / 600)) for i in range(601)], INK, 1.8))
    else:
        b.append(poly([(GL + (GR - GL) * i / 600, yc - amp / 2 * (math.sin(2 * math.pi * N1 * i / 600) + math.sin(2 * math.pi * N2 * i / 600)))
                       for i in range(601)], CRIMSON, 2))
        for sg in (1, -1):
            b.append(poly([(GL + (GR - GL) * i / 300, yc - sg * amp * abs(math.cos(math.pi * (N1 - N2) * i / 300))) for i in range(301)],
                          GRAY, 1.5, dash='5 4'))
svg(OUT, 'f3_beats', 600, 330, b)

# 4. 도플러 효과: 정지한 검출기 D를 향해 움직이는 음원 S, 앞쪽에 촘촘해진 파면(교재 그림 17.7.4)
CY, XS, LW, RATIO, NW = 186, 300, 34, 0.5, 5
b = [line(20, CY, 575, CY, LIGHT, 1.2)]
for a in range(NW, 0, -1):
    b.append(circle(XS - RATIO * LW * a, CY, LW * a, 'none', GRAY, 1.6))
front = [XS - RATIO * LW * a + LW * a for a in (NW - 1, NW)]
XD = 500
b += [dot(XS, CY, 6, INK), halo(XS - 4, CY + 26, it('S'), size=19),
      line(XS - 22, CY - 34, XS + 34, CY - 34, VEL, 3, 'v'), halo(XS - 26, CY - 28, it('v', 'S'), 'end', VEL, 18),
      darrow(front[0], CY, front[1], CY, INK, 1.2), text(front[1] + 8, CY - 8, it('λ′'), 'start', size=18),
      box(XD - 9, CY - 16, 18, 32, '#ffffff'), text(XD, CY - 26, it('D'), size=19),
      text(XD, CY + 40, f'{it("v", "D")} = 0', size=17)]
svg(OUT, 'f4_doppler', 590, 372, b)
