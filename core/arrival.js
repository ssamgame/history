// 도착 연출(2026-11-09·10 선생님, 타임머신 틀): 장이 시작되면 탐험이 시작되는 자리(chapter.spawn: 문 밖 길) 옆에 타임머신(core/timemachine.js)이
// 하늘에서 내려앉고, 학생이 2026년 옷차림으로 내려선다. 시간지기가 "…차림으로 변장하자"고 하면 그 시대 역할 옷으로 바뀐다(얼굴은 내 얼굴).
// 타임머신은 그 자리에 세워 둔다(장 끝에 마을로 불러 다시 탄다: core/portal.js). 약 4.6초. 안내 칩이라 글을 읽는 동안 걸음을 막지 않는다.
import * as THREE from 'three';
import { travelerLook, arrivalLine } from '../content/avatar.js';
import { makeTimeMachine, TM_R } from './timemachine.js';

export const ARRIVAL_SEC = 5.2, LAND_AT = 1.5, SWAP_AT = 3.7, BACK = 4.5; // 내려앉기 → 내려서기 → 변장

// 문짝 두 개(gateLeaves)의 가운데 자리(장면 좌표)
function gateAt(gate) {
  if (!gate?.leaves?.length) return null;
  const v = new THREE.Vector3(), c = new THREE.Vector3();
  for (const l of gate.leaves) c.add(l.getWorldPosition(v));
  return c.multiplyScalar(1 / gate.leaves.length);
}
// 그 자리의 땅 높이(걷는 곳 밖 언덕 비탈에 서도 묻히지 않게). 머리 위 지붕·나뭇가지(1.5m 위)와 풀포기·사람은 건너뛴다
function groundY(world, x, z, skip) {
  const rc = new THREE.Raycaster(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0), 0, 60); rc.camera = world.camera;
  const dead = o => { for (let q = o; q; q = q.parent) if (q.visible === false || skip.includes(q) || q.userData?.npc) return true; return false; };
  const h = rc.intersectObject(world.level, true).find(h => h.point.y < 1.5 && h.object.isMesh && !h.object.isInstancedMesh && !h.object.isSkinnedMesh && !dead(h.object));
  return h ? Math.max(0, h.point.y) : 0;
}

export async function playArrival(ctx, { meta, chapter = null, role, roleLook: look, scale = 1, avatar = null, short = false }) {
  const { world, dialogue } = ctx;
  if (!world?.player) return;
  const p = world.player;
  // 자리: 장이 정한 도착 자리(탐험 시작 자리)와 바라볼 곳. 없으면 지금 자리
  const spec = typeof chapter?.spawn === 'function' ? chapter.spawn(ctx) : chapter?.spawn;
  let ry = p.rotation.y;
  if (spec?.at) {
    const at = [...spec.at];
    if (spec.to) {
      const dx = spec.to[0] - at[0], dz = spec.to[1] - at[1], len = Math.hypot(dx, dz) || 1, ux = dx / len, uz = dz / len;
      ry = Math.atan2(ux, uz);
      // 그 장의 문(문짝 두 개의 가운데)에서 BACK만큼 뒤에 선다: 캐릭터도, 옆에 서는 시간의 문(너비 4m)도 문·담과 겹치지 않게(2026-11-10 선생님)
      const g = gateAt(spec.gate);
      if (g) { const d = (g.x - at[0]) * ux + (g.z - at[1]) * uz, need = (spec.back ?? BACK) - d; if (need > 0) { at[0] -= ux * need; at[1] -= uz * need; } }
    } else if (spec.ry != null) ry = spec.ry;
    p.position.set(at[0], 0, at[1]); p.rotation.y = ry;
  }
  const b0 = world.bounds; // 도착 자리가 걷는 곳 밖(문 밖 길)이어도 밀려나지 않게
  p.position.y = groundY(world, p.position.x, p.position.z, [p]);
  p.visible = true; world.camMode = 'follow'; world.snapCamera?.(); // 따라가기 카메라 그대로(앞쪽에 세우면 성문·나무에 가린다)
  world.setPlayerLook(travelerLook(avatar), scale); // 2026년 옷차림으로 내려선다
  // 시간의 문은 학생 오른쪽 옆 2.8m에, 문의 앞이 학생을 보게(뒤에 세우면 따라가기 카메라가 문 뒤에서 보게 된다)
  const dir = { x: Math.sin(ry), z: Math.cos(ry) }, side = { x: dir.z, z: -dir.x };
  const sd = spec?.side ?? 1; // side: -1이면 왼쪽(오른쪽에 집·나무가 있는 장)
  // 타임머신이 하늘에서 내려앉는다(학생 옆 3.4m). 내려앉을 때까지 학생은 안에 타고 있어 보이지 않는다. 내린 뒤에는 그 자리에 세워 둔다(장 끝에 다시 탄다)
  const mx = p.position.x + side.x * 3.4 * sd, mz = p.position.z + side.z * 3.4 * sd;
  ctx.timeMachine?.dispose?.();
  let tm = null, my = 0;
  try { tm = makeTimeMachine({ parts: ctx.tmParts || [] }); my = groundY(world, mx, mz, [p]); tm.group.position.set(mx, my + 16, mz); tm.group.rotation.y = Math.atan2(-side.x * sd, -side.z * sd); world.level.add(tm.group); tm.setFlame(1); world.warm?.(); } catch (e) { console.warn('타임머신', e); }
  p.visible = !tm;
  const home = p.position.clone(); // 변장할 자리(문 밖 길). 학생은 타임머신 문에서 나와 여기까지 걸어온다
  if (b0) world.bounds = { x0: Math.min(b0.x0, home.x, mx) - 2, x1: Math.max(b0.x1, home.x, mx) + 2, z0: Math.min(b0.z0, home.z, mz) - 2, z1: Math.max(b0.z1, home.z, mz) + 2 }; // 걷는 곳 밖이어도 밀려나지 않게
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 7, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.set(p.position.x, p.position.y + 3.5, p.position.z); beam.name = 'timeBeam'; world.level.add(beam);
  beam.visible = false;
  const s0 = world.speedScale;
  let t = 0, swapped = false, said = false, out = !tm;
  await new Promise(resolve => {
    const off = world.onUpdate(dt => {
      t += dt;
      if (tm) { const k = Math.min(1, t / LAND_AT), e = 1 - (1 - k) * (1 - k); tm.group.position.y = my + 16 * (1 - e); tm.setFlame(k < 1 ? 1 - e * 0.6 : Math.max(0, 0.4 - (t - LAND_AT) * 1.5)); tm.tick(t); }
      if (!out && t >= LAND_AT + 0.25) { // 내려앉으면 문이 열리고 학생이 안에서 걸어 나온다
        out = true; tm.setDoor(true);
        const ux = (home.x - mx) / 3.4, uz = (home.z - mz) / 3.4;
        p.position.set(mx + ux * 1.0, my, mz + uz * 1.0); p.rotation.y = Math.atan2(ux, uz); p.visible = true; world.autoMove = { x: ux, z: uz }; world.speedScale = 0.7;
      }
      if (world.autoMove && out && tm) { const left = (home.x - p.position.x) * world.autoMove.x + (home.z - p.position.z) * world.autoMove.z; p.position.y = home.y; if (left <= 0.05) { world.autoMove = null; world.speedScale = s0; p.position.copy(home); p.rotation.y = ry; beam.visible = true; tm.setDoor(false); } }
      if (!said && t >= LAND_AT + 1.3) { said = true; dialogue?.say({ who: 'guide', text: arrivalLine(meta, role, short) }); } // 기다리지 않는 안내 칩
      const flash = Math.max(0, 1 - Math.abs(t - SWAP_AT) / 0.35); // 변장 순간 번쩍
      beam.material.opacity = (t < SWAP_AT ? 0.5 : Math.max(0, 0.5 * (1 - (t - SWAP_AT) / 1.1))) + flash * 0.4;
      beam.scale.x = beam.scale.z = 1 + Math.sin(t * 6) * 0.08 + flash * 0.5;
      if (!swapped && t >= SWAP_AT) { swapped = true; world.setPlayerLook(look, scale); } // 변장: 그 시대 역할 옷으로
      if (t >= ARRIVAL_SEC) { off(); world.level.remove(beam); beam.geometry.dispose(); beam.material.dispose(); resolve(); }
    });
  });
  world.autoMove = null; world.speedScale = s0; p.position.copy(home); if (tm) tm.setDoor(false); // 건너뛰거나 늦어도 제자리에
  if (tm) { // 세워 둔 타임머신: 부딪히고, 시곗바늘은 천천히 돈다
    tm.setFlame(0); tm.x = mx; tm.z = mz;
    tm.collider = world.addCollider({ x: mx, z: mz, r: TM_R });
    tm.offTick = world.onUpdate((dt, tt) => tm.tick(tt));
    ctx.timeMachine = tm;
  }
  if (b0) world.bounds = b0;
  ctx.arrivedAt = meta?.id;
  ctx.arrivalFrom = [p.position.x, p.position.z, p.position.y]; // 걸어 들어오는 장면(enterThroughGate)이 여기서 이어 걷는다
  ctx.testHooks.arrival = { shown: true, swapped, short, at: [p.position.x, p.position.z], gate: tm ? [mx, mz] : null, door: (g => g && [g.x, g.z])(gateAt(spec?.gate)) };
}
