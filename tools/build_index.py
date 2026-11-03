"""Build the catalog page index.html from data/textbook_toc.json.

English text only (module titles from Principles of Physics 12e). A screen is linked when
sims/chNN/<screen-id>-*/index.html exists. Run: python3 tools/build_index.py
"""
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
toc = json.loads((ROOT / 'data' / 'textbook_toc.json').read_text(encoding='utf-8'))

# Folder names start with the first textbook module of the screen, e.g. ch04/4-4-projectile -> module 4.4.
first_module = {}
for c in toc['chapters']:
    for s in c['screens']:
        first_module[s['parts'][0]] = s['id']
built = {}
for page in ROOT.glob('sims/ch*/*/index.html'):
    module = '.'.join(page.parent.name.split('-')[:2])
    assert module in first_module, f'{page}: {module} is not the first module of any screen'
    built[first_module[module]] = page.relative_to(ROOT).as_posix()

mod_title = {m['id']: m['title'] for c in toc['chapters'] for m in c['modules']}
courses = {'I': '일반물리 I', 'II': '일반물리 II'}
rows = []
n_screens = n_built = 0
for course in ('I', 'II'):
    chs = [c for c in toc['chapters'] if c['course'] == course]
    rows.append(f'<section class="course"><h2>{courses[course]} <span>{chs[0]["chapter"]}–{chs[-1]["chapter"]}장</span></h2>')
    for c in chs:
        rows.append(f'<details class="chapter"{" open" if any(s["id"] in built for s in c["screens"]) else ""}><summary><b>{c["chapter"]}장</b> {html.escape(c["title"])}<span>화면 {len(c["screens"])}개</span></summary><ol>')
        for s in c['screens']:
            n_screens += 1
            parts = ', '.join(s['parts'])
            titles = ' · '.join(html.escape(mod_title[p]) for p in s['parts'])
            star = '<span class="core" title="핵심 화면">핵심</span>' if s['priority'] == '★' else ''
            if s['id'] in built:
                n_built += 1
                rows.append(f'<li class="ready"><a href="{built[s["id"]]}"><span class="mod">{parts}</span>{html.escape(s["ko"])} <small>({titles})</small></a>{star}</li>')
            else:
                rows.append(f'<li><span class="mod">{parts}</span>{html.escape(s["ko"])} <small>({titles})</small>{star}<span class="soon">준비 중</span></li>')
        rows.append('</ol></details>')
    rows.append('</section>')

page = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>서강대 일반물리 시뮬레이션</title>
<link rel="stylesheet" href="core/theme.css">
<style>
.catalog {{ max-width: 980px; margin: 0 auto; padding: 0 32px 32px; }}
.lead {{ color: var(--ink-2); font-size: 14px; line-height: 1.7; margin: 0 0 18px; }}
.course h2 {{ font-size: 18px; margin: 26px 0 10px; }}
.course h2 span {{ font-size: 13px; color: var(--ink-2); font-weight: 500; margin-left: 8px; }}
.chapter {{ background: var(--surface); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 8px; }}
.chapter summary {{ cursor: pointer; padding: 12px 16px; font-size: 14px; display: flex; gap: 8px; align-items: baseline; }}
.chapter summary span {{ margin-left: auto; color: var(--ink-2); font-size: 12px; }}
.chapter ol {{ list-style: none; margin: 0; padding: 0 16px 12px; }}
.chapter li {{ display: flex; gap: 10px; align-items: baseline; padding: 7px 0; border-top: 1px solid var(--line-2); font-size: 13px; color: var(--ink-2); }}
.chapter li.ready a {{ color: var(--ink); font-weight: 600; text-decoration: none; display: flex; gap: 10px; }}
.chapter li.ready a:hover {{ text-decoration: underline; }}
.mod {{ min-width: 84px; font-variant-numeric: tabular-nums; color: var(--ink-2); font-weight: 600; }}
.core {{ font-size: 11px; border: 1px solid var(--line); border-radius: 4px; padding: 0 5px; color: var(--ink-2); }}
.soon {{ margin-left: auto; font-size: 12px; color: var(--ink-3); }}
@media (max-width: 700px) {{ .catalog {{ padding: 0 12px 24px; }} .mod {{ min-width: 64px; }} }}
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
