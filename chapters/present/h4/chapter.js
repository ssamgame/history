// 현대편 4장 「1·4 후퇴와 정전 협정」(D-51): 1951년 1월 초 눈 내리는 서울 가까운 마을(짐 보따리, 군용 트럭, 판잣집).
// 「피란길」 문으로 들어와 국군 병사·유엔군 병사·이웃 할아버지 이야기를 아무 차례로 듣고(모두 들어야 피란민 어머니),
// 어머니에게 가면 학생의 결심 → 눈 내리는 마을 길로 국군과 유엔군이 남쪽으로 물러난다 →
// ① 피란 보따리 꾸리기(마당 살림 가운데 꼭 필요한 것만), 끝에 얼어붙은 강을 건너는 피란 행렬
// ② 유엔군 병사에게 말을 걸면 휴전선 긋기(양쪽 군대가 맞선 곳에 말뚝)와 판문점 천막의 정전 협정.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite, toast } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, sayer, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { waitInteract } from '../../../core/portal.js';
import { mat, setCarry } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['soldier', 'unSoldier', 'grandpa'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const CHINA = { ...LOOKS.nkSoldier, robe: 0x6a6a52, hat: 'cap' }; // 중국군(누빈 겨울 군복)
const blk = (g, w, h, d, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const ring = (g, x, z, r = 0.9) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.09, z); m.visible = false; g.add(m); return m; };
const bundle = (color = 0x8a5a6a, s = 1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.62 * s, 0.42 * s, 0.5 * s), mat(color, 'cloth', 'object')); m.castShadow = true; return m; };
// 보따리를 머리에 이거나 등에 진다
const headLoad = (p, color) => { const b = bundle(color, 0.9); b.position.set(0, 2.02, 0); p.add(b); return b; };

// ── 무대(마을에서 떨어진 x 400) ──
// 마을 길(탐험 끝 장면): 북쪽에서 남쪽(카메라)으로 트럭과 병사들이 물러나고, 길가에서 마을 사람들이 지켜본다
export const ROAD = { edge: { style: 'snow', seed: 1951 },
  origin: [400, 0], ground: 'earth', groundColor: 0xcdd3da, bounds: { x0: -14, x1: 14, z0: -20, z1: 12 },
  roads: [{ x: 0, z: -4, w: 6, d: 34, color: 0xb8b4aa }],
  props: [
    { type: 'hanok', x: -10, z: -6, ry: Math.PI / 2 }, { type: 'hanok', x: 10, z: -10, ry: -Math.PI / 2, tile: true }, { type: 'shack', x: 10.5, z: 2 },
    { type: 'tree', x: -9, z: 6, kind: 'bare' }, { type: 'tree', x: 8, z: -18, kind: 'bare' }, { type: 'woodpile', x: -11, z: 2 },
  ],
  watch: [-6, 6],
};
// 마당(보따리 꾸리기): 북쪽에 집, 마당에 살림을 꺼내 놓은 멍석
export const YARD = { edge: { style: 'snow', seed: 414 },
  origin: [400, 0], ground: 'earth', groundColor: 0xcdd3da, bounds: { x0: -9, x1: 9, z0: -7, z1: 9 },
  props: [{ type: 'hanok', x: 0, z: -11, tile: true }, { type: 'jars', x: -8, z: -6 }, { type: 'tree', x: 8, z: 7, kind: 'bare' }, { type: 'woodpile', x: 8.5, z: -5 }],
  from: [0, 7], pile: [0, 1.5],
  spots: [[-5.5, -3], [-1.8, -4], [1.8, -4], [5.5, -3], [-5.5, 2.5], [5.5, 2.5]],
};
// 얼어붙은 강(보따리 꾸리기 끝): 북쪽 기슭에서 남쪽 기슭(카메라)으로 피란민 행렬이 건너온다
export const ICE = { edge: { style: 'snow', seed: 104 },
  origin: [400, 0], ground: 'earth', groundColor: 0xd2d8de, bounds: { x0: -12, x1: 12, z0: -14, z1: 12 },
  props: [{ type: 'tree', x: -10, z: 9, kind: 'bare' }, { type: 'tree', x: 10, z: -12, kind: 'bare' }],
  ice: [0, -2, 60, 12],
};
// 휴전선 긋기: 동서로 구불구불한 전선을 사이에 두고 남쪽에 국군·유엔군, 북쪽에 북한군·중국군. 남쪽 끝에 판문점 천막
export const FRONT = { edge: { style: 'forest', seed: 1953 },
  origin: [400, 0], ground: 'grass', groundColor: 0x7a8a5a, bounds: { x0: -18, x1: 18, z0: -10, z1: 14 },
  props: [{ type: 'tent', x: 0, z: 13.6, color: 0x9a9a8a, solid: false }, { type: 'flagpole', x: -3.4, z: 12.4, color: 0x5b92e5 }, { type: 'tree', x: -16, z: -8, kind: 'pine' }, { type: 'tree', x: 16, z: 9, kind: 'pine' }],
  from: [0, 6], stakes: [[-12, 0.6], [0, -1.2], [12, 0.8]],
};

// ── 탐험 끝 장면: 눈 내리는 마을 길로 국군과 유엔군이 남쪽으로 물러나고, 마을 사람들이 짐을 들고 지켜본다 ──
export async function retreatScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.retreat.lines, A = ROAD, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const truck = new THREE.Group(); g.add(truck); truck.position.set(2.4, 0, -24);
  BUILD.truck(truck, { color: 0x55603f });
  const march = Array.from({ length: 10 }, (_, i) => person(g, i % 3 === 2 ? 'unSoldier' : 'rokSoldier', -1.4 + (i % 2) * 1.2, -16 - Math.floor(i / 2) * 1.6, 0));
  const folk = [[-5.4, -9, 'grandma'], [-5.8, -6.6, 'woman'], [-5.2, -4, 'citizen'], [5.2, -8, 'peasant'], [5.6, -5.4, 'woman'], [5.2, -3, 'kidModern']]
    .map(([x, z, look]) => { const p = person(g, look, x, z, 0); face(p, 0, z + 1.5); headLoad(p, [0x8a5a6a, 0x5a6a8a, 0x7a6a4a][Math.round(Math.abs(x + z)) % 3]); return p; });
  const hook = ctx.testHooks.retreat = { soldiers: march.length, passed: 0, folk: folk.length, facing: 0 };
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], Math.PI * 0.9);
  const C = a.at(0.8, 11), T = a.at(0, -5);
  const front = () => world.setFixedCamera([C.x, 3, C.z], [T.x, 1.3, T.z]); // 길 남쪽에서 다가오는 행렬의 얼굴을 본다
  try {
    front();
    await ctx.fade?.(false);
    const m0 = march.map(p => p.position.z), t0 = truck.position.z;
    const go = wait(world, 6, k => { truck.position.z = t0 + 21 * k; march.forEach((p, i) => { p.position.z = m0[i] + 20 * k; }); });
    await dialogue.say(L[0]);
    await go;
    hook.passed = march.filter(p => p.position.z > -4).length;
    hook.facing = facingShare(world, march);
    dialogue.close();
    await say(L[1], march[0]);
    dialogue.close();
    front();
    await say(L[2], folk[1]);
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    a.dispose();
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

async function leaveArena(ctx, a) {
  const { world, hud } = ctx;
  await ctx.fade?.(true);
  hud.setCounter(null); world.setGoal(null);
  setCarry(world.player, null);
  a.dispose();
  placePlayer(world, SPOT);
  world.camMode = 'follow'; world.snapCamera();
  ctx.input.enabled = false;
  await ctx.fade?.(false);
}

// 살림 모양
function itemMesh(id) {
  const g = new THREE.Group();
  if (id === 'rice') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.8, 8), mat(0xd8c8a0, 'cloth')); m.position.y = 0.4; g.add(m); }
  if (id === 'quilt') { blk(g, 1.1, 0.4, 0.8, 0xb8505a, 0, 0.2, 0, 'cloth'); blk(g, 1.1, 0.12, 0.8, 0xe8e0d0, 0, 0.46, 0, 'cloth'); }
  if (id === 'chest') { blk(g, 1.8, 1.9, 0.7, 0x6b4a32, 0, 0.95, 0); blk(g, 0.04, 1.6, 0.02, 0xc8a050, 0, 1, 0.36); }
  if (id === 'clothes') { blk(g, 0.8, 0.3, 0.6, 0x4a5a7a, 0, 0.15, 0, 'cloth'); blk(g, 0.7, 0.2, 0.5, 0x7a5a4a, 0, 0.4, 0, 'cloth'); }
  if (id === 'jar') { const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), mat(0x5a3a28, 'stone')); m.scale.y = 1.2; m.position.y = 0.8; g.add(m); }
  if (id === 'pot') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.32, 10), mat(0x3a3a3a, 'stone')); m.position.y = 0.16; g.add(m); }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}

// ── 놀이 ①: 피란 보따리 꾸리기. 마당 살림마다 가져갈지 두고 갈지 고르고, 다 꾸리면 얼어붙은 강을 건넌다 ──
export async function packPlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.pack, A = YARD;
  world.closeView = true;
  await ctx.fade?.(true);
  let a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.pack = { taken: [], left: [], wrong: 0, crossed: false, family: 0, facing: 0 };
  // 마당 멍석과 보따리 보자기
  const mat0 = new THREE.Mesh(new THREE.PlaneGeometry(14, 9).rotateX(-Math.PI / 2), mat(0xb89a6a, 'grain')); mat0.position.set(0, 0.03, -0.6); g.add(mat0);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8).rotateX(-Math.PI / 2), mat(0x8a5a6a, 'cloth')); cloth.position.set(A.pile[0], 0.05, A.pile[1]); g.add(cloth);
  const mother = person(g, 'woman', A.pile[0] + 1.6, A.pile[1] + 0.6, 0);
  const kids = [person(g, 'kidModern', A.pile[0] - 1.8, A.pile[1] + 1.4, 0), person(g, 'schoolgirl', A.pile[0] - 1.1, A.pile[1] + 2.2, 0)];
  kids.forEach(k => k.scale.setScalar(0.8));
  const items = P.items.map((it, i) => { const m = itemMesh(it.id); const [x, z] = A.spots[i]; m.position.set(x, 0, z); g.add(m); const lab = labelSprite(it.label, { size: 0.55 }); lab.position.set(x, 2.6, z); g.add(lab); return { it, m, lab, ring: ring(g, x, z + 1.5) }; });
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const say = sayer(ctx);
  let inPile = 0;
  try {
    await ctx.fade?.(false);
    for (const [i, o] of items.entries()) {
      hud.setCounter(`${P.counter} ${i}/${items.length}`);
      o.ring.visible = true;
      const pos = a.at(o.m.position.x, o.m.position.z + 1.5);
      await waitInteract(ctx, { pos, label: `${o.it.label} 살펴보기`, r: 1.5 });
      ctx.input.enabled = false;
      o.ring.visible = false;
      const M = a.at(o.m.position.x, o.m.position.z); world.setFixedCamera([M.x + 1.6, 2.4, M.z + 4.2], [M.x, 0.8, M.z]);
      for (;;) {
        ctx.testHooks.choice = o.it.take ? 0 : 1; // 테스트 봇이 고를 답
        const k = await dialogue.choose({ who: 'guide', text: `${o.it.label}, 어떻게 할까?` }, ['보따리에 넣는다', '두고 간다']);
        ctx.testHooks.choice = null;
        if ((k === 0) === o.it.take) break;
        hook.wrong += 1; audio.play('wrong');
        await dialogue.say(P.wrong);
      }
      await say({ who: 'mother', text: o.it.why }, mother);
      dialogue.close();
      if (o.it.take) { // 보자기 위로 옮긴다
        audio.play('tap');
        const s0 = o.m.position.clone(), to = new THREE.Vector3(A.pile[0] + (inPile % 2 - 0.5) * 0.5, 0.06 + Math.floor(inPile / 2) * 0.3, A.pile[1] + (inPile % 2 ? 0.2 : -0.2));
        await wait(world, 0.5, k => { o.m.position.lerpVectors(s0, to, ease(k)); o.m.position.y += Math.sin(k * Math.PI) * 0.8; });
        o.m.scale.setScalar(0.6); inPile += 1; hook.taken.push(o.it.id);
      } else { o.lab.material.opacity = 0.4; hook.left.push(o.it.id); }
      o.lab.visible = false;
      world.camMode = 'follow';
    }
    hud.setCounter(`${P.counter} ${items.length}/${items.length}`);
    // 보따리를 묶어 어머니는 머리에 이고, 학생은 등에 진다
    items.filter(o => o.it.take).forEach(o => { o.m.visible = false; });
    cloth.visible = false;
    headLoad(mother, 0x8a5a6a);
    setCarry(world.player, bundle(0x5a6a8a), 'back');
    toast(ctx, '○ 보따리를 다 꾸렸어요', 'good'); audio.play('correct');
    await say(P.tie[0], mother);
    dialogue.close();
    // 얼어붙은 강을 건너는 피란 행렬
    await ctx.fade?.(true);
    a.dispose();
    a = buildArena(world, ICE); g = a.group;
    const [ix, iz, iw, id] = ICE.ice;
    const ice = new THREE.Mesh(new THREE.PlaneGeometry(iw, id).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0xa8c8dc, shininess: 90 })); ice.position.set(ix, 0.05, iz); ice.receiveShadow = true; g.add(ice);
    const looks = ['grandma', 'citizen', 'woman', 'peasant', 'kidModern', 'woman', 'gentleman', 'grandma', 'citizen', 'schoolgirl', 'peasant', 'woman'];
    const line = looks.map((look, i) => { const p = person(g, look, (i % 3 - 1) * 1.6 + Math.sin(i) * 0.3, -8 - Math.floor(i / 3) * 1.8, 0); headLoad(p, [0x8a5a6a, 0x5a6a8a, 0x7a6a4a][i % 3]); return p; });
    const fam = [person(g, 'woman', 3.6, -7, 0), person(g, 'kidModern', 4.6, -6.4, 0), person(g, 'schoolgirl', 2.6, -6.2, 0)];
    fam.slice(1).forEach(k => k.scale.setScalar(0.8)); headLoad(fam[0], 0x8a5a6a);
    hook.family = fam.length;
    const S = a.at(3.4, -5.4); placePlayer(world, [S.x, S.z], 0);
    const C = a.at(0.6, 10), T = a.at(0, -3);
    const front = () => world.setFixedCamera([C.x, 2.4, C.z], [T.x, 1.2, T.z]); // 남쪽 기슭에서 건너오는 행렬의 얼굴을 본다
    front();
    await ctx.fade?.(false);
    const all = [...line, ...fam], z0 = all.map(p => p.position.z);
    const pz0 = world.player.position.z;
    const go = wait(world, 7, k => { all.forEach((p, i) => { p.position.z = z0[i] + 9 * k; }); world.player.position.z = pz0 + 9 * k; });
    await dialogue.say(P.crossing[0]);
    await go;
    hook.crossed = true;
    hook.facing = facingShare(world, all);
    await say(P.crossing[1], fam[0]);
    dialogue.close();
  } finally {
    ctx.testHooks.choice = null;
    await leaveArena(ctx, a);
  }
  return true;
}

// ── 놀이 ②: 휴전선 긋기와 정전 협정. 양쪽 군대가 맞선 곳 세 자리에 말뚝을 박아 선을 잇고, 양쪽이 물러나면 판문점 천막에서 협정 ──
export async function linePlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.line, A = FRONT;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.line = { stakes: 0, segments: 0, backed: false, dmz: false, signed: false };
  world.setMood('summer'); if (scene?.weather) scene.weather.points.visible = false; // 1953년 여름(눈이 그친다)
  // 맞선 두 군대: 말뚝 자리마다 남쪽(국군·유엔군)은 북쪽을, 북쪽(북한군·중국군)은 남쪽을 본다
  const south = [], north = [];
  A.stakes.forEach(([x, z]) => {
    for (const dx of [-1.6, 0, 1.6]) {
      south.push(person(g, dx ? 'rokSoldier' : 'unSoldier', x + dx, z + 2.6, Math.PI));
      north.push(person(g, dx ? 'nkSoldier' : CHINA, x + dx * 1.1, z - 2.8, 0));
    }
  });
  const stakeMesh = (x, z) => { const s = new THREE.Group(); s.position.set(x, 0, z); g.add(s); blk(s, 0.14, 1.4, 0.14, 0x6b4a32, 0, 0.7, 0); blk(s, 0.6, 0.36, 0.04, 0xe0b830, 0, 1.2, 0.08, 'cloth'); return s; };
  const pts = [[-17, 1.2], ...A.stakes, [17, 0.2]];
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  try {
    await ctx.fade?.(false);
    for (const l of P.start) await dialogue.say(l);
    dialogue.close();
    for (const [i, [x, z]] of A.stakes.entries()) {
      hud.setCounter(`${P.counter} ${i}/${A.stakes.length}`);
      const mk = ring(g, x, z + 1); mk.visible = true;
      await waitInteract(ctx, { pos: a.at(x, z + 1), label: `${P.stakes[i].label}에 말뚝 박기`, r: 1.5 });
      ctx.input.enabled = false;
      mk.removeFromParent();
      const s = stakeMesh(x, z);
      audio.play('tap');
      await wait(world, 0.5, k => { s.position.y = 0.8 * (1 - ease(k)); });
      hook.stakes += 1;
      // 앞 말뚝(처음에는 서쪽 끝)에서 이 말뚝까지 줄을 잇는다
      const [ax, az] = pts[i], d = Math.hypot(x - ax, z - az);
      const rope = blk(g, 0.06, 0.06, d, 0xe0b830, (ax + x) / 2, 1.0, (az + z) / 2, 'cloth'); rope.rotation.y = Math.atan2(x - ax, z - az); 
      hook.segments += 1;
      if (i === A.stakes.length - 1) { const [bx, bz] = pts.at(-1), e = Math.hypot(bx - x, bz - z); const r2 = blk(g, 0.06, 0.06, e, 0xe0b830, (bx + x) / 2, 1.0, (bz + z) / 2, 'cloth'); r2.rotation.y = Math.atan2(bx - x, bz - z); hook.segments += 1; }
      toast(ctx, `○ ${P.stakes[i].label}`, 'good');
    }
    hud.setCounter(`${P.counter} ${A.stakes.length}/${A.stakes.length}`);
    // 양쪽 군대가 선에서 물러나고, 그 사이가 비무장 지대가 된다
    const C = a.at(9, 9), T = a.at(-2, -1);
    world.setFixedCamera([C.x, 7.5, C.z], [T.x, 0, T.z]);
    const s0 = south.map(p => p.position.z), n0 = north.map(p => p.position.z);
    south.forEach(p => { p.rotation.y = 0; }); north.forEach(p => { p.rotation.y = Math.PI; });
    await wait(world, 2.2, k => { south.forEach((p, i) => { p.position.z = s0[i] + 3 * ease(k); }); north.forEach((p, i) => { p.position.z = n0[i] - 3 * ease(k); }); });
    south.forEach(p => { p.rotation.y = Math.PI; }); north.forEach(p => { p.rotation.y = 0; });
    hook.backed = true;
    const band = new THREE.Mesh(new THREE.PlaneGeometry(36, 7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe8dc90, transparent: true, opacity: 0.5 })); band.position.set(0, 0.06, 0); g.add(band);
    const lab = labelSprite('비무장 지대', { size: 0.8 }); lab.position.set(-6, 2.2, 0); g.add(lab);
    const lab2 = labelSprite('군사 분계선', { size: 0.7 }); lab2.position.set(6, 1.9, -1); g.add(lab2);
    hook.dmz = true;
    for (const l of P.back) await dialogue.say(l);
    dialogue.close();
    // 판문점 천막: 탁자 양쪽 대표가 협정문에 서명
    const tbl = new THREE.Group(); tbl.position.set(0, 0, 10.8); g.add(tbl);
    blk(tbl, 3, 0.8, 1.2, 0x6b5a44, 0, 0.4, 0); blk(tbl, 0.5, 0.02, 0.4, 0xf2ecd8, -0.8, 0.82, 0, 'cloth'); blk(tbl, 0.5, 0.02, 0.4, 0xf2ecd8, 0.8, 0.82, 0, 'cloth');
    const d1 = person(tbl, 'gentleman', -0.8, -1.1, 0), d2 = person(tbl, { ...LOOKS.gentleman, robe: 0x4a4a3a }, 0.8, 1.1, Math.PI);
    const W = a.at(-4.4, 7.6); placePlayer(world, [W.x, W.z], Math.PI * 0.75);
    const D = a.at(0, 10.8); world.setFixedCamera([D.x + 4.6, 2.6, D.z - 0.6], [D.x - 0.4, 1, D.z + 0.2]); // 탁자 옆에서 두 대표를 본다
    const arm = p => p.userData.arms?.[1];
    await wait(world, 1.6, k => { for (const p of [d1, d2]) { const ar = arm(p); if (ar) ar.rotation.x = -0.9 - Math.sin(k * Math.PI * 6) * 0.15; } });
    hook.signed = true;
    audio.play('correct');
    await dialogue.say(P.sign[0]);
    await dialogue.say(P.sign[1]);
    await dialogue.say(P.sign[2]);
    dialogue.close();
  } finally {
    world.setMood(base.mood); if (scene?.weather) scene.weather.points.visible = true;
    await leaveArena(ctx, a);
  }
  return true;
}

const base = makeKitChapter({
  id: 'h4', mood: 'snow', script,
  player: { robe: 0x6a5a4a, hat: 'short', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'unSoldier', 'grandpa', 'mother'],
  spot: SPOT,
  layout: {
    // 1951년 1월 초 서울 가까운 마을: 눈 덮인 길과 짐 보따리를 진 사람들, 군용 트럭, 판잣집과 장작, 잎이 다 진 겨울나무
    ground: 'earth', groundColor: 0xcdd3da, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.8,
    roads: [{ x: 0, z: 1, w: 5, d: 30, color: 0xb8b4aa }],
    weather: 'snow',
    props: [
      { type: 'crowd', x: -9, z: -5, n: 8, cols: 2, looks: ['woman', 'grandma', 'commoner', 'peasant', 'citizen'], face: Math.PI * 0.95 },
      { type: 'crowd', x: 9, z: -5, n: 6, cols: 2, looks: ['commoner', 'woman', 'citizen', 'grandma'], face: Math.PI * 1.05 },
      { type: 'truck', x: -12, z: 0, ry: 0.4 },
      { type: 'fence', x: 0, z: -11, w: 30, solid: false },
      { type: 'shack', x: 13, z: 8 }, { type: 'shack', x: -13, z: 8 }, { type: 'woodpile', x: 15.5, z: 4.5 },
      { type: 'tree', x: 13, z: 0, kind: 'bare' }, { type: 'tree', x: -15, z: -2, kind: 'bare' }, { type: 'tree', x: 16, z: -8, kind: 'bare' },
      { type: 'tree', x: -16, z: -10, kind: 'pine', color: 0x4a6a4a },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x8a8478, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x8a8478, solid: false },
    ],
    npcs: [
      { id: 'soldier', look: 'rokSoldier', x: -4.5, z: 5, ry: Math.PI * 0.8 },
      { id: 'unSoldier', look: 'unSoldier', x: -3, z: -4, ry: 0 },
      { id: 'grandpa', look: 'peasant', x: 8, z: 5, ry: -Math.PI * 0.6 },
      { id: 'mother', look: 'woman', x: 4.5, z: -3, ry: -Math.PI * 0.2 },
    ],
    // 길 위 안내판 대신 판잣집 간판(C-03): 「피란민 쉼터」·「국군 초소」. 안내판 글(판문점·정전)은 놀이 대사로 옮겼다
    signs: [{ id: 'signShelter', title: '피란민 쉼터', x: 13, z: 9.5, ry: 0, plaque: { y: 1.7, back: 0 } },
      { id: 'signPost', title: '국군 초소', x: -13, z: 9.5, ry: 0, plaque: { y: 1.7, back: 0 } }],
    scatter: [{ kind: 'pine', count: 40, area: { x0: -70, x1: 70, z0: -50, z1: -14 }, seed: 541, color: 0x41604a }],
  },
  parts: [
    { ...script.parts.pack, goal: script.goals[3], play: ctx => packPlay(ctx) },
    { ...script.parts.line, goal: script.goals[4], intro: meet('unSoldier', '유엔군 병사와 이야기하기', script.parts.line.intro), play: ctx => linePlay(ctx) },
  ],
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '피란길', 3.2, GATE_Z - 1.6);
    world.closeView = true;
    return { gate, board };
  },
});

// 장 도입(C-03): ① 북쪽에서 내려오는 중국군 ② 남쪽으로 물러나는 국군과 짐을 진 피란민. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const add = (look, x, z, ry) => { const p = person(L, look, x, z, ry); p.visible = false; return p; };
  const north = [-2.4, -0.8, 0.8, 2.4].map((x, i) => add(CHINA, x, 0.4 - (i % 2) * 0.9, 0));
  const south = [[-1.8, 3.6, 'rokSoldier'], [0, 4.2, 'unSoldier'], [1.8, 3.6, 'rokSoldier'], [-2.6, 5.4, 'woman'], [2.4, 5.6, 'grandma'], [0.6, 6, 'peasant']].map(([x, z, l]) => add(l, x, z, 0));
  south.slice(3).forEach(p => headLoad(p, 0x8a5a6a));
  const hide = on => { for (const id of [...PEOPLE, 'mother']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  const show = list => { for (const o of [...north, ...south]) o.visible = list.includes(o); };
  return {
    shots: [
      { cam: [4.5, 2.6, 7.5], look: [0, 1, 0.4], to: { cam: [4, 2.5, 7], look: [0, 1, 0.4] }, act: () => { hide(false); show(north); } },
      { cam: [0.6, 2.2, 10.5], look: [0, 1.2, 4.6], to: { cam: [0.4, 2.2, 10], look: [0, 1.2, 4.6] }, act: () => show(south) },
    ],
    done: () => { hide(true); for (const o of [...north, ...south]) o.removeFromParent(); },
  };
}

let scene = null;
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene;

export default {
  ...base,
  anyOrder: true,
  introScene,
  portal: { at: [0, 3.4], ry: 0 },
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 어머니에게 가면 학생의 결심 → 남쪽으로 물러나는 행렬
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'mother', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await retreatScene(ctx);
  },
  minigame: ctx => minigameWithMeet(base, ctx),
};
