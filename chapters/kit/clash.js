// 싸움 장면 공용 도구(D-65, 2026-11-03 선생님: 전투가 몸만 흔들거나 움직이기만 하다 끝나지 않게).
// - melee(world, pairs, opts): 짝지어 맞붙기. 이기는 쪽(a)이 지는 쪽(b) 앞까지 다가서서 마주 보고 찌르고(한 걸음 내디뎠다 돌아온다),
//   b가 막고 되받아치면 a가 막는다. 두 번째로 찔린 b는 절반이 옆으로 쓰러져 누웠다 사라지고, 나머지는 돌아서 달아난다. 옆으로 흔들지 않는다.
// - volley(world, g, shooters, opts): 선 채로 총을 쏘는 무리(총구 불빛·연기·총소리).
// 쓰러진 사람은 피 없이 옆으로 누웠다가 사라진다(D-45). 테스트 훅: 돌려주는 hook({ strikes, counters, blocks, fell, fled, side })
import * as THREE from 'three';
import { strike, block } from '../../core/interact.js';
import { animateWalk, setCarry } from '../../core/motion.js';

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// pairs: [{ a, b }] (같은 부모 안 사람). opts: approach(다가서는 초), gap(맞붙는 거리), dur(싸움 길이), lose(b가 쓰러지는 비율 0~1),
// flee([dx, dz] 달아나는 방향, 기본은 a 반대쪽, false면 쓰러지지 않은 b는 그 자리에 버틴다), heightAt(x, z) 언덕 높이, counter(되받아치는 비율), chase(a가 뒤쫓는 거리)
export function melee(world, pairs, { approach = 1.6, gap = 1.35, lose = 0.5, flee = null, fleeSpeed = 6, heightAt = null, counter = 0.6, chase = 2, seed = 1 } = {}) {
  const hook = { strikes: 0, counters: 0, blocks: 0, fell: 0, fled: 0, side: 0, pairs: pairs.length };
  let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const P = pairs.map(({ a, b }, i) => {
    const a0 = a.position.clone(), b0 = b.position.clone(), d = new THREE.Vector3().subVectors(b0, a0).setY(0), len = d.length() || 1; d.divideScalar(len);
    const meet = b0.clone().addScaledVector(d, -gap), side = new THREE.Vector3(-d.z, 0, d.x);
    const s = approach + 0.1 + rnd() * 0.5, plan = [[s, a, 'strike'], [s + 0.06, b, 'block']];
    if (rnd() < counter) plan.push([s + 0.75, b, 'counter'], [s + 0.81, a, 'block']);
    plan.push([s + 1.45, a, 'strike']);
    const down = i % Math.max(1, Math.round(1 / Math.max(0.01, lose))) === 0 && lose > 0;
    const away = flee ? new THREE.Vector3(flee[0], 0, flee[1]).normalize() : d.clone(), stay = flee === false;
    [a, b].forEach(p => { p.userData.manual = true; p.rotation.order = 'YXZ'; });
    return { a, b, a0, b0, d, meet, side, plan, end: s + 1.65, down, away, stay };
  });
  const lunge = (q, t) => { const k = (t - (q.hitAt ?? -9)) / 0.6; return k > 0 && k < 1 ? Math.sin(Math.PI * k) * 0.42 : 0; };
  const last = Math.max(...P.map(p => p.end)) + 2.4;
  return { hook, done: new Promise(res => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      for (const p of P) {
        const { a, b, a0, meet, d } = p, e = ss(0, approach, t);
        // a: 다가서서 마주 서고, 찌를 때 내디딘다. 싸움이 끝나면 조금 뒤쫓는다
        const go = new THREE.Vector3().lerpVectors(a0, meet, e).addScaledVector(d, lunge(a.userData, t) + Math.max(0, Math.min(chase, (t - p.end) * 1.6)));
        a.position.set(go.x, heightAt ? heightAt(go.x, go.z) : a0.y, go.z);
        a.rotation.y = Math.atan2(d.x, d.z);
        animateWalk(a, t < approach || (t > p.end && t < p.end + chase / 1.6), dt);
        hook.side = Math.max(hook.side, Math.abs(new THREE.Vector3().subVectors(a.position, a0).setY(0).dot(p.side)) - Math.abs(new THREE.Vector3().subVectors(meet, a0).setY(0).dot(p.side)));
        // b: 그 자리에서 버티고, 되받아칠 때 내디딘다. 진 뒤에는 쓰러지거나 달아난다
        if (!p.gone) {
          if (t < p.end) { b.rotation.y = Math.atan2(-d.x, -d.z); const q = p.b0.clone().addScaledVector(d, -lunge(b.userData, t)); b.position.set(q.x, heightAt ? heightAt(q.x, q.z) : p.b0.y, q.z); }
          else if (p.down) { const k = ss(p.end, p.end + 0.5, t); b.rotation.z = (p.side.x >= 0 ? 1 : -1) * Math.PI / 2 * k; b.rotation.x = -0.2 * k; if (!p.counted) { p.counted = true; hook.fell += 1; } if (t > p.end + 2.2) { b.visible = false; p.gone = true; } }
          else if (p.stay) { b.rotation.y = Math.atan2(-d.x, -d.z); }
          else { b.rotation.y = Math.atan2(p.away.x, p.away.z); b.position.addScaledVector(p.away, fleeSpeed * dt); if (heightAt) b.position.y = heightAt(b.position.x, b.position.z); animateWalk(b, true, dt); if (!p.counted) { p.counted = true; hook.fled += 1; } }
        }
        while (p.plan.length && p.plan[0][0] <= t) {
          const [, who, what] = p.plan.shift();
          if (!who.visible) continue;
          if (what === 'block') { block(who, 0.55); hook.blocks += 1; }
          else { strike(who, 'spear'); who.userData.hitAt = t; if (what === 'counter') hook.counters += 1; else hook.strikes += 1; }
        }
      }
      if (t >= last) { off(); for (const p of P) { p.a.userData.manual = false; if (p.stay && !p.gone) p.b.userData.manual = false; } res(hook); }
    });
  }) };
}

// 선 채로 쏘는 총: 총구 불빛·연기(사람 가슴 앞). shooters를 번갈아 쏜다. onShot(i)에서 맞은 쪽을 쓰러뜨린다
export function gunFlash(world, g, p) {
  const at = p.localToWorld(new THREE.Vector3(0.2, 1.45, 1.1)); g.worldToLocal(at);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xe8e4da, transparent: true, opacity: 0.7, depthWrite: false }));
  flash.position.copy(at); smoke.position.copy(at); g.add(flash, smoke);
  let t = 0;
  const off = world.onUpdate(dt => {
    t += dt; flash.visible = t < 0.12;
    smoke.scale.setScalar(1 + t * 2.6); smoke.position.y = at.y + t * 0.5; smoke.material.opacity = Math.max(0, 0.7 - t * 0.55);
    if (t > 1.3) { off(); g.remove(flash, smoke); }
  });
}
// 등에 멘 총을 두 손에 들고 앞으로 겨눈다(2026-11-04 선생님: 일본군이 조총을 직접 손에 들고 쏘게). 총이 없으면 아무것도 하지 않는다
export function aimRifle(p) {
  const r = p.getObjectByName('rifle'); if (!r || p.userData.carry) return false;
  r.removeFromParent(); r.position.set(0, 0, 0); r.rotation.set(Math.PI / 2, 0, 0);
  setCarry(p, r, 'aim');
  return true;
}
export async function volley(world, g, shooters, { rounds = 3, gap = 0.9, audio = null, onRound = null } = {}) {
  shooters.forEach(aimRifle);
  for (let v = 0; v < rounds; v++) {
    shooters.forEach((p, i) => { if ((i + v) % 2 === 0 || v === rounds - 1) gunFlash(world, g, p); });
    audio?.play?.('shot');
    onRound?.(v);
    await new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t += dt; if (t >= gap) { off(); res(); } }); });
  }
}
// 맞아 쓰러지기(피 없이 옆으로 누웠다가 sec초 뒤 사라진다)
export function fallDown(world, p, { side = 1, sec = 2.2 } = {}) {
  p.userData.manual = true; p.rotation.order = 'YXZ';
  return new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t += dt; const k = ss(0, 0.5, t); p.rotation.z = side * Math.PI / 2 * k; p.rotation.x = -0.2 * k; if (t > sec) { p.visible = false; off(); res(); } }); });
}
