"""2장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch02/make_figs.py -> chapters/ch02/fig/*.svg

값의 출처
- 위치 그림은 원점 O와 x = 3 m의 물체다(사용자가 보여 준 예시 그림과 같은 꼴, 2026-11-16).
- 자유 낙하 그림은 정지 상태에서 떨어지는 물체(g = 9.8 m/s^2)의 t = 0, 1, 2, 3 s 위치와 속도다(값은 교재 Sample Problem 2.5.1과 같고, 수면 표시는 2026-11-16 사용자 결정으로 뺐다).
색은 05_디자인_기준.md를 따른다. 축과 글자 검정, 위치 진한 빨강, 속도 #0072B2, 가속도 #CC79A7.
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
OUT.mkdir(exist_ok=True)
INK, GRAY, CRIMSON, VEL, ACC = '#1a1a1a', '#8a8a8a', '#840025', '#0072B2', '#CC79A7'
SYM = 'font-family="Times New Roman, STIX Two Text, serif" font-style="italic"'


def sym(s):
    return f'<tspan {SYM}>{s}</tspan>'


def svg(name, w, h, body):
    markers = ''.join(
        f'<marker id="a-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
        for k, c in (('ink', INK), ('crimson', CRIMSON), ('vel', VEL), ('acc', ACC), ('gray', GRAY)))
    text = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="15" fill="{INK}">'
            f'<defs>{markers}</defs>{body}</svg>\n')
    (OUT / f'{name}.svg').write_text(text, encoding='utf-8')
    print(name, w, h)


def line(x1, y1, x2, y2, c=INK, w=2, arrow=None, dash=None):
    m = f' marker-end="url(#a-{arrow})"' if arrow else ''
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"{d}{m}/>'


def text(x, y, s, anchor='middle', c=INK, size=None, weight=None):
    sz = f' font-size="{size}"' if size else ''
    wt = f' font-weight="{weight}"' if weight else ''
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" fill="{c}"{sz}{wt}>{s}</text>'


def axis_1d(x0, unit, kmin, kmax, y, label_every=1, x_end=None):
    """x축 한 줄. 원점 픽셀 x0, 1 m당 unit 픽셀."""
    xs = x0 + unit * kmin - 30
    xe = x_end or (x0 + unit * kmax + 40)
    b = [line(xs, y, xe, y, INK, 2, 'ink'), text(xe + 8, y + 5, f'{sym("x")} (m)', 'start')]
    for k in range(kmin, kmax + 1):
        X = x0 + unit * k
        b.append(line(X, y - 6, X, y + 6, INK, 1.5))
        if k % label_every == 0:
            b.append(text(X, y + 24, f'{k}'.replace('-', '−'), size=14, c='#555555'))
    return b


# 1. 위치: 원점 O, x = 3 m의 물체
x0, u, y = 200, 70, 100
b = axis_1d(x0, u, -2, 5, y)
b += [text(x0, y + 44, '원점 O', size=14, c='#555555'),
      f'<circle cx="{x0 + 3 * u}" cy="{y}" r="9" fill="{CRIMSON}"/>',
      line(x0, 58, x0 + 3 * u - 10, 58, CRIMSON, 2.5, 'crimson'),
      text(x0 + 1.5 * u, 44, f'{sym("x")} = 3 m', c=CRIMSON, weight=600),
      text(x0 - 1.5 * u, 84, '← 음의 방향', size=14, c='#555555'),
      text(x0 + 4.4 * u, 84, '양의 방향 →', size=14, c='#555555')]
svg('f1_position', 660, 160, ''.join(b))

# 6. 자유 낙하: 정지 상태에서 떨어지는 물체
g, Y0, s, VS = 9.8, 60, 6.25, 2.4   # y = 0 at pixel Y0, 6.25 px per m, velocity arrow 2.4 px per m/s
yp = lambda y: Y0 - s * y
AX, BX = 110, 190
num = lambda z: f'{z:.1f}'.replace('-', '−') if abs(z) > 1e-9 else '0'
b = [line(AX, yp(-52), AX, yp(4), INK, 2, 'ink'),
     text(AX, yp(4) - 12, f'{sym("y")} (m)', size=14),
     *[e for y in (0, -10, -20, -30, -40) for e in (line(AX - 6, yp(y), AX + 6, yp(y), INK, 1.5),
                                                    text(AX - 12, yp(y) + 5, str(y).replace('-', '−'), 'end', size=13, c='#555555'))],
     line(330, 22, 330, 46, ACC, 2.5, 'acc'), text(340, 40, f'{sym("a")} = −{sym("g")}', 'start', size=14, c=ACC, weight=600),
     line(430, 22, 430, 46, VEL, 2.5, 'vel'), text(440, 40, sym('v'), 'start', size=14, c=VEL, weight=600)]
for t in (0, 1, 2, 3):
    y, v = -0.5 * g * t * t, -g * t
    Y = yp(y)
    b += [f'<circle cx="{BX}" cy="{Y:.1f}" r="9" fill="#d0d0d0" stroke="{INK}" stroke-width="1.5"/>',
          line(BX - 9, Y, AX + 6, Y, GRAY, 1, dash='2 3') if t else '',
          line(BX - 26, Y - 14, BX - 26, Y + 16, ACC, 2.5, 'acc')]
    if t:
        b.append(line(BX + 22, Y, BX + 22, Y + VS * abs(v), VEL, 2.5, 'vel'))
    b.append(text(BX + 44, Y + 5, f'{sym("t")} = {t}{".0" if t else ""} s,  {sym("y")} = {num(y)} m,  {sym("v")} = {num(v)} m/s', 'start', size=14))
svg('f6_free_fall', 560, 440, ''.join(b))
