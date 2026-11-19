"""12장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch12/make_figs.py -> chapters/ch12/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 12.2.1, 12.1.2, 12.3.3을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
DISK = '#ececec'
pt = lambda c, r, a: (c[0] + r * math.cos(math.radians(a)), c[1] - r * math.sin(math.radians(a)))

# 1. 평형 조건: 두 저울 위의 균일한 보와 블록, 보와 블록을 한 계로 본 자유물체도(교재 그림 12.2.1)
XL, XR, YB = 70, 510, 305
XM, XC = (XL + XR) / 2, XL + (XR - XL) / 4
b = ['<g transform="translate(0,-55)">', line(20, 170, 560, 170, INK, 2),
     box(XL - 30, 132, 60, 38), circle(XL, 151, 11, '#ffffff'), box(XR - 30, 132, 60, 38), circle(XR, 151, 11, '#ffffff'),
     box(XL - 15, 116, XR - XL + 30, 16, DISK), box(XC - 24, 80, 48, 36), text(XC, 104, it('M'), size=20),
     text(XM + 110, 108, it('m'), size=20), text(XM, 205, '두 저울 위의 보와 블록', size=15, c=NOTE),
     line(XL - 15, YB, XR + 15, YB, LIGHT, 10),
     line(XL, YB, XL, YB - 90, FORCE, 3, 'f'), text(XL - 10, YB - 70, V('F', 'l'), 'end', FORCE, 21),
     line(XR, YB, XR, YB - 50, FORCE, 3, 'f'), text(XR + 10, YB - 30, V('F', 'r'), 'start', FORCE, 21),
     line(XC, YB, XC, YB + 80, FORCE, 3, 'f'), text(XC + 10, YB + 56, it('M') + V('g'), 'start', FORCE, 21),
     line(XM, YB, XM, YB + 60, FORCE, 3, 'f'), text(XM + 10, YB + 40, it('m') + V('g'), 'start', FORCE, 21),
     *(dot(x, YB, 4) for x in (XL, XC, XM, XR)),
     text(XM, YB + 100, '보와 블록을 한 계로 본 자유물체도', size=15, c=NOTE), '</g>']
svg(OUT, 'f1_equilibrium', 580, YB + 112 - 55, b)


# 2. 무게 중심과 안정성: 모서리로 선 도미노, 기운 도미노, 좁은 면으로 선 도미노, 네모난 블록(교재 그림 12.1.2)
def tilted(px, gy, w, h, beta):
    """오른쪽 아래 모서리 (px, gy)를 받침으로 시계 방향 beta(도)만큼 기운 직사각형의 꼭짓점과 질량 중심."""
    c, s = math.cos(math.radians(beta)), math.sin(math.radians(beta))
    to = lambda lx, ly: (px + lx * c + ly * s, gy - (-lx * s + ly * c))
    return [to(0, 0), to(-w, 0), to(-w, h), to(0, h), to(0, 0)], to(-w / 2, h / 2)


GY, W, H, FL = 230, 46, 150, 36
b = [line(10, GY, 670, GY, INK, 2)]
edge = math.degrees(math.atan(W / H))
for px, w, h, beta, cap in ((96, W, H, edge, '모서리로 선 도미노'), (260, W, H, edge + 12, '조금 기울인 도미노'),
                            (430, W, H, 6, '좁은 면으로 선 도미노'), (600, 92, 92, 12, '네모난 블록')):
    corners, com = tilted(px, GY, w, h, beta)
    b += [poly(corners, INK, 1.8, fill='#f3f3f3'), line(com[0], com[1] + FL, com[0], GY, GRAY, 1.2, dash='4 4'),
          line(*com, com[0], com[1] + FL, FORCE, 3, 'f'), text(com[0] + 7, com[1] + FL / 2 + 8, V('F', 'g'), 'start', FORCE, 19).replace('<text ', '<text stroke="#ffffff" stroke-width="4" stroke-linejoin="round" paint-order="stroke" ', 1),
          dot(*com, 4.5), dot(px, GY, 5, CRIMSON), text(px - w / 2 + (8 if w > 50 else 0), GY + 30, cap, size=16, c=NOTE)]
    if cap == '조금 기울인 도미노':
        top = corners[2]
        rr = math.hypot(top[0] - px, top[1] - GY) + 14
        a = math.degrees(math.atan2(GY - top[1], top[0] - px))
        b.append(arc(px, GY, rr, a + 6, a - 22, GRAY, 1.8, 'gray'))
svg(OUT, 'f2_stability', 680, GY + 44, b)


# 3. 인장과 압축: 늘어나는 원기둥, 층밀리기로 기우는 원기둥, 유체 속에서 줄어드는 공. 변형은 과장했다(교재 그림 12.3.3)
RX, RY = 30, 9


def cyl(xt, yt, xb, yb, fill=DISK, stroke=INK, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    f = fill if fill else 'none'
    body = (f'<path d="M{f1(xt - RX)},{f1(yt)} L{f1(xb - RX)},{f1(yb)} A{RX},{RY} 0 0 0 {f1(xb + RX)},{f1(yb)} '
            f'L{f1(xt + RX)},{f1(yt)} A{RX},{RY} 0 0 0 {f1(xt - RX)},{f1(yt)} Z" fill="{f}" stroke="{stroke}" stroke-width="1.5"{d}/>')
    top = f'<ellipse cx="{f1(xt)}" cy="{f1(yt)}" rx="{RX}" ry="{RY}" fill="{f}" stroke="{stroke}" stroke-width="1.5"{d}/>'
    return body + top


def dim(x0, y0, x1, y1, lab, lx, ly, anchor='middle'):
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    return [line(mx, my, x0, y0, INK, 1.2, 'ink'), line(mx, my, x1, y1, INK, 1.2, 'ink'), text(lx, ly, lab, anchor, size=19)]


TOP, BOT, DL = 100, 240, 34
# 늘어나는 원기둥
cx = 95
b = [cyl(cx, TOP - DL, cx, BOT), f'<ellipse cx="{cx}" cy="{TOP}" rx="{RX}" ry="{RY}" fill="none" stroke="{GRAY}" stroke-width="1.2" stroke-dasharray="4 4"/>',
     line(cx - RX - 26, TOP, cx - RX - 4, TOP, GRAY, 1, dash='3 3'), line(cx - RX - 26, BOT, cx - RX - 4, BOT, GRAY, 1, dash='3 3'),
     *dim(cx - RX - 18, TOP, cx - RX - 18, BOT, it('L'), cx - RX - 24, (TOP + BOT) / 2 + 6, 'end'),
     line(cx + RX + 4, TOP - DL, cx + RX + 26, TOP - DL, GRAY, 1, dash='3 3'), line(cx + RX + 4, TOP, cx + RX + 26, TOP, GRAY, 1, dash='3 3'),
     *dim(cx + RX + 18, TOP - DL, cx + RX + 18, TOP, 'Δ' + it('L'), cx + RX + 24, TOP - DL / 2 + 6, 'start'),
     line(cx, TOP - DL, cx, TOP - DL - 50, FORCE, 3, 'f'), text(cx + 10, TOP - DL - 34, V('F'), 'start', FORCE, 21),
     line(cx, BOT + RY, cx, BOT + RY + 50, FORCE, 3, 'f'), text(cx + 10, BOT + RY + 44, V('F'), 'start', FORCE, 21),
     text(cx, 335, '인장', size=16, c=NOTE)]
# 층밀리기로 기우는 원기둥
cx, DX = 305, 40
b += [cyl(cx + DX, TOP, cx, BOT), cyl(cx, TOP, cx, BOT, None, GRAY, '4 4'),
      line(cx - RX, TOP, cx - RX, TOP - 34, GRAY, 1, dash='3 3'), line(cx - RX + DX, TOP - RY - 2, cx - RX + DX, TOP - 34, GRAY, 1, dash='3 3'),
      *dim(cx - RX, TOP - 26, cx - RX + DX, TOP - 26, 'Δ' + it('x'), cx - RX + DX / 2, TOP - 36),
      *dim(cx - RX - 22, TOP, cx - RX - 22, BOT, it('L'), cx - RX - 28, (TOP + BOT) / 2 + 6, 'end'),
      line(cx + DX - 20, TOP - RY - 6, cx + DX + 66, TOP - RY - 6, FORCE, 3, 'f'), text(cx + DX + 72, TOP - RY - 1, V('F'), 'start', FORCE, 21),
      line(cx + 20, BOT + RY + 6, cx - 66, BOT + RY + 6, FORCE, 3, 'f'), text(cx - 72, BOT + RY + 11, V('F'), 'end', FORCE, 21),
      text(cx, 335, '층밀리기', size=16, c=NOTE)]
# 유체 속에서 줄어드는 공
C = (530, 175)
b += [circle(*C, 74, 'none', GRAY, 1.2).replace('/>', ' stroke-dasharray="4 4"/>'), circle(*C, 56, DISK)]
for a in range(0, 360, 45):
    b.append(line(*pt(C, 112, a + 22.5), *pt(C, 80, a + 22.5), FORCE, 2.5, 'f'))
b += [text(*pt(C, 124, 67.5 + 8), it('p'), 'middle', FORCE, 21), text(C[0], 335, '유체 속 부피 압축', size=16, c=NOTE)]
svg(OUT, 'f3_elasticity', 660, 350, b)
