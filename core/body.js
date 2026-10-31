// 공통 뼈대 몸(2026-10-31 선생님 지시: "공통 뼈대 + 코드 옷 입히기").
// 모든 인물이 assets/models/body.glb(tools/blender/body.py)의 뼈대 하나와 동작 묶음을 함께 쓴다. 옷·모자·얼굴·머리·무기·소품은
// 지금처럼 makePerson(core/people.js)이 코드로 만들고, 여기서 그 조각들을 해당 뼈에 옮겨 붙인다:
//   머리 묶음 → head · 윗옷·갑옷·깃(높이 1.28 위) → 가슴/허리 · 긴 옷자락·허리띠·허리 칼(아래) → 골반
//   소매 → 위팔·아래팔(팔꿈치에서 둘로 나눔) · 소맷부리·손 → 아래팔·손 · 무기(창)·든 물건 → 손 · 허벅지·정강이·신 → 허벅지·정강이·발
// 기본 움직임은 THREE.AnimationMixer가 동작 묶음(idle·walk·run·walk_spear …)을 틀고, 바뀔 때 crossFadeTo(0.25초)로 섞는다.
// 장 코드나 행동(playAction: 악수·건네기·찌르기·손 뻗기)이 예전 관절(userData.legs·arms·upper)을 직접 돌리면, 그 관절을 따라가는 덧씌움이
// 그때만 동작 위에 얹힌다(관절이 쉬는 자세면 덧씌움 0). 그래서 지금 장 코드의 호출 방식은 그대로다.
// body.glb를 못 불러오면(또는 꺼 두면) makePerson은 예전과 똑같다.
import * as THREE from 'three';
import { stepRate } from './gait.js';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from '../vendor/jsm/utils/SkeletonUtils.js';

export const BODY_URL = new URL('../assets/models/body.glb', import.meta.url).href;
const FADE = 0.25;
// 걷는 동작 한 바퀴(두 걸음)에 가는 거리(m)와 한 바퀴 시간(초): 빠르기에 맞춰 박자를 바꿔 발이 미끄러지지 않게(tools/blender/body.py와 같다)
const PACE = { walk: [1.1, 1.0], run: [2.6, 0.583], walk_spear: [1.0, 1.0], walk_sword: [1.0, 1.0], walk_bow: [1.05, 1.0], carry: [0.75, 1.083] };
let base = null;
const people = new Set();

export async function loadBody(url = BODY_URL) {
  if (!base) base = await new GLTFLoader().loadAsync(url);
  return base;
}
export const bodyReady = () => !!base;
export function bodyOn() { try { return new URLSearchParams(location.search).get('body') === '1' || localStorage.getItem('goryeo-body') === '1'; } catch { return false; } }

const wq = new THREE.Quaternion(), wq2 = new THREE.Quaternion(), wv = new THREE.Vector3(), wv2 = new THREE.Vector3();
const inside = (o, root) => { for (let q = o; q; q = q.parent) if (q === root) return true; return false; };

// 사람(makePerson이 만든 g)에 뼈대를 넣고 조각을 뼈로 옮긴다. 돌려주는 것은 같은 g(userData.skel이 생긴다)
export function attachBody(g, look = {}) {
  if (!base) return g;
  const u = g.userData;
  if (!u.legs || !u.arms || !u.upper || u.skel) return g;
  const root = cloneSkinned(base.scene); root.name = 'skel';
  g.add(root); g.updateMatrixWorld(true);
  const B = n => root.getObjectByName(n);
  const side = i => (i === 0 ? 'R' : 'L'); // 팔·다리 [0]은 x−쪽, [1]은 x+쪽(블렌더 _L)
  const move = (o, bone) => { if (o && bone) bone.attach(o); };
  // 창을 든 팔은 예전엔 앞으로 든 만큼 창을 뒤로 세웠다(rotation.x 0.25). 뼈대는 손목으로 창을 세우므로 쉬는 자세에선 곧게
  const spear = u.arms[1].getObjectByName('spear'); if (spear) { spear.rotation.x = 0; spear.updateMatrixWorld(true); }
  // 다리: 허벅지·정강이·신
  u.legs.forEach((leg, i) => {
    const knee = leg.userData.knee, s = side(i);
    for (const c of [...leg.children]) if (c !== knee) move(c, B(`thigh_${s}`));
    if (knee) for (const c of [...knee.children]) move(c, c.name === 'shoe' ? B(`foot_${s}`) : B(`shin_${s}`));
  });
  // 팔: 소매 상자는 팔꿈치(어깨에서 0.38)에서 둘로 나눠 위팔·아래팔에, 소맷부리·손·무기는 아래팔·손에
  u.arms.forEach((arm, i) => {
    const s = side(i), up = B(`upperarm_${s}`), fore = B(`forearm_${s}`), hand = B(`hand_${s}`);
    for (const c of [...arm.children]) {
      if (c.isMesh && !c.name && c.geometry?.parameters?.height > 0.5) { // 소매
        const P = c.geometry.parameters, top = c.position.y + P.height / 2, bot = c.position.y - P.height / 2, cut = -0.38;
        for (const [a, b, bone] of [[top, cut, up], [cut, bot, fore]]) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(P.width, a - b + 0.02, P.depth), c.material);
          m.position.set(c.position.x, (a + b) / 2, c.position.z); m.castShadow = true; m.receiveShadow = c.receiveShadow; m.name = 'sleeve';
          arm.add(m); m.updateMatrixWorld(true); move(m, bone);
        }
        arm.remove(c);
      } else if (c.name === 'hand' || c.name === 'spear' || c.name === 'sword' || c.isGroup) move(c, hand);
      else move(c, fore); // 소맷부리
    }
  });
  // 몸통 관절(upper) 속: 머리 묶음 → head, 나머지 윗옷·깃·등에 멘 것 → 가슴(높이 1.45 위)·허리
  for (const c of [...u.upper.children]) {
    if (u.arms.includes(c)) continue;
    if (c === u.head) { move(c, B('head')); continue; }
    c.getWorldPosition(wv); move(c, wv.y > 1.45 * g.scale.y ? B('chest') : B('spine'));
  }
  // 사람 바로 아래: 긴 옷자락·바지·허리띠·허리 칼 → 골반
  for (const c of [...g.children]) if (c !== root && c !== u.upper && !u.legs.includes(c) && (c.isMesh || c.isGroup)) move(c, B('hips'));
  // 옷 속의 가는 몸: 옷 색으로 칠한다(팔꿈치·무릎을 굽혀도 조각 사이가 비어 보이지 않게)
  const colorOf = name => { let m = null; g.traverse(o => { if (!m && o.isMesh && o.name === name) m = o.material; }); return m; };
  const mats = { b_torso: colorOf('robe') || colorOf('jeogori'), b_arm: colorOf('sleeve'), b_leg: colorOf('thigh'), b_skin: colorOf('hand') };
  root.traverse(o => { if (o.isSkinnedMesh) { const k = o.material?.name; if (mats[k]) o.material = mats[k]; o.castShadow = false; o.frustumCulled = false; } });
  // 예전 관절(빈 껍데기가 됨)과 뼈: 쉬는 자세에서 둘의 차이 C(뼈의 세계 회전 = 관절의 세계 회전 × C)
  g.updateMatrixWorld(true);
  const link = (proxy, name, extra = []) => { const bone = B(name); return { proxy, bone, C: proxy.getWorldQuaternion(wq).clone().invert().multiply(bone.getWorldQuaternion(wq2)), rest: bone.quaternion.clone(), extra: extra.map(n => ({ bone: B(n), rest: B(n).quaternion.clone() })), w: 0 }; };
  const links = [link(u.upper, 'spine'),
    ...u.legs.map((l, i) => link(l, `thigh_${side(i)}`)), ...u.legs.map((l, i) => link(l.userData.knee, `shin_${side(i)}`)),
    ...u.arms.map((a, i) => link(a, `upperarm_${side(i)}`, [`forearm_${side(i)}`, `hand_${side(i)}`]))]; // 예전 팔 자세(팔꿈치 없음)를 덧씌울 때는 아래팔·손을 곧게
  const mixer = new THREE.AnimationMixer(root), acts = {};
  for (const clip of base.animations) { const a = mixer.clipAction(clip); acts[clip.name] = a; if (clip.name === 'give' || clip.name === 'put_down') { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } }
  const S = { root, mixer, acts, links, cur: null, target: null, w: {}, fade: FADE, manual: null, bones: B, look, mixed: new Map(), skinOn: true };
  S.rehome = (from, to) => { people.delete(from); people.add(to); };
  S.freeze = () => { root.traverse(o => { if (o.isSkinnedMesh) o.visible = false; }); people.delete(g); S.frozen = true; }; // 움직이지 않는 군중으로 굳힐 때(core/bake.js)
  u.skel = S;
  play(g, 'idle', 0);
  people.add(g);
  return g;
}

// 기본 동작을 바꾼다(같으면 박자만). timeScale: 걷는 빠르기에 맞춘 박자.
// 섞기는 무게를 직접 정한다(update): 새 동작은 fade초 동안 0→1, 나머지는 1→0, 0이 되면 멈춘다.
// (three의 crossFadeTo를 섞는 도중에 거듭 부르면 믹서 안의 무게 장부가 어긋나 동작이 먹지 않는 일이 있었다: 2026-10-31 짐 안고 걷기에서 팔이 내려가 있던 오류)
export function play(g, name, fade = FADE, timeScale = 1) {
  const S = g.userData.skel; if (!S) return;
  const next = S.acts[name] ? name : 'idle', a = S.acts[next];
  a.timeScale = timeScale;
  if (S.target === next) return;
  S.target = next; S.cur = a; S.fade = fade;
  if (!a.isRunning()) { a.reset(); a.enabled = true; a.setEffectiveWeight(S.w[next] || 0); a.play(); }
  if (fade <= 0) for (const k of Object.keys(S.w)) S.w[k] = k === next ? 1 : 0;
}
function blend(S, dt) {
  for (const [n, a] of Object.entries(S.acts)) {
    const w0 = S.w[n] || 0, goal = n === S.target ? 1 : 0;
    if (w0 === goal) { if (goal === 1) a.setEffectiveWeight(1); continue; }
    const step = S.fade > 0 ? dt / S.fade : 1, w = goal > w0 ? Math.min(1, w0 + step) : Math.max(0, w0 - step);
    S.w[n] = w; a.enabled = true; a.setEffectiveWeight(w);
    if (w === 0) a.stop();
  }
}
// 걷는 빠르기(m/s)에 맞춘 박자
// 동작 재생 빠르기: 동작 한 바퀴(두 걸음)를 사람 걸음 박자(core/gait.js)에 맞춘다(2026-10-31 선생님: 예전에는 빠르기에 비례해 다리만 바빠졌다)
export const paceScale = (name, v, heavy = 0) => { const p = PACE[name]; return p ? Math.max(0.35, stepRate(v, heavy) * p[1] / 2) : 1; };
// 장이 걸음 박자를 직접 주는 사람(gaitPose): 걷는 동작을 그 박자 자리에 세운다(ph 2π = 두 걸음)
export function manualGait(g, ph, k) {
  const S = g.userData.skel; if (!S) return 0;
  play(g, k > 0.05 ? 'walk' : 'idle', FADE, 0);
  const a = S.acts.walk; if (k > 0.05) a.time = (((ph / (2 * Math.PI)) % 1) + 1) % 1 * a.getClip().duration;
  S.manual = true;
  return 0;
}
// 한 번 하는 동작(건네기·내려놓기): 다 하면 끝 자세로 멈추고 다음 기본 동작을 고를 때 풀린다
export function playOnce(g, name) { const S = g.userData.skel; if (!S || !S.acts[name]) return; play(g, name, 0.2, 1); }

// 든 물건을 손에 붙인다: 'arms'(두 팔로 안기)는 짐 안기 동작이 다 섞인 뒤 두 손 가운데에 놓고 x+쪽 손 뼈에 붙인다(그 전에는 가슴 앞).
// 그 밖(옆구리·어깨·깃대·등짐)은 예전 자리 그대로 가슴 뼈에 붙인다
export function holdOnBody(g, obj, style, at) {
  const S = g.userData.skel; if (!S) return false;
  const chest = S.bones('chest');
  g.updateMatrixWorld(true);
  const p = g.localToWorld(wv.set(at[0], at[1], at[2]));
  chest.add(obj); chest.worldToLocal(obj.position.copy(p));
  S.carry = style === 'arms' ? { obj, pending: true } : null;
  return true;
}

// 한 프레임: 동작을 틀고(manual이면 박자 자리), 예전 관절이 쉬는 자세가 아니면 덧씌운다. world.step이 걸음 계산 뒤에 부른다
const tmp = new THREE.Quaternion(), par = new THREE.Quaternion();
const restQ = new THREE.Quaternion();
// 멀리 있는 사람은 가볍게(2026-10-31 성능: 사람이 많은 장면에서 FPS가 떨어지면): 15m 밖은 옷 속의 가는 몸을 숨기고(팔꿈치 사이는 멀리서 안 보인다),
// 22m 밖은 동작을 세 프레임에 한 번, 화질 '낮음'에서 30m 밖은 동작을 멈춘다
let view = null; // world(카메라 자리와 화질: 화질은 놀이 중에 저절로 낮아질 수 있어 그때그때 읽는다)
export function setBodyView(world) { view = world; }
const NEAR_SKIN = 15, FAR_STEP = 22, FAR_STOP = 30;
function update(g, dt) {
  const S = g.userData.skel;
  for (let q = g; q; q = q.parent) if (!q.visible) return; // 숨긴 사람은 건너뛴다
  if (!g.parent) return;
  if (view?.camera) {
    const d = g.getWorldPosition(wv).distanceTo(view.camera.position), low = view.qualityLevel === 'low';
    const skin = d < (S.skinOn ? NEAR_SKIN + 2 : NEAR_SKIN);
    if (skin !== S.skinOn) { S.skinOn = skin; S.root.traverse(o => { if (o.isSkinnedMesh) o.visible = skin; }); }
    if (low && d > FAR_STOP) return;
    if (d > FAR_STEP) { S.acc = (S.acc || 0) + dt; if ((S.tick = ((S.tick || 0) + 1) % 3) !== 0) return; dt = S.acc; S.acc = 0; }
  }
  blend(S, dt);
  // three의 믹서는 값이 지난 프레임과 같으면 뼈에 다시 쓰지 않는다(뼈가 지난 값을 그대로 갖고 있다고 여긴다). 덧씌움이 뼈를 바꿨다면
  // 믹서가 지난번에 쓴 값으로 되돌려 둔 뒤 돌린다(2026-10-31: 짐 안기처럼 팔이 가만한 동작에서 집는 자세가 풀린 뒤에도 팔이 내려가 있던 오류)
  for (const [bone, q] of S.mixed) bone.quaternion.copy(q);
  S.mixed.clear();
  S.mixer.update(S.manual ? 0.0001 : dt); S.manual = false;
  let posed = false; // 덧씌울 관절이 있을 때만 사람 전체의 자리(행렬)를 새로 잰다(사람이 많은 장면에서 가볍게)
  for (const L of S.links) {
    const active = L.proxy.quaternion.angleTo(restQ) > 0.02;
    L.w += ((active ? 1 : 0) - L.w) * Math.min(1, dt * 10);
    if (L.w < 0.001) continue;
    if (!posed) { g.updateMatrixWorld(true); posed = true; }
    for (const b of [L.bone, ...L.extra.map(e => e.bone)]) S.mixed.set(b, b.quaternion.clone()); // 믹서가 쓴 값(다음 프레임에 되돌린다)
    tmp.copy(L.proxy.getWorldQuaternion(wq)).multiply(L.C);
    L.bone.parent.getWorldQuaternion(par);
    L.bone.quaternion.slerp(par.invert().multiply(tmp), L.w);
    for (const e of L.extra) e.bone.quaternion.slerp(e.rest, L.w);
    L.bone.updateMatrixWorld(true);
  }
  // 두 팔로 안은 짐: 짐 안기 동작이 다 섞이면 두 손 가운데로 옮겨 손에 붙인다(그 뒤로는 손과 함께 움직인다)
  const c = S.carry;
  const armsFree = S.links.every(L => L.extra.length === 0 || L.w < 0.02); // 집는 자세(덧씌움)가 다 풀리고 짐 안기 동작만 남았을 때
  if (c && c.pending && armsFree && /carry/.test(S.target || '') && (S.w[S.target] || 0) > 0.98) {
    g.updateMatrixWorld(true);
    const hl = S.bones('hand_L'), hr = S.bones('hand_R');
    hl.getWorldPosition(wv); hr.getWorldPosition(wv2); wv.add(wv2).multiplyScalar(0.5);
    c.obj.parent.worldToLocal(wv2.copy(wv)); c.obj.position.copy(wv2); c.obj.updateMatrixWorld(true);
    hl.attach(c.obj); c.pending = false;
  }
}
export function updateBodies(dt) { for (const g of people) update(g, dt); }
export const bodyPeople = () => [...people];
export function resetBodies() { people.clear(); }
