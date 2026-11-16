"""3장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch03/make_figs.py -> chapters/ch03/fig/*.svg

숫자 없는 모양 그림이다. 색은 05_디자인_기준.md 선 색을 따른다. a 파랑 #0072B2, b 주황 #D55E00, 결과(합·투영·외적) 진한 빨강.
"""
import math
import pathlib

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
OUT.mkdir(exist_ok=True)
INK, GRAY, CRIMSON, A, B, FILL = '#1a1a1a', '#8a8a8a', '#840025', '#0072B2', '#D55E00', '#56B4E9'
SYM = 'font-family="Times New Roman, STIX Two Text, serif" font-style="italic"'


def sym(s, sub=''):
    t = f'<tspan {SYM}>{s}</tspan>'
    return t + (f'<tspan baseline-shift="sub" font-size="12" {SYM}>{sub}</tspan>' if sub else '')


def vec(s):   # 벡터 기호: 글자 위 화살표는 글꼴마다 달라서 굵은 이탤릭으로 쓴다
    return f'<tspan {SYM} font-weight="700">{s}</tspan>'


def svg(name, w, h, body):
    markers = ''.join(
        f'<marker id="m-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
        for k, c in (('ink', INK), ('a', A), ('b', B), ('c', CRIMSON), ('gray', GRAY)))
    (OUT / f'{name}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="16" fill="{INK}">'
        f'<defs>{markers}</defs>{body}</svg>\n', encoding='utf-8')
    print(name, w, h)


def line(x1, y1, x2, y2, c=INK, w=2.5, m=None, dash=None):
    mk = f' marker-end="url(#m-{m})"' if m else ''
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"{d}{mk}/>'


def text(x, y, s, anchor='middle', c=INK, size=None):
    sz = f' font-size="{size}"' if size else ''
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" fill="{c}"{sz}>{s}</text>'


def arc(cx, cy, r, a0, a1, c=INK):
    """화면 좌표에서 수학 각(도, 반시계)을 a0에서 a1까지 잇는 호."""
    p = lambda a: (cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f'<path d="M{x0:.1f},{y0:.1f} A{r},{r} 0 {large} 0 {x1:.1f},{y1:.1f}" fill="none" stroke="{c}" stroke-width="1.5"/>'


# 1. 벡터와 성분
O = (60, 250)
T = (300, 90)
b = [line(O[0] - 20, O[1], 400, O[1], INK, 1.5, 'ink'), line(O[0], O[1] + 20, O[0], 30, INK, 1.5, 'ink'),
     text(408, O[1] + 5, sym('x'), 'start'), text(O[0], 22, sym('y')),
     line(O[0], O[1] + 8, T[0] - 4, O[1] + 8, A, 2, 'a', dash='6 4'), text((O[0] + T[0]) / 2, O[1] + 30, sym('a', 'x'), c=A),
     line(T[0] + 8, O[1], T[0] + 8, T[1] + 4, A, 2, 'a', dash='6 4'), text(T[0] + 18, (O[1] + T[1]) / 2, sym('a', 'y'), 'start', c=A),
     line(*O, *T, A, 3, 'a'), text((O[0] + T[0]) / 2 - 12, (O[1] + T[1]) / 2 - 12, vec('a'), c=A, size=20),
     arc(*O, 46, 0, math.degrees(math.atan2(O[1] - T[1], T[0] - O[0]))), text(O[0] + 58, O[1] - 12, sym('θ'), 'start')]
svg('f1_components', 440, 290, ''.join(b))

# 2. 머리–꼬리 합과 평행사변형
O, P, Q = (60, 240), (260, 170), (360, 60)          # a: O->P, b: P->Q, s: O->Q
R = (O[0] + Q[0] - P[0], O[1] + Q[1] - P[1])         # b를 원점에서 그린 끝
b = [line(*O, *R, GRAY, 1.5, 'gray', dash='5 4'), line(*R, *Q, GRAY, 1.5, 'gray', dash='5 4'),
     line(*O, *P, A, 3, 'a'), text((O[0] + P[0]) / 2 + 6, (O[1] + P[1]) / 2 + 26, vec('a'), c=A, size=20),
     line(*P, *Q, B, 3, 'b'), text((P[0] + Q[0]) / 2 + 22, (P[1] + Q[1]) / 2 + 6, vec('b'), c=B, size=20),
     line(*O, *Q, CRIMSON, 3.5, 'c'), text(Q[0] + 12, Q[1] - 4, f'{vec("s")} = {vec("a")} + {vec("b")}', 'start', c=CRIMSON, size=18)]
svg('f2_head_to_tail', 480, 280, ''.join(b))

# 3. 내적: b 방향으로의 a의 성분 a cos ϕ (a의 성분이라 a와 같은 파랑, 2026-11-16)
O, L, phi, la = (70, 220), 340, 55, 210
Ta = (O[0] + la * math.cos(math.radians(phi)), O[1] - la * math.sin(math.radians(phi)))
b = [line(*O, O[0] + L, O[1], B, 3, 'b'), text(O[0] + L + 10, O[1] + 6, vec('b'), 'start', c=B, size=20),
     line(*O, *Ta, A, 3, 'a'), text(Ta[0] - 18, Ta[1] + 4, vec('a'), 'end', c=A, size=20),
     line(Ta[0], Ta[1] + 4, Ta[0], O[1] - 2, GRAY, 1.5, dash='4 4'),
     line(O[0], O[1] + 16, Ta[0], O[1] + 16, A, 4).replace('/>', ' stroke-opacity="0.55"/>'), text((O[0] + Ta[0]) / 2, O[1] + 42, f'{sym("a")} cos {sym("ϕ")}', c=A),
     arc(*O, 44, 0, phi), text(O[0] + 56, O[1] - 18, sym('ϕ'), 'start')]
svg('f3_dot', 460, 270, ''.join(b))

# 4. 외적: a, b가 놓인 평면(옅은 음영)에 수직인 c = a × b. 교재에 넓이 이야기가 없어 넓이 글은 쓰지 않는다(2026-11-16).
O, u = (180, 230), 40
P3 = lambda x, y, z: (O[0] - 28 / 40 * u * x + u * y, O[1] + 16 / 40 * u * x - u * z)
av, bv, phi = 2.5, 2.0, 70
bx, by = bv * math.cos(math.radians(phi)), bv * math.sin(math.radians(phi))
cz = av * by
pa, pb, pab, pc = P3(av, 0, 0), P3(bx, by, 0), P3(av + bx, by, 0), P3(0, 0, cz)
b = [f'<polygon points="{O[0]},{O[1]} {pa[0]:.1f},{pa[1]:.1f} {pab[0]:.1f},{pab[1]:.1f} {pb[0]:.1f},{pb[1]:.1f}" fill="{FILL}" fill-opacity="0.35" stroke="none"/>',
     line(*O, *pa, A, 3, 'a'), text(pa[0] - 10, pa[1] + 22, vec('a'), c=A, size=20),
     line(*O, *pb, B, 3, 'b'), text(pb[0] + 14, pb[1] + 6, vec('b'), 'start', c=B, size=20),
     line(*O, *pc, CRIMSON, 3.5, 'c'), text(pc[0] + 12, pc[1] + 14, f'{vec("c")} = {vec("a")} × {vec("b")}', 'start', c=CRIMSON, size=18)]
svg('f4_cross', 420, 330, ''.join(b))
