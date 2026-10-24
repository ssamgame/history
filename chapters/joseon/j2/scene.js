// 조선편 2장 장면: 봄날의 궁궐. 박석 마당, 북쪽의 큰 전각(돌 기단·붉은 기둥·기와지붕), 동쪽의 집현전, 남쪽 궁궐 문과 담장.
import * as THREE from 'three';
import { curvedHipRoof, wall } from '../../kit/buildings.js';
import { sceneGround } from '../../kit/terrain.js';
import { mat } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS } from '../../../content/characters.js';
import { geunjeongjeon } from '../landmarks.js';
import { addSigns } from '../common.js';

export function buildJ2Scene(world) {
  const L = world.level;
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const hipRoof = (w, d, h, color, x, y, z, parent = L) => curvedHipRoof(parent, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕
  // 전각 하나: 돌 기단, 붉은 기둥, 초록 창방, 기와지붕. 앞(+z)에 돌계단.
  const hall = (w, d, x, z, ry = 0, tall = 3.4) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g);
    mk(new THREE.BoxGeometry(w + 2, 0.9, d + 2), 0xb3ada2, 0, 0.45, 0, g);
    for (let i = 0; i < 3; i++) mk(new THREE.BoxGeometry(3.2, 0.3, 0.8), 0xb3ab99, 0, 0.15 + i * 0.3, d / 2 + 2.2 - i * 0.6, g);
    mk(new THREE.BoxGeometry(w - 0.6, tall - 0.4, d - 0.6), 0xe6dcc3, 0, 0.9 + (tall - 0.4) / 2, 0, g);
    for (let dx = -w / 2; dx <= w / 2 + 0.01; dx += w / 4) for (const dz of [-d / 2, d / 2]) mk(new THREE.CylinderGeometry(0.22, 0.22, tall, 8), 0xa8392b, dx, 0.9 + tall / 2, dz, g);
    mk(new THREE.BoxGeometry(w + 0.6, 0.4, d + 0.6), 0x2f6b5e, 0, 0.9 + tall + 0.1, 0, g);
    hipRoof(w + 4, d + 3.4, 2.6, 0x3d4846, 0, 1.1 + tall, 0, g);
    return g;
  };
  world.bounds = { x0: -15, x1: 15, z0: -7.5, z1: 10 };

  // 땅: 궁궐 밖 풀밭과 박석을 깐 마당
  let hillH = () => 0;
  {
    hillH = sceneGround(L, { bounds: world.bounds, margin: 11, color: 0x5c804d, size: 180 }); // 궁궐 밖은 언덕과 먼 산
    mk(new THREE.BoxGeometry(34, 0.06, 36), 0xa59c8a, 0, 0.03, 2, L, false);
    mk(new THREE.BoxGeometry(3, 0.08, 20), 0xb3ab99, 0, 0.05, 4, L, false); // 가운데 어도(높은 길)
  }
  // 북쪽 큰 전각과 동쪽 집현전
  // 근정전: 난간 두른 두 단 월대 위의 2층 전각
  const throne = geunjeongjeon(); throne.position.set(0, 0, -15); L.add(throne);
  for (const dx of [-7, 0, 7]) world.addCollider({ x: dx, z: -14, r: 6.4 });
  hall(8, 5, 14, 1, -Math.PI / 2, 3);
  world.addCollider({ x: 14, z: -1, r: 3.5 }); world.addCollider({ x: 14, z: 3, r: 3.5 });
  // 집현전 앞 책상과 책
  for (const z of [-2.2, 4.2]) {
    mk(new THREE.BoxGeometry(0.8, 0.7, 1.4), 0x7a5a3c, 9.4, 0.35, z);
    for (let k = 0; k < 3; k++) mk(new THREE.BoxGeometry(0.5, 0.08, 0.36), [0xd8c9a0, 0x2f6b5e, 0xa8392b][k], 9.4, 0.74 + k * 0.08, z - 0.3 + k * 0.3);
    world.addCollider({ x: 9.4, z, r: 0.8 });
  }
  // 서쪽 행각(긴 건물)
  mk(new THREE.BoxGeometry(4, 0.5, 23), 0xb3ada2, -16, 0.25, 2); // 기단
  mk(new THREE.BoxGeometry(3, 2.4, 22), 0xe6dcc3, -16.4, 1.7, 2);
  for (let z = -8.5; z <= 12.6; z += 2.1) { // 마당 쪽 붉은 기둥과 창살 창
    mk(new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8), 0xa8392b, -14.3, 1.75, z);
    if (z < 12.5) mk(new THREE.BoxGeometry(0.08, 1.1, 1.4), 0x8a6a48, -14.92, 1.8, z + 1.05);
  }
  mk(new THREE.BoxGeometry(0.3, 0.3, 22), 0x2f6b5e, -14.3, 3.0, 2);
  hipRoof(6, 24, 1.6, 0x3d4846, -16, 3.0, 2);
  // 남쪽 담장과 궁궐 문
  for (const sx of [-1, 1]) { const g = new THREE.Group(); g.position.set(sx * 10, 0, 19); L.add(g); wall(g, { w: 14, h: 2.4, color: 0x9a8c7a }); } // 기와를 얹은 궁궐 담
  mk(new THREE.BoxGeometry(6, 3.4, 1.6), 0xa8392b, 0, 1.7, 19);
  mk(new THREE.BoxGeometry(2.6, 2.8, 1.8), 0x3a2c20, 0, 1.4, 19);
  hipRoof(9, 4, 1.8, 0x3d4846, 0, 3.4, 19);
  // 근정전 앞 드므(불을 끌 물을 담아 둔 넓은 그릇) 둘
  for (const [x, z] of [[-9.5, -8.4], [10.5, -8.6]]) {
    mk(new THREE.BoxGeometry(1.3, 0.35, 1.3), 0xb3ab99, x, 0.18, z);
    const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.55, 0.02], [0.7, 0.3], [0.72, 0.62], [0.78, 0.66], [0, 0.66]].map(([a, b]) => new THREE.Vector2(a, b)), 14), mat(0x5a4a32, 'grain'));
    pot.position.set(x, 0.35, z); pot.castShadow = true; L.add(pot);
    mk(new THREE.CylinderGeometry(0.66, 0.66, 0.03, 14), 0x3f5a6a, x, 0.99, z, L, false);
    world.addCollider({ x, z, r: 0.9 });
  }
  // 마당 가운데 길 양쪽의 품계석
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) {
    mk(new THREE.BoxGeometry(0.4, 0.7, 0.3), 0xb3ab99, sx * 2.4, 0.35, -5 + i * 2.2);
    world.addCollider({ x: sx * 2.4, z: -5 + i * 2.2, r: 0.35 });
  }
  // 봄꽃 나무와 담장 밖 소나무, 마당 가장자리 풀꽃
  for (const [x, z] of [[-11, 13], [11, 13], [-12, -4], [8, -7]]) {
    mk(new THREE.CylinderGeometry(0.18, 0.26, 1.8, 6), 0x6b4a32, x, 0.9, z);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), mat(0xf0c8d4, 'grain'));
    crown.position.set(x, 2.5, z); crown.castShadow = true; L.add(crown);
    world.addCollider({ x, z, r: 0.5 });
  }
  scatter(world, { kind: 'pine', count: 40, area: { x0: -60, x1: 60, z0: -50, z1: -18 }, seed: 61, ground: hillH, scale: [1.1, 1.7] });
  scatter(world, { kind: 'pine', count: 20, area: { x0: -60, x1: 60, z0: 20, z1: 50 }, seed: 62, ground: hillH, scale: [1, 1.5] });
  scatter(world, { kind: 'flower', count: 40, area: { x0: -14, x1: 14, z0: 15, z1: 18 }, avoid: [{ x: 0, z: 17, r: 3 }], seed: 63 });

  addSigns(world, [
    { id: 'signThrone', title: '근정전', x: -5.5, z: -6.2 },
    { id: 'signJiphyeon', title: '집현전', x: 9.5, z: -5.5, ry: -Math.PI / 2 },
    { id: 'signHaerye', title: '훈민정음 해례본', x: 9, z: 7.5, ry: -Math.PI / 2 },
  ]);

  world.addNpc('commoner', LOOKS.commoner, -5, 8.5, Math.PI);
  world.addNpc('scholar', LOOKS.scholar, 8.2, 1, -Math.PI / 2);
  world.addNpc('sejong', LOOKS.sejong, 0, -5, 0);

  return { start: [0, 7] };
}
