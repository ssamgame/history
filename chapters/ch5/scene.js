// 5장 장면: 아침 산사의 경판 작업장 — 바닷물 통, 솥, 그늘 말림 선반, 판각대, 옻칠 작업대, 경판 더미.
import * as THREE from 'three';
import { backdropMountains, surroundings } from '../kit/terrain.js';
import { curvedHipRoof } from '../kit/buildings.js';
import { groundMaterial } from '../../core/textures.js';
import { mat } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { LOOKS } from '../../content/characters.js';

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildCh5Scene(world) {
  const L = world.level, rand = seeded(31);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const hipRoof = (w, d, h, color, x, y, z) => curvedHipRoof(L, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕
  world.bounds = { x0: -14, x1: 14, z0: -7, z1: 11 };

  // 산과 마당
  {
    const g = new THREE.PlaneGeometry(200, 200, 60, 60); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), far = Math.max(0, Math.hypot(x, z) - 24);
      p.setY(i, Math.min(far * far * 0.04, 26) * (0.8 + 0.3 * Math.sin(x * 0.1) * Math.cos(z * 0.13)));
      const j = rand() * 0.04, inYard = Math.abs(x) < 16 && z > -9 && z < 13;
      if (inYard) c.setRGB(0.72 + j, 0.66 + j, 0.55 + j); else c.setRGB(0.32 + j, 0.47 + j, 0.28 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('earth'));
    t.receiveShadow = true; L.add(t);
  }
  // 법당 (북쪽)
  mk(new THREE.BoxGeometry(16, 1, 7), 0xa59c8a, 0, 0.5, -12);
  for (let dx = -6; dx <= 6; dx += 3) mk(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 8), 0xa8392b, dx, 2.6, -9.5);
  mk(new THREE.BoxGeometry(15, 0.4, 6), 0x2f6b5e, 0, 4.2, -12);
  hipRoof(19, 9, 3, 0x3d4846, 0, 4.4, -12);
  world.addCollider({ x: -4, z: -12, r: 4.5 }); world.addCollider({ x: 4, z: -12, r: 4.5 });
  // 소나무
  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2, d = 26 + rand() * 30;
    mk(new THREE.ConeGeometry(1.5, 4, 6), 0x3e6b46, Math.cos(a) * d, 3, Math.sin(a) * d);
  }

  // 산비탈의 숲 (지형 높이에 맞춰)
  {
    const hillH = (x, z) => { const far = Math.max(0, Math.hypot(x, z) - 24); return Math.min(far * far * 0.04, 26) * (0.8 + 0.3 * Math.sin(x * 0.1) * Math.cos(z * 0.13)); };
    scatter(world, { kind: 'pine', count: 70, area: { x0: -70, x1: 70, z0: -70, z1: 70 }, avoid: [{ x: 0, z: 0, r: 25 }], seed: 61, ground: hillH, scale: [1, 1.7] });
    scatter(world, { kind: 'bush', count: 40, area: { x0: -40, x1: 40, z0: -40, z1: 40 }, avoid: [{ x: 0, z: 0, r: 19 }], seed: 62, ground: hillH, scale: [0.8, 1.5] });
    scatter(world, { kind: 'rock', count: 18, area: { x0: -40, x1: 40, z0: -40, z1: 40 }, avoid: [{ x: 0, z: 0, r: 19 }], seed: 63, ground: hillH, scale: [0.8, 2] });
  }
  // 마당을 두르는 낮은 돌담(기와를 얹은)과 삼층 석탑
  for (const [x, z, w, d] of [[-16.5, 0, 1, 18], [16.5, 0, 1, 18]]) { // 남쪽은 카메라 쪽이라 비워 둔다
    mk(new THREE.BoxGeometry(w, 1.2, d), 0x8c8577, x, 0.6, z);
    mk(new THREE.BoxGeometry(w + 0.5, 0.3, d + 0.5), 0x3d4846, x, 1.35, z);
  }
  {
    const px = -11.5, pz = -10; // 법당 앞 서쪽
    mk(new THREE.BoxGeometry(2.6, 0.5, 2.6), 0xb3ab99, px, 0.25, pz);
    let y = 0.5;
    for (const [w, h] of [[1.7, 1.1], [1.4, 0.5], [1.15, 0.45]]) {
      mk(new THREE.BoxGeometry(w * 0.7, h, w * 0.7), 0xb3ab99, px, y + h / 2, pz); y += h;
      mk(new THREE.BoxGeometry(w + 0.3, 0.16, w + 0.3), 0xa59c8a, px, y + 0.08, pz); y += 0.16;
    }
    mk(new THREE.CylinderGeometry(0.06, 0.1, 0.9, 6), 0x6b6862, px, y + 0.45, pz);
    world.addCollider({ x: px, z: pz, r: 1.4 });
  }
  // 바닷물 통 옆에 쌓은 통나무
  for (let k = 0; k < 6; k++) {
    const lg = mk(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 7), 0x8a5a3a, -12.4, 0.22 + Math.floor(k / 3) * 0.4, -3.6 + (k % 3) * 0.46 + (k >= 3 ? 0.23 : 0));
    lg.rotation.x = Math.PI / 2;
  }
  world.addCollider({ x: -12.4, z: -3, r: 1.3 });

  // 작업대 네 곳 (장인 앞)
  const stations = [];
  // 1) 바닷물 통과 솥
  {
    const x = -9, z = -2;
    const tub = mk(new THREE.CylinderGeometry(1.2, 1.1, 0.9, 12), 0x6b4a32, x - 1.6, 0.45, z);
    mk(new THREE.CylinderGeometry(1.05, 1.05, 0.05, 12), 0x4a7f9c, x - 1.6, 0.86, z, L, false);
    mk(new THREE.CylinderGeometry(0.9, 0.7, 0.9, 12), 0x3a3a3a, x + 1.4, 0.75, z);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xe2742c })); fire.position.set(x + 1.4, 0.2, z); L.add(fire);
    stations.push(fire);
    world.addCollider({ x: x - 1.6, z, r: 1.3 }); world.addCollider({ x: x + 1.4, z, r: 1 });
    void tub;
  }
  // 2) 그늘 말림 선반
  {
    const x = -3, z = -5;
    for (const sx of [-1.5, 1.5]) mk(new THREE.BoxGeometry(0.15, 2.4, 0.15), 0x5a3f2a, x + sx, 1.2, z);
    mk(new THREE.BoxGeometry(3.4, 0.1, 1.6), 0x3d4846, x, 2.5, z); // 그늘 지붕
    for (let k = 0; k < 5; k++) mk(new THREE.BoxGeometry(0.06, 1.2, 0.7), 0xc8a476, x - 1.2 + k * 0.6, 0.8, z);
    world.addCollider({ x, z, r: 1.6 });
  }
  // 3) 판각대
  {
    const x = 3, z = -5;
    mk(new THREE.BoxGeometry(2.6, 0.9, 1.2), 0x6b4a32, x, 0.45, z);
    mk(new THREE.BoxGeometry(1.4, 0.08, 0.7), 0xc8a476, x, 0.94, z);
    world.addCollider({ x, z, r: 1.4 });
  }
  // 4) 옻칠 작업대와 경판 더미
  {
    const x = 9, z = -2;
    mk(new THREE.BoxGeometry(2.4, 0.9, 1.2), 0x6b4a32, x, 0.45, z);
    mk(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 10), 0x2a1a12, x - 0.6, 1.1, z);
    for (let k = 0; k < 8; k++) mk(new THREE.BoxGeometry(1.0, 0.08, 0.5), 0x3b2414, x + 2.2, 0.06 + k * 0.09, z + 0.4);
    world.addCollider({ x, z, r: 1.4 }); world.addCollider({ x: x + 2.2, z: z + 0.4, r: 0.8 });
  }
  // 완성된 경판 선반 (결과 장면에서 보여 줌)
  const library = new THREE.Group(); library.visible = false; L.add(library);
  for (let row = 0; row < 3; row++) for (let k = 0; k < 14; k++) mk(new THREE.BoxGeometry(0.12, 0.6, 0.5), 0x3b2414, -3 + k * 0.45, 0.4 + row * 0.75, 6.5, library);
  for (let row = 0; row < 4; row++) mk(new THREE.BoxGeometry(7, 0.08, 0.7), 0x5a3f2a, 0, 0.08 + row * 0.75, 6.5, library);

  world.addNpc('artisan1', LOOKS.artisan, -9, 0.3, Math.PI);
  world.addNpc('artisan2', LOOKS.artisan, -3, -2.8, Math.PI);
  world.addNpc('artisan3', LOOKS.artisan, 3, -3.3, Math.PI);
  world.addNpc('artisan4', LOOKS.artisan, 9, 0.3, Math.PI);
  world.addNpc('monk', LOOKS.monk, 0, 3, Math.PI);

  world.onUpdate((dt, t) => { for (const f of stations) { const s = 0.8 + Math.sin(t * 12) * 0.15; f.scale.set(s, s + 0.2, s); } });
  backdropMountains(world.level, { color: 0x4f6a3e, radius: 130 }); // 먼 산줄기(깊이감)
  surroundings(world, { bounds: world.bounds, trees: ['pine', 'pine', 'tree'], count: 12, seed: 5 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return { library, start: [0, 9] };
}
