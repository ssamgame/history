// 고려 새 6장(장 id ch5) 장면: 아침 산사의 경판 작업장 — 바닷물 통, 솥, 그늘 말림 선반, 판각대, 마구리 작업대, 옻칠 작업대, 경판 선반.
// 2026-10-26 새로 만들기: 말을 거는 사람은 장인 한 명과 스님, 나머지 장인 셋은 일하는 배경. 경판 공방 놀이의 작업대 여섯 자리(STATIONS)와
// 작업 연출(work: 판이 작업대로 가서 잠깐 머묾, 바닷물 물결 · 삶는 김), 선반(shelf), 삼별초 바다 무대(chapters/ch5/sea.js, x 400)를 함께 짓는다.
import * as THREE from 'three';
import { backdropMountains, surroundings } from '../kit/terrain.js';
import { curvedHipRoof, hanok } from '../kit/buildings.js';
import { makeFire } from '../../core/fire.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, setWork, makePerson } from '../../core/people.js';
import { buildSea } from './sea.js';
import { scatter } from '../../core/props.js';
import { LOOKS } from '../../content/characters.js';

// 공방 작업대 여섯 자리: 바닷물 통 · 솥 · 그늘 선반 · 판각대 · 마구리 작업대 · 옻칠 작업대
export const STATIONS = [[-10.6, -2], [-7.6, -2], [-3, -5], [3, -5], [6, -4.6], [9, -2]];

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
      if (inYard) c.setRGB(0.62 + j, 0.57 + j, 0.47 + j); else c.setRGB(0.32 + j, 0.47 + j, 0.28 + j); // 2026-10-25: 마당 흙이 거의 하얗게 보여 한 단계 짙게
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
  // 법당으로 가는 박석 길과 석등 둘, 담 너머 양옆의 요사채(스님들이 지내는 기와집)
  { const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 19), mat(0xb3ab99, 'stone')); m.position.set(0, 0.03, 1.5); m.receiveShadow = true; L.add(m); }
  for (const sx of [-1, 1]) {
    const lx = sx * 2.4, lz = -7.4;
    mk(new THREE.CylinderGeometry(0.42, 0.5, 0.3, 8), 0xb3ab99, lx, 0.15, lz);
    mk(new THREE.CylinderGeometry(0.13, 0.13, 1.0, 8), 0xb3ab99, lx, 0.8, lz);
    mk(new THREE.BoxGeometry(0.62, 0.55, 0.62), 0xb3ab99, lx, 1.58, lz);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.64), new THREE.MeshBasicMaterial({ color: 0xffd38a })); glow.position.set(lx, 1.58, lz); L.add(glow);
    mk(new THREE.ConeGeometry(0.56, 0.42, 4), 0xb3ab99, lx, 2.08, lz).rotation.y = Math.PI / 4;
    world.addCollider({ x: lx, z: lz, r: 0.55 });
    const g = new THREE.Group(); g.position.set(sx * 21, 0, -5); g.rotation.y = -sx * Math.PI / 2; g.scale.setScalar(1.2); L.add(g); hanok(g, { tile: true });
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
    const fire = makeFire({ size: 0.45, detail: world.quality.particles }); fire.group.position.set(x + 1.4, 0.15, z); fire.setLit(true); L.add(fire.group); // 솥 아래 장작불
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
  // 3-1) 마구리 작업대(덧댈 나무 조각)
  {
    const [x, z] = STATIONS[4];
    mk(new THREE.BoxGeometry(1.6, 0.8, 1), 0x6b4a32, x, 0.4, z);
    for (let k = 0; k < 4; k++) mk(new THREE.BoxGeometry(0.14, 0.12, 0.9), 0x9a7448, x - 0.5 + k * 0.32, 0.86, z);
    world.addCollider({ x, z, r: 1 });
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

  // 말을 거는 사람: 장인 한 명과 스님. 다른 장인 셋은 제자리에서 일하는 배경(말 걸기 없음)
  world.addNpc('artisan1', LOOKS.artisan, -9, 0.3, Math.PI);
  world.addNpc('monk', LOOKS.monk, 0, 3, Math.PI);
  setWork(world.npcs.get('artisan1').mesh, 'sweep');
  const workers = [[-3, -2.8, 'carry'], [3, -3.3, 'hammer'], [9, 0.3, 'sweep']].map(([x, z, w]) => {
    const p = makePerson(LOOKS.artisan); p.position.set(x, 0, z); p.rotation.y = Math.PI; L.add(p); setWork(p, w); world.addCollider({ x, z, r: 0.7 }); return p;
  });

  // 공방 연출: 작업대로 가는 판 하나, 바닷물 물결, 삶는 김
  const fx = new THREE.Group(); L.add(fx);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.5), mat(0xc9a26b)); board.visible = false; fx.add(board);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe8f4fa, transparent: true, opacity: 0 })); ripple.position.set(STATIONS[0][0], 0.92, STATIONS[0][1]); fx.add(ripple);
  const steam = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 7, 5), new THREE.MeshLambertMaterial({ color: 0xf2f2f0, transparent: true, opacity: 0, depthWrite: false })); m.position.set(STATIONS[1][0] + (i - 1) * 0.3, 1.4, STATIONS[1][1]); fx.add(m); return m; });
  let workT = -1, workAt = 0, workDone = null;
  // 두 판이 겹치면 앞 판의 연출은 바로 끝내고 새 판을 보인다(약속은 모두 지켜진다)
  const work = i => new Promise(res => { const prev = workDone; workDone = null; prev?.(); workAt = i; workT = 0; board.visible = true; workDone = res; });

  world.onUpdate((dt, t) => {
    for (const f of stations) f.update(dt, t);
    if (workT < 0) return;
    workT += dt;
    const [x, z] = STATIONS[workAt], k = Math.min(1, workT / 0.3);
    board.position.set(x * k, 1.2 + Math.sin(Math.min(1, workT / 0.3) * Math.PI) * 1.2 + Math.abs(Math.sin(workT * 12)) * 0.1, 5 + (z - 5) * k);
    if (workAt === 0) { ripple.material.opacity = Math.max(0, 0.8 - workT); ripple.scale.setScalar(1 + workT * 3); }
    if (workAt === 1) steam.forEach((m, j) => { const q = (workT * 1.2 + j / 3) % 1; m.material.opacity = 0.6 * Math.sin(Math.PI * q); m.position.y = 1.3 + q * 2; m.scale.setScalar(0.6 + q); });
    if (workT >= 0.7) { workT = -1; board.visible = false; ripple.material.opacity = 0; steam.forEach(m => { m.material.opacity = 0; }); const f = workDone; workDone = null; f?.(); }
  });
  backdropMountains(world.level, { color: 0x4f6a3e, radius: 130 }); // 먼 산줄기(깊이감)
  surroundings(world, { bounds: world.bounds, trees: ['pine', 'pine', 'tree'], count: 12, seed: 5 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  // 선반: 완성한 판 수만큼 경판이 보인다(놀이 숫자, 실제 판 수와 상관없음)
  const shelfBoards = library.children.filter(c => c.geometry.parameters?.width === 0.12);
  const shelf = n => { library.visible = true; shelfBoards.forEach((b, i) => { b.visible = i < n * 3; }); };
  const fullLibrary = () => { library.visible = true; shelfBoards.forEach(b => { b.visible = true; }); };
  const sea = buildSea(world);
  return { library, start: [0, 9], workers, fx, work, shelf, fullLibrary, sea,
    // 공방 놀이 카메라: 작업대 여섯이 위쪽에, 아래는 벨트와 작업대 단추 자리
    workCam: { pos: [0, 12.5, 12], target: [0, -1.2, -4.5] } };
}
