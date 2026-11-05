// 2장 이야기 장면(D-58): 흥화진을 지켜 낸 뒤 양규가 군사를 이끌고 거란군이 차지한 곽주를 되찾는다.
// 해 질 녘 곽주 성문 앞: 고려군이 성문을 열고 들어가 거란 깃발이 고려 깃발로 바뀌고, 갇혀 있던 백성들이 성문 밖으로 나와 기뻐한다(얼굴이 보이게, D-45).
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { gateLeaves, nameBoard } from '../kit/gate.js';
import { storyScene, person, wait, march, face, troop, facingShare } from '../kit/story.js';
import { melee } from '../kit/clash.js';
import { mat } from '../../core/people.js';
import { setStyle } from '../../core/motion.js';
import script from './script.js';
import { host, advance } from '../kit/army.js';
import { LOOKS } from '../../content/characters.js';

export const GWAKJU = { origin: [400, 0], ground: 'earth', groundColor: 0xdfe2e6, hill: 0.8, bounds: { x0: -16, x1: 16, z0: -10, z1: 14 }, edge: { style: 'forest', back: false, sides: false } };

// 곽주성(D-62, 2026-10-31 선생님: 완성된 성의 모습, 군대가 벽을 뚫고 들어가지 않게 큰 성문, 백성은 천천히 나온다):
// 홍예 성문과 2층 문루(cityGate) → 양옆 높은 성벽과 여장 → 모서리 치(네모난 돌출 망대) → 뒤로 꺾여 들어가는 옆 성벽, 성안 관아 지붕.
const GATE_SCALE = 1.4, GATE_HALF = BLD.GATE.R * GATE_SCALE, GATE_Z = -6, GATE_D = BLD.GATE.D * GATE_SCALE;
function gwakjuCastle(g) {
  const gz = GATE_Z, wallH = 5.4, stone = 0x8c8577;
  const gate = new THREE.Group(); gate.position.set(0, 0, gz); gate.scale.setScalar(GATE_SCALE); g.add(gate); BLD.cityGate(gate, {});
  const halfW = BLD.GATE.W * GATE_SCALE / 2, cx = 19;
  const box = (w, h, d, x, y, z, color = stone) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, 'stone')); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  for (const sx of [-1, 1]) {
    const len = cx - halfW, mid = sx * (halfW + len / 2);
    box(len, wallH, 2.2, mid, wallH / 2, gz); // 앞 성벽
    for (let x = halfW + 0.5; x < cx - 1.4; x += 1.25) box(0.75, 0.6, 0.45, sx * x, wallH + 0.3, gz + 0.9, 0x9c958a); // 여장
    box(3.6, wallH + 1.2, 3.6, sx * cx, (wallH + 1.2) / 2, gz + 0.5); // 모서리 치(돌출 망대)
    for (const [dx, dz] of [[-1.3, 1.3], [0, 1.3], [1.3, 1.3], [1.3, 0], [-1.3, 0]]) box(0.7, 0.6, 0.7, sx * cx + dx, wallH + 1.5, gz + 0.5 + dz, 0x9c958a);
    box(2.2, wallH, 24, sx * cx, wallH / 2, gz - 12.5); // 뒤로 꺾여 들어가는 옆 성벽
    for (let z = gz - 2; z > gz - 24; z -= 1.25) box(0.45, 0.6, 0.75, sx * (cx + 0.9), wallH + 0.3, z, 0x9c958a);
  }
  box(cx * 2, wallH, 2.2, 0, wallH / 2, gz - 24.5); // 뒷 성벽
  // 성안 관아: 성벽 위로 기와지붕이 보인다
  for (const [x, z, w, d, h] of [[-8, -17, 9, 5, 4.2], [7, -19, 8, 5, 4.6], [0, -24, 10, 6, 5.4]]) {
    box(w - 1, h, d - 1, x, h / 2, z, 0xb8ad98);
    BLD.curvedHipRoof(g, w, d, 1.4, 0x3d4846, x, h, z);
  }
  return { towers: 2, gatehouse: true, enclosed: true, gateWidth: GATE_HALF * 2 };
}

export function gwakjuScene(ctx) {
  const L = script.gwakju;
  return storyScene(ctx, { key: 'gwakju', arena: GWAKJU, mood: 'winterDusk', async run({ g, hook, cam, glide, say, people, fadeIn }) {
    const { world } = ctx;
    Object.assign(hook, gwakjuCastle(g));
    const front = GATE_Z + GATE_D / 2, back = GATE_Z - GATE_D / 2;
    const gate = gateLeaves(g, { x: 0, z: front - 0.1, width: GATE_HALF * 2, height: (BLD.GATE.SPRING + 0.4) * GATE_SCALE, inward: -1 });
    nameBoard(g, '곽주', GATE_HALF + 2.2, front + 0.9);
    // 성 위 깃발: 처음엔 거란 깃발(검은빛), 되찾으면 고려 깃발(붉은빛)
    const flags = [-15, -9, 9, 15].map(x => { const f = new THREE.Group(); f.position.set(x, 5.4, GATE_Z); BLD.banner(f, { color: 0x2e2a26, h: 3 }); g.add(f); return f; });
    const recolor = c => flags.forEach(f => f.traverse(m => { if (m.isMesh && m.geometry.type === 'PlaneGeometry') { m.material = m.material.clone(); m.material.color.setHex(c); } }));
    // 성 밖 고려군과 앞장선 양규: 세 줄 종대(성문 너비 안)
    const yg = person(g, 'yanggyu', -0.4, 3.2, Math.PI);
    const army = troop(g, ['soldier', 'archer', 'soldier'], 0, 6, { cols: 3, rows: 3, gap: 1.15, ry: Math.PI, jitter: 0.15 });
    cam([7, 8.5, 27], [0, 4, -5]); // 높이서 내려다봐 군사 너머로 성문·문루와 성벽이 다 보이게
    await fadeIn();
    await say(L.lines[0]);
    await say(L.lines[1], yg);
    ctx.dialogue.close();
    ctx.audio?.play?.('whoosh');
    await wait(world, 1.2, k => gate.setOpen(k));
    hook.open = true;
    // 성문으로만 들어간다: 문길(앞면~뒷면) 안에서 성문 너비 밖으로 나간 사람을 센다(테스트)
    const marchers = [yg, ...army]; hook.throughWall = 0;
    const off = world.onUpdate(() => { for (const p of marchers) if (p.visible && p.position.z < front + 0.2 && p.position.z > back - 0.2 && Math.abs(p.position.x) > GATE_HALF - 0.35) hook.throughWall++; });
    await march(world, marchers, 0, -(Math.max(...marchers.map(p => p.position.z)) - back + 1.5), 7);
    off();
    marchers.forEach(p => { p.visible = false; }); // 성안으로 들어갔다
    recolor(0x8a2f24); hook.flag = 'goryeo';
    ctx.audio?.play?.('correct');
    // 갇혀 있던 백성들이 성문 밖으로 천천히(지친 걸음) 걸어 나온다
    const spots = [[-2.4, front + 1.6], [-0.8, front + 2.2], [0.9, front + 1.8], [2.4, front + 2.4], [-1.6, front + 3.4], [1.5, front + 3.6]];
    const folk = spots.map(([x, z], i) => { const p = person(g, i === 5 ? 'kid' : 'villager', x * 0.55, back - 0.5 - (i % 3) * 0.8, 0); setStyle(p, 'weary'); return p; });
    hook.folkSpeed = 0; const last = folk.map(p => p.position.clone());
    const off2 = world.onUpdate(dt => { if (!(dt > 0)) return; folk.forEach((p, i) => { hook.folkSpeed = Math.max(hook.folkSpeed, Math.hypot(p.position.x - last[i].x, p.position.z - last[i].z) / dt); last[i].copy(p.position); }); });
    const outs = folk.map((p, i) => { const dx = spots[i][0] - p.position.x, dz = spots[i][1] - p.position.z; return march(world, [p], dx, dz, Math.hypot(dx, dz) / 1.0); }); // 1초에 약 1m(지친 걸음)
    glide([7, 8.5, 27], [0, 4, -5], [0.6, 2.8, front + 13], [0, 1.6, front + 2], 4);
    await Promise.all(outs);
    off2();
    folk.forEach(p => { face(p, 0.6, front + 13); setStyle(p, null); });
    people.push(...folk);
    hook.facing = facingShare(world, folk);
    await say(L.lines[2], folk[1]);
    await say(L.lines[3]);
    hook.freed = folk.length;
  } });
}

// 2장 끝 해설 장면(D-58 → D-62, 2026-10-31 선생님): 현종이 거란에 직접 찾아가겠다고 약속하자 웅장한 거란 대군이
// 고려군 반대쪽(북쪽)으로 돌아서 물러가고, 양규와 적은 군사가 그 뒤를 쫓아 나간다. 양규의 대사 없이 해설 두 줄로 맺는다.
// 북쪽(z0 -40)까지 걷는 땅: 물러가는 대군이 끝까지 가도 평평한 땅을 밟는다(2026-11-03, 예전 -20은 언덕에 발이 묻힘)
export const LAST = { origin: [400, 0], ground: 'earth', groundColor: 0xdfe2e6, hill: 1, bounds: { x0: -24, x1: 24, z0: -40, z1: 14 }, edge: { style: 'forest', back: false } };
export function lastStandScene(ctx) {
  const L = script.result;
  return storyScene(ctx, { key: 'lastStand', arena: LAST, mood: 'snow', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 거란 대군: 앞에 보병, 뒤에 기마병, 왕기(검은 깃발). 처음엔 고려군(남쪽, +z) 쪽을 보고 서 있다
    const K = host(g, { x: 0, z: -6, ry: 0, front: 'infantry', general: { ...LOOKS.khitan, robe: 0x7a5a24, trim: 0xd9a441, hat: 'fur', gear: 'sword', named: true }, banner: 0x2e2a26, bearerLook: 'khitan',
      infantry: { looks: ['khitan', 'khitanBright', 'khitan'], n: 40, cols: 10, gap: 1.4, depth: 1.5 },
      cavalry: { looks: ['khitan'], n: 12, cols: 6, gap: 2.6, coats: [0x6b4a32, 0x3a2e26, 0x8a6a4a] } });
    for (let i = 0; i < 3; i++) { const f = new THREE.Group(); f.position.set(-9 + i * 9, 0, -9.5 - (i % 2) * 2); BLD.banner(f, { color: 0x2e2a26, h: 3.6 }); g.add(f); K.units.push(f); }
    // 남쪽 언덕 위 양규와 적은 고려군(카메라 앞)
    const yg = person(g, 'yanggyu', 1.2, 9, Math.PI);
    const few = [[-0.6, 10.2], [2.8, 10.4], [0.4, 11.6], [3.6, 9], [-1.8, 9.2]].map(([x, z], i) => person(g, i === 3 ? 'archer' : 'soldier', x, z, Math.PI));
    hook.goryeo = [yg, ...few]; // 고려군끼리 몸이 겹치지 않는지 테스트가 잰다
    const gflag = new THREE.Group(); gflag.position.set(2, 0, 11.8); BLD.banner(gflag, { color: 0x8a2f24, h: 3.6 }); g.add(gflag);
    cam([5, 7.5, 22], [0, 1.2, -6]); // 고려군 너머로 거란 대군 전체가 보이게
    await fadeIn();
    await say(L[0]);
    ctx.dialogue.close();
    // 대군이 돌아서(고려군 반대쪽) 북쪽으로 물러간다. 카메라는 높이 올라 대열 전체를 담는다.
    // 맨 뒤(고려군 쪽) 보병 다섯은 뒤를 지키느라 남는다: 양규와 군사들이 따라잡아 짝지어 맞붙는다(D-65, 2026-11-03 선생님)
    const yg0 = yg.position.clone();
    const guard = K.units.filter(u => u.userData.arms).sort((p, q) => q.position.z - p.position.z).slice(0, 5).sort((p, q) => p.position.x - q.position.x);
    const goers = K.units.filter(u => !guard.includes(u));
    const c0 = goers.map(u => u.position.clone());
    const away = advance(world, goers, 0, -30, 10, { stagger: 0.35 });
    await glide([5, 7.5, 22], [0, 1.2, -6], [-4, 13, 20], [0, 0, -18], 5);
    // 양규와 군사들이 물러가는 거란군 뒤를 쫓아가 뒤를 지키던 거란군과 짝지어 맞붙는다(창으로 찌르고 막고 되받아친다)
    guard.forEach(u => { u.rotation.y = 0; });
    const fighters = [yg, ...few.slice(0, 4)].sort((p, q) => p.position.x - q.position.x);
    const fight = melee(world, fighters.map((a, i) => ({ a, b: guard[i] })), { approach: 2.6, lose: 0.5, flee: [0, -1], seed: 3 });
    march(world, [gflag], 0, -6, 2.6);
    hook.melee = fight.hook;
    await glide([-4, 13, 20], [0, 0, -18], [7, 3.2, 4], [0, 1.4, -6], 2.6);
    await Promise.all([away, fight.done]);
    hook.feet = K.units.filter(u => u.visible).map(u => [u.position.x, u.position.z]); // 물러난 자리(발이 언덕에 묻히지 않는지 테스트가 본다)
    const mv = goers.reduce((a, u, i) => a.add(u.position.clone().sub(c0[i])), new THREE.Vector3()).normalize();
    const toK = new THREE.Vector3(0, 0, -6).sub(yg0).setY(0).normalize();
    hook.away = mv.dot(toK); // 1이면 고려군에서 멀어지는 쪽으로 곧게
    hook.retreated = goers.filter(u => u.userData.person || u.userData.legs).length;
    await lastStand(ctx, { g, hook, cam, glide, fadeIn, yg, few, hide: [...K.units, gflag] });
    await say(L[1]);
    hook.flag = true;
  } });
}

// 양규의 마지막 싸움(2026-11-05 선생님): 물러가는 거란군을 쫓다 거란 대군에 둘러싸인다. 화면을 바꿔(어두워졌다 밝아짐)
// 눈밭 한가운데 양규와 군사 둘을 거란군이 둥글게 에워싸고, 양규는 앞의 적을 쓰러뜨리며 버티다 무릎을 꿇고 쓰러진다(피 없음, 쓰러진 채 남는다).
const STAND = [0, -16]; // 무대 안 평평한 곳
async function lastStand(ctx, { g, hook, cam, glide, fadeIn, yg, few, hide }) {
  const { world } = ctx, [cx, cz] = STAND;
  await ctx.fade?.(true);
  for (const u of [...hide, ...few]) u.visible = false;
  const reset = p => { p.visible = true; p.rotation.set(0, 0, 0); p.rotation.order = 'YXZ'; };
  reset(yg); yg.position.set(cx, 0, cz); yg.rotation.y = 0; // 카메라(남쪽, +z)를 본다
  const mates = few.slice(0, 2); mates.forEach((p, i) => { reset(p); p.position.set(cx + (i ? 1.6 : -1.6), 0, cz - 0.6); p.rotation.y = i ? 0.9 : -0.9; });
  // 둘레의 거란군: 카메라 쪽(남쪽) 틈만 남기고 둥글게
  const ring = [];
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.36 + 1.28 * i / 15) + Math.PI / 2, r = 5.2 + (i % 3) * 0.7; // 남쪽(카메라 쪽, +z)을 가운데로 0.36π씩 비우고 북쪽을 두른다
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    ring.push(person(g, i % 4 === 1 ? 'khitanBright' : 'khitan', x, z, Math.atan2(cx - x, cz - z)));
  }
  hook.surround = ring.length;
  // 앞의 적 둘이 양규에게, 하나씩 군사에게 달려든다
  const near = (x, z) => ring.slice().sort((p, q) => Math.hypot(p.position.x - x, p.position.z - z) - Math.hypot(q.position.x - x, q.position.z - z))[0];
  const foeY = near(cx - 1.2, cz - 4), foeA = near(cx - 4, cz - 1), foeB = near(cx + 4, cz - 1);
  cam([cx + 3.2, 2.6, cz + 8], [cx, 1.3, cz - 1]);
  await fadeIn();
  const fight = melee(world, [{ a: yg, b: foeY }, { a: mates[0], b: foeA }, { a: mates[1], b: foeB }], { approach: 1.4, lose: 1, flee: false, chase: 0, counter: 1, seed: 7 });
  const tighten = wait(world, 3.2, k => { for (const p of ring) if (p !== foeY && p !== foeA && p !== foeB) { const d = Math.hypot(p.position.x - cx, p.position.z - cz); if (d > 3.6) { p.position.x += (cx - p.position.x) / d * 0.012; p.position.z += (cz - p.position.z) / d * 0.012; } } });
  await glide([cx + 3.2, 2.6, cz + 8], [cx, 1.3, cz - 1], [cx + 1.6, 2, cz + 5.5], [cx, 1.2, cz - 1], 3.4);
  await Promise.all([fight.done, tighten]);
  hook.last = fight.hook;
  // 무릎을 꿇었다가 옆으로 쓰러진다(사라지지 않는다)
  yg.userData.manual = true; yg.rotation.y = 0.3;
  await wait(world, 1.4, k => { yg.position.y = -0.35 * Math.min(1, k * 2); yg.rotation.x = 0.35 * Math.min(1, k * 2); });
  await wait(world, 1, k => { const e = k * k * (3 - 2 * k); yg.rotation.z = -Math.PI / 2 * e; yg.position.y = -0.35 * (1 - e); yg.rotation.x = 0.35 * (1 - e); });
  await wait(world, 1.2);
  hook.fallen = Math.abs(yg.rotation.z) > 1.4; hook.fallenVisible = yg.visible;
}
