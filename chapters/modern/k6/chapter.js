// 근대편 6장 「을사늑약과 나라를 지키려는 노력」: 한성 거리의 학교와 신문사, 산 쪽의 의병 진영.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const TWO = { edge: { style: 'forest', seed: 429 }, // 왼쪽 산속 의병 진지, 오른쪽 학교와 신문사
  origin: [400, 0], ground: 'grass', groundColor: 0x6a7a4c, bounds: { x0: -22, x1: 22, z0: -14, z1: 14 },
  props: [
    { type: 'tent', x: -16, z: -11, color: 0x6b6a4a }, { type: 'tree', x: -20, z: -4, color: 0x34503a }, { type: 'tree', x: -10, z: -13, color: 0x34503a },
    { type: 'crowd', x: -13, z: -6.5, n: 3, cols: 3, looks: ['uibyeong'], face: 0 },
    { type: 'western', x: 13, z: -12, w: 8, d: 4, h: 4, color: 0xb8a070 }, { type: 'crowd', x: 13, z: -7.5, n: 3, cols: 3, looks: ['student', 'schoolgirl'], face: 0 },
  ],
};
const PASS = { edge: { style: 'forest', seed: 307 }, // 산속 고갯길: 양쪽 숲에 의병이 숨어 있다
  origin: [400, 0], ground: 'grass', groundColor: 0x55703f, bounds: { x0: -30, x1: 30, z0: -30, z1: 30 },
  roads: [{ x: 0, z: 0, w: 5, d: 70, color: 0x7a6a50 }],
  props: [
    { type: 'tree', x: -8, z: -18, color: 0x34503a }, { type: 'tree', x: -10, z: -6, color: 0x34503a }, { type: 'tree', x: -8, z: 6, color: 0x34503a },
    { type: 'tree', x: 8, z: -14, color: 0x34503a }, { type: 'tree', x: 10, z: -2, color: 0x34503a }, { type: 'tree', x: 8, z: 10, color: 0x34503a },
    { type: 'crowd', x: -14, z: 4, n: 4, cols: 2, looks: ['uibyeong'], face: Math.PI / 2 }, { type: 'crowd', x: 13, z: -4, n: 3, cols: 1, looks: ['uibyeong'], face: -Math.PI / 2 },
  ],
};
const HAGUE = { edge: { style: 'brick', seed: 207 }, // 헤이그 회의장 앞
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -20, x1: 20, z0: -12, z1: 14 },
  props: [
    { type: 'western', x: 0, z: -14, w: 18, d: 5, h: 8, dome: true, color: 0xc8b8a0 },
  ],
};

export default makeKitChapter({
  id: 'k6', mood: 'overcast', script,
  player: { robe: 0x22262e, hat: 'cap', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['student', 'uibyeong', 'ahnchangho'],
  spot: [0, 4],
  layout: {
    // 1905~1909년: 왼쪽은 솔숲 산자락의 의병 진지(천막·장작), 오른쪽은 한성의 학교와 신문사 — 두 갈래 노력을 한 마당에서 본다. 뒤로 높은 산
    ground: 'grass', groundColor: 0x6f8a56, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.8,
    roads: [{ x: 0, z: 3, w: 36, d: 5, color: 0x9a8a72 }, { x: 0, z: 7, w: 4, d: 8 }, { x: 10, z: -4.5, w: 12, d: 4, kind: 'stone', color: 0xa59c8a }],
    props: [
      { type: 'western', x: 9, z: -8, w: 9, d: 5, h: 5, color: 0x8a4a3a, tower: true },
      { type: 'desk', x: 6, z: -3.5 }, { type: 'desk', x: 11, z: -3.5 },
      { type: 'shop', x: -1, z: -9, w: 5, style: 'modern', sign: '신문사', awning: 0x3a3a44, seed: 3 },
      { type: 'tent', x: -13, z: -5, color: 0xc8c0a8 }, { type: 'tent', x: -9, z: -7, color: 0xc8c0a8 }, { type: 'woodpile', x: -15.5, z: -1 },
      { type: 'crowd', x: -13, z: 0, n: 6, cols: 3, looks: ['uibyeong', 'peasant', 'uibyeong'], face: Math.PI / 2 },
      { type: 'tree', x: -17, z: -8, kind: 'pine' }, { type: 'tree', x: -6, z: -9.5, kind: 'pine' }, { type: 'tree', x: -17.5, z: 6, kind: 'pine' },
      { type: 'hanok', x: -12, z: 9.5, ry: 0.2 }, { type: 'hanok', x: 12, z: 9.5, tile: true, ry: -0.2 },
      { type: 'tree', x: 17, z: 0 }, { type: 'lamp', x: 4, z: -1.5 },
    ],
    npcs: [
      { id: 'student', look: 'student', x: 4, z: 7, ry: Math.PI * 0.8 },
      { id: 'uibyeong', look: 'uibyeong', x: -8, z: -1.5, ry: Math.PI / 2 },
      { id: 'ahnchangho', look: 'ahnchangho', x: 8.5, z: -1, ry: 0 },
    ],
    signs: [{ id: 'signHague', title: '헤이그 특사', x: -4, z: 7 }, { id: 'signPress', title: '신문', x: -2, z: -4 }, { id: 'signAhn', title: '안중근', x: 13.5, z: 3 }],
    scatter: [{ kind: 'pine', count: 40, area: { x0: -60, x1: -18, z0: -30, z1: 20 }, seed: 261 }],
  },
  parts: [
    { ...script.parts.sort, arena: TWO, from: [0, 11], bins: xy(script.parts.sort.bins, [{ x: -13, z: -3 }, { x: 13, z: -3 }]) },
    { ...script.parts.hills, arena: PASS, camera: { pos: [-14, 15, 18], target: [0, 0, -2] }, path: [[0, -32], [0, 30]], zone: { x: 0, z: 0, r: 7 }, look: 'gendarme' },
    { ...script.parts.envoys, arena: HAGUE, from: [0, 12], route: xy(script.parts.envoys.route, [{ x: -6, z: 7 }, { x: 6, z: 3 }, { x: -6, z: -1 }, { x: 0, z: -7 }]) },
  ],
});
