// 내 캐릭터(2026-11-09 선생님: 타임머신을 타고 과거로 가는 '시간 여행자'): 얼굴·머리·피부만 고르고, 옷은 장마다 맡는 역할 옷을 입는다(변장).
// 고른 값은 기기 안 저장(save.data.avatar)에 두고, 장마다 roleLook에 applyAvatar로 얹는다. 얼굴 유형 이름은 core/facebuild.js.
import { LOOKS } from './characters.js';

export const AVATAR_PARTS = [
  { key: 'sex', label: '나는', options: [['m', '남자아이'], ['f', '여자아이']] },
  { key: 'shape', label: '얼굴형', options: [['oval', '달걀형'], ['round', '둥근 얼굴'], ['long', '긴 얼굴'], ['wide', '넓적한 얼굴'], ['square', '네모난 얼굴'], ['heart', '하트형']] },
  { key: 'eye', label: '눈', options: [['almond', '아몬드 눈'], ['round', '동그란 눈'], ['narrow', '가는 눈'], ['upturned', '올라간 눈'], ['droopy', '처진 눈'], ['small', '작은 눈'], ['deep', '깊은 눈']] },
  { key: 'brow', label: '눈썹', options: [['straight', '반듯한 눈썹'], ['arched', '둥근 눈썹'], ['angled', '꺾인 눈썹'], ['thin', '가는 눈썹'], ['bushy', '짙은 눈썹'], ['short', '짧은 눈썹']] },
  { key: 'nose', label: '코', options: [['small', '작은 코'], ['button', '동글 코'], ['high', '오뚝한 코'], ['broad', '넓은 코'], ['long', '긴 코'], ['flat', '낮은 코']] },
  { key: 'mouth', label: '입', options: [['firm', '다부진 입'], ['small', '작은 입'], ['full', '도톰한 입'], ['thin', '얇은 입'], ['wide', '넓은 입']] },
  { key: 'skin', label: '피부', options: [['light', '밝음'], ['base', '보통'], ['tan', '그을림']], swatch: { light: '#f1dcc4', base: '#e4c3a0', tan: '#c99a6e' } },
  { key: 'extra', label: '덧붙이기', options: [['none', '없음'], ['mole', '점'], ['glasses', '안경']] },
];
export const DEFAULT_AVATAR = { sex: 'm', shape: 'oval', eye: 'almond', brow: 'straight', nose: 'small', mouth: 'firm', skin: 'base', extra: 'none' };
export const labelOf = (key, value) => (AVATAR_PARTS.find(p => p.key === key)?.options.find(([v]) => v === value) || [])[1] || '';
// 부위를 앞뒤로 넘긴다(끝에서는 처음으로)
export function cycleAvatar(avatar, key, dir = 1) {
  const opts = AVATAR_PARTS.find(p => p.key === key).options, i = Math.max(0, opts.findIndex(([v]) => v === avatar[key]));
  return { ...avatar, [key]: opts[(i + dir + opts.length) % opts.length][0] };
}
export function randomAvatar(rand = Math.random) {
  const a = {}; for (const p of AVATAR_PARTS) a[p.key] = p.options[Math.floor(rand() * p.options.length)][0];
  return a;
}
export const isAvatar = a => !!a && typeof a === 'object' && AVATAR_PARTS.every(p => p.options.some(([v]) => v === a[p.key]));

// 머리 종류 가운데 '머리카락'인 것(투구·관모·모자는 그대로 두고, 머리카락만 여자아이 머리로 바꾼다)
const HAIR_HATS = new Set(['topknot', 'short', 'buzz', 'swept', 'daenggi', 'braid', 'bun']);
// 역할 옷(look)에 내 얼굴을 얹는다: 옷·모자·무기는 그대로, 얼굴 짜임·피부·안경·점·성별만 바꾼다
export function applyAvatar(look, avatar) {
  if (!isAvatar(avatar)) return look;
  const base = look || LOOKS.player, f = base.face || {};
  const face = { ...f, eyes: 'stern', brows: 'stern', mouth: 'flat', build: { ...(f.build || {}), shape: avatar.shape, eye: avatar.eye, brow: avatar.brow, nose: avatar.nose, mouth: avatar.mouth, mole: avatar.extra === 'mole' ? [0.35, 0.3] : null, mood: 'calm' },
    glasses: avatar.extra === 'glasses' ? 'round' : null, beard: null, stubble: false, age: f.age || 'young' };
  if (avatar.sex === 'f') face.sex = 'f'; else delete face.sex;
  const out = { ...base, named: true, skin: avatar.skin, face };
  if (avatar.sex === 'f' && HAIR_HATS.has(base.hat)) out.hat = 'braid'; // 땋은 머리(시대 규칙 core/hairstyle.js가 댕기·갈래·단발을 정한다)
  return out;
}

// 2026년 시간 여행자의 옷(도착 연출에서 변장하기 전 잠깐 입는다)
export const TRAVELER_LOOK = { named: true, outfit: 'shirt', robe: 0xe8e6e0, pants: 0x3a3f4a, hat: 'short', trim: 0x3a3f4a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', age: 'young' } };

// 도착 안내 한 줄: 장의 연도·장소와 역할 이름으로 만든다(장마다 새 글을 쓰지 않는다). short: 같은 편 안에서 다음 장으로 옮길 때
export function arrivalLine(meta, role, short = false) {
  const year = String(meta.years || '').split(/[~·]/)[0].trim(), where = meta.place ? `${year}년 ${meta.place}` : `${year}년`;
  const who = role?.name ? `${role.name} 차림으로 변장하자!` : '이 시대 사람처럼 변장하자!';
  return short ? `${where}(으)로 옮겨 왔어. ${who}` : `${where}에 도착했어. 여기 사람처럼 보여야 하니 ${who}`;
}
