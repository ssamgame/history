// 일제 강점기편 5장 「민족 문화를 지킨 사람들」: 학교와 학회, 서점이 있는 도시 거리.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const STREETS = { // 경성 골목: 서점, 학교 담장, 조선어 학회. 경찰이 순찰한다
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -20, x1: 20, z0: -22, z1: 20 },
  roads: [{ x: 0, z: 0, w: 5, d: 42, color: 0x8a8070 }],
  props: [
    { type: 'western', x: -12, z: 10, w: 6, d: 4, h: 4, color: 0x8a5a4a }, { type: 'hanok', x: 13, z: 12, tile: true },
    { type: 'western', x: 12, z: -2, w: 7, d: 4, h: 5, color: 0xb8a070 }, { type: 'hanok', x: -13, z: -6 },
    { type: 'western', x: 0, z: -21, w: 8, d: 4, h: 4, color: 0x8a5a4a },
  ],
};
const PEOPLE = { // 세 사람(모임)이 기다리는 마당
  origin: [400, 0], ground: 'stone', groundColor: 0xa09a8c, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'crowd', x: -12, z: -8.5, n: 1, looks: ['scholarModern'] },
    { type: 'western', x: 0, z: -12, w: 7, d: 4, h: 4, color: 0x8a5a4a }, { type: 'crowd', x: 0, z: -8.5, n: 3, cols: 3, looks: ['gentleman', 'scholarModern', 'gentleman'] },
    { type: 'crowd', x: 12, z: -8.5, n: 1, looks: ['ahnchangho'] },
  ],
};
const TOWN3 = { // 상점·학교·학회
  origin: [400, 0], ground: 'stone', groundColor: 0xa8a49a, bounds: { x0: -22, x1: 22, z0: -14, z1: 14 },
  props: [
    { type: 'hanok', x: -14, z: -12, tile: true }, { type: 'rice', x: -10, z: -8, n: 6 },
    { type: 'western', x: 0, z: -13, w: 9, d: 5, h: 5, color: 0xb8a070 }, { type: 'crowd', x: 0, z: -9, n: 4, cols: 4, looks: ['student', 'schoolgirl'], face: 0 },
    { type: 'western', x: 14, z: -12, w: 7, d: 5, h: 4, color: 0x8a5a4a }, { type: 'desk', x: 11, z: -8 },
  ],
};

export default makeKitChapter({
  id: 'i5', mood: 'haze', script,
  player: { robe: 0xe9e4da, hat: 'braid', trim: 0x2c3a5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['student', 'linguist', 'historian'],
  spot: [0, 3],
  layout: {
    // 1920~40년대 경성 골목: 뾰족탑 학교와 벽돌 건물, 길가의 2층 상점과 가로등, 조선어 학회가 있던 기와집, 멀리 벽돌 건물과 굴뚝
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.2,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 2, w: 36, d: 5, color: 0x8a8070 }],
    props: [
      { type: 'western', x: -9, z: -9, w: 10, d: 5, h: 6, tower: true, color: 0x8a4a3a },
      { type: 'hanok', x: 9, z: -8.5, tile: true, scale: 1.3 },
      { type: 'desk', x: 5, z: -4.5 }, { type: 'desk', x: 9, z: -4.5 },
      { type: 'shop', x: -13, z: 8.5, w: 5, style: 'modern', ry: Math.PI, sign: '서점', awning: 0x2f6b5e, seed: 2 },
      { type: 'shop', x: 13, z: 8.5, w: 5, style: 'modern', ry: Math.PI, sign: '양화점', awning: 0x8a2f24, seed: 4 },
      { type: 'crowd', x: -10, z: -2, n: 6, cols: 3, looks: ['student', 'schoolgirl'], face: 0.4 },
      { type: 'lamp', x: -6, z: -0.8 }, { type: 'lamp', x: 6, z: 4.8 }, { type: 'tree', x: 17, z: -5, kind: 'poplar' }, { type: 'tree', x: -17, z: 4, kind: 'poplar' },
    ],
    npcs: [
      { id: 'student', look: 'student', x: -4, z: 6, ry: Math.PI * 0.8 },
      { id: 'linguist', look: 'scholarModern', x: 7, z: -1.5, ry: 0 },
      { id: 'historian', look: 'gentleman', x: 9, z: 6, ry: -Math.PI * 0.6 },
    ],
    signs: [{ id: 'signGoods', title: '물산 장려 운동', x: 2, z: 7.5 }, { id: 'signJune', title: '6·10 만세 운동', x: -2, z: -4 }],
  },
  parts: [
    { ...script.parts.pages, arena: STREETS, from: [0, 17],
      route: xy(script.parts.pages.route, [{ x: -6, z: 6 }, { x: 6, z: -4 }, { x: 0, z: -16 }]),
      pickups: xy(script.parts.pages.pickups, [{ x: -16, z: 16 }, { x: 16, z: 6 }, { x: -16, z: 0 }, { x: 16, z: -12 }, { x: -14, z: -16 }]),
      hazards: [{ x: -16, z: 8, to: [16, 8], kind: 'crowd', r: 1.6, speed: 0.4 }, { x: 16, z: -8, to: [-16, -8], kind: 'crowd', r: 1.6, speed: 0.45 }] },
    { ...script.parts.match, arena: PEOPLE, from: [0, 11], bins: xy(script.parts.match.bins, [{ x: -12, z: -5.5 }, { x: 0, z: -5 }, { x: 12, z: -5.5 }]) },
    { ...script.parts.kinds, arena: TOWN3, from: [0, 11], bins: xy(script.parts.kinds.bins, [{ x: -14, z: -4 }, { x: 0, z: -4.5 }, { x: 14, z: -4 }]) },
  ],
});
