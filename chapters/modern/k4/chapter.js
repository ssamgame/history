// 근대편 4장 「독립 협회와 대한 제국」: 한성의 독립문, 만민 공동회 연단, 경운궁.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { PIC } from '../pictures.js';

// 미니게임 무대(마을에서 떨어진 x 400): 1890년대 한성. 궁궐·러시아 공사관·신문사·환구단·종로가 흩어져 있다.
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const HANSEONG = { edge: { style: 'street', seed: 79 },
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -24, x1: 24, z0: -22, z1: 22 },
  roads: [{ x: 0, z: 0, w: 46, d: 5, color: 0x8a8070 }, { x: 0, z: 0, w: 5, d: 44, color: 0x8a8070 }],
  props: [
    { type: 'hanok', x: -15, z: -16, tile: true, scale: 1.6 },              // 경복궁
    { type: 'western', x: 15, z: 15, w: 6, d: 6, h: 9, color: 0xe8e4da },   // 러시아 공사관
    { type: 'western', x: -15, z: 15, w: 6, d: 4, h: 4, color: 0x8a5a4a },  // 독립신문사
    { type: 'pavilion', x: 15, z: -16 },                                    // 환구단
    { type: 'stage', x: 15, z: 4 }, { type: 'crowd', x: 9, z: 2, n: 6, cols: 3, looks: ['citizen', 'gentleman', 'student'], face: Math.PI / 2 }, // 종로
  ],
};

export default makeKitChapter({
  id: 'k4', mood: 'morning', script,
  player: { robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['citizen', 'seojaepil', 'gojong'],
  spot: [0, 3],
  layout: {
    // 1896~1897년 한성 서대문 밖 큰길: 돌 독립문, 만민 공동회 연단과 모인 사람들, 길가의 가게와 노점, 뒤로 높은 바위산, 멀리 도성의 지붕들
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -9, z1: 11 }, start: [0, 9], hill: 1.6,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.6, Math.PI * 1.1] },
    roads: [{ x: 0, z: 2, w: 36, d: 5, color: 0x9a8a72 }, { x: 0, z: 5, w: 4, d: 12 }],
    props: [
      { type: 'arch', x: 0, z: -7, label: '독립문' },
      { type: 'stage', x: -10, z: -4 },
      { type: 'crowd', x: -10, z: -0.5, n: 10, cols: 5, looks: ['commoner', 'gentleman', 'student', 'woman', 'scholar'], face: Math.PI },
      { type: 'hanok', x: 11, z: -6, tile: true, scale: 1.5 },
      { type: 'flagpole', x: 7.5, z: -0.6, scale: 1.3 }, { type: 'flagpole', x: -14, z: -6 }, // 태극기가 집에 가리지 않게 길가 앞쪽에
      { type: 'western', x: 13, z: 9.5, w: 6, d: 4, h: 5, ry: Math.PI },
      { type: 'shop', x: -13, z: 9.5, w: 5, ry: Math.PI, sign: '책방', seed: 2 }, { type: 'shop', x: -19, z: 6, w: 4.5, ry: Math.PI / 2, thatch: true, seed: 5 },
      { type: 'stall', x: 17.5, z: 4, ry: -Math.PI / 2, color: 0xd8cdb0, seed: 3 },
      { type: 'tree', x: -16.5, z: -8.5, kind: 'pine' }, { type: 'tree', x: 16.5, z: -9, kind: 'pine' },
    ],
    npcs: [
      { id: 'citizen', look: 'commoner', x: 5, z: 7, ry: Math.PI * 0.8 },
      { id: 'seojaepil', look: 'seojaepil', x: -3.5, z: -3, ry: 0 },
      { id: 'gojong', look: 'gojong', x: 11, z: -1.5, ry: -Math.PI / 4 },
    ],
    signs: [{ id: 'signGate', title: '독립문', x: 3.5, z: -3 }, { id: 'signForum', title: '만민 공동회', x: -6.5, z: 6.5 }, { id: 'signAltar', title: '환구단', x: 14, z: 3 }],
    scatter: [{ kind: 'pine', count: 30, area: { x0: -60, x1: 60, z0: -40, z1: -14 }, seed: 241 }],
  },
  parts: [
    { ...script.parts.paper, arena: HANSEONG, from: [0, 19],
      route: xy(script.parts.paper.route, [{ x: -11, z: 10 }, { x: 4, z: 4 }, { x: -6, z: -10 }, { x: 6, z: -4 }, { x: 0, z: 14 }]) },
    { ...script.parts.flow, pages: script.parts.flow.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
  ],
});
