// 4장 장면: 흐린 하늘 아래 다섯 구역 — 압록강 가(저고여 사건), 개경 궁궐 앞, 강화도 해협, 처인성, 충주성. 안개가 서로를 가린다.
import * as THREE from 'three';
import { curvedHipRoof, tree, wall, hanok, boat, straw, woodpile } from '../kit/buildings.js';
import { backdropMountains } from '../kit/terrain.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, makePerson } from '../../core/people.js';
import { makeHorse, mount } from '../../core/horse.js';
import { scatter } from '../../core/props.js';
import { LOOKS } from '../../content/characters.js';
import { gateLeaves, nameBoard } from '../kit/gate.js';
import { burning } from '../kit/fire.js';

const JEOGO_X = -78, PALACE_X = 0, GANGHWA_X = 160, CHEOIN_X = 320, CHUNGJU_X = 480;
const CHEOIN_R = 12;     // 처인성 토성 반지름
const SPAWN_R = 34;      // 몽골군이 나타나는 거리
const WALL_TOP = 2.4;    // 처인성 흙성 위 높이(학생이 걷는 곳)
export const PALACE_GATE_Z = 28; // 개경 궁궐 앞 남문(D-13 시작 장면)
// 처인성 흙성 오르는 비탈(D-13): 성 안 북서쪽에서 성 중심을 향해 뻗은 흙 비탈. RAMP_A 방향으로 RAMP_R0 ~ 성벽까지
// 들판 땅 높이(아래 '넓은 풀밭'과 같은 식): 처인성 둘레에서 사람·말을 땅 위에 세울 때 쓴다(2026-10-30 몽골군이 땅에 묻히지 않게)
export const fieldH = (x, z) => { const far = Math.max(0, Math.abs(z) - 45); return 0.12 * Math.sin(x * 0.3) * Math.cos(z * 0.25) + Math.min(far * far * 0.02, 12); };
export const CHEOIN = { x: CHEOIN_X, z: 0, R: CHEOIN_R, top: WALL_TOP, rampA: Math.PI + 0.42, ramp0: CHEOIN_R - 7, arc: [Math.PI + 0.42, Math.PI * 2 - 0.42] };
// 처인성에서 학생이 설 수 있는 곳(비탈 또는 성벽 위)으로 자리를 옮기고 그 높이를 돌려준다
export function cheoinPlace(p) {
  const C = CHEOIN, dx = p.x - C.x, dz = p.z - C.z;
  let r = Math.hypot(dx, dz), a = Math.atan2(dz, dx); if (a < 0) a += Math.PI * 2;
  const along = r * Math.cos(a - C.rampA), side = r * Math.sin(a - C.rampA);
  if (r < C.R - 0.9 && along < C.R - 0.9) { // 비탈 위: 옆으로는 좁게, 아래·위 끝까지
    const al = Math.max(C.ramp0, along), sd = Math.max(-0.6, Math.min(0.6, side));
    p.x = C.x + Math.cos(C.rampA) * al - Math.sin(C.rampA) * sd; p.z = C.z + Math.sin(C.rampA) * al + Math.cos(C.rampA) * sd;
    return C.top * (al - C.ramp0) / (C.R - C.ramp0);
  }
  r = Math.max(C.R - 0.25, Math.min(C.R + 0.15, r)); a = Math.max(C.arc[0], Math.min(C.arc[1], a)); // 성벽 위: 북쪽 반원을 따라 걷는다
  p.x = C.x + Math.cos(a) * r; p.z = C.z + Math.sin(a) * r;
  return C.top;
}
export function cheoinHeight(x, z) { return cheoinPlace({ x, z }); }

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildCh4Scene(world) {
  const L = world.level, rand = seeded(23);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const hipRoof = (w, d, h, color, x, y, z, parent = L) => curvedHipRoof(parent, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕

  // 넓은 풀밭 (강화도 구역은 바다)
  {
    const g = new THREE.PlaneGeometry(720, 220, 140, 44); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + 240, z = p.getZ(i);
      let h = 0.12 * Math.sin(x * 0.3) * Math.cos(z * 0.25);
      const far = Math.max(0, Math.abs(z) - 45);
      h += Math.min(far * far * 0.02, 12);
      if (Math.abs(x - GANGHWA_X) < 60 && z < 4) h = -1.2; // 해협
      if (Math.abs(x - PALACE_X) < 16 && z > -12 && z < 42) h = Math.min(h, -0.05); // 궁궐 마당은 평평하게(박석 아래)
      if (Math.abs(x - JEOGO_X) < 34 && z > -20 && z < 14) h = Math.min(h, -0.05); // 압록강 가: 강물과 길이 땅에 묻히지 않게 평평하게
      p.setX(i, x); p.setY(i, h);
      const j = rand() * 0.04;
      c.setRGB(0.36 + j, 0.47 + j, 0.3 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass'));
    t.receiveShadow = true; L.add(t);
  }

  // 0) 압록강 가: 1225년 고려에 왔다가 돌아가던 몽골 사신 저고여가 강가 길에서 누군가에게 죽임을 당한다(누가 했는지는 밝혀지지 않았다).
  const jeogo = {};
  {
    const river = new THREE.Mesh(new THREE.PlaneGeometry(60, 12).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x4f7488, shininess: 40, transparent: true, opacity: 0.92 }));
    river.position.set(JEOGO_X, 0.06, -10); L.add(river);
    mk(new THREE.BoxGeometry(60, 0.04, 3), 0x8f7556, JEOGO_X, 0.03, 2, L, false); // 강가 길
    scatter(world, { kind: 'grass', count: 90, area: { x0: JEOGO_X - 28, x1: JEOGO_X + 28, z0: -4.5, z1: -1 }, seed: 61, scale: [1.1, 1.8], color: 0x7a8a50 }); // 갈대(카메라 앞을 가리지 않게 키를 낮춤)
    scatter(world, { kind: 'pine', count: 14, area: { x0: JEOGO_X - 30, x1: JEOGO_X + 30, z0: 12.5, z1: 26 }, seed: 62, scale: [1, 1.4] });
    // 강둑의 버드나무와 바위, 강 건너 솔숲과 먼 산(국경의 강가)
    for (const [x, z] of [[-26, -3.6], [-12, -3.4], [14, -3.5], [24, -3.7], [-20, -17], [-4, -17.5], [10, -17], [26, -17.3]]) { const g = new THREE.Group(); g.position.set(JEOGO_X + x, 0, z); g.rotation.y = rand() * 3; L.add(g); tree(g, { kind: 'willow', x, z }); }
    scatter(world, { kind: 'rock', count: 16, area: { x0: JEOGO_X - 30, x1: JEOGO_X + 30, z0: -18, z1: -15 }, seed: 63, scale: [0.6, 1.4] });
    scatter(world, { kind: 'pine', count: 26, area: { x0: JEOGO_X - 40, x1: JEOGO_X + 40, z0: -40, z1: -20 }, seed: 64, scale: [1, 1.6] });
    backdropMountains(L, { center: [JEOGO_X, 0], radius: 75, color: 0x5f7050, seed: 3, skip: [Math.PI * 0.2, Math.PI * 0.8] }); // 동쪽(개경 궁궐 쪽)은 비운다: 산이 궁궐 마당을 지나지 않게
    // D-14: 사신 저고여와 수행원이 강가 길을 걸어가다가, 길 건너 덤불 뒤에 숨어 있던 복면 쓴 병사가 활을 쏘고, 저고여가 쓰러진다.
    // 복면 병사는 어느 나라 사람인지 알 수 있는 표시(깃발·나라별 모자·옷 색)가 없다: 누가 죽였는지는 끝내 밝혀지지 않았다(S22).
    const ENVOY = { robe: 0x8a6a2a, hat: 'fur', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } };
    const MASKED = { robe: 0x4a4740, trim: 0x3a3732, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } };
    const envoy = makePerson(ENVOY), aide = makePerson(LOOKS.mongol), archer = makePerson(MASKED);
    envoy.rotation.order = aide.rotation.order = archer.rotation.order = 'YXZ';
    { // 두건과 복면(같은 어두운 천)
      const hg = archer.userData.head, cloth = mat(0x2e2c29);
      const hood = new THREE.Group(); hood.name = 'hood'; hg.add(hood);
      hood.add(new THREE.Mesh(new THREE.SphereGeometry(0.345, 14, 8, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.62), cloth)); // 얼굴만 트인 두건
      hood.add(new THREE.Mesh(new THREE.SphereGeometry(0.348, 14, 6, 0, Math.PI * 2, 0, 0.95), cloth)); // 이마 덮개
      const mask = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 6, Math.PI / 2 - 1.05, 2.1, 1.6, 0.95), cloth); mask.name = 'mask'; hg.add(mask); // 코 아래를 가린 복면
      const nose = hg.getObjectByName('nose'); if (nose) nose.visible = false;
      // 왼손에 든 활: 팔을 앞으로 뻗으면 활대가 위아래로 선다
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 4, 14, Math.PI), mat(0x5a3f2a));
      bow.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)));
      bow.position.set(0, -0.16, 0); bow.name = 'bowHeld'; archer.userData.arms[0].add(bow);
    }
    const arrow = new THREE.Group(); arrow.visible = false; arrow.scale.setScalar(1.5); L.add(arrow);
    { const m = c => new THREE.MeshLambertMaterial({ color: c });
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 5).rotateX(Math.PI / 2), m(0xd9c9a0)); arrow.add(sh);
      const tp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5).rotateX(Math.PI / 2), m(0x3a3a3a)); tp.position.z = 0.56; arrow.add(tp);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.22), m(0xe8e2d4)); fl.position.z = -0.42; arrow.add(fl); }
    L.add(envoy, aide, archer);
    // 길 건너(강 쪽) 숨는 덤불과 바위, 병사가 물러나 숨는 강가 덤불숲·버드나무
    const bushAt = (x, z, k = 1) => { for (const [dx, dy, dz, r] of [[0, 0.7, 0, 0.95], [-0.8, 0.55, 0.15, 0.75], [0.8, 0.6, -0.1, 0.8], [0.1, 1.35, -0.1, 0.7]]) mk(new THREE.IcosahedronGeometry(r * k, 0), 0x46663c, JEOGO_X + x + dx * k, dy * k, z + dz * k); };
    const HIDE = [3, -2.3];
    bushAt(HIDE[0], -0.9, 1.15); mk(new THREE.DodecahedronGeometry(0.75, 0), 0x8a8478, JEOGO_X + HIDE[0] + 1.3, 0.45, -0.7);
    for (const [x, k] of [[8.6, 1.2], [10.2, 1.3], [11.8, 1.1]]) bushAt(x, -1.1, k);
    { const g = new THREE.Group(); g.position.set(JEOGO_X + 10.5, 0, -3.3); L.add(g); tree(g, { kind: 'willow', x: 10.5, z: -3.3 }); }
    const camAt = f => ({ pos: [f + 0.6, 3.3, 11], target: [f, 1.0, 0.6] });
    const reset = () => {
      envoy.position.set(JEOGO_X - 14.5, 0, 2); envoy.rotation.set(0, Math.PI / 2, 0);
      aide.position.set(JEOGO_X - 16.4, 0, 2.6); aide.rotation.set(0, Math.PI / 2, 0); aide.visible = true;
      archer.position.set(JEOGO_X + HIDE[0], 0, HIDE[1]); archer.rotation.set(0.75, Math.PI * 0.85, 0); archer.visible = true; // 덤불 뒤에 웅크려 숨어 있다
      archer.userData.manual = true; for (const a of archer.userData.arms) a.rotation.set(0, 0, 0);
      arrow.visible = false;
    };
    reset();
    jeogo.cam = camAt(JEOGO_X - 11.5);
    jeogo.start = [JEOGO_X, 6];
    jeogo.envoy = envoy; jeogo.aide = aide; jeogo.archer = archer; jeogo.arrow = arrow;
    // 장면 한 번(약 10초): 걷기 → 복면 병사가 일어나 덤불 밖으로 나와 활을 쏜다 → 저고여가 쓰러진다 → 병사는 강가 덤불숲으로 물러나 사라진다.
    // 카메라는 길을 따라가다 사신과 병사가 함께 보이는 곳에서 멈춘다.
    const WALK = 1.75, SHOOT = 5.2, FLY = 0.4;
    jeogo.play = () => new Promise(resolve => {
      reset();
      let t = 0, hitT = -1, focus = envoy.position.x + 3;
      const from = new THREE.Vector3(), to = new THREE.Vector3(), ahead = new THREE.Vector3();
      const ease = (o, v, k) => { o.rotation.x += (v - o.rotation.x) * k; };
      const off = world.onUpdate(dt => {
        t += dt;
        const k = Math.min(1, dt * 6);
        if (hitT < 0) { envoy.position.x += dt * WALK; aide.position.x += dt * WALK; }
        // 복면 병사: 일어나고(3.8~4.6초), 덤불 옆으로 나와(4.6~5초) 활을 겨눠 쏘고(5.2초), 활을 내리고 강가 덤불숲으로 물러난다(6.6초~)
        const A = archer.userData;
        if (t >= 3.8 && t < 6.6) {
          archer.rotation.x += (0 - archer.rotation.x) * k;
          if (t >= 4.6) {
            const sx = JEOGO_X + 1.6, sz = -1.7, d = Math.hypot(sx - archer.position.x, sz - archer.position.z), st = Math.min(d, dt * 3.2);
            if (d > 0.01) { archer.position.x += (sx - archer.position.x) / d * st; archer.position.z += (sz - archer.position.z) / d * st; }
            archer.rotation.y = Math.atan2(envoy.position.x - archer.position.x, envoy.position.z - archer.position.z);
            ease(A.arms[0], -Math.PI / 2, k); ease(A.arms[1], -1.35, k); // 활을 든 팔은 앞으로, 다른 팔은 시위를 당긴다
          }
        }
        if (t >= SHOOT && hitT < 0) { // 화살이 날아간다
          if (!arrow.visible) { arrow.visible = true; from.set(archer.position.x, 1.7, archer.position.z); }
          const q = Math.min(1, (t - SHOOT) / FLY);
          to.set(envoy.position.x, 1.5, envoy.position.z);
          arrow.position.lerpVectors(from, to, q); ahead.lerpVectors(from, to, Math.min(1, q + 0.05)); arrow.lookAt(ahead);
          if (q >= 1) { hitT = t; arrow.visible = false; }
        }
        if (hitT >= 0) { // 맞은 저고여가 휘청하다 뒤로 쓰러진다(피 없이)
          const h = t - hitT;
          envoy.rotation.x = h < 0.3 ? -0.25 * h / 0.3 : -0.25 - 1.2 * Math.min(1, (h - 0.3) / 0.6);
          // 수행원은 멈춰 놀라 병사 쪽을 보았다가, 저고여 곁으로 가 몸을 숙인다
          if (h < 1.6) aide.rotation.y += (Math.atan2(archer.position.x - aide.position.x, archer.position.z - aide.position.z) - aide.rotation.y) * k;
          else {
            const tx = envoy.position.x - 1.1, tz = 2.9, d = Math.hypot(tx - aide.position.x, tz - aide.position.z);
            if (d > 0.05) { const st = Math.min(d, dt * 2); aide.position.x += (tx - aide.position.x) / d * st; aide.position.z += (tz - aide.position.z) / d * st; aide.rotation.y = Math.atan2(tx - aide.position.x, tz - aide.position.z); }
            else { aide.rotation.y += (Math.atan2(envoy.position.x - aide.position.x, envoy.position.z - aide.position.z) - aide.rotation.y) * k; aide.rotation.x += (0.4 - aide.rotation.x) * k; }
          }
        }
        if (t >= 6.6 && archer.visible) { // 물러난다: 걸어서 강가 덤불숲 뒤로(땅 위로만 움직인다)
          ease(A.arms[0], 0, k); ease(A.arms[1], 0, k);
          if (t >= 7) {
            A.manual = false;
            const tx = JEOGO_X + 13.5, tz = -2.7, dx = tx - archer.position.x, dz = tz - archer.position.z, d = Math.hypot(dx, dz);
            archer.position.x += dx / d * dt * 3.3; archer.position.z += dz / d * dt * 3.3; archer.rotation.y = Math.atan2(dx, dz);
            if (archer.position.x > JEOGO_X + 10.4) archer.visible = false; // 덤불숲 뒤로 사라진다
          }
        }
        archer.position.y = 0;
        // 카메라: 길을 따라가다가 사신과 병사가 함께 보이는 곳에서 멈춘다
        focus += (Math.min(envoy.position.x + 3, JEOGO_X - 1.7) - focus) * Math.min(1, dt * 3);
        const c = camAt(focus); world.setFixedCamera(c.pos, c.target);
        if (t >= 10) { off(); resolve(); }
      });
    });
  }

  // 1) 개경 궁궐 앞: 돌기단, 단청 기둥, 큰 기와지붕
  {
    const x0 = PALACE_X;
    mk(new THREE.BoxGeometry(22, 1.2, 10), 0xa59c8a, x0, 0.6, -12);
    for (let i = 0; i < 4; i++) mk(new THREE.BoxGeometry(8, 0.3, 1), 0xb3ab99, x0, 0.15 + i * 0.3, -6.5 - i * 0.5);
    for (let dx = -9; dx <= 9; dx += 3) mk(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), 0xa8392b, x0 + dx, 3.2, -9);
    mk(new THREE.BoxGeometry(21, 0.45, 8), 0x2f6b5e, x0, 5.3, -12);
    hipRoof(26, 12, 4, 0x3d4846, x0, 5.5, -12);
    world.addCollider({ x: x0 - 6, z: -12, r: 6 }); world.addCollider({ x: x0 + 6, z: -12, r: 6 }); world.addCollider({ x: x0, z: -12, r: 6 });
    for (const sx of [-1, 1]) { // 기와를 얹은 궁궐 담장
      const g = new THREE.Group(); g.position.set(x0 + sx * 15, 0, 2); g.rotation.y = Math.PI / 2; L.add(g); wall(g, { w: 30, h: 2.8, color: 0x9a8c7a });
    }
    // 남쪽 담장과 궁궐 앞 문(D-13 시작 장면): 문짝이 열리고 학생이 걸어 들어온다. 문 안쪽 길옆에 이름판 「개경」(S10)
    for (const sx of [-1, 1]) { const g = new THREE.Group(); g.position.set(x0 + sx * 9.1, 0, PALACE_GATE_Z); L.add(g); wall(g, { w: 12.6, h: 2.8, color: 0x9a8c7a }); }
    for (const sx of [-1, 1]) { const g = new THREE.Group(); g.position.set(x0 + sx * 15, 0, (17 + PALACE_GATE_Z) / 2); g.rotation.y = Math.PI / 2; L.add(g); wall(g, { w: PALACE_GATE_Z - 17 + 0.4, h: 2.8, color: 0x9a8c7a }); } // 옆 담장을 남문까지 잇는다
    for (const sx of [-1, 1]) { mk(new THREE.BoxGeometry(0.5, 3.8, 0.5), 0xa8392b, x0 + sx * 2.8, 1.9, PALACE_GATE_Z); }
    mk(new THREE.BoxGeometry(6.4, 0.4, 0.8), 0x2f6b5e, x0, 3.9, PALACE_GATE_Z);
    for (const s of [-1, 1]) { const r = mk(new THREE.BoxGeometry(7.8, 0.22, 1.7), 0x3d4846, x0, 4.45, PALACE_GATE_Z + s * 0.7); r.rotation.x = s * 0.45; } // 문 위 맞배 기와지붕
    mk(new THREE.BoxGeometry(8, 0.24, 0.3), 0x2b2f2e, x0, 4.85, PALACE_GATE_Z);
    for (let x = -14.5; x <= 14.5; x += 1.5) if (Math.abs(x) > 3.2) world.addCollider({ x: x0 + x, z: PALACE_GATE_Z, r: 0.8 });
    // 박석을 깐 마당과 석등 두 개
    mk(new THREE.BoxGeometry(28.6, 0.06, 36), 0xa59c8a, x0, 0.03, 10, L, false);
    for (const sx of [-1, 1]) {
      const lx = x0 + sx * 7, lz = -1;
      mk(new THREE.CylinderGeometry(0.45, 0.55, 0.3, 8), 0xb3ab99, lx, 0.15, lz);
      mk(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 8), 0xb3ab99, lx, 0.85, lz);
      mk(new THREE.BoxGeometry(0.7, 0.6, 0.7), 0xb3ab99, lx, 1.7, lz);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.72), new THREE.MeshBasicMaterial({ color: 0xffd38a })); glow.position.set(lx, 1.7, lz); L.add(glow);
      const cap = mk(new THREE.ConeGeometry(0.62, 0.45, 4), 0xb3ab99, lx, 2.25, lz); cap.rotation.y = Math.PI / 4;
      world.addCollider({ x: lx, z: lz, r: 0.6 });
    }
    // 담장 뒤 소나무
    for (const [a, b, s] of [[-45, -17, 51], [17, 45, 52]]) scatter(world, { kind: 'pine', count: 22, area: { x0: x0 + a, x1: x0 + b, z0: -32, z1: 24 }, seed: s, scale: [1, 1.5] });
  }

  // 2) 강화도 해협: 바다와 건너편 섬 (장면 구경용)
  {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(130, 60).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x46708a, shininess: 30, transparent: true, opacity: 0.92 }));
    sea.position.set(GANGHWA_X, -0.5, -26); L.add(sea);
    const island = mk(new THREE.ConeGeometry(26, 9, 9), 0x4f6b4a, GANGHWA_X, 1.5, -40); island.scale.set(1.4, 1, 0.7);
    for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.set(GANGHWA_X - 10 + i * 4, 3.4, -34 + (i % 2) * 2); g.scale.setScalar(0.55); g.rotation.y = (i % 3 - 1) * 0.2; L.add(g); hanok(g, { tile: i === 2 }); } // 섬의 집들(도읍을 옮긴 강화도)
    for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.position.set(GANGHWA_X - 8 + i * 8, -0.7, -14 - i * 3); g.rotation.y = 0.3 * (i - 1); L.add(g); boat(g, { len: 4.6 }); }
  }
  // 강화도 섬의 소나무 (섬 원뿔 높이에 맞춰 심는다)
  {
    const islandH = (x, z) => 6 - 9 * Math.hypot((x - GANGHWA_X) / 1.4, (z + 40) / 0.7) / 26;
    scatter(world, { kind: 'pine', count: 30, area: { x0: GANGHWA_X - 34, x1: GANGHWA_X + 34, z0: -52, z1: -38 }, avoid: [{ x: GANGHWA_X, z: -34, r: 13 }], seed: 53, ground: islandH, scale: [0.9, 1.4] });
  }
  const palaceGate = gateLeaves(L, { x: PALACE_X, z: PALACE_GATE_Z, width: 5.2, height: 3.2, color: 0x7a3b2e });
  nameBoard(L, '개경', PALACE_X + 4, PALACE_GATE_Z - 3.2); // 고려의 도읍(S10)
  const ganghwaCam = { pos: [GANGHWA_X + 6, 7, 12], target: [GANGHWA_X, 2, -30] };

  // 3) 처인성: 낮은 흙성(둥글게), 남쪽 성문, 성 안 백성과 승병, 북쪽 들판
  const cheoin = new THREE.Group(); L.add(cheoin);
  {
    const segs = 40;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < 0.18) continue; // 남쪽(+z) 성문 자리
      const seg = mk(new THREE.BoxGeometry(2.1, 2.4, 1.4), 0x8a7356, CHEOIN_X + Math.cos(a) * CHEOIN_R, 1.2, Math.sin(a) * CHEOIN_R, cheoin);
      seg.rotation.y = -a + Math.PI / 2;
      for (const d of [-0.6, 0, 0.6]) { // 흙성 위 나무 울타리(목책)
        const st = mk(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 5), 0x6b4a32, 0, 0, 0, cheoin);
        st.position.set(CHEOIN_X + Math.cos(a) * (CHEOIN_R + 0.35) - Math.sin(a) * d, 2.85, Math.sin(a) * (CHEOIN_R + 0.35) + Math.cos(a) * d);
      }
    }
    { // 성 안 북서쪽 흙 비탈(성벽 위로 오르는 길)
      const len = CHEOIN_R - CHEOIN.ramp0, mid = CHEOIN.ramp0 + len / 2, slope = Math.atan2(WALL_TOP, len);
      const rp = mk(new THREE.BoxGeometry(len / Math.cos(slope), 0.3, 1.8), 0x7a6449, CHEOIN_X + Math.cos(CHEOIN.rampA) * mid, WALL_TOP / 2 - 0.1, Math.sin(CHEOIN.rampA) * mid, cheoin);
      rp.rotation.order = 'YXZ'; rp.rotation.y = -CHEOIN.rampA; rp.rotation.z = slope;
    }
    // 성 안: 피란 온 백성들의 초가와 짚더미·장작(남쪽 성문 쪽, 싸움 자리와 떨어진 곳)
    for (const [dx, dz, ry] of [[-6.2, 4.6, 0.5], [6.2, 4.4, -0.5]]) { const g = new THREE.Group(); g.position.set(CHEOIN_X + dx, 0, dz); g.rotation.y = ry; g.scale.setScalar(0.8); cheoin.add(g); hanok(g, {}); world.addCollider({ x: CHEOIN_X + dx, z: dz, r: 2 }); }
    for (const [dx, dz, fn] of [[-2.8, 8.2, straw], [3, 8.4, woodpile]]) { const g = new THREE.Group(); g.position.set(CHEOIN_X + dx, 0, dz); cheoin.add(g); fn(g); }
    for (let i = 0; i < 8; i++) {
      const a = 0.3 + i * 0.35; // D-13: 성 안 남쪽(성벽 위 카메라 뒤)에 모여 있다
      const who = i % 2 ? LOOKS.monk : LOOKS.villager;
      const p = makePerson(who); p.position.set(CHEOIN_X + Math.cos(a) * (CHEOIN_R - 3.4), 0, Math.sin(a) * (CHEOIN_R - 3.4)); // 성벽 가까이는 궁수 자리
      p.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); cheoin.add(p);
    }
  }
  // 다가오는 몽골군 8명 (처음엔 숨김). 들판 북쪽 반원에서 나타나 성으로 다가온다.
  // 기마병 중심(2026-10-30 선생님): 여섯은 말 탄 기마병(활·창), 둘은 깃발을 든 걷는 병사. 말과 기수는 함께 움직이고 화살을 맞으면 기수가 말에서 떨어진다
  const mongols = [];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group(); g.visible = false; L.add(g);
    g.rotation.order = 'YXZ'; // 걷는 병사는 화살을 맞으면 rotation.x로 뒤로 쓰러진다
    const mounted = i % 4 !== 3, top = new THREE.Object3D();
    let horse = null, rider = null;
    if (mounted) {
      g.scale.setScalar(1.25); // 멀리서도 보이게 조금 크게(말 탄 사람은 이미 크다)
      horse = makeHorse({ coat: [0x7a5232, 0xb09a72, 0x4a3426, 0x9a7a52][i % 4] }); g.add(horse);
      rider = makePerson(i % 2 ? LOOKS.mongolLancer : LOOKS.mongolArcher); mount(horse, rider);
      top.position.set(0, 3.9, 0);
    } else {
      g.scale.setScalar(1.6);
      const p = makePerson(LOOKS.mongol); g.add(p);
      mk(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 4), 0x3a2c20, 0.6, 1.7, 0, g);
      const f = mk(new THREE.PlaneGeometry(0.9, 0.7), 0x2a3550, 1.05, 3.1, 0, g); f.material = new THREE.MeshLambertMaterial({ color: 0x2a3550, side: THREE.DoubleSide });
      top.position.set(0, 3.6, 0);
    }
    g.add(top);
    const a = Math.PI * 1.5 - 0.5 + (i / 7) * 1.0; // D-14: 성 앞 들판(북쪽, -z) 좁은 부채꼴에서만 나온다(성벽 위 카메라에 처음부터 보이게)
    mongols.push({ group: g, top, angle: a, horse, rider });
  }
  // 몽골군 진영(D-16): 몽골군이 나오는 들판 너머의 둥근 천막. 고려군의 불화살에 두 채가 타고 연기가 오른다(화살·길을 가리지 않는 먼 곳)
  const campFires = [];
  for (const [da, r, burn] of [[-0.34, 45, false], [-0.12, 46, true], [0.1, 44, false], [0.3, 46, true]]) {
    const a = Math.PI * 1.5 + da, x = CHEOIN_X + Math.cos(a) * r, z = Math.sin(a) * r, y = 0.02 * Math.max(0, Math.abs(z) - 45) ** 2;
    mk(new THREE.CylinderGeometry(2.1, 2.1, 1.7, 9), 0xd8d0bc, x, y + 0.85, z);
    mk(new THREE.ConeGeometry(2.4, 1.5, 9), 0xb8ab90, x, y + 2.45, z);
    if (burn) campFires.push(burning(world, { x: x + 0.6, y: y + 0.3, z: z + 1.9, size: 2.6 }).group);
  }
  // 고려 궁수 5명: 북쪽 성벽 안쪽 발판 위. 싸움이 시작되면 성벽 위로 올라와 활을 쏜다(처음엔 숨김).
  const ARCHER_Y = WALL_TOP;
  const archers = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + 0.7 + i * (Math.PI - 1.4) / 4;
    // D-13: 궁수는 학생과 같은 성벽 위에 줄지어 선다(학생 뒤 카메라와 학생 사이를 가리지 않게)
    const x = CHEOIN_X + Math.cos(a) * (CHEOIN_R - 0.1), z = Math.sin(a) * (CHEOIN_R - 0.1);
    const g = new THREE.Group(); g.visible = false; g.position.set(x, 0, z); g.scale.setScalar(1.3); L.add(g);
    const p = makePerson(i % 2 ? LOOKS.monk : LOOKS.villager); g.add(p);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 4, 14, Math.PI), mat(0x5a3f2a));
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2); bow.position.set(0.42, 1.35, 0.25); g.add(bow);
    const out = Math.atan2(Math.cos(a), Math.sin(a)); // 성 밖(북쪽 들판)을 바라본다
    g.rotation.y = out;
    archers.push({ group: g, angle: a, baseY: ARCHER_Y, rest: out });
  }
  // 빛나는 원: 따라 걷기 자리(standRing)와 김윤후가 가리킨 성벽 위 자리(spotRing)
  const glowRing = () => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.visible = false; L.add(r); return r; };
  const standRing = glowRing(), spotRing = glowRing(), pileRing = glowRing(), tableRing = glowRing();
  // 날아가는 화살 (돌려 쓴다)
  const arrows = [];
  // 멀리서 보는 카메라에서도 보이게: 크게 만들고, 빛을 받지 않는 밝은 색과 뒤로 끌리는 빛줄기(꼬리)를 단다
  const glow = c => new THREE.MeshBasicMaterial({ color: c, fog: false });
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); g.visible = false; g.scale.setScalar(4.6); L.add(g);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 5).rotateX(Math.PI / 2), glow(0xfff1c8)); g.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 5).rotateX(Math.PI / 2), glow(0x2a2a2a)); tip.position.z = 0.8; g.add(tip);
    const fl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.34), glow(0xd8452f)); fl.position.z = -0.6; g.add(fl);
    const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.02, 2.6, 6, 1, true).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.55, fog: false, depthWrite: false }));
    trail.position.z = -1.9; trail.name = 'trail'; g.add(trail);
    const fl2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 5).rotateX(-Math.PI / 2), glow(0xff8a2a)); fl2.position.z = 0.52; fl2.name = 'fireTip'; g.add(fl2); // 불화살(D-16): 촉 뒤에 붙은 불
    arrows.push(g);
  }

  // 처인성 둘레 풀밭(몽골군이 다가오는 들판은 낮은 풀만)과 남쪽 숲
  scatter(world, { kind: 'grass', count: 150, area: { x0: CHEOIN_X - 40, x1: CHEOIN_X + 40, z0: -40, z1: 30 }, avoid: [{ x: CHEOIN_X, z: 0, r: CHEOIN_R + 1 }], seed: 54, scale: [0.7, 1.2] });
  scatter(world, { kind: 'flower', count: 50, area: { x0: CHEOIN_X - 30, x1: CHEOIN_X + 30, z0: 14, z1: 32 }, seed: 55 });
  scatter(world, { kind: 'pine', count: 26, area: { x0: CHEOIN_X - 50, x1: CHEOIN_X + 50, z0: 22, z1: 50 }, seed: 56, scale: [1, 1.5] });
  scatter(world, { kind: 'rock', count: 12, area: { x0: CHEOIN_X - 40, x1: CHEOIN_X + 40, z0: -40, z1: 30 }, avoid: [{ x: CHEOIN_X, z: 0, r: CHEOIN_R + 2 }], seed: 57, scale: [0.5, 1.2] });
  const cheoinFit = {
    target: [CHEOIN_X, 1, -12], dir: [0, 16, 15],
    points: [[CHEOIN_X - CHEOIN_R, 0, CHEOIN_R], [CHEOIN_X + CHEOIN_R, 0, CHEOIN_R],
      ...mongols.map(m => [CHEOIN_X + Math.cos(m.angle) * SPAWN_R, 5, Math.sin(m.angle) * SPAWN_R])],
  };

  // 4) 충주성 마당: 성벽, 관노 문서 더미, 불
  {
    for (const [dx, dz, w, d] of [[0, -14, 30, 1.4], [-15, 0, 1.4, 28], [15, 0, 1.4, 28]]) mk(new THREE.BoxGeometry(w, 4, d), 0x8c8577, CHUNGJU_X + dx, 2, dz);
  }
  // 충주성 관청 마당(D-13): 관청 건물, 노비 문서 두루마리를 얹은 상, 마당에 모인 노비와 백성
  { const g = new THREE.Group(); g.position.set(CHUNGJU_X + 9, 0, -8); g.rotation.y = -Math.PI / 2; L.add(g); hanok(g, { tile: true }); world.addCollider({ x: CHUNGJU_X + 9, z: -8, r: 2.6 }); }
  const TABLE = [CHUNGJU_X + 6, -5];
  mk(new THREE.BoxGeometry(1.6, 0.7, 0.9), 0x6b4a32, TABLE[0], 0.35, TABLE[1]);
  world.addCollider({ x: TABLE[0], z: TABLE[1], r: 0.7 });
  const bundles = [];
  for (let i = 0; i < 3; i++) { // 두루마리 묶음: 끈으로 묶은 종이 두루마리 셋
    const b = new THREE.Group(); b.position.set(TABLE[0] - 0.5 + i * 0.5, 0.78, TABLE[1]); L.add(b);
    for (let k = 0; k < 3; k++) { const sc = mk(new THREE.CylinderGeometry(0.09, 0.09, 0.62, 8), 0xefe4c8, (k - 1) * 0.16, 0.09 + (k === 1 ? 0.12 : 0), 0, b); sc.rotation.x = Math.PI / 2; }
    mk(new THREE.BoxGeometry(0.5, 0.05, 0.06), 0xb8352a, 0, 0.14, 0, b);
    bundles.push(b);
  }
  const people = [];
  for (let i = 0; i < 6; i++) { const r = makePerson(i % 2 ? LOOKS.villager : LOOKS.monk); r.position.set(CHUNGJU_X - 6 + i * 2.4, 0, 6 + (i % 2)); r.rotation.y = Math.PI; L.add(r); people.push(r); }
  // 관노(관청의 노비) 문서: 이름과 붉은 도장이 찍힌 종이 묶음. 김윤후가 불태운다.
  const paperTex = (() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
    const c = cv.getContext('2d');
    c.fillStyle = '#efe4c8'; c.fillRect(0, 0, 256, 192);
    c.strokeStyle = '#8a6a42'; c.lineWidth = 6; c.strokeRect(6, 6, 244, 180);
    c.fillStyle = '#2a1e14'; c.font = 'bold 40px "Nanum Myeongjo", Batang, serif'; c.textAlign = 'center';
    c.fillText('노비 문서', 128, 62);
    c.fillStyle = '#4a3a2a'; for (let k = 0; k < 5; k++) c.fillRect(34, 86 + k * 18, 150 - (k % 2) * 40, 5); // 적힌 이름들
    c.fillStyle = '#b8352a'; c.fillRect(186, 120, 40, 40); // 관청 도장
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const documents = new THREE.Group(); documents.position.set(CHUNGJU_X, 0, -3); L.add(documents);
  const papers = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.98).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: paperTex, color: 0xffffff, side: THREE.DoubleSide, transparent: true }));
    m.position.set((i % 3 - 1) * 0.75, 0.05 + Math.floor(i / 3) * 0.05, ((i * 7) % 3 - 1) * 0.4); m.rotation.y = ((i * 0.7) % 1.2 - 0.6) * 0.5; m.rotation.x = 0.25; // 카메라 쪽으로 살짝 기울여 글씨가 보이게
    documents.add(m); papers.push({ m, delay: 0.4 + (i % 3) * 0.5 + Math.floor(i / 3) * 0.35, base: m.position.clone() }); // 한쪽부터 차례로 불이 옮겨 붙는다
  }
  // 불꽃(D-14 선생님: 문서 태우기는 불이 나는 연출, 공용 불 부품 kit/fire.js): 깜박이며 타올랐다가 잦아든다. 불티는 화질 '보통·높음'에서만.
  const docFire = burning(world, { x: CHUNGJU_X, z: -3, level: 0 }), fire = docFire.group;
  // 연기와 재: 문서 더미에서 회색 연기가 피어오르고, 다 타면 검은 재가 남는다
  const smoke = new THREE.Group(); smoke.position.set(CHUNGJU_X, 0, -3); smoke.visible = false; L.add(smoke);
  const puffs = [];
  for (let i = 0; i < 12; i++) {
    const pf = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshLambertMaterial({ color: i % 3 ? 0x9a9690 : 0x7c7872, transparent: true, opacity: 0.6, depthWrite: false }));
    pf.userData = { ph: i / 12, x: ((i * 5) % 7 - 3) * 0.12, z: ((i * 3) % 5 - 2) * 0.12 }; smoke.add(pf); puffs.push(pf);
  }
  const ashPile = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 0.16, 12), new THREE.MeshLambertMaterial({ color: 0x2a2420 }));
  ashPile.position.set(CHUNGJU_X, 0.08, -3); ashPile.visible = false; L.add(ashPile);
  let smokeLevel = 0; // 0 없음 ~ 1 짙음
  const burnState = { t: -1 };
  // 문서를 태운다(약 7초): 불꽃이 일어 타오르고, 종이가 갈색 → 검게 그을리며 오그라들어 재가 되고, 불이 잦아들며 연기가 남는다
  const burnDocuments = () => new Promise(resolve => { burnState.t = 0; burnState.resolve = resolve; smoke.visible = true; });
  const burnt = () => { burnState.t = -1; docFire.setLevel(0); documents.visible = false; smoke.visible = true; ashPile.visible = true; smokeLevel = 0.35; };
  // 가져다 놓은 묶음 수(0~3)에 따라 문서 더미가 쌓인다
  const pileUp = n => { papers.forEach((pp, i) => { pp.m.visible = i < 3 + n * 2; }); };
  scatter(world, { kind: 'grass', count: 60, area: { x0: CHUNGJU_X - 14, x1: CHUNGJU_X + 14, z0: -12, z1: 12 }, avoid: [{ x: CHUNGJU_X, z: -3, r: 3 }, { x: CHUNGJU_X + 4, z: 9, r: 3 }], seed: 58, scale: [0.6, 1] });
  scatter(world, { kind: 'pine', count: 20, area: { x0: CHUNGJU_X - 40, x1: CHUNGJU_X + 40, z0: -50, z1: -18 }, seed: 59, scale: [1, 1.5] });
  const chungjuCam = { pos: [CHUNGJU_X + 4, 4.5, 9], target: [CHUNGJU_X, 1.4, -3] };
  const burnCam = { pos: [CHUNGJU_X - 1.3, 2.7, 0.8], target: [CHUNGJU_X - 0.1, 0.2, -3.2] }; // 문서 더미 바로 앞(백성들 앞쪽)에서 내려다본다

  world.addNpc('minister', LOOKS.minister, PALACE_X, -3.5, 0);
  world.addNpc('kimyunhu', LOOKS.kimyunhu, CHEOIN_X, -2, Math.PI);
  world.addNpc('villager', LOOKS.villager, PALACE_X - 7, 6, Math.PI * 0.85); // 궁궐 앞 백성(D-13)

  const ash = new THREE.Color(0x1c1612), brown = new THREE.Color(0x8a5a2a), white = new THREE.Color(0xffffff);
  world.onUpdate((dt, t) => {
    if (burnState.t >= 0) {
      burnState.t += dt;
      const bt = burnState.t;
      smokeLevel = Math.min(1, bt / 1.2) * (bt > 6.2 ? Math.max(0.35, 1 - (bt - 6.2) / 1.2) : 1);
      docFire.setLevel(bt < 0.3 ? 0 : bt < 1.3 ? (bt - 0.3) : bt < 4.6 ? 1 : Math.max(0, 1 - (bt - 4.6) / 1.6)); // 붙고 → 타오르고 → 잦아든다
      ashPile.visible = bt > 3; ashPile.scale.setScalar(Math.min(1, Math.max(0.2, (bt - 3) / 3)));
      for (const pp of papers) {
        const k = Math.max(0, Math.min(1, (bt - pp.delay) / 3.6)); // 이 종이가 탄 정도
        const col = k < 0.5 ? white.clone().lerp(brown, k * 2) : brown.clone().lerp(ash, (k - 0.5) * 2);
        pp.m.material.color.copy(col);
        pp.m.scale.setScalar(Math.max(0.05, 1 - k * 0.85));
        pp.m.rotation.z = k * 0.9; // 오그라든다
        pp.m.position.y = pp.base.y + k * 0.25;
        pp.m.material.opacity = k > 0.8 ? 1 - (k - 0.8) * 5 : 1;
      }
      if (bt > 6.4) { documents.visible = false; }
      if (bt > 7.4 && burnState.resolve) { const r = burnState.resolve; burnState.resolve = null; burnState.t = -1; smokeLevel = 0.35; r(); }
    }
    if (smoke.visible) puffs.forEach(pf => { // 연기: 위로 피어오르며 퍼지고 옅어진다
      const k = (t * 0.22 + pf.userData.ph) % 1;
      pf.position.set(pf.userData.x * (1 + k * 4) + k * 0.8, 0.3 + k * 4.5 * (0.4 + smokeLevel * 0.6), pf.userData.z * (1 + k * 4));
      pf.scale.setScalar((0.5 + k * 1.8) * (0.4 + smokeLevel * 0.6));
      pf.material.opacity = (1 - k) * 0.6 * Math.min(1, smokeLevel * 1.5);
    });
  });

  return {
    areas: {
      palace: { start: [PALACE_X, 13], introFrom: [PALACE_X, 37], bounds: { x0: PALACE_X - 13, x1: PALACE_X + 13, z0: -6, z1: 16 } },
      jeogo: jeogo,
      ganghwa: { cam: ganghwaCam },
      cheoin: { center: [CHEOIN_X, 0], radius: CHEOIN_R, spawnR: SPAWN_R, fit: cheoinFit,
        start: [CHEOIN_X + Math.cos(CHEOIN.rampA) * (CHEOIN.ramp0 - 0.2) + 1.6, Math.sin(CHEOIN.rampA) * (CHEOIN.ramp0 - 0.2)], // 비탈 아래
        kimyunhu: [CHEOIN_X + Math.cos(CHEOIN.rampA) * CHEOIN.ramp0 + 1.4, Math.sin(CHEOIN.rampA) * CHEOIN.ramp0 - 0.4],
        // 김윤후가 앞장설 길: 비탈을 올라 성벽 위를 따라 북쪽 가운데 가까이로
        leadPath: [...[0.3, 0.7, 1].map(k => { const al = CHEOIN.ramp0 + (CHEOIN_R - CHEOIN.ramp0) * k; return [CHEOIN_X + Math.cos(CHEOIN.rampA) * al, Math.sin(CHEOIN.rampA) * al]; }),
          ...Array.from({ length: 6 }, (_, i) => { const a = CHEOIN.rampA + (Math.PI * 1.55 - CHEOIN.rampA) * (i + 1) / 6; return [CHEOIN_X + Math.cos(a) * CHEOIN_R, Math.sin(a) * CHEOIN_R]; })],
        stand: (() => { const a = Math.PI * 1.47; return [CHEOIN_X + Math.cos(a) * CHEOIN_R, Math.sin(a) * CHEOIN_R]; })() }, // 학생은 김윤후 조금 앞(서쪽)에 선다
      chungju: { cam: chungjuCam, burnCam, cheerCam: { pos: [CHUNGJU_X + 1.5, 3.4, -9.6], target: [CHUNGJU_X - 0.4, 1.3, 3] }, // 문서 더미 너머로 노비와 백성들의 얼굴이 보인다
        kimyunhu: [CHUNGJU_X + 1.8, -2.2, Math.PI * 0.85],
        start: [CHUNGJU_X - 1, 11], kimStart: [CHUNGJU_X + 0.6, 9.4], leadPath: [[CHUNGJU_X + 3, 4], [CHUNGJU_X + 6.6, -3.6]], stand: [CHUNGJU_X + 4.6, -3.2], pile: [CHUNGJU_X, -3],
        bounds: { x0: CHUNGJU_X - 13, x1: CHUNGJU_X + 12, z0: -12, z1: 12 } },
    },
    mongols, archers, arrows, campFires, documents, fire, smoke, ashPile, burnDocuments, burnt, jeogo, pileUp, bundles, table: TABLE, people,
    palaceGate, standRing, spotRing, pileRing, tableRing, cheoinGroup: cheoin,
    start: [PALACE_X, 13],
  };
}
