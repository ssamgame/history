// 5장 경판 만드는 차례 카드의 그림(SVG). 글자는 넣지 않는다(카드 글이 따로 있다). viewBox 100×70.
const wrap = body => `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body.replace(/>\s+</g, '><').trim()}</svg>`; // 태그 사이 빈칸은 지운다(카드 글에 섞이지 않게)
const plank = (x, y, w, h, fill = '#c9a26b', stroke = '#7a5530') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;

export const MAKING_PICTURES = [
  // 1. 나무를 바닷물에 담그기: 파도 위에 떠 있는 통나무
  wrap(`<rect width="100" height="70" fill="#d8ecf4"/>
    <path d="M0 38 Q12 32 25 38 T50 38 T75 38 T100 38 V70 H0Z" fill="#4f88a8"/>
    <rect x="18" y="30" width="44" height="10" rx="5" fill="#8a5a3a" stroke="#5a3a22" stroke-width="1.5"/><circle cx="62" cy="35" r="5" fill="#c9a26b" stroke="#5a3a22" stroke-width="1.5"/>
    <rect x="44" y="40" width="40" height="9" rx="4.5" fill="#94643f" stroke="#5a3a22" stroke-width="1.5"/><circle cx="84" cy="44.5" r="4.5" fill="#c9a26b" stroke="#5a3a22" stroke-width="1.5"/>
    <path d="M0 52 Q12 46 25 52 T50 52 T75 52 T100 52" fill="none" stroke="#bfe0ee" stroke-width="2"/>`),
  // 2. 소금물에 삶기: 불 위의 큰 가마솥과 김
  wrap(`<rect width="100" height="70" fill="#f3e9d6"/>
    <path d="M28 18 q4 -8 0 -14 M44 16 q4 -8 0 -14 M60 18 q4 -8 0 -14" fill="none" stroke="#a9a9a9" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M18 24 H82 Q80 52 50 54 Q20 52 18 24Z" fill="#2e2b28"/><rect x="14" y="21" width="72" height="5" rx="2" fill="#44403b"/>
    <rect x="24" y="16" width="34" height="6" rx="3" fill="#8a5a3a"/><rect x="40" y="13" width="34" height="6" rx="3" fill="#94643f"/>
    <path d="M30 66 Q34 54 40 62 Q44 50 50 60 Q56 48 60 62 Q66 54 70 66Z" fill="#e8742c"/><path d="M40 66 Q45 58 50 64 Q55 58 60 66Z" fill="#f7c24a"/>`),
  // 3. 그늘에서 말리기: 지붕 그늘 아래 세워 둔 판자
  wrap(`<rect width="100" height="70" fill="#eef0e2"/><circle cx="88" cy="12" r="7" fill="#f2c94c"/>
    <path d="M8 22 L50 6 L92 22 Z" fill="#3d4846"/><rect x="14" y="22" width="4" height="40" fill="#6b4a32"/><rect x="82" y="22" width="4" height="40" fill="#6b4a32"/>
    <rect x="18" y="22" width="64" height="40" fill="#cfd3c4"/>
    ${plank(24, 30, 9, 30)}${plank(36, 28, 9, 32)}${plank(48, 30, 9, 30)}${plank(60, 28, 9, 32)}
    <rect x="0" y="62" width="100" height="8" fill="#a59c8a"/>`),
  // 4. 글자 새기기: 판에 새긴 글자 줄과 새김칼
  wrap(`<rect width="100" height="70" fill="#f3e9d6"/>
    ${plank(10, 10, 62, 50)}
    ${[0, 1, 2, 3, 4].map(i => `<g fill="#5a3a22">${[0, 1, 2, 3].map(j => `<rect x="${18 + i * 10}" y="${17 + j * 10}" width="6" height="6" rx="1"/>`).join('')}</g>`).join('')}
    <rect x="70" y="30" width="24" height="6" rx="3" fill="#6b4a32" transform="rotate(-35 82 33)"/><path d="M66 48 L72 40 L75 43 Z" fill="#b8bcc2"/>`),
  // 5. 마구리: 판 양 끝에 덧대어 뒤틀리지 않게 하는 나무(각목). 네 귀퉁이의 작은 구리 장식은 덧붙임
  wrap(`<rect width="100" height="70" fill="#f3e9d6"/>
    ${plank(20, 14, 60, 42, '#b07a42')}
    ${[8, 80].map(x => `<rect x="${x}" y="9" width="12" height="52" rx="1.5" fill="#7a4e2a" stroke="#4a2e16" stroke-width="1.5"/>`).join('')}
    ${[[8, 9], [86, 9], [8, 55], [86, 55]].map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="6" fill="#c46a2c" stroke="#7a3a14" stroke-width="1"/>`).join('')}
    <g fill="#6b4422">${[0, 1, 2, 3].map(i => `<rect x="${30 + i * 11}" y="26" width="6" height="18" rx="1"/>`).join('')}</g>`),
  // 6. 옻칠하기: 붓으로 검게 반짝이는 칠을 입힌다
  wrap(`<rect width="100" height="70" fill="#f3e9d6"/>
    ${plank(10, 14, 64, 44, '#c9a26b')}<rect x="10" y="14" width="40" height="44" rx="2" fill="#2a1a12"/><path d="M14 18 L26 18" stroke="#6e5a4e" stroke-width="2" stroke-linecap="round"/>
    <rect x="58" y="6" width="7" height="34" rx="3" fill="#8a5a3a" transform="rotate(25 61 23)"/><path d="M50 38 Q48 46 54 46 Q58 44 56 36Z" fill="#2a1a12"/>`),
];
