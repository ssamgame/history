// 도착 연출(2026-11-09 선생님, 타임머신 틀): 장이 시작되어 학생이 처음 보일 때, 탐험이 시작되는 자리(chapter.spawn: 문 밖 길 등) 뒤에
// 「시간의 문」이 잠깐 서고 빛기둥 속에 2026년 옷차림으로 내려선다. 시간지기가 "…차림으로 변장하자"고 하면 그 시대 역할 옷으로 바뀌고(얼굴은 내 얼굴),
// 문은 닫히듯 사라진다. 약 3.4초(선생님: 처음 1.6초는 짧았다). 안내 칩이라 글을 읽는 동안 걸음을 막지 않는다.
import * as THREE from 'three';
import { TRAVELER_LOOK, applyAvatar, arrivalLine } from '../content/avatar.js';
import { makePortal } from './portal.js';

export const ARRIVAL_SEC = 3.4, SWAP_AT = 1.9;

export async function playArrival(ctx, { meta, chapter = null, role, roleLook: look, scale = 1, avatar = null, short = false }) {
  const { world, dialogue } = ctx;
  if (!world?.player) return;
  const p = world.player;
  // 자리: 장이 정한 도착 자리(탐험 시작 자리)와 바라볼 곳. 없으면 지금 자리
  const spec = typeof chapter?.spawn === 'function' ? chapter.spawn(ctx) : chapter?.spawn;
  let ry = p.rotation.y;
  if (spec?.at) {
    p.position.set(spec.at[0], 0, spec.at[1]);
    if (spec.to) ry = Math.atan2(spec.to[0] - spec.at[0], spec.to[1] - spec.at[1]); else if (spec.ry != null) ry = spec.ry;
    p.rotation.y = ry;
  }
  const b0 = world.bounds; // 도착 자리가 걷는 곳 밖(문 밖 길)이어도 밀려나지 않게
  if (b0) world.bounds = { x0: Math.min(b0.x0, p.position.x - 1), x1: Math.max(b0.x1, p.position.x + 1), z0: Math.min(b0.z0, p.position.z - 1), z1: Math.max(b0.z1, p.position.z + 1) };
  p.visible = true; world.camMode = 'follow'; world.snapCamera?.(); // 따라가기 카메라 그대로(앞쪽에 세우면 성문·나무에 가린다)
  world.setPlayerLook(applyAvatar(TRAVELER_LOOK, avatar), scale); // 2026년 옷차림으로 내려선다
  // 시간의 문은 학생 오른쪽 옆 2.8m에, 문의 앞이 학생을 보게(뒤에 세우면 따라가기 카메라가 문 뒤에서 보게 된다)
  const dir = { x: Math.sin(ry), z: Math.cos(ry) }, side = { x: dir.z, z: -dir.x };
  let gate = null;
  try { gate = makePortal(world, { x: p.position.x + side.x * 2.8, z: p.position.z + side.z * 2.8, ry: Math.atan2(-side.x, -side.z), name: '시간의 문', grand: false }); } catch (e) { console.warn('시간의 문', e); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 7, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.set(p.position.x, 3.5, p.position.z); beam.name = 'timeBeam'; world.level.add(beam);
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
  ctx.testHooks.arrival = { shown: true, swapped, short, at: [p.position.x, p.position.z], gate: !!gate };
}
