// 근대 1장 이야기 장면(D-58): 1876년 강화도 연무당. 바다에는 일본 군함이 머물고, 정자 아래 탁자를 사이에 두고
// 조선 관리와 일본 대표가 마주 서서 조약문에 도장을 찍는다.
import * as THREE from 'three';
import { BUILD } from '../../kit/town.js';
import { storyScene, person, wait, face, blk } from '../../kit/story.js';
import script from './script.js';

export const SIGNING = { origin: [400, 0], ground: 'earth', groundColor: 0x9a8a68, hill: 0.7, bounds: { x0: -14, x1: 14, z0: -8, z1: 12 },
  props: [{ type: 'water', x: 0, z: -60, w: 200, d: 90, solid: false }, { type: 'pavilion', x: 0, z: 2, solid: false }], edge: { style: 'thatch', back: false } };

export function treatyScene(ctx) {
  const L = script.treaty;
  return storyScene(ctx, { key: 'treaty', arena: SIGNING, mood: 'overcast', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    const ships = [-8, 6].map((x, i) => { const s = new THREE.Group(); BUILD.steamship(s, { old: true }); s.position.set(x, 0.3, -26 - i * 6); s.rotation.y = Math.PI / 2; g.add(s); return s; });
    // 정자 아래 탁자와 조약문, 마주 앉은 두 나라 대표
    const fl = new THREE.Group(); fl.position.y = 0.6; g.add(fl); // 정자 마루 높이
    blk(fl, 2.6, 0.7, 1.2, 0x6b4a32, 0, 0.35, 2, 'wood');
    const paper = blk(fl, 0.8, 0.03, 0.55, 0xe8e2d2, 0, 0.72, 2, 'cloth');
    const joseon = [[-1.9, 1.6], [-1.9, 2.6]].map(([x, z]) => { const p = person(fl, 'joseonOfficial', x, z, Math.PI / 2); return p; });
    const japan = [[1.9, 1.6], [1.9, 2.6]].map(([x, z]) => { const p = person(fl, 'gentleman', x, z, -Math.PI / 2); return p; });
    const stamp = blk(fl, 0.12, 0.16, 0.12, 0x8a2f24, -0.2, 1.4, 2, 'wood');
    cam([0, 4.4, 15], [0, 1, -20]); // 바다의 군함과 정자를 함께
    await fadeIn();
    await say(L[0], joseon[0]);
    ctx.dialogue.close();
    await glide([0, 4.4, 15], [0, 1, -20], [1.7, 3.4, 9.5], [0, 1.6, 2], 1.6);
    await wait(world, 0.6, k => { stamp.position.y = 1.4 - 0.62 * k; });
    ctx.audio?.play?.('tap');
    paper.material = paper.material.clone(); hook.signed = true;
    await wait(world, 0.4, k => { stamp.position.y = 0.78 + 0.5 * k; });
    hook.ships = ships.length; hook.seated = joseon.length + japan.length;
  } });
}
