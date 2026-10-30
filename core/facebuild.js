// 얼굴 짜임(D-55): 얼굴형·눈·눈썹·코·입을 미리 정한 유형에서 골라 짜 맞춘다.
// - 기본 얼굴(build): 인물 고유의 얼굴형과 이목구비. 3D 머리 모양(people.js)·얼굴 무늬·대화창 초상화(faces.js)가 같은 값을 쓴다.
// - 기본 인상(mood): 평소 인상(근엄·차분·온화·매서움). 모두 웃지 않는 차분한 얼굴이다(근엄한 표정 원칙).
// - 상황 표정(EXPRESSIONS): 말하기·놀람·걱정·분노·기쁨·긴장. 눈썹뿐 아니라 눈 크기·눈꺼풀·입 모양을 함께 바꾼다.
// 인물 값은 content/characters.js의 face.build로 직접 정하고(이름난 인물·대표 인물), 없으면 역할(role)에 어울리는 조합에서 고른다.
// 같은 역할의 군중은 번호(n)마다 얼굴형·눈·코·입이 서로 다른 유형이 되게 돌려 쓴다.

// 얼굴형: w·h 머리 너비·높이(머리 묶음 크기), jaw 턱으로 갈수록 좁아지는 정도, square 턱 끝을 평평하게, cheek 광대(볼) 부풀림, chin 턱 길이
// eyeY·mouthY·gap: 얼굴 안에서 눈 높이·입 높이·두 눈 사이(얼굴형에 맞게 이목구비 자리도 바뀐다)
export const SHAPES = {
  oval:   { w: 1.0,  h: 1.03, jaw: 0.2,  square: 0,   cheek: 1.0,  chin: 0,     eyeY: 0,     mouthY: 0,     gap: 1.0 },  // 달걀형
  round:  { w: 1.08, h: 0.96, jaw: 0.1,  square: 0,   cheek: 1.14, chin: -0.06, eyeY: 0.02,  mouthY: -0.04, gap: 1.02 }, // 둥근 얼굴
  long:   { w: 0.9,  h: 1.12, jaw: 0.24, square: 0,   cheek: 0.94, chin: 0.1,   eyeY: -0.03, mouthY: 0.07,  gap: 0.94 }, // 긴 얼굴
  wide:   { w: 1.13, h: 0.97, jaw: 0.05, square: 0.3, cheek: 1.18, chin: -0.04, eyeY: 0.02,  mouthY: -0.02, gap: 1.12 }, // 넓적한 얼굴
  square: { w: 1.05, h: 1.01, jaw: 0.0,  square: 1,   cheek: 1.02, chin: -0.02, eyeY: 0,     mouthY: 0.01,  gap: 1.04 }, // 각진 얼굴
  heart:  { w: 1.02, h: 1.04, jaw: 0.36, square: 0,   cheek: 1.1,  chin: 0.08,  eyeY: -0.01, mouthY: 0.02,  gap: 1.0 },  // 광대가 넓고 턱이 뾰족한 얼굴
};
// 눈: w 가로, h 세로, tilt 눈꼬리 각(+ 올라감), peak 윗눈꺼풀 가장 높은 곳(- 안쪽, + 바깥쪽), lid 눈꺼풀(double 쌍꺼풀, mono 홑꺼풀, hooded 덮인 눈꺼풀, deep 움푹), line 윗눈꺼풀 선 굵기
export const EYES = {
  almond:   { w: 1.0,  h: 1.0,  tilt: 0.08,  peak: 0,     lid: 'double', line: 1.0 },  // 아몬드 눈
  narrow:   { w: 1.12, h: 0.58, tilt: 0.12,  peak: 0.12,  lid: 'mono',   line: 1.25 }, // 가늘고 긴 홑꺼풀 눈
  round:    { w: 0.86, h: 1.38, tilt: 0,     peak: -0.05, lid: 'double', line: 0.9 },  // 동그란 눈
  droopy:   { w: 1.02, h: 0.9,  tilt: -0.24, peak: -0.3,  lid: 'hooded', line: 1.0 },  // 눈꼬리가 처진 눈
  upturned: { w: 1.02, h: 0.78, tilt: 0.32,  peak: 0.25,  lid: 'mono',   line: 1.3 },  // 눈꼬리가 올라간 매서운 눈
  deep:     { w: 0.92, h: 0.86, tilt: 0.04,  peak: 0,     lid: 'deep',   line: 1.15 }, // 움푹 들어간 눈(눈두덩 그늘)
  small:    { w: 0.7,  h: 0.78, tilt: 0.06,  peak: 0,     lid: 'mono',   line: 1.0 },  // 작은 눈
};
// 눈썹: pts 안쪽·가운데·바깥쪽 높이(아래로 +), t 굵기, len 길이, taper 바깥으로 갈수록 가늘어짐
export const BROWS = {
  straight: { pts: [0.02, -0.02, -0.01], t: 1.0,  len: 1.0,  taper: 0.3 }, // 일자 눈썹
  arched:   { pts: [0.04, -0.08, 0.03],  t: 0.8,  len: 1.05, taper: 0.5 }, // 둥글게 휜 눈썹
  angled:   { pts: [0.07, -0.02, -0.07], t: 1.1,  len: 1.0,  taper: 0.4 }, // 바깥으로 치켜 올라간 눈썹
  bushy:    { pts: [0.04, -0.03, 0.0],   t: 1.75, len: 1.12, taper: 0.1 }, // 짙고 굵은 눈썹
  thin:     { pts: [0.02, -0.05, 0.01],  t: 0.55, len: 0.92, taper: 0.6 }, // 가는 눈썹
  short:    { pts: [0.03, -0.02, 0.0],   t: 1.25, len: 0.7,  taper: 0.2 }, // 짧고 뭉툭한 눈썹
  falling:  { pts: [-0.01, -0.04, 0.05], t: 0.9,  len: 1.0,  taper: 0.5 }, // 바깥쪽이 처진 눈썹
};
// 코: w 너비, len 길이, pro 앞으로 나온 정도, bridge 콧대 선, tip 코끝 둥근 정도
export const NOSES = {
  small:  { w: 0.8,  len: 0.82, pro: 0.8,  bridge: 0.4, tip: 0.9 },  // 작은 코
  button: { w: 0.95, len: 0.72, pro: 0.9,  bridge: 0.2, tip: 1.3 },  // 동글동글한 들창코
  broad:  { w: 1.45, len: 0.98, pro: 0.95, bridge: 0.6, tip: 1.2 },  // 넓적한 코
  long:   { w: 0.88, len: 1.35, pro: 1.05, bridge: 1.0, tip: 0.9 },  // 길고 곧은 코
  high:   { w: 0.95, len: 1.15, pro: 1.5,  bridge: 1.0, tip: 1.0 },  // 콧대가 높고 돌출한 코
  flat:   { w: 1.3,  len: 0.86, pro: 0.62, bridge: 0.3, tip: 1.1 },  // 낮고 납작한 코
};
// 입: w 너비, up 윗입술 두께, low 아랫입술 두께, corner 입꼬리(+ 아래로)
export const MOUTHS = {
  firm:  { w: 1.0,  up: 0.8,  low: 0.9,  corner: 0.012 }, // 굳게 다문 입
  thin:  { w: 1.06, up: 0.42, low: 0.5,  corner: 0.008 }, // 얇은 입술
  full:  { w: 0.98, up: 1.12, low: 1.3,  corner: 0 },     // 도톰한 입술
  wide:  { w: 1.34, up: 0.78, low: 0.95, corner: 0.005 }, // 큰 입
  small: { w: 0.7,  up: 0.95, low: 1.15, corner: 0 },     // 작은 입
  down:  { w: 1.0,  up: 0.75, low: 0.85, corner: 0.045 }, // 입꼬리가 처진 입
};
// 기본 인상(평소 표정): 눈썹 안쪽 높이(+ 내려 근엄), 눈 크기, 눈꺼풀 내림, 입꼬리
export const MOODS = {
  stern:  { browIn: 0.05, browOut: -0.02, eye: 1.0,  squint: 0.1,  corner: 0.01 },  // 근엄
  calm:   { browIn: 0.01, browOut: 0,     eye: 1.0,  squint: 0.15, corner: 0 },     // 차분
  gentle: { browIn: -0.01, browOut: 0.02, eye: 0.95, squint: 0.25, corner: -0.006 }, // 온화(웃지는 않는다)
  fierce: { browIn: 0.08, browOut: -0.05, eye: 0.9,  squint: 0.2,  corner: 0.015 }, // 매서움
};
// 상황 표정(장면에서 잠깐 바꾼다, setExpression): 눈썹 안쪽·바깥 높이, 눈 크기(세로), 눈꺼풀 내림, 입 벌림, 입꼬리, 입 너비
export const EXPRESSIONS = {
  neutral:  {},
  talk:     { open: 0.35 },                                                          // 말하기: 입을 조금 벌린다
  surprise: { browIn: -0.1, browOut: -0.08, eye: 1.45, squint: -0.3, open: 0.9, mw: 0.75 }, // 놀람: 눈썹이 올라가고 눈이 커지고 입이 동그랗게
  worry:    { browIn: -0.09, browOut: 0.05, eye: 1.05, squint: 0.05, corner: 0.035, mw: 0.9 }, // 걱정: 눈썹 안쪽이 올라가고 입꼬리가 처진다
  anger:    { browIn: 0.12, browOut: -0.06, eye: 0.8, squint: 0.35, corner: 0.03, mw: 0.92, tight: true }, // 분노: 미간을 찌푸리고 눈을 가늘게, 입을 앙다문다
  joy:      { browIn: -0.02, browOut: 0.02, eye: 0.7, squint: 0.55, corner: -0.05, mw: 1.12, open: 0.2 }, // 기쁨: 눈웃음, 입꼬리가 올라간다
  tension:  { browIn: 0.03, browOut: -0.03, eye: 1.18, squint: -0.1, corner: 0.02, mw: 0.85, tight: true }, // 긴장: 눈을 크게 뜨고 입을 꾹 다문다
};

// 역할마다 어울리는 유형(같은 역할 안에서도 여러 유형을 돌려 쓴다). extra: stubble(수염 자국)·scar(흉터)·lines(잔주름)·cheekbone(광대 그늘) 확률
export const ROLES = {
  general:  { shape: ['square', 'wide', 'long', 'heart'], eye: ['deep', 'upturned', 'narrow', 'almond'], brow: ['bushy', 'angled', 'straight'], nose: ['high', 'broad', 'long'], mouth: ['firm', 'down', 'wide'], mood: ['stern', 'fierce'], stubble: 0.4, scar: 0.35, cheekbone: 0.6 },
  soldier:  { shape: ['oval', 'square', 'round', 'wide', 'long', 'heart'], eye: ['almond', 'narrow', 'small', 'upturned', 'round', 'deep'], brow: ['straight', 'angled', 'short', 'bushy', 'thin'], nose: ['broad', 'small', 'flat', 'long', 'high', 'button'], mouth: ['firm', 'thin', 'wide', 'down', 'full'], mood: ['stern', 'calm', 'fierce'], stubble: 0.5, scar: 0.15, cheekbone: 0.3 },
  farmer:   { shape: ['round', 'wide', 'square', 'oval', 'heart'], eye: ['small', 'narrow', 'droopy', 'almond', 'round'], brow: ['straight', 'short', 'falling', 'bushy'], nose: ['broad', 'flat', 'button', 'small'], mouth: ['wide', 'full', 'firm', 'down'], mood: ['calm', 'gentle', 'stern'], stubble: 0.45, lines: 0.6, cheekbone: 0.4 },
  merchant: { shape: ['round', 'wide', 'heart', 'oval'], eye: ['narrow', 'round', 'almond', 'small'], brow: ['arched', 'thin', 'straight', 'short'], nose: ['button', 'broad', 'small'], mouth: ['wide', 'full', 'thin'], mood: ['calm', 'gentle'], stubble: 0.2 },
  scholar:  { shape: ['long', 'oval', 'heart'], eye: ['narrow', 'almond', 'deep', 'small'], brow: ['thin', 'arched', 'straight'], nose: ['long', 'high', 'small'], mouth: ['thin', 'small', 'firm'], mood: ['calm', 'stern'] },
  official: { shape: ['long', 'oval', 'square', 'heart'], eye: ['narrow', 'deep', 'almond', 'upturned'], brow: ['angled', 'arched', 'straight', 'thin'], nose: ['long', 'high', 'small'], mouth: ['thin', 'firm', 'down'], mood: ['stern', 'calm'], cheekbone: 0.3 },
  monk:     { shape: ['round', 'oval', 'long'], eye: ['narrow', 'droopy', 'almond'], brow: ['thin', 'falling', 'arched'], nose: ['small', 'long', 'button'], mouth: ['small', 'thin', 'firm'], mood: ['calm', 'gentle'] },
  elder:    { shape: ['long', 'oval', 'square'], eye: ['droopy', 'deep', 'small', 'narrow'], brow: ['falling', 'bushy', 'thin'], nose: ['long', 'broad', 'high'], mouth: ['down', 'thin', 'firm'], mood: ['gentle', 'calm', 'stern'], lines: 1, cheekbone: 0.5 },
  youth:    { shape: ['oval', 'long', 'heart', 'round', 'square'], eye: ['almond', 'round', 'narrow', 'upturned'], brow: ['straight', 'thin', 'angled', 'short'], nose: ['small', 'long', 'button', 'high'], mouth: ['firm', 'small', 'thin', 'full'], mood: ['calm', 'stern'] }, // 학생·젊은이(수염·주름 없음)
  child:    { shape: ['round', 'oval', 'heart'], eye: ['round', 'almond', 'small'], brow: ['thin', 'short', 'straight'], nose: ['button', 'small'], mouth: ['small', 'full'], mood: ['calm'] },
  woman:    { shape: ['oval', 'heart', 'round', 'long'], eye: ['almond', 'round', 'narrow', 'droopy'], brow: ['arched', 'thin', 'straight'], nose: ['small', 'button', 'long'], mouth: ['full', 'small', 'firm'], mood: ['calm', 'gentle', 'stern'] },
  foreign:  { shape: ['wide', 'square', 'round', 'long'], eye: ['narrow', 'upturned', 'small', 'deep'], brow: ['bushy', 'angled', 'straight', 'short'], nose: ['broad', 'high', 'flat'], mouth: ['wide', 'firm', 'down'], mood: ['fierce', 'stern'], stubble: 0.55, scar: 0.2, cheekbone: 0.5 },
};

// 생김새 묶음에서 역할을 정한다(LOOKS에 role이 있으면 그것)
export function roleOf(L = {}) {
  if (L.role) return L.role; // 학생·젊은이는 role: 'youth'
  const f = L.face || {};
  if (f.age === 'young') return 'child';
  if (f.sex === 'f') return 'woman';
  if (f.age === 'old') return 'elder';
  if (L.hat === 'general') return 'general';
  if (L.outfit === 'deel' || ['kunfa', 'mongol', 'qing', 'fur'].includes(L.hat)) return 'foreign';
  if (L.outfit === 'jangsam' || L.hat === 'bald') return 'monk';
  if (L.outfit === 'armor' || ['helmet', 'steel', 'jeollip'].includes(L.hat) || L.gear === 'rifle' || L.gear === 'spear') return 'soldier';
  if (L.outfit === 'danryeong' || ['official', 'ikseon'].includes(L.hat)) return 'official';
  if (L.hat === 'gat' || (L.outfit === 'suit' && f.glasses)) return 'scholar';
  if (L.outfit === 'suit' || L.hat === 'fedora') return 'merchant';
  return 'farmer';
}

const hashOf = key => { let h = 2166136261; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (list, i) => list[((i % list.length) + list.length) % list.length];

// 기본 얼굴 짜기. look: 생김새 묶음, n: 군중 번호(0이면 그 생김새의 기본 얼굴). face.build에 정한 값이 가장 먼저다.
const cache = new Map();
export function buildFace(L = {}, n = 0) {
  const key = JSON.stringify([L.robe, L.hat, L.outfit, L.trim, L.face, L.role, n]);
  if (cache.has(key)) return cache.get(key);
  const f = L.face || {}, role = ROLES[roleOf(L)] || ROLES.farmer;
  const given = (n && !L.named) ? {} : (f.build || {}); // 군중 속 이름 없는 사람(n>0)은 역할 안에서 다른 유형으로, 이름난 인물·대표 얼굴은 정한 그대로
  let h = hashOf(key.replace(/,\d+\]$/, ']')); // 기본 짜임은 번호와 상관없는 씨앗에서
  const r = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  const base = [r(), r(), r(), r(), r(), r(), r()].map(x => Math.floor(x * 97));
  // 군중 번호마다 유형을 한 칸씩(서로 다른 걸음으로) 옮겨, 같은 생김새의 여섯 사람이 얼굴형·눈·코·입 모두 다르게
  const step = [1, 2, 3, 1, 2, 1, 1];
  const choose = (k, list, i) => given[k] || pick(list, base[i] + n * step[i]);
  const shape = given.shape || (!n && ({ long: 'long', round: 'round' })[f.shape]) || choose('shape', role.shape, 0); // 예전 face.shape(long·round)는 기본 얼굴에서 그대로
  const b = {
    role: roleOf(L),
    shape, eye: choose('eye', role.eye, 1), brow: choose('brow', role.brow, 2), nose: choose('nose', role.nose, 3), mouth: choose('mouth', role.mouth, 4),
    mood: given.mood || pick(role.mood, base[5] + n),
  };
  // 잔 차이(유형 위에 얹는 작은 흔들림, 주된 차이는 유형에서 나온다)
  const j = (a = 0.06) => 1 + (r() - 0.5) * 2 * a;
  h ^= n * 0x9e3779b9; r(); r();
  b.fine = { eyeW: j(), eyeH: j(0.08), gap: j(0.04), browY: (r() - 0.5) * 0.03, noseW: j(), mouthW: j(0.05), faceW: j(0.025), ear: j(0.12), tone: (r() - 0.5) * 2 };
  b.iris = ['#4a3020', '#3a2616', '#5a3a22', '#2e2014'][Math.floor(r() * 4)];
  b.stubble = given.stubble ?? (f.sex !== 'f' && f.age !== 'young' && r() < (role.stubble || 0));
  b.scar = given.scar ?? (r() < (role.scar || 0) ? [r() < 0.5 ? -1 : 1, 0.1 + r() * 0.3] : null); // 볼의 옅은 흉터 [쪽, 높이]
  b.lines = given.lines ?? (f.age === 'old' || r() < (role.lines || 0) * 0.5);
  b.cheekbone = given.cheekbone ?? (r() < (role.cheekbone || 0));
  b.mole = given.mole ?? (r() < 0.18 ? [(r() - 0.5) * 1.1, 0.05 + r() * 0.55] : null);
  b.asym = given.asym ?? (r() < 0.25 ? (r() - 0.5) * 0.06 : 0); // 아주 옅은 좌우 비대칭(한쪽 눈썹 높이)
  cache.set(key, b);
  return b;
}

// 짜임 + 표정 → 그릴 때 쓰는 값 하나로(faces.js·people.js가 쓴다)
export function resolve(b, expr = 'neutral') {
  const S = SHAPES[b.shape] || SHAPES.oval, E = EYES[b.eye] || EYES.almond, B = BROWS[b.brow] || BROWS.straight;
  const N = NOSES[b.nose] || NOSES.small, M = MOUTHS[b.mouth] || MOUTHS.firm, D = MOODS[b.mood] || MOODS.stern, X = EXPRESSIONS[expr] || {};
  const F = b.fine || {};
  return {
    S, E, B, N, M, D, X, F,
    eyeW: E.w * (F.eyeW || 1), eyeH: E.h * (F.eyeH || 1) * (X.eye ?? D.eye), tilt: E.tilt, peak: E.peak, lid: E.lid, lidLine: E.line,
    squint: (D.squint || 0) + (X.squint || 0), gap: S.gap * (F.gap || 1), eyeY: S.eyeY,
    browIn: B.pts[0] + (D.browIn || 0) + (X.browIn || 0), browMid: B.pts[1], browOut: B.pts[2] + (D.browOut || 0) + (X.browOut || 0), browT: B.t, browL: B.len, browTaper: B.taper, browY: F.browY || 0,
    noseW: N.w * (F.noseW || 1), noseL: N.len, nosePro: N.pro, noseBridge: N.bridge, noseTip: N.tip,
    mouthW: M.w * (F.mouthW || 1) * (X.mw || 1), lipUp: M.up, lipLow: M.low, corner: M.corner + (D.corner || 0) + (X.corner || 0), open: X.open || 0, tight: !!X.tight, mouthY: S.mouthY,
    iris: b.iris, stubble: b.stubble, scar: b.scar, lines: b.lines, cheekbone: b.cheekbone, mole: b.mole, asym: b.asym, cheek: S.cheek,
  };
}
