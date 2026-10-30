// 인물의 몸 움직임(2026-10-30 선생님: NPC 움직임이 뻣뻣하고 기계적이다 → 실제 사람이 목적을 가지고 움직이는 것처럼).
// 새 애니메이션 엔진이 아니라, 지금 인물(core/people.js makePerson)의 관절을 그대로 쓴다:
//   다리(허벅지·무릎) 둘, 팔 둘(어깨), 머리 묶음, 그리고 이번에 더한 몸통 관절 upper(골반 높이 HIP에서 돌아 상체·팔·머리를 함께 움직인다).
// 한 프레임에 한 번 animateWalk가 모든 층을 차례로 정해 겹쳐 쓰지 않는다:
//   ① 이동: 실제 이동 빠르기(m/s)를 재서 부드럽게 따라가고(출발 가속·멈출 때 감속), 빠르기에 맞춰 보폭·걸음 박자·팔 흔들기·상체 숙임을 정한다
//      (걸음 박자 = 빠르기 ÷ 보폭이라 발이 미끄러지지 않는다). 걷기·빠른 걸음·달리기와 걷는 모양(style: 경계·포로·무거운 짐)을 나눈다.
//   ② 몸통: 걸음에 맞춘 어깨 비틀림(다리와 반대)·체중 이동(좌우 기울기), 방향을 틀면 상체는 조금 늦게 따라오고 머리가 먼저 돌며 도는 쪽으로 기운다.
//   ③ 팔: 든 물건(carry)·무기(gear)·행동(act) 자세가 걸음 팔 흔들기보다 앞선다. 자세가 바뀔 때는 armBlend로 이어 붙여 갑자기 꺾이지 않는다.
//   ④ 머리: 바라볼 곳(look)·대화 끄덕임·서 있을 때 두리번거리기. 몸통이 기운 만큼 머리는 반대로 세워 시선이 흔들리지 않는다.
// 장 코드가 직접 정한 팔 자세(만세 등)는 걷지 않는 동안 건드리지 않는다(예전과 같다).
import * as THREE from 'three';

export const HIP = 1.05; // 몸통 관절(upper) 높이: 상체·팔·머리·든 물건은 이 관절의 자식
const LEGLEN = 0.55;    // 다리(골반 관절~발바닥) 길이: makePerson의 다리 관절 높이
const LEG = 0.45;        // 걸음에서 몸이 내려앉는 높이를 잴 때 쓰는 다리 길이(무릎이 조금 굽어 실제 다리보다 짧게)
const v3 = new THREE.Vector3();
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const lerp = (a, b, k) => a + (b - a) * k;

// 물건 들기(D-18): style마다 물건 자리(몸 기준 높이)와 [왼팔, 오른팔]의 [앞뒤, 안팎] 각도(null이면 걸을 때 흔드는 팔)
//   'arms' 두 팔로 가슴 앞에 안기 · 'side' 굽힌 오른팔에 얹어 옆구리에 끼기 · 'shoulder' 오른손으로 어깨에 멘 것 잡기 · 'flag' 오른손 깃대 · 'back' 등짐 멜빵
// heavy: 무거운 짐(보폭이 줄고 상체를 뒤로 젖혀 버틴다). 물건에 userData.heavy를 달면 그 물건도 무겁게
export const CARRY = {
  arms: { at: [0, 1.22, 0.6], arms: [[-1.0, 0.33], [-1.0, -0.33]], heavy: 0.5 },
  side: { at: [0.56, 1.42, 0.45], arms: [null, [-1.1, 0.05]], heavy: 0.1 },
  shoulder: { at: [0.48, 2.0, -0.08], arms: [null, [-2.9, -0.15]], heavy: 0.7 },
  flag: { at: [0.5, 1.23, 0.66], arms: [null, [-1.0, 0]], heavy: 0 },
  back: { at: [0, 1.5, -0.42], arms: [[-0.35, 0.18], [-0.35, -0.18]], heavy: 0.8 },
};
// 걷는 모양: 'guard' 경계하며 걷기(무기를 든 팔을 붙이고 고개로 둘레를 살핀다) · 'captive' 포로(움츠린 어깨, 고개 숙임, 앞으로 모은 손, 짧은 걸음)
//   · 'weary' 지친 걸음(피란길) · 'elder' 나이 든 사람. 생김새의 나이와 들고 있는 것에서도 저절로 고른다
const STYLE = {
  normal:  { lean: 0, stride: 1, swing: 1, idle: 1 },
  guard:   { lean: -0.02, stride: 0.95, swing: 0.6, idle: 0.4, scan: 1 },
  captive: { lean: 0.2, stride: 0.6, swing: 0.15, idle: 0.3, headDown: 0.35, bound: true },
  weary:   { lean: 0.12, stride: 0.75, swing: 0.55, idle: 0.6, headDown: 0.15 },
  elder:   { lean: 0.1, stride: 0.8, swing: 0.7, idle: 0.7 },
  soldier: { lean: -0.02, stride: 1, swing: 0.9, idle: 0.35 },
};
export function setStyle(person, style) { person.userData.style = style; return person; }
// 바라볼 곳(세계 좌표, Vector3 또는 { x, y, z }). null이면 앞을 본다
export function setLook(person, target) { person.userData.look = target ? new THREE.Vector3(target.x, target.y ?? 2.2, target.z) : null; return person; }

const state = u => u.m || (u.m = { v: 0, yaw: null, lag: 0, roll: 0, last: null, rest: 0, nod: 0, headX: 0, tick: 0 });
const styleOf = (person, u) => STYLE[u.style] || (u.lookAge === 'old' ? STYLE.elder : u.gear ? STYLE.soldier : STYLE.normal);

// 팔 자세를 바꾸기 직전의 각을 적어 두고 dur초 동안 새 자세로 이어 붙인다(갑자기 꺾이지 않게)
export function blendArms(person, dur = 0.3) {
  const u = person.userData; if (!u.arms) return;
  u.armBlend = { from: u.arms.map(a => [a.rotation.x, a.rotation.y, a.rotation.z]), t: 0, dur };
}
function applyBlend(u, dt) {
  const b = u.armBlend; if (!b) return;
  b.t += dt; const k = ss(0, 1, b.t / b.dur);
  u.arms.forEach((a, i) => { const f = b.from[i]; a.rotation.set(lerp(f[0], a.rotation.x, k), lerp(f[1], a.rotation.y, k), lerp(f[2], a.rotation.z, k)); });
  if (b.t >= b.dur) u.armBlend = null;
}

// 걸음 한 박자(ph)의 다리·팔 자세(D-11). 장이 직접 걸음을 돌리는 인물(고려 1장 물러나는 거란군, 조선 6장 일꾼)이 쓴다.
// k(0~1) 걸음 세기, amp 다리 벌림. 돌려주는 값은 몸을 올릴 높이(0~0.08, 예전과 같은 쓰임)
export function gaitPose(person, ph, k = 1, amp = 0.75, run = 0) {
  const u = person.userData, s = Math.sin(ph) * k, c = Math.cos(ph);
  u.legs[0].rotation.x = s * amp; u.legs[1].rotation.x = -s * amp;
  const k0 = u.legs[0].userData.knee, k1 = u.legs[1].userData.knee, lift = 1.1 + run * 0.2;
  if (k0) k0.rotation.x = (0.1 + Math.max(0, -c) * lift) * k; // 앞으로 내딛는(뒤에서 앞으로 오는) 다리의 무릎을 굽힌다
  if (k1) k1.rotation.x = (0.1 + Math.max(0, c) * lift) * k;
  if (u.carry) carryPose(person, ph, k);
  else if (u.arms) { const sw = Math.min(0.9, amp * 0.87) * (u.swing ?? 1); armSwing(u, 0, -s * sw, run); armSwing(u, 1, s * sw, run); }
  return Math.abs(c) * 0.08 * k;
}
// 걸음 팔: 앞뒤로 흔들되 달릴 때는 팔을 조금 벌린다. 무기를 쥔 팔은 무기 자세를 지킨다
function armSwing(u, i, x, run) {
  const a = u.arms[i], hold = u.grip?.[i];
  if (hold) { a.rotation.set(hold[0] + x * 0.12, 0, hold[1]); return; }
  a.rotation.set(x, 0, (i ? -1 : 1) * (0.05 + run * 0.12) * Math.min(1, Math.abs(x) * 4 + u.stride));
}

// 든 물건 자세: 팔은 물건을 받치고, 물건은 손 자리에 붙어 걸음에 맞춰 살짝 흔들린다(D-18). 물건은 몸통 관절(upper)의 자식
export function carryPose(person, ph = 0, k = 0) {
  const u = person.userData, c = u.carry; if (!c || !u.arms) return;
  const P = CARRY[c.style] || CARRY.arms, sway = Math.sin(ph * 2) * 0.04 * k;
  P.arms.forEach((a, i) => {
    if (a) u.arms[i].rotation.set(a[0] + sway, 0, a[1]);
    else armSwing(u, i, -Math.sin(ph) * k * 0.65 * (i ? -1 : 1), 0); // 빈 팔은 걸음에 맞춰 흔든다
  });
  const y0 = c.obj.parent === u.upper ? HIP : 0;
  c.obj.position.set(P.at[0], P.at[1] - y0 + Math.abs(Math.cos(ph)) * 0.035 * k, P.at[2]);
  c.obj.rotation.z = c.rz + Math.sin(ph) * 0.05 * k;
  // 집어 든 순간: 물건이 놓여 있던 자리에서 손 자리로 짧게 옮겨 온다(순간이동하지 않게)
  if (c.lift && c.lift.t < c.lift.dur) { const e = ss(0, 1, c.lift.t / c.lift.dur); c.obj.position.lerpVectors(c.lift.from, c.obj.position, e); }
}
// 물건을 든다(obj) / 내려놓는다(null). 들던 것이 있으면 먼저 내려놓는다. 물건은 사람(몸통 관절)의 자식이 되어 함께 움직인다.
// 집을 때: 팔이 물건 쪽으로 뻗어 받치는 자세로 이어지고(armBlend), 물건은 원래 자리에서 손으로 옮겨 온다.
// 내려놓을 때: 팔은 천천히 내려온다. 들고 있다는 사실(userData.carry)은 곧바로 바뀌어 진행 규칙은 예전과 같다.
export function setCarry(person, obj, style = 'arms') {
  const u = person.userData, prev = u.carry, host = u.upper || person;
  if (prev && prev.obj !== obj && prev.obj.parent && (prev.obj.parent === person || prev.obj.parent === u.upper)) prev.obj.parent.remove(prev.obj);
  if (!obj) {
    u.carry = null;
    if (u.arms) { blendArms(person, 0.35); u.armRest = true; if (!u.m) u.arms.forEach(a => a.rotation.set(0, 0, 0)); } // 움직임을 돌리지 않는 인물(테스트·그림용)은 곧바로
    return;
  }
  let from = null;
  if (obj.parent && obj.parent !== host && u.m) { obj.getWorldPosition(v3); host.worldToLocal(v3); from = v3.clone(); } // 놓여 있던 자리(몸통 관절 기준)
  host.add(obj);
  u.armRest = false;
  if (u.m && !(prev && prev.obj === obj)) blendArms(person, 0.3);
  u.carry = { obj, style, rz: prev && prev.obj === obj ? prev.rz : obj.rotation.z, lift: from ? { from, t: 0, dur: 0.3 } : null };
  carryPose(person);
  if (u.armBlend && !u.m) u.armBlend = null;
}

// 행동(act): 정해진 시간 동안 팔·몸통·머리 자세를 정하는 함수 pose(t) → { arms?: [[x,y,z]|null, …], upper?: [x,y,z], head?: [x,y], step? }.
// 들어갈 때와 끝날 때 걸음·서 있는 자세와 섞어(in·out초) 갑자기 바뀌지 않는다. 같은 사람에게 새 행동을 주면 앞 행동은 끝을 섞으며 넘겨준다.
export function playAction(person, { dur, pose, fadeIn = 0.2, fadeOut = 0.25, name = 'act' }) {
  const u = person.userData; state(u);
  if (u.act) { u.act.resolve?.(); }
  return new Promise(resolve => { u.act = { name, t: 0, dur, pose, fadeIn, fadeOut, resolve }; });
}
export const acting = person => !!person.userData.act;

// 대화 몸짓: 말하는 사람은 표정에 맞는 손짓(말하기·놀람·걱정·분노·기쁨·긴장)과 고개 끄덕임, 듣는 사람은 가끔 끄덕인다.
// setTalking(person, expr) / setTalking(person, null)로 켜고 끈다(core/main.js가 대사마다 부른다)
export function setTalking(person, expr = 'talk', role = 'speak') {
  const u = person.userData; if (!u.arms) return;
  state(u);
  if (!expr) { if (u.talk) { u.talk = null; if (!u.carry) { u.armRest = !u.grip; u.m.settle = 0.8; } } return; } // 말이 끝나면 팔을 천천히 내린다(무기를 쥔 사람은 쥔 자세로)
  if (!u.talk) blendArms(person, 0.3);
  u.talk = { expr, role, t: 0 };
}
const GESTURE = { // 말하는 손짓: 오른팔(과 왼팔)의 [앞뒤, 안팎] 기본 자리와 흔들기
  talk: { r: [-0.55, -0.12], l: [-0.08, 0.06], beat: 0.12 },
  surprise: { r: [-1.05, -0.3], l: [-0.9, 0.3], beat: 0.03 },
  worry: { r: [-0.7, 0.32], l: [-0.7, -0.32], beat: 0.03 },  // 두 손을 가슴 앞에 모은다
  anger: { r: [-1.25, -0.05], l: [-0.05, 0.08], beat: 0.18 }, // 주먹을 앞으로
  joy: { r: [-0.95, -0.45], l: [-0.95, 0.45], beat: 0.08 },   // 두 팔을 벌린다
  tension: { r: [-1.35, -0.02], l: [-0.1, 0.05], beat: 0.02 }, // 앞을 가리킨다
};

// 걷기·서 있기·행동을 한 프레임 정한다. moving: 걷는 중인가(플레이어는 입력, 다른 인물은 실제로 움직였는가).
// 장이 걸음을 빠르게 돌리려고 dt를 키워 부르는 곳도 있어(근대 2·3장) 걸음 박자는 dt에 비례한다
export function animateWalk(person, moving, dt) {
  const u = person.userData;
  if (!u.legs || !dt) return;
  const m = state(u);
  u.t = (u.t || 0) + dt;
  // ① 실제 빠르기를 재고 부드럽게 따라간다(출발할 때 가속, 멈출 때 감속). 크게 건너뛴 것(장면 전환)은 빠르기로 보지 않는다
  person.getWorldPosition(v3);
  let raw = 0;
  if (m.last) raw = Math.hypot(v3.x - m.last.x, v3.z - m.last.z) / dt; else m.last = new THREE.Vector3();
  m.last.copy(v3);
  if (raw > 14) raw = 0;
  const e = person.matrixWorld.elements, sc = Math.hypot(e[4], e[5], e[6]) || person.scale.y || 1, target = moving ? raw : 0; // sc: 실제 크기(작게 줄인 지도 위 군대·크게 키운 먼 병사도 제 걸음으로) // 걸음은 실제로 간 빠르기만 따른다(느리게 가면 느린 걸음, 제자리면 멈춤. 2026-10-30 종종걸음 고침)
  m.v += (target - m.v) * Math.min(1, dt * (target > m.v ? 5 : 6));
  if (!moving && m.v < 0.03) m.v = 0;
  const v = m.v / sc, st = styleOf(person, u), c0 = u.carry ? (CARRY[u.carry.style] || CARRY.arms) : null;
  const heavy = c0 ? Math.max(c0.heavy, u.carry.obj.userData.heavy ? 1 : 0) : 0;
  const k = ss(0, 0.25, v), run = ss(3.2, 5, v) * (1 - heavy * 0.7);
  // 한 걸음 보폭(m): 느리면 짧게, 빠르면 길게. 달리기는 두 발이 뜬 사이만큼 더 나아간다
  const sf = st.stride * (1 - heavy * 0.25) * (0.95 + ((u.ph * 7.3) % 1) * 0.1), walkStep = (0.36 + 0.3 * Math.min(1, v / 1.5) + 0.2 * ss(1.2, 2.8, v)) * sf, step = walkStep + 0.55 * run * sf;
  // 다리를 벌리는 각도는 그 보폭에서 바로 나온다: 디딘 발이 땅에 붙은 채 몸이 한 걸음 나아가려면 2 × 다리 길이 × sin(각도) = 보폭
  const amp = Math.asin(Math.min(0.78, walkStep / (2 * LEGLEN))) * (1 - 0.25 * run) + 0.06 * run; // 달릴 때는 뜬 사이에 나아가므로 다리를 덜 벌린다
  const was = u.stride || 0;
  u.stride = was + ((moving ? 1 : 0) - was) * Math.min(1, dt * 6);
  if (u.stride < 0.002 && !moving) u.stride = 0;
  const kk = Math.min(u.stride, k + (moving ? 0 : u.stride * 0.6));
  // 걸음 박자 = 간 거리 ÷ 보폭(반 바퀴가 한 걸음). 멈추는 동안만 남은 걸음을 마저 디딘다
  if (moving || u.stride > 0) u.walk = (u.walk || 0) + dt * Math.max(Math.PI * v / step, moving ? 0 : 2.5);
  const ph = (u.walk || 0) + u.ph, s = Math.sin(ph), c = Math.cos(ph);
  const working = !moving && u.work;
  // 들썩임: 몸은 다리가 곧게 선 순간 가장 높고 두 다리가 벌어진 순간 내려앉는다(발이 땅에 붙어 있게). 지난 프레임에 더한 값을 빼고 새 값을 더한다
  const p = person.position, base = u.bobY !== undefined && p.y === u.bobY ? p.y - (u.bob || 0) : p.y;
  u.swing = st.swing;
  if (u.stride > 0 && !working) {
    gaitPose(person, ph, kk, amp, run);
    // 두 다리가 가장 벌어진 순간 발이 땅에 닿는 높이(0)로, 다리가 곧게 선 순간 그만큼 올라간다(땅 아래로 꺼지지 않게)
    const drop = LEG * (Math.cos(amp * s * kk) - Math.cos(amp * kk)) * 0.8;
    u.bob = drop * (1 - 0.7 * run); // 달릴 때는 무릎으로 받아 몸이 거의 오르내리지 않는다(폴짝거리지 않게, 2026-10-30 선생님)
  } else u.bob = 0;
  p.y = base + u.bob; u.bobY = p.y;
  const easeX = (o, val) => { o.rotation.x += (val - o.rotation.x) * 0.3; };
  if (working) { // 일하는 동작: 망치질(오른팔을 들었다 내리기), 나르기(두 팔을 앞으로 모아 들기), 쓸기(두 팔을 함께 흔들기)
    easeX(u.legs[0], 0); easeX(u.legs[1], 0);
    const w = u.t * (u.work === 'hammer' ? 5 : 2.2) + u.ph;
    if (u.work === 'hammer') { easeX(u.arms[1], -1.6 + Math.max(0, Math.sin(w)) * 1.4); easeX(u.arms[0], -0.3); }
    else if (u.work === 'carry') { easeX(u.arms[0], -1.1); easeX(u.arms[1], -1.1); }
    else { const sw = Math.sin(w) * 0.45; easeX(u.arms[0], -0.6 + sw); easeX(u.arms[1], -0.6 + sw); }
  }
  // ② 몸통: 걸음 비틀림·체중 이동·숙임, 방향 전환(상체가 늦게 따라오고 도는 쪽으로 기운다), 서 있을 때 숨쉬기와 체중 옮기기
  const yaw = person.rotation.y;
  if (m.yaw === null) m.yaw = yaw;
  const dy = wrap(yaw - m.yaw); m.yaw = yaw;
  if (Math.abs(dy) < 2.6) m.lag = Math.max(-0.6, Math.min(0.6, m.lag - dy)); // 한 번에 크게 돈 것(장면이 새로 세운 자리)은 몸통을 그대로
  m.lag *= Math.exp(-dt * 6);
  const turnRate = dy / dt;
  m.roll += (Math.max(-0.1, Math.min(0.1, -turnRate * v * 0.012)) - m.roll) * Math.min(1, dt * 6);
  const still = 1 - kk, breathe = Math.sin(u.t * 1.6 + u.ph) * 0.012 * still;
  const shift = Math.sin(u.t * 0.37 + u.ph * 3) * 0.022 * st.idle * still; // 서 있을 때 이쪽저쪽 다리로 무게를 옮긴다
  let ux = st.lean + (0.05 * Math.min(1, v / 2.5) + 0.08 * run) * kk - heavy * 0.06 * (c0?.at[2] > 0 ? 1 : -0.5) + breathe;
  let uy = s * 0.075 * kk * (1 + run * 0.5) * (u.carry && c0.arms[0] ? 0.4 : 1) + m.lag * 0.7;
  let uz = Math.cos(ph) * 0.022 * kk + m.roll + shift;
  // ③ 팔: 무기 쥔 자세(grip)는 makePerson이 정했다. 걷지 않을 때 내려놓은 팔은 천천히 내린다
  if (u.armRest && u.stride === 0 && !u.carry && !u.act && !u.talk) { { const f = Math.exp(-dt * 7); u.arms.forEach(a => { a.rotation.x *= f; a.rotation.y *= f; a.rotation.z *= f; }); } if (Math.abs(u.arms[0].rotation.x) < 0.01 && Math.abs(u.arms[1].rotation.x) < 0.01) u.armRest = false; }
  if (u.stride > 0) m.settle = 0.6; else if (m.settle > 0) m.settle -= dt; // 멈춘 뒤 잠깐만 무기 쥔 자세로 돌려 둔다(장이 정한 자세는 건드리지 않게)
  if (u.stride === 0 && m.settle > 0 && u.grip && !u.carry && !u.act && !u.talk) u.arms.forEach((a, i) => { const g = u.grip[i]; if (g) { a.rotation.x += (g[0] - a.rotation.x) * Math.min(1, dt * 6); a.rotation.z += (g[1] - a.rotation.z) * Math.min(1, dt * 6); } });
  if (st.bound && !u.carry) u.arms.forEach((a, i) => a.rotation.set(-0.42 + s * 0.04 * kk, 0, (i ? -1 : 1) * 0.3)); // 앞으로 모은(묶인) 손
  // 대화 몸짓
  let headX = 0, headY = 0;
  if (u.talk) {
    u.talk.t += dt;
    const T = u.talk;
    if (T.role === 'speak') {
      const G = GESTURE[T.expr] || GESTURE.talk, b = Math.sin(T.t * 4.2 + u.ph) * G.beat;
      if (!u.carry) { u.arms[1].rotation.set(G.r[0] + b, 0, G.r[1]); u.arms[0].rotation.set(G.l[0] + b * 0.4, 0, G.l[1]); }
      headX = Math.max(0, Math.sin(T.t * 3.1)) * 0.07; // 말하며 가볍게 끄덕인다
      ux += T.expr === 'anger' || T.expr === 'tension' ? 0.05 : T.expr === 'surprise' ? -0.06 : 0.02;
    } else headX = Math.max(0, Math.sin(T.t * 1.4 + 1)) ** 6 * 0.18; // 듣는 사람: 가끔 끄덕인다
  }
  // 행동 층(악수·건네기·찌르기 …): 시작과 끝을 섞는다
  if (u.act) {
    const A = u.act; A.t += dt;
    const w = Math.min(ss(0, 1, A.t / A.fadeIn), ss(0, 1, (A.dur - A.t) / A.fadeOut));
    const P = A.pose(Math.min(A.t, A.dur), A) || {};
    if (P.arms) P.arms.forEach((r, i) => { if (!r) return; const a = u.arms[i]; a.rotation.set(lerp(a.rotation.x, r[0], w), lerp(a.rotation.y, r[1] || 0, w), lerp(a.rotation.z, r[2] || 0, w)); });
    if (P.upper) { ux = lerp(ux, ux + P.upper[0], w); uy = lerp(uy, uy + P.upper[1], w); uz = lerp(uz, uz + (P.upper[2] || 0), w); }
    if (P.head) { headX = lerp(headX, P.head[0], w); headY = lerp(headY, P.head[1] || 0, w); }
    if (P.carryAt && u.carry) { const o = u.carry.obj, y0 = o.parent === u.upper ? HIP : 0; o.position.set(lerp(o.position.x, P.carryAt[0], w), lerp(o.position.y, P.carryAt[1] - y0, w), lerp(o.position.z, P.carryAt[2], w)); } // 건네기·내려놓기: 물건은 손과 함께
    if (A.t >= A.dur) { u.act = null; if (!u.carry && !A.keep) { u.armRest = !u.grip; m.settle = 0.8; } A.resolve(); } // 끝나면 팔은 쉬는 자세로 천천히(장이 이어서 정하면 그 자세로)
  }
  applyBlend(u, dt);
  if (u.mounted) { ux += u.leanAdd || 0; uz += u.rollAdd || 0; } // 말 탄 사람: 말의 흔들림을 허리로 받는다(core/horse.js)
  if (u.upper) u.upper.rotation.set(ux, uy, uz);
  if (u.spear && !u.spearHeld) u.spear.rotation.x = -u.arms[1].rotation.x - ux; // 창은 팔을 들든 흔들든 곧게 선 채로(손에 쥔 자리에서)
  // ④ 머리: 바라볼 곳 → 경계(둘레 살피기) → 서 있을 때 두리번거리기. 몸통 비틀림·기울기는 덜어 시선을 앞에 둔다
  if (u.head) {
    let look = 0;
    if (u.look) { person.getWorldPosition(v3); const want = Math.atan2(u.look.x - v3.x, u.look.z - v3.z); look = Math.max(-1.1, Math.min(1.1, wrap(want - yaw - uy))); }
    else if (st.scan) look = Math.sin(u.t * 0.9 + u.ph) * 0.55 * ss(0.2, 0.9, Math.abs(Math.sin(u.t * 0.45 + u.ph)));
    else if (!moving) look = Math.sin(u.t * 0.45 + u.ph) * 0.35 * Math.max(0, Math.sin(u.t * 0.21 + u.ph * 2)) * st.idle;
    else look = -uy * 0.8; // 걸을 때는 앞을 본다(상체가 늦게 돌면 머리는 먼저 새 방향을)
    look += headY;
    u.head.rotation.y += (look - u.head.rotation.y) * Math.min(1, dt * (u.look ? 5 : 3));
    u.head.rotation.z += (-uz * 0.8 - u.head.rotation.z) * Math.min(1, dt * 8);
    // 고개 숙임·끄덕임은 장이 정한 고개 각(엎드려 겨누기 등)을 흐트러뜨리지 않게 더했다 뺀다
    const nx = headX + (st.headDown || 0) - ux * 0.5;
    u.head.rotation.x += nx - m.headX; m.headX = nx;
  }
  if (u.carry) { const L = u.carry.lift; if (L && L.t < L.dur) L.t += dt; if (u.stride === 0 && !u.act) carryPose(person, ph, 0); }
}
// 일하는 사람으로 정한다: 'hammer'(망치질) 'carry'(짐 들기) 'sweep'(쓸기·노 젓기). 장면 굳히기(core/bake.js)에서 빠져 계속 움직인다.
export function setWork(person, kind) { person.userData.work = kind; return person; }
