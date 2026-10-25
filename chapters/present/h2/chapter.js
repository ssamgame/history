// 현대편 2장 「대한민국 정부 수립」: 둥근 지붕의 큰 청사 앞 광장, 투표소, 줄 선 사람들.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import { PIC } from '../../modern/pictures.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const POLL = { edge: { style: 'city', seed: 291 }, center: [{ type: 'ballot', x: 5, z: -12 }, { type: 'noticeBoard', x: 12, z: 8, ry: -0.5 }, { type: 'papers', x: -12, z: -4, kind: 'news', n: 2 }, { type: 'noticeBoard', x: 7, z: 8, ry: -0.5 }], // 투표소: 줄 서는 곳, 명부 책상, 가림막 기표소, 투표함
  origin: [400, 0], ground: 'stone', groundColor: 0xa8a49a, bounds: { x0: -16, x1: 16, z0: -16, z1: 16 },
  props: [
    { type: 'western', x: 0, z: -18, w: 20, d: 4, h: 6, color: 0xb8b0a0, solid: false }, { type: 'flagpole', x: -12, z: 12 },
    { type: 'crowd', x: -10, z: 6, n: 6, cols: 2, looks: ['citizen', 'woman', 'grandma', 'gentleman'], face: Math.PI },
    { type: 'desk', x: -6, z: -2 }, { type: 'wall', x: 8, z: -6, w: 4, h: 2.2 }, { type: 'desk', x: -1, z: -12 },
  ],
};
const YARD = { edge: { style: 'city', seed: 909 }, center: [{ type: 'papers', x: -14, z: 6, kind: 'news', n: 3 }, { type: 'papers', x: 14, z: 6, kind: 'book', n: 2 }, { type: 'noticeBoard', x: 0, z: -12 }, { type: 'papers', x: -7, z: 7, kind: 'news', n: 3 }, { type: 'papers', x: 7, z: 7, kind: 'book', n: 2 }],
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -18, x1: 18, z0: -16, z1: 16 },
  props: [
    { type: 'western', x: 0, z: -15, w: 14, d: 5, h: 6, dome: true, color: 0xc8c0b0 },
    { type: 'crowd', x: -9, z: -9.2, n: 1, looks: ['syngmanrhee'], face: 0 }, { type: 'crowd', x: 9, z: -9.2, n: 1, looks: ['kimgu'], face: 0 },
    { type: 'flagpole', x: -4, z: -11 }, { type: 'flagpole', x: 4, z: -11 },
  ],
};

export default makeKitChapter({
  id: 'h2', mood: 'morning', script,
  player: { robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['citizen', 'syngmanrhee', 'kimgu'],
  spot: [0, 3],
  layout: {
    // 1945~1948년 서울: 둥근 지붕의 큰 관청 앞 돌 광장, 투표를 알리는 책상과 사람들, 양옆 시멘트 건물과 가로수, 멀리 도시
    ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.4,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.6, Math.PI * 1.4] },
    props: [
      { type: 'western', x: 0, z: -12, w: 14, d: 6, h: 7, dome: true, color: 0xc8c0b0 },
      { type: 'flagpole', x: -4, z: -6.5 }, { type: 'flagpole', x: 4, z: -6.5 },
      { type: 'desk', x: -11, z: -2 }, { type: 'desk', x: -8, z: -2 },
      { type: 'crowd', x: -10, z: 2, n: 8, cols: 2, looks: ['citizen', 'woman', 'grandma', 'gentleman'], face: Math.PI },
      { type: 'concrete', x: -14, z: -11, floors: 2, w: 6, color: 0xbab2a2, shop: false }, { type: 'concrete', x: 14, z: -11, floors: 3, w: 6, color: 0xc8c2b4, awning: 0x5a5e62 },
      { type: 'hanok', x: 18, z: 7, tile: true, ry: -Math.PI / 2 }, { type: 'shop', x: -19, z: 7, w: 5, style: 'modern', ry: Math.PI / 2, awning: 0x2f6b5e, seed: 2 },
      { type: 'tree', x: 13, z: 1, kind: 'poplar' }, { type: 'tree', x: -16, z: -4, kind: 'poplar' },
    ],
    npcs: [
      { id: 'citizen', look: 'citizen', x: -2, z: 6, ry: Math.PI * 0.8 },
      { id: 'syngmanrhee', look: 'syngmanrhee', x: 7, z: 4, ry: -Math.PI / 2 },
      { id: 'kimgu', look: 'kimgu', x: 3, z: -3, ry: 0 },
    ],
    signs: [{ id: 'signElection', title: '5·10 총선거', x: -5, z: -2 }, { id: 'signJeju', title: '제주 4·3 사건', x: 12, z: 6 }, { id: 'signConstitution', title: '제헌 헌법', x: 8, z: -3 }],
  },
  parts: [
    { ...script.parts.flow, pages: script.parts.flow.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
    { ...script.parts.views, arena: YARD, from: [0, 12],
      bins: xy(script.parts.views.bins, [{ x: -9, z: -6.5 }, { x: 9, z: -6.5 }]) },
    { ...script.parts.vote, arena: POLL, from: [0, 13], route: xy(script.parts.vote.route, [{ x: -5, z: 6 }, { x: -6, z: 1 }, { x: 8, z: -3 }, { x: -1, z: -9 }]) },
  ],
});
