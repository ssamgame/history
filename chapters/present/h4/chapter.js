// 현대편 4장 「1·4 후퇴와 정전 협정」: 눈 내리는 피란길, 짐을 진 사람들, 군용 트럭, 철조망.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { PIC } from '../../modern/pictures.js';
import { mapSpot } from '../../kit/play.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const M = mapSpot({ x: 0, z: 0, w: 48 });
const MAP = { origin: [400, 0], ground: 'earth', groundColor: 0xd8dade, bounds: { x0: -28, x1: 28, z0: -36, z1: 36 }, map: { x: 0, z: 0, w: 48 } };
const SNOWROAD = { edge: { style: 'snow', seed: 166 }, center: [{ type: 'cargo', x: -8, z: 16, kind: 'sack', n: 3 }, { type: 'cart', x: 9, z: 0, ry: 0.3, load: true }, { type: 'firepit', x: -10, z: -6 }, { type: 'cargo', x: -7, z: 22, kind: 'sack', n: 3 }, { type: 'cart', x: 7, z: 22, ry: 0.3, load: true }, { type: 'firepit', x: -9, z: 15 }, { type: 'cargo', x: 9, z: 15, kind: 'sack', n: 3 }], // 눈 덮인 피란길: 얼어붙은 강, 고갯길, 쉼터(천막)
  origin: [400, 0], ground: 'earth', groundColor: 0xe6e8ec, bounds: { x0: -22, x1: 22, z0: -30, z1: 30 },
  roads: [{ x: 0, z: 0, w: 5, d: 60, color: 0xb8b4aa }],
  props: [
    { type: 'water', x: 0, z: 8, w: 120, d: 6, color: 0xc8dce6 }, { type: 'shack', x: -12, z: 22 }, { type: 'shack', x: 12, z: 24 },
    { type: 'crowd', x: 10, z: -15, n: 6, cols: 2, looks: ['woman', 'grandma', 'commoner', 'citizen'], face: Math.PI },
    { type: 'tent', x: -6, z: -24, color: 0x8a8a7a }, { type: 'tent', x: 6, z: -24, color: 0x8a8a7a },
    { type: 'tree', x: -16, z: -12, color: 0x6a7a6a }, { type: 'tree', x: 17, z: -6, color: 0x6a7a6a }, { type: 'tree', x: 16, z: 14, color: 0x6a7a6a },
  ],
};

export default makeKitChapter({
  id: 'h4', mood: 'snow', script,
  player: { robe: 0x6a5a4a, hat: 'short', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'mother', 'unSoldier'],
  spot: [0, 3],
  layout: {
    // 1951년 겨울 피란길: 눈 덮인 산 사이로 난 길, 짐을 진 피란민 행렬, 잎이 다 진 겨울나무와 눈 쌓인 소나무, 길가 판잣집과 장작
    ground: 'earth', groundColor: 0xe6e8ec, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.8,
    roads: [{ x: 0, z: 1, w: 5, d: 30, color: 0xb8b4aa }],
    weather: 'snow',
    props: [
      { type: 'crowd', x: -9, z: -5, n: 10, cols: 2, looks: ['woman', 'grandma', 'commoner', 'peasant', 'citizen'], face: Math.PI * 0.95 },
      { type: 'crowd', x: 9, z: -5, n: 8, cols: 2, looks: ['commoner', 'woman', 'citizen', 'grandma'], face: Math.PI * 1.05 },
      { type: 'truck', x: -12, z: 6, ry: 0.4 },
      { type: 'fence', x: 0, z: -11, w: 30, solid: false },
      { type: 'shack', x: 13, z: 8 }, { type: 'woodpile', x: 15.5, z: 5.5 },
      { type: 'tree', x: 13, z: 0, kind: 'bare' }, { type: 'tree', x: -15, z: -2, kind: 'bare' }, { type: 'tree', x: 16, z: -8, kind: 'bare' }, { type: 'tree', x: -17, z: 9, kind: 'bare' },
      { type: 'tree', x: -16, z: -10, kind: 'pine', color: 0x4a6a4a },
    ],
    npcs: [
      { id: 'soldier', look: 'rokSoldier', x: -4, z: 6, ry: Math.PI * 0.8 },
      { id: 'mother', look: 'woman', x: 5, z: 4, ry: -Math.PI * 0.6 },
      { id: 'unSoldier', look: 'unSoldier', x: -3, z: -4, ry: 0 },
    ],
    signs: [{ id: 'signPanmun', title: '판문점', x: 4, z: -6 }, { id: 'signTruce', title: '정전', x: 9, z: 9 }],
    scatter: [{ kind: 'pine', count: 40, area: { x0: -70, x1: 70, z0: -50, z1: -14 }, seed: 541, color: 0x41604a }],
  },
  parts: [
    { ...script.parts.help, arena: SNOWROAD, from: [0, 27],
      route: xy(script.parts.help.route, [{ x: 0, z: 20 }, { x: 0, z: 8 }, { x: 2, z: -8 }, { x: 0, z: -18 }]),
      pickups: xy(script.parts.help.pickups, [{ x: -14, z: 16 }, { x: 13, z: 2 }, { x: -12, z: -14 }]),
      hazards: [{ x: -18, z: 14, to: [18, 14], kind: 'truck', r: 1.5, speed: 0.45 }, { x: 18, z: -2, to: [-18, -2], kind: 'truck', r: 1.5, speed: 0.5 }] },
    { ...script.parts.flow, arena: MAP, from: [0, 30], route: xy(script.parts.flow.route, [M(42, 14), M(28, 24), M(41, 52), M(50, 47), M(36, 44)]) },
    { ...script.parts.truce, pages: script.parts.truce.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
  ],
});
