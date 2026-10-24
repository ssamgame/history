// 일제 강점기편 1장 「일제의 식민 통치」: 흐린 날의 항구 마을, 쌀가마를 실은 기차와 배, 큰 관청 건물.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { PIC } from '../../modern/pictures.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const GATES = { edge: { style: 'modern', seed: 111 }, // 시대의 문 세 개가 선 경성 거리
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -22, x1: 22, z0: -16, z1: 16 },
  props: [
    { type: 'arch', x: -13, z: -12 }, { type: 'arch', x: 0, z: -13 }, { type: 'arch', x: 13, z: -12 },
    { type: 'poles', x: -20, z: 8, n: 7, gap: 6.5 },
  ],
};
const ALLEY = { edge: { style: 'street', seed: 139 }, // 마을 골목: 헌병이 순찰하고, 쌀가마·짐 더미 뒤에 숨을 수 있다. 끝에 서당
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -18, x1: 18, z0: -24, z1: 20 },
  props: [
    { type: 'hanok', x: -13, z: 12, tile: true }, { type: 'hanok', x: 13, z: 2 }, { type: 'wall', x: -8, z: -2, w: 8 },
    { type: 'well', x: 9, z: -9 }, { type: 'hanok', x: 0, z: -22, tile: true, scale: 1.2 }, { type: 'tree', x: -14, z: -14 },
  ],
};

export default makeKitChapter({
  id: 'i1', mood: 'overcast', script,
  player: { robe: 0xddd2bb, hat: 'short', trim: 0x7a4e32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['farmer', 'teacher', 'porter'],
  spot: [0, 4],
  layout: {
    // 1910~30년대 항구 마을: 부두에 쌓인 쌀가마와 붉은 벽돌 쌀 창고, 선로와 기차, 멀리 공장 굴뚝, 길가 가게와 초가
    ground: 'earth', groundColor: 0x8a7d66, bounds: { x0: -16, x1: 16, z0: -7, z1: 11 }, start: [0, 9], hill: 1.1,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.35, Math.PI * 0.75] },
    roads: [{ x: 0, z: 2, w: 36, d: 4, color: 0x8a8070 }],
    props: [
      { type: 'water', x: 0, z: -40, w: 260, d: 50 },
      { type: 'steamship', x: -6, z: -20, ry: Math.PI / 2, solid: false },
      { type: 'pier', x: -8, z: -13, w: 10, d: 4, solid: false },
      { type: 'rice', x: -9, z: -6, n: 9 }, { type: 'rice', x: -4, z: -6, n: 9 }, { type: 'rice', x: -12.5, z: -11, n: 6 },
      { type: 'barracks', x: -15, z: -6.5, w: 7, color: 0x8a4a3a, roof: 0x5a5e62, ry: Math.PI / 2 },
      { type: 'train', x: 10, z: -4, ry: Math.PI / 2, cars: 2, track: 50, solid: false },
      { type: 'western', x: 13, z: 9.5, w: 8, d: 5, h: 6, dome: true, color: 0xb8b0a0, ry: Math.PI },
      { type: 'shop', x: 18.5, z: -1, w: 5, style: 'modern', ry: -Math.PI / 2, awning: 0x5a5e62, seed: 2 },
      { type: 'hanok', x: -13, z: 9, ry: 0.3 }, { type: 'hanok', x: -13, z: 3, ry: 0.6 },
      { type: 'tree', x: 17, z: 4, kind: 'poplar' }, { type: 'tree', x: -17.5, z: 6, kind: 'poplar' }, { type: 'tree', x: 17.5, z: -6, kind: 'poplar' },
    ],
    npcs: [
      { id: 'farmer', look: 'peasant', x: -8, z: 6, ry: Math.PI * 0.8 },
      { id: 'teacher', look: 'scholarModern', x: 3, z: 6.5, ry: Math.PI },
      { id: 'porter', look: 'commoner', x: -6, z: -2.5, ry: 0, work: 'carry' },
    ],
    signs: [{ id: 'signGov', title: '조선 총독부', x: 8, z: 5 }, { id: 'signRail', title: '철도', x: 4, z: -1 }, { id: 'signForce', title: '강제 동원', x: -12, z: -1 }],
  },
  parts: [
    { ...script.parts.eras, arena: GATES, from: [0, 12], bins: xy(script.parts.eras.bins, [{ x: -13, z: -6 }, { x: 0, z: -7 }, { x: 13, z: -6 }]) },
    { ...script.parts.book, arena: ALLEY, from: [0, 17],
      waypoints: xy(script.parts.book.waypoints, [{ x: -8, z: 9 }, { x: -9, z: 0 }, { x: 6, z: -8 }, { x: 0, z: -17 }]),
      hides: [{ x: -6, z: 13, r: 1.8 }, { x: -12, z: 4, r: 1.8 }, { x: 0, z: -4, r: 1.8 }, { x: 4, z: -13, r: 1.8 }],
      guards: [{ path: [[4, 14], [4, 2]], speed: 0.6, range: 5.5 }, { path: [[-14, -6], [10, -6]], speed: 0.5, range: 5.5 }, { path: [[-6, -14], [10, -14]], speed: 0.55, range: 5 }] },
    { ...script.parts.rail, pages: script.parts.rail.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
  ],
});
