"""6장부터 쓰는 페이지 그림 공통 부품. 각 장 make_figs.py가 불러 쓴다.

숫자 없는 모양 그림이다. 색은 05_디자인_기준.md를 따른다. 힘 #D55E00, 속도 #0072B2, 가속도 #CC79A7, 물체 회색, 주요 양 진한 빨강.
"""
import math
import pathlib

INK, GRAY, LIGHT, FORCE, VEL, ACC, CRIMSON, NOTE = '#1a1a1a', '#8a8a8a', '#d0d0d0', '#D55E00', '#0072B2', '#CC79A7', '#840025', '#555555'
SYM = 'font-family="Times New Roman, STIX Two Text, serif" font-style="italic"'
MARK = {'ink': INK, 'gray': GRAY, 'f': FORCE, 'v': VEL, 'a': ACC, 'c': CRIMSON}


def V(name, sub=''):
    """벡터 기호: 굵은 이탤릭 + 아래 첨자."""
    s = f'<tspan {SYM} font-weight="700">{name}</tspan>'
    return s + (f'<tspan dy="5" font-size="0.72em" {SYM}>{sub}</tspan><tspan dy="-5"> </tspan>' if sub else '')


def it(name, sub=''):
    """크기(스칼라) 기호."""
    s = f'<tspan {SYM}>{name}</tspan>'
    return s + (f'<tspan dy="5" font-size="0.72em" {SYM}>{sub}</tspan><tspan dy="-5"> </tspan>' if sub else '')


def svg(out, name, w, h, body):
    out = pathlib.Path(out)
    out.mkdir(exist_ok=True)
    markers = ''.join(
        f'<marker id="m-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>' for k, c in MARK.items())
    (out / f'{name}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="16" fill="{INK}">'
        f'<defs>{markers}</defs>{"".join(body)}</svg>\n', encoding='utf-8')
    print(name, w, h)


f1 = lambda x: f'{x:.1f}'


def line(x1, y1, x2, y2, c=INK, w=2, m=None, dash=None, op=None):
    mk = f' marker-end="url(#m-{m})"' if m else ''
    d = f' stroke-dasharray="{dash}"' if dash else ''
    o = f' stroke-opacity="{op}"' if op else ''
    return f'<line x1="{f1(x1)}" y1="{f1(y1)}" x2="{f1(x2)}" y2="{f1(y2)}" stroke="{c}" stroke-width="{w}"{d}{o}{mk}/>'


def text(x, y, s, anchor='middle', c=INK, size=None, weight=None):
    sz = f' font-size="{size}"' if size else ''
    wt = f' font-weight="{weight}"' if weight else ''
    return f'<text x="{f1(x)}" y="{f1(y)}" text-anchor="{anchor}" fill="{c}"{sz}{wt}>{s}</text>'


def box(x, y, w, h, fill=LIGHT):
    return f'<rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" fill="{fill}" stroke="{INK}" stroke-width="1.5"/>'


def circle(cx, cy, r, fill=LIGHT, stroke=INK, w=1.5):
    return f'<circle cx="{f1(cx)}" cy="{f1(cy)}" r="{f1(r)}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'


def dot(cx, cy, r=4, c=INK):
    return f'<circle cx="{f1(cx)}" cy="{f1(cy)}" r="{r}" fill="{c}"/>'


def poly(pts, c=INK, w=2.5, dash=None, fill='none', op=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    o = f' fill-opacity="{op}"' if op else ''
    return f'<polyline points="{" ".join(f"{f1(x)},{f1(y)}" for x, y in pts)}" fill="{fill}"{o} stroke="{c}" stroke-width="{w}"{d}/>'


def arc(cx, cy, r, a0, a1, c=INK, w=1.5, m=None, dash=None):
    """수학 각(도, 반시계)으로 a0에서 a1까지의 호. 화면 y는 아래로 증가."""
    p = lambda a: (cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 0 if a1 > a0 else 1
    mk = f' marker-end="url(#m-{m})"' if m else ''
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<path d="M{f1(x0)},{f1(y0)} A{r},{r} 0 {large} {sweep} {f1(x1)},{f1(y1)}" fill="none" stroke="{c}" stroke-width="{w}"{d}{mk}/>'


def axes(x0, y0, x1, y1, xl, yl, size=17):
    """원점 (x0, y0)에서 오른쪽 x1, 위 y1까지의 축과 축 이름."""
    return [line(x0, y0, x1, y0, INK, 1.5, 'ink'), line(x0, y0, x0, y1, INK, 1.5, 'ink'),
            text(x1 + 6, y0 + 6, xl, 'start', size=size), text(x0 - 8, y1 + 6, yl, 'end', size=size)]


def spring(x0, x1, y, coils=8, amp=10):
    n = coils * 2
    pts = [(x0, y), (x0 + 10, y)]
    for i in range(1, n):
        pts.append((x0 + 10 + (x1 - x0 - 20) * i / n, y + (amp if i % 2 else -amp)))
    pts += [(x1 - 10, y), (x1, y)]
    return poly(pts, INK, 1.8)
