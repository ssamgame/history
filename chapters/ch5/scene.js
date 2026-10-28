// 5장 장면: 아침 산사의 경판 작업장 — 남쪽 문(시작 장면), 바닷물 통, 솥, 그늘 말림 선반, 판각대, 마구리 작업대, 옻칠 작업대, 경판 더미.
// 학생이 들고 다니며 만드는 나무판(plank)은 일을 마칠 때마다 모습이 한 단계씩 바뀐다(D-17).
import * as THREE from 'three';
import { backdropMountains, surroundings } from '../kit/terrain.js';
import { curvedHipRoof, hanok } from '../kit/buildings.js';
import { makeFire } from '../../core/fire.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, setWork } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { LOOKS } from '../../content/characters.js';
import { gateLeaves, nameBoard } from '../kit/gate.js';

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

  // 작업대 (장인 곁)
  const fires = [];
  // 1) 바닷물 통과 솥
  {
    const x = -9, z = -2;
    mk(new THREE.CylinderGeometry(1.2, 1.1, 0.9, 12), 0x6b4a32, x - 1.6, 0.45, z);
    mk(new THREE.CylinderGeometry(1.05, 1.05, 0.05, 12), 0x4a7f9c, x - 1.6, 0.86, z, L, false);
    mk(new THREE.CylinderGeometry(0.9, 0.7, 0.9, 12), 0x3a3a3a, x + 1.4, 0.75, z);
    const fire = makeFire({ size: 0.45, detail: world.quality.particles }); fire.group.position.set(x + 1.4, 0.15, z); fire.setLit(true); L.add(fire.group); // 솥 아래 장작불
    fires.push(fire);
    world.addCollider({ x: x - 1.6, z, r: 1.3 }); world.addCollider({ x: x + 1.4, z, r: 1 });
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
  // 4) 마구리 작업대: 판 양 끝에 덧댈 나무토막과 구리판
  {
    const x = 6.2, z = -5.2;
    mk(new THREE.BoxGeometry(2, 0.85, 1.1), 0x6b4a32, x, 0.43, z);
    for (let k = 0; k < 4; k++) mk(new THREE.BoxGeometry(0.16, 0.14, 0.62), 0x8a5a3a, x + 0.45 + k * 0.2, 0.92, z - 0.1);
    mk(new THREE.BoxGeometry(0.3, 0.03, 0.3), 0xb87333, x - 0.6, 0.87, z + 0.2);
    world.addCollider({ x, z, r: 1.2 });
  }
  // 5) 옻칠 작업대와 경판 더미
  {
    const x = 9, z = -2;
    mk(new THREE.BoxGeometry(2.4, 0.9, 1.2), 0x6b4a32, x, 0.45, z);
    mk(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 10), 0x2a1a12, x - 0.6, 1.1, z);
    for (let k = 0; k < 8; k++) mk(new THREE.BoxGeometry(1.0, 0.08, 0.5), 0x3b2414, x + 2.2, 0.06 + k * 0.09, z + 0.4);
    world.addCollider({ x, z, r: 1.4 }); world.addCollider({ x: x + 2.2, z: z + 0.4, r: 0.8 });
  }

  // 경판 만드는 여섯 자리(D-17): 학생이 서는 곳(spot), 판을 내려놓는 곳(put), 지금 차례일 때만 빛나는 원(ring)
  const glowRing = () => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.visible = false; L.add(r); return r; };
  const stations = [
    ['soak', [-11.2, 0], [-10.6, 0.82, -1.7]], ['boil', [-7.4, -0.5], [-7.6, 1.24, -2]], ['dry', [-3, -1.6], [-3, 1.44, -5]],
    ['carve', [3, -1.8], [3, 1.0, -5]], ['ends', [6, -2.6], [6.2, 0.9, -5.2]], ['lacquer', [7.6, -0.4], [9.3, 0.94, -2]],
  ].map(([id, spot, put]) => { const ring = glowRing(); ring.position.set(spot[0], 0.08, spot[1]); return { id, spot, put, ring }; });

  // 학생이 들고 다니는 나무판: 단계(stage) 0 베어 낸 나무 → 1 바닷물에 젖음 → 2 삶음 → 3 마름 → 4 글자 새김 → 5 마구리 → 6 옻칠
  const plank = new THREE.Group(); plank.name = 'plank'; plank.visible = false; L.add(plank);
  const wood = new THREE.MeshStandardMaterial({ color: 0xc8a476, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.5), wood); body.castShadow = true; plank.add(body);
  const marks = new THREE.Group(); marks.name = 'marks'; marks.visible = false; plank.add(marks);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { // 작은 글자들(줄지어 새긴 자국)
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.05), new THREE.MeshBasicMaterial({ color: 0x3a2616 }));
    m.position.set(-0.38 + c * 0.095, 0.045, -0.17 + r * 0.085); marks.add(m);
  }
  const ends = new THREE.Group(); ends.name = 'ends'; ends.visible = false; plank.add(ends);
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.54), new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 })); e.position.set(sx * 0.55, 0, 0); ends.add(e);
    for (const sz of [-1, 1]) { const cu = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.06), new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.5, roughness: 0.4 })); cu.position.set(sx * 0.55, 0, sz * 0.26); ends.add(cu); } // 귀퉁이 구리판
  }
  // 大藏經 세 글자: 새길 때마다 한 자씩 판 가운데에 나타난다
  const lc = document.createElement('canvas'); lc.width = 256; lc.height = 128;
  const ltex = new THREE.CanvasTexture(lc);
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.42), new THREE.MeshBasicMaterial({ map: ltex, transparent: true }));
  letters.name = 'letters'; letters.rotation.x = -Math.PI / 2; letters.position.y = 0.048; letters.visible = false; plank.add(letters);
  const STAGE_COLOR = [0xc8a476, 0x7d6a52, 0x9a7650, 0xd2b07e, 0xd2b07e, 0xd2b07e, 0x3b2414];
  const setStage = n => {
    plank.userData.stage = n;
    wood.color.setHex(STAGE_COLOR[n]); wood.roughness = n >= 6 ? 0.35 : n === 1 ? 0.55 : 0.9; // 젖으면 짙고 촉촉하게, 옻칠하면 윤이 난다
    marks.visible = n >= 4; ends.visible = n >= 5;
    marks.children.forEach(m => m.material.color.setHex(n >= 6 ? 0x1a0e08 : 0x3a2616));
  };
  const setCarved = (n, glyphs = ['大', '藏', '經']) => {
    plank.userData.carved = n;
    const g = lc.getContext('2d');
    if (g) {
      g.clearRect(0, 0, 256, 128); g.fillStyle = 'rgba(242, 214, 150, 0.95)'; g.font = 'bold 76px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      glyphs.slice(0, n).forEach((ch, i) => g.fillText(ch, 48 + i * 80, 66));
      ltex.needsUpdate = true;
    }
    letters.visible = n > 0; marks.visible = plank.userData.stage >= 4 && n === 0; // 큰 글자를 새기면 작은 자국 대신 글자가 보인다
  };
  setStage(0); setCarved(0);

  // 완성된 경판 선반(서가): 맨 위 칸 가운데를 비워 두었다가 학생이 새긴 경판을 꽂는다
  const library = new THREE.Group(); library.visible = false; library.position.set(-8, 0, 6.3); L.add(library);
  for (let row = 0; row < 3; row++) for (let k = 0; k < 14; k++) if (!(row === 2 && k === 7)) mk(new THREE.BoxGeometry(0.12, 0.6, 0.5), 0x3b2414, -3 + k * 0.45, 0.4 + row * 0.75, 0, library);
  for (let row = 0; row < 4; row++) mk(new THREE.BoxGeometry(7, 0.08, 0.7), 0x5a3f2a, 0, 0.08 + row * 0.75, 0, library);
  const shelf = { spot: [-8, 7.7], slot: [-3 + 7 * 0.45, 0.4 + 2 * 0.75, 0], ring: glowRing() };
  shelf.ring.position.set(shelf.spot[0], 0.08, shelf.spot[1]);

  // 남쪽 문(시작 장면): 낮은 돌담 사이 나무 문. 카메라를 가리지 않게 낮게 짓는다
  const GATE_Z = 11.6;
  for (const sx of [-1, 1]) {
    mk(new THREE.BoxGeometry(14.3, 1.0, 0.8), 0x8c8577, sx * 9.35, 0.5, GATE_Z);
    mk(new THREE.BoxGeometry(14.6, 0.25, 1.1), 0x3d4846, sx * 9.35, 1.12, GATE_Z);
    mk(new THREE.BoxGeometry(0.4, 2.5, 0.4), 0x5a3f2a, sx * 2.05, 1.25, GATE_Z);
  }
  const gate = gateLeaves(L, { x: 0, z: GATE_Z, width: 3.7, height: 2.2, color: 0x6b4a32, inward: 1 }); // 바깥으로 열려 들어온 뒤 화면 앞을 가리지 않는다
  nameBoard(L, '경판 작업장', 2.8, 9.8); // 하는 일 이름 그대로(S7~S9에 작업장 이름이 따로 없다)

  world.addNpc('artisan1', LOOKS.artisan, -9.1, -2.4, Math.PI);
  world.addNpc('artisan2', LOOKS.artisan, -3, -2.8, Math.PI);
  world.addNpc('artisan3', LOOKS.artisan, 3, -3.3, Math.PI);
  world.addNpc('artisan4', LOOKS.artisan, 9, 0.3, Math.PI);
  world.addNpc('monk', LOOKS.monk, 0, 3, Math.PI);
  // 장인마다 하는 일: 솥 젓기, 판자 나르기, 글자 새기기(망치질), 옻칠
  [['artisan1', 'sweep'], ['artisan2', 'carry'], ['artisan3', 'hammer'], ['artisan4', 'sweep']].forEach(([id, w]) => setWork(world.npcs.get(id).mesh, w));

  world.onUpdate((dt, t) => { for (const f of fires) f.update(dt, t); });
  backdropMountains(world.level, { color: 0x4f6a3e, radius: 130 }); // 먼 산줄기(깊이감)
  surroundings(world, { bounds: world.bounds, trees: ['pine', 'pine', 'tree'], count: 12, seed: 5 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return { library, shelf, stations, plank, setStage, setCarved, gate, start: [0, 7], introFrom: [0, 15] };
}
