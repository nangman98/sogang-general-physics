// 1장 시뮬레이션 "길이·시간·질량의 크기"의 물체 그림. 모두 100 × 100 칸에 직접 그린 SVG 조각이다(사진·외부 그림 없음).
// 우주 물체는 짙은 남색 바탕, 나머지는 흰 바탕이나 하늘 바탕 위에 그린다. 칸은 모서리가 둥근 타일로 자른다.
// ICON_DEFS(그라데이션·자르기 틀)는 장면의 defs에 한 번 넣고, iconOf(물체 이름)이 타일 한 장의 SVG 글을 돌려준다.

// 늘 같은 별 배치를 얻는 간단한 난수
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const f = x => x.toFixed(1);
const stars = (n, seed) => {
  const r = rng(seed); let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f(r() * 100)}" cy="${f(r() * 100)}" r="${(0.4 + r() * 0.9).toFixed(2)}" fill="#ffffff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  return s;
};

export const ICON_DEFS = `
<clipPath id="i-clip"><rect width="100" height="100" rx="14"/></clipPath>
<clipPath id="i-ec"><circle cx="50" cy="50" r="34"/></clipPath>
<clipPath id="i-ec2"><circle cx="62" cy="50" r="28"/></clipPath>
<linearGradient id="i-space" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1230"/><stop offset="1" stop-color="#1f2d5e"/></linearGradient>
<linearGradient id="i-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcdaf3"/><stop offset="1" stop-color="#eef6fc"/></linearGradient>
<linearGradient id="i-desert" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9c4"/><stop offset="1" stop-color="#f6d394"/></linearGradient>
<linearGradient id="i-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c9bd0"/><stop offset="1" stop-color="#1d5f93"/></linearGradient>
<linearGradient id="i-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8c8c8c"/><stop offset="0.35" stop-color="#f4f4f4"/><stop offset="0.7" stop-color="#b8b8b8"/><stop offset="1" stop-color="#7a7a7a"/></linearGradient>
<radialGradient id="i-halo"><stop offset="0" stop-color="#fff3d2"/><stop offset="0.35" stop-color="#c9d2ff" stop-opacity="0.55"/><stop offset="1" stop-color="#7f8fe0" stop-opacity="0"/></radialGradient>
<radialGradient id="i-earth" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#7cc8ff"/><stop offset="0.6" stop-color="#2468b4"/><stop offset="1" stop-color="#0d2f66"/></radialGradient>
<radialGradient id="i-shade" cx="0.35" cy="0.32" r="0.8"><stop offset="0.55" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.45"/></radialGradient>
<radialGradient id="i-sun" cx="0.4" cy="0.38" r="0.7"><stop offset="0" stop-color="#fff8c9"/><stop offset="0.5" stop-color="#ffd23f"/><stop offset="1" stop-color="#f08a00"/></radialGradient>
<radialGradient id="i-corona"><stop offset="0.55" stop-color="#ffb000" stop-opacity="0.45"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></radialGradient>
<radialGradient id="i-red" cx="0.4" cy="0.36" r="0.7"><stop offset="0" stop-color="#ffd2a6"/><stop offset="0.5" stop-color="#ff6a3d"/><stop offset="1" stop-color="#a8220e"/></radialGradient>
<radialGradient id="i-moon" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#f4f4f4"/><stop offset="0.6" stop-color="#b9b9b9"/><stop offset="1" stop-color="#6f6f6f"/></radialGradient>
<radialGradient id="i-pluto" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#f3dcc0"/><stop offset="0.6" stop-color="#c99a6e"/><stop offset="1" stop-color="#6e4a2f"/></radialGradient>
<radialGradient id="i-rock" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#c9b597"/><stop offset="1" stop-color="#6a5640"/></radialGradient>
<radialGradient id="i-proton" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#ff9e9e"/><stop offset="0.6" stop-color="#d7263d"/><stop offset="1" stop-color="#7f0d1b"/></radialGradient>
<radialGradient id="i-electron" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#a6d8ff"/><stop offset="0.6" stop-color="#2a7fd4"/><stop offset="1" stop-color="#113f78"/></radialGradient>
<radialGradient id="i-muon" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#fff0b0"/><stop offset="0.6" stop-color="#f0b429"/><stop offset="1" stop-color="#a86d00"/></radialGradient>
<radialGradient id="i-grape" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#c69be3"/><stop offset="0.6" stop-color="#6a2c91"/><stop offset="1" stop-color="#3a0f55"/></radialGradient>
<radialGradient id="i-virus" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#c5f0bd"/><stop offset="0.6" stop-color="#5bb466"/><stop offset="1" stop-color="#2e7a3a"/></radialGradient>
<radialGradient id="i-cloud"><stop offset="0" stop-color="#5aa0e6" stop-opacity="0.75"/><stop offset="0.5" stop-color="#5aa0e6" stop-opacity="0.3"/><stop offset="1" stop-color="#5aa0e6" stop-opacity="0"/></radialGradient>`;

const SPACE = '<rect width="100" height="100" fill="url(#i-space)"/>';
const PAPER = '<rect width="100" height="100" fill="#ffffff"/>';
const SKY = '<rect width="100" height="100" fill="url(#i-sky)"/>';
const tile = (inner, dark) => `<g clip-path="url(#i-clip)">${inner}</g><rect x="0.75" y="0.75" width="98.5" height="98.5" rx="14" fill="none" stroke="${dark ? '#0b1430' : '#c9d1db'}" stroke-width="1.5"/>`;

// 나선 은하. (x, y)에 회전 rot, 세로 납작함 sy, 크기 s로 놓는다.
const galaxy = (x, y, rot, sy, s) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s} ${s * sy})">
  <circle r="46" fill="url(#i-halo)"/>
  <path d="M0,0 C10,-14 30,-14 38,0 C44,12 34,30 16,34 M0,0 C-10,14 -30,14 -38,0 C-44,-12 -34,-30 -16,-34" fill="none" stroke="#e3e9ff" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
  <circle r="9" fill="#fff4d6"/></g>`;
// 서 있는 사람. hair는 머리색, dx는 가로 이동
const person = (hair, dx = 0) => `<g transform="translate(${dx} 0)">
  <rect x="41" y="56" width="8.5" height="34" rx="3" fill="#2d3e50"/><rect x="50.5" y="56" width="8.5" height="34" rx="3" fill="#2d3e50"/>
  <rect x="38" y="88" width="12" height="5" rx="2.5" fill="#222222"/><rect x="50" y="88" width="12" height="5" rx="2.5" fill="#222222"/>
  <path d="M40,33 L31,58 M60,33 L69,58" stroke="#3b6fb6" stroke-width="7" stroke-linecap="round"/>
  <rect x="39" y="28" width="22" height="31" rx="7" fill="#3b6fb6"/>
  <circle cx="31" cy="60" r="3.6" fill="#f0c08a"/><circle cx="69" cy="60" r="3.6" fill="#f0c08a"/>
  <circle cx="50" cy="17" r="9" fill="#f0c08a"/>
  <path d="M41,16 Q42,6 50,6 Q58,6 59,16 Q55,10 50,10 Q45,10 41,16 Z" fill="${hair}"/></g>`;
const proton = r => `<circle cx="50" cy="50" r="${r}" fill="url(#i-proton)"/><ellipse cx="${50 - r / 3}" cy="${50 - r / 2.6}" rx="${r / 3}" ry="${r / 5}" fill="#ffffff" opacity="0.35"/>
  <path d="M50,${50 - r * 0.4} V${50 + r * 0.4} M${50 - r * 0.4},50 H${50 + r * 0.4}" stroke="#ffffff" stroke-width="${r / 5}" stroke-linecap="round"/>`;
// 빛 펄스. 가우스 껍질을 쓴 사인 물결
const PULSE = Array.from({ length: 85 }, (_, i) => { const x = 8 + i, u = (x - 50) / 14; return `${i ? 'L' : 'M'}${x},${f(50 - 30 * Math.exp(-u * u) * Math.sin((x - 50) * 0.9))}`; }).join(' ');
const FOAM = (() => { const r = rng(5); let s = ''; for (let i = 0; i < 26; i++) { const R = 3 + r() * 10; s += `<circle cx="${f(8 + r() * 84)}" cy="${f(8 + r() * 84)}" r="${f(R)}" fill="#8fb8ff" fill-opacity="0.08" stroke="#9cc0ff" stroke-opacity="0.65" stroke-width="1.2"/>`; } return s; })();
// 피라미드 돌 줄
const COURSES = [34, 44, 54, 64].map(y => { const d = (y - 24) * 34 / 52; return `<line x1="${f(52 - d)}" y1="${y}" x2="${f(52 + d)}" y2="${y}"/>`; }).join('');

const ICONS = {
  deep: tile(SPACE + stars(25, 3) + [[20, 22, 5, 2.5, 30, '#ffcf8f'], [42, 16, 3, 2, -20, '#ffffff'], [72, 26, 6, 3, 15, '#ffb07a'], [86, 12, 3, 3, 0, '#a9c8ff'],
    [30, 48, 7, 3.5, -35, '#fff1c9'], [60, 50, 4, 2.5, 40, '#ff9d6b'], [80, 62, 3.5, 3.5, 0, '#c9dcff'], [16, 74, 4, 2.5, 10, '#ffcf8f'], [46, 72, 6, 3, -15, '#e7d2ff'],
    [68, 84, 3, 2, 25, '#ffffff'], [88, 86, 4.5, 2.5, -30, '#ffb07a'], [52, 30, 2, 2, 0, '#ffffff'], [34, 88, 3, 2, 50, '#ffe0a8']].map(([x, y, a, b, r, c]) =>
    `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${c}" opacity="0.85"/><ellipse cx="${x}" cy="${y}" rx="${a * 0.4}" ry="${b * 0.4}" fill="#ffffff"/></g>`).join(''), true),
  andromeda: tile(SPACE + stars(30, 7) + galaxy(50, 50, -35, 0.38, 1), true),
  milkyway: tile(SPACE + stars(30, 11) + galaxy(50, 50, 20, 0.85, 0.95), true),
  universe: tile(SPACE + stars(70, 21) + '<circle cx="62" cy="58" r="30" fill="#7a4fc0" opacity="0.18"/>' + galaxy(28, 30, 25, 0.5, 0.3) + galaxy(72, 70, -40, 0.8, 0.26) + galaxy(76, 24, 10, 0.4, 0.18) + galaxy(24, 76, 60, 0.6, 0.16), true),
  reddwarf: tile(SPACE + stars(28, 5) + `<circle cx="50" cy="52" r="38" fill="#ff5a2a" opacity="0.16"/><circle cx="50" cy="52" r="27" fill="url(#i-red)"/>
    <circle cx="42" cy="60" r="3" fill="#b4300f" opacity="0.5"/><circle cx="58" cy="46" r="2" fill="#b4300f" opacity="0.5"/>
    <path d="M64,30 Q80,18 76,38" fill="none" stroke="#ffb38a" stroke-width="3" stroke-linecap="round" opacity="0.85"/>`, true),
  pluto: tile(SPACE + stars(20, 9) + `<circle cx="50" cy="50" r="33" fill="url(#i-pluto)"/>
    <path d="M56,50 C56,43 64,41 66,47 C68,41 77,43 76,50 C75,58 67,62 65,68 C61,62 56,58 56,50 Z" fill="#f7ecdd" opacity="0.9"/>
    <circle cx="38" cy="40" r="5" fill="#7a5235" opacity="0.4"/><circle cx="34" cy="60" r="7" fill="#7a5235" opacity="0.35"/>`, true),
  earth: tile(SPACE + stars(20, 13) + `<circle cx="50" cy="50" r="34" fill="url(#i-earth)"/>
    <g clip-path="url(#i-ec)" fill="#4f9d4a"><path d="M30,26 c8,-6 18,-2 17,6 c-1,8 -9,6 -11,14 c-2,6 -10,5 -11,-3 c-1,-6 1,-12 5,-17z"/>
    <path d="M56,50 c8,-3 17,3 15,11 c-2,8 -9,13 -14,9 c-4,-4 -5,-16 -1,-20z"/><path d="M64,22 c6,0 10,4 8,8 c-3,3 -9,1 -10,-3z"/></g>
    <g clip-path="url(#i-ec)" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.75"><path d="M22,56 q12,-6 24,0"/><path d="M50,80 q10,-5 22,-2"/><path d="M40,19 q8,-3 16,0"/></g>
    <circle cx="50" cy="50" r="34" fill="url(#i-shade)"/>`, true),
  sun: tile(SPACE + stars(12, 41) + `<circle cx="50" cy="50" r="46" fill="url(#i-corona)"/><circle cx="50" cy="50" r="30" fill="url(#i-sun)"/>
    <circle cx="42" cy="58" r="2.5" fill="#c46a00" opacity="0.5"/><circle cx="60" cy="44" r="1.8" fill="#c46a00" opacity="0.5"/>`, true),
  moon: tile(SPACE + stars(15, 43) + `<circle cx="50" cy="50" r="32" fill="url(#i-moon)"/>` +
    [[40, 40, 6], [60, 58, 8], [57, 34, 4], [36, 62, 4.5], [67, 43, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#8a8a8a" opacity="0.45"/><path d="M${x - r},${y} A${r},${r} 0 0 1 ${x + r},${y}" fill="none" stroke="#ffffff" stroke-opacity="0.35"/>`).join(''), true),
  eros: tile(SPACE + stars(22, 47) + `<g transform="rotate(-25 50 50)"><path d="M18,52 C16,38 30,32 42,36 C50,38 54,32 64,32 C80,32 86,46 82,58 C78,70 62,70 52,64 C44,60 38,68 28,66 C20,64 19,58 18,52 Z" fill="url(#i-rock)"/>
    <circle cx="34" cy="50" r="4" fill="#5a4835" opacity="0.5"/><circle cx="66" cy="46" r="5" fill="#5a4835" opacity="0.45"/><circle cx="58" cy="58" r="2.5" fill="#5a4835" opacity="0.5"/></g>`, true),
  pulse: tile(SPACE + stars(10, 53) + `<path d="${PULSE}" fill="none" stroke="#7ee0ff" stroke-width="8" opacity="0.25"/><path d="${PULSE}" fill="none" stroke="#9ff0ff" stroke-width="3"/>`, true),
  planck: tile(SPACE + FOAM, true),
  everest: tile(SKY + `<path d="M0,72 L18,56 L30,64 L46,40 L58,56 L72,44 L86,58 L100,50 L100,100 L0,100 Z" fill="#9aa6b6"/>
    <path d="M8,100 L50,20 L92,100 Z" fill="#6f7c90"/><path d="M50,20 L92,100 L66,100 Z" fill="#000000" opacity="0.15"/>
    <path d="M50,20 L41,37 L46,35 L50,41 L55,34 L60,38 Z" fill="#ffffff"/><path d="M72,44 L67,51 L72,49 L77,51 Z" fill="#ffffff"/>`),
  hill: tile(SKY + `<path d="M0,78 Q28,30 56,50 Q78,64 100,44 L100,100 L0,100 Z" fill="#7cb35b"/><path d="M0,90 Q40,70 100,82 L100,100 L0,100 Z" fill="#5f9a45"/>
    ${[[30, 46], [40, 44], [70, 58], [82, 52]].map(([x, y]) => `<path d="M${x},${y - 10} L${x + 5},${y} L${x - 5},${y} Z" fill="#2f6b2f"/>`).join('')}`),
  pyramid: tile(`<rect width="100" height="100" fill="url(#i-desert)"/><circle cx="80" cy="22" r="9" fill="#ffd23f"/>
    <rect y="74" width="100" height="26" fill="#e3bf7c"/><path d="M18,76 L52,24 L86,76 Z" fill="#d8b06a"/><path d="M52,24 L86,76 L62,76 Z" fill="#b98b44"/>
    <g stroke="#b48848" stroke-width="1.2" opacity="0.7">${COURSES}</g>`),
  ship: tile(SKY + `<rect y="68" width="100" height="32" fill="url(#i-sea)"/>
    <rect x="38" y="20" width="8" height="16" fill="#d7263d"/><rect x="38" y="20" width="8" height="4" fill="#222222"/><rect x="54" y="22" width="8" height="14" fill="#d7263d"/><rect x="54" y="22" width="8" height="4" fill="#222222"/>
    <rect x="28" y="36" width="44" height="10" fill="#ffffff" stroke="#9aa5b1"/><rect x="18" y="46" width="64" height="11" fill="#ffffff" stroke="#9aa5b1"/>
    <g fill="#3d6fa0">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${23 + i * 7.6}" cy="51.5" r="1.6"/>`).join('')}${[0, 1, 2, 3, 4].map(i => `<circle cx="${34 + i * 8}" cy="41" r="1.5"/>`).join('')}</g>
    <path d="M6,57 L94,57 L86,74 L14,74 Z" fill="#1f2a44"/><path d="M11,68 L89,68 L86,74 L14,74 Z" fill="#b3263a"/>
    <path d="M0,80 q6,-3 12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>`),
  person: tile(PAPER + person('#3b2a1e')),
  elder: tile(PAPER + person('#c9c9c9', -8) + `<path d="M61,58 L67,94 M61,58 q4,-4 8,0" fill="none" stroke="#7a5230" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(76 10)"><path d="M0,0 h14 M0,26 h14" stroke="#7a5230" stroke-width="2.5" stroke-linecap="round"/><path d="M2,1.5 L12,1.5 L7,13 L12,24.5 L2,24.5 L7,13 Z" fill="#fdf3d8" stroke="#a8875a"/><path d="M4,22.5 L10,22.5 L7,17 Z" fill="#e2b45a"/></g>`),
  kg: tile(PAPER + `<path d="M24,90 L24,42 Q24,14 50,14 Q76,14 76,42 L76,90 Z" fill="#eaf4fb" stroke="#9fb6c8" stroke-width="2" opacity="0.9"/>
    <path d="M31,42 Q31,24 45,20" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="88" rx="12" ry="3.5" fill="#8f8f8f"/><rect x="38" y="52" width="24" height="36" fill="url(#i-metal)"/><ellipse cx="50" cy="52" rx="12" ry="3.5" fill="#efefef" stroke="#9a9a9a"/>
    <rect x="16" y="88" width="68" height="7" rx="2" fill="#9a9a9a"/>`),
  paper: tile(PAPER + [4, 3, 2, 1, 0].map(i => `<path d="M12,${58 + 5 * i} L56,${38 + 5 * i} L90,${54 + 5 * i} L46,${74 + 5 * i} Z" fill="#fbfbfb" stroke="#aeb6c0" stroke-width="1.2"/>`).join('') +
    '<path d="M28,58 L56,45 M33,61 L61,48 M38,64 L66,51 M43,67 L63,58" stroke="#b9c2cc" stroke-width="1.6"/>'),
  virus: tile(PAPER + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
    return `<line x1="${f(50 + 24 * c)}" y1="${f(50 + 24 * s)}" x2="${f(50 + 35 * c)}" y2="${f(50 + 35 * s)}" stroke="#c0392b" stroke-width="3"/><circle cx="${f(50 + 37 * c)}" cy="${f(50 + 37 * s)}" r="4" fill="#e05a47"/>`; }).join('') +
    '<circle cx="50" cy="50" r="26" fill="url(#i-virus)"/><circle cx="42" cy="56" r="4" fill="#2f7d3a" opacity="0.35"/><circle cx="58" cy="44" r="3" fill="#2f7d3a" opacity="0.35"/><circle cx="56" cy="60" r="2.5" fill="#2f7d3a" opacity="0.35"/>'),
  hatom: tile(PAPER + '<circle cx="50" cy="50" r="44" fill="url(#i-cloud)"/><circle cx="50" cy="50" r="4" fill="#d7263d"/>'),
  uatom: tile(PAPER + '<circle cx="50" cy="50" r="46" fill="url(#i-cloud)"/>' + [[0, 0], [5, 1], [-4, 3], [2, -5], [-3, -4], [6, -3], [-6, -1], [1, 6], [-2, 5], [4, 5], [-5, 5], [3, -1]].map(([x, y], i) =>
    `<circle cx="${50 + x}" cy="${50 + y}" r="3.4" fill="${i % 2 ? '#8a9bb0' : '#d7263d'}" stroke="#ffffff" stroke-width="0.6"/>`).join('')),
  proton: tile(PAPER + proton(30)),
  electron: tile(PAPER + '<circle cx="50" cy="50" r="20" fill="url(#i-electron)"/><ellipse cx="43" cy="43" rx="7" ry="4" fill="#ffffff" opacity="0.35"/><path d="M42,50 H58" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>'),
  muon: tile(PAPER + `<path d="M6,40 H42 M12,50 H40 M6,60 H42" stroke="#f0b429" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
    <circle cx="62" cy="50" r="19" fill="url(#i-muon)"/><text x="62" y="57" text-anchor="middle" font-family="Times New Roman, serif" font-style="italic" font-size="22" fill="#5a3300">μ</text>`),
  unstable: tile(PAPER + [['M50,50 Q62,30 80,24', '#d7263d'], ['M50,50 Q30,40 16,26', '#0072B2'], ['M50,50 Q36,66 22,82', '#009E73'], ['M50,50 Q68,62 86,72', '#E69F00'], ['M50,50 Q53,72 60,90', '#CC79A7']]
    .map(([d, c]) => { const e = d.split(' ').pop().split(','); return `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/><circle cx="${e[0]}" cy="${e[1]}" r="3" fill="${c}"/>`; }).join('') +
    '<circle cx="50" cy="50" r="8" fill="#6a3d9a"/>'),
  day: tile(SPACE + stars(15, 31) + `<circle cx="14" cy="50" r="16" fill="url(#i-corona)"/><circle cx="14" cy="50" r="10" fill="url(#i-sun)"/>
    <circle cx="62" cy="50" r="28" fill="url(#i-earth)"/>
    <g clip-path="url(#i-ec2)" fill="#4f9d4a"><path d="M46,30 c7,-5 15,-2 14,5 c-1,7 -8,5 -9,12 c-2,5 -8,4 -9,-2 c-1,-5 1,-10 4,-15z"/><path d="M66,52 c7,-2 14,3 12,9 c-2,7 -7,11 -11,8 c-4,-3 -4,-13 -1,-17z"/></g>
    <path d="M62,22 A28,28 0 0 1 62,78 Z" fill="#000000" opacity="0.5"/>
    <path d="M38,16 A34,34 0 0 1 84,20" fill="none" stroke="#ffd23f" stroke-width="2.5"/><path d="M80,14 L88,22 L78,24 Z" fill="#ffd23f"/>`, true),
  hour: tile(PAPER + `<circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#2d2d2d" stroke-width="4"/>
    <path d="M50,50 L50,16 A34,34 0 0 1 67,20.6 Z" fill="#840025" opacity="0.22"/>` +
    Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, s = Math.sin(a), c = Math.cos(a), r0 = i % 3 ? 31 : 28;
      return `<line x1="${f(50 + r0 * s)}" y1="${f(50 - r0 * c)}" x2="${f(50 + 35 * s)}" y2="${f(50 - 35 * c)}" stroke="#2d2d2d" stroke-width="${i % 3 ? 1.5 : 3}"/>`; }).join('') +
    '<line x1="50" y1="50" x2="59" y2="34.4" stroke="#2d2d2d" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="50" x2="50" y2="20" stroke="#2d2d2d" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="#840025"/>'),
  heart: tile(PAPER + `<path d="M50,84 C22,64 12,48 18,32 C24,18 42,16 50,30 C58,16 76,18 82,32 C88,48 78,64 50,84 Z" fill="#d7263d"/>
    <ellipse cx="32" cy="34" rx="7" ry="4" fill="#ffffff" opacity="0.3" transform="rotate(-30 32 34)"/>
    <path d="M14,52 H34 L40,40 L47,64 L53,44 L57,52 H86" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`),
  elephant: tile(PAPER + `<ellipse cx="46" cy="88" rx="34" ry="3" fill="#000000" opacity="0.12"/>
    <path d="M18,48 q-7,4 -5,13" stroke="#8d939b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <g fill="#8d939b"><ellipse cx="44" cy="54" rx="28" ry="19"/><rect x="22" y="60" width="10" height="27" rx="3"/><rect x="34" y="62" width="10" height="25" rx="3"/>
    <rect x="50" y="62" width="10" height="25" rx="3"/><rect x="60" y="60" width="10" height="27" rx="3"/><circle cx="73" cy="44" r="14"/></g>
    <path d="M82,48 C90,56 90,70 86,82" stroke="#8d939b" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="66" cy="44" rx="9" ry="13" fill="#79808a"/><circle cx="78" cy="40" r="1.8" fill="#222222"/>
    <path d="M82,54 q5,4 10,1" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  grape: tile(PAPER + `<path d="M50,28 Q52,16 60,11" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M56,15 C66,6 80,10 78,19 C70,23 60,21 56,15 Z" fill="#5f9a45"/>
    <circle cx="50" cy="56" r="28" fill="url(#i-grape)"/><ellipse cx="40" cy="44" rx="8" ry="5" fill="#ffffff" opacity="0.35" transform="rotate(-30 40 44)"/>`),
  dust: tile(PAPER + `<path d="M36,40 L50,30 L64,36 L72,50 L64,66 L48,70 L34,60 Z" fill="#9c7b5b"/>
    <path d="M40,40 L50,34 L58,38 L52,44 Z" fill="#c4a27f" opacity="0.8"/>
    <circle cx="56" cy="56" r="3" fill="#6f5238"/><circle cx="44" cy="58" r="2" fill="#6f5238"/><circle cx="62" cy="46" r="1.6" fill="#6f5238"/>
    <circle cx="22" cy="26" r="1.6" fill="#9c7b5b"/><circle cx="80" cy="74" r="1.3" fill="#9c7b5b"/><circle cx="78" cy="24" r="1" fill="#9c7b5b"/>`),
  penicillin: tile(PAPER + (() => {
    const A = [[30, 40, '#8a8a8a'], [44, 32, '#8a8a8a'], [58, 40, '#3a6fd8'], [58, 56, '#8a8a8a'], [44, 64, '#f2c230'], [30, 56, '#8a8a8a'], [72, 32, '#8a8a8a'],
      [84, 42, '#d7263d'], [72, 66, '#d7263d'], [16, 32, '#d7263d'], [18, 64, '#8a8a8a'], [46, 82, '#8a8a8a'], [82, 20, '#8a8a8a']];
    const B = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [6, 7], [3, 8], [0, 9], [5, 10], [4, 11], [6, 12]];
    return B.map(([i, j]) => `<line x1="${A[i][0]}" y1="${A[i][1]}" x2="${A[j][0]}" y2="${A[j][1]}" stroke="#b5b5b5" stroke-width="3.5"/>`).join('') +
      A.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${c}" stroke="#ffffff" stroke-width="1.2"/>`).join('');
  })()),
};

// 교재 표의 물체 이름 → 그림
const BY_NAME = {
  '처음 생긴 은하까지 거리': 'deep', '안드로메다 은하까지 거리': 'andromeda', '프록시마 센타우리까지 거리': 'reddwarf', '명왕성까지 거리': 'pluto',
  '지구 반지름': 'earth', '에베레스트산 높이': 'everest', '사람의 키': 'person', '킬로그램 원기의 높이': 'kg', '교재 종이 한 장의 두께': 'paper',
  '보통 바이러스의 길이': 'virus', '수소 원자 반지름': 'hatom', '양성자 반지름': 'proton',
  '양성자 수명 (예측값)': 'proton', '우주의 나이': 'universe', '쿠푸 피라미드의 나이': 'pyramid', '사람의 기대 수명': 'elder', '하루의 길이': 'day',
  '한 시간': 'hour', '심장 박동 사이 시간': 'heart', '뮤온의 수명': 'muon', '실험실에서 만든 가장 짧은 빛 펄스': 'pulse', '가장 불안정한 입자의 수명': 'unstable', '플랑크 시간': 'planck',
  '알려진 우주': 'universe', '우리 은하': 'milkyway', '태양': 'sun', '달': 'moon', '소행성 에로스': 'eros', '작은 산': 'hill', '원양 여객선': 'ship',
  '코끼리': 'elephant', '킬로그램 원기': 'kg', '포도알': 'grape', '먼지 한 톨': 'dust', '페니실린 분자': 'penicillin', '우라늄 원자': 'uatom', '양성자': 'proton', '전자': 'electron',
};
export const iconOf = name => ICONS[BY_NAME[name]];
