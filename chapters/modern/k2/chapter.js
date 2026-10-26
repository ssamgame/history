// 근대편 2장 「갑신정변」: 해 질 녘 한성 거리와 우정총국.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400): 겨울밤의 우정총국 거리와 개혁안을 붙인 마당
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const NIGHT = { edge: { style: 'street', seed: 709 }, center: [{ type: 'papers', x: -7, z: -4, kind: 'news', n: 3 }, { type: 'cart', x: 8, z: 5, ry: -0.4 }, { type: 'jars', x: -8, z: 6 }, { type: 'cart', x: 7, z: 10, ry: -0.4 }, { type: 'jars', x: -9, z: 3 }, { type: 'papers', x: 9, z: 3, kind: 'news', n: 3 }],
  origin: [400, 0], ground: 'stone', groundColor: 0x847e74, bounds: { x0: -20, x1: 20, z0: -18, z1: 18 },
  roads: [{ x: 0, z: 0, w: 6, d: 36, color: 0x6e6a62 }],
  props: [
    { type: 'hanok', x: -9, z: 10, ry: Math.PI / 2, tile: true }, { type: 'hanok', x: 10, z: -2, ry: -Math.PI / 2, tile: true, scale: 1.3 },
    { type: 'hanok', x: -12, z: -12, tile: true, scale: 1.4 }, { type: 'tent', x: 12, z: -12, color: 0x6b6a4a }, { type: 'crowd', x: 15, z: -8, n: 3, cols: 3, looks: ['gendarme'], face: -Math.PI / 2 },
  ],
};
const YARD = { edge: { style: 'tile', seed: 134 }, center: [{ type: 'noticeBoard', x: -15, z: 7, ry: 0.4 }, { type: 'noticeBoard', x: 15, z: 7, ry: -0.4 }, { type: 'papers', x: 4, z: -9, kind: 'book', n: 2 }],
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a70, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [{ type: 'hanok', x: 0, z: -12, tile: true, scale: 1.5 }, { type: 'wall', x: -14, z: -2, w: 2 }, { type: 'wall', x: 14, z: -2, w: 2 }],
};

export default makeKitChapter({
  id: 'k2', mood: 'winterDusk', script,
  player: { robe: 0xc9d4d8, hat: 'topknot', trim: 0x3a4a5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['merchant', 'clerk', 'kimokgyun'],
  spot: [0, 1],
  layout: {
    // 1884년 한성 종로 근처: 돌을 깐 큰길 양쪽에 기와·초가 가게와 노점, 가운데 우정총국, 멀리 도성 안 기와지붕들과 북쪽 산
    ground: 'earth', groundColor: 0x9e8b6c, bounds: { x0: -15, x1: 15, z0: -7, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 2, w: 34, d: 5, kind: 'stone', color: 0xa59c8a }, { x: 0, z: 6, w: 4, d: 12 }],
    props: [
      { type: 'hanok', x: 0, z: -6, tile: true, scale: 1.6, name: 'post' },
      { type: 'flagpole', x: 4, z: -4.5, color: 0xd9a441 },
      { type: 'wall', x: -6.5, z: -8.4, w: 5, h: 2.2, solid: false }, { type: 'wall', x: 6.5, z: -8.4, w: 5, h: 2.2, solid: false },
      { type: 'shop', x: -11.5, z: -4.6, w: 5, sign: '포목점', awning: 0x8a2f24 }, { type: 'shop', x: 11.5, z: -4.6, w: 5, sign: '지물포', awning: 0x6b5a3a, seed: 3 },
      { type: 'shop', x: -12, z: 8.5, w: 5, ry: Math.PI, thatch: true, seed: 2 }, { type: 'shop', x: 12, z: 8.5, w: 5, ry: Math.PI, thatch: true, seed: 5 },
      { type: 'stall', x: -11, z: 4.6, ry: Math.PI, color: 0xd8cdb0 }, { type: 'stall', x: 13.5, z: 4.6, ry: Math.PI, color: 0x8a6a48, seed: 4 },
      { type: 'rice', x: -8.5, z: 7.5, n: 6 }, { type: 'tree', x: 15.5, z: 11.5 }, { type: 'lamp', x: -2.5, z: -0.6 },
    ],
    npcs: [
      { id: 'merchant', look: 'commoner', x: -7, z: 4.5, ry: Math.PI * 0.8 },
      { id: 'clerk', look: 'joseonOfficial', x: 3.5, z: -1.5, ry: 0 },
      { id: 'kimokgyun', look: 'kimokgyun', x: 9, z: 3, ry: -Math.PI / 2 },
    ],
    signs: [{ id: 'signPost', title: '우정총국', x: -4, z: -2 }, { id: 'signCoup', title: '갑신정변', x: 5, z: 7.5 }],
    scatter: [{ kind: 'pine', count: 30, area: { x0: -60, x1: 60, z0: -40, z1: -14 }, seed: 211 }],
  },
  parts: [
    { ...script.parts.flow, arena: NIGHT, from: [0, 15], route: xy(script.parts.flow.route, [{ x: -3.5, z: 9 }, { x: 3.5, z: 3 }, { x: -3.5, z: -3 }, { x: 3.5, z: -9 }, { x: 0, z: -15 }]) }, // 길을 따라 차례대로(좌우로 엇갈려 이름표가 겹쳐 쌓이지 않게)
    { ...script.parts.reform, arena: YARD, from: [0, 11], items: xy(script.parts.reform.items, [{ x: -10, z: -3 }, { x: -5, z: 4 }, { x: 0, z: -4 }, { x: 5, z: 4 }, { x: 10, z: -3 }]) },
  ],
});
