// 일제 강점기편 3장 「대한민국 임시 정부」: 중국 상하이의 벽돌 건물 거리와 임시 정부 청사.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const ALLEY = { // 상하이 골목: 담과 가게 사이로 몰래
  origin: [400, 0], ground: 'stone', groundColor: 0x8c8577, bounds: { x0: -18, x1: 18, z0: -22, z1: 20 },
  props: [
    { type: 'wall', x: -9, z: 8, w: 8 }, { type: 'wall', x: 9, z: -4, w: 8 }, { type: 'rice', x: -10, z: -8, n: 6 },
    { type: 'western', x: -15, z: -18, w: 6, d: 5, h: 5, color: 0x8a4a3a }, { type: 'western', x: 15, z: 16, w: 6, d: 5, h: 5, color: 0x9a948a },
  ],
};
const OFFICE = { // 청사 안의 세 부서 책상
  origin: [400, 0], ground: 'stone', groundColor: 0x8a6a4a, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'desk', x: -12, z: -9 }, { type: 'desk', x: 0, z: -10 }, { type: 'desk', x: 12, z: -9 },
    { type: 'flagpole', x: 0, z: -13 },
  ],
};

export default makeKitChapter({
  id: 'i3', mood: 'overcast', script,
  player: { robe: 0x3a3a44, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['messenger', 'ahnchangho', 'kimgu'],
  spot: [0, 3],
  layout: {
    // 1919년 이후 중국 상하이: 회색 벽돌 2층 석고문 골목집이 줄지어 선 거리(임시 정부 청사도 이런 집), 길가 가게와 가로수, 멀리 큰 도시의 건물들
    ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 0.5, mountains: false,
    skyline: { style: 'brick', color: 0x5a5650 },
    roads: [{ x: 0, z: 2, w: 40, d: 6, color: 0x7a746a }],
    props: [
      { type: 'lanehouse', x: 0, z: -9, n: 3 },
      { type: 'flagpole', x: 6, z: -5 },
      { type: 'lanehouse', x: -14, z: -9, n: 2 }, { type: 'lanehouse', x: 14, z: -9, n: 2 },
      { type: 'shop', x: -12, z: 11.5, w: 6, style: 'modern', ry: Math.PI, awning: 0x8a2f24, seed: 2 },
      { type: 'shop', x: 12, z: 11.5, w: 6, style: 'modern', ry: Math.PI, awning: 0x2f4a6a, seed: 5 },
      { type: 'desk', x: -4, z: -5 }, { type: 'tree', x: 17, z: 5, color: 0x5a7a40 }, { type: 'tree', x: -17, z: 5, color: 0x5a7a40 },
      { type: 'lamp', x: -9, z: -1.2 }, { type: 'lamp', x: 9, z: -1.2 }, { type: 'cart', x: 16, z: 4, ry: 1.5 },
    ],
    npcs: [
      { id: 'messenger', look: 'student', x: -6, z: 6, ry: Math.PI * 0.8 },
      { id: 'ahnchangho', look: 'ahnchangho', x: 7, z: 5, ry: -Math.PI * 0.6 },
      { id: 'kimgu', look: 'kimgu', x: 1, z: -4.5, ry: 0 },
    ],
    signs: [{ id: 'signOffice', title: '임시 정부 청사', x: -5, z: -1 }, { id: 'signBond', title: '독립 공채', x: 13, z: 3 }],
  },
  parts: [
    script.parts.charter,
    { ...script.parts.letters, arena: ALLEY, from: [0, 17],
      waypoints: xy(script.parts.letters.waypoints, [{ x: -9, z: 5.5 }, { x: -12, z: -5 }, { x: 10, z: -2 }, { x: 12, z: -14 }, { x: 4, z: -19 }]),
      hides: [{ x: -5, z: 12, r: 1.8 }, { x: -6, z: -1, r: 1.8 }, { x: 5, z: -7, r: 1.8 }, { x: 14, z: -8, r: 1.6 }],
      guards: [{ path: [[-2, 12], [-2, -2]], speed: 0.7, range: 5 }, { path: [[-14, -10], [6, -10]], speed: 0.55, range: 5 }, { path: [[16, 4], [16, -18]], speed: 0.5, range: 5 }] },
    { ...script.parts.roles, arena: OFFICE, from: [0, 11],
      bins: xy(script.parts.roles.bins, [{ x: -12, z: -5 }, { x: 0, z: -6 }, { x: 12, z: -5 }]) },
  ],
});
