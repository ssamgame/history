// 말과 기수(2026-10-30 선생님: 말 걸음·기마병). 로우폴리 말 한 마리와 그 위에 앉는 사람.
// 말은 실제로 움직인 빠르기를 재어 걸음(평보, 네 박자)·속보(대각선 두 박자)·구보(세 박자)를 고르고,
// 디딘 발굽이 땅에 붙은 채 몸이 나아가도록 다리 벌리는 각도와 박자를 보폭에서 바로 정한다(발굽이 미끄러지지 않게).
// 몸통(body)이 오르내리고 앞뒤로 흔들리면 그 위에 앉은 기수도 함께 움직인다(기수는 body의 자식). 방향을 틀면 머리가 먼저 돈다.
// 말의 뿌리(root) 높이는 장이 땅 높이에 맞춘다(groundH). 걸음 들썩임은 body에만 주어 root는 늘 땅 위에 있다.
import * as THREE from 'three';
import { mat } from './people.js';

const LEG = 0.85;            // 다리 관절(어깨·엉덩이) 높이 = 다리 길이
export const SADDLE = 1.49;  // 안장 윗면 높이(body 좌표)
const COATS = [0x6b4a32, 0x7a5232, 0x4a3426, 0x2e2420, 0x9a7a52, 0x8a8478, 0xb09a72, 0x5a3a28]; // 갈색·밤색·흑갈색·검정·황갈색·회색·누런 말
// 걸음새: 다리마다 한 바퀴 안의 차례(앞왼, 앞오른, 뒤왼, 뒤오른), 디딘 시간 비율(duty), 한 바퀴에 나아가는 거리(보폭, m)
const GAITS = {
  walk:   { off: [0.25, 0.75, 0, 0.5], duty: 0.65, stride: 1.25, nod: 0.09 },
  trot:   { off: [0, 0.5, 0.5, 0], duty: 0.45, stride: 2.1, nod: 0.04 },
  canter: { off: [0.55, 0.3, 0.3, 0], duty: 0.46, stride: 2.9, nod: 0.1, pitch: 0.06 },
};
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const horses = new Set();
let count = 0;

// opts: { coat, saddle, armor(몸에 두른 마갑 색), scale }
export function makeHorse({ coat, saddle = 0x7a2a22, armor = null, mane = 0x2e2219, scale = 1 } = {}) {
  count += 1;
  const k = Math.sin(count * 91.7) * 43758.5453, rnd = k - Math.floor(k);
  coat = coat ?? COATS[Math.floor(rnd * COATS.length)];
  const root = new THREE.Group(); root.name = 'horse';
  const body = new THREE.Group(); body.name = 'horseBody'; root.add(body);
  const p = (geo, color, x, y, z, parent = body, kind = null) => { const m = new THREE.Mesh(geo, mat(color, kind, 'object')); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const dark = mane;
  p(new THREE.BoxGeometry(0.62, 0.6, 1.5), coat, 0, 1.1, 0); // 몸통
  p(new THREE.BoxGeometry(0.58, 0.5, 0.36), coat, 0, 1.14, 0.7).rotation.x = -0.25; // 가슴
  p(new THREE.BoxGeometry(0.6, 0.52, 0.4), coat, 0, 1.16, -0.66); // 엉덩이
  // 목·머리는 목 밑동을 축으로 묶는다: 걸음에 맞춰 끄덕이고, 방향을 틀면 먼저 돈다
  const head = new THREE.Group(); head.name = 'horseHead'; head.position.set(0, 1.32, 0.78); body.add(head);
  p(new THREE.BoxGeometry(0.32, 0.8, 0.38), coat, 0, 0.26, 0.14, head).rotation.x = 0.55; // 목
  p(new THREE.BoxGeometry(0.1, 0.74, 0.14), dark, 0, 0.36, -0.04, head).rotation.x = 0.55; // 갈기
  const skull = p(new THREE.BoxGeometry(0.28, 0.3, 0.62), coat, 0, 0.62, 0.5, head); skull.rotation.x = 0.35; // 머리(코끝이 조금 내려간다)
  p(new THREE.BoxGeometry(0.22, 0.2, 0.2), dark, 0, 0.5, 0.78, head).rotation.x = 0.35; // 코
  for (const sx of [-0.08, 0.08]) p(new THREE.ConeGeometry(0.05, 0.16, 4), dark, sx, 0.84, 0.3, head);
  const tail = new THREE.Group(); tail.position.set(0, 1.3, -0.86); body.add(tail);
  p(new THREE.BoxGeometry(0.12, 0.72, 0.14), dark, 0, -0.34, -0.08, tail).rotation.x = -0.3; // 꼬리
  p(new THREE.BoxGeometry(0.68, 0.1, 0.66), saddle, 0, SADDLE - 0.05, -0.02, body, 'cloth'); // 안장
  p(new THREE.BoxGeometry(0.66, 0.36, 0.5), saddle, 0, 1.24, -0.02, body, 'cloth'); // 안장 밑 깔개(배 양옆으로 늘어진다)
  if (armor != null) p(new THREE.BoxGeometry(0.66, 0.34, 0.5), armor, 0, 1.2, 0.72, body, 'metal').rotation.x = -0.25; // 가슴 가리개
  // 다리: 위 토막(어깨·엉덩이 관절)과 아래 토막(무릎·뒷무릎), 발굽
  const legs = [];
  for (const [x, z] of [[-0.2, 0.6], [0.2, 0.6], [-0.2, -0.6], [0.2, -0.6]]) {
    const piv = new THREE.Group(); piv.position.set(x, LEG, z); body.add(piv);
    p(new THREE.BoxGeometry(0.17, 0.44, 0.2), coat, 0, -0.2, 0, piv);
    const knee = new THREE.Group(); knee.position.y = -0.42; piv.add(knee);
    p(new THREE.BoxGeometry(0.13, 0.36, 0.14), coat, 0, -0.18, 0, knee);
    p(new THREE.BoxGeometry(0.16, 0.08, 0.18), dark, 0, -0.39, 0.01, knee);
    piv.userData.knee = knee; legs.push(piv);
  }
  root.scale.setScalar(1.3 * scale * (0.96 + rnd * 0.08)); // 만화풍 사람(머리가 큰) 곁에서 말다운 크기로
  root.userData = { horse: true, body, head, tail, legs, rider: null, m: { v: 0, last: null, cyc: rnd, yaw: null, turn: 0, gait: 'walk', off: [...GAITS.walk.off], idle: rnd * 10 } };
  horses.add(root);
  return root;
}

// 사람을 말에 태운다: 안장 위에 앉히고(허벅지는 말 옆구리를 감싸고 정강이는 아래로), 긴 옷자락은 안장 위로 짧게 바꾼다
export function mount(horse, person) {
  const u = person.userData, H = horse.userData;
  const k = 1 / horse.scale.x; // 사람은 말 크기와 상관없이 제 크기
  person.position.set(0, SADDLE - 0.44 * k, -0.04); person.rotation.set(0, 0, 0); person.scale.setScalar(k);
  H.body.add(person); H.rider = person;
  u.noWalk = true; u.mounted = horse;
  u.legs.forEach((l, i) => { l.rotation.set(-0.6, 0, (i ? 1 : -1) * 0.9); const kn = l.userData.knee; if (kn) { kn.rotation.order = 'ZXY'; kn.rotation.set(0.75, 0, (i ? -1 : 1) * 0.8); } }); // 허벅지는 말 옆구리 바깥으로, 정강이는 옆구리를 따라 아래로
  u.arms.forEach((a, i) => { if (!u.grip?.[i]) a.rotation.set(-0.6, 0, (i ? 1 : -1) * 0.15); }); // 빈손은 앞으로(고삐를 쥔 자리)
  // 긴 옷(델·단령·장삼·도포)은 발목에서 가슴까지 한 덩어리라 숨기면 몸통이 비어 투명해 보인다(2026-10-30 오류).
  // 그래서 숨기지 않고, 같은 옷(같은 재질·윗지름)을 안장 높이에서 잘라 다시 만든다: 가슴은 그대로, 아래는 안장 위로 넓게 퍼져 말 몸통을 뚫지 않는다
  // 뼈대 몸(core/body.js)은 옷자락이 골반 뼈 밑에 있다: 사람 기준 높이로 재서 탄 옷은 사람 바로 아래에 만든다
  const robes = []; person.traverse(c => { if (c.name === 'hem' || c.name === 'robe') robes.push(c); });
  if (!person.getObjectByName('rideRobe')) for (const c of robes) {
    if (c.name === 'hem') { c.visible = false; continue; } // 발목 끝단은 탄 자세에 없다
    if (!c.geometry?.parameters) continue;
    person.updateMatrixWorld(true); const at = person.worldToLocal(c.getWorldPosition(new THREE.Vector3())).divideScalar(person.scale.x || 1);
    const P = c.geometry.parameters, top = at.y + P.height / 2, seat = 0.5;
    c.visible = false;
    if (top <= seat + 0.05) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(P.radiusTop, Math.max(P.radiusTop, 0.46), top - seat, P.radialSegments || 8), c.material);
    m.name = 'rideRobe'; m.position.set(at.x, (top + seat) / 2, at.z); m.castShadow = true; m.receiveShadow = c.receiveShadow;
    person.add(m);
  }
  return person;
}

// 말 다리 하나의 각도: 디딘 동안(0~duty)은 앞에서 뒤로 고르게(발굽이 땅에 붙은 채 몸이 지나간다), 든 동안은 앞으로 휘둘러 온다.
// 든 다리는 내려놓기 직전에 이미 뒤로 당기는 빠르기가 되어(실제 말처럼 조금 더 앞으로 뻗었다가 당겨 디딘다) 닿는 순간 미끄러지지 않는다
function legAngle(f, duty, amp) {
  if (f < duty) return -amp + 2 * amp * (f / duty);
  const s = (f - duty) / (1 - duty), m = 2 * amp / duty * (1 - duty), s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * amp + (s3 - 2 * s2 + s) * m + (-2 * s3 + 3 * s2) * -amp + (s3 - s2) * m;
}

const v3 = new THREE.Vector3();
export function animateHorse(horse, dt) {
  const H = horse.userData, m = H.m;
  if (!dt) return;
  horse.getWorldPosition(v3);
  let raw = 0;
  if (m.last) raw = Math.hypot(v3.x - m.last.x, v3.z - m.last.z) / dt; else m.last = new THREE.Vector3();
  m.last.copy(v3);
  if (raw > 20) raw = 0;
  const sc = horse.scale.y || 1;
  m.v += (raw - m.v) * Math.min(1, dt * 4); // 갑자기 서거나 달리지 않게 천천히 따라간다
  if (m.v < 0.03 && raw === 0) m.v = 0;
  const v = m.v / sc;
  // 걸음새 고르기(되돌아가지 않게 조금 겹친다): 평보 < 2.3 < 속보 < 4.2 < 구보 (말 크기에 맞춘 빠르기)
  const g0 = m.gait;
  if (g0 === 'walk' && v > 2.3) m.gait = 'trot'; else if (g0 === 'trot' && v < 1.9) m.gait = 'walk';
  else if (g0 === 'trot' && v > 4.2) m.gait = 'canter'; else if (g0 === 'canter' && v < 3.7) m.gait = 'trot';
  const G = GAITS[m.gait];
  m.off = m.off.map((o, i) => o + wrap((G.off[i] - o) * Math.PI * 2) / (Math.PI * 2) * Math.min(1, dt * 3)); // 걸음새가 바뀔 때 다리 차례를 천천히 옮긴다
  const kk = ss(0, 0.35, v);
  const stride = G.stride * (0.8 + 0.2 * Math.min(1, v / 1.5)) * sc; // 천천히 걸으면 보폭도 조금 짧게
  m.cyc = (m.cyc + dt * v * sc / stride) % 1;
  const amp = Math.asin(Math.min(0.85, stride / sc * G.duty / (2 * LEG))) * kk;
  const ph = m.cyc * Math.PI * 2, pitch = (G.pitch ? Math.sin(ph) * G.pitch : 0) * kk; // 구보는 몸이 앞뒤로 흔들린다
  // 디딘 다리가 몸을 받친다: 몸통 높이 = 디딘 발굽 가운데 가장 낮은 것이 땅에 닿는 높이. 든 다리는 그 위로 무릎을 접어 땅에 닿지 않게 든다
  const legH = (r, k, z) => LEG - 0.42 * Math.cos(r) - 0.43 * Math.cos(r + k) - z * Math.sin(pitch); // 몸이 내려앉지 않았을 때 발굽 높이
  const st = H.legs.map((l, i) => { const f = ((m.cyc + m.off[i]) % 1 + 1) % 1; return { l, i, f, a: legAngle(f, G.duty, amp), on: f < G.duty }; });
  const blend = kk > 0.02 ? 1 : Math.min(1, dt * 5); // 서면 다리를 천천히 모은다
  st.forEach(o => { o.l.rotation.x += (o.a - o.l.rotation.x) * blend; });
  let low = Infinity;
  for (const o of st) if (o.on) low = Math.min(low, legH(o.l.rotation.x, 0, o.l.position.z));
  if (low === Infinity) for (const o of st) low = Math.min(low, legH(o.l.rotation.x, 0, o.l.position.z));
  for (const o of st) {
    const kn = o.l.userData.knee; if (!kn) continue;
    if (o.on || kk <= 0.02) { kn.rotation.x *= o.on ? 0 : 1 - blend; continue; }
    const s1 = (o.f - G.duty) / (1 - G.duty), lift = Math.sin(Math.PI * s1), r = o.l.rotation.x;
    let k = lift * (o.i < 2 ? 1.1 : 0.7) * kk;
    const C = (LEG - 0.42 * Math.cos(r) - low - o.l.position.z * Math.sin(pitch) - 0.12 * lift * kk) / 0.43; // 이만큼은 땅에서 떠 있어야 한다
    if (C < 1 && Math.cos(r + k) > C) { const q = Math.acos(Math.max(-1, C)), k1 = q - r, k2 = -q - r; k = Math.abs(k1 - k) < Math.abs(k2 - k) ? k1 : k2; } // 모자라면 가장 덜 접는 쪽으로 더 접는다
    kn.rotation.x = k;
  }
  H.body.position.y = -low; // 디딘 발굽은 늘 땅에 닿는다(박히지도 뜨지도 않게). 걸음에 따른 오르내림은 다리 각도에서 저절로 생긴다
  H.body.rotation.x = pitch;
  // 방향 바꾸기: 머리가 먼저 돌고 몸은 도는 쪽으로 조금 기운다
  const yaw = horse.rotation.y; if (m.yaw === null) m.yaw = yaw;
  const dy = wrap(yaw - m.yaw); m.yaw = yaw;
  const rate = Math.abs(dy) < 1.5 ? dy / dt : 0;
  m.turn += (Math.max(-0.5, Math.min(0.5, rate * 0.35)) - m.turn) * Math.min(1, dt * 5);
  H.body.rotation.z = -m.turn * 0.12 * kk;
  m.idle += dt;
  H.head.rotation.y = m.turn * 0.6;
  H.head.rotation.x = Math.sin(ph * 2 + 0.6) * G.nod * kk + (1 - kk) * (Math.sin(m.idle * 0.5) * 0.04 + 0.04); // 서 있으면 가끔 고개를 숙였다 든다
  H.tail.rotation.z = Math.sin(m.idle * 1.3) * 0.12 * (1 - kk * 0.5);
  H.tail.rotation.x = -0.2 * kk * (m.gait === 'walk' ? 0.3 : 1);
  // 기수: body와 함께 오르내리고(자식), 빠를수록 앞으로 숙이며 말의 흔들림을 허리로 받는다
  const r = H.rider;
  if (r) { const ru = r.userData; ru.leanAdd = (0.05 + 0.12 * ss(2, 6, v)) * kk - H.body.rotation.x * 0.8; ru.rollAdd = -H.body.rotation.z * 0.6; }
  H.speed = v; H.gaitName = kk > 0.02 ? m.gait : 'stand';
}

// 장면에 있는 모든 말을 움직인다(world.step이 부른다). 장면에서 치운 말은 놓아준다
export function animateHorses(dt, root) {
  for (const h of horses) {
    let top = h; while (top.parent) top = top.parent;
    if (top !== root) { if (h.userData.seen) horses.delete(h); continue; }
    h.userData.seen = true;
    if (!h.visible) { h.userData.m.last = null; continue; }
    animateHorse(h, dt);
  }
}

// 말 탄 사람 한 묶음: makePerson으로 만든 사람을 태운 말을 돌려준다
export function rider(makePerson, look, opts = {}) {
  const h = makeHorse(opts), p = makePerson(look);
  mount(h, p);
  return h;
}
