"""14장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch14/make_figs.py -> chapters/ch14/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 14.2.2, 14.4.2, 14.5.2, 14.7.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
WATER, OIL, STONE, WOOD, SLAB = '#d6e8f5', '#f3e2b0', '#9a9a9a', '#d9b77e', '#CC79A7'


def dim(x1, y1, x2, y2, c=INK, w=1.2):
    """양쪽 화살촉이 있는 치수선."""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    return [line(mx, my, x1, y1, c, w, 'ink'), line(mx, my, x2, y2, c, w, 'ink')]


def area(pts, fill, op=None):
    o = f' fill-opacity="{op}"' if op else ''
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="{fill}"{o} stroke="none"/>'


# 1. 정지 유체의 압력: 액체 표면(대기압 p0)과 깊이 h 아래 점(압력 p)을 그린 그릇(교재 그림 14.2.2)
X0, X1, TOP, S, BOT, L2 = 90, 390, 40, 110, 320, 240
b = [area([(X0, S), (X1, S), (X1, BOT), (X0, BOT)], WATER),
     poly([(X0, TOP), (X0, BOT), (X1, BOT), (X1, TOP)], INK, 2.5),
     line(X0, S, X1, S, VEL, 2),
     *[line(x, S - 40, x, S - 6, GRAY, 2, 'gray') for x in (150, 240, 330)],
     text(195, S - 26, it('p', '0'), size=18), text(240, TOP - 8, '대기', size=14, c=NOTE),
     line(X0, L2, X1, L2, INK, 1.5, dash='6 5'), dot(240, L2, 5, CRIMSON), text(250, L2 - 10, it('p'), 'start', size=18),
     *dim(X0 + 34, S, X0 + 34, L2), text(X0 + 44, (S + L2) / 2 + 6, it('h'), 'start', size=18),
     text(X1 + 12, S + 5, '표면', 'start', size=14, c=NOTE)]
svg(OUT, 'f1_pressure', 470, 340, b)

# 2. 파스칼 원리: 기름이 든 유압 장치, 왼쪽 입력 피스톤(F_i, A_i, d_i)과 오른쪽 출력 피스톤(F_o, A_o, d_o)(교재 그림 14.4.2)
LA, LB, RA, RB, CT, CB = 110, 150, 330, 490, 270, 310
LT0, LT, RT0, RT, PH = 96, 144, 206, 182, 14
b = [area([(LA, LT + PH), (LB, LT + PH), (LB, CT), (RA, CT), (RA, RT + PH), (RB, RT + PH), (RB, CB), (LA, CB)], OIL),
     box(LA, LT, LB - LA, PH, GRAY), box(RA, RT, RB - RA, PH, GRAY),
     poly([(LB, 40), (LB, CT), (RA, CT), (RA, 130)], INK, 2.5), poly([(LA, 40), (LA, CB), (RB, CB), (RB, 130)], INK, 2.5),
     line(LA - 30, LT0, LB, LT0, GRAY, 1.2, dash='5 4'), line(RA, RT0, RB + 30, RT0, GRAY, 1.2, dash='5 4'),
     line(LA - 18, LT0, LA - 18, LT, INK, 1.5, 'ink'), text(LA - 26, (LT0 + LT) / 2 + 6, it('d', 'i'), 'end', size=18),
     line(RB + 18, RT0, RB + 18, RT, INK, 1.5, 'ink'), text(RB + 26, (RT0 + RT) / 2 + 6, it('d', 'o'), 'start', size=18),
     line((LA + LB) / 2, 34, (LA + LB) / 2, LT - 4, FORCE, 3, 'f'), text(LB + 10, 66, V('F', 'i'), 'start', FORCE, 19),
     line(410, RT - 2, 410, 92, FORCE, 3, 'f'), text(422, 112, V('F', 'o'), 'start', FORCE, 19),
     text(LB + 10, LT + 14, it('A', 'i'), 'start', size=18), text(RA + 14, RT - 10, it('A', 'o'), 'start', size=18),
     text((LB + RA) / 2, CB - 13, '기름', size=14, c=NOTE)]
svg(OUT, 'f2_pascal', 570, 325, b)

# 3. 아르키메데스 원리: 물속 구멍 둘레의 압력 힘, 그 구멍을 채운 같은 부피의 돌과 나무에 작용하는 F_b와 F_g(교재 그림 14.5.2)
W, H, TOP, RO, FB = 170, 250, 30, 40, 62
b = []
for k, (cap, fill, fg) in enumerate((('구멍', None, 0), ('돌', STONE, 96), ('나무', WOOD, 46))):
    x0 = 10 + k * (W + 22)
    cx, cy = x0 + W / 2, TOP + 120
    b += [area([(x0, TOP), (x0 + W, TOP), (x0 + W, TOP + H), (x0, TOP + H)], WATER), line(x0, TOP, x0 + W, TOP, VEL, 2)]
    if fill is None:
        b.append(circle(cx, cy, RO, 'none', INK, 1.5).replace('/>', ' stroke-dasharray="5 4"/>'))
        for j in range(8):
            a = 22.5 + 45 * j
            L = 14 + 14 * (1 - math.sin(math.radians(a))) / 2
            ux, uy = math.cos(math.radians(a)), -math.sin(math.radians(a))
            b.append(line(cx + (RO + 4 + L) * ux, cy + (RO + 4 + L) * uy, cx + (RO + 3) * ux, cy + (RO + 3) * uy, FORCE, 1.8, 'f'))
    else:
        b.append(circle(cx, cy, RO, fill, INK, 1.5))
    b += [line(cx, cy, cx, cy - FB, FORCE, 3, 'f'), text(cx, cy - FB - 10, V('F', 'b'), 'middle', FORCE, 19)]
    if fg:
        b += [line(cx, cy, cx, cy + fg, FORCE, 3, 'f'), text(cx, cy + fg + 22, V('F', 'g'), 'middle', FORCE, 19)]
    b.append(text(cx, TOP + H + 26, cap, size=15, c=NOTE))
svg(OUT, 'f3_buoyancy', 574, 312, b)

# 4. 베르누이 방정식: 왼쪽 아래 입구(y1, v1, p1)에서 오른쪽 위 출구(y2, v2, p2)로 흐르는 관과 같은 시간에 들어오고 나가는 같은 부피(교재 그림 14.7.1)
G, X0, XA, XB, X1 = 300, 70, 220, 380, 590
Y1, H1, Y2, H2 = 225, 40, 105, 20
top = f'M{X0},{Y1 - H1} L{XA},{Y1 - H1} C{XA + 80},{Y1 - H1} {XB - 80},{Y2 - H2} {XB},{Y2 - H2} L{X1},{Y2 - H2}'
bot = f'M{X0},{Y1 + H1} L{XA},{Y1 + H1} C{XA + 80},{Y1 + H1} {XB - 80},{Y2 + H2} {XB},{Y2 + H2} L{X1},{Y2 + H2}'
fill = (f'M{X0},{Y1 - H1} L{XA},{Y1 - H1} C{XA + 80},{Y1 - H1} {XB - 80},{Y2 - H2} {XB},{Y2 - H2} L{X1},{Y2 - H2} '
        f'L{X1},{Y2 + H2} L{XB},{Y2 + H2} C{XB - 80},{Y2 + H2} {XA + 80},{Y1 + H1} {XA},{Y1 + H1} L{X0},{Y1 + H1} Z')
SW1 = 36
SW2 = SW1 * H1 / H2
b = [f'<path d="{fill}" fill="{WATER}" stroke="none"/>',
     area([(X0, Y1 - H1), (X0 + SW1, Y1 - H1), (X0 + SW1, Y1 + H1), (X0, Y1 + H1)], SLAB, 0.45),
     area([(X1 - SW2, Y2 - H2), (X1, Y2 - H2), (X1, Y2 + H2), (X1 - SW2, Y2 + H2)], SLAB, 0.45),
     f'<path d="{top}" fill="none" stroke="{INK}" stroke-width="2.5"/>', f'<path d="{bot}" fill="none" stroke="{INK}" stroke-width="2.5"/>',
     line(X0, Y1 - H1, X0, Y1 + H1, GRAY, 1.2, dash='4 3'), line(X1, Y2 - H2, X1, Y2 + H2, GRAY, 1.2, dash='4 3'),
     line(X0 + SW1 + 22, Y1 - 10, X0 + SW1 + 82, Y1 - 10, VEL, 3, 'v'), text(X0 + SW1 + 92, Y1 - 4, V('v', '1'), 'start', VEL, 21),
     text(X0 + SW1 + 26, Y1 + 28, it('p', '1'), 'start', size=20),
     line(XB + 20, Y2, XB + 120, Y2, VEL, 3, 'v'), text(XB + 70, Y2 - H2 - 12, V('v', '2'), 'middle', VEL, 21),
     text(XB + 70, Y2 + H2 + 26, it('p', '2'), 'middle', size=20),
     line(30, G, 630, G, GRAY, 1.5),
     line(X0 - 26, Y1, X0, Y1, GRAY, 1, dash='3 3'), *dim(X0 - 18, G, X0 - 18, Y1), text(X0 - 26, (G + Y1) / 2 + 6, it('y', '1'), 'end', size=20),
     line(X1, Y2, X1 + 26, Y2, GRAY, 1, dash='3 3'), *dim(X1 + 18, G, X1 + 18, Y2), text(X1 + 26, (G + Y2) / 2 + 6, it('y', '2'), 'start', size=20),
     text(330, G + 28, '같은 시간에 들어오고 나가는 같은 부피', size=15, c=NOTE)]
svg(OUT, 'f4_bernoulli', 660, 340, b)
