// 현대편 3장 「6·25 전쟁」: 낙동강 가의 국군·유엔군 진영(천막, 트럭, 모래주머니).
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { mapSpot } from '../../kit/play.js';

// 미니게임 무대는 마을에서 떨어진 곳(x 400)에 따로 세운다.
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const M = mapSpot({ x: 0, z: 0, w: 48 });
const RIVER = {
  origin: [400, 0], ground: 'grass', groundColor: 0x6a7a4c, bounds: { x0: -30, x1: 30, z0: -30, z1: 30 },
  props: [
    { type: 'water', x: 0, z: -5, w: 140, d: 9, color: 0x5a7a7a },
    { type: 'rice', x: -9, z: 6, n: 9, solid: false }, { type: 'rice', x: 0, z: 6.5, n: 9, solid: false }, { type: 'rice', x: 9, z: 6, n: 9, solid: false },
    { type: 'tent', x: -15, z: 13, color: 0x6b6a4a }, { type: 'tent', x: 15, z: 13, color: 0x6b6a4a },
    { type: 'flagpole', x: -4, z: 10 }, { type: 'flagpole', x: 4, z: 10, color: 0x5b92e5 },
    { type: 'tree', x: -20, z: -18, color: 0x41604a }, { type: 'tree', x: 18, z: -20, color: 0x41604a }, { type: 'tree', x: 4, z: -24, color: 0x41604a },
  ],
};
const SEA = {
  origin: [400, 0], sea: true, bounds: { x0: -24, x1: 24, z0: -30, z1: 46 },
  props: [
    { type: 'island', x: 0, z: -42, r: 15, color: 0x8a8a6a }, // 인천 땅
    { type: 'pier', x: 0, z: -26, w: 10, d: 3 },
    { type: 'western', x: -6, z: -32, w: 6, d: 4, h: 4, color: 0x9a948a, solid: false }, { type: 'western', x: 6, z: -33, w: 5, d: 4, h: 5, color: 0xa86a52, solid: false },
    { type: 'island', x: 7, z: -6, r: 3.5 }, // 월미도
    { type: 'island', x: -18, z: -20, r: 4 }, { type: 'island', x: 19, z: 22, r: 3 },
    { type: 'steamship', x: -18, z: 58, ry: 0.4, solid: false }, { type: 'steamship', x: 16, z: 60, ry: -0.3, solid: false }, // 상륙정이 떠난 군함들
  ],
};
const MAP = { origin: [400, 0], ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -28, x1: 28, z0: -36, z1: 36 }, map: { x: 0, z: 0, w: 48 } };

export default makeKitChapter({
  id: 'h3', mood: 'overcast', script,
  player: { robe: 0x5a6448, hat: 'steel', gear: 'rifle', trim: 0x3a3f2c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'unSoldier', 'officer'],
  spot: [0, 3],
  layout: {
    // 1950년 여름 낙동강 가: 북쪽으로 흐르는 넓은 강과 강둑의 버드나무, 모래주머니를 쌓은 진지, 천막과 트럭, 둘레의 높은 산
    ground: 'grass', groundColor: 0x6a7a4c, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.7,
    roads: [{ x: 0, z: 2, w: 4, d: 20, color: 0x7a6a50 }],
    props: [
      { type: 'water', x: 0, z: -24, w: 260, d: 14, color: 0x5a7a7a },
      { type: 'rice', x: -8, z: -9, n: 9, solid: false }, { type: 'rice', x: 8, z: -9, n: 9, solid: false }, { type: 'rice', x: -14, z: -9, n: 6, solid: false }, { type: 'rice', x: 14, z: -9, n: 6, solid: false },
      { type: 'tent', x: -12, z: 7, color: 0x6b6a4a }, { type: 'tent', x: 12, z: 7, color: 0x6b6a4a }, { type: 'tent', x: -12, z: 1, color: 0x6b6a4a },
      { type: 'truck', x: 11, z: -1, ry: 0.3 },
      { type: 'flagpole', x: -3, z: -5 }, { type: 'flagpole', x: 3, z: -5, color: 0x5b92e5 },
      { type: 'crowd', x: -6, z: -6, n: 4, cols: 4, looks: ['rokSoldier', 'unSoldier'], face: Math.PI },
      { type: 'tree', x: -18, z: -11, kind: 'willow' }, { type: 'tree', x: 18, z: -11.5, kind: 'willow' }, { type: 'tree', x: 4, z: -13, kind: 'willow' },
      { type: 'woodpile', x: 15.5, z: 3 }, { type: 'tree', x: -18, z: 4, kind: 'pine' },
    ],
    npcs: [
      { id: 'soldier', look: 'rokSoldier', x: -4, z: 6, ry: Math.PI * 0.8 },
      { id: 'unSoldier', look: 'unSoldier', x: 6, z: 5, ry: -Math.PI * 0.6 },
      { id: 'officer', look: 'rokSoldier', x: 0, z: -2.5, ry: 0 },
    ],
    signs: [{ id: 'signUN', title: '유엔군', x: 6.5, z: -4.5 }, { id: 'signRiver', title: '낙동강 방어선', x: -9, z: -3 }],
    scatter: [{ kind: 'pine', count: 40, area: { x0: -70, x1: 70, z0: 14, z1: 50 }, seed: 531 }],
  },
  parts: [
    { ...script.parts.river, arena: RIVER, camera: { pos: [0, 14, 15], target: [0, 0, -7] },
      paths: [[[-9, -30], [-7, 9]], [[9, -30], [7, 9]], [[0, -30], [0, 9]]], zones: [{ x: 0, z: -5, r: 10 }], look: 'nkSoldier' },
    { ...script.parts.landing, arena: SEA, from: [0, 42], speed: 1.8,
      route: xy(script.parts.landing.route, [{ x: -6, z: 34 }, { x: -12, z: 18 }, { x: -2, z: -5 }, { x: 2, z: -22 }]),
      pickups: xy(script.parts.landing.pickups, [{ x: 10, z: -12 }, { x: -16, z: -8 }, { x: 12, z: 8 }]),
      hazards: [
        { x: 9, z: 14, r: 1.5 }, { x: -13, z: 3, r: 1.6 }, { x: -2, z: 26, kind: 'mine', r: 1 }, { x: -17, z: 26, kind: 'mine', r: 1 },
        { x: -6, z: 12, kind: 'mine', r: 1 }, { x: -17, z: 10, kind: 'mine', r: 1 }, { x: 4, z: 5, kind: 'mine', r: 1 },
        { x: -20, z: -14.5, to: [16, -14.5], kind: 'ship', r: 1.8, speed: 0.5 }, { x: 18, z: 2, to: [-20, 2], kind: 'ship', r: 1.8, speed: 0.4 },
      ] },
    { ...script.parts.flow, arena: MAP, from: [0, 30], route: xy(script.parts.flow.route, [M(58, 41), M(40, 50), M(72, 76), M(31, 54), M(49, 46)]) },
  ],
});
