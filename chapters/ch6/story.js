// 6장 이야기 장면(D-58): ① 1271년 5월 진도 용장성이 무너지고 김통정이 남은 군사를 배에 태워 제주로 건너간다.
// ② 제주 항파두리 흙성에서 끝까지 맞서지만, 1273년 고려와 몽골의 연합군 배들이 몰려와 진압된다(피는 넣지 않는다).
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { burning } from '../kit/fire.js';
import { storyScene, person, wait, march, face, troop, blk } from '../kit/story.js';
import { host, advance, command, patrol, sunk } from '../kit/army.js';
import { addSculler, autoRow } from '../kit/row.js';
import { strike, block } from '../../core/interact.js';
import { setStyle } from '../../core/people.js';
import script from './script.js';

const shore = (extra = {}) => ({ origin: [400, 0], ground: 'earth', groundColor: 0x7d6e52, hill: 1, bounds: { x0: -18, x1: 18, z0: -12, z1: 6 },
  props: [{ type: 'water', x: 0, z: 30, w: 160, d: 48, solid: false }], edge: { style: 'forest', sides: false }, ...extra });
export const YONGJANG = shore();
export const HANGPADURI = shore({ groundColor: 0x6e5a40, bounds: { x0: -20, x1: 20, z0: -12, z1: 20 }, props: [{ type: 'water', x: 0, z: 46, w: 160, d: 48, solid: false }] }); // 바닷가가 넓어야 연합군이 내려 늘어선다

// 배 한 척: 탄 사람들과 고물에서 노를 젓는 사공(kit/row.js). 배가 움직이는 만큼 사공이 젓는다
const boatWith = (g, x, z, looks, scale = 1, rowerLook = 'villager') => { const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b); BLD.boat(b, { len: 4.6 }); b.scale.setScalar(scale);
  const riders = looks.map((lk, k) => { const p = person(b, lk, 0, 1.1 - k * 1.0, 0); p.position.y = 0.3; p.userData.noWalk = true; return p; });
  const rower = addSculler(b, { look: rowerLook, deckY: 0.33, sternZ: -2.0, side: 0.3, scale: 0.85 });
  return { b, riders, rower }; };

export function yongjangScene(ctx) {
  const L = script.jindo.talk;
  return storyScene(ctx, { key: 'yongjang', arena: YONGJANG, mood: 'overcast', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 산기슭 돌성(용장성): 성돌을 쌓아 올린 성벽과 성 위 삼별초 깃발. 무너질 때는 성돌이 허물어져 쏟아져 내린다(D-62, 2026-10-31 선생님)
    const stones = [], SW = 1.0, SH = 0.62;
    const stoneMat = [0x8c8577, 0x9a9384, 0x7d776b].map(c => new THREE.MeshLambertMaterial({ color: c }));
    for (let col = 0; col < 27; col++) for (let row = 0; row < 6; row++) {
      const x = -13 + col * SW + (row % 2) * 0.5, y = SH / 2 + row * SH;
      const m = new THREE.Mesh(new THREE.BoxGeometry(SW * 0.96, SH * 0.94, 1.1), stoneMat[(col * 7 + row * 3) % 3]); m.position.set(x, y, -8); m.castShadow = true; m.receiveShadow = true; g.add(m);
      stones.push({ m, x, y, row, col, v: new THREE.Vector3(), w: new THREE.Vector3(), t0: 0 });
    }
    const flags = [-11, -3, 5, 12].map(x => { const f = new THREE.Group(); f.position.set(x, 6 * SH, -8); BLD.banner(f, { color: 0x3a2f2a, h: 2.6 }); g.add(f); return f; });
    const dust = Array.from({ length: 14 }, (_, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.8, 7, 5), new THREE.MeshLambertMaterial({ color: 0xb8ae98, transparent: true, opacity: 0, depthWrite: false })); d.position.set(-11 + i * 1.7, 0.6, -7.4); g.add(d); return d; });
    // 성을 지키는 삼별초와 김통정
    const kim = person(g, 'kimtongjeong', -1, -3.6, 0);
    const men = troop(g, 'sambyeolcho', 0.5, -5, { cols: 5, rows: 2, gap: 1.3, ry: 0 });
    cam([4, 4.2, 9], [0, 2.2, -7]);
    await fadeIn();
    await say(L[0]);
    ctx.dialogue.close();
    // 성벽이 허물어진다: 가운데부터 금이 가 위 성돌부터 앞으로 쏟아져 내리고, 흙먼지가 인다
    ctx.audio?.play?.('whoosh');
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const st of stones) { const dc = Math.abs(st.x - 0.5); st.t0 = 0.15 + dc * 0.07 + (5 - st.row) * 0.06 + rnd() * 0.25; st.v.set((rnd() - 0.5) * 1.6, 0.6 + rnd() * 1.2, 1.2 + rnd() * 2.4); st.w.set((rnd() - 0.5) * 6, (rnd() - 0.5) * 3, (rnd() - 0.5) * 6); st.fall = st.row >= 1 || rnd() < 0.5; }
    hook.crumbled = 0;
    await wait(world, 3.2, (k, dt) => {
      const t = k * 3.2;
      for (const st of stones) {
        if (!st.fall || t < st.t0) continue;
        if (!st.moving) { st.moving = true; hook.crumbled++; }
        st.v.y -= 9.8 * dt; st.m.position.addScaledVector(st.v, dt);
        const floor = 0.3 + (st.row === 0 ? 0 : 0.25 * ((st.col * 3 + st.row) % 3));
        if (st.m.position.y < floor) { st.m.position.y = floor; st.v.multiplyScalar(0.25); st.v.y = Math.abs(st.v.y) * 0.2; st.w.multiplyScalar(0.4); } // 땅에 떨어져 쌓인다
        st.m.rotation.x += st.w.x * dt; st.m.rotation.y += st.w.y * dt; st.m.rotation.z += st.w.z * dt;
      }
      flags.forEach((f, i) => { f.position.y = Math.max(0.2, 6 * SH - Math.max(0, t - 0.4 - i * 0.15) ** 2 * 4); f.rotation.z = (i % 2 ? 1 : -1) * Math.min(1.4, Math.max(0, t - 0.4) * 1.2); });
      dust.forEach((d, i) => { const q = Math.max(0, Math.min(1, (t - 0.5 - (i % 4) * 0.15) / 2)); d.material.opacity = 0.55 * Math.sin(Math.PI * q); d.scale.setScalar(0.6 + q * 2.6); d.position.y = 0.6 + q * 2.4; });
    });
    hook.collapsed = true;
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
    const z0 = boats.map(({ b }) => b.position.z), offRow = autoRow(world, boats.map(x => x.rower));
    boats.forEach(({ b }) => { b.rotation.y = 0; });
    await wait(world, 3.6, k => boats.forEach(({ b }, i) => { b.position.z = z0[i] + 18 * k * k * (3 - 2 * k); })); // 천천히 나아가 빨라진다(사공이 젓는 만큼)
    offRow();
    hook.sailed = boats.length;
  } });
}

export function hangpaduriScene(ctx) {
  const L = script.jeju.talk;
  return storyScene(ctx, { key: 'hangpaduri', arena: HANGPADURI, mood: 'haze', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    const WALL = 1.3, WZ = 1.5; // 흙성 높이와 자리(z). 몸통이 보이게 낮게 쌓은 흙성
    const groundAt = (x, z) => (Math.abs(z - WZ) < 1.2 && Math.abs(x) < 15 ? WALL : 0);
    hook.phases = [];
    // ① 저항과 방어: 흙으로 길게 쌓은 성(토성) 뒤에 창을 든 삼별초와 활을 든 군사, 깃발. 김통정은 군사들 뒤에서 말한다
    for (const x of [-10, 0, 10]) blk(g, 10, WALL, 2.4, 0x7a5f40, x, WALL / 2, WZ, 'earth');
    const kim = person(g, 'kimtongjeong', -1.6, -5.4, 0);
    const men = troop(g, ['sambyeolcho', 'sambyeolcho', { ...LOOKS_SB_ARCHER }], -1, -0.6, { cols: 7, rows: 2, gap: 1.5, ry: 0, jitter: 0.2 });
    men.forEach(p => setStyle(p, 'guard'));
    const flags = [-12, -4, 4, 12].map(x => { const f = new THREE.Group(); f.position.set(x, WALL, WZ - 0.6); BLD.banner(f, { color: 0x3a2f2a, h: 2.6 }); g.add(f); return f; });
    // 바다 건너 몰려오는 연합군 배(사공이 노를 젓는다)
    const fleet = [];
    for (let i = 0; i < 8; i++) fleet.push(boatWith(g, -17 + i * 4.8, 44 + (i % 3) * 4, i % 2 ? ['mongol', 'mongolLancer'] : ['soldier', 'archer'], 1.4, i % 2 ? 'mongol' : 'villager'));
    fleet.forEach(({ b }) => { b.rotation.y = Math.PI; });
    const offRow = autoRow(world, fleet.map(f => f.rower));
    cam([-4, 2.8, -10.5], [-1, 1.4, 1]); // 흙성 안쪽 뒤에서 김통정과 삼별초 너머 바다를 본다
    face(kim, -4, -10.5);
    await fadeIn();
    await say(L[0], kim); hook.phases.push('defend');
    ctx.dialogue.close();
    // ② 진격: 배들이 바닷가에 닿는다
    const z0 = fleet.map(({ b }) => b.position.z);
    const come = wait(world, 6, k => { const e = k * k * (3 - 2 * k); fleet.forEach(({ b }, i) => { b.position.z = z0[i] - 21 * e; }); });
    await glide([-4, 2.8, -10.5], [-1, 1.4, 1], [14, 7, -2], [0, 1, 22], 2);
    await come;
    // 바닷가에 내린 연합군: 앞에 고려 관군 보병, 양옆과 뒤에 몽골 기마병, 장수들
    fleet.forEach(({ riders }) => riders.forEach(p => { p.visible = false; }));
    const allies = host(g, { x: 0, z: 17, ry: Math.PI, general: 'goryeoCommander', generalOnFoot: true, banner: 0xb8452f, bearerLook: 'soldier', front: 'infantry',
      infantry: { n: 14, cols: 7, gap: 1.7, looks: ['soldier', 'archer', 'soldier'] }, cavalry: { n: 4, cols: 4, gap: 3.4, looks: ['mongolArcher', 'mongolLancer'] } });
    const wingL = host(g, { x: -13, z: 15, ry: Math.PI + 0.2, general: 'mongolGeneral', banner: 0x2a2a2e, cavalry: { n: 4, cols: 2, gap: 3.0, looks: ['mongolArcher', 'mongol'] } });
    const wingR = host(g, { x: 13, z: 15, ry: Math.PI - 0.2, cavalry: { n: 4, cols: 2, gap: 3.0, looks: ['mongolLancer', 'mongolArcher'] } });
    const allUnits = [...allies.units, ...wingL.units, ...wingR.units], riders = [...allies.riders, ...wingL.riders, ...wingR.riders];
    const offPatrol = patrol(world, riders);
    cam([16, 6.5, 2], [0, 1.2, 10]);
    hook.phases.push('advance');
    command(allies.general); command(wingL.general);
    // 삼별초는 흙성 앞으로 나와 흙성을 등지고 늘어서 바닷가의 연합군을 마주 본다(D-62, 2026-10-31 선생님: 흙벽을 사이에 두고 싸우지 않고, 흙벽을 뒤로 두고 대치)
    const line = men.map((p, i) => [p, -9 + (i % 7) * 3 + (i >= 7 ? 1.5 : 0), WZ + 2.4 + (i >= 7 ? 0 : 1.4)]);
    const outMarch = Promise.all(line.map(([p, x, z]) => march(world, [p], x - p.position.x, z - p.position.z, 2.4)));
    await Promise.all([
      outMarch,
      advance(world, allies.units, 0, -6.5, 4.2),
      advance(world, wingL.units, 2.5, -5, 4.6),
      advance(world, wingR.units, -2.5, -5, 4.6),
      glide([16, 6.5, 2], [0, 1.2, 10], [17, 5, 6], [0, 1.4, 7], 4.4),
    ]);
    men.forEach(p => face(p, p.position.x, p.position.z + 10)); // 바다 쪽(연합군)을 본다
    allies.foot.forEach(p => face(p, p.position.x, p.position.z - 10)); // 연합군 보병은 흙성 쪽을 본다
    hook.phases.push('standoff');
    flags.forEach(f => { f.position.z = WZ - 0.6; });
    // 대치: 두 군대가 마주 서서 창을 겨눈다(서로 닿지 않는 거리)
    const zSB = Math.max(...men.map(p => p.position.z)), zAL = Math.min(...allies.foot.map(p => p.position.z));
    hook.gap = zAL - zSB; hook.wallBehind = men.every(p => p.position.z > WZ + 1.2);
    hook.facing = (men.filter(p => Math.cos(p.rotation.y) > 0.9).length + allies.foot.filter(p => Math.cos(p.rotation.y) < -0.9).length) / (men.length + allies.foot.length);
    await glide([17, 5, 6], [0, 1.4, 7], [-13, 3.4, 9.5], [2, 1.5, 8], 3); // 옆에서 흙성을 등진 삼별초와 마주 선 연합군을 함께
    kim.visible = false;
    hook.mongols = riders.length + 2; hook.mongolRiders = riders.length + 1; // 연합군 가운데 몽골군은 기마병 중심(걸어가는 몽골 병사는 없다)
    hook.sunk = sunk(allUnits, groundAt);
    { let m = 9; const vis = allUnits.filter(u => u.visible); for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) m = Math.min(m, Math.hypot(vis[i].position.x - vis[j].position.x, vis[i].position.z - vis[j].position.z) / (vis[i].userData.horse || vis[j].userData.horse ? 1.7 : 1)); hook.minGap = m; }
    hook.fleet = fleet.length;
    await say(L[1]);
    offPatrol(); offRow();
  } });
}

const LOOKS_SB_ARCHER = { robe: 0x3a2f2a, outfit: 'armor', armor: 0x4e4a44, hat: 'helmet', gear: 'bow', trim: 0xb8452f, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } }; // 활을 든 삼별초

// 화살 한 차례: 쏘는 사람(from)에서 받는 사람(to) 앞까지 포물선으로 날아가 앞에서 떨어진다(맞히지 않는다)
function volley(world, g, from, to, n) {
  const arrows = [];
  for (let i = 0; i < n * 2; i++) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe8dcc0 })); a.visible = false; g.add(a); arrows.push(a); }
  const ahead = new THREE.Vector3();
  return wait(world, 3.6, k => arrows.forEach((a, i) => {
    const t0 = (i % n) * 0.28 + Math.floor(i / n) * 0.5, t = k * 3.6 - t0, d = 1.1;
    if (t < 0 || t > d) { a.visible = false; return; }
    const s = from[(i * 3) % from.length], r = to[(i * 2) % to.length], u = t / d;
    const sx = s.position.x, sz = s.position.z, tx = r.position.x + 0.4, tz = r.position.z + 1.2;
    const pos = (q, w) => q.set(sx + (tx - sx) * w, 2.2 + Math.sin(Math.PI * w) * 3 - w * 2, sz + (tz - sz) * w);
    a.visible = true; pos(a.position, u); a.lookAt(pos(ahead, Math.min(1, u + 0.05)));
  }));
}
