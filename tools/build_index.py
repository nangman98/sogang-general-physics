"""Build the catalog page index.html from data/textbook_toc.json and the chapter pages.

Only pages written in the new format are listed (user decision 2026-11-16): chapters/chapters.json
gives each chapter's Korean name and page order, and each page's <meta name="card-title"> is its card.
The earlier screens under sims/ stay in the repository but are not linked. Run: python3 tools/build_index.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
toc = json.loads((ROOT / 'data' / 'textbook_toc.json').read_text(encoding='utf-8'))
courses = {'I': '일반물리 I', 'II': '일반물리 II'}

# Chapter names and page order: chapters/chapters.json. Card title: <meta name="card-title"> of each page.
chap = {int(k): v for k, v in json.loads((ROOT / 'chapters' / 'chapters.json').read_text(encoding='utf-8')).items()}
pages = {}
for n, c in chap.items():
    folder = ROOT / 'chapters' / f'ch{n:02d}'
    assert sorted(c['pages']) == sorted(p.name for p in folder.glob('*.html')), f'{folder}: pages in chapters.json differ from the folder'
    pages[n] = []
    for name in c['pages']:
        m = re.search(r'<meta name="card-title" content="([^"]+)">', (folder / name).read_text(encoding='utf-8'))
        assert m, f'{folder / name}: no card-title'
        pages[n].append((f'chapters/ch{n:02d}/{name}', m.group(1)))

rows = []
for course in ('I', 'II'):
    chs = [c for c in toc['chapters'] if c['course'] == course and c['chapter'] in pages]
    if not chs:
        continue
    rows.append(f'<section class="course"><h2>{courses[course]}</h2>')
    for c in chs:
        cards = ''.join(f'<a class="card" href="{href}"><div class="body"><h4>{title}</h4></div></a>' for href, title in pages[c['chapter']])
        rows.append(f'<section class="chapter"><h3>{c["chapter"]}장 {chap[c["chapter"]]["ko"]} ({c["title"]})</h3><div class="cards">{cards}</div></section>')
    rows.append('</section>')

page = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>서강대 일반물리 시뮬레이션</title>
<link rel="stylesheet" href="core/theme.css">
<style>
.catalog {{ max-width: var(--max-width); margin: 0 auto; padding: 0 32px 40px; }}
.course h2 {{ font-size: 20px; margin: 34px 0 4px; }}
.chapter h3 {{ font-size: 15px; font-weight: 600; margin: 22px 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }}
.cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(270px, 100%), 1fr)); gap: 14px; }}
.card {{ min-width: 0; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; color: var(--ink); text-decoration: none; transition: box-shadow .15s, transform .15s; }}
a.card:hover {{ box-shadow: 0 6px 18px #26354a1f; transform: translateY(-2px); }}
a.card:focus-visible {{ outline: 3px solid var(--focus); outline-offset: 2px; }}
.card .body {{ padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 4px; }}
.card h4 {{ margin: 2px 0 0; font-size: 16px; line-height: 1.4; }}
@media (max-width: 700px) {{ .catalog {{ padding: 0 16px 24px; }} .cards {{ grid-template-columns: minmax(0, 1fr); }} }}
</style>
</head>
<body>
<header class="page"><div><div class="crumb">서강대학교 물리학과</div><h1>일반물리 시뮬레이션</h1></div></header>
<main class="catalog">
{chr(10).join(rows)}
</main>
</body>
</html>
"""
(ROOT / 'index.html').write_text(page, encoding='utf-8')
print(f'index.html written: ' + ', '.join(f'{n}장 {len(v)}쪽' for n, v in pages.items()))
