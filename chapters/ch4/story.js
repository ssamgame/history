// 4장 이야기 장면(D-58): 1232년 7월 강화 천도. 임금의 깃발을 단 배들이 좁은 바다를 건너 강화도로 가고,
// 뒤늦게 바닷가에 닿은 몽골군은 배가 없어 건너지 못하고 바라만 본다(몽골은 물에서 싸우는 데 약했다, S10).
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { storyScene, person, wait, march, face, troop } from '../kit/story.js';
import script from './script.js';

export const STRAIT = { origin: [400, 0], sea: 0x3f6f86, bounds: { x0: -20, x1: 20, z0: -20, z1: 16 },
  props: [{ type: 'island', x: -6, z: -26, r: 16, peak: 5, solid: false }, { type: 'island', x: 0, z: 22, r: 13, solid: false }] };

export function capitalScene(ctx) {
  const L = script.capital.done;
  return storyScene(ctx, { key: 'capital', arena: STRAIT, mood: 'summer', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 강화도 쪽 기와집(새 도읍)
    for (const [x, z] of [[-10, -17], [-3, -18.5], [4, -17.5]]) { const h = new THREE.Group(); h.position.set(x, 1.3, z); h.rotation.y = 0.1; BLD.hanok(h, { tile: true, seed: x }); h.scale.setScalar(0.8); g.add(h); }
    // 건너가는 배 넷: 사공과 관리·백성이 탔다. 앞 배에는 임금의 깃발
    const boats = [[-4, 7], [2, 9], [-1, 12], [5, 13]].map(([x, z], i) => {
      const b = new THREE.Group(); b.position.set(x, 0.05, z); b.rotation.y = 0.12; g.add(b); BLD.boat(b, { len: 4.6 });
      const riders = i === 0 ? ['minister', 'officer'] : ['villager', 'villager', 'kid'].slice(0, 2 + (i % 2));
      riders.forEach((lk, k) => { const p = person(b, lk, 0, (k - 0.5) * 1.1, Math.PI); p.position.y = 0.3; p.userData.noWalk = true; });
      if (i === 0) { const f = new THREE.Group(); f.position.set(0.3, 0.3, 1.6); BLD.banner(f, { color: 0xd9a441, h: 3 }); b.add(f); }
      return b;
    });
    cam([10, 3.2, 21], [-2, 1, -12]);
    await fadeIn();
    const z0 = boats.map(b => b.position.z);
    const sail = wait(world, 7, k => boats.forEach((b, i) => { b.position.z = z0[i] - 16 * k; b.rotation.z = Math.sin(k * 20 + i) * 0.03; }));
    await say(L[0]);
    await sail;
    hook.crossed = boats.filter((b, i) => b.position.z < z0[i] - 14).length;
    ctx.dialogue.close();
    // 뒤늦게 바닷가에 닿은 몽골군: 물가에 멈춰 선다
    const mongols = troop(g, 'mongol', 0, 13.5, { cols: 5, rows: 2, gap: 1.4, ry: Math.PI });
    mongols.forEach(p => { p.position.z += 6; });
    await glide([10, 3.2, 21], [-2, 1, -12], [3, 2.4, 1], [0, 1.6, 14], 1.4); // 바다 쪽에서 물가의 몽골군을 본다
    await march(world, mongols, 0, -6, 2.2);
    mongols.forEach(p => face(p, 0, -20));
    hook.mongols = mongols.length;
    await say(L[1]);
  } });
}
