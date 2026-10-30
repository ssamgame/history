// 시대별 머리 모양(D-56): 같은 시대·같은 집단은 기본형을 함께 쓰고, 이름 없는 군중 가운데 일부만 한 가지씩 다르게.
// - 머리 종류(family)는 생김새의 hat 값이다(상투·짧은 머리·쪽진 머리·땋은 머리·곤발·갓·투구 …). 모자·투구를 쓴 사람은 밖으로 보이는 곳만 다르게 한다.
// - 시대(era)는 장이 시작될 때 정한다(setHairEra, core/flow.js). 시대에 맞지 않는 머리 종류는 그 시대의 머리로 바꾼다(시대가 섞이지 않게).
// - 같은 사람은 늘 같은 머리: 생김새 묶음과 군중 번호(people.js의 n, 1~6)로 정한 씨앗을 쓴다. 이름난 인물·말을 거는 사람(n = 0)은 생김새에 정한 그대로.
// - 고증이 확실하지 않은 것은 넣지 않았다: 고려 상투의 망건(조선 때 널리 쓰임)은 고려편에서 빼고, 거란 곤발은 귀 앞 머리 타래 길이만 달리한다.

export const ERAS = ['goryeo', 'joseon', 'modern', 'colonial', 'present'];
export const eraOfChapter = id => (/^ch\d/.test(id) ? 'goryeo' : /^j\d/.test(id) ? 'joseon' : /^k\d/.test(id) ? 'modern' : /^i\d/.test(id) ? 'colonial' : /^h\d/.test(id) ? 'present' : null);
let era = null, late = false;
// id: 장 id(선택). 현대편 5·6장(1960~80년대)은 옷차림이 해방·전쟁기와 달라 따로 구분한다(eraKey 'presentLate')
export const setHairEra = (e, id = '') => { era = ERAS.includes(e) ? e : null; late = /^h[56]$/.test(id); };
export const hairEra = () => era;
export const eraKey = () => (era === 'present' && late ? 'presentLate' : era);

// 머리 빛깔: 검은 머리의 자연스러운 범위, 나이 든 사람은 희끗한 머리·흰머리
export const HAIR_COLORS = { black: ['#1e1c1a', '#241f1b', '#2b241e', '#1b1b1d'], gray: ['#3e3a36', '#4a4640'], white: ['#b8b2a8', '#d6d1c8'] }; // gray: 검은 머리에 흰 머리가 섞인 희끗한 빛

// 시대에 맞지 않는 머리 종류 바꾸기(그 시대에 없던 머리가 섞이지 않게)
const ERA_SWAP = {
  goryeo:  { short: 'topknot', buzz: 'topknot', swept: 'topknot' },
  joseon:  { short: 'topknot', buzz: 'topknot', swept: 'topknot' },
  present: { topknot: 'short', daenggi: 'short' },  // 1945년 뒤 남자는 짧은 머리
};

// 머리 종류 × 시대 → 기본형(군중이 나눠 쓴다)과 한 가지씩 얹는 변형(vary: 확률)
// 기본형 항목: knot 상투 자리(high·mid·low), knotSize, manggeon 망건, cut 짧은 머리 모양(crop 상고머리·side 가르마·buzz 까까머리·back 넘긴 머리),
//   bun 쪽 크기, pin 비녀 빛깔, perm 파마머리, braids 땋은 갈래 수, ribbon 댕기 빛깔, lock 곤발 머리 타래 길이, fringe 곤발 앞이마 머리, loops 몽골 땋은 고리
// front 이마 선(straight·round·m·part, 머리 모양 윤곽 core/people.js hairCap)
// 변형: towel 흰 수건 머리띠(일꾼·농민, 조선 뒤), sideburn 구레나룻, nape 모자 밑 뒷머리, gray 희끗한 머리
export const HAIR_RULES = {
  topknot: {
    goryeo:   { bases: [{ knot: 'mid' }, { knot: 'high', front: 'round' }, { knot: 'mid', knotSize: 1.25, front: 'm' }], vary: { gray: 0.15, sideburn: 0.15 } },
    joseon:   { bases: [{ knot: 'mid', manggeon: true }, { knot: 'high', manggeon: true, front: 'round' }, { knot: 'mid', knotSize: 1.25, manggeon: true, front: 'm' }], vary: { towel: 0.2, gray: 0.15 } },
    modern:   { bases: [{ knot: 'mid', manggeon: true }, { knot: 'high', manggeon: true, front: 'round' }], vary: { towel: 0.3, gray: 0.15 } }, // 동학 농민군의 흰 수건
    colonial: { bases: [{ knot: 'mid', manggeon: true }], vary: { towel: 0.25, gray: 0.25 } },                          // 1910~20년대 시골 어른
  },
  short: {
    modern:   { bases: [{ cut: 'crop' }, { cut: 'side' }, { cut: 'side', front: 'round' }], vary: { gray: 0.1 } },                                  // 단발령(1895) 뒤 짧게 자른 머리
    colonial: { bases: [{ cut: 'crop' }, { cut: 'side' }, { cut: 'buzz' }, { cut: 'crop', front: 'round' }], vary: { gray: 0.1 } },                  // 상고머리·가르마·까까머리
    present:  { bases: [{ cut: 'side' }, { cut: 'crop' }, { cut: 'buzz' }, { cut: 'back' }], vary: { gray: 0.12 } },
  },
  bun: { // 쪽진 머리(혼인한 여자)
    joseon:   { bases: [{ bun: 1, pin: 'silver' }, { bun: 1.15, pin: 'wood' }, { bun: 0.9, pin: 'jade' }], vary: { gray: 0.15 } },
    modern:   { bases: [{ bun: 1, pin: 'silver' }, { bun: 1.15, pin: 'wood' }, { bun: 0.9, pin: 'jade' }], vary: { gray: 0.15 } },
    colonial: { bases: [{ bun: 1, pin: 'silver' }, { bun: 1.1, pin: 'wood' }], vary: { gray: 0.15 } },
    present:  { bases: [{ bun: 1, pin: 'silver' }, { perm: true }, { bun: 1.1, pin: 'wood' }], vary: { gray: 0.12 } }, // 1950년대 파마머리
  },
  braid: { // 땋은 머리(혼인하지 않은 여자아이·처녀)
    joseon:   { bases: [{ braids: 1, ribbon: 'red' }, { braids: 1, ribbon: 'purple' }] },
    modern:   { bases: [{ braids: 1, ribbon: 'red' }, { braids: 1, ribbon: 'purple' }] },
    colonial: { bases: [{ braids: 1, ribbon: 'red' }, { braids: 2, ribbon: 'black' }, { braids: 1, ribbon: 'black' }] }, // 여학생 양 갈래
    present:  { bases: [{ braids: 2, ribbon: 'red' }, { braids: 1, ribbon: 'red' }, { braids: 2, ribbon: 'black' }] },
  },
  daenggi: { // 땋은 머리와 댕기(혼인하지 않은 남자아이)
    goryeo:   { bases: [{ braids: 1, ribbon: 'red' }, { braids: 1, ribbon: 'red', short: true }] },
    joseon:   { bases: [{ braids: 1, ribbon: 'red' }, { braids: 1, ribbon: 'purple' }, { braids: 1, ribbon: 'red', short: true }] },
    modern:   { bases: [{ braids: 1, ribbon: 'red' }, { braids: 1, ribbon: 'purple' }] },
    colonial: { bases: [{ braids: 1, ribbon: 'red' }] },
  },
  kunfa: { // 거란 곤발: 정수리를 깎고 귀 앞 머리 타래를 늘어뜨린다(앞이마 머리를 남기기도)
    goryeo:   { bases: [{ lock: 1 }, { lock: 0.7 }, { lock: 1.2 }] }, // 머리 타래 길이만(앞이마 머리는 모양이 확실하지 않아 넣지 않는다)
  },
  mongol: { // 몽골 모자 밑 땋아 늘어뜨린 고리
    goryeo:   { bases: [{ loops: true }, { loops: false }] },
  },
  // 모자를 쓴 사람: 밖으로 보이는 곳만
  gat:     { joseon: { bases: [{ manggeon: true }], vary: { sideburn: 0.2, gray: 0.15 } }, modern: { bases: [{ manggeon: true }], vary: { sideburn: 0.2, gray: 0.15 } }, colonial: { bases: [{ manggeon: true }], vary: { gray: 0.2 } } },
  jeollip: { joseon: { bases: [{ manggeon: true }], vary: { sideburn: 0.2 } }, modern: { bases: [{ manggeon: true }] } },
  cap:     { modern: { bases: [{}], vary: { nape: 0.5 } }, colonial: { bases: [{}], vary: { nape: 0.5, sideburn: 0.15 } }, present: { bases: [{}], vary: { nape: 0.5 } } },
  steel:   { present: { bases: [{}], vary: { nape: 0.45, sideburn: 0.15 } } },
  fedora:  { modern: { bases: [{}], vary: { nape: 0.6, gray: 0.2 } }, colonial: { bases: [{}], vary: { nape: 0.6, gray: 0.2 } }, present: { bases: [{}], vary: { nape: 0.6, gray: 0.2 } } },
  // 투구·관모(복두·익선관)·털모자·청나라 모자·스님은 머리가 보이지 않거나 집단이 한결같아서 머리는 바꾸지 않는다(수염만)
};

// 수염(어른 남자 군중): 시대·역할마다 고르는 범위(앞이 흔한 것). 생김새에 정한 수염은 기본 얼굴(n = 0)에서 그대로
export const BEARD_RULES = {
  goryeo:   { soldier: [null, null, 'mustache', 'thin', 'goatee'], farmer: [null, 'mustache', 'goatee', 'full', 'thin'], official: ['goatee', 'mustache', 'full'], foreign: [null, 'mustache', 'thin', 'full'] },
  joseon:   { soldier: [null, null, 'mustache', 'thin'], farmer: [null, 'mustache', 'goatee', 'thin', 'full'], official: ['goatee', 'mustache', 'full'], scholar: ['goatee', 'full', 'mustache'], foreign: [null, 'mustache'] },
  modern:   { soldier: [null, 'mustache', 'thin'], farmer: [null, 'mustache', 'goatee', 'thin'], official: ['goatee', 'mustache'], scholar: ['goatee', 'mustache', 'full'], merchant: ['mustache', null, 'thin'] },
  colonial: { soldier: [null, null, 'mustache'], farmer: [null, 'mustache', 'thin'], merchant: ['mustache', null, null], scholar: ['mustache', null] },
  present:  { soldier: [null], farmer: [null, null, null, 'mustache'], merchant: [null, null, 'mustache'], scholar: [null, 'mustache'] },
};

const hashOf = key => { let h = 2166136261; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// 한 사람의 머리 모양. role: core/facebuild.js roleOf 값. 돌려주는 값 { hat, color, beard?, ...기본형, ...변형 하나 }
export function hairStyle(L = {}, n = 0, role = 'farmer', e = era) {
  const f = L.face || {};
  const family0 = L.hat, hat = (e && !L.named && ERA_SWAP[e]?.[family0]) || family0; // 이름난 인물은 생김새에 정한 머리 그대로
  const old = f.age === 'old', kid = f.age === 'young' || role === 'youth' || role === 'child', fem = f.sex === 'f' || ['bun', 'braid'].includes(hat);
  const out = { hat, color: L.hairColor || null };
  let h = hashOf(JSON.stringify([L.robe, family0, L.outfit, f.beard, role]));
  const r = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  const rules = HAIR_RULES[hat], set = rules && (rules[e] || rules[Object.keys(rules)[0]]);
  if (!n) { // 기본 얼굴(이름난 인물·말을 거는 사람): 기본형 첫째 그대로
    if (set) Object.assign(out, set.bases[0]);
    if (!out.color) out.color = old ? HAIR_COLORS.white[0] : HAIR_COLORS.black[0];
    return out;
  }
  const s0 = Math.floor(r() * 97);
  if (set) {
    Object.assign(out, set.bases[(s0 + n) % set.bases.length]); // 군중은 기본형을 차례로 나눠 쓴다
    // 변형은 한 사람에 많아야 하나(모든 것을 한꺼번에 바꾸지 않는다)
    h ^= Math.imul(n, 0x9e3779b9);
    const vs = Object.entries(set.vary || {});
    if (vs.length) { const [k, p] = vs[Math.floor(r() * vs.length)]; if (r() < p * 1.6) { if (k === 'gray') out.gray = true; else out[k] = true; } }
  }
  h ^= Math.imul(n + 7, 0x85ebca6b);
  if (old && !out.front && !fem) out.front = 'm'; // 나이 든 남자는 양쪽 이마가 들어간 머리선
  if (!out.color) out.color = old ? HAIR_COLORS.white[Math.floor(r() * 2)] : out.gray ? HAIR_COLORS.gray[Math.floor(r() * 2)] : HAIR_COLORS.black[Math.floor(r() * 4)];
  // 수염: 어른 남자 군중만, 생김새에 수염을 정하지 않은 사람, 그 시대·역할의 범위 안에서
  const br = e && BEARD_RULES[e] && (BEARD_RULES[e][role] || BEARD_RULES[e].farmer);
  if (br && !fem && !kid && !old && !L.named) { const list = f.beard ? [f.beard, f.beard, ...br] : br; out.beard = list[(Math.floor(r() * 97) + n * 2) % list.length]; } // 생김새에 수염이 있으면 그것이 가장 흔하게
  return out;
}
