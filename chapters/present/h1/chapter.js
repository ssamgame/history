// 현대편 1장 「8·15 광복」: 태극기를 든 사람들로 가득한 1945년 여름의 서울 거리.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const VILLAGE = {
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -24, x1: 24, z0: -26, z1: 28 },
  roads: [{ x: 0, z: 2, w: 6, d: 52, color: 0x8a8070 }, { x: 0, z: -18, w: 30, d: 8, color: 0x8a8070 }],
  props: [
    { type: 'hanok', x: -9, z: 17, ry: Math.PI / 2 }, { type: 'hanok', x: 9, z: 9, ry: -Math.PI / 2, tile: true },
    { type: 'hanok', x: -9, z: 1, ry: Math.PI / 2, tile: true }, { type: 'hanok', x: 9, z: -7, ry: -Math.PI / 2 },
    { type: 'desk', x: -6, z: -1 }, { type: 'rice', x: 6.5, z: -9, n: 6 },
    { type: 'flagpole', x: -5, z: -21 }, { type: 'flagpole', x: 5, z: -21 },
    { type: 'tree', x: -16, z: -6 }, { type: 'tree', x: 16, z: 18 },
  ],
};
const SQUARE = {
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -20, x1: 20, z0: -18, z1: 18 },
  props: [
    { type: 'western', x: -10, z: -14, w: 9, d: 5, h: 5, color: 0xb8a070 }, { type: 'flagpole', x: -10, z: -10.5 },
    { type: 'crowd', x: -13, z: -9, n: 4, cols: 4, looks: ['student', 'schoolgirl'], face: 0 },
    { type: 'western', x: 10, z: -14, w: 9, d: 5, h: 7, dome: true, color: 0x8c8a86 },
  ],
};

export default makeKitChapter({
  id: 'h1', mood: 'summer', script,
  player: { robe: 0xe9e4da, hat: 'short', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['citizen', 'grandma', 'kimgu'],
  spot: [0, 3],
  layout: {
    // 1945년 8월 15일 서울 큰길: 태극기를 든 사람들, 벽돌·시멘트 건물과 2층 상점, 가로수와 가로등, 멀리 도시의 건물들과 북쪽 산
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 1, w: 40, d: 6, color: 0x8a8070 }],
    props: [
      { type: 'crowd', x: -9, z: -4, n: 15, cols: 5, flags: 0.7, looks: ['citizen', 'woman', 'student', 'gentleman', 'schoolgirl', 'grandma'], face: 0.2 },
      { type: 'crowd', x: 9, z: -4, n: 15, cols: 5, flags: 0.7, looks: ['commoner', 'student', 'woman', 'citizen', 'peasant'], face: -0.2 },
      { type: 'western', x: 0, z: -11, w: 10, d: 5, h: 6, color: 0x9a7a5a },
      { type: 'concrete', x: -13, z: -11, floors: 2, w: 7, color: 0xc8c0b0, awning: 0x5a5e62 }, { type: 'shop', x: 13, z: -10.5, w: 6, style: 'modern', awning: 0x2f6b5e, seed: 3 },
      { type: 'shop', x: -19, z: 6, w: 5, style: 'modern', ry: Math.PI / 2, awning: 0x8a2f24, seed: 1 }, { type: 'hanok', x: 18, z: 8, tile: true, ry: -Math.PI / 2 },
      { type: 'flagpole', x: 4, z: 6 }, { type: 'flagpole', x: -4, z: -6 },
      { type: 'tree', x: -16.5, z: -1.5, kind: 'poplar' }, { type: 'tree', x: 16.5, z: -1.5, kind: 'poplar' }, { type: 'lamp', x: -7, z: 4.2 }, { type: 'lamp', x: 12, z: 4.2 },
    ],
    npcs: [
      { id: 'citizen', look: 'citizen', x: -3, z: 6, ry: Math.PI * 0.8 },
      { id: 'grandma', look: 'grandma', x: 8, z: 5.5, ry: -Math.PI * 0.6 },
      { id: 'kimgu', look: 'kimgu', x: 1, z: -4, ry: 0 },
    ],
    signs: [{ id: 'signChildren', title: '어린이날 선서', x: -10, z: 3.5 }, { id: 'signPaper', title: '다시 나온 신문', x: 13, z: 3.5 }],
  },
  parts: [
    { ...script.parts.news, arena: VILLAGE, from: [0, 25], followers: { looks: ['citizen', 'woman', 'student', 'grandma', 'schoolgirl'], per: 2, flags: true },
      route: xy(script.parts.news.route, [{ x: -3, z: 17 }, { x: 3, z: 9 }, { x: -3, z: 1 }, { x: 3, z: -7 }, { x: 0, z: -18 }]),
      pickups: xy(script.parts.news.pickups, [{ x: 15, z: 14 }, { x: -16, z: 6 }, { x: 14, z: -2 }, { x: -14, z: -12 }]) },
    { ...script.parts.change, arena: SQUARE, from: [0, 12],
      bins: xy(script.parts.change.bins, [{ x: -10, z: -6 }, { x: 10, z: -6 }]) },
  ],
});
