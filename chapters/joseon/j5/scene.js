// 조선편 5장 장면: 눈 덮인 남한산성. 산 위의 둥근 성벽(여장과 서문), 북쪽 행궁, 동쪽 창고, 성벽 안쪽의 화톳불 여섯,
// 성 밖 아래 벌판에 멀리 보이는 청나라 진영.
import * as THREE from 'three';
import { backdropMountains, surroundings } from '../../kit/terrain.js';
import { makeFire } from '../../../core/fire.js';
import { curvedHipRoof, tent, woodpile, jars } from '../../kit/buildings.js';
import { groundMaterial } from '../../../core/textures.js';
import { mat, makePerson } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS } from '../../../content/characters.js';
import { createWeather } from '../../../core/weather.js';
import { addSigns } from '../common.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';

const WALL = { rx: 20, rz: 16 };

// 땅 높이: 성안은 평평한 산마루, 성 밖은 산비탈로 내려가 아래 벌판(-9)
export function groundH(x, z) {
  const e = Math.hypot(x / WALL.rx, z / WALL.rz);
  if (e <= 1.05) return 0.1 * Math.sin(x * 0.3) * Math.cos(z * 0.35);
  return -Math.min(9, (e - 1.05) * 14);
}

// 관절 넣기(D-30 N-03·N-05): 기본 인물의 한 덩어리 다리·팔을 허벅지-무릎-종아리, 위팔-팔꿈치-아래팔로 나눈다(재질·손·신발은 그대로 쓴다).
// 다리.userData.knee, 팔.userData.elbow로 굽힌다. 무릎을 꿇거나 쪼그려 앉는 사람에게만 쓴다
export function addJoints(person) {
  const u = person.userData;
  if (u.jointed) return person;
  u.legs.forEach(l => {
    if (l.userData.knee) return; // 모든 인물에 무릎이 생겼다(D-32): 다리는 그대로 쓴다
    const [box, shoe] = l.children, m = box.material;
    l.clear();
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.3, 0.23), m); thigh.position.y = -0.15; thigh.castShadow = true; l.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -0.28; l.add(knee);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.22), m); shin.position.y = -0.13; shin.castShadow = true; knee.add(shin);
    if (shoe) { shoe.position.set(0, -0.22, 0.05); knee.add(shoe); }
    l.userData.knee = knee;
  });
  u.arms.forEach(a => {
    const [box, cuff, ...rest] = a.children, hand = a.children.find(c => c.name === 'hand');
    const keep = rest.filter(c => c !== hand); // 손에 든 것(창 등)은 그대로 둔다
    a.clear();
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.2), box.material); upper.position.y = -0.18; upper.castShadow = true; a.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.36; a.add(elbow);
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.34, 0.19), box.material); fore.position.y = -0.15; fore.castShadow = true; elbow.add(fore);
    cuff.position.set(0, -0.3, 0); elbow.add(cuff);
    if (hand) { hand.position.set(0, -0.42, 0); elbow.add(hand); }
    keep.forEach(c => a.add(c));
    a.userData.elbow = elbow;
  });
  u.jointed = true;
  return person;
}
// 추위에 웅크린 자세(N-03): 무릎을 세워 쪼그려 앉고, 두 팔로 무릎을 감싸 안고, 고개를 숙인다. 떨림은 장면이 매 프레임 준다
export function huddlePose(person) {
  addJoints(person);
  const u = person.userData;
  u.manual = true; u.noWalk = true;
  // 땅에 주저앉아 무릎을 세우고(허벅지는 앞으로 조금 들리고 종아리는 아래로), 몸을 앞으로 웅크린다.
  // 몸 숙임은 자기 방향 기준이 되게 회전 순서를 YXZ로(moveNpc는 rotation.y만 바꾼다)
  person.rotation.order = 'YXZ'; person.rotation.x = 0.3;
  u.legs.forEach((l, i) => { l.rotation.set(-1.85 - 0.3, 0, (i ? -1 : 1) * 0.1); l.userData.knee.rotation.x = 1.75; });
  u.arms.forEach((a, i) => { a.rotation.set(-1.25, 0, (i ? 1 : -1) * 0.35); a.userData.elbow.rotation.x = -1.3; });
  u.head.rotation.x = 0.45;
  return 0.43; // 내려앉는 높이(엉덩이가 땅 가까이)
}

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildJ5Scene(world) {
  const L = world.level, rand = seeded(57);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const hipRoof = (w, d, h, color, x, y, z, parent = L) => curvedHipRoof(parent, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕
  world.bounds = { x0: -15, x1: 15, z0: -11, z1: 11.5 };

  // 눈 덮인 산과 벌판
  {
    const g = new THREE.PlaneGeometry(240, 240, 90, 90); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = groundH(x, z);
      p.setY(i, h);
      const j = rand() * 0.05;
      if (h < -3 && rand() < 0.35) c.setRGB(0.62 + j, 0.64 + j, 0.6 + j); else c.setRGB(0.78 + j, 0.81 + j, 0.86 + j); // 2026-10-25: 눈밭을 한 단계 낮춤(밝기 145 → 130 이하)
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('earth')); t.receiveShadow = true; L.add(t);
  }
  // 둥근 성벽: 돌 성벽 위에 여장(낮은 담), 서쪽에 성문
  const N = 44;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, x = Math.cos(a) * WALL.rx, z = Math.sin(a) * WALL.rz;
    if (Math.abs(a - Math.PI) < 0.1) continue; // 서문 자리
    const seg = mk(new THREE.BoxGeometry(3.2, 2.6, 1.2), 0xb3ada2, x, 1.3, z);
    seg.rotation.y = -Math.atan2(WALL.rz * Math.cos(a), -WALL.rx * Math.sin(a));
    const crown = mk(new THREE.BoxGeometry(1.2, 0.7, 1.0), 0x8c877e, x, 2.95, z); crown.rotation.y = seg.rotation.y;
    mk(new THREE.BoxGeometry(3.2, 0.12, 1.25), 0xf4f6f8, x, 2.66, z, L, false).rotation.y = seg.rotation.y; // 성벽 위 눈
  }
  // 서문
  // 서문(D-26): 양쪽 문기둥 벽과 위 인방 사이에 나무 문짝 둘. 학생은 이 문으로 들어오고, 인조는 이 문으로 나간다
  for (const sz of [-1, 1]) mk(new THREE.BoxGeometry(1.6, 3.4, 1.0), 0xb3ada2, -WALL.rx, 1.7, sz * 1.6);
  mk(new THREE.BoxGeometry(1.6, 0.8, 4.2), 0xb3ada2, -WALL.rx, 3.0, 0);
  hipRoof(3.2, 5.6, 1.6, 0x3d4846, -WALL.rx, 3.4, 0);
  const gateG = new THREE.Group(); gateG.position.set(-WALL.rx + 0.5, 0, 0); gateG.rotation.y = Math.PI / 2; L.add(gateG);
  const gate = gateLeaves(gateG, { x: 0, z: 0, width: 2.2, height: 2.6, color: 0x6b4a32, inward: 1 });
  nameBoard(L, '남한산성', -12, 3.4); // S38·S47
  // 행궁(북쪽)과 창고(동쪽)
  const palace = new THREE.Group(); palace.position.set(0, 0, -12); L.add(palace);
  mk(new THREE.BoxGeometry(12, 0.7, 6), 0xb3ada2, 0, 0.35, 0, palace);
  mk(new THREE.BoxGeometry(10, 2.8, 4.4), 0xe6dcc3, 0, 2.1, 0, palace);
  for (const dx of [-5, -2.5, 0, 2.5, 5]) mk(new THREE.CylinderGeometry(0.2, 0.2, 2.8, 8), 0xa8392b, dx, 2.1, 2.3, palace);
  hipRoof(14, 8, 2.2, 0x3d4846, 0, 3.5, 0, palace);
  mk(new THREE.BoxGeometry(13, 0.15, 7.4), 0xf4f6f8, 0, 5.75, 0, palace, false).scale.set(0.2, 1, 0.2); // 용마루 눈
  for (const dx of [-4, 0, 4]) world.addCollider({ x: dx, z: -12, r: 3.4 });
  const store = new THREE.Group(); store.position.set(12, 0, -3); L.add(store);
  mk(new THREE.BoxGeometry(4.4, 2.4, 6), 0x8a6a45, 0, 1.2, 0, store);
  hipRoof(6, 8, 1.6, 0x3d4846, 0, 2.4, 0, store);
  for (let i = 0; i < 5; i++) mk(new THREE.CylinderGeometry(0.4, 0.45, 0.8, 10), 0xc8a476, -2.8, 0.4, -2 + i * 1.0, store);
  world.addCollider({ x: 12, z: -4.5, r: 2.4 }); world.addCollider({ x: 12, z: -1.5, r: 2.4 });
  mk(new THREE.BoxGeometry(1.2, 0.12, 8), 0xf4f6f8, 0, 3.95, 0, store, false); // 창고 지붕에 쌓인 눈
  // 성안 살림: 눈 덮인 군막, 화톳불 옆 장작, 창고 옆 장독대(얼마 남지 않은 양식)
  const put = (fn, x, z, ry = 0, p = {}, r = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g); fn(g, p); if (r) world.addCollider({ x, z, r }); return g; };
  put(tent, -11, -0.5, Math.PI / 2 + 0.2, { color: 0xcfc4a8 }, 1.8); put(tent, 7, 8.5, 0.3, { color: 0xcfc4a8 }, 1.8);
  put(woodpile, 1.6, 10.6, 0.2, {}, 0.8); put(woodpile, -5.2, -9.6, 0.4, {}, 0.8);
  put(jars, 10.6, 2.2, -Math.PI / 2, { n: 4 }, 1.0);
  // 성벽 안쪽 화톳불 여섯 (처음엔 꺼져 있음)
  const firePos = [[-12, 7.5], [-1, 10], [10, 8], [13.5, 4], [-13.5, -4], [-7, -8.5]];
  const fires = firePos.map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); L.add(g);
    mk(new THREE.CylinderGeometry(0.5, 0.35, 0.6, 8), 0x3a3028, 0, 0.3, 0, g);
    for (let k = 0; k < 3; k++) mk(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 5), 0x5a3f2a, Math.cos(k * 2.1) * 0.15, 0.6, Math.sin(k * 2.1) * 0.15, g).rotation.z = 0.5;
    const fx = makeFire({ size: 1, detail: world.quality.particles ?? 1 }); // 겹친 불꽃·불빛·불티·연기
    fx.group.position.set(0, 1.0, 0); g.add(fx.group);
    world.addCollider({ x, z, r: 0.5 });
    return { x, z, g, fx, flame: fx.group, lit: false };
  });
  const setFire = (f, on) => { f.lit = on; f.fx.setLit(on); f.flame.visible = on; };
  // 성벽 위를 지키는 병사들
  for (const a of [0.4, 1.2, 2.0, 4.0, 4.9, 5.7]) {
    const s = makePerson(LOOKS.joseonSoldier);
    s.position.set(Math.cos(a) * (WALL.rx - 1.6), 0, Math.sin(a) * (WALL.rz - 1.6)); s.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); L.add(s);
  }
  // 성 밖 아래 벌판의 청나라 진영 (멀리)
  for (let i = 0; i < 9; i++) {
    const x = -40 + i * 10, z = 52 + (i % 3) * 7;
    mk(new THREE.CylinderGeometry(2, 2, 1.6, 9), 0x8f7556, x, groundH(x, z) + 0.8, z);
    mk(new THREE.ConeGeometry(2.3, 1.4, 9), 0x5e432c, x, groundH(x, z) + 2.3, z);
  }
  for (let i = 0; i < 6; i++) {
    const x = -25 + i * 10, z = 44;
    mk(new THREE.CylinderGeometry(0.08, 0.08, 4, 5), 0x5a3f2a, x, groundH(x, z) + 2, z);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8).translate(0.7, 0, 0), new THREE.MeshLambertMaterial({ color: i % 2 ? 0xd9a441 : 0x3c5a7a, side: THREE.DoubleSide }));
    f.position.set(x, groundH(x, z) + 3.2, z); L.add(f);
    const q = makePerson(LOOKS.qingSoldier); q.position.set(x + 1.5, groundH(x + 1.5, z), z); q.rotation.y = Math.PI; L.add(q);
  }
  scatter(world, { kind: 'pine', count: 60, area: { x0: -80, x1: 80, z0: -80, z1: 80 }, avoid: [{ x: 0, z: 0, r: 26 }, { x: 0, z: 52, r: 30 }], seed: 91, ground: groundH, scale: [1, 1.6], color: 0x41604a });
  createWeather(world, 'snow', { count: 700 });

  // 길 위 안내판 대신 건물 간판(C-03): 행궁 처마 아래, 서문 인방 위(성안 쪽). 해설은 사람 대사로 옮겼다
  addSigns(world, [
    { id: 'plaqueHaenggung', title: '행궁', x: 0, z: -8.6, ry: 0, plaque: { y: 3.0, back: 0.8 } },
    { id: 'plaqueWestGate', title: '서문', x: -18.2, z: 0, ry: Math.PI / 2, plaque: { y: 3.0, back: 0.92 } },
  ]);

  // 추위에 떠는 백성(N-03): 꺼진 화톳불 곁에 웅크려 앉아 떤다. 곁의 아이도 함께
  const folk = world.addNpc('coldfolk', LOOKS.peasant, -3.4, 8.3, Math.atan2(2.4, 1.7));
  const drop = huddlePose(folk.mesh); folk.mesh.position.y = -drop; folk.mark.position.y = 3.0;
  const kid = makePerson(LOOKS.villager); kid.scale.setScalar(0.72); kid.position.set(-4.3, -drop * 0.72, 8.9); kid.rotation.y = Math.atan2(3.3, 1.1); huddlePose(kid); L.add(kid);
  // 도입 장면(C-03)에만 쓰는 무리: ① 벌판에서 산성 쪽으로 올라오는 청나라 군대 ② 서문 밖에서 걸어 들어오는 인조와 세자·신하
  const introQing = new THREE.Group(); introQing.visible = false; L.add(introQing);
  for (let i = 0; i < 12; i++) { const q = makePerson(LOOKS.qingSoldier); q.position.set(-4 + (i % 4) * 2.2, 0, 40 + Math.floor(i / 4) * 2.4); q.rotation.y = Math.PI; introQing.add(q); }
  for (const x of [-5.4, 4.4]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8).translate(0.7, 0, 0), new THREE.MeshLambertMaterial({ color: x < 0 ? 0xd9a441 : 0x3c5a7a, side: THREE.DoubleSide })); f.position.set(x, 3.2, 40); f.userData.dy = 3.2; introQing.add(f);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 5), mat(0x5a3f2a)); pole.position.set(x, 2.1, 40); pole.userData.dy = 2.1; introQing.add(pole); }
  const introKing = new THREE.Group(); introKing.visible = false; L.add(introKing);
  [[LOOKS.injo, 0, 0], [{ ...LOOKS.injo, robe: 0x4a6a58, hat: 'official' }, -1.6, -1.1], [LOOKS.joseonOfficial, -1.6, 1.1], [LOOKS.joseonSoldier, -3.2, -0.9], [LOOKS.joseonSoldier, -3.2, 0.9]]
    .forEach(([look, x, z]) => { const p = makePerson(look); p.position.set(x, 0, z); p.rotation.y = Math.PI / 2; introKing.add(p); });
  introKing.position.set(-22.5, 0, 0); // 서문 바로 밖(더 멀면 비탈 아래로 숨는다)
  const groundAll = g => g.children.forEach(c => { c.position.y = groundH(g.position.x + c.position.x, g.position.z + c.position.z) + (c.userData.dy || 0); });
  groundAll(introQing); groundAll(introKing);

  world.addNpc('soldier', LOOKS.joseonSoldier, -9, 6, Math.PI * 0.7);
  world.addNpc('keeper', LOOKS.worker, 9, -2, -Math.PI / 2);
  world.addNpc('kimsangheon', LOOKS.kimsangheon, -3, -7, 0);
  world.addNpc('injo', LOOKS.injo, 0, -7.6, 0); world.npcs.get('injo').mesh.visible = false; // 삼전도로 갈 때 나온다
  world.addNpc('choemyeonggil', LOOKS.choemyeonggil, 3, -7, 0);

  world.onUpdate((dt, t) => {
    for (const f of fires) f.fx.update(dt, t);
    // 추위에 떠는 몸: 빠르고 잘게 좌우로 떨고, 이따금 더 세게 떤다(사람마다 박자가 다르다)
    if (folk.mesh.visible) folk.mesh.rotation.z = Math.sin(t * 37) * 0.022 * (1 + 0.6 * Math.max(0, Math.sin(t * 0.9)));
    kid.rotation.z = Math.sin(t * 41 + 1.3) * 0.025;
    if (introQing.visible) groundAll(introQing);
    if (introKing.visible) groundAll(introKing);
  });

  backdropMountains(world.level, { color: 0xc8ccd0, radius: 130 }); // 먼 산줄기(깊이감)
  surroundings(world, { bounds: world.bounds, trees: ['pine', 'bare'], count: 10, snow: true, gap: 8, seed: 17 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return {
    start: [-12, 1], introFrom: [-26, 0], gate, fires, introQing, introKing, coldKid: kid, wood: { x: 1.6, z: 9.2 }, westGate: [-WALL.rx, 0],
    resetFires() { fires.forEach(f => setFire(f, false)); },
    light(f) { setFire(f, true); },
    allLit() { fires.forEach(f => setFire(f, true)); },
  };
}
