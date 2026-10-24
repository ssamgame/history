// 2장 장면: 눈 덮인 흥화진 성, 북쪽의 거란 진영, 성 남쪽의 눈 들판.
import { makeSign } from '../../core/signs.js';
import * as THREE from 'three';
import { backdropMountains } from '../kit/terrain.js';
import { hanok, woodpile, jars, straw } from '../kit/buildings.js';
import { BUILD } from '../kit/town.js';
import { makeFire } from '../../core/fire.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, makePerson } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { LOOKS, look } from '../../content/characters.js';
import { createWeather } from '../../core/weather.js';

const HALF = 12;          // 성 안쪽 반 너비
const WALL_H = 4.2;
const LADDER_Z = -14.5;   // 사다리 밑동 (북쪽 성벽 바깥)
const FIELD_Z = 50;       // 들판 중심

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildCh2Scene(world) {
  const L = world.level, rand = seeded(11);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  world.bounds = { x0: -10.5, x1: 10.5, z0: -10.5, z1: 7 };

  // 눈 덮인 땅
  {
    const g = new THREE.PlaneGeometry(240, 240, 60, 60); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), far = Math.max(0, Math.hypot(x, z - 20) - 60);
      p.setY(i, Math.min(far * far * 0.01, 16) + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.15);
      const j = rand() * 0.04;
      c.setRGB(0.9 + j, 0.92 + j, 0.95 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grain'));
    t.receiveShadow = true; L.add(t);
  }
  // 성벽 (남쪽에 성문)
  const stone = 0xe4ded2; // 밝은 돌색(돌 무늬가 조금 어둡게 하므로 더 밝게): 사다리와 거란 병사가 잘 보이도록
  mk(new THREE.BoxGeometry(HALF * 2 + 3.2, WALL_H, 1.6), stone, 0, WALL_H / 2, -HALF - 0.8);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(1.6, WALL_H, HALF * 2 + 3.2), stone, sx * (HALF + 0.8), WALL_H / 2, 0);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(HALF - 2.5 + 1.6, WALL_H, 1.6), stone, sx * (2.5 + (HALF - 2.5 + 1.6) / 2), WALL_H / 2, HALF + 0.8);
  mk(new THREE.BoxGeometry(5, WALL_H - 1, 0.4), 0x5d4330, 0, (WALL_H - 1) / 2, HALF + 0.8);
  // 성벽 위에 쌓인 눈
  mk(new THREE.BoxGeometry(HALF * 2 + 3.4, 0.14, 1.7), 0xf2f5f7, 0, WALL_H + 0.07, -HALF - 0.8, L, false);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(1.7, 0.14, HALF * 2 + 3.4), 0xf2f5f7, sx * (HALF + 0.8), WALL_H + 0.07, 0, L, false);
  // 성가퀴: 북쪽 성벽은 바깥쪽에(방어 장면), 동·서 성벽에도(남쪽은 카메라가 넘겨다보는 쪽이라 비운다)
  for (let x = -HALF; x <= HALF; x += 1.8) mk(new THREE.BoxGeometry(0.9, 0.8, 0.5), 0x8c877e, x, WALL_H + 0.4, -HALF - 1.4);
  for (const sx of [-1, 1]) for (let z = -HALF + 1; z <= HALF; z += 1.8) mk(new THREE.BoxGeometry(0.5, 0.8, 0.9), 0x8c877e, sx * (HALF + 1.4), WALL_H + 0.4, z);
  // 성벽 계단
  for (let i = 0; i < 6; i++) mk(new THREE.BoxGeometry(3, 0.7 * (i + 1), 0.8), 0x8c877e, 0, 0.35 * (i + 1), -HALF + 0.4 + (5 - i) * 0.8);
  // 성안 초가와 창고
  const hut = (x, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g);
    hanok(g, { roofColor: 0xeef2f5 }); // 기단·기둥·창살을 갖춘 초가, 지붕은 눈에 덮였다
    world.addCollider({ x, z, r: 2.4 });
  };
  hut(-7, 3, 0.2); hut(7, -2, -0.3); hut(-6, -5, 0); hut(8, 7, 0.4);
  // 겨울 살림과 군량: 장작더미·쌀가마(예전 상자 자리), 장독대, 짚더미, 우물
  const put = (fn, x, z, ry = 0, p = {}, r = 0.8) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g); fn(g, p); world.addCollider({ x, z, r }); return g; };
  put(woodpile, 3.4, 3.3, 0.3); put(BUILD.rice, -2, 8.2, 0, { n: 6 }, 1.2);
  put(jars, -9.6, 0.6, Math.PI / 2, { n: 5 }, 1.0); put(straw, 9.8, -6.5, 0, {}, 1.0); put(BUILD.well, -1.5, -2.6, 0, {}, 0.9);
  // 성문에서 성벽 계단까지 사람들이 밟아 다진 눈길
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 17).rotateX(-Math.PI / 2), mat(0xc4c4c0, 'earth')); m.position.set(0, 0.03, 2.5); m.receiveShadow = true; L.add(m); }
  // 병사들이 몸을 녹이는 화톳불
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mk(new THREE.DodecahedronGeometry(0.24, 0), 0x77736a, 5 + Math.cos(a) * 0.7, 0.12, 0.5 + Math.sin(a) * 0.7); }
  const fire = makeFire({ size: 0.6, detail: world.quality.particles }); fire.group.position.set(5, 0.38, 0.5); fire.setLit(true); L.add(fire.group);
  world.addCollider({ x: 5, z: 0.5, r: 1.0 });
  world.onUpdate((dt, t) => fire.update(dt, t));
  for (const [x, z, c] of [[-10, -10, 0xb8452f], [10, -10, 0xd9a441]]) {
    mk(new THREE.CylinderGeometry(0.07, 0.07, 5, 5), 0x5a3f2a, x, WALL_H + 2.5, z);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9).translate(0.65, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, WALL_H + 4, z); L.add(f);
  }
  // 소나무
  for (let i = 0; i < 40; i++) {
    const a = rand() * Math.PI * 2, d = 30 + rand() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d + 20;
    if (Math.abs(x) < 26 && z > 16 && z < 80) continue;
    if (Math.abs(x) < 32 && z < -14 && z > -60) continue; // 성벽 방어 카메라 앞을 가리지 않게
    mk(new THREE.ConeGeometry(1.4, 3.6, 6), 0x3e5f4a, x, 2.4, z);
    mk(new THREE.ConeGeometry(1.0, 1.2, 6), 0xf2f5f7, x, 3.9, z);
  }
  // 북쪽 거란 진영
  const khitan = new THREE.Group(); L.add(khitan);
  for (const [x, z] of [[-14, -36], [-4, -40], [7, -37], [16, -42], [-20, -46], [0, -50], [12, -52]]) {
    mk(new THREE.CylinderGeometry(2.1, 2.1, 1.7, 9), 0x8f7556, x, 0.85, z, khitan);
    mk(new THREE.ConeGeometry(2.4, 1.5, 9), 0x5e432c, x, 2.45, z, khitan);
  }
  const khitanFront = new THREE.Group(); khitan.add(khitanFront); // 성벽 앞 거란군 줄 (성벽 방어 때는 치운다)
  for (let i = 0; i < 10; i++) {
    const k = makePerson(LOOKS.khitan);
    k.position.set(-18 + i * 4, 0, -24 - (i % 2) * 2); khitanFront.add(k);
  }

  // 사다리 6개와 오르는 거란 병사 (처음엔 숨김)
  const len = Math.hypot(WALL_H, LADDER_Z + HALF + 1.6 + 0.0);
  const tilt = Math.atan2(-(LADDER_Z + HALF + 1.6), WALL_H);
  const ladders = [-10, -6, -2, 2, 6, 10].map(x => {
    const group = new THREE.Group(); group.position.set(x, 0, LADDER_Z); group.visible = false; L.add(group);
    const pivot = new THREE.Group(); pivot.rotation.x = tilt; group.add(pivot);
    // 굵고 밝은 나무 사다리 (멀리서도 보이도록)
    for (const sx of [-0.42, 0.42]) mk(new THREE.BoxGeometry(0.2, len, 0.2), 0xb07a42, sx, len / 2, 0, pivot);
    for (let y = 0.4; y < len; y += 0.5) mk(new THREE.BoxGeometry(0.84, 0.12, 0.12), 0xc48a4c, 0, y, 0, pivot);
    const top = new THREE.Object3D(); top.position.set(0, len - 0.3, 0); pivot.add(top);
    // 사다리를 타는 병사: 밝은 옷에 붉은 띠로 성벽 위에서 눈에 띄게
    const climber = makePerson(LOOKS.khitanBright); climber.visible = false; pivot.add(climber);
    // 사다리를 세우는 병사: 사다리 밑동에 서 있다
    const carrier = makePerson(LOOKS.khitanBright); carrier.position.set(0.9, 0, -0.6); carrier.visible = false; group.add(carrier);
    return { x, group, pivot, top, climber, carrier, len, tilt };
  });

  // 들판의 끌려가는 백성 무리 6개
  const captives = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); g.visible = false; L.add(g);
    for (let k = 0; k < 3; k++) {
      const v = makePerson(look('villager', { robe: [0xe8e2d6, 0xd8cfbf, 0xc9bda8][k] }));
      v.position.set((k - 1) * 0.9, 0, (k % 2) * 0.6); v.rotation.y = Math.PI; g.add(v);
    }
    const escort = makePerson(LOOKS.khitan); escort.position.set(0, 0, -1.4); escort.rotation.y = Math.PI; g.add(escort);
    captives.push({ group: g, escort, start: [-18 + i * 7.2 + (rand() - 0.5) * 2, FIELD_Z - 6 + rand() * 6] }); // 플레이어보다 앞(북쪽)에서 출발
  }
  // 눈 위로 드러난 바위와 마른 풀 (성 밖 들판)
  const snowH = (x, z) => { const far = Math.max(0, Math.hypot(x, z - 20) - 60); return Math.min(far * far * 0.01, 16) + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.15; };
  scatter(world, { kind: 'rock', count: 30, area: { x0: -60, x1: 60, z0: 14, z1: 90 }, avoid: [{ x: 0, z: 46, r: 22 }], seed: 31, ground: snowH, scale: [0.6, 1.8], color: 0x9aa0a6 });
  scatter(world, { kind: 'grass', count: 120, area: { x0: -40, x1: 40, z0: 14, z1: 80 }, seed: 32, ground: snowH, scale: [0.6, 1.1], color: 0xa89470 });
  scatter(world, { kind: 'bush', count: 30, area: { x0: -70, x1: 70, z0: -70, z1: -16 }, avoid: [{ x: 0, z: -30, r: 26 }], seed: 33, ground: snowH, color: 0xdfe6ea });
  createWeather(world, 'snow', { count: 700 });

  world.addNpc('soldier', LOOKS.soldier, 5, 4.5, Math.PI * 0.8);
  world.addNpc('yanggyu', LOOKS.yanggyu, -3, -7, 0);
  world.addNpc('villager', LOOKS.villager, -8, 5.5, Math.PI * 0.6);
  // 안내판(볼거리): 읽지 않아도 장은 끝난다
  world.addSpot('signHeunghwa', makeSign('흥화진'), 0.5, 2);
  world.addSpot('signNaju', makeSign('현종의 피란'), 3, -5.5);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.08, -6); ring.visible = false; L.add(ring);
  world.onUpdate((dt, t) => { if (ring.visible) ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.3; });

  backdropMountains(world.level, { color: 0xc8ccd0, radius: 130 }); // 먼 산줄기(깊이감)
  return {
    ring, stairs: { x: 0, z: -6, r: 1.6 }, ladders, captives, khitan, khitanFront,
    wallCam: { pos: [0, 10.5, -36], target: [0, 2.5, -13] },
    // 성벽 방어 카메라가 화면 비율과 상관없이 담아야 할 점들: 성벽 양 끝과 사다리 6개의 밑동·꼭대기
    wallFit: {
      target: [0, 2.5, -13], dir: [0, 8, -23],
      points: [[-14.4, 0, -14.5], [14.4, 0, -14.5], [-14.4, WALL_H + 1, -13.6], [14.4, WALL_H + 1, -13.6],
        ...[-10, -6, -2, 2, 6, 10].flatMap(x => [[x, 0, LADDER_Z], [x, WALL_H + 0.8, -HALF - 1.6]])],
    },
    field: { bounds: { x0: -24, x1: 24, z0: 20, z1: 72 }, start: [0, 68], lostZ: 21 }, // 플레이어는 남쪽에서 북쪽(화면 위)으로 쫓아간다
    start: [0, 6],
  };
}
