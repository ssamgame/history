// 역사책 쪽마다의 재현 그림(디오라마) 꾸밈표. 열쇠는 pictures.js의 PIC 이름과 같다(page.pic).
// 그 쪽 설명에 나오는 장소·사람·물건만 놓는다(설명에 없는 사건을 지어 넣지 않는다). 다툼·진압 장면은 불길·상처 없이 마주 선 모습과 연기로만.
// 부품은 chapters/kit/town.js BUILD, 사람은 content/characters.js LOOKS. 그리는 법은 chapters/kit/diorama.js.
const crowd = (x, z, n, looks, o = {}) => ({ x, z, n, cols: o.cols || Math.min(n, 5), looks, face: o.face || 0, flags: o.flags || 0, ry: o.ry || 0 });
const FAR = [0, 15, 25], AT = [0, 1.2, 0];

export const DIORAMA = {
  // ── 근대 3장 동학 농민 운동 ──
  gobu: { base: 'earth', props: [{ type: 'terrace', x: 0, z: -5, w: 9, d: 5.4, h: 0.7, steps: true }, { type: 'hanok', x: 0, z: -5.2, y: 0.7, tile: true, scale: 1.3 }, { type: 'wall', x: -7, z: -4, w: 5 }, { type: 'wall', x: 7, z: -4, w: 5 }, { type: 'flagpole', x: 3.6, z: -1, color: 0xf2efe6 }],
    crowd: [crowd(-1, 2, 10, ['peasant', 'uibyeong'], { face: Math.PI })], people: [['jeonbongjun', 0, 0.2, Math.PI]], cam: FAR, at: AT },
  hwangtohyeon: { base: 'grass', sky: 'dusk', props: [{ type: 'tree', x: -9, z: -6, kind: 'pine' }, { type: 'tree', x: 9, z: -7, kind: 'pine' }, { type: 'flagpole', x: -3, z: 1, color: 0xf2efe6 }],
    crowd: [crowd(-4, 0, 10, ['peasant', 'uibyeong'], { face: Math.PI / 2 }), crowd(6, -2, 5, ['joseonSoldier'], { face: -Math.PI / 2, cols: 3 })], cam: FAR, at: AT },
  jeonju: { base: 'earth', props: [{ type: 'gate', x: 0, z: -5, label: '豐南門', wing: 4, scale: 0.8 }, { type: 'flagpole', x: -3, z: -1.5, color: 0xf2efe6 }, { type: 'flagpole', x: 3, z: -1.5, color: 0xf2efe6 }],
    crowd: [crowd(0, 2.5, 10, ['peasant', 'uibyeong'], { face: Math.PI })], cam: FAR, at: [0, 2, -2] },
  hwayak: { base: 'earth', props: [{ type: 'hanok', x: 2, z: -5, tile: true, scale: 1.2 }, { type: 'desk', x: -1, z: 0 }], people: [['jeonbongjun', -2.4, 0.4, Math.PI / 2], ['joseonOfficial', 0.6, 0.4, -Math.PI / 2]],
    crowd: [crowd(-7, 3, 5, ['peasant'], { face: Math.PI * 0.8, cols: 3 })], cam: FAR, at: [0, 1, -1] },
  rise: { base: 'grass', sky: 'gray', props: [{ type: 'tree', x: -9, z: -6, kind: 'pine' }, { type: 'tree', x: -6, z: -8, kind: 'pine' }, { type: 'flagpole', x: 0, z: -1, color: 0xf2efe6 }],
    crowd: [crowd(0, 1, 15, ['peasant', 'uibyeong', 'peasant'], { face: 0 })], cam: FAR, at: AT },
  ugeumchi: { base: 'grass', sky: 'gray', props: [{ type: 'tree', x: -8, z: -7, kind: 'bare' }, { type: 'tree', x: 8, z: -6, kind: 'bare' }],
    crowd: [crowd(-2, 3, 8, ['peasant', 'uibyeong'], { face: Math.PI }), crowd(1, -5, 5, ['gendarme', 'joseonSoldier'], { face: 0, cols: 5 })], cam: FAR, at: AT },
  // ── 근대 4장 독립 협회와 대한 제국 ──
  eulmi: { base: 'stone', sky: 'gray', props: [{ type: 'terrace', x: 0, z: -4, w: 11, d: 6, h: 0.9 }, { type: 'hanok', x: 0, z: -4.3, y: 0.9, tile: true, scale: 1.6 }, { type: 'wall', x: -8, z: 0, w: 6, ry: Math.PI / 2 }, { type: 'wall', x: 8, z: 0, w: 6, ry: Math.PI / 2 }],
    cam: FAR, at: [0, 2, -2] },
  agwan: { base: 'grass', props: [{ type: 'western', x: 1, z: -4, w: 8, d: 5, h: 5, tower: true, color: 0xf2efe6 }, { type: 'tree', x: -8, z: -5 }], people: [['gojong', -3, 1.5, -Math.PI / 4]], cam: FAR, at: [0, 2, -2] },
  newspaper: { base: 'stone', props: [{ type: 'shop', x: 0, z: -4, w: 6, style: 'modern', sign: '독립신문', awning: 0x2f6b5e }, { type: 'desk', x: -2, z: 0.5 }], people: [['seojaepil', 1, 0.5, Math.PI * 0.9]],
    crowd: [crowd(-6, 3, 4, ['commoner', 'student'], { face: Math.PI / 2, cols: 2 })], cam: FAR, at: [0, 1.5, -1] },
  hwangudan: { base: 'stone', props: [{ type: 'terrace', x: 0, z: -2, w: 8, d: 8, h: 0.6, steps: false }, { type: 'terrace', x: 0, z: -2, w: 5.6, d: 5.6, h: 1.2, steps: false }, { type: 'terrace', x: 0, z: -2, w: 3.2, d: 3.2, h: 1.8, steps: false }, { type: 'flagpole', x: 6, z: -1 }],
    people: [['gojong', 0, -2, Math.PI, { scale: 1.1 }]], cam: FAR, at: [0, 2, -1] },
  forum: { base: 'stone', props: [{ type: 'stage', x: 0, z: -4 }, { type: 'arch', x: -8, z: -6, label: '독립문', scale: 0.6 }],
    crowd: [crowd(0, 2, 14, ['commoner', 'gentleman', 'student', 'woman', 'scholar'], { face: Math.PI })], people: [['scholarModern', 0, -4, 0]], cam: FAR, at: AT },
  // ── 근대 5장 근대 문물 ──
  telegraph: { base: 'earth', props: [{ type: 'poles', x: -9, z: -2, n: 4, gap: 6 }, { type: 'hanok', x: 4, z: -6, tile: true }, { type: 'desk', x: 3, z: 0 }], people: [['gentleman', 3, 1.2, Math.PI]], cam: FAR, at: AT },
  telephone: { base: 'stone', props: [{ type: 'western', x: 0, z: -4, w: 7, d: 4, h: 4, color: 0x8a4a3a }, { type: 'desk', x: -1.5, z: 0.5 }], people: [['gentleman', -1.5, 1.6, Math.PI]], cam: FAR, at: [0, 1.5, -1] },
  tram: { base: 'earth', props: [{ type: 'tram', x: 0, z: -1, ry: Math.PI / 2, track: 24 }, { type: 'poles', x: -11, z: -3.4, n: 4, gap: 7 }, { type: 'hanok', x: -6, z: -7, tile: true }, { type: 'western', x: 6, z: -7, w: 6, d: 4, h: 4 }],
    people: [['woman', 3, 3, Math.PI], ['gentleman', -3, 3.4, Math.PI]], cam: FAR, at: AT },
  lamp: { base: 'stone', sky: 'night', props: [{ type: 'lamp', x: -4, z: 0 }, { type: 'lamp', x: 4, z: 0 }, { type: 'western', x: 0, z: -5, w: 7, d: 4, h: 5, color: 0x6a3a2a }], people: [['gentleman', -2, 2, Math.PI], ['woman', 2, 2.4, Math.PI]], cam: FAR, at: AT },
  church: { base: 'grass', props: [{ type: 'western', x: 0, z: -4, w: 8, d: 5, h: 6, tower: true, color: 0x8a4a3a }, { type: 'hanok', x: -8, z: 1, tile: true, ry: Math.PI / 2 }, { type: 'tree', x: 8, z: 0 }], cam: FAR, at: [0, 2.5, -2] },
  school: { base: 'earth', props: [{ type: 'western', x: 0, z: -5, w: 10, d: 5, h: 5, color: 0x9a6a4a }, { type: 'flagpole', x: 6, z: -1 }],
    crowd: [crowd(0, 1, 10, ['student', 'schoolgirl'], { face: Math.PI })], cam: FAR, at: AT },
  clothes: { base: 'stone', props: [{ type: 'shop', x: -3, z: -4, w: 6, style: 'modern', sign: '양화점', awning: 0x2f6b5e }, { type: 'stall', x: 5, z: -2, color: 0xd8cdb0 }], people: [['gentleman', -2, 1, Math.PI], ['woman', 1, 1.4, Math.PI]], cam: FAR, at: AT },
  // ── 일제 강점기 1장 수탈 ──
  tojisa: { base: 'grass', props: [{ type: 'paddy', x: 0, z: -3, w: 16, d: 8 }, { type: 'hanok', x: -8, z: 4, ry: 0.4 }], people: [['gendarme', 2, 2, Math.PI], ['peasant', 5, 3.4, -Math.PI / 2], ['peasant', 6.5, 4, -Math.PI / 2]], cam: FAR, at: AT },
  railway: { base: 'earth', water: [{ from: 6 }], props: [{ type: 'train', x: -3, z: -1, ry: Math.PI / 2, cars: 2, track: 18 }, { type: 'pier', x: 7.5, z: -1, w: 3, d: 8 }], cam: FAR, at: AT },
  sanmi: { base: 'sand', water: [{ from: 3 }], props: [{ type: 'rice', x: -5, z: -2, n: 9 }, { type: 'rice', x: -2, z: 1, n: 6 }, { type: 'boat', x: 7, z: 0, len: 6 }, { type: 'pier', x: 1.5, z: 0, w: 3, d: 6 }],
    people: [['commoner', -1, -2, Math.PI / 2, { work: 'carry' }]], cam: FAR, at: AT },
  classroom: { base: 'stone', props: [{ type: 'western', x: 0, z: -5, w: 10, d: 4, h: 4, color: 0x9a7a5a }, { type: 'desk', x: -3, z: 0 }, { type: 'desk', x: 0, z: 0 }, { type: 'desk', x: 3, z: 0 }],
    people: [['gendarme', 5, -1, -Math.PI / 2]], crowd: [crowd(0, 1.6, 6, ['student', 'schoolgirl'], { face: Math.PI, cols: 3 })], cam: FAR, at: AT },
  // ── 일제 강점기 2장 3·1 운동 ──
  ww1end: { base: 'grass', props: [{ type: 'hanok', x: -4, z: -5, tile: true }, { type: 'hanok', x: 4, z: -5 }], crowd: [crowd(0, 1.5, 8, ['commoner', 'student', 'woman'], { face: Math.PI })], cam: FAR, at: AT },
  declaration: { base: 'stone', props: [{ type: 'pavilion', x: 0, z: -4 }, { type: 'tree', x: -8, z: -5 }], people: [['student', 0, -1.2, Math.PI]], crowd: [crowd(0, 2.5, 14, ['student', 'schoolgirl', 'commoner', 'woman'], { face: Math.PI, flags: 0.6 })], cam: FAR, at: AT },
  spread: { base: 'grass', props: [{ type: 'hanok', x: -7, z: -6 }, { type: 'hanok', x: 7, z: -6, tile: true }, { type: 'tree', x: 0, z: -8, kind: 'pine' }], crowd: [crowd(0, 0, 15, ['peasant', 'commoner', 'woman', 'student', 'schoolgirl'], { face: Math.PI, flags: 0.7 })], cam: FAR, at: AT },
  crackdown: { base: 'earth', sky: 'gray', props: [{ type: 'hanok', x: 6, z: -6 }, { type: 'hanok', x: -7, z: -6, ry: 0.3 }], crowd: [crowd(-2, 2.5, 8, ['commoner', 'peasant', 'woman'], { face: Math.PI }), crowd(1, -2.5, 5, ['gendarme'], { face: 0, cols: 5 })], cam: FAR, at: AT },
  // ── 현대 2장 정부 수립 ──
  liberation: { base: 'earth', props: [{ type: 'concrete', x: 0, z: -6, floors: 2, w: 8, shop: false }, { type: 'flagpole', x: -5, z: -2 }, { type: 'flagpole', x: 5, z: -2 }], crowd: [crowd(0, 1.5, 15, ['citizen', 'woman', 'student', 'grandma', 'commoner'], { face: Math.PI, flags: 0.8 })], cam: FAR, at: AT },
  moscow: { base: 'stone', props: [{ type: 'western', x: 0, z: -5, w: 9, d: 5, h: 6, dome: true, color: 0xb8a088 }, { type: 'desk', x: 0, z: 0.5 }], people: [['gentleman', -1.6, 0.6, Math.PI / 2], ['gentleman', 1.6, 0.6, -Math.PI / 2], ['gentleman', 0, -0.8, 0]], cam: FAR, at: [0, 1.5, -1] },
  un: { base: 'stone', props: [{ type: 'concrete', x: 0, z: -5, floors: 4, w: 7, shop: false, color: 0xcfd8de }, { type: 'flagpole', x: -5, z: -1, color: 0x5b92e5 }, { type: 'flagpole', x: 5, z: -1, color: 0x5b92e5 }], people: [['gentleman', -1, 1.5, Math.PI], ['gentleman', 1, 1.5, Math.PI]], cam: FAR, at: [0, 2, -1] },
  election: { base: 'earth', props: [{ type: 'western', x: 0, z: -5, w: 9, d: 4, h: 4, color: 0xd6cfc0 }, { type: 'desk', x: 0, z: 0 }, { type: 'flagpole', x: 5, z: -1 }], crowd: [crowd(-4, 2, 8, ['citizen', 'woman', 'grandma', 'gentleman'], { face: Math.PI / 2, cols: 2 })], people: [['woman', 1, 0.4, 0]], cam: FAR, at: AT },
  government: { base: 'stone', props: [{ type: 'western', x: 0, z: -6, w: 12, d: 5, h: 7, dome: true, color: 0xc8c0b0 }, { type: 'flagpole', x: -4, z: -2 }, { type: 'flagpole', x: 4, z: -2 }], crowd: [crowd(0, 2, 15, ['citizen', 'woman', 'student', 'gentleman'], { face: Math.PI, flags: 0.5 })], cam: FAR, at: [0, 2, -1] },
  // ── 현대 4장 정전 ──
  talks: { base: 'grass', props: [{ type: 'barracks', x: 0, z: -4, w: 9, color: 0x5b92c8, roof: 0x3a6a9a }, { type: 'fence', x: 0, z: 2, w: 20 }], people: [['rokSoldier', -5, 4.5, Math.PI], ['unSoldier', 5, -1, 0]], cam: FAR, at: AT },
  armistice: { base: 'stone', props: [{ type: 'desk', x: -1, z: 0 }, { type: 'desk', x: 1, z: 0 }, { type: 'barracks', x: 0, z: -5, w: 10, color: 0x5b92c8, roof: 0x3a6a9a }], people: [['unSoldier', -2.6, 0.2, Math.PI / 2], ['nkSoldier', 2.6, 0.2, -Math.PI / 2]], cam: FAR, at: [0, 1, -1] },
  ceasefire: { base: 'grass', props: [{ type: 'fence', x: 0, z: 0, w: 24 }, { type: 'tree', x: -8, z: -6, kind: 'pine' }, { type: 'tree', x: 8, z: 5, kind: 'pine' }], people: [['rokSoldier', -3, 3, Math.PI], ['nkSoldier', 3, -3, 0]], cam: FAR, at: AT },
  // ── 현대 5장 전쟁 뒤의 생활 ──
  shanty: { base: 'earth', props: [{ type: 'terrace', x: -2, z: -5, w: 12, d: 4, h: 1.2, steps: false }, { type: 'shack', x: -5, z: -5, y: 1.2 }, { type: 'shack', x: 0, z: -5, y: 1.2 }, { type: 'shack', x: 6, z: 0 }, { type: 'shack', x: -6, z: 1 }], people: [['grandma', 1, 2, Math.PI]], cam: FAR, at: AT },
  peddler: { base: 'earth', props: [{ type: 'stall', x: -3, z: -2, color: 0xd8cdb0 }, { type: 'concrete', x: 5, z: -5, floors: 2, w: 6 }], people: [['woman', 0, 1.4, Math.PI, { work: 'carry' }], ['woman', -3, 0.4, Math.PI]], cam: FAR, at: AT },
  milmyeon: { base: 'earth', props: [{ type: 'shack', x: 0, z: -4 }, { type: 'desk', x: 0, z: 0.5 }, { type: 'jars', x: 4, z: -1 }], people: [['grandma', 0, -0.8, 0, { work: 'sweep' }], ['kid', -2, 1.8, Math.PI]], cam: FAR, at: [0, 1, -1] },
  outdoor: { base: 'earth', props: [{ type: 'western', x: 0, z: -6, w: 9, d: 4, h: 3, color: 0x9a8a7a, flat: true }, { type: 'desk', x: 0, z: -1.5 }], people: [['scholarModern', 0, -2.6, 0]], crowd: [crowd(0, 1.5, 10, ['student', 'schoolgirl'], { face: Math.PI })], cam: FAR, at: AT },
  reunion: { base: 'stone', props: [{ type: 'concrete', x: 0, z: -5, floors: 3, w: 9, shop: false }, { type: 'desk', x: -3, z: 0 }, { type: 'desk', x: 3, z: 0 }], crowd: [crowd(0, 2, 12, ['grandma', 'citizen', 'woman', 'gentleman'], { face: Math.PI })], cam: FAR, at: AT },
  // ── 현대 6장 민주화와 경제 성장 ──
  april19: { base: 'stone', props: [{ type: 'concrete', x: 0, z: -6, floors: 3, w: 10, shop: false }], crowd: [crowd(0, 0.5, 15, ['student', 'schoolgirl', 'citizen'], { face: Math.PI })], cam: FAR, at: AT },
  highway: { base: 'grass', road: [{ x: 0, z: 0, w: 4, d: 26, color: 0x55545a }], props: [{ type: 'truck', x: 0.9, z: 2, color: 0x3f6a8a }, { type: 'truck', x: -0.9, z: -5, ry: Math.PI, color: 0x8a2f24 }, { type: 'tree', x: -6, z: -4, kind: 'poplar' }, { type: 'tree', x: 6, z: 3, kind: 'poplar' }], cam: FAR, at: AT },
  may18: { base: 'stone', props: [{ type: 'western', x: 0, z: -6, w: 10, d: 4, h: 5, color: 0xb8b0a0 }], crowd: [crowd(0, 0.5, 15, ['citizen', 'woman', 'student', 'gentleman'], { face: Math.PI })], cam: FAR, at: AT },
  june87: { base: 'stone', road: [{ x: 0, z: 0, w: 26, d: 6, color: 0x55545a }], props: [{ type: 'concrete', x: -5, z: -6, floors: 4, w: 6, shop: false }, { type: 'concrete', x: 5, z: -6, floors: 3, w: 6 }], crowd: [crowd(0, -0.5, 15, ['student', 'citizen', 'woman', 'gentleman'], { face: Math.PI })], cam: FAR, at: AT },
  olympics: { base: 'grass', props: [{ type: 'flagpole', x: -6, z: -4, color: 0x5b92e5 }, { type: 'flagpole', x: -3, z: -5, color: 0xd9a441 }, { type: 'flagpole', x: 0, z: -5.5 }, { type: 'flagpole', x: 3, z: -5, color: 0x2f8a4a }, { type: 'flagpole', x: 6, z: -4, color: 0xb8452f }],
    crowd: [crowd(0, 1, 15, ['student', 'schoolgirl', 'citizen', 'woman'], { face: Math.PI })], cam: FAR, at: AT },
};
