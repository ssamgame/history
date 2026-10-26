// 근대편 1장 「흥선 대원군과 강화도 조약」: 강화도 바닷가 마을과 관아, 바다 위의 배.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const PALACE = { edge: { style: 'tile', seed: 462 }, center: [{ type: 'woodpile', x: -16, z: 1 }, { type: 'cart', x: -5, z: -11, ry: 0.5, load: true }, { type: 'cargo', x: 16, z: 4, kind: 'crate', n: 4 }], // 고쳐 짓는 경복궁 앞(왼쪽)과 다른 때의 일(오른쪽)
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -20, x1: 20, z0: -14, z1: 14 },
  props: [
    { type: 'hanok', x: -11, z: -12, tile: true, scale: 1.4 }, { type: 'rice', x: -15, z: -6, n: 6 }, { type: 'woodpile', x: -6, z: -8 }, { type: 'tree', x: -18, z: 4, kind: 'pine' },
    { type: 'western', x: 11, z: -12, w: 7, d: 4, h: 4, color: 0x8c8577 }, { type: 'steamship', x: 16, z: -22, ry: Math.PI / 2, solid: false, old: true },
    { type: 'water', x: 20, z: -30, w: 60, d: 20 },
  ],
};
const COAST = { edge: { style: 'thatch', seed: 515 }, center: [{ type: 'cannon', x: -8, z: -8, ry: Math.PI }, { type: 'cannon', x: -2, z: -9, ry: Math.PI }, { type: 'cargo', x: -15, z: -6, kind: 'barrel', n: 3 }, { type: 'firepit', x: 15, z: 4 }, { type: 'cannon', x: -7, z: 16, ry: Math.PI }, { type: 'firepit', x: 9, z: 9 }], // 강화도 해안: 갯벌 길, 망루, 포대, 연무당. 먼바다에 군함
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, bounds: { x0: -20, x1: 20, z0: -14, z1: 24 },
  props: [
    { type: 'water', x: 0, z: -40, w: 160, d: 40 }, { type: 'steamship', x: -10, z: -34, ry: Math.PI / 2, solid: false, old: true },
    { type: 'pavilion', x: -14, z: 7 }, { type: 'wall', x: 9, z: -6, w: 8, color: 0x8c8577 }, { type: 'rice', x: 13, z: -3, n: 3 },
    { type: 'hanok', x: 10, z: 18, tile: true }, { type: 'tree', x: -16, z: 18, kind: 'pine' }, { type: 'tree', x: 17, z: 8, kind: 'pine' },
    { type: 'boat', x: 8, z: -22, ry: 0.4 }, { type: 'boat', x: 13, z: -24, ry: -0.2, color: 0x6b4a32 },
  ],
};
const YEONMU = { edge: { style: 'tile', seed: 47 }, center: [{ type: 'papers', x: 0, z: -8.5, kind: 'book', n: 2 }, { type: 'cargo', x: -14, z: -4, kind: 'crate', n: 3 }, { type: 'cargo', x: 14, z: -4, kind: 'barrel', n: 3 }], // 강화도 연무당: 조약을 맺은 곳
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'pavilion', x: 0, z: -11 }, { type: 'desk', x: 0, z: -6 },
    { type: 'crowd', x: -4, z: -5, n: 2, cols: 2, looks: ['joseonOfficial'], face: Math.PI / 2 }, { type: 'crowd', x: 4, z: -5, n: 2, cols: 2, looks: ['gentleman'], face: -Math.PI / 2 },
    { type: 'water', x: 0, z: -40, w: 160, d: 30 }, { type: 'steamship', x: -16, z: -24, ry: Math.PI / 2, solid: false, old: true },
  ],
};

export default makeKitChapter({
  id: 'k1', mood: 'sea', script,
  player: { robe: 0xddd2bb, hat: 'topknot', trim: 0x7a4e32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['elder', 'scholar', 'official'],
  spot: [0, 2],
  layout: {
    // 강화도 바닷가 마을(1870년대): 북쪽은 바다와 갯벌 포구, 가운데 돌 축대 위의 관아, 양옆 초가와 소나무, 뒤로 높은 언덕
    ground: 'grass', groundColor: 0x6a8a52, bounds: { x0: -15, x1: 15, z0: -9, z1: 11 }, start: [0, 8], hill: 1.5,
    roads: [{ x: 0, z: 2, w: 4, d: 22 }, { x: 0, z: -3, w: 30, d: 4 }, { x: -12, z: -11, w: 3, d: 6, color: 0x8a7a5a }],
    props: [
      { type: 'water', x: 0, z: -45, w: 260, d: 60 },
      { type: 'steamship', x: 14, z: -32, ry: 0.3, solid: false, old: true },
      { type: 'pier', x: -12, z: -16, w: 3, d: 6, solid: false }, { type: 'boat', x: -15, z: -18, ry: 0.2 }, { type: 'boat', x: -9, z: -19, ry: -0.3, color: 0x6b4a32 },
      { type: 'wall', x: -9, z: -11, w: 12, h: 2.4, solid: false }, { type: 'wall', x: 9, z: -11, w: 12, h: 2.4, solid: false },
      { type: 'terrace', x: -3, z: -7.6, w: 8.6, d: 5.6, h: 0.9 }, { type: 'hanok', x: -3, z: -8, y: 0.9, tile: true, scale: 1.3 },
      { type: 'flagpole', x: 3, z: -6, color: 0xd9a441 },
      { type: 'hanok', x: -11, z: 4 }, { type: 'hanok', x: 11, z: 3, ry: -0.2 }, { type: 'hanok', x: -11, z: -3, ry: 0.15 }, { type: 'hanok', x: 12, z: 9, ry: -0.4 },
      { type: 'straw', x: 14.5, z: -2 }, { type: 'cart', x: 8, z: -6.8, ry: 1.2 },
      { type: 'tree', x: 8.5, z: 10.5, kind: 'pine' }, { type: 'tree', x: -14.5, z: 10, kind: 'pine' }, { type: 'tree', x: 14, z: -8, kind: 'pine' },
    ],
    npcs: [
      { id: 'elder', look: 'commoner', x: -6, z: 5, ry: Math.PI * 0.8 },
      { id: 'scholar', look: 'scholar', x: 7, z: 1, ry: -Math.PI * 0.6 },
      { id: 'official', look: 'joseonOfficial', x: 0, z: -3.5, ry: 0 },
    ],
    signs: [{ id: 'signTreaty', title: '강화도 조약', x: -6, z: -1 }, { id: 'signWest', title: '서양과의 조약', x: 6, z: 7 }],
    scatter: [{ kind: 'grass', count: 60, area: { x0: -15, x1: 15, z0: -8, z1: 12 }, avoid: [{ x: 0, z: 2, r: 3 }], seed: 201 }],
  },
  parts: [
    { ...script.parts.regent, arena: PALACE, from: [0, 11], bins: xy(script.parts.regent.bins, [{ x: -11, z: -4 }, { x: 11, z: -4 }]) },
    { ...script.parts.coast, arena: COAST, from: [0, 21], route: xy(script.parts.coast.route, [{ x: -4, z: 12 }, { x: -12, z: 0 }, { x: 6, z: -2 }, { x: 6, z: 14 }]) },
    { ...script.parts.treaty, arena: YEONMU, from: [0, 11], items: xy(script.parts.treaty.items, [{ x: -10, z: 2 }, { x: -3, z: 7 }, { x: 10, z: 2 }, { x: 4, z: 7 }]) },
  ],
});
