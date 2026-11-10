// 내 캐릭터(2026-11-09 선생님: 타임머신을 타고 과거로 가는 '시간 여행자'): 얼굴·머리·피부만 고르고, 옷은 장마다 맡는 역할 옷을 입는다(변장).
// 고른 값은 기기 안 저장(save.data.avatar)에 두고, 장마다 roleLook에 applyAvatar로 얹는다. 얼굴 유형 이름은 core/facebuild.js.
import { LOOKS } from './characters.js';

// tab: 등록 화면의 묶음(얼굴·꾸미기·머리·옷). swatch: 빛깔 점으로 고르는 부위
export const AVATAR_TABS = [['face', '얼굴'], ['deco', '꾸미기'], ['hair', '머리'], ['wear', '옷']];
export const AVATAR_PARTS = [
  { key: 'sex', tab: 'face', label: '나는', options: [['m', '남자아이'], ['f', '여자아이']] },
  { key: 'shape', tab: 'face', label: '얼굴형', options: [['oval', '달걀형'], ['round', '둥근 얼굴'], ['long', '긴 얼굴'], ['wide', '넓적한 얼굴'], ['square', '네모난 얼굴'], ['heart', '하트형']] },
  { key: 'eye', tab: 'face', label: '눈', options: [['almond', '아몬드 눈'], ['round', '동그란 눈'], ['narrow', '가는 눈'], ['upturned', '올라간 눈'], ['droopy', '처진 눈'], ['small', '작은 눈'], ['deep', '깊은 눈']] },
  { key: 'brow', tab: 'face', label: '눈썹', options: [['straight', '반듯한 눈썹'], ['arched', '둥근 눈썹'], ['angled', '꺾인 눈썹'], ['thin', '가는 눈썹'], ['bushy', '짙은 눈썹'], ['short', '짧은 눈썹']] },
  { key: 'nose', tab: 'face', label: '코', options: [['small', '작은 코'], ['button', '동글 코'], ['high', '오뚝한 코'], ['broad', '넓은 코'], ['long', '긴 코'], ['flat', '낮은 코']] },
  { key: 'mouth', tab: 'face', label: '입', options: [['firm', '다부진 입'], ['small', '작은 입'], ['full', '도톰한 입'], ['thin', '얇은 입'], ['wide', '넓은 입']] },
  // 꾸미기(2026-11-10 선생님: 개성이 더 드러나게): 모두 얼굴 겉에만 그려서 어떤 투구·관모를 써도 겹치지 않는다
  { key: 'skin', tab: 'deco', label: '피부', options: [['pale', '아주 밝음'], ['light', '밝음'], ['base', '보통'], ['tan', '그을림'], ['deep', '짙음']], swatch: { pale: '#f8e6d4', light: '#f1dcc4', base: '#e4c3a0', tan: '#c99a6e', deep: '#a9794f' } },
  { key: 'cheek', tab: 'deco', label: '볼', options: [['none', '없음'], ['blush', '발그레한 볼'], ['freckles', '주근깨']] },
  { key: 'mole', tab: 'deco', label: '점', options: [['none', '없음'], ['eye', '눈 밑 점'], ['mouth', '입가 점'], ['cheek', '볼 점']] },
  { key: 'glasses', tab: 'deco', label: '안경', options: [['none', '없음'], ['round', '둥근 안경'], ['square', '네모 안경']] },
  { key: 'extra', tab: 'deco', label: '덧붙이기', options: [['none', '없음'], ['patch', '볼 반창고']] },
  // 머리 모양은 2026년 차림일 때만 보인다(변장하면 그 시대 머리·투구). 머리 빛깔은 변장해도 남는다
  { key: 'hair', tab: 'hair', label: '머리 모양', options: [['side', '가르마 머리'], ['crop', '상고머리'], ['back', '넘긴 머리'], ['buzz', '까까머리'], ['curly', '곱슬머리'], ['bob', '단발머리'], ['braid', '땋은 머리'], ['twin', '양 갈래']] },
  { key: 'hairColor', tab: 'hair', label: '머리 색', options: [['black', '검정'], ['dark', '짙은 갈색'], ['brown', '갈색']], swatch: { black: '#1e1c1a', dark: '#3b2a20', brown: '#6a4630' } },
  // 2026년 옷차림(변장하기 전·대원증). 팔찌는 변장해도 손목에 남는 나만의 표시
  { key: 'top', tab: 'wear', label: '윗옷', options: [['shirt', '셔츠'], ['tee', '티셔츠'], ['hoodie', '후드 티'], ['dress', '블라우스와 치마']] },
  { key: 'topColor', tab: 'wear', label: '윗옷 색', options: [['white', '하양'], ['red', '빨강'], ['yellow', '노랑'], ['green', '초록'], ['blue', '파랑'], ['purple', '보라'], ['pink', '분홍']], swatch: { white: '#e8e6e0', red: '#c8473a', yellow: '#e0b043', green: '#4f8a5b', blue: '#3f6fb0', purple: '#7a5aa8', pink: '#e58fa6' } },
  { key: 'bottomColor', tab: 'wear', label: '바지·치마', options: [['navy', '남색'], ['black', '검정'], ['beige', '베이지'], ['denim', '청색']], swatch: { navy: '#3a3f4a', black: '#26262a', beige: '#b9a37e', denim: '#4a6a94' } },
  { key: 'shoe', tab: 'wear', label: '신발', options: [['black', '검정'], ['white', '하양'], ['red', '빨강'], ['blue', '파랑']], swatch: { black: '#1e1a16', white: '#eeeae0', red: '#c8473a', blue: '#3f6fb0' } },
  { key: 'band', tab: 'wear', label: '시간 팔찌', options: [['gold', '금빛'], ['red', '빨강'], ['green', '초록'], ['blue', '파랑'], ['purple', '보라']], swatch: { gold: '#e0b043', red: '#d9482f', green: '#4f9a6a', blue: '#3f8fd0', purple: '#8a62c0' } },
];
export const DEFAULT_AVATAR = { sex: 'm', shape: 'oval', eye: 'almond', brow: 'straight', nose: 'small', mouth: 'firm', skin: 'base', cheek: 'none', mole: 'none', glasses: 'none', extra: 'none',
  hair: 'side', hairColor: 'black', top: 'shirt', topColor: 'white', bottomColor: 'navy', shoe: 'black', band: 'gold' };
export const labelOf = (key, value) => (AVATAR_PARTS.find(p => p.key === key)?.options.find(([v]) => v === value) || [])[1] || '';
const hex = (key, value) => parseInt(AVATAR_PARTS.find(p => p.key === key).swatch[value].slice(1), 16);
// 부위를 앞뒤로 넘긴다(끝에서는 처음으로)
export function cycleAvatar(avatar, key, dir = 1) {
  const opts = AVATAR_PARTS.find(p => p.key === key).options, i = Math.max(0, opts.findIndex(([v]) => v === avatar[key]));
  return { ...avatar, [key]: opts[(i + dir + opts.length) % opts.length][0] };
}
export function randomAvatar(rand = Math.random) {
  const a = {}; for (const p of AVATAR_PARTS) a[p.key] = p.options[Math.floor(rand() * p.options.length)][0];
  return a;
}
// 예전에 저장한 캐릭터(부위가 적던 때)에 새 부위의 기본값을 채운다. 예전 '덧붙이기'의 점·안경은 새 자리로 옮긴다
export function normalizeAvatar(a) {
  if (!a || typeof a !== 'object') return null;
  const n = { ...DEFAULT_AVATAR, ...(a.sex === 'f' && !a.hair ? { hair: 'bob' } : {}), ...a };
  if (a.extra === 'mole') { if (n.mole === 'none') n.mole = 'cheek'; n.extra = 'none'; }
  if (a.extra === 'glasses') { if (n.glasses === 'none') n.glasses = 'round'; n.extra = 'none'; }
  return n;
}
export const isAvatar = a => { const n = normalizeAvatar(a); return !!n && typeof a.sex === 'string' && AVATAR_PARTS.every(p => p.options.some(([v]) => v === n[p.key])); };

const MOLES = { eye: [0.36, 0.12], mouth: [0.3, 0.52], cheek: [0.5, 0.3] };
// 내 얼굴(변장해도 그대로): 얼굴 짜임·피부·볼·점·안경·반창고·성별
function myFace(f, a) {
  const face = { ...f, eyes: 'stern', brows: 'stern', mouth: 'flat', build: { ...(f.build || {}), shape: a.shape, eye: a.eye, brow: a.brow, nose: a.nose, mouth: a.mouth, mole: MOLES[a.mole] || null, mood: 'calm' },
    glasses: a.glasses === 'none' ? null : a.glasses, blush: a.cheek === 'blush', freckles: a.cheek === 'freckles', patch: a.extra === 'patch', beard: null, stubble: false, age: f.age || 'young' };
  if (a.sex === 'f') face.sex = 'f'; else delete face.sex;
  return face;
}
// 머리 종류 가운데 '머리카락'인 것(투구·관모·모자는 그대로 두고, 머리카락만 여자아이 머리로 바꾼다)
const HAIR_HATS = new Set(['topknot', 'short', 'buzz', 'swept', 'daenggi', 'braid', 'bun']);
// 역할 옷(look)에 내 얼굴을 얹는다(변장): 옷·모자·투구·무기·머리 모양은 역할 그대로, 얼굴과 머리 빛깔·시간 팔찌만 내 것
export function applyAvatar(look, avatar) {
  if (!isAvatar(avatar)) return look;
  const a = normalizeAvatar(avatar), base = look || LOOKS.player;
  const out = { ...base, named: true, skin: a.skin, face: myFace(base.face || {}, a), hairColor: AVATAR_PARTS.find(p => p.key === 'hairColor').swatch[a.hairColor], band: hex('band', a.band) };
  if (a.sex === 'f' && HAIR_HATS.has(base.hat)) out.hat = 'braid'; // 땋은 머리(시대 규칙 core/hairstyle.js가 댕기·갈래·단발을 정한다)
  return out;
}

// 2026년 시간 여행자의 옷(도착 연출에서 변장하기 전 잠깐 입는다)
export const TRAVELER_LOOK = { named: true, outfit: 'shirt', robe: 0xe8e6e0, pants: 0x3a3f4a, hat: 'short', trim: 0x3a3f4a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', age: 'young' } };
// 내가 고른 머리 모양 → 인물 머리 종류(hat)와 모양 값(hair, core/hairstyle.js가 그대로 쓴다)
const HAIRS = { side: ['short', { cut: 'side' }], crop: ['short', { cut: 'crop' }], back: ['short', { cut: 'back' }], buzz: ['short', { cut: 'buzz' }], curly: ['bun', { perm: true }],
  bob: ['braid', { bob: true }], braid: ['braid', { braids: 1, ribbon: 'red' }], twin: ['braid', { braids: 2, short: true, ribbon: 'red' }] };
// 2026년 차림의 나(도착해서 변장하기 전·등록 화면·대원증): 내 얼굴 + 내가 고른 머리 모양·옷·신발·팔찌
export function travelerLook(avatar) {
  if (!isAvatar(avatar)) return TRAVELER_LOOK;
  const a = normalizeAvatar(avatar), [hat, hair] = HAIRS[a.hair], top = hex('topColor', a.topColor), bottom = hex('bottomColor', a.bottomColor);
  return { ...applyAvatar(TRAVELER_LOOK, a), hat, hair, outfit: a.top === 'dress' ? 'dress' : 'shirt', top: a.top, robe: top, pants: bottom, trim: bottom, shoe: hex('shoe', a.shoe) };
}

// 도착 안내 한 줄: 장의 연도·장소와 역할 이름으로 만든다(장마다 새 글을 쓰지 않는다). short: 같은 편 안에서 다음 장으로 옮길 때
export function arrivalLine(meta, role, short = false) {
  const year = String(meta.years || '').split(/[~·]/)[0].trim(), where = meta.place ? `${year}년 ${meta.place}` : `${year}년`;
  const who = role?.name ? `${role.name} 차림으로 변장하자!` : '이 시대 사람처럼 변장하자!';
  return short ? `${where}(으)로 옮겨 왔어. ${who}` : `${where}에 도착했어. 여기 사람처럼 보여야 하니 ${who}`;
}
