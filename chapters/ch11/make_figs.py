"""11장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch11/make_figs.py -> chapters/ch11/fig/*.svg

숫자 없는 모양 그림이다. 교재 그림 11.1.4, 11.2.2, 11.5.1, 11.8.1을 본떠 새로 그렸다. 공통 부품은 chapters/figkit.py.
"""
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figkit import *  # noqa: E402,F403

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
DISK = '#ececec'
pt = lambda c, r, a: (c[0] + r * math.cos(math.radians(a)), c[1] - r * math.sin(math.radians(a)))

# 1. 구름 운동: 순수 회전 + 순수 병진 = 구름, 꼭대기 T, 중심 O, 바닥 P의 속도(교재 그림 11.1.4)
R, L, Y = 62, 46, 120
LAB = {1: it('v', 'com'), -1: '−' + it('v', 'com'), 2: '2' + it('v', 'com')}
b = [text(218, Y + 10, '+', size=30), text(432, Y + 10, '=', size=30)]
for cap, cx, ks in (('순수 회전', 105, (1, 0, -1)), ('순수 병진', 325, (1, 1, 1)), ('구름 운동', 580, (2, 1, 0))):
    b += [circle(cx, Y, R, DISK), line(cx, Y - R, cx, Y + R, GRAY, 1.2, dash='4 4')]
    if cap == '구름 운동':
        b.append(line(cx - R - 30, Y + R, cx + R + 50, Y + R, INK, 2))
    if cap != '순수 병진':
        b += [arc(cx, Y, R + 12, 215, 145, VEL, 2.5, 'v'), text(*pt((cx, Y + 6), R + 30, 180), it('ω'), c=VEL, size=21)]
    for (name, y, ly), k in zip((('T', Y - R, -10), ('O', Y, 5), ('P', Y + R, 24)), ks):
        b.append(dot(cx, y, 5))
        if k:
            b.append(line(cx, y, cx + k * L, y, VEL, 3, 'v'))
            b.append(text(cx + k * L / 2 + 4, y - 13 if name != 'P' else y + 26, LAB[k], 'middle', VEL, 19))
        right = k < 0
        b.append(text(cx + (10 if right else -10), y + ly, name, 'start' if right else 'end', size=18))
    b.append(text(cx, Y + R + 58, cap, size=17, c=NOTE))
svg(OUT, 'f1_rolling', 705, Y + R + 72, b)

# 2. 경사면을 구르는 물체: 중력의 두 성분, 중심으로 옮겨 그린 수직항력, 경사면 위쪽을 향한 정지 마찰력(교재 그림 11.2.2)
TH, R = 25, 58
t = math.radians(TH)
d = (math.cos(t), math.sin(t))        # 경사면 아래쪽(화면)
n = (math.sin(t), -math.cos(t))       # 경사면 바깥 법선
B, A = (600, 360), (30, 360 - 570 * math.tan(t))
Ls = 570 / math.cos(t)
at = lambda s, k=0: (A[0] + s * d[0] + k * n[0], A[1] + s * d[1] + k * n[1])
P = at(0.45 * Ls)
C = (P[0] + R * n[0], P[1] + R * n[1])
FG = 130
Fs, Fc = FG * math.sin(t), FG * math.cos(t)
Es = (C[0] + Fs * d[0], C[1] + Fs * d[1])
Ec = (C[0] - Fc * n[0], C[1] - Fc * n[1])
En = (C[0] + Fc * n[0], C[1] + Fc * n[1])
Ef = (P[0] - 62 * d[0], P[1] - 62 * d[1])
x0, x1 = at(0.30 * Ls, 32), at(0.08 * Ls, 32)
b = [poly([A, B, (A[0], B[1]), A], INK, 2, fill='#f4f4f4'),
     arc(*B, 70, 180 - TH, 180), text(*pt(B, 90, 180 - TH / 2), it('θ'), size=20),
     line(*x0, *x1, INK, 1.5, 'ink'), text(x1[0] - 6, x1[1] - 6, it('x'), 'end', size=20),
     circle(*C, R, DISK), line(*C, *pt(C, R, 150), GRAY, 1.5), text(*pt(C, R / 2 + 4, 165), it('R'), size=19),
     line(*C, *Es, FORCE, 2.5, 'f', dash='6 4'), text(Es[0] + 14, Es[1] + 22, it('F', 'g') + ' sin ' + it('θ'), 'start', FORCE, 18),
     line(*C, *Ec, FORCE, 2.5, 'f', dash='6 4'), text(Ec[0] - 8, Ec[1] + 14, it('F', 'g') + ' cos ' + it('θ'), 'end', FORCE, 18),
     line(*C, C[0], C[1] + FG, FORCE, 3, 'f'), text(C[0] + 8, C[1] + FG + 4, V('F', 'g'), 'start', FORCE, 20),
     line(*C, *En, FORCE, 3, 'f'), text(En[0] + 8, En[1] + 6, V('F', 'N'), 'start', FORCE, 20),
     line(*P, *Ef, FORCE, 3, 'f'), text(Ef[0] - 4, Ef[1] + 22, V('f', 's'), 'end', FORCE, 20),
     dot(*C, 4), dot(*P, 4), text(P[0] + 4, P[1] + 26, 'P', size=18)]
svg(OUT, 'f2_ramp', 620, 375, b)

# 3. 입자의 각운동량: 비스듬히 본 xy 평면의 r, p와 z 방향 l, 위에서 본 평면의 각 phi와 r_perp(교재 그림 11.5.1)
O3 = (150, 245)
pj = lambda x, y, z=0: (O3[0] + 100 * y - 60 * x, O3[1] + 45 * x - 100 * z)
Ap, pdir = (1.0, 1.2), (-0.9, 0.7)
A3 = pj(*Ap)
Pe = pj(Ap[0] + 0.75 * pdir[0], Ap[1] + 0.75 * pdir[1])
b = [poly([pj(-0.4, -0.4), pj(1.7, -0.4), pj(1.7, 2.0), pj(-0.4, 2.0), pj(-0.4, -0.4)], LIGHT, 1, fill='#f4f4f4'),
     line(*O3, *pj(1.95, 0), INK, 1.5, 'ink'), text(*[a + o for a, o in zip(pj(1.95, 0), (-10, 4))], it('x'), 'end', size=20),
     line(*O3, *pj(0, 2.3), INK, 1.5, 'ink'), text(*[a + o for a, o in zip(pj(0, 2.3), (12, 6))], it('y'), 'start', size=20),
     line(*O3, *pj(0, 0, 2.05), INK, 1.5, 'ink'), text(O3[0] - 10, pj(0, 0, 2.05)[1] + 8, it('z'), 'end', size=20),
     line(*O3, *pj(0, 0, 1.45), CRIMSON, 3.5, 'c'), text(O3[0] + 10, pj(0, 0, 1.3)[1], V('ℓ'), 'start', CRIMSON, 20),
     line(*O3, *A3, INK, 2.5, 'ink'), text((O3[0] + A3[0]) / 2 - 2, (O3[1] + A3[1]) / 2 + 22, V('r'), size=20),
     line(*A3, *Pe, VEL, 3, 'v'), text(Pe[0] + 6, Pe[1] - 6, V('p'), 'start', VEL, 20),
     dot(*A3, 6), text(A3[0] - 4, A3[1] + 22, 'A', 'end', size=18),
     dot(*O3, 4), text(O3[0] - 10, O3[1] + 4, 'O', 'end', size=18)]
O, rlen, al, ph, plen = (420, 275), 200, 25, 60, 110
A2 = pt(O, rlen, al)
u = (math.cos(math.radians(al + ph)), -math.sin(math.radians(al + ph)))
Pe2 = (A2[0] + plen * u[0], A2[1] + plen * u[1])
s = (O[0] - A2[0]) * u[0] + (O[1] - A2[1]) * u[1]
Q = (A2[0] + s * u[0], A2[1] + s * u[1])
b += [line(*Q, *A2, GRAY, 1.2, dash='5 4'), line(*O, *Q, INK, 1.5),
      text((O[0] + Q[0]) / 2, (O[1] + Q[1]) / 2 + 24, it('r', '⊥'), size=20),
      line(*O, *A2, INK, 2.5, 'ink'), text(*pt(O, rlen / 2, al + 7), V('r'), size=20),
      line(*A2, *pt(A2, 70, al), GRAY, 1.2, dash='3 4'), arc(*A2, 32, al, al + ph), text(*pt(A2, 46, al + ph / 2), it('ϕ'), size=20),
      line(*A2, *Pe2, VEL, 3, 'v'), text(Pe2[0] + 8, Pe2[1] + 6, V('p'), 'start', VEL, 20),
      dot(*A2, 6), text(A2[0] + 10, A2[1] + 20, 'A', 'start', size=18),
      dot(*O, 4), text(O[0] - 10, O[1] + 4, 'O', 'end', size=18),
      text(530, 335, 'xy 평면을 위에서 본 그림', size=15, c=NOTE)]
svg(OUT, 'f3_angular_momentum', 690, 350, b)


# 4. 각운동량 보존: 회전의자에 앉아 아령을 든 학생, 팔을 폈을 때와 당겼을 때 같은 L(교재 그림 11.8.1)
def ell_arc(cx, cy, rx, ry, a0, a1, c, w=2.5):
    pts = [(cx + rx * math.cos(math.radians(a)), cy + ry * math.sin(math.radians(a))) for a in range(a0, a1 + 1, 5)]
    return (f'<path d="M{" L".join(f"{f1(x)},{f1(y)}" for x, y in pts)}" fill="none" stroke="{c}" '
            f'stroke-width="{w}" marker-end="url(#m-v)"/>')


b = []
for cx, out, sweep, cap in ((150, True, (200, 340), f'큰 {it("I")}, 작은 {it("ω")}'),
                            (450, False, (120, 400), f'작은 {it("I")}, 큰 {it("ω")}')):
    b += [line(cx, 64, cx, 284, GRAY, 1.2, dash='5 4'),
          line(cx, 72, cx, 22, CRIMSON, 3.5, 'c'), text(cx + 10, 38, V('L'), 'start', CRIMSON, 20),
          line(cx, 186, cx, 266, INK, 5), line(cx - 42, 268, cx + 42, 268, INK, 5),
          line(cx - 10, 184, cx - 14, 228, INK, 6), line(cx + 10, 184, cx + 14, 228, INK, 6),
          box(cx - 34, 176, 68, 9, GRAY), box(cx - 13, 108, 26, 70, LIGHT), circle(cx, 92, 14)]
    for sgn in (-1, 1):
        if out:
            b += [line(cx + sgn * 12, 116, cx + sgn * 100, 116, INK, 5), box(cx + sgn * 100 - 6, 103, 12, 26, GRAY)]
        else:
            b += [poly([(cx + sgn * 12, 116), (cx + sgn * 40, 140), (cx + sgn * 30, 124)], INK, 5),
                  box(cx + sgn * 30 - 6, 111, 12, 26, GRAY)]
    b += [ell_arc(cx, 240, 52, 13, *sweep, VEL), text(cx + 62, 252, it('ω'), 'start', VEL, 21),
          text(cx, 310, cap, size=17)]
svg(OUT, 'f4_conservation', 600, 325, b)
