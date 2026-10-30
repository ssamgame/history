// 3장 이야기 장면(D-58): 귀주 대첩 뒤. 살아남은 거란군이 찢어진 깃발을 끌고 북쪽으로 물러가고(수천 명만 살아 돌아감),
// 강감찬과 고려 군사들이 이긴 것을 기뻐한다(얼굴이 보이게, D-45). 강감찬은 개경 둘레에 성을 쌓자고 한다.
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { storyScene, person, wait, march, face, troop, facingShare, raiseArms } from '../kit/story.js';
import script from './script.js';

export const GWIJU_AFTER = { origin: [400, 0], ground: 'earth', groundColor: 0x7d7a5e, hill: 1, bounds: { x0: -18, x1: 18, z0: -16, z1: 14 }, edge: { style: 'forest' } };

export function retreatScene(ctx) {
  const L = script.retreat;
  return storyScene(ctx, { key: 'retreat', arena: GWIJU_AFTER, mood: 'overcast', async run({ g, hook, cam, glide, say, people, fadeIn }) {
    const { world } = ctx;
    // 들판에 쓰러진 거란 깃발과 버려진 창
    for (const [x, z, r] of [[-6, -2, 1.2], [4, -4, -0.9], [9, 1, 0.5], [-10, 3, -1.4]]) { const f = new THREE.Group(); f.position.set(x, 0, z); f.rotation.set(0, r, 1.35); BLD.banner(f, { color: 0x2e2a26, h: 2.6 }); g.add(f); }
    // 북쪽으로 물러가는 거란군(몇 사람만)
    const khitan = troop(g, ['khitan', 'khitanBright'], 0, -6, { cols: 4, rows: 2, gap: 1.5, ry: Math.PI, jitter: 0.5 });
    const flag = new THREE.Group(); flag.position.set(0.6, 0, -7); BLD.banner(flag, { color: 0x2e2a26, h: 3.4 }); flag.rotation.z = 0.25; g.add(flag);
    cam([1, 3.6, 13], [0, 1.4, -10]);
    await fadeIn();
    const go = march(world, [...khitan, flag], 0, -9, 6, { turn: false });
    await say(L.lines[0]);
    await go;
    hook.retreated = khitan.length;
    khitan.forEach(p => { p.visible = false; }); flag.visible = false;
    // 언덕 위 고려 군사와 강감찬: 카메라 쪽을 보며 창을 들어 기뻐한다
    const gk = person(g, 'gangamchan', 0, 3.4, 0);
    const army = troop(g, ['soldier', 'archer', 'soldier', 'soldier'], 0, 1.6, { cols: 5, rows: 2, gap: 1.35, ry: 0 });
    army.forEach(p => face(p, 0.5, 13)); face(gk, 0.5, 13);
    people.push(...army);
    cam([0.5, 2.9, 12.5], [0, 1.7, 1.5]);
    hook.facing = facingShare(world, army);
    ctx.audio?.play?.('correct');
    for (let n = 0; n < 2; n++) await wait(world, 0.9, k => army.forEach((p, i) => raiseArms(p, Math.sin(Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.05)) * Math.PI))));
    hook.cheers = 2;
    await say(L.lines[1], gk);
  } });
}
