// 일제 강점기편 4장 「봉오동 전투와 청산리 대첩」: 만주 산골짜기의 독립군 진영.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const pines = pts => pts.map(([x, z]) => ({ type: 'tree', x, z, color: 0x34503a }));
const FOREST = { edge: { style: 'forest', seed: 836 }, center: [{ type: 'firepit', x: -15, z: 5 }, { type: 'rifles', x: 16, z: 10 }, { type: 'woodpile', x: 17, z: -6, ry: 0.5 }, { type: 'cargo', x: -15, z: -15, kind: 'crate', n: 3 }, { type: 'rifles', x: 7, z: 18 }],
  origin: [400, 0], ground: 'grass', groundColor: 0x4f6a3e, bounds: { x0: -24, x1: 24, z0: -26, z1: 26 },
  props: [
    { type: 'tent', x: -12, z: 13, color: 0x6b6a4a }, { type: 'tent', x: 13, z: 3, color: 0x6b6a4a }, { type: 'tent', x: -12, z: -9, color: 0x6b6a4a },
    ...pines([[-20, 20], [20, 20], [-4, 22], [6, 12], [-20, 2], [20, -10], [-3, -14], [10, -20], [-18, -20], [3, 2]]),
  ],
};
const VALLEY = { edge: { style: 'forest', seed: 543 }, center: [{ type: 'rifles', x: -16, z: -12 }, { type: 'cargo', x: 16, z: -8, kind: 'crate', n: 3 }, { type: 'firepit', x: 16, z: 14 }], // 청산리 골짜기: 양쪽 산비탈의 숲, 가운데 골짜기 길
  origin: [400, 0], ground: 'grass', groundColor: 0x55703f, bounds: { x0: -30, x1: 30, z0: -30, z1: 30 },
  roads: [{ x: 0, z: 0, w: 6, d: 70, color: 0x7a6a50 }],
  props: [...pines([[-9, -20], [-11, -10], [-9, 0], [-12, 8], [-9, 16], [9, -20], [11, -10], [9, 0], [12, 8], [9, 16], [-16, -4], [16, 4], [-16, 12], [16, -14]])],
};
const GENERALS = { edge: { style: 'camp', seed: 652 }, center: [{ type: 'firepit', x: -12, z: -3 }, { type: 'rifles', x: 12, z: -6 }, { type: 'cargo', x: 13, z: 8, kind: 'crate', n: 3 }, { type: 'rifles', x: 7, z: 7 }, { type: 'cargo', x: -9, z: 0, kind: 'crate', n: 3 }],
  origin: [400, 0], ground: 'grass', groundColor: 0x5f7a4c, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'tent', x: 0, z: -11, color: 0x6b6a4a },
  ],
};

export default makeKitChapter({
  id: 'i4', mood: 'forest', script,
  player: { robe: 0x5a6448, hat: 'cap', gear: 'rifle', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'hongbeomdo', 'kimjwajin'],
  spot: [0, 3],
  layout: {
    // 1920년 만주의 깊은 산골짜기: 가파른 산이 둘러싼 좁은 골짜기, 솔숲 속 천막 진영과 장작, 골짜기를 따라 난 흙길
    ground: 'grass', groundColor: 0x4f6b3e, bounds: { x0: -15, x1: 15, z0: -9, z1: 11 }, start: [0, 9], hill: 2.4,
    roads: [{ x: 0, z: 0, w: 4, d: 24, color: 0x7a6a50 }],
    props: [
      { type: 'tent', x: -10, z: 6, color: 0x8a8a6a }, { type: 'tent', x: -12, z: 0, color: 0x8a8a6a }, { type: 'tent', x: 11, z: 7, color: 0x8a8a6a }, { type: 'tent', x: 12.5, z: 1, color: 0x7a7a5a },
      { type: 'flagpole', x: 4, z: 5 },
      { type: 'crowd', x: 8, z: -4, n: 6, cols: 3, looks: ['independenceArmy'], face: -Math.PI / 2 },
      { type: 'desk', x: -5, z: -6 }, { type: 'woodpile', x: -14.5, z: 4 }, { type: 'woodpile', x: 15, z: -3 },
      { type: 'tree', x: -15.5, z: -8, kind: 'pine' }, { type: 'tree', x: -9, z: -10.5, kind: 'pine' }, { type: 'tree', x: 9, z: -10.5, kind: 'pine' },
      { type: 'tree', x: 15.5, z: -9, kind: 'pine' }, { type: 'tree', x: -16.5, z: 9, kind: 'pine' }, { type: 'tree', x: 16.5, z: 10, kind: 'pine' },
    ],
    npcs: [
      { id: 'soldier', look: 'independenceArmy', x: -5, z: 6, ry: Math.PI * 0.8 },
      { id: 'hongbeomdo', look: 'hongbeomdo', x: 5, z: -1, ry: -Math.PI / 2 },
      { id: 'kimjwajin', look: 'kimjwajin', x: -6, z: -2.5, ry: Math.PI / 2 },
    ],
    signs: [{ id: 'signHeroes', title: '여성 독립운동가', x: 7, z: 8 }, { id: 'signUiyeol', title: '의열단', x: -12, z: -6 }],
    scatter: [
      { kind: 'pine', count: 70, area: { x0: -70, x1: 70, z0: -60, z1: 30 }, avoid: [{ x: 0, z: 1, r: 18 }], seed: 431, scale: [1.2, 1.9] },
      { kind: 'rock', count: 18, area: { x0: -15, x1: 15, z0: -9, z1: 11 }, avoid: [{ x: 0, z: 1, r: 4 }, { x: -10, z: 4, r: 4 }, { x: 10, z: 3, r: 5 }, { x: -5, z: 6, r: 2 }, { x: 5, z: -1, r: 2 }, { x: -6, z: -3, r: 2 }, { x: 7, z: 8, r: 2 }, { x: -12, z: -6, r: 2 }], seed: 432 },
    ],
  },
  parts: [
    { ...script.parts.gather, arena: FOREST, from: [0, 23], followers: { looks: ['independenceArmy'], per: 2 },
      route: xy(script.parts.gather.route, [{ x: -8, z: 12 }, { x: 9, z: 2 }, { x: -8, z: -9 }, { x: 0, z: -21 }]),
      pickups: xy(script.parts.gather.pickups, [{ x: 16, z: 14 }, { x: -17, z: -6 }, { x: 14, z: -16 }]) },
    { ...script.parts.ambush, arena: VALLEY, camera: { pos: [-16, 16, 18], target: [0, 0, -2] },
      path: [[0, -32], [0, 30]], zone: { x: 0, z: 0, r: 7 }, look: 'gendarme' },
    { ...script.parts.leaders, arena: GENERALS, from: [0, 12], route: xy(script.parts.leaders.route, [{ x: -6, z: 5 }, { x: 6, z: 0 }, { x: 0, z: -6 }]) },
  ],
});
