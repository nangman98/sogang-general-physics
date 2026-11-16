"""4장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch04/make_figs.py -> chapters/ch04/fig/*.svg

모양 그림이다. 포물선 그림만 v0 = 20 m/s, θ0 = 55°, g = 9.8 m/s^2로 계산한 실제 궤적이다.
색은 05_디자인_기준.md를 따른다. 속도 #0072B2, 가속도 #CC79A7, 결과(상대 속도) 진한 빨강, 강물 속도 #009E73.
"""
import math
import pathlib

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
OUT.mkdir(exist_ok=True)
INK, GRAY, CRIMSON, VEL, ACC, WATER = '#1a1a1a', '#8a8a8a', '#840025', '#0072B2', '#CC79A7', '#009E73'
SYM = 'font-family="Times New Roman, STIX Two Text, serif" font-style="italic"'


def sym(s, sub=''):
    t = f'<tspan {SYM}>{s}</tspan>'
    return t + (f'<tspan dy="5" font-size="12" {SYM}>{sub}</tspan><tspan dy="-5"> </tspan>' if sub else '')


def svg(name, w, h, body):
    markers = ''.join(
        f'<marker id="m-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
        for k, c in (('ink', INK), ('vel', VEL), ('acc', ACC), ('c', CRIMSON), ('w', WATER), ('gray', GRAY)))
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


# 1. 포물선 운동: 궤적과 다섯 순간의 속도 성분
v0, th, g = 20, math.radians(55), 9.8
vx, vy0 = v0 * math.cos(th), v0 * math.sin(th)
T, R = 2 * vy0 / g, v0 ** 2 / g * math.sin(2 * th)
S, O = 12, (40, 300)                                   # 1 m = 12 px, 같은 축척
P = lambda x, y: (O[0] + S * x, O[1] - S * y)
pts = ' '.join('{:.1f},{:.1f}'.format(*P(vx * t, vy0 * t - g * t * t / 2)) for t in [T * i / 80 for i in range(81)])
K = 2.2                                                # 속도 화살표 1 m/s = 2.2 px
b = [line(O[0] - 10, O[1], O[0] + S * R + 40, O[1], INK, 1.5, 'ink'), text(O[0] + S * R + 48, O[1] + 5, sym('x'), 'start'),
     line(O[0], O[1] + 10, O[0], O[1] - S * 17, INK, 1.5, 'ink'), text(O[0], O[1] - S * 17 - 8, sym('y')),
     f'<polyline points="{pts}" fill="none" stroke="{INK}" stroke-width="2"/>']
for i, t in enumerate([0, T * 0.25, T * 0.5, T * 0.75, T]):
    x, y, vy = vx * t, vy0 * t - g * t * t / 2, vy0 - g * t
    X, Y = P(x, y)
    b += [f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="5" fill="#d0d0d0" stroke="{INK}" stroke-width="1.5"/>',
          line(X, Y, X + K * vx, Y, VEL, 1.8, 'vel', dash='5 3')]
    if abs(vy) > 0.5:
        b += [line(X, Y, X, Y - K * vy, VEL, 1.8, 'vel', dash='5 3'), line(X, Y, X + K * vx, Y - K * vy, VEL, 2.8, 'vel')]
    else:
        b.append(text(X, Y - 16, f'{sym("v", "y")} = 0', size=14, c=VEL))
b += [text(P(vx * T * 0.25, 0)[0] + 10, P(0, vy0 * T * 0.25 - g * (T * 0.25) ** 2 / 2)[1] + 22, sym('v', 'x'), 'start', c=VEL, size=15),
      line(O[0], O[1] + 26, O[0] + S * R, O[1] + 26, GRAY, 1.2, 'gray'), line(O[0] + S * R, O[1] + 26, O[0], O[1] + 26, GRAY, 1.2, 'gray'),
      text(O[0] + S * R / 2, O[1] + 44, f'{sym("R")} (수평 도달 거리)', size=14),
      text(O[0] + 34, O[1] - 10, sym('θ', '0'), 'start', size=15)]
svg('f1_projectile', 560, 360, ''.join(b))

# 2. 등속 원운동: v는 접선, a는 중심 방향
C, r = (200, 190), 130
b = [f'<circle cx="{C[0]}" cy="{C[1]}" r="{r}" fill="none" stroke="{INK}" stroke-width="1.5"/>',
     f'<circle cx="{C[0]}" cy="{C[1]}" r="3" fill="{INK}"/>',
     line(C[0], C[1], C[0] + r * math.cos(math.radians(200)), C[1] - r * math.sin(math.radians(200)), GRAY, 1.2, dash='4 4'),
     text(C[0] + r / 2 * math.cos(math.radians(200)) - 4, C[1] - r / 2 * math.sin(math.radians(200)) - 10, sym('r'), c=GRAY)]
for a in (60, 150, 290):
    t = math.radians(a)
    X, Y = C[0] + r * math.cos(t), C[1] - r * math.sin(t)
    tx, ty = -math.sin(t), -math.cos(t)                 # 반시계 방향 접선(화면 좌표)
    b += [line(X, Y, X + 70 * tx, Y + 70 * ty, VEL, 3, 'vel'),
          line(X, Y, X - 60 * math.cos(t), Y + 60 * math.sin(t), ACC, 3, 'acc'),
          f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="7" fill="#d0d0d0" stroke="{INK}" stroke-width="1.5"/>']
    if a == 60:
        b += [text(X + 70 * tx - 6, Y + 70 * ty - 10, f'<tspan {SYM} font-weight="700">v</tspan>', c=VEL, size=19),
              text(X - 60 * math.cos(t) - 14, Y + 60 * math.sin(t) + 18, f'<tspan {SYM} font-weight="700">a</tspan>', c=ACC, size=19)]
svg('f2_circular', 400, 380, ''.join(b))

# 3. 상대 운동: 강을 건너는 배의 속도 더하기 (P 배, A 강가, B 강물)
O, k = (80, 250), 40
vPB, vBA = (0.0, 4.0), (2.0, 0.0)                     # 강물에서 본 배(건너는 쪽), 강가에서 본 강물(흐르는 쪽)
pB = (O[0] + k * vPB[0], O[1] - k * vPB[1])
pA = (pB[0] + k * vBA[0], pB[1] - k * vBA[1])
b = [f'<rect x="20" y="40" width="360" height="230" fill="#56B4E9" fill-opacity="0.12"/>',
     line(20, 40, 380, 40, INK, 1.5), line(20, 270, 380, 270, INK, 1.5),
     text(370, 62, '강물 흐름 →', 'end', c=WATER, size=14),
     line(*O, *pB, VEL, 3, 'vel'), text(O[0] - 12, (O[1] + pB[1]) / 2, f'{sym("v")}<tspan dy="5" font-size="12" {SYM}>PB</tspan>', 'end', c=VEL, size=17),
     line(*pB, *pA, WATER, 3, 'w'), text((pB[0] + pA[0]) / 2, pB[1] - 12, f'{sym("v")}<tspan dy="5" font-size="12" {SYM}>BA</tspan>', c=WATER, size=17),
     line(*O, *pA, CRIMSON, 3.5, 'c'), text((O[0] + pA[0]) / 2 + 20, (O[1] + pA[1]) / 2 + 20, f'{sym("v")}<tspan dy="5" font-size="12" {SYM}>PA</tspan>', 'start', c=CRIMSON, size=17)]
svg('f3_relative', 400, 300, ''.join(b))
