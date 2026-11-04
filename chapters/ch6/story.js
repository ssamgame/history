// 6장 이야기 장면(D-58): ① 1271년 5월 진도 용장성이 무너지고 김통정이 남은 군사를 배에 태워 제주로 건너간다.
// ② 제주 항파두리 흙성에서 끝까지 맞서지만, 1273년 고려와 몽골의 연합군 배들이 몰려와 진압된다(피는 넣지 않는다).
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { burning } from '../kit/fire.js';
import { storyScene, person, wait, march, face, troop, blk } from '../kit/story.js';
import { host, advance, command, patrol, sunk } from '../kit/army.js';
import { addSculler, autoRow } from '../kit/row.js';
import { strike, block } from '../../core/interact.js';
import { fallDown } from '../kit/clash.js';
import { setStyle } from '../../core/people.js';
import script from './script.js';

const shore = (extra = {}) => ({ origin: [400, 0], ground: 'earth', groundColor: 0x7d6e52, hill: 1, bounds: { x0: -18, x1: 18, z0: -12, z1: 6 },
  props: [{ type: 'water', x: 0, z: 30, w: 160, d: 48, solid: false, shore: true }], edge: { style: 'forest', sides: false }, ...extra });
export const YONGJANG = shore();
export const HANGPADURI = shore({ groundColor: 0x6e5a40, bounds: { x0: -20, x1: 20, z0: -12, z1: 20 }, props: [{ type: 'water', x: 0, z: 46, w: 160, d: 48, solid: false, shore: true }] }); // 바닷가가 넓어야 연합군이 내려 늘어선다

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
    // 성 안의 삼별초와 김통정(D-66, 2026-11-03 선생님): 성벽을 바라보고 서 있고, 카메라는 그 등 뒤에서 본다.
    // 성벽 밖에는 몽골군이 몰려와 깃발과 창끝만 성벽 너머로 보이고 함성이 들린다. 몽골군이 성벽을 치자 성벽이 안쪽으로 허물어지고, 삼별초는 곧바로 배로 달아난다
    const kim = person(g, 'kimtongjeong', -1, -3.2, Math.PI);
    const men = troop(g, 'sambyeolcho', 0.5, -4.4, { cols: 5, rows: 2, gap: 1.3, ry: Math.PI });
    const foes = troop(g, ['mongol', 'mongolLancer', 'mongolArcher'], 0.5, -11, { cols: 9, rows: 3, gap: 1.5, ry: 0 }); // 성벽 밖 몽골군(+z가 성 쪽)
    const foeFlags = [-8, -2, 4, 10].map((x, i) => { const f = new THREE.Group(); f.position.set(x, 0, -12.5 - (i % 2)); BLD.banner(f, { color: i % 2 ? 0x2a3550 : 0x6a2a20, h: 5.2 }); g.add(f); return f; }); // 성벽 너머로 보이는 몽골 깃발
    const foe0 = foes.map(p => p.position.clone());
    hook.attackers = foes.length;
    cam([1.5, 3.6, 7.5], [0, 2.4, -9]); // 삼별초 등 뒤에서 성벽을 본다
    hook.fromBehind = true;
    await fadeIn();
    await say(L[0]);
    ctx.dialogue.close();
    // 몽골군의 함성과 공격: 깃발이 흔들리며 다가오고, 성벽을 칠 때마다 성돌이 흔들린다
    for (let hit = 0; hit < 3; hit++) {
      ctx.audio?.play?.(hit === 2 ? 'boom' : 'whoosh');
      await wait(world, 0.7, (k, dt) => {
        foeFlags.forEach((f, i) => { f.rotation.z = Math.sin((hit + k) * 9 + i) * 0.12; f.position.z += dt * 0.8; });
        foes.forEach((p, i) => { p.position.z = foe0[i].z + (hit + k) * 0.6; });
        for (const st of stones) st.m.position.z = -8 + Math.sin(k * Math.PI) * 0.06 * (st.row + 1) / 6 * (Math.abs(st.x - 0.5) < 6 ? 1 : 0.3);
      });
    }
    // 성벽이 허물어진다: 가운데부터 위 성돌부터 안쪽(삼별초 쪽)으로 쏟아져 내리고, 흙먼지가 인다. 그 틈으로 몽골군이 보인다
    ctx.audio?.play?.('boom');
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
    // 무너진 틈으로 몽골군이 밀려들고, 삼별초는 곧바로 돌아서 바닷가의 배로 달아난다
    const boats = [[-5, 9], [0, 10], [5, 9.5]].map(([x, z]) => boatWith(g, x, z, []));
    const foe1 = foes.map(p => p.position.clone());
    const surge = wait(world, 2.6, k => foes.forEach((p, i) => { p.position.z = foe1[i].z + 4 * k; }));
    [kim, ...men].forEach(p => { p.rotation.y = 0; });
    hook.fledAfter = 0; // 무너진 뒤 달아나기까지 걸린 때(곧바로)
    const run = march(world, [kim, ...men], 0, 9, 1.8, { linear: true }); // D-67: 걷지 않고 뛰어서(5m/s, 달리기 동작)
    await say(L[1]);
    ctx.dialogue.close();
    await glide([1.5, 3.6, 7.5], [0, 2.4, -9], [-6, 3, 1], [0, 1.4, 8], 1.4);
    await Promise.all([run, surge]);
    face(kim, -6, 1);
    await say(L[2], kim);
    ctx.dialogue.close();
    [kim, ...men, ...foes].forEach(p => { p.visible = false; }); foeFlags.forEach(f => { f.visible = false; });
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
    // D-67(2026-11-04 선생님): 삼별초는 흙으로 쌓은 성벽 위에서 연합군을 내려다보고, 연합군이 진격해 흙성을 무너뜨려 삼별초가 진다(맞붙는 싸움·피는 없다)
    const WALL = 1.6, WZ = 3, CH = 0.8, ROWS = 2; // 흙성 높이·자리(z)·흙덩이 크기·층
    const chunks = [], earth = [0x7a5f40, 0x6e5538, 0x846848].map(c => new THREE.MeshLambertMaterial({ color: c }));
    for (let col = 0; col < 34; col++) for (let row = 0; row < ROWS; row++) {
      const x = -13.2 + col * CH + (row % 2) * CH / 2, y = WALL / ROWS * (row + 0.5);
      const m = new THREE.Mesh(new THREE.BoxGeometry(CH * 0.98, WALL / ROWS * 0.98, 1.8), earth[(col * 5 + row) % 3]); m.position.set(x, y, WZ); m.castShadow = m.receiveShadow = true; g.add(m);
      chunks.push({ m, x, row, v: new THREE.Vector3(), w: new THREE.Vector3(), t0: 0 });
    }
    hook.wall = true; hook.wallTop = WALL;
    hook.phases = [];
    const men = [[-4.8, 0], [-2.4, 0.2], [0, 0], [2.4, 0.2], [4.8, 0], [-1.2, -0.3]].map(([x, dz], i) => person(g, i % 3 === 2 ? { ...LOOKS_SB_ARCHER } : 'sambyeolcho', x, WZ + dz * 0.5, 0));
    const kim = person(g, 'kimtongjeong', 1.2, WZ - 0.2, 0);
    const sb = [kim, ...men];
    sb.forEach(p => { p.position.y = WALL; setStyle(p, 'guard'); });
    const sbFlags = [-9, 9].map(x => { const f = new THREE.Group(); f.position.set(x, WALL, WZ); BLD.banner(f, { color: 0x3a2f2a, h: 2.6 }); g.add(f); return f; });
    // 바닷가에 닿은 연합군 배와, 내려서 늘어선 연합군(앞에 고려 관군 보병, 양옆에 몽골 기마병)
    const fleet = [];
    for (let i = 0; i < 6; i++) fleet.push(boatWith(g, -14 + i * 5.6, 26 + (i % 2) * 2.5, [], 1.4, i % 2 ? 'mongol' : 'villager'));
    fleet.forEach(({ b }) => { b.rotation.y = Math.PI; });
    const allies = host(g, { x: 0, z: 14, ry: Math.PI, general: 'goryeoCommander', generalOnFoot: true, banner: 0xb8452f, bannerText: '여몽 연합군', bearerLook: 'soldier', front: 'infantry',
      infantry: { n: 14, cols: 7, gap: 1.7, looks: ['soldier', 'archer', 'soldier'] }, cavalry: { n: 4, cols: 4, gap: 3.4, looks: ['mongolArcher', 'mongolLancer'] } });
    const wingL = host(g, { x: -12, z: 13, ry: Math.PI + 0.2, general: 'mongolGeneral', banner: 0x2a2a2e, bannerText: '여몽 연합군', cavalry: { n: 4, cols: 2, gap: 3.0, looks: ['mongolArcher', 'mongol'] } });
    const wingR = host(g, { x: 12, z: 13, ry: Math.PI - 0.2, cavalry: { n: 4, cols: 2, gap: 3.0, looks: ['mongolLancer', 'mongolArcher'] } });
    const allUnits = [...allies.units, ...wingL.units, ...wingR.units], riders = [...allies.riders, ...wingL.riders, ...wingR.riders];
    const offPatrol = patrol(world, riders);
    sb.forEach(p => face(p, p.position.x, p.position.z + 10)); // 성 위에서 바다 쪽(연합군)을 본다
    allies.foot.forEach(p => face(p, p.position.x, p.position.z - 10)); // 연합군 보병은 흙성 쪽을 본다
    hook.allyFlags = 0; g.traverse(o => { if (o.userData.text === '여몽 연합군') hook.allyFlags += 1; });
    hook.phases.push('standoff');
    const zSB = Math.max(...men.map(p => p.position.z)), zAL = Math.min(...allies.foot.map(p => p.position.z));
    hook.gap = zAL - zSB; hook.few = men.length;
    hook.onWall = men.filter(p => Math.abs(p.position.y - WALL) < 0.01).length;
    hook.facingAllies = men.filter(p => Math.cos(p.rotation.y) > 0.9).length / men.length;
    hook.facing = (men.filter(p => Math.cos(p.rotation.y) > 0.9).length + allies.foot.filter(p => Math.cos(p.rotation.y) < -0.9).length) / (men.length + allies.foot.length);
    cam([-24, 7, 18], [0, 1.4, 6]); // 연합군 왼쪽 날개 바깥 높은 곳에서: 흙성 위의 삼별초와 그 앞에 늘어선 연합군을 함께(얼굴이 보이게)
    await fadeIn();
    await say(L[0], kim);
    ctx.dialogue.close();
    // 연합군이 흙성 앞까지 나아가고, 장수가 칼을 들어 공격을 명한다
    hook.phases.push('advance');
    command(allies.general); command(wingL.general);
    const foot0 = allies.foot.map(p => p.position.z);
    await Promise.all([advance(world, allies.foot, 0, -(zAL - WZ - 2.2), 3.2), glide([-24, 7, 18], [0, 1.4, 6], [-22, 5.5, 9], [0, 1.2, 3.5], 3.2)]); // 보병이 흙성 앞까지(기마병은 뒤에서 지켜본다)
    hook.advanced = foot0[0] - allies.foot[0].position.z;
    // 성벽을 치면 흙덩이가 흔들리다가 가운데부터 무너져 내리고, 성 위의 삼별초는 쓰러진다
    for (let hit = 0; hit < 3; hit++) {
      ctx.audio?.play?.(hit === 2 ? 'boom' : 'whoosh');
      await wait(world, 0.6, k => { for (const c of chunks) c.m.position.z = WZ + Math.sin(k * Math.PI) * 0.05 * (Math.abs(c.x) < 7 ? 1 : 0.4); allies.foot.forEach((p, i) => { p.position.z += Math.sin(k * Math.PI * 2) * 0.01 * (i % 2 ? 1 : -1); }); });
    }
    hook.phases.push('collapse');
    ctx.audio?.play?.('boom');
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const c of chunks) { c.t0 = Math.abs(c.x) * 0.06 + (ROWS - 1 - c.row) * 0.1 + rnd() * 0.2; c.v.set((rnd() - 0.5) * 1.2, 0.4 + rnd(), -0.6 - rnd() * 1.6); c.w.set((rnd() - 0.5) * 4, (rnd() - 0.5) * 2, (rnd() - 0.5) * 4); }
    hook.collapsed = true; hook.crumbled = 0; hook.defeated = 0;
    const falls = sb.map((p, i) => wait(world, 0.3 + (i % 3) * 0.2).then(() => { const y0 = p.position.y; return Promise.all([wait(world, 0.5, k => { p.position.y = y0 * (1 - k * k); }), fallDown(world, p, { side: i % 2 ? 1 : -1, sec: 2.4 })]); }).then(() => { if (p !== kim) hook.defeated += 1; }));
    await wait(world, 3.0, (k, dt) => {
      const t = k * 3.0;
      for (const c of chunks) {
        if (t < c.t0) continue;
        if (!c.moving) { c.moving = true; hook.crumbled++; }
        c.v.y -= 9.8 * dt; c.m.position.addScaledVector(c.v, dt);
        const floor = 0.25 + 0.2 * ((c.row + Math.round(c.x * 3)) % 2);
        if (c.m.position.y < floor) { c.m.position.y = floor; c.v.multiplyScalar(0.2); c.v.y = 0; c.w.multiplyScalar(0.3); }
        c.m.rotation.x += c.w.x * dt; c.m.rotation.y += c.w.y * dt; c.m.rotation.z += c.w.z * dt;
      }
      sbFlags.forEach((f, i) => { f.position.y = Math.max(0, WALL - t * t * 2); f.rotation.z = (i ? 1 : -1) * Math.min(1.4, t * 0.9); });
    });
    await Promise.all(falls);
    hook.sunk = sunk(allUnits, () => 0);
    { let m = 9; const vis = allUnits.filter(u => u.visible); for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) m = Math.min(m, Math.hypot(vis[i].position.x - vis[j].position.x, vis[i].position.z - vis[j].position.z) / (vis[i].userData.horse || vis[j].userData.horse ? 1.7 : 1)); hook.minGap = m; }
    hook.mongols = riders.length + 2; hook.mongolRiders = riders.length + 1;
    hook.fleet = fleet.length;
    await say(L[1]);
    offPatrol();
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
