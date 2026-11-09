// 도착 연출(2026-11-09 선생님, 타임머신 틀): 장이 시작되어 학생이 처음 보일 때 빛기둥이 서고 시간지기가 "…차림으로 변장하자"고 하면
// 2026년 옷에서 그 시대 역할 옷으로 바뀐다(얼굴은 내 얼굴 그대로). 안내 칩이라 걸음을 막지 않는다. 약 1.6초.
import * as THREE from 'three';
import { TRAVELER_LOOK, applyAvatar, arrivalLine } from '../content/avatar.js';

export async function playArrival(ctx, { meta, role, roleLook: look, scale = 1, avatar = null, short = false }) {
  const { world, dialogue } = ctx;
  if (!world?.player) return;
  const p = world.player;
  world.setPlayerLook(applyAvatar(TRAVELER_LOOK, avatar), scale); // 2026년 옷차림으로 내려선다
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 7, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.set(p.position.x, 3.5, p.position.z); beam.name = 'timeBeam'; world.level.add(beam);
  dialogue?.say({ who: 'guide', text: arrivalLine(meta, role, short) }); // 기다리지 않는다
  let t = 0, swapped = false;
  await new Promise(resolve => {
    const off = world.onUpdate(dt => {
      t += dt;
      beam.material.opacity = t < 0.8 ? 0.55 : Math.max(0, 0.55 * (1 - (t - 0.8) / 0.8));
      beam.scale.x = beam.scale.z = 1 + Math.sin(t * 6) * 0.08;
      if (!swapped && t >= 0.9) { swapped = true; world.setPlayerLook(look, scale); } // 변장: 그 시대 역할 옷으로
      if (t >= 1.6) { off(); world.level.remove(beam); beam.geometry.dispose(); beam.material.dispose(); resolve(); }
    });
  });
  ctx.testHooks.arrival = { shown: true, swapped, short };
}
