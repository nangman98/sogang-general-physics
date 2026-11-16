"""1장 시뮬레이션 축 위에 놓을 물체 사진을 Wikimedia Commons에서 받는다.

실행  python3 chapters/ch01/fetch_images.py  ->  chapters/ch01/img/<번호>.jpg, chapters/ch01/img/credits.json
- 물체마다 검색어(또는 정해 둔 파일 이름)로 Commons를 찾아, 라이선스가 퍼블릭 도메인·CC0·CC BY인 첫 그림을 고른다.
  CC BY-SA와 그 밖의 라이선스는 쓰지 않는다. 교재 그림은 출판사 저작물이라 쓰지 않는다(사용자 결정 2026-11-16).
- 그림은 가로세로 240 px 정사각형 JPEG로 저장한다. 사진은 가운데를 자르고 도식(PNG·SVG)은 흰 여백을 둔다.
- credits.json에 Commons 파일 이름, 원본 주소, 작가, 라이선스를 적는다. 페이지 아래 "그림 출처"가 이 파일을 읽는다.
- PICK에 파일 이름을 적은 물체는 검색 대신 그 파일을 쓴다(검색 첫 결과가 맞지 않을 때 사람이 고른 것).
"""
import io
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'img'
OUT.mkdir(exist_ok=True)
UA = {'User-Agent': 'sogang-general-physics/0.1 (https://github.com/nangman98/sogang-general-physics; course site build script)'}
OK = re.compile(r'^(Public domain|PD.*|CC0.*|CC BY [0-9.]+|CC BY [0-9.]+ .*)$', re.I)

# 물체 이름 -> 검색어. 같은 그림을 쓰는 물체는 같은 검색어를 쓴다.
QUERY = {
    '처음 생긴 은하까지 거리': 'Hubble Ultra Deep Field',
    '안드로메다 은하까지 거리': 'Andromeda galaxy GALEX',
    '프록시마 센타우리까지 거리': 'Proxima Centauri Hubble',
    '명왕성까지 거리': 'Pluto New Horizons true color',
    '지구 반지름': 'The Blue Marble AS17-148-22727',
    '에베레스트산 높이': 'Mount Everest north face',
    '사람의 키': 'Vitruvian Man Leonardo',
    '킬로그램 원기의 높이': 'prototype kilogram replica NIST',
    '교재 종이 한 장의 두께': 'stack of paper sheets',
    '보통 바이러스의 길이': 'influenza virus transmission electron micrograph CDC',
    '수소 원자 반지름': 'hydrogen atom Bohr model',
    '양성자 반지름': 'proton quark structure',
    '양성자 수명 (예측값)': 'proton quark structure',
    '우주의 나이': 'WMAP cosmic microwave background',
    '쿠푸 피라미드의 나이': 'Great Pyramid of Giza Khufu',
    '사람의 기대 수명': 'hourglass',
    '하루의 길이': 'sunrise from International Space Station',
    '한 시간': 'clock face',
    '심장 박동 사이 시간': 'electrocardiogram normal sinus rhythm',
    '뮤온의 수명': 'cloud chamber muon',
    '실험실에서 만든 가장 짧은 빛 펄스': 'femtosecond laser',
    '가장 불안정한 입자의 수명': 'bubble chamber tracks',
    '플랑크 시간': 'Max Planck 1933',
    '알려진 우주': 'Hubble eXtreme Deep Field',
    '우리 은하': 'Milky Way galactic center',
    '태양': 'Sun Solar Dynamics Observatory',
    '달': 'full moon',
    '소행성 에로스': '433 Eros NEAR',
    '작은 산': 'hill landscape',
    '원양 여객선': 'RMS Olympic',
    '코끼리': 'African bush elephant',
    '킬로그램 원기': 'prototype kilogram replica NIST',
    '포도알': 'single grape',
    '먼지 한 톨': 'dust particle scanning electron microscope',
    '페니실린 분자': 'Penicillin G',
    '우라늄 원자': 'uranium metal',
    '양성자': 'proton quark structure',
    '전자': 'electron',
}
# 물체 이름 -> 'File:...'. 검색 첫 결과가 맞지 않거나 허용 라이선스 그림이 없어 라이선스를 확인하고 고른 파일(2026-11-16).
# 뮤온은 허용 라이선스 사진이 없어 뮤온 검출기 사진을, 전자는 수소 원자 그림(전자 하나와 핵)을 쓴다.
PICK = {
    '양성자 반지름': 'File:Proton diagram.png', '양성자 수명 (예측값)': 'File:Proton diagram.png', '양성자': 'File:Proton diagram.png',
    '우주의 나이': 'File:WMAP 2010.png',
    '쿠푸 피라미드의 나이': 'File:Giza Great Pyramid of Khufu (9793885004).jpg',
    '사람의 기대 수명': 'File:Hourglass with sand.jpg',
    '하루의 길이': 'File:An orbital sunrise (iss071e001425).jpg',
    '한 시간': 'File:Pittsfield Town Clock Face - Google Art Project.jpg',
    '심장 박동 사이 시간': 'File:12 lead generated sinus rhythm.JPG',
    '뮤온의 수명': 'File:CMS muon chambers.jpg',
    '실험실에서 만든 가장 짧은 빛 펄스': 'File:Femtosecond laser spark.jpg',
    '가장 불안정한 입자의 수명': 'File:Neutrino bubble chamber decay overlay.png',
    '플랑크 시간': 'File:Max Planck 1933.jpg',
    '알려진 우주': 'File:Hubble Extreme Deep Field (full resolution).png',
    '우리 은하': 'File:Milky Way IR Spitzer.jpg',
    '작은 산': 'File:Freudenberg sg Switzerland.jpg',
    '코끼리': 'File:Loxodonta africana South Luangwa National Park (1).jpg',
    '포도알': 'File:Green Grape 3.jpg',
    '먼지 한 톨': 'File:Comet dust microscopic photo.jpg',
    '수소 원자 반지름': 'File:Hydrogen atom.svg', '전자': 'File:Hydrogen atom.svg',
}


def get(url):
    """요청 사이 2 s를 쉬고, 429면 30 s씩 늘려 기다린 뒤 다시 받는다(Wikimedia 요청 정책)."""
    for wait in (0, 30, 60, 120):
        time.sleep(wait + 2)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    raise RuntimeError(f'429 four times: {url}')


def api(params):
    return json.loads(get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'format': 'json', **params})))


def candidates(name):
    common = {'prop': 'imageinfo', 'iiprop': 'url|mime|extmetadata', 'iiurlwidth': 480,
              'iiextmetadatafilter': 'LicenseShortName|Artist|ImageDescription'}
    if name in PICK:
        d = api({'action': 'query', 'titles': PICK[name], **common})
        return list(d['query']['pages'].values())
    d = api({'action': 'query', 'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': QUERY[name], 'gsrlimit': 12, **common})
    return sorted(d.get('query', {}).get('pages', {}).values(), key=lambda p: p['index'])


def clean(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html or '')).strip()


credits, cache = {}, {}
for i, name in enumerate(QUERY):
    key = PICK.get(name) or QUERY[name]
    if key not in cache:
        chosen = None
        for p in candidates(name):
            ii = p['imageinfo'][0]
            lic = ii['extmetadata'].get('LicenseShortName', {}).get('value', '')
            if ii['mime'] in ('image/jpeg', 'image/png', 'image/svg+xml') and OK.match(lic.strip()):   # SVG는 Commons PNG 미리보기를 받는다
                chosen = (p['title'], ii, lic.strip())
                break
        assert chosen, f'{name}: no image with an allowed license for {key!r}'
        title, ii, lic = chosen
        im = Image.open(io.BytesIO(get(ii['thumburl']))).convert('RGBA')
        bg = Image.new('RGBA', im.size, 'white'); bg.alpha_composite(im); im = bg.convert('RGB')   # 투명 배경은 흰색
        if ii['mime'] == 'image/jpeg':   # 사진은 가운데를 정사각형으로 자른다
            s = min(im.size)
            im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))
        else:                            # 도식(PNG·SVG)은 자르지 않고 흰 여백을 둔다
            s = max(im.size)
            pad = Image.new('RGB', (s, s), 'white'); pad.paste(im, ((s - im.width) // 2, (s - im.height) // 2)); im = pad
        im = im.resize((240, 240), Image.LANCZOS)
        fname = f'{len(cache) + 1:02d}.jpg'
        im.save(OUT / fname, quality=82)
        cache[key] = {'file': fname, 'commons': title, 'url': ii['descriptionurl'],
                      'artist': clean(ii['extmetadata'].get('Artist', {}).get('value')), 'license': lic}
        print(f'{fname}  {lic:18s}  {title}', file=sys.stderr)
    credits[name] = cache[key]

(OUT / 'credits.json').write_text(json.dumps(credits, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(credits)} objects, {len(cache)} images', file=sys.stderr)
