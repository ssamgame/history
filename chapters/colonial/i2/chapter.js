// 일제 강점기편 2장 「3·1 운동」: 탑골 공원 팔각정, 태극기를 든 사람들, 태화관.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { PIC } from '../../modern/pictures.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const JONGNO = { edge: { style: 'modern', seed: 352 }, center: [{ type: 'papers', x: -14, z: 4, kind: 'news', n: 3 }, { type: 'flagpole', x: 14, z: 16 }, { type: 'cargo', x: -14, z: -10, kind: 'cloth', n: 5 }, { type: 'papers', x: -7, z: 16, kind: 'news', n: 3 }, { type: 'flagpole', x: 7, z: 16 }], // 탑골 공원 문에서 종로 거리, 시장, 큰길로
  origin: [400, 0], ground: 'stone', groundColor: 0xa09a8c, bounds: { x0: -24, x1: 24, z0: -28, z1: 28 },
  roads: [{ x: 0, z: 0, w: 7, d: 56, color: 0x8a8070 }, { x: 0, z: -14, w: 40, d: 6, color: 0x8a8070 }],
  props: [
    { type: 'pavilion', x: 0, z: 25, solid: false },
    { type: 'hanok', x: -9, z: 12, ry: Math.PI / 2, tile: true }, { type: 'hanok', x: 9, z: 6, ry: -Math.PI / 2, tile: true },
    { type: 'rice', x: -8, z: -4, n: 6 }, { type: 'tent', x: 8, z: -6 },
    { type: 'western', x: -14, z: -22, w: 8, d: 5, h: 5, color: 0x8a4a3a }, { type: 'western', x: 14, z: -22, w: 8, d: 5, h: 6, color: 0x9a948a },
  ],
};

export default makeKitChapter({
  id: 'i2', mood: 'earlySpring', script,
  player: { robe: 0x22262e, hat: 'cap', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['student', 'leader', 'yugwansun'],
  spot: [0, 4],
  layout: {
    // 1919년 3월 1일 서울 탑골 공원: 돌 마당의 팔각정과 모여든 사람들, 공원 담 너머 종로의 가게들, 멀리 도성의 지붕과 북쪽 산
    ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    props: [
      { type: 'pavilion', x: 0, z: -7 },
      { type: 'crowd', x: -10, z: -2, n: 12, cols: 4, flags: 0.6, looks: ['student', 'commoner', 'schoolgirl', 'woman', 'gentleman'], face: 0.3 },
      { type: 'crowd', x: 9, z: -2, n: 12, cols: 4, flags: 0.6, looks: ['commoner', 'student', 'peasant', 'schoolgirl'], face: -0.3 },
      { type: 'hanok', x: 13, z: 8, tile: true, scale: 1.3 },
      { type: 'wall', x: -9, z: 11.5, w: 14 }, { type: 'wall', x: -17, z: 2, w: 16, ry: Math.PI / 2 }, { type: 'wall', x: 17, z: -4, w: 10, ry: Math.PI / 2 },
      { type: 'shop', x: -20, z: -5, w: 5, style: 'modern', ry: Math.PI / 2, sign: '양복점', awning: 0x2f6b5e, seed: 1 }, { type: 'shop', x: 20, z: 3, w: 5, ry: -Math.PI / 2, sign: '포목점', seed: 3 },
      { type: 'tree', x: -13, z: 7 }, { type: 'tree', x: 17, z: 11.5, color: 0x5a7a40 }, { type: 'tree', x: -8, z: -8.5, color: 0x5a7a40 }, { type: 'tree', x: 9, z: -8.5 },
      { type: 'flagpole', x: 4, z: -3 }, { type: 'lamp', x: -15, z: 9.5 },
    ],
    npcs: [
      { id: 'student', look: 'student', x: -4, z: 6, ry: Math.PI * 0.8 },
      { id: 'leader', look: 'gentleman', x: 9.5, z: 4, ry: -Math.PI / 2 },
      { id: 'yugwansun', look: 'yugwansun', x: -3, z: -2, ry: 0 },
    ],
    signs: [{ id: 'signDeclare', title: '독립 선언', x: 4, z: 6.5 }, { id: 'signYu', title: '유관순', x: -13, z: 2.5 }, { id: 'signJeam', title: '제암리', x: 14, z: 1 }],
  },
  parts: [
    { ...script.parts.flags, arena: JONGNO, from: [0, 21],
      route: xy(script.parts.flags.route, [{ x: -4, z: 4 }, { x: 4, z: -10 }]),
      pickups: xy(script.parts.flags.pickups, [{ x: -16, z: 18 }, { x: 15, z: 14 }, { x: -15, z: 0 }, { x: 16, z: -2 }]) },
    { ...script.parts.march, arena: JONGNO, from: [0, 21], followers: { looks: ['student', 'schoolgirl', 'citizen', 'woman', 'peasant', 'yugwansun'], per: 2, flags: true },
      route: xy(script.parts.march.route, [{ x: 0, z: 18 }, { x: 2, z: 6 }, { x: -2, z: -6 }, { x: 0, z: -18 }]),
      hazards: [{ x: -14, z: 0, to: [14, 0], kind: 'crowd', r: 1.6, speed: 0.4 }, { x: 14, z: -12, to: [-14, -12], kind: 'crowd', r: 1.6, speed: 0.45 }] },
    { ...script.parts.flow, pages: script.parts.flow.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
  ],
});
