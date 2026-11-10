// 도착 연출(2026-11-09 선생님, 타임머신 틀): 장이 시작되어 학생이 처음 보일 때, 탐험이 시작되는 자리(chapter.spawn: 문 밖 길 등) 뒤에
// 「시간의 문」이 잠깐 서고 빛기둥 속에 2026년 옷차림으로 내려선다. 시간지기가 "…차림으로 변장하자"고 하면 그 시대 역할 옷으로 바뀌고(얼굴은 내 얼굴),
// 문은 닫히듯 사라진다. 약 3.4초(선생님: 처음 1.6초는 짧았다). 안내 칩이라 글을 읽는 동안 걸음을 막지 않는다.
import * as THREE from 'three';
import { TRAVELER_LOOK, applyAvatar, arrivalLine } from '../content/avatar.js';
import { makePortal } from './portal.js';

export const ARRIVAL_SEC = 3.4, SWAP_AT = 1.9, BACK = 4.5;

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
  if (b0) world.bounds = { x0: Math.min(b0.x0, p.position.x - 1), x1: Math.max(b0.x1, p.position.x + 1), z0: Math.min(b0.z0, p.position.z - 1), z1: Math.max(b0.z1, p.position.z + 1) };
  p.position.y = groundY(world, p.position.x, p.position.z, [p]);
  p.visible = true; world.camMode = 'follow'; world.snapCamera?.(); // 따라가기 카메라 그대로(앞쪽에 세우면 성문·나무에 가린다)
  world.setPlayerLook(applyAvatar(TRAVELER_LOOK, avatar), scale); // 2026년 옷차림으로 내려선다
  // 시간의 문은 학생 오른쪽 옆 2.8m에, 문의 앞이 학생을 보게(뒤에 세우면 따라가기 카메라가 문 뒤에서 보게 된다)
  const dir = { x: Math.sin(ry), z: Math.cos(ry) }, side = { x: dir.z, z: -dir.x };
  const sd = spec?.side ?? 1, gx = p.position.x + side.x * 2.8 * sd, gz = p.position.z + side.z * 2.8 * sd; // side: -1이면 왼쪽(오른쪽에 집·나무가 있는 장)
  let gate = null;
  try { gate = makePortal(world, { x: gx, z: gz, ry: Math.atan2(-side.x * sd, -side.z * sd), name: '시간의 문', grand: false }); gate.group.position.y = groundY(world, gx, gz, [p, gate.group]); } catch (e) { console.warn('시간의 문', e); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 7, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.set(p.position.x, p.position.y + 3.5, p.position.z); beam.name = 'timeBeam'; world.level.add(beam);
  let t = 0, swapped = false, said = false;
  await new Promise(resolve => {
    const off = world.onUpdate(dt => {
      t += dt;
      if (!said && t >= 0.4) { said = true; dialogue?.say({ who: 'guide', text: arrivalLine(meta, role, short) }); } // 기다리지 않는 안내 칩
      const flash = Math.max(0, 1 - Math.abs(t - SWAP_AT) / 0.35); // 변장 순간 번쩍
      beam.material.opacity = (t < SWAP_AT ? 0.5 : Math.max(0, 0.5 * (1 - (t - SWAP_AT) / 1.1))) + flash * 0.4;
      beam.scale.x = beam.scale.z = 1 + Math.sin(t * 6) * 0.08 + flash * 0.5;
      if (!swapped && t >= SWAP_AT) { swapped = true; world.setPlayerLook(look, scale); } // 변장: 그 시대 역할 옷으로
      if (gate && t > ARRIVAL_SEC - 0.8) { const k = Math.max(0, (ARRIVAL_SEC - t) / 0.8); gate.group.scale.set(k, k, k); } // 문이 닫히듯 작아진다
      if (t >= ARRIVAL_SEC) { off(); world.level.remove(beam); beam.geometry.dispose(); beam.material.dispose(); gate?.dispose(); resolve(); }
    });
  });
  if (gate) world.colliders.splice(-2, 2); // 문 기둥에 넣은 부딪힘 둘을 뺀다(makePortal이 마지막에 넣는다)
  if (b0) world.bounds = b0;
  ctx.arrivedAt = meta?.id;
  ctx.arrivalFrom = [p.position.x, p.position.z, p.position.y]; // 걸어 들어오는 장면(enterThroughGate)이 여기서 이어 걷는다
  ctx.testHooks.arrival = { shown: true, swapped, short, at: [p.position.x, p.position.z], gate: gate ? [gate.group.position.x, gate.group.position.z] : null, door: (g => g && [g.x, g.z])(gateAt(spec?.gate)) };
}
