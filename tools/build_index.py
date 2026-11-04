"""Build the catalog page index.html from data/textbook_toc.json.

English text only (module titles from Principles of Physics 12e). A screen is linked when
sims/chNN/<screen-id>-*/index.html exists. Run: python3 tools/build_index.py
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
toc = json.loads((ROOT / 'data' / 'textbook_toc.json').read_text(encoding='utf-8'))

# Folder names start with the catalog screen id, e.g. ch04/4-2-projectile -> screen 4-2 (user decision 2026-11-04).
screen_ids = {s['id'] for c in toc['chapters'] for s in c['screens']}
built = {}
for page in ROOT.glob('sims/ch*/*/index.html'):
    sid = '-'.join(page.parent.name.split('-')[:2])
    assert sid in screen_ids, f'{page}: {sid} is not a screen id'
    assert sid not in built, f'{page}: screen {sid} has two folders'
    built[sid] = page.relative_to(ROOT).as_posix()

mod_title = {m['id']: m['title'] for c in toc['chapters'] for m in c['modules']}
courses = {'I': '일반물리 I', 'II': '일반물리 II'}


def screen_text(page):
    """Korean title (spec.js title before the English part) and activity tab names (model.js) of a built screen."""
    folder = (ROOT / page).parent
    m = re.search(r"title: '([^']*)'", (folder / 'spec.js').read_text(encoding='utf-8'))
    assert m, f'{folder}: no title in spec.js'
    title = m.group(1).split(' (')[0]
    acts = []
    tabs = re.search(r"\{ id: 'activity', type: 'tabs'.*?options: \[(.*?)\]", (folder / 'model.js').read_text(encoding='utf-8'), re.S)
    if tabs:
        acts = re.findall(r"label: '([^']*)'", tabs.group(1))
        assert acts, f'{folder}: activity tabs without labels'
    return title, acts


rows = []
n_screens = n_built = 0
for course in ('I', 'II'):
    chs = [c for c in toc['chapters'] if c['course'] == course]
    c_built = sum(s['id'] in built for c in chs for s in c['screens'])
    c_all = sum(len(c['screens']) for c in chs)
    rows.append(f'<section class="course"><h2>{courses[course]} <span>{chs[0]["chapter"]}–{chs[-1]["chapter"]}장 · 화면 {c_all}개 중 {c_built}개 공개</span></h2>')
    later = []
    for c in chs:
        ready = [s for s in c['screens'] if s['id'] in built]
        n_screens += len(c['screens'])
        if not ready:
            items = ''.join(f'<li><span class="mod">{", ".join(s["parts"])}</span>{html.escape(s["ko"])}</li>' for s in c['screens'])
            later.append(f'<details class="later"><summary><b>{c["chapter"]}장</b> {html.escape(c["title"])}<span>화면 {len(c["screens"])}개 준비 중</span></summary><ol>{items}</ol></details>')
            continue
        rows.append(f'<section class="chapter"><h3><b>{c["chapter"]}장</b> {html.escape(c["title"])}<span>화면 {len(c["screens"])}개 중 {len(ready)}개 공개</span></h3><div class="cards">')
        for s in c['screens']:
            parts = ', '.join(s['parts'])
            titles = ' · '.join(html.escape(mod_title[p]) for p in s['parts'])
            star = '<span class="core" title="핵심 화면">핵심</span>' if s['priority'] == '★' else ''
            if s['id'] in built:
                n_built += 1
                title, acts = screen_text(built[s['id']])
                thumb = f'assets/thumbs/{s["id"]}.jpg'
                img = f'<img src="{thumb}" alt="" loading="lazy">' if (ROOT / thumb).exists() else '<span class="noimg"></span>'
                act = f'<p class="acts">{" · ".join(html.escape(a) for a in acts)}</p>' if acts else f'<p class="acts">{html.escape(s["ko"])}</p>'
                rows.append(f'<a class="card" href="{built[s["id"]]}">{img}<div class="body"><div class="top"><span class="mod">Module {parts}</span>{star}</div>'
                            f'<h4>{html.escape(title)}</h4>{act}<p class="en">{titles}</p></div></a>')
            else:
                rows.append(f'<div class="card soon"><div class="body"><div class="top"><span class="mod">Module {parts}</span>{star}<span class="tag">준비 중</span></div>'
                            f'<h4>{html.escape(s["ko"])}</h4><p class="en">{titles}</p></div></div>')
        rows.append('</div></section>')
    if later:
        rows.append(f'<div class="later-list">{"".join(later)}</div>')
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
.lead {{ color: var(--ink-2); font-size: 14px; line-height: 1.7; margin: 0 0 8px; max-width: 760px; }}
.course h2 {{ font-size: 20px; margin: 34px 0 4px; display: flex; align-items: baseline; gap: 12px; }}
.course h2 span {{ font-size: 13px; color: var(--ink-2); font-weight: 500; }}
.chapter h3 {{ font-size: 15px; font-weight: 600; margin: 22px 0 12px; display: flex; gap: 8px; align-items: baseline; padding-bottom: 8px; border-bottom: 1px solid var(--line); }}
.chapter h3 span {{ margin-left: auto; color: var(--ink-2); font-size: 12px; font-weight: 500; }}
.cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(270px, 100%), 1fr)); gap: 14px; }}
.card {{ min-width: 0; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; color: var(--ink); text-decoration: none; transition: box-shadow .15s, transform .15s; }}
a.card:hover {{ box-shadow: 0 6px 18px #26354a1f; transform: translateY(-2px); }}
a.card:focus-visible {{ outline: 3px solid var(--focus); outline-offset: 2px; }}
.card img, .card .noimg {{ display: block; width: 100%; aspect-ratio: 603 / 370; object-fit: cover; background: #e9edf1; border-bottom: 1px solid var(--line-2); }}
.card .body {{ padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 4px; }}
.card .top {{ display: flex; gap: 6px; align-items: center; }}
.card .mod {{ font-size: 12px; font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }}
.card h4 {{ margin: 2px 0 0; font-size: 16px; line-height: 1.4; }}
.card .acts {{ margin: 0; font-size: 13px; color: var(--ink-2); line-height: 1.5; }}
.card .en {{ margin: 2px 0 0; font-size: 11.5px; color: var(--ink-3); line-height: 1.5; }}
.card.soon {{ background: transparent; border-style: dashed; color: var(--ink-2); }}
.card.soon h4 {{ font-size: 14px; font-weight: 600; }}
.core {{ font-size: 11px; border: 1px solid var(--line); border-radius: 4px; padding: 0 5px; color: var(--ink-2); background: var(--surface); }}
.tag {{ margin-left: auto; font-size: 11px; color: var(--ink-3); }}
.later-list {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); gap: 8px; margin-top: 22px; }}
.later {{ background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }}
.later summary {{ cursor: pointer; padding: 10px 14px; font-size: 13.5px; display: flex; gap: 8px; align-items: baseline; }}
.later summary span {{ margin-left: auto; color: var(--ink-3); font-size: 12px; white-space: nowrap; }}
.later summary b, .chapter h3 b {{ white-space: nowrap; }}
.later ol {{ list-style: none; margin: 0; padding: 0 14px 10px; }}
.later li {{ display: flex; gap: 10px; padding: 6px 0; border-top: 1px solid var(--line-2); font-size: 12.5px; color: var(--ink-2); }}
.later .mod {{ min-width: 64px; font-weight: 600; font-variant-numeric: tabular-nums; }}
@media (max-width: 700px) {{ .catalog {{ padding: 0 16px 24px; }} .cards {{ grid-template-columns: minmax(0, 1fr); }} .course h2 {{ flex-wrap: wrap; }} }}
</style>
</head>
<body>
<header class="page"><div><div class="crumb">서강대학교 물리학과</div><h1>일반물리 시뮬레이션</h1></div>
<p class="header-note">교재 Principles of Physics 12e · 화면 {n_screens}개 중 {n_built}개 공개</p></header>
<main class="catalog">
<p class="lead">Halliday, Resnick, Walker, <i>Principles of Physics</i> 12판(International Adaptation)의 장과 module 순서로 정리한 3D 시뮬레이션이다. module 번호는 교재 번호와 같다.</p>
{chr(10).join(rows)}
</main>
<footer class="page">서강대학교 물리학과 · 교재 그림과 본문은 싣지 않았다.</footer>
</body>
</html>
"""
(ROOT / 'index.html').write_text(page, encoding='utf-8')
print(f'index.html written: {n_built} built of {n_screens} screens')
assert n_screens == 126, n_screens
