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
