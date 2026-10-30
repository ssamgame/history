// 4장 이야기 장면(D-58): 1232년 7월 강화 천도. 임금의 깃발을 단 배들이 좁은 바다를 건너 강화도로 가고,
// 뒤늦게 바닷가에 닿은 몽골군은 배가 없어 건너지 못하고 바라만 본다(몽골은 물에서 싸우는 데 약했다, S10).
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { storyScene, person, wait, face } from '../kit/story.js';
import { host, advance, command, patrol, sunk, islandGround } from '../kit/army.js';
import script from './script.js';

const ISLES = [{ type: 'island', x: -6, z: -26, r: 16, peak: 5, solid: false }, { type: 'island', x: 0, z: 34, r: 19, solid: false }]; // 강화도(북) · 뭍(남, 몽골군이 닿는 바닷가)
export const STRAIT = { origin: [400, 0], sea: 0x3f6f86, bounds: { x0: -20, x1: 20, z0: -20, z1: 16 }, props: ISLES };
const groundAt = islandGround(ISLES); // 사람·말은 섬 윗면 높이에 선다(2026-10-30: 몽골군이 언덕 속에 묻혀 보이던 오류)

export function capitalScene(ctx) {
  const L = script.capital.done;
  return storyScene(ctx, { key: 'capital', arena: STRAIT, mood: 'summer', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 강화도 쪽 기와집(새 도읍)
    for (const [x, z] of [[-10, -17], [-3, -18.5], [4, -17.5]]) { const h = new THREE.Group(); h.position.set(x, 1.3, z); h.rotation.y = 0.1; BLD.hanok(h, { tile: true, seed: x }); h.scale.setScalar(0.8); g.add(h); }
    // 건너가는 배 넷: 사공과 관리·백성이 탔다. 앞 배에는 임금의 깃발
    const boats = [[-4, 5], [2, 7], [-1, 10], [5, 11]].map(([x, z], i) => {
      const b = new THREE.Group(); b.position.set(x, 0.05, z); b.rotation.y = 0.12; g.add(b); BLD.boat(b, { len: 4.6 });
      const riders = i === 0 ? ['minister', 'officer'] : ['villager', 'villager', 'kid'].slice(0, 2 + (i % 2));
      riders.forEach((lk, k) => { const p = person(b, lk, 0, (k - 0.5) * 1.1, Math.PI); p.position.y = 0.3; p.userData.noWalk = true; });
      if (i === 0) { const f = new THREE.Group(); f.position.set(0.3, 0.3, 1.6); BLD.banner(f, { color: 0xd9a441, h: 3 }); b.add(f); }
      return b;
    });
    cam([10, 3.2, 21], [-2, 1, -12]);
    await fadeIn();
    const z0 = boats.map(b => b.position.z);
    const sail = wait(world, 7, k => boats.forEach((b, i) => { b.position.z = z0[i] - 14 * k; b.rotation.z = Math.sin(k * 20 + i) * 0.03; }));
    await say(L[0]);
    await sail;
    hook.crossed = boats.filter((b, i) => b.position.z < z0[i] - 12).length;
    ctx.dialogue.close();
    // 뒤늦게 바닷가에 닿은 몽골군(기마병 중심): 장수와 깃발 기수가 앞서고, 기마 궁수·창기병이 세 줄, 뒤에 걷는 병사 몇. 뭍 언덕을 내려와 물가에서 멈춘다
    const army = host(g, { x: -1, z: 36, ry: Math.PI, ground: groundAt, general: 'mongolGeneral', banner: 0x2a2a2e,
      cavalry: { n: 12, cols: 5, gap: 3.0, depth: 3.4, looks: ['mongolArcher', 'mongolLancer', 'mongol', 'mongolArcher', 'mongolLancer'] }, infantry: { n: 4, cols: 4, looks: ['mongol', 'mongolLancer'] } });
    const wing = host(g, { x: 9, z: 41, ry: Math.PI - 0.25, ground: groundAt, cavalry: { n: 4, cols: 2, gap: 3.0, looks: ['mongolArcher', 'mongol'] } }); // 오른쪽 언덕으로 돌아오는 날개 기마대
    const all = [...army.units, ...wing.units], riders = [...army.riders, ...wing.riders];
    const stopPatrol = patrol(world, riders);
    await glide([10, 3.2, 21], [-2, 1, -12], [10, 6.5, 6], [0, 1.8, 26], 1.4); // 바다 쪽에서 뭍의 몽골군을 내려다본다
    await Promise.all([advance(world, army.units, 0, -13, 4.5, { ground: groundAt }), advance(world, wing.units, -3, -12, 4.8, { ground: groundAt })]); // 언덕을 내려와 물가까지
    command(army.general);
    army.foot.forEach(p => face(p, 0, -20));
    hook.mongols = all.length; hook.mongolRiders = riders.length + (army.general ? 1 : 0) + (army.bearer ? 1 : 0);
    hook.sunk = sunk(all, groundAt);
    await say(L[1]);
    stopPatrol();
  } });
}
