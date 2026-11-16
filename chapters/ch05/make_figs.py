"""5장 페이지 그림(SVG)을 만든다. 실행 python3 chapters/ch05/make_figs.py -> chapters/ch05/fig/*.svg

모양 그림이다. 힘은 #D55E00, 가속도는 #CC79A7, 물체는 회색(05_디자인_기준.md).
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent / 'fig'
OUT.mkdir(exist_ok=True)
INK, GRAY, FORCE, ACC, CRIMSON = '#1a1a1a', '#8a8a8a', '#D55E00', '#CC79A7', '#840025'
SYM = 'font-family="Times New Roman, STIX Two Text, serif" font-style="italic"'


def F(name, sub=''):   # 벡터 기호: 굵은 이탤릭 + 아래 첨자
    s = f'<tspan {SYM} font-weight="700">{name}</tspan>'
    return s + (f'<tspan dy="5" font-size="12" {SYM}>{sub}</tspan><tspan dy="-5"> </tspan>' if sub else '')


def svg(name, w, h, body):
    markers = ''.join(
        f'<marker id="m-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
        for k, c in (('f', FORCE), ('acc', ACC), ('c', CRIMSON)))
    (OUT / f'{name}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="16" fill="{INK}">'
        f'<defs>{markers}</defs>{body}</svg>\n', encoding='utf-8')
    print(name, w, h)


def line(x1, y1, x2, y2, c=FORCE, w=3, m='f', dash=None):
    mk = f' marker-end="url(#m-{m})"' if m else ''
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}"{d}{mk}/>'


def text(x, y, s, anchor='middle', c=INK, size=None):
    sz = f' font-size="{size}"' if size else ''
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{c}"{sz}>{s}</text>'


box = lambda x, y, w, h, label='': f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#d0d0d0" stroke="{INK}" stroke-width="1.5"/>' + (text(x + w / 2, y + h / 2 + 6, label) if label else '')
floor = lambda x1, x2, y, note='': line(x1, y, x2, y, INK, 2, None) + (text((x1 + x2) / 2, y + 22, note, size=13, c='#555555') if note else '')

# 1. 자유물체도: 마찰 없는 바닥에서 끌리는 상자
b = [floor(20, 420, 200, '마찰 없는 바닥'), box(170, 140, 80, 60),
     f'<circle cx="210" cy="170" r="4" fill="{INK}"/>',
     line(210, 170, 330, 170), text(338, 175, F('F'), 'start', FORCE, 18),
     line(210, 170, 210, 70), text(220, 78, F('F', 'N'), 'start', FORCE, 18),
     line(210, 170, 210, 270), text(220, 268, F('F', 'g'), 'start', FORCE, 18),
     line(150, 110, 230, 110, ACC, 2.5, 'acc'), text(140, 115, F('a'), 'end', ACC, 18)]
svg('f1_fbd', 440, 290, ''.join(b))

# 2. 여러 가지 힘: 탁자 위 상자, 줄에 매달린 상자, 밀리는 상자의 마찰력
b = [floor(20, 180, 220), box(60, 160, 80, 60), line(100, 190, 100, 110), text(110, 118, F('F', 'N'), 'start', FORCE, 17),
     line(100, 190, 100, 270), text(110, 268, F('F', 'g'), 'start', FORCE, 17), text(100, 300, '탁자 위', size=14, c='#555555'),
     line(260, 20, 360, 20, INK, 2, None), line(310, 20, 310, 140, GRAY, 2, None), box(280, 140, 60, 50),
     line(310, 165, 310, 85), text(320, 92, F('T'), 'start', FORCE, 17),
     line(310, 165, 310, 245), text(320, 243, F('F', 'g'), 'start', FORCE, 17), text(310, 300, '줄에 매달림', size=14, c='#555555'),
     floor(420, 600, 220), box(470, 160, 80, 60), line(510, 190, 590, 190), text(592, 182, F('F'), 'start', FORCE, 17),
     line(510, 214, 450, 214), text(444, 210, F('f'), 'end', FORCE, 17), text(510, 300, '미는 힘과 마찰력', size=14, c='#555555')]
svg('f2_forces', 640, 320, ''.join(b))

# 3. 제3법칙: 맞닿은 두 상자 A, B가 서로 주고받는 힘
b = [floor(20, 560, 200, '마찰 없는 바닥'), box(180, 130, 100, 70, 'A'), box(280, 140, 80, 60, 'B'),
     line(80, 165, 176, 165), text(76, 158, F('F'), 'end', FORCE, 18),
     line(280, 150, 220, 150, CRIMSON, 3, 'c'), text(214, 122, F('F', 'AB'), 'end', CRIMSON, 17),
     line(280, 185, 340, 185, CRIMSON, 3, 'c'), text(346, 236, F('F', 'BA'), 'start', CRIMSON, 17)]
svg('f3_third', 580, 260, ''.join(b))
