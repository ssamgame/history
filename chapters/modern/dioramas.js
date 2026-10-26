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
  agwan: { base: 'grass', props: [{ type: 'western', x: 1, z: -4, w: 8, d: 5, h: 5, tower: true, color: 0xf2efe6 }, { type: 'tree', x: -8, z: -5 }], people: [['gojongKing', -3, 1.5, -Math.PI / 4]], cam: FAR, at: [0, 2, -2] }, // 1896년에는 아직 왕이라 붉은 곤룡포
  newspaper: { base: 'stone', props: [{ type: 'shop', x: 0, z: -4, w: 6, style: 'modern', sign: '독립신문', awning: 0x2f6b5e }, { type: 'desk', x: -2, z: 0.5 }], people: [['seojaepil', 1, 0.5, Math.PI * 0.9]],
    crowd: [crowd(-6, 3, 4, ['commoner', 'student'], { face: Math.PI / 2, cols: 2 })], cam: FAR, at: [0, 1.5, -1] },
  hwangudan: { base: 'stone', props: [{ type: 'terrace', x: 0, z: -2, w: 8, d: 8, h: 0.6, steps: false }, { type: 'terrace', x: 0, z: -2, w: 5.6, d: 5.6, h: 1.2, steps: false }, { type: 'terrace', x: 0, z: -2, w: 3.2, d: 3.2, h: 1.8, steps: false }, { type: 'flagpole', x: 6, z: -1 }],
    people: [['gojong', 0, -2.2, 0, { scale: 1.1, y: 1.8 }]], crowd: [crowd(-6, 3, 4, ['joseonOfficial'], { face: Math.PI * 0.85, cols: 2 }), crowd(6, 3, 4, ['joseonOfficial'], { face: -Math.PI * 0.85, cols: 2 })], cam: FAR, at: [0, 2, -1] },
  // 만민 공동회는 종로에서 열렸다: 연단 뒤로 종로의 기와 가게들(독립문은 서대문 밖이라 넣지 않는다)
  forum: { base: 'stone', props: [{ type: 'stage', x: 0, z: -4 }, { type: 'shop', x: -7.5, z: -8, w: 5, sign: '포목점', awning: 0x8a2f24 }, { type: 'shop', x: 7.5, z: -8, w: 5, sign: '지물포', awning: 0x6b5a3a, seed: 3 }, { type: 'shop', x: 0, z: -9.5, w: 5, thatch: true, seed: 2 }],
    crowd: [crowd(0, 2, 14, ['commoner', 'gentleman', 'student', 'woman', 'scholar'], { face: Math.PI })], people: [['scholarModern', 0, -4.4, 0, { y: 0.8 }]], cam: FAR, at: AT },
  // ── 근대 5장 근대 문물 ──
  telegraph: { base: 'earth', props: [{ type: 'poles', x: -9, z: -2, n: 4, gap: 6 }, { type: 'hanok', x: 4, z: -6, tile: true }, { type: 'desk', x: 3, z: 0 }, { type: 'papers', x: 6, z: 0.5, kind: 'news', n: 2 }], people: [['gentleman', 3, 1.2, Math.PI], ['commoner', -1, 2, Math.PI * 0.7], ['scholar', -2.5, 1, Math.PI * 0.6]], cam: FAR, at: AT },
  // 건물 앞벽에 단 벽걸이 전화기와 그 앞에서 수화기를 귀에 대는 신사(옆모습)
  telephone: { base: 'stone', props: [{ type: 'western', x: 0, z: -4, w: 7, d: 4, h: 4, color: 0x8a4a3a }, { type: 'telephone', x: 1.6, z: -1.82, y: 1.55, scale: 1.6 }, { type: 'desk', x: -2.6, z: 0.2 }, { type: 'poles', x: -9, z: -2, n: 3, gap: 7 }], people: [['gentleman', 2.9, -1.1, -Math.PI * 0.62], ['woman', -1, 1.6, Math.PI * 0.85]], cam: [3, 9, 15], at: [1, 1.4, -1.5] },
  tram: { base: 'earth', props: [{ type: 'tram', x: 0, z: -1, ry: Math.PI / 2, track: 24 }, { type: 'poles', x: -11, z: -3.4, n: 4, gap: 7 }, { type: 'hanok', x: -6, z: -7, tile: true }, { type: 'western', x: 6, z: -7, w: 6, d: 4, h: 4 }],
    people: [['woman', 3, 3, Math.PI], ['gentleman', -3, 3.4, Math.PI]], cam: FAR, at: AT },
  lamp: { base: 'stone', sky: 'night', props: [{ type: 'lamp', x: -4, z: 0, lit: true }, { type: 'lamp', x: 4, z: 0, lit: true }, { type: 'western', x: 0, z: -5, w: 7, d: 4, h: 5, color: 0x6a3a2a, lit: true }], people: [['gentleman', -2, 2, Math.PI], ['woman', 2, 2.4, Math.PI]], cam: FAR, at: AT },
  church: { base: 'grass', props: [{ type: 'western', x: 0, z: -4, w: 8, d: 5, h: 6, tower: true, color: 0x8a4a3a }, { type: 'hanok', x: -8, z: 1, tile: true, ry: Math.PI / 2 }, { type: 'tree', x: 8, z: 0 }], cam: FAR, at: [0, 2.5, -2] },
  school: { base: 'earth', props: [{ type: 'western', x: 0, z: -5, w: 10, d: 5, h: 5, color: 0x9a6a4a }, { type: 'flagpole', x: 6, z: -1 }],
    crowd: [crowd(0, 1, 10, ['student', 'schoolgirl'], { face: Math.PI })], cam: FAR, at: AT },
  clothes: { base: 'stone', props: [{ type: 'shop', x: -3, z: -4, w: 6, style: 'modern', sign: '양화점', awning: 0x2f6b5e }, { type: 'stall', x: 5, z: -2, color: 0xd8cdb0 }], people: [['gentleman', -2, 1, Math.PI], ['woman', 1, 1.4, Math.PI]], cam: FAR, at: AT },
  // ── 일제 강점기 1장 수탈 ──
  // 토지를 조사(측량)하는 모습: 논 가의 측량 막대, 세 다리 측량기와 서류를 든 조사원, 지켜보는 헌병과 농민
  tojisa: { base: 'grass', props: [{ type: 'paddy', x: 0, z: -3, w: 16, d: 8 }, { type: 'hanok', x: -8, z: 4, ry: 0.4 }, { type: 'surveyPole', x: -4.5, z: -0.6 }, { type: 'surveyPole', x: 5.5, z: -6.5 }, { type: 'surveyPole', x: 0.6, z: 2.4, kind: 'tripod', scale: 1.4 }],
    people: [['gentleman', 1.6, 3, -Math.PI * 0.75, { paper: true }], ['gendarme', 3.6, 1.6, -Math.PI * 0.7], ['peasant', 5.6, 3.6, -Math.PI / 2], ['peasant', 7, 4.2, -Math.PI / 2]], cam: FAR, at: AT },
  // 쌀을 실은 기차가 항구로: 기관차가 그림 안에 보이게 오른쪽으로, 부두 옆에 기선
  railway: { base: 'earth', water: [{ from: 6 }], props: [{ type: 'train', x: 1.5, z: -1, ry: Math.PI / 2, cars: 1, track: 16 }, { type: 'pier', x: 7.5, z: 3, w: 3, d: 6 }, { type: 'steamship', x: 11.2, z: -2, scale: 0.75 }, { type: 'rice', x: 6.6, z: 4.2, n: 6 }], cam: FAR, at: AT },
  // 쌀가마를 부두로 날라 바다 건너가는 기선에 싣는다
  sanmi: { base: 'sand', water: [{ from: 3 }], props: [{ type: 'rice', x: -5, z: -2, n: 9 }, { type: 'rice', x: 2.2, z: 2.2, n: 6 }, { type: 'steamship', x: 8.6, z: -1, scale: 0.85 }, { type: 'pier', x: 4.2, z: 0, w: 3, d: 6 }],
    people: [['commoner', -1, -2, Math.PI / 2, { work: 'carry' }], ['peasant', -3, 2, Math.PI / 2, { work: 'carry' }], ['peasant', 1, -3.4, Math.PI / 2, { work: 'carry' }]], cam: FAR, at: AT },
  // 1930년대 후반 학교: 칠판 앞에서 일본어로 가르치는 제복 입은 교사(칼은 차지 않음)와 학생들
  classroom: { base: 'stone', props: [{ type: 'western', x: 0, z: -6, w: 10, d: 4, h: 4, color: 0x9a7a5a }, { type: 'noticeBoard', x: 0, z: -2.6, chalk: true, scale: 1.3 }, { type: 'desk', x: -3, z: 0 }, { type: 'desk', x: 0, z: 0 }, { type: 'desk', x: 3, z: 0 }],
    people: [['teacherUniform', 2.2, -2.2, -0.5]], crowd: [crowd(0, 1.6, 6, ['student', 'schoolgirl'], { face: Math.PI, cols: 3 })], cam: FAR, at: AT },
  // ── 일제 강점기 2장 3·1 운동 ──
  // 세계 대전이 끝났다는 소식: 마을 게시판에 붙은 신문 앞에 모인 사람들
  ww1end: { base: 'grass', props: [{ type: 'hanok', x: -4, z: -5, tile: true }, { type: 'hanok', x: 4, z: -5 }, { type: 'noticeBoard', x: 0, z: -1.2, n: 3 }, { type: 'papers', x: 2.4, z: -0.8, kind: 'news', n: 2 }], crowd: [crowd(0, 1.5, 8, ['commoner', 'student', 'woman'], { face: Math.PI })], cam: FAR, at: AT },
  declaration: { base: 'stone', props: [{ type: 'pavilion', x: 0, z: -4 }, { type: 'tree', x: -8, z: -5 }], people: [['student', 0, -1.6, 0, { y: 0.6, paper: true }]], crowd: [crowd(0, 2.5, 14, ['student', 'schoolgirl', 'commoner', 'woman'], { face: Math.PI, flags: 0.6 })], cam: FAR, at: AT },
  spread: { base: 'grass', props: [{ type: 'hanok', x: -7, z: -6 }, { type: 'hanok', x: 7, z: -6, tile: true }, { type: 'tree', x: 0, z: -8, kind: 'pine' }], crowd: [crowd(0, 0, 15, ['peasant', 'commoner', 'woman', 'student', 'schoolgirl'], { face: Math.PI, flags: 0.7 })], cam: FAR, at: AT },
  crackdown: { base: 'earth', sky: 'gray', props: [{ type: 'hanok', x: 6, z: -6 }, { type: 'hanok', x: -7, z: -6, ry: 0.3 }], crowd: [crowd(-2, 2.5, 8, ['commoner', 'peasant', 'woman'], { face: Math.PI }), crowd(1, -2.5, 5, ['gendarme'], { face: 0, cols: 5 })], cam: FAR, at: AT },
  // ── 현대 2장 정부 수립 ──
  liberation: { base: 'earth', props: [{ type: 'concrete', x: 0, z: -6, floors: 2, w: 8, shop: false }, { type: 'flagpole', x: -5, z: -2 }, { type: 'flagpole', x: 5, z: -2 }], crowd: [crowd(0, 1.5, 15, ['citizen', 'woman', 'student', 'grandma', 'commoner'], { face: Math.PI, flags: 0.8 })], cam: FAR, at: AT },
  moscow: { base: 'stone', props: [{ type: 'western', x: 0, z: -5, w: 9, d: 5, h: 6, dome: true, color: 0xb8a088 }, { type: 'desk', x: 0, z: 0.5 }], people: [['gentleman', -1.6, 0.6, Math.PI / 2], ['gentleman', 1.6, 0.6, -Math.PI / 2], ['gentleman', 0, -0.8, 0]], cam: FAR, at: [0, 1.5, -1] },
  un: { base: 'stone', props: [{ type: 'concrete', x: 0, z: -5, floors: 3, w: 9, shop: false, color: 0xcfd8de }, { type: 'flagpole', x: -5, z: -1, color: 0x5b92e5 }, { type: 'flagpole', x: 5, z: -1, color: 0x5b92e5 }], people: [['gentleman', -1, 1.5, Math.PI], ['gentleman', 1, 1.5, Math.PI]], cam: FAR, at: [0, 2, -1] },
  election: { base: 'earth', props: [{ type: 'western', x: 0, z: -5, w: 9, d: 4, h: 4, color: 0xd6cfc0 }, { type: 'ballot', x: 0, z: 0, scale: 1.3 }, { type: 'flagpole', x: 5, z: -1 }], crowd: [crowd(-4.5, 2, 8, ['citizen', 'woman', 'grandma', 'gentleman'], { face: Math.PI / 2, cols: 2 })], people: [['woman', -1.6, 0.6, Math.PI / 2 + 0.3]], cam: FAR, at: AT },
  government: { base: 'stone', props: [{ type: 'western', x: 0, z: -6, w: 12, d: 5, h: 7, dome: true, color: 0xc8c0b0 }, { type: 'flagpole', x: -4, z: -2 }, { type: 'flagpole', x: 4, z: -2 }], crowd: [crowd(0, 2, 15, ['citizen', 'woman', 'student', 'gentleman'], { face: Math.PI, flags: 0.5 })], cam: FAR, at: [0, 2, -1] },
  // ── 현대 4장 정전 ──
  // 정전 회담(1951년 10월부터 판문점): 들판에 친 군용 천막(철조망 휴전선은 정전 뒤에 생겼다)
  talks: { base: 'grass', props: [{ type: 'tent', x: 0, z: -3.5, color: 0x6b6a4a, scale: 1.6 }, { type: 'tent', x: -6.5, z: -5.5, color: 0x6b6a4a }, { type: 'truck', x: 6.5, z: -4.5, ry: -0.5 }, { type: 'flagpole', x: 4, z: 0, color: 0x5b92e5 }], people: [['rokSoldier', -3.5, 2.5, Math.PI * 0.9], ['unSoldier', 2.5, 1.8, -Math.PI * 0.85]], cam: FAR, at: AT },
  armistice: { base: 'stone', props: [{ type: 'desk', x: -1, z: 0 }, { type: 'desk', x: 1, z: 0 }, { type: 'barracks', x: 0, z: -5, w: 10, color: 0x5b92c8, roof: 0x3a6a9a }], people: [['unSoldier', -2.6, 0.2, Math.PI / 2], ['nkSoldier', 2.6, 0.2, -Math.PI / 2]], cam: FAR, at: [0, 1, -1] },
  ceasefire: { base: 'grass', props: [{ type: 'fence', x: 0, z: 0, w: 24 }, { type: 'tree', x: -8, z: -6, kind: 'pine' }, { type: 'tree', x: 8, z: 5, kind: 'pine' }], people: [['rokSoldier', -3, 3, Math.PI], ['nkSoldier', 3, -3, 0]], cam: FAR, at: AT },
  // ── 현대 5장 전쟁 뒤의 생활 ──
  shanty: { base: 'earth', props: [{ type: 'terrace', x: -2, z: -5, w: 12, d: 4, h: 1.2, steps: false }, { type: 'shack', x: -5, z: -5, y: 1.2 }, { type: 'shack', x: 0, z: -5, y: 1.2 }, { type: 'shack', x: 6, z: 0 }, { type: 'shack', x: -6, z: 1 }], people: [['grandma', 1, 2, Math.PI]], cam: FAR, at: AT },
  peddler: { base: 'earth', props: [{ type: 'stall', x: -3, z: -2, color: 0xd8cdb0 }, { type: 'concrete', x: 5, z: -5, floors: 2, w: 6 }], people: [['woman', 0, 1.4, Math.PI, { work: 'carry' }], ['woman', -3, 0.4, Math.PI]], cam: FAR, at: AT },
  // 판잣집 국숫집: 노점 차양 아래 국수 그릇 놓인 상, 그릇을 나르는 할머니, 먹으러 온 아이와 손님
  milmyeon: { base: 'earth', props: [{ type: 'shack', x: 0, z: -4.5 }, { type: 'stall', x: 0, z: -0.6, w: 3.2, color: 0xd8cdb0 }, { type: 'bowls', x: 0, z: 0.6, n: 4 }, { type: 'jars', x: 4, z: -1 }, { type: 'cargo', x: -4, z: -1, kind: 'sack', n: 4 }],
    people: [['grandma', 2.1, 0.3, -Math.PI / 2 - 0.4], ['kidModern', -0.5, 2.3, Math.PI * 0.95, { scale: 0.8 }], ['citizen', -2.4, 1.2, Math.PI * 0.75]], cam: [2, 9, 14], at: [0, 0.8, -0.5] },
  // 교실이 부서져 운동장에서: 지붕이 무너진 학교 벽과 돌무더기, 운동장에 세운 칠판 앞 선생님과 학생들
  outdoor: { base: 'earth', props: [{ type: 'western', x: -1, z: -7.5, w: 10, d: 4, h: 3.4, color: 0x9a8a7a, ruin: true }, { type: 'sandbags', x: 6.5, z: -6, w: 3 },
      { type: 'noticeBoard', x: 0, z: -2.6, chalk: true, scale: 1.3 }], people: [['scholarModern', 2, -2.2, -0.4]], crowd: [crowd(0, 1.5, 10, ['student', 'schoolgirl'], { face: Math.PI })], cam: FAR, at: AT },
  // 이산가족 찾기(1983): 벽과 게시판마다 붙인 쪽지, 텔레비전 앞에 모인 사람들
  reunion: { base: 'stone', props: [{ type: 'concrete', x: 0, z: -6, floors: 2, w: 10, shop: false }, { type: 'noticeBoard', x: -4, z: -2.4, n: 3 }, { type: 'noticeBoard', x: -1.4, z: -2.6, n: 3 }, { type: 'noticeBoard', x: 1.2, z: -2.6, n: 3 }, { type: 'tv', x: 4.4, z: -1.6, ry: -0.4, scale: 1.2 }],
    crowd: [crowd(0, 1.6, 12, ['grandma', 'citizen', 'woman', 'gentleman'], { face: Math.PI })], cam: FAR, at: AT },
  // ── 현대 6장 민주화와 경제 성장 ──
  april19: { base: 'stone', props: [{ type: 'concrete', x: 0, z: -6, floors: 3, w: 10, shop: false }], crowd: [crowd(0, 0.5, 15, ['student', 'schoolgirl', 'citizen'], { face: Math.PI })], cam: FAR, at: AT },
  highway: { base: 'grass', road: [{ x: 0, z: 0, w: 4, d: 26, color: 0x55545a }], props: [{ type: 'truck', x: 0.9, z: 2, color: 0x3f6a8a }, { type: 'truck', x: -0.9, z: -5, ry: Math.PI, color: 0x8a2f24 }, { type: 'tree', x: -6, z: -4, kind: 'poplar' }, { type: 'tree', x: 6, z: 3, kind: 'poplar' }], cam: FAR, at: AT },
  may18: { base: 'stone', props: [{ type: 'western', x: 0, z: -6, w: 10, d: 4, h: 5, color: 0xb8b0a0 }], crowd: [crowd(0, 0.5, 15, ['citizen', 'woman', 'student', 'gentleman'], { face: Math.PI })], cam: FAR, at: AT },
  june87: { base: 'stone', road: [{ x: 0, z: 0, w: 26, d: 6, color: 0x55545a }], props: [{ type: 'concrete', x: -5, z: -6, floors: 4, w: 6, shop: false }, { type: 'concrete', x: 5, z: -6, floors: 3, w: 6 }], crowd: [crowd(0, -0.5, 15, ['student', 'citizen', 'woman', 'gentleman'], { face: Math.PI })], cam: FAR, at: AT },
  olympics: { base: 'grass', props: [{ type: 'flagpole', x: -6, z: -4, color: 0x5b92e5 }, { type: 'flagpole', x: -3, z: -5, color: 0xd9a441 }, { type: 'flagpole', x: 0, z: -5.5 }, { type: 'flagpole', x: 3, z: -5, color: 0x2f8a4a }, { type: 'flagpole', x: 6, z: -4, color: 0xb8452f }],
    crowd: [crowd(0, 1, 15, ['student', 'schoolgirl', 'citizen', 'woman'], { face: Math.PI })], cam: FAR, at: AT },
};
