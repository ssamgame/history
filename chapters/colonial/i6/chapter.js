// 일제 강점기편 6장 「한인 애국단과 한국광복군」: 충칭의 광복군 훈련장, 태극기와 천막.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const FIELD = { edge: { style: 'camp', seed: 216 }, center: [{ type: 'sandbags', x: -12, z: 6, w: 4 }, { type: 'rifles', x: 12, z: 2 }, { type: 'archeryTarget', x: 14, z: -12 }, { type: 'sandbags', x: -7, z: 17, w: 4 }, { type: 'rifles', x: 7, z: 17 }, { type: 'archeryTarget', x: -9, z: 10 }, { type: 'sandbags', x: 9, z: 10, w: 4 }], // 훈련장: 통나무가 굴러다니는 길과 깃발 언덕
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, bounds: { x0: -20, x1: 20, z0: -26, z1: 26 },
  props: [
    { type: 'tent', x: -14, z: 20, color: 0x6b6a4a }, { type: 'tent', x: 14, z: 20, color: 0x6b6a4a },
    { type: 'flagpole', x: -3, z: -24 }, { type: 'flagpole', x: 3, z: -24 }, { type: 'wall', x: -16, z: -15, w: 1.2, h: 1.6, color: 0xd8c08a }, // 사격장 과녁
    { type: 'crowd', x: 13, z: 10, n: 6, cols: 3, looks: ['gwangbokgun'], face: -Math.PI / 2 },
  ],
};
const FLAGS = { edge: { style: 'camp', seed: 787 }, center: [{ type: 'papers', x: -15, z: 4, kind: 'book', n: 2 }, { type: 'rifles', x: 15, z: 4 }, { type: 'cargo', x: 0, z: -10, kind: 'crate', n: 3 }, { type: 'rifles', x: 7, z: 6 }],
  origin: [400, 0], ground: 'stone', groundColor: 0xa09888, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'flagpole', x: -11, z: -9 }, { type: 'crowd', x: -14, z: -8, n: 2, cols: 2, looks: ['gentleman', 'kimgu'] },
    { type: 'flagpole', x: 11, z: -9 }, { type: 'tent', x: 14, z: -10, color: 0x6b6a4a }, { type: 'crowd', x: 8, z: -8, n: 3, cols: 3, looks: ['gwangbokgun'] },
  ],
};

export default makeKitChapter({
  id: 'i6', mood: 'haze', script,
  player: { robe: 0x6b6a4a, hat: 'cap', gear: 'rifle', trim: 0xa8392b, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'kimgu', 'officer'],
  spot: [0, 3],
  layout: {
    // 1940년대 중국 충칭의 훈련장: 언덕이 많은 땅, 흙 연병장에 줄지어 선 대원들과 태극기, 나무 막사와 천막, 장작
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.9,
    props: [
      { type: 'flagpole', x: 0, z: -7 }, { type: 'flagpole', x: -5, z: -7 }, { type: 'flagpole', x: 5, z: -7 },
      { type: 'crowd', x: -8, z: -3, n: 10, cols: 5, looks: ['gwangbokgun'], face: 0 },
      { type: 'crowd', x: 8, z: -3, n: 10, cols: 5, looks: ['gwangbokgun'], face: 0 },
      { type: 'tent', x: -13, z: 8, color: 0x8a8a6a }, { type: 'tent', x: 13, z: 8, color: 0x8a8a6a }, { type: 'tent', x: -13, z: 2, color: 0x8a8a6a },
      { type: 'barracks', x: 12, z: -11, w: 9 }, { type: 'barracks', x: -12, z: -11, w: 9, color: 0x7a6a52 },
      { type: 'woodpile', x: 16, z: 2 }, { type: 'tree', x: -17.5, z: -4 }, { type: 'tree', x: 17.5, z: -6, color: 0x5a7a40 },
    ],
    npcs: [
      { id: 'soldier', look: 'gwangbokgun', x: -5, z: 6, ry: Math.PI * 0.8 },
      { id: 'kimgu', look: 'kimgu', x: 0, z: -3, ry: 0 },
      { id: 'officer', look: 'gwangbokgun', x: 7, z: 5, ry: -Math.PI * 0.6 },
    ],
    signs: [{ id: 'signFlag', title: '광복군 태극기', x: 3.5, z: 8.5 }, { id: 'signPacific', title: '태평양 전쟁', x: -10, z: 9 }],
  },
  parts: [
    { ...script.parts.run, arena: FIELD, from: [0, 22],
      route: xy(script.parts.run.route, [{ x: 0, z: 17 }, { x: 0, z: 4 }, { x: -11, z: -15 }, { x: 0, z: -20 }]),
      pickups: xy(script.parts.run.pickups, [{ x: 17, z: 13 }, { x: -15, z: 3 }, { x: 13, z: -14 }]),
      hazards: [{ x: -14, z: 8, to: [14, 8], kind: 'log', r: 1.2, speed: 0.8 }, { x: 14, z: 2, to: [-14, 2], kind: 'log', r: 1.2, speed: 0.7 }, { x: -14, z: -9, to: [14, -9], kind: 'log', r: 1.2, speed: 0.9 }] },
    { ...script.parts.sort, arena: FLAGS, from: [0, 11], bins: xy(script.parts.sort.bins, [{ x: -11, z: -5 }, { x: 11, z: -5 }]) },
  ],
});
