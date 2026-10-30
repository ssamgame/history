// 여러 인물이 함께 하는 행동과 목적이 있는 움직임(2026-10-30 움직임 개선). 몸 자세는 core/motion.js의 행동 층(playAction)과 바라볼 곳(setLook)을 쓴다.
// 행동마다 준비(시선·몸 방향) → 핵심 동작 → 마무리(팔 정리)를 두고, 두 사람이 함께 하는 행동은 한 시계(같은 t)로 두 사람의 자세를 정해 손이 같은 때 같은 자리에서 만난다.
//   turnTo: 제자리에서 부드럽게 돌아서기 · walkTo: 목적지까지 가속·감속하며 걷고 도착하면 방향을 맞춰 선다
//   handshake: 악수 · giveItem: 물건 건네기 · escort: 포로 호송 · strike / block: 공격과 막기 · pickUp / putDown: 물건 집기와 내려놓기
import * as THREE from 'three';
import { playAction, setLook, setCarry, setStyle, blendArms, HIP } from './motion.js';

const v = new THREE.Vector3(), w = new THREE.Vector3(), yv = new THREE.Vector3(); // yv: 방향 계산 전용(다른 함수가 쓰는 v·w를 덮어쓰지 않게)
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const tick = (world, sec, fn) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(sec, t + dt); fn?.(t, dt); if (t >= sec) { off(); res(); } }); });
const yawTo = (p, x, z) => { p.getWorldPosition(yv); return Math.atan2(x - yv.x, z - yv.z); };
const worldOf = (o, out = new THREE.Vector3()) => o.getWorldPosition(out);
// 걸음이 다 멈출 때까지 잠깐 기다린다(멈추며 손을 뻗지 않게: 준비 동작 → 핵심 동작)
const settle = (world, ...ps) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t += dt; if (t > 0.8 || ps.every(p => (p.userData.stride || 0) < 0.05)) { off(); res(); } }); });

// 제자리에서 target(세계 좌표 { x, z } 또는 각도)을 향해 돌아선다. 머리가 먼저 돌고 몸이 따라간다(시간은 돌 각도에 맞춘다)
export async function turnTo(world, p, target, { speed = 4 } = {}) {
  const to = typeof target === 'number' ? target : yawTo(p, target.x, target.z), from = p.rotation.y, d = wrap(to - from);
  if (Math.abs(d) < 0.02) return;
  const dur = Math.max(0.25, Math.abs(d) / speed);
  if (typeof target !== 'number') setLook(p, { x: target.x, y: 2.2, z: target.z });
  await tick(world, dur, t => { p.rotation.y = from + d * ss(0, 1, t / dur); });
  if (typeof target !== 'number') setLook(p, null);
}

// 목적지(부모 좌표 x, z)까지 걷는다: 먼저 그쪽으로 몸을 틀며 출발하고(가속), 가는 동안 방향을 부드럽게 맞추며, 다 와서는 감속해 멈춘 뒤 face 쪽으로 선다.
// 걸음 박자는 실제 빠르기에서 정해지므로(motion.js) 발이 미끄러지지 않는다
export function walkTo(world, p, [x, z], { speed = 1.6, face = null, accel = 0.5 } = {}) {
  return new Promise(res => {
    let sp = 0;
    const off = world.onUpdate(dt => {
      const dx = x - p.position.x, dz = z - p.position.z, d = Math.hypot(dx, dz);
      const slow = Math.min(1, d / 1.2); // 다 와 가면 늦춘다
      sp = Math.min(speed * Math.max(0.25, slow), sp + speed / accel * dt);
      const want = Math.atan2(dx, dz), turn = wrap(want - p.rotation.y);
      p.rotation.y += turn * Math.min(1, dt * 7);
      const go = Math.min(d, sp * dt * Math.max(0, Math.cos(turn))); // 크게 돌아야 하면 돌면서 천천히
      if (d > 1e-4) { p.position.x += dx / d * go; p.position.z += dz / d * go; }
      if (d < 0.03) {
        off(); p.position.x = x; p.position.z = z;
        if (face == null) res(); else turnTo(world, p, face, { speed: 5 }).then(res);
      }
    });
  });
}

// 악수: 서로 바라보기 → 돌아서기 → (멀면) 다가서기 → 오른팔 뻗기 → 손이 닿음 → 위아래로 흔들기 → 손 놓기 → 원래 자세.
// 두 사람의 손이 한가운데서 만나도록 b를 a의 앞(오른손끼리 마주 닿는 자리)으로 세운다. 한 시계로 두 사람의 팔을 정한다
export async function handshake(world, a, b, { gap = 1.3 } = {}) {
  const hook = { contact: 0, shakes: 0 };
  const A0 = worldOf(a, new THREE.Vector3()), B0 = worldOf(b, new THREE.Vector3());
  setLook(a, { x: B0.x, y: 2.3, z: B0.z }); setLook(b, { x: A0.x, y: 2.3, z: A0.z });
  await Promise.all([turnTo(world, a, { x: B0.x, z: B0.z }), turnTo(world, b, { x: A0.x, z: A0.z })]);
  // b가 설 자리: a 앞 gap, 오른손끼리 마주 보도록 a의 오른쪽으로 조금(부모 좌표로 옮긴다)
  // 악수하는 손은 arms[1](몸 기준 +x 쪽 팔). 팔을 뻗으면 손은 어깨에서 안쪽으로 0.32, 앞으로 0.62쯤 나가므로
  // 두 손이 만나려면 b는 a 앞 gap(≈1.3)에, a의 +x 쪽으로 0.36 비켜 선다(마주 보면 b의 +x는 a의 -x)
  const ay = a.rotation.y, fx = Math.sin(ay), fz = Math.cos(ay), rx = Math.cos(ay), rz = -Math.sin(ay);
  const side = 0.36 * (a.scale.x || 1);
  const bx = a.position.x + fx * gap + rx * side, bz = a.position.z + fz * gap + rz * side;
  if (Math.hypot(b.position.x - bx, b.position.z - bz) > 0.05) await walkTo(world, b, [bx, bz], { speed: 1.2, face: { x: a.position.x + rx * side, z: a.position.z + rz * side } });
  await settle(world, a, b);
  worldOf(a, v); worldOf(b, w); setLook(a, { x: w.x, y: 2.3, z: w.z }); setLook(b, { x: v.x, y: 2.3, z: v.z });
  // 공통 시계: 0~0.45 뻗기, 0.45 닿음, 0.45~1.35 흔들기(세 번), 1.35~1.7 놓기
  const T = { reach: 0.45, shake: 0.9, back: 0.4 }, dur = T.reach + T.shake + T.back;
  const pose = t => {
    const r = ss(0, T.reach, t) * (1 - ss(T.reach + T.shake, dur, t));
    const sh = t > T.reach && t < T.reach + T.shake ? Math.sin((t - T.reach) / T.shake * Math.PI * 6) * 0.12 : 0;
    return { arms: [null, [-1.05 * r + sh, 0, -0.42 * r]], upper: [0.07 * r, -0.1 * r, 0], head: [0.06 * r, 0] }; // 몸을 살짝 숙이고 오른쪽 어깨를 내민다
  };
  const ta = playAction(a, { dur, pose, fadeIn: 0.05, fadeOut: 0.05, name: 'handshake' }), tb = playAction(b, { dur, pose, fadeIn: 0.05, fadeOut: 0.05, name: 'handshake' });
  await tick(world, T.reach + 0.05);
  const ha = a.userData.arms[1].getObjectByName('hand'), hb = b.userData.arms[1].getObjectByName('hand');
  hook.contact = worldOf(ha, v).distanceTo(worldOf(hb, w));
  hook.shakes = 3;
  await Promise.all([ta, tb]);
  setLook(a, null); setLook(b, null);
  return hook;
}

// 물건 건네기: 건네는 사람이 두 손으로 물건을 내밀고(물건은 그 사람 손에 붙은 채 앞으로) → 받는 사람이 손을 뻗어 → 두 손이 물건에 닿는 순간 넘겨받고
// → 받은 사람은 들고 다니는 자세로, 건넨 사람은 팔을 내린다. 받는 사람이 잡기 전에는 물건이 건넨 사람 손을 떠나지 않는다
export async function giveItem(world, giver, taker, obj, { style = 'arms' } = {}) {
  const hook = { gap: 0, handed: false };
  if (giver.userData.carry?.obj !== obj) setCarry(giver, obj, 'arms');
  const G = worldOf(giver, new THREE.Vector3()), Tk = worldOf(taker, new THREE.Vector3());
  await Promise.all([turnTo(world, giver, { x: Tk.x, z: Tk.z }), turnTo(world, taker, { x: G.x, z: G.z })]);
  // 팔이 닿는 거리(약 1.45)보다 멀면 받는 사람이 다가선다(같은 부모 좌표 안에서)
  const dx = taker.position.x - giver.position.x, dz = taker.position.z - giver.position.z, d = Math.hypot(dx, dz), near = 1.45 * (giver.scale.x || 1);
  if (d > near + 0.1) await walkTo(world, taker, [giver.position.x + dx / d * near, giver.position.z + dz / d * near], { speed: 1.2, face: { x: G.x, z: G.z } });
  await settle(world, giver, taker);
  worldOf(taker, Tk);
  setLook(giver, { x: Tk.x, y: 1.6, z: Tk.z }); setLook(taker, { x: G.x, y: 1.6, z: G.z });
  const reach = 0.55, hold = 0.25;
  const offer = t => { const r = ss(0, reach, t); return { arms: [[-1.0 - 0.45 * r, 0, 0.33], [-1.0 - 0.45 * r, 0, -0.33]], carryAt: [0, 1.22 + 0.12 * r, 0.6 + 0.32 * r], upper: [0.1 * r, 0, 0], head: [0.15 * r, 0] }; };
  const take = t => { const r = ss(0.15, reach + 0.1, t); return { arms: [[-1.4 * r, 0, 0.3 * r], [-1.4 * r, 0, -0.3 * r]], upper: [0.08 * r, 0, 0], head: [0.15 * r, 0] }; };
  const pg = playAction(giver, { dur: reach + hold, pose: offer, fadeIn: 0.1, fadeOut: 0.01, name: 'give' });
  const pt = playAction(taker, { dur: reach + hold, pose: take, fadeIn: 0.1, fadeOut: 0.01, name: 'take' });
  await Promise.all([pg, pt]);
  // 받는 사람의 두 손과 물건 사이(넘겨받는 순간)
  const hands = taker.userData.arms.map(a => worldOf(a.getObjectByName('hand'), new THREE.Vector3()));
  worldOf(obj, v); hook.gap = Math.min(...hands.map(h => h.distanceTo(v)));
  giver.userData.carry = null; // 넘겨준다(팔은 아래에서 천천히 내린다)
  blendArms(giver, 0.4); giver.userData.armRest = true;
  setCarry(taker, obj, style); hook.handed = true; // 물건이 있던 자리에서 받는 사람 손 자리로 이어 옮겨 간다(motion.js lift)
  await tick(world, 0.4);
  setLook(giver, null); setLook(taker, null);
  return hook;
}

// 물건 집기: 물건을 바라보고 → 다가가 몸을 돌리고 → 허리를 굽혀 손을 뻗고 → 잡아 들어 올린다. 내려놓기는 거꾸로
export async function pickUp(world, p, obj, { style = 'arms', from = null } = {}) {
  worldOf(obj, v); setLook(p, { x: v.x, y: v.y, z: v.z });
  if (from) await walkTo(world, p, from, { speed: 1.4, face: { x: v.x, z: v.z } }); else await turnTo(world, p, { x: v.x, z: v.z });
  await playAction(p, { dur: 0.45, pose: t => { const r = ss(0, 0.45, t); return { arms: [[-1.3 * r, 0, 0.25], [-1.3 * r, 0, -0.25]], upper: [0.55 * r, 0, 0], head: [0.2 * r, 0] }; }, fadeIn: 0.1, fadeOut: 0.01, name: 'bend' });
  setCarry(p, obj, style); // 손이 닿은 자리에서 들어 올린다
  await playAction(p, { dur: 0.4, pose: t => { const r = 1 - ss(0, 0.4, t); return { upper: [0.55 * r, 0, 0], head: [0.2 * r, 0] }; }, fadeIn: 0.01, fadeOut: 0.1, name: 'lift' });
  setLook(p, null);
}
export async function putDown(world, p, place, { at = null } = {}) {
  const c = p.userData.carry; if (!c) return;
  if (at) { const pw = worldOf(place, new THREE.Vector3()); await walkTo(world, p, at, { speed: 1.3, face: { x: pw.x, z: pw.z } }); } // 내려놓을 곳을 보며 다가간다
  await playAction(p, { dur: 0.45, pose: t => { const r = ss(0, 0.45, t); return { upper: [0.5 * r, 0, 0], head: [0.2 * r, 0], carryAt: [0, 1.22 - 0.5 * r, 0.6 + 0.2 * r] }; }, fadeIn: 0.05, fadeOut: 0.01, name: 'lower' });
  const obj = c.obj; worldOf(obj, v);
  setCarry(p, null);
  if (place.parent) { // 손이 놓은 자리에서 내려놓을 곳 위로 살짝 내려앉는다(떠 있거나 순간이동하지 않게)
    place.parent.worldToLocal(v); obj.position.copy(v); place.parent.add(obj);
    const bo = new THREE.Box3().setFromObject(obj), bp = new THREE.Box3().setFromObject(place), drop = bo.min.y - bp.max.y;
    const y0 = obj.position.y; await tick(world, 0.18, t => { obj.position.y = y0 - drop * ss(0, 1, t / 0.18); });
  }
  await playAction(p, { dur: 0.35, pose: t => { const r = 1 - ss(0, 0.35, t); return { upper: [0.5 * r, 0, 0] }; }, fadeIn: 0.01, fadeOut: 0.1, name: 'rise' });
}

// 공격(준비 → 실행 → 회복). kind: 'spear'(창 찌르기: 뒤로 당겼다 앞으로 길게, 창은 수평으로) · 'push'(두 손으로 밀기, 사다리 등) · 'strike'(맨손·몽둥이 내려치기)
export function strike(p, kind = 'spear') {
  const u = p.userData, sp = u.arms[1].getObjectByName('spear');
  const D = { spear: [0.28, 0.14, 0.4], push: [0.2, 0.15, 0.35], strike: [0.3, 0.12, 0.38] }[kind] || [0.25, 0.15, 0.35], dur = D[0] + D[1] + D[2];
  if (sp) u.spearHeld = true; // 찌르는 동안은 창 각도를 이 행동이 정한다
  const pose = t => {
    const prep = ss(0, D[0], t), hit = ss(D[0], D[0] + D[1], t), back = ss(D[0] + D[1], dur, t), on = hit * (1 - back);
    if (kind === 'spear') {
      const ax = -0.25 + 0.35 * prep * (1 - hit) - 1.1 * on; // 당겼다가 앞으로 찌른다
      if (sp) { const up = -ax - (0.18 * on - 0.08 * prep * (1 - hit)); sp.rotation.x = up + (Math.PI / 2) * Math.max(prep * 0.5, on) * (1 - back); } // 곧게 쥔 창을 당기며 기울였다가 찌를 때 수평으로
      return { arms: [[-0.5 * on - 0.2 * prep, 0, 0.15], [ax, 0, -0.05]], upper: [-0.08 * prep * (1 - hit) + 0.18 * on, 0.3 * prep * (1 - hit) - 0.25 * on, 0] };
    }
    if (kind === 'push') return { arms: [[-0.9 * prep - 0.6 * on, 0, 0.3], [-0.9 * prep - 0.6 * on, 0, -0.3]], upper: [-0.05 * prep + 0.22 * on, 0, 0] };
    return { arms: [[-0.2, 0, 0.1], [-2.6 * prep * (1 - hit) - 1.0 * on, 0, -0.1]], upper: [-0.1 * prep + 0.2 * on, 0.2 * prep - 0.2 * on, 0] };
  };
  return playAction(p, { dur, pose, fadeIn: 0.08, fadeOut: 0.15, name: kind }).then(() => { u.spearHeld = false; });
}
// 막기: 무기·팔을 앞으로 올려 막고 몸을 웅크렸다가 돌아온다
export function block(p, dur = 0.7) {
  return playAction(p, { dur, pose: t => { const r = ss(0, 0.15, t) * (1 - ss(dur - 0.25, dur, t)); return { arms: [[-1.5 * r, 0, 0.35 * r], [-1.4 * r, 0, -0.35 * r]], upper: [0.12 * r, 0, 0], head: [0.15 * r, 0] }; }, fadeIn: 0.05, fadeOut: 0.1, name: 'block' });
}

// 포로 호송: 포로(captives)는 움츠린 걸음(captive), 호송병(guards)은 경계 걸음(guard). 모두 같은 빠르기로 길(path, 부모 좌표 점들)을 따라가며
// 대열 모양(처음 자리 차이)을 지킨다. 호송병은 포로 쪽과 둘레를 번갈아 본다. 방향이 바뀌는 곳에서는 함께 천천히 돈다
export function escort(world, { captives, guards = [], path, speed = 1.1 }) {
  const all = [...captives, ...guards];
  captives.forEach(p => setStyle(p, 'captive')); guards.forEach(p => setStyle(p, 'guard'));
  const lead = all[0], offs = all.map(p => [p.position.x - lead.position.x, p.position.z - lead.position.z]);
  const hook = { minGap: Infinity, done: false };
  return new Promise(res => {
    let i = 0, sp = 0, yaw = lead.rotation.y; const yaw0 = yaw, base = [lead.position.x, lead.position.z];
    const off = world.onUpdate((dt, el) => {
      const [tx, tz] = path[i], dx = tx - base[0], dz = tz - base[1], d = Math.hypot(dx, dz);
      const last = i === path.length - 1;
      sp = Math.min(speed * (last ? Math.max(0.3, Math.min(1, d / 1.5)) : 1), sp + speed * dt * 1.5);
      const want = Math.atan2(dx, dz); yaw += wrap(want - yaw) * Math.min(1, dt * 3);
      const go = Math.min(d, sp * dt); base[0] += Math.sin(yaw) * go; base[1] += Math.cos(yaw) * go;
      const c = Math.cos(yaw - yaw0), s = Math.sin(yaw - yaw0);
      all.forEach((p, k) => { // 대열을 길 방향으로 돌려 세운다(처음에 바라본 방향 기준)
        const [ox, oz] = offs[k];
        p.position.x = base[0] + ox * c + oz * s; p.position.z = base[1] - ox * s + oz * c;
        p.rotation.y += wrap(yaw - p.rotation.y) * Math.min(1, dt * 4);
      });
      guards.forEach((g, k) => { const tgt = captives[k % captives.length]; if (tgt && Math.sin(el * 0.8 + k) > 0.3) { tgt.getWorldPosition(v); setLook(g, { x: v.x, y: 1.6, z: v.z }); } else setLook(g, null); });
      for (const g of guards) for (const q of captives) hook.minGap = Math.min(hook.minGap, Math.hypot(g.position.x - q.position.x, g.position.z - q.position.z));
      if (d < 0.05) { i += 1; if (i >= path.length) { off(); hook.done = true; guards.forEach(g => setLook(g, null)); res(hook); } }
    });
  });
}
