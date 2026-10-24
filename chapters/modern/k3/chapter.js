// 근대편 3장 「동학 농민 운동과 갑오개혁」: 전라도 고부의 들판, 관아와 초가 마을들.
import { makeKitChapter } from '../../kit/chapter.js';
import script from './script.js';
import * as THREE from 'three';
import { buildArena } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { makePerson } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { PIC } from '../pictures.js';

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
// 들판 사이 마을 길: 마을마다 초가와 살림살이를 두어 어디가 어느 마을인지 한눈에 보이게
const paddy = (x, z, w, d) => [{ x, z, w, d, color: 0x7a9a4a, kind: 'grass' }, { x, z: z - d / 2 - 0.3, w, d: 0.5, color: 0x8f7556 }]; // 논과 둑
const FARMS = {
  origin: [400, 0], ground: 'grass', groundColor: 0x7a8a4c, bounds: { x0: -24, x1: 24, z0: -26, z1: 26 },
  roads: [{ x: 0, z: 0, w: 5, d: 52, color: 0x8f7556 }, ...paddy(14, 20, 12, 7), ...paddy(-16, 2, 12, 8), ...paddy(15, -12, 12, 7)],
  props: [
    // 윗마을: 초가 셋, 장독대, 짚더미
    { type: 'hanok', x: -9, z: 15, ry: Math.PI / 2 }, { type: 'hanok', x: -12, z: 21, ry: Math.PI / 2 }, { type: 'hanok', x: -15, z: 13, ry: Math.PI / 2 },
    { type: 'jars', x: -9, z: 19.5, ry: Math.PI / 2 }, { type: 'straw', x: -6, z: 21 },
    // 냇가 마을: 시냇물과 징검다리 같은 나무다리, 냇가의 초가
    { type: 'water', x: 0, z: 9, w: 120, d: 2.6, color: 0x5a8aa0 }, { type: 'pier', x: 0, z: 9, w: 5.4, d: 3.4, solid: false },
    { type: 'hanok', x: 9, z: 5, ry: -Math.PI / 2 }, { type: 'hanok', x: 12, z: 0, ry: -Math.PI / 2 }, { type: 'woodpile', x: 8, z: 1.5 },
    // 장터: 천막 가게, 쌀가마, 수레, 사람들
    { type: 'tent', x: -9, z: -3, color: 0xd8c9a0 }, { type: 'tent', x: -9, z: -9, color: 0xc8b890 }, { type: 'rice', x: -5.5, z: -6, n: 6 },
    { type: 'cart', x: 6, z: -6, ry: 0.4, load: true }, { type: 'jars', x: 7, z: -1.5 }, { type: 'crowd', x: -5, z: -12, n: 3, cols: 3, looks: ['commoner', 'woman', 'peasant'], face: Math.PI },
    // 고부 관아: 담장과 기와집
    { type: 'hanok', x: 0, z: -24, tile: true, scale: 1.4 }, { type: 'wall', x: -8, z: -20, w: 9 }, { type: 'wall', x: 8, z: -20, w: 9 }, { type: 'flagpole', x: -4, z: -18.5, color: 0xe8e0c0 },
  ],
};
// 고부 관아 장면: 관아(담장·기와집·곡식 창고) 앞으로 농민군이 몰려온다
const GOBU = {
  origin: [400, 260], ground: 'earth', groundColor: 0x8f7a5c, bounds: { x0: -18, x1: 18, z0: -14, z1: 16 },
  props: [
    { type: 'hanok', x: 0, z: -11, tile: true, scale: 1.6 }, { type: 'wall', x: -9, z: -6, w: 12 }, { type: 'wall', x: 9, z: -6, w: 12 },
    { type: 'hanok', x: 11, z: -12, tile: true, scale: 1.1 }, { type: 'flagpole', x: -3, z: -4.5, color: 0xe8e0c0 },
  ],
};
async function gobuScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.parts.gobu.lines;
  await ctx.fade(true);
  const arena = buildArena(world, GOBU), g = arena.group, O = arena.at(0, 0);
  const was = world.player.visible; world.player.visible = false;
  const crowd = new THREE.Group(); BUILD.crowd(crowd, { n: 12, cols: 4, looks: ['peasant', 'commoner', 'peasant', 'uibyeong'], face: Math.PI }); crowd.position.set(-2, 0, 16); g.add(crowd);
  const leader = makePerson(LOOKS.jeonbongjun); leader.rotation.y = Math.PI; crowd.add(leader); leader.position.set(0, 0, -2);
  const jo = makePerson(LOOKS.jobyeonggap); jo.position.set(0, 0, -4); g.add(jo);
  world.setFixedCamera([O.x + 14, 9, O.z + 16], [O.x, 1.5, O.z - 3]);
  await ctx.fade(false);
  const anim = (sec, fn) => new Promise(resolve => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(1, t + dt / sec); fn(t); if (t >= 1) { off(); resolve(); } }); });
  await dialogue.say(L[0]); dialogue.close();
  const march = anim(4, t => { crowd.position.z = 16 - t * 13; });
  await anim(0.8, () => {});
  await dialogue.say(L[1]); dialogue.close();
  // 조병갑은 담 옆으로 빠져나가 전주 쪽(동쪽)으로 달아난다
  jo.rotation.y = Math.PI / 2;
  await anim(2.4, t => { jo.position.set(t * 22, 0, -4 + t * 2); });
  jo.visible = false;
  await march;
  ctx.audio.play('correct');
  // 관아 앞에 곡식 가마를 내어 놓고 농민들에게 나눈다
  const rice = new THREE.Group(); BUILD.rice(rice, { n: 9 }); rice.position.set(4, 0, -1); g.add(rice);
  await anim(1.0, t => { rice.position.y = -1 + t; });
  await dialogue.say(L[2]); dialogue.close();
  await dialogue.say(L[3]); dialogue.close();
  ctx.testHooks.gobu = { fled: !jo.visible, rice: true };
  await ctx.fade(true);
  arena.dispose();
  world.player.visible = was;
  await ctx.fade(false);
}

export default makeKitChapter({
  id: 'k3', mood: 'morning', script,
  player: { robe: 0xddd2bb, hat: 'topknot', trim: 0x8a2f24, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['peasant', 'jeonbongjun', 'farmer'],
  spot: [0, 3],
  layout: {
    // 1894년 전라도 고부: 넓은 들판(논)이 둘러싼 낮은 마을, 북쪽 축대 위에 담을 두른 관아, 마을 어귀의 버드나무와 볏가리
    ground: 'grass', groundColor: 0x8a9a52, bounds: { x0: -17, x1: 17, z0: -10, z1: 12 }, start: [0, 10], hill: 0.55,
    roads: [{ x: 0, z: 1, w: 4, d: 24 }, { x: 0, z: -2, w: 36, d: 3.5 }],
    props: [
      { type: 'terrace', x: 0, z: -9.6, w: 9.4, d: 6, h: 0.8, steps: false }, { type: 'hanok', x: 0, z: -9.8, y: 0.8, tile: true, scale: 1.5 },
      { type: 'wall', x: -7, z: -6, w: 8 }, { type: 'wall', x: 7, z: -6, w: 8 },
      { type: 'hanok', x: -13, z: 7, ry: 0.3 }, { type: 'hanok', x: 13, z: 7, ry: -0.3 }, { type: 'hanok', x: -14, z: -6 }, { type: 'hanok', x: 14, z: -6 }, { type: 'hanok', x: -5, z: 11.5 },
      { type: 'flagpole', x: -3, z: 6, color: 0xf2efe6 }, { type: 'flagpole', x: 4, z: 6, color: 0xb8452f },
      { type: 'crowd', x: 9, z: 2, n: 6, cols: 3, looks: ['peasant', 'uibyeong', 'peasant'], face: -Math.PI / 2 },
      { type: 'rice', x: -10, z: 2, n: 6 }, { type: 'straw', x: -15.5, z: 2.5 }, { type: 'straw', x: 16, z: 1 },
      { type: 'tree', x: 10, z: 11, kind: 'willow' }, { type: 'tree', x: -16, z: 11, kind: 'willow' },
      { type: 'paddy', x: -21, z: 0, w: 7, d: 20, ripe: true }, { type: 'paddy', x: 21, z: 0, w: 7, d: 20, ripe: true },
      { type: 'paddy', x: -21, z: 14, w: 7, d: 6, ripe: true }, { type: 'paddy', x: 21, z: 14, w: 7, d: 6, ripe: true },
    ],
    npcs: [
      { id: 'peasant', look: 'peasant', x: -6, z: 7, ry: Math.PI * 0.8 },
      { id: 'jeonbongjun', look: 'jeonbongjun', x: 4, z: 1, ry: -Math.PI / 2 },
      { id: 'farmer', look: 'uibyeong', x: -8, z: -2.5, ry: Math.PI / 2 },
    ],
    signs: [{ id: 'signDonghak', title: '동학', x: 1, z: 7.5 }, { id: 'signGabo', title: '갑오개혁', x: -3, z: -4.5 }],
    scatter: [{ kind: 'grass', count: 90, area: { x0: -17, x1: 17, z0: -10, z1: 12 }, avoid: [{ x: 0, z: 1, r: 3 }, { x: 9, z: 4, r: 4 }], seed: 221, color: 0x9aaa5a }],
  },
  parts: [
    { ...script.parts.gather, arena: FARMS, from: [0, 23], followers: { looks: ['peasant', 'commoner'], per: 2 },
      route: xy(script.parts.gather.route, [{ x: -3, z: 15 }, { x: 3, z: 5 }, { x: -3, z: -5 }, { x: 0, z: -17 }]).map(r => ({ ...r, labelSize: 1.4 })),
      pickups: xy(script.parts.gather.pickups, [{ x: 16, z: 18 }, { x: -17, z: 4 }, { x: 15, z: -10 }]) },
    { ...script.parts.gobu, play: ctx => gobuScene(ctx) },
    script.parts.demands,
    { ...script.parts.flow, pages: script.parts.flow.pages.map(p => ({ ...p, figure: PIC[p.pic] })) },
  ],
});
