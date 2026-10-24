// 근대편 5장 「근대 문물과 달라진 생활」: 전차가 다니는 한성 거리, 전봇대, 성당과 학교.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { PIC } from '../pictures.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const LAMPS = { // 가로등·선로·전신주·전화가 놓인 거리
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -20, x1: 20, z0: -14, z1: 14 },
  props: [
    { type: 'flagpole', x: -15, z: -10, color: 0xf2e6b0 }, { type: 'tram', x: -5, z: -9, ry: Math.PI / 2, track: 10 },
    { type: 'poles', x: 3, z: -12, n: 2, gap: 4 }, { type: 'desk', x: 15, z: -10 },
  ],
};
const LINE = { // 서대문(남쪽)에서 청량리(북쪽)로 뻗은 선로
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -8, x1: 8, z0: -40, z1: 40 },
  roads: [{ x: 0, z: 0, w: 1.6, d: 80, color: 0x6b6862, y: 0.05 }],
  props: [
    { type: 'western', x: -9, z: 25, w: 5, d: 5, h: 4, color: 0x8a4a3a }, { type: 'hanok', x: 9, z: 12, tile: true }, { type: 'hanok', x: -9, z: -2 },
    { type: 'gate', x: 0, z: -20, label: '興仁之門', wing: 8 }, { type: 'western', x: 10, z: -30, w: 5, d: 5, h: 5, color: 0x9a948a },
    { type: 'poles', x: 6.6, z: -38, n: 13, gap: 6.4, ry: -Math.PI / 2 },
  ],
};

export default makeKitChapter({
  id: 'k5', mood: 'noon', script,
  player: { robe: 0x22262e, hat: 'cap', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['gentleman', 'woman', 'student'],
  spot: [0, 5],
  layout: {
    // 1900년 무렵 한성 큰길: 가운데 전찻길과 전봇대, 길가의 가게와 가로등, 뒤로 뾰족탑 서양식 건물, 멀리 도성의 기와지붕
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.6, Math.PI * 1.4] },
    roads: [{ x: 0, z: 0, w: 60, d: 6, color: 0x9a8a72 }, { x: 0, z: 6, w: 4, d: 10 }],
    props: [
      { type: 'tram', x: 0, z: 0, ry: Math.PI / 2, track: 60, solid: false, name: 'tram' },
      { type: 'poles', x: -15, z: -3.6, n: 6, gap: 6 },
      { type: 'western', x: -9, z: -9, w: 8, d: 6, h: 6, tower: true, color: 0x8a4a3a },
      { type: 'western', x: 10, z: -9, w: 9, d: 5, h: 5, color: 0x9a6a4a },
      { type: 'shop', x: -13, z: 8.5, w: 5, ry: Math.PI, sign: '양화점', seed: 1, awning: 0x2f6b5e }, { type: 'shop', x: 13, z: 8.5, w: 5, ry: Math.PI, sign: '잡화점', seed: 4, awning: 0x8a2f24 },
      { type: 'stall', x: -17.5, z: 3.5, ry: Math.PI / 2, seed: 5 },
      { type: 'lamp', x: -8, z: 3.4 }, { type: 'lamp', x: 8, z: 3.4 }, { type: 'lamp', x: 0, z: -3.4 },
      { type: 'desk', x: 6, z: -5 }, { type: 'tree', x: 17, z: 11 },
    ],
    npcs: [
      { id: 'gentleman', look: 'gentleman', x: -5, z: 5, ry: Math.PI * 0.8 },
      { id: 'woman', look: 'woman', x: 6, z: 4, ry: -Math.PI * 0.7 },
      { id: 'student', look: 'student', x: 8, z: -2.5, ry: 0 },
    ],
    signs: [{ id: 'signTram', title: '전차', x: -1.5, z: 4 }, { id: 'signChurch', title: '서양식 건물', x: -9, z: -4.5 }, { id: 'signLife', title: '달라진 생활', x: 12.5, z: 4 }],
  },
  parts: [
    { ...script.parts.match, arena: LAMPS, from: [0, 11], bins: xy(script.parts.match.bins, [{ x: -14, z: -4 }, { x: -5, z: -3 }, { x: 4, z: -5 }, { x: 14, z: -4 }]) },
    { ...script.parts.tram, arena: LINE, from: [0, 37],
      route: xy(script.parts.tram.route, [{ x: 0, z: 30 }, { x: 0, z: 8 }, { x: 0, z: -14 }, { x: 0, z: -35 }]),
      hazards: [{ x: -7, z: 19, to: [7, 19], kind: 'car', r: 1.4, speed: 0.6 }, { x: 7, z: -3, to: [-7, -3], kind: 'car', r: 1.4, speed: 0.7 }, { x: -7, z: -25, to: [7, -25], kind: 'car', r: 1.4, speed: 0.65 }] },
    { ...script.parts.goods, pages: script.parts.goods.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
  ],
  // 전차가 선로 위를 천천히 오간다
  decorate(world, built) {
    const car = built.named.tram && built.named.tram.userData.car;
    if (car) world.onUpdate((dt, t) => { car.position.z = Math.sin(t * 0.15) * 22; });
    return {};
  },
});
