// 현대편 5장 「전쟁 뒤의 삶」: 부산 피란민 마을의 판잣집, 시장, 항구.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { PIC } from '../../modern/pictures.js';

// 미니게임 무대(마을에서 떨어진 x 400): 판잣집이 늘어선 비탈 마을, 장터, 운동장 교실, 밀면 가게
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const SHANTY = {
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -24, x1: 24, z0: -20, z1: 22 },
  roads: [{ x: 0, z: 2, w: 44, d: 5, color: 0x7a6a56 }],
  props: [
    { type: 'shack', x: -18, z: -12 }, { type: 'shack', x: -13, z: -14 }, { type: 'shack', x: -20, z: 12 }, { type: 'shack', x: -14, z: 15 },
    { type: 'shack', x: 14, z: 15 }, { type: 'shack', x: 19, z: 12 },
    { type: 'rice', x: 15, z: -12, n: 6 }, { type: 'crowd', x: 11, z: -12, n: 2, cols: 2, looks: ['woman', 'grandma'], face: Math.PI / 2 },
    { type: 'desk', x: -3, z: -14 }, { type: 'desk', x: 2, z: -14 }, { type: 'crowd', x: -2, z: -11, n: 6, cols: 3, looks: ['student', 'schoolgirl'], face: Math.PI },
    { type: 'tent', x: 8, z: 15, color: 0xd8d0bc }, { type: 'well', x: 2.6, z: 9 },
  ],
};

export default makeKitChapter({
  id: 'h5', mood: 'morning', script,
  player: { robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['mother', 'grandma', 'student'],
  spot: [0, 3],
  layout: {
    // 1950년대 부산 피란민 마을: 바다를 내려다보는 비탈에 축대를 쌓고 층층이 지은 판잣집, 아래 골목길과 우물가, 항구의 배와 부두
    ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -16, x1: 16, z0: -7, z1: 11 }, start: [0, 9], hill: 2.0,
    roads: [{ x: 0, z: 2, w: 34, d: 4, color: 0x7a6a56 }],
    props: [
      { type: 'water', x: 0, z: -40, w: 260, d: 50 },
      { type: 'steamship', x: 10, z: -22, ry: Math.PI / 2, solid: false }, { type: 'pier', x: -6, z: -15, w: 8, d: 3, solid: false }, { type: 'boat', x: -12, z: -17, ry: 0.3 },
      { type: 'shack', x: -13, z: 8 }, { type: 'shack', x: 13, z: 8 },
      { type: 'terrace', x: -11, z: -5.5, w: 9, d: 4, h: 1.2, stepX: 3 }, { type: 'shack', x: -13, z: -5.6, y: 1.2 }, { type: 'shack', x: -9, z: -5.8, y: 1.2, ry: 0.1 },
      { type: 'terrace', x: 12, z: -5.5, w: 8, d: 4, h: 1.2, stepX: -2.5 }, { type: 'shack', x: 12.5, z: -5.6, y: 1.2 },
      { type: 'terrace', x: -17.5, z: 1, w: 4, d: 9, h: 2.2, steps: false }, { type: 'shack', x: -17.5, z: 1, y: 2.2, ry: Math.PI / 2 },
      { type: 'terrace', x: 17.5, z: 2, w: 4, d: 9, h: 2.2, steps: false }, { type: 'shack', x: 17.5, z: 2, y: 2.2, ry: -Math.PI / 2 },
      { type: 'rice', x: 4, z: -5, n: 6 }, { type: 'desk', x: 8, z: -2 }, { type: 'well', x: -3.5, z: 9.5 },
      { type: 'crowd', x: -3, z: -5, n: 6, cols: 3, looks: ['student', 'schoolgirl'], face: Math.PI },
    ],
    npcs: [
      { id: 'mother', look: 'woman', x: -4, z: 5.5, ry: Math.PI * 0.8 },
      { id: 'grandma', look: 'grandma', x: 7, z: 5, ry: -Math.PI * 0.6 },
      { id: 'student', look: 'student', x: 1, z: -2, ry: 0 },
    ],
    signs: [{ id: 'signFamily', title: '이산가족 찾기', x: 12.5, z: 2.5 }, { id: 'signTask', title: '평화 통일', x: -11, z: 2.5 }],
  },
  parts: [
    { ...script.parts.help, arena: SHANTY, from: [0, 19],
      route: xy(script.parts.help.route, [{ x: 0, z: 9 }, { x: -14, z: 11 }, { x: 0, z: 9 }, { x: 14, z: 10 }, { x: 0, z: 9 }, { x: -2, z: -7 }]) },
    { ...script.parts.life, pages: script.parts.life.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
  ],
});
