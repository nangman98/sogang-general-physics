"""7장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch07/make_figs.py -> chapters/ch07/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 7.2.1, 7.4.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'

# 1. 일과 운동에너지: 철사를 따라 움직이는 구슬에 각 phi로 작용하는 일정한 힘(교재 그림 7.2.1)
Y, X1, X2, L, ph = 140, 120, 430, 90, math.radians(35)
b = [line(30, Y, 570, Y, GRAY, 2)]
for X, vlen, vlab, klab in ((X1, 34, V('v', '0'), it('K', 'i')), (X2, 76, V('v'), it('K', 'f'))):
    b += [line(X, Y, X + L * math.cos(ph), Y - L * math.sin(ph), FORCE, 3, 'f'), text(X + L * math.cos(ph) + 6, Y - L * math.sin(ph) - 4, V('F'), 'start', FORCE, 19),
          line(X, Y + 24, X + vlen, Y + 24, VEL, 2.5, 'v'), text(X + vlen + 8, Y + 30, vlab, 'start', VEL, 18),
          circle(X, Y, 10), text(X, Y + 62, klab, size=18)]
b += [arc(X1, Y, 42, 0, 35), text(X1 + 52, Y - 10, it('ϕ'), 'start', size=18),
      line(X1, Y + 86, X2, Y + 86, INK, 1.5, 'ink'), text((X1 + X2) / 2, Y + 108, V('d'), size=19)]
svg(OUT, 'f1_work', 600, 260, b)

# 2. 용수철 힘: 이완, 늘어남(x > 0), 줄어듦(x < 0)과 복원력 F_x(교재 그림 7.4.1)
X0, W = 260, 60
b = [line(X0, 20, X0, 320, GRAY, 1.2, dash='5 4'), text(X0, 14, f'{it("x")} = 0', size=16)]
for Y, dx, cap in ((70, 0, '이완'), (170, 70, '늘어남'), (270, -70, '줄어듦')):
    b += [line(40, Y - 28, 40, Y + 28, INK, 4), spring(40, X0 + dx, Y), box(X0 + dx, Y - 22, W, 44), text(500, Y + 6, cap, 'start', size=15, c=NOTE)]
    if dx:
        cx = X0 + dx + W / 2
        sg = 1 if dx > 0 else -1
        b += [line(cx, Y - 34, cx - 60 * sg, Y - 34, FORCE, 3, 'f'), text(cx + 12 * sg, Y - 28, V('F', 'x'), 'start' if sg > 0 else 'end', FORCE, 18),
              line(X0, Y + 34, X0 + dx, Y + 34, INK, 1.5, 'ink'), text(X0 + dx / 2, Y + 54, it('x'), size=17)]
svg(OUT, 'f2_spring', 580, 330, b)
