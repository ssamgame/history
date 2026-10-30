// 6장 이야기 장면(D-58): ① 1271년 5월 진도 용장성이 무너지고 김통정이 남은 군사를 배에 태워 제주로 건너간다.
// ② 제주 항파두리 흙성에서 끝까지 맞서지만, 1273년 고려와 몽골의 연합군 배들이 몰려와 진압된다(피는 넣지 않는다).
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { burning } from '../kit/fire.js';
import { storyScene, person, wait, march, face, troop, blk } from '../kit/story.js';
import script from './script.js';

const shore = (extra = {}) => ({ origin: [400, 0], ground: 'earth', groundColor: 0x7d6e52, hill: 1, bounds: { x0: -18, x1: 18, z0: -12, z1: 6 },
  props: [{ type: 'water', x: 0, z: 30, w: 160, d: 48, solid: false }], edge: { style: 'forest', sides: false }, ...extra });
export const YONGJANG = shore();
export const HANGPADURI = shore({ groundColor: 0x6e5a40 });

const boatWith = (g, x, z, looks, scale = 1) => { const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b); BLD.boat(b, { len: 4.6 }); b.scale.setScalar(scale);
  const riders = looks.map((lk, k) => { const p = person(b, lk, 0, (k - (looks.length - 1) / 2) * 1.1, 0); p.position.y = 0.3; p.userData.noWalk = true; return p; }); return { b, riders }; };

export function yongjangScene(ctx) {
  const L = script.jindo.talk;
  return storyScene(ctx, { key: 'yongjang', arena: YONGJANG, mood: 'overcast', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 산기슭 돌성(용장성)과 성 위 삼별초 깃발, 군데군데 불길
    for (const x of [-9, 0, 9]) { const w = new THREE.Group(); w.position.set(x, 0, -8); BLD.wall(w, { w: 9, h: 3.8, color: 0x8c8577 }); g.add(w); }
    for (const x of [-11, -3, 5, 12]) { const f = new THREE.Group(); f.position.set(x, 3.8, -8); BLD.banner(f, { color: 0x3a2f2a, h: 2.6 }); g.add(f); }
    const fires = [[-7, -7.2], [3, -7.2], [10, -7.4]].map(([x, z]) => burning(world, { parent: g, x, y: 3.8, z, size: 1.4, level: 0 }));
    // 성을 지키는 삼별초와 김통정
    const kim = person(g, 'kimtongjeong', -1, -3.6, 0);
    const men = troop(g, 'sambyeolcho', 0.5, -5, { cols: 5, rows: 2, gap: 1.3, ry: 0 });
    cam([4, 4.2, 9], [0, 2.2, -7]);
    await fadeIn();
    await say(L[0]);
    ctx.dialogue.close();
    ctx.audio?.play?.('whoosh');
    await wait(world, 1.4, k => fires.forEach(f => f.setLevel(k))); hook.fire = true;
    await say(L[1]);
    ctx.dialogue.close();
    // 바닷가의 배로 물러난다
    const boats = [[-5, 9], [0, 10], [5, 9.5]].map(([x, z]) => boatWith(g, x, z, []));
    await glide([4, 4.2, 9], [0, 2.2, -7], [-6, 3, 1], [0, 1.4, 8], 1.4);
    await march(world, [kim, ...men], 0, 6.5, 2.4);
    face(kim, -6, 1);
    await say(L[2], kim);
    ctx.dialogue.close();
    [kim, ...men].forEach(p => { p.visible = false; });
    boats.forEach(({ b }, i) => { for (let k = 0; k < 3; k++) { const p = person(b, 'sambyeolcho', 0, (k - 1) * 1.1, Math.PI); p.position.y = 0.3; p.userData.noWalk = true; } if (i === 1) { const p = person(b, 'kimtongjeong', 0.4, 1.8, Math.PI); p.position.y = 0.3; p.userData.noWalk = true; } });
    const z0 = boats.map(({ b }) => b.position.z);
    await wait(world, 3.2, k => boats.forEach(({ b }, i) => { b.position.z = z0[i] + 18 * k; b.rotation.y = Math.PI; }));
    hook.sailed = boats.length;
  } });
}

export function hangpaduriScene(ctx) {
  const L = script.jeju.talk;
  return storyScene(ctx, { key: 'hangpaduri', arena: HANGPADURI, mood: 'haze', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 흙으로 길게 쌓은 성(토성)과 그 뒤의 삼별초
    for (const x of [-10, 0, 10]) blk(g, 10, 2.2, 2.4, 0x7a5f40, x, 1.1, 1.5, 'earth');
    const kim = person(g, 'kimtongjeong', -1.6, -4.6, 0); // 군사들 뒤(카메라 가까이)에서 돌아보며 말한다
    const men = troop(g, 'sambyeolcho', -1, -0.2, { cols: 6, rows: 2, gap: 1.4, ry: 0 });
    men.forEach(p => { p.position.y = 0; });
    for (const x of [-12, -4, 4, 12]) { const f = new THREE.Group(); f.position.set(x, 2.2, 1.5); BLD.banner(f, { color: 0x3a2f2a, h: 2.6 }); g.add(f); }
    // 바다 건너 몰려오는 연합군 배
    const fleet = [];
    for (let i = 0; i < 9; i++) fleet.push(boatWith(g, -16 + i * 4, 34 + (i % 3) * 4, i % 2 ? ['mongol', 'mongol'] : ['soldier', 'soldier'], 1.6));
    fleet.forEach(({ b }) => { b.rotation.y = Math.PI; });
    cam([-4, 2.8, -10.5], [-1, 1.4, 1]); // 흙성 안쪽 뒤에서 김통정과 삼별초 너머 바다를 본다
    face(kim, -4, -10.5);
    await fadeIn();
    await say(L[0], kim);
    ctx.dialogue.close();
    const z0 = fleet.map(({ b }) => b.position.z);
    const come = wait(world, 6, k => fleet.forEach(({ b }, i) => { b.position.z = z0[i] - 18 * k; }));
    await glide([-4, 2.8, -10.5], [-1, 1.4, 1], [6, 5, -4], [0, 1, 20], 2);
    await come;
    hook.fleet = fleet.length;
    await say(L[1]);
  } });
}
