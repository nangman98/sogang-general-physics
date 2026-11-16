"""Build the catalog page index.html from data/textbook_toc.json and the chapter pages.

Only chapter pages written in the new format are listed (user decision 2026-11-16): a chapter is
linked when chapters/chNN/index.html exists. The earlier screens under sims/ stay in the repository
but are not linked. Card text is the page's <h1> and its <h2> section titles. Run: python3 tools/build_index.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
toc = json.loads((ROOT / 'data' / 'textbook_toc.json').read_text(encoding='utf-8'))
courses = {'I': '일반물리 I', 'II': '일반물리 II'}

pages = {}
for page in sorted(ROOT.glob('chapters/ch[0-9][0-9]/index.html')):
    text = page.read_text(encoding='utf-8')
    h1 = re.search(r'<h1>(.*?)</h1>', text)
    sections = re.findall(r'<h2>(.*?)</h2>', text)
    assert h1 and sections, f'{page}: needs an <h1> and <h2> sections'
    pages[int(page.parent.name[2:])] = (page.relative_to(ROOT).as_posix(), h1.group(1), sections)

rows = []
for course in ('I', 'II'):
    chs = [c for c in toc['chapters'] if c['course'] == course and c['chapter'] in pages]
    if not chs:
        continue
    rows.append(f'<section class="course"><h2>{courses[course]}</h2>')
    for c in chs:
        href, h1, sections = pages[c['chapter']]
        rows.append(f'<section class="chapter"><h3>{h1}</h3><div class="cards">'
                    f'<a class="card" href="{href}"><div class="body"><h4>{" · ".join(sections)}</h4></div></a></div></section>')
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
print(f'index.html written: {len(pages)} chapter pages {sorted(pages)}')
