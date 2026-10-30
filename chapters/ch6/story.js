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
    await say(L[1]); hook.phases.push('advance'); // 연출이라는 안내(사실과 나눈다)
    ctx.dialogue.close();
    command(allies.general); command(wingL.general);
    const front = allies.foot.slice(0, 7);
    await Promise.all([
      advance(world, allies.units, 0, -9.5, 4.2, { ground: groundAt }),
      advance(world, wingL.units, 3, -7, 4.6, { ground: groundAt }),
      advance(world, wingR.units, -3, -7, 4.6, { ground: groundAt }),
      volley(world, g, men, front, 3), // 삼별초 궁수들이 활을 쏜다(화살은 앞에서 막는다)
      glide([16, 6.5, 2], [0, 1.2, 10], [9, 3.6, -5], [0, 1.4, 4], 4.2),
    ]);
    // ③ 대치와 전투: 흙성을 사이에 두고 창으로 찌르고 막는다(앞줄끼리 마주 본다)
    const pairs = front.slice(0, 5).map(a => { const d = men.slice(0, 7).reduce((b, p) => (Math.abs(p.position.x - a.position.x) < Math.abs(b.position.x - a.position.x) ? p : b)); return [a, d]; });
    for (const [a, d] of pairs) { face(a, d.position.x, d.position.z); face(d, a.position.x, a.position.z); }
    hook.phases.push('clash');
    for (let n = 0; n < 2; n++) {
      await Promise.all(pairs.map(([a, d], i) => (async () => { await wait(world, 0.15 * i); await Promise.all([strike(a, 'spear'), (async () => { await wait(world, 0.18); await block(d, 0.6); })()]); })()));
      await Promise.all(pairs.map(([a, d], i) => (async () => { await wait(world, 0.1 * i); await Promise.all([strike(d, 'spear'), (async () => { await wait(world, 0.18); await block(a, 0.6); })()]); })()));
    }
    hook.weaponsFacing = pairs.every(([a, d]) => Math.cos(a.rotation.y - Math.atan2(d.position.x - a.position.x, d.position.z - a.position.z)) > 0.9);
    // ④ 방어선이 무너진다: 앞줄 몇이 쓰러지고(잠시 누웠다 사라진다), 나머지는 물러서며, 깃발이 넘어간다. 연합군이 흙성을 넘는다
    hook.phases.push('collapse');
    const fallen = pairs.slice(0, 3).map(([, d]) => d);
    const rest = men.filter(p => !fallen.includes(p));
    rest.forEach(p => face(p, p.position.x, p.position.z - 10));
    await Promise.all([
      wait(world, 0.8, k => { fallen.forEach(p => { p.rotation.order = 'YXZ'; p.rotation.x = -1.45 * k * k; }); flags.forEach((f, i) => { f.rotation.z = (i % 2 ? 1 : -1) * 1.4 * Math.min(1, k * 1.3); }); }),
      march(world, rest, 0, -6, 2.6),
      advance(world, [...allies.foot, allies.general, allies.bearer], 0, -4.2, 2.4, { ground: groundAt }), // 장수와 깃발도 함께 흙성으로
    ]);
    await wait(world, 0.8);
    fallen.forEach(p => { p.visible = false; });
    rest.forEach(p => { p.visible = false; }); // 물러난 군사들은 성 안쪽 멀리로
    kim.visible = false;
    // ⑤ 싸움이 끝난 뒤: 흙성 위에 연합군 깃발, 장수와 군사들이 선다
    hook.phases.push('after');
    const won = [-6, 6].map(x => { const f = new THREE.Group(); f.position.set(x, WALL, WZ); BLD.banner(f, { color: x < 0 ? 0xb8452f : 0x2a2a2e, h: 2.8 }); g.add(f); return f; });
    await glide([9, 3.6, -5], [0, 1.4, 4], [-6, 4.2, -9], [0, 1.6, 4], 2.2);
    hook.mongols = riders.length + 2; hook.mongolRiders = riders.length + 1; // 연합군 가운데 몽골군은 기마병 중심(걸어가는 몽골 병사는 없다)
    hook.sunk = sunk(allUnits, groundAt);
    { let m = 9; const vis = allUnits.filter(u => u.visible); for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) m = Math.min(m, Math.hypot(vis[i].position.x - vis[j].position.x, vis[i].position.z - vis[j].position.z) / (vis[i].userData.horse || vis[j].userData.horse ? 1.7 : 1)); hook.minGap = m; }
    hook.fleet = fleet.length; hook.flags = won.length;
    await say(L[2]);
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
