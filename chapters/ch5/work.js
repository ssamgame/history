// 5장 경판 만들기를 몸으로 하기(2026-10-30 선생님: 대화 키만 누르면 끝나던 것을 실제 행동으로).
// 자리마다: 빛나는 곳에서 E → (장인이 비켜서고) 작업 대상 앞으로 걸어가 바라보며 선다 → 두 손으로 판을 내려놓는다(손은 판 가장자리에 붙어 함께 움직인다)
// → E를 몇 번 눌러 도구질(젓기·새기기·두드리기·칠하기)을 한 번씩 한다. 도구 끝이 판에 닿고, 누를 때마다 판이 조금씩 바뀐다 → 자세를 풀고 판을 다시 든다.
// 판을 다루는 동작(두 손으로 내려놓기·세우기·들기)과 도구를 쓰는 동작(한 손에 도구, 다른 손은 판을 누른다)을 나눈다.
// 역사 사실은 과정 그림 카드(출처 S8·S9)가 말하고, 몸동작은 게임에서 단순하게 꾸민 것이다(도구의 실제 모양·쓰는 법을 사실처럼 말하지 않는다).
// 서가에 꽂을 때는 1인칭으로 바뀌어 두 손과 경판, 서가의 빈자리가 보이고, 경판이 손과 함께 빈자리로 밀려 들어간다.
import * as THREE from 'three';
import { setCarry, playAction, setLook, mat, gaitPose } from '../../core/people.js';
import { walkTo, turnTo, reach } from '../../core/interact.js';

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const flatQ = new THREE.Quaternion(); // 판을 눕힌 자세(글자 면이 위)

// 자리마다 서는 곳·판을 놓는 곳·도구·누르는 횟수(장면의 작업 대상 위치: chapters/ch5/scene.js)
// 빛나는 자리(scene.stations의 spot)가 곧 서는 곳이다: 학생이 그 위에서 E를 누르면 제자리에서 돌아서서 바로 일한다(2026-10-30 선생님: 미끄러지듯 먼 데로 가지 않게)
// 글자 새기기는 大藏經을 직접 새기므로 새김칼질(n)을 하지 않는다(같은 일을 두 번 하지 않게)
export const WORK = {
  soak:    { stand: [-10.6, -0.4], put: [-10.6, 0.83, -1.7], tool: null, n: 2, verb: '판을 물에 눌러 담그기', sink: 0.12 }, // 판이 물에 반쯤 떠 있다가 눌리면 잠긴다
  boil:    { stand: [-7.6, -0.5], put: [-7.6, 1.26, -1.95], tool: 'paddle', n: 2, verb: '막대로 솥 젓기', cam: [-5.6, 2.5, 0.2] }, // 솥 서쪽의 장인에 가리지 않게 동쪽에서
  dry:     { stand: [-2.7, -3.85], put: [-2.7, 0.92, -5], up: true, tool: null, n: 1, verb: '그늘 선반에 세워 말리기' },
  carve:   { stand: [3, -3.75], put: [3, 1.0, -4.95], tool: null, n: 0, verb: '' },
  ends:    { stand: [6.0, -4.05], put: [6.0, 0.9, -5.0], tool: 'mallet', n: 2, verb: '나무망치로 마구리 박기' },
  lacquer: { stand: [8.6, -0.7], put: [8.6, 0.94, -1.95], tool: 'brush', n: 2, verb: '붓으로 옻칠하기' },
};

// 학생은 0.8배로 작게 그려지므로, 들고 있는 동안 판을 그만큼 되키워 언제나 제 크기(서가의 다른 경판과 같은 크기)로 보이게 한다
const ws = new THREE.Vector3();
export function carryPlank(player, plank) { setCarry(player, plank, 'arms'); player.updateWorldMatrix(true, false); plank.scale.setScalar(1 / player.getWorldScale(ws).x); }
function dropPlank(world, player, plank) { world.level.attach(plank); setCarry(player, null); plank.scale.setScalar(1); }

// 손에 쥐는 도구: 손에서 팔 방향(-y)으로 뻗고, len은 손에서 도구 끝까지
const TOOLS = {
  paddle: { len: 0.62, make: g => { box(g, 0.05, 0.66, 0.05, 0x7a5a3a, 0, -0.3, 0); box(g, 0.14, 0.18, 0.04, 0x7a5a3a, 0, -0.62, 0); } },
  knife:  { len: 0.24, make: g => { box(g, 0.06, 0.14, 0.06, 0x5a3f2a, 0, -0.07, 0); box(g, 0.03, 0.1, 0.012, 0x9aa0a6, 0, -0.19, 0, 'metal'); } },
  mallet: { len: 0.34, make: g => { box(g, 0.05, 0.3, 0.05, 0x7a5a3a, 0, -0.15, 0); box(g, 0.2, 0.11, 0.11, 0x5a3f2a, 0, -0.34, 0); } },
  brush:  { len: 0.3, make: g => { box(g, 0.035, 0.24, 0.035, 0x7a5a3a, 0, -0.12, 0); box(g, 0.06, 0.07, 0.03, 0x2a1a12, 0, -0.27, 0); } },
};
function box(g, w, h, d, c, x, y, z, kind = 'wood') { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, kind, 'object')); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
function holdTool(player, kind) {
  const T = TOOLS[kind], g = new THREE.Group(); g.name = 'tool'; T.make(g);
  g.position.set(0, -0.78, 0); player.userData.arms[1].add(g); // 오른손에 쥔다
  return { g, len: T.len };
}

// 대화 버튼(E)을 한 번 누를 때까지 기다린다. 학생은 제자리에 있고(이동 막힘), 버튼 위 글은 지금 할 일
export function press(ctx, label, at) {
  const { hud } = ctx;
  return new Promise(resolve => {
    hud.setPrompt(at, label); hud.setTalkEnabled(true); ctx.testHooks.pressing = label; // 테스트 봇이 누를 때를 안다(학생 화면에는 영향 없음)
    const off = ctx.onAction(() => {
      if (ctx.dialogue?.isOpen?.()) return;
      off(); hud.setPrompt(null); hud.setTalkEnabled(false); ctx.testHooks.pressing = null; resolve();
    });
  });
}

// 걸음이 잦아들 때까지 기다린다(길어야 0.6초). 멈춘 뒤 남은 몸통 비틀림·기울기를 지워 손이 겨눈 곳에 닿게 한다
const settle = (world, player) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t += dt; const u = player.userData; if ((u.stride || 0) < 0.04 || t > 0.6) { off(); u.stride = 0; gaitPose(player, 0, 0); if (u.m) { u.m.v = 0; u.m.roll = 0; u.m.lag = 0; } res(); } }); });

// 판 가장자리 두 점(세계 좌표): 판 길이 방향 양 끝 조금 안쪽
const edge = (plank, side) => plank.localToWorld(V(side * 0.42, 0, 0.08));

// 들고 있던 판을 두 손으로 옮겨 놓는다: 판이 손과 함께 to(세계 좌표, 자세 q)로 가고, 두 손은 판 가장자리를 붙든 채 따라간다
async function moveBoard(world, player, plank, to, q, dur = 0.8) {
  if (plank.parent === player.userData.upper || player.userData.carry?.obj === plank) dropPlank(world, player, plank);
  const p0 = plank.position.clone(), q0 = plank.quaternion.clone();
  await playAction(player, { dur, fadeIn: 0.12, fadeOut: 0.01, name: 'board', pose: t => {
    const e = ss(0, dur, t);
    plank.position.lerpVectors(p0, to, e); plank.quaternion.slerpQuaternions(q0, q, e);
    plank.updateMatrixWorld(true);
    const R = reach(player, [{ i: 0, at: edge(plank, -1) }, { i: 1, at: edge(plank, 1) }]);
    return { upper: [R.lean, 0, 0], arms: R.arms, head: [0.15, 0] };
  } });
}

// 판을 다시 든다: 손이 판에 닿은 자리에서 가슴 앞으로(순간이동하지 않게)
async function liftBoard(world, player, plank) {
  await playAction(player, { dur: 0.35, fadeIn: 0.12, fadeOut: 0.01, name: 'grab', pose: () => { const R = reach(player, [{ i: 0, at: edge(plank, -1) }, { i: 1, at: edge(plank, 1) }]); return { upper: [R.lean, 0, 0], arms: R.arms, head: [0.15, 0] }; } });
  plank.quaternion.copy(flatQ); carryPlank(player, plank);
}

// 도구질 한 번: 준비(도구를 든다) → 판에 닿는다(tip 경로) → 거둔다. 왼손은 판 끝을 누른다(도구가 없으면 두 손으로 판을 누른다)
function stroke(player, plank, kind, tip, { dur = 0.75, onHit, onTouch, steady = -1 } = {}) {
  const T = kind ? TOOLS[kind] : null; let hit = false, at = null;
  return playAction(player, { dur, fadeIn: 0.15, fadeOut: 0.2, name: 'work', pose: t => {
    const k = t / dur, on = ss(0.25, 0.45, k) * (1 - ss(0.75, 0.95, k)); // 닿아 있는 동안
    at = tip(k, on);
    if (!hit && k > 0.45) { hit = true; onHit?.(at); }
    if (on > 0.95) onTouch?.(at); // 닿아 있는 동안(지난 프레임 자세로) 도구 끝을 잰다
    const targets = kind === 'paddle' ? [{ i: 1, at, len: T.len }, { i: 0, at, len: T.len - 0.25 }] // 젓는 막대는 두 손으로(왼손은 조금 위를) 쥔다
      : T ? [{ i: 1, at, len: T.len }, { i: 0, at: edge(plank, steady) }] : [{ i: 0, at: edge(plank, -1).add(at) }, { i: 1, at: edge(plank, 1).add(at) }];
    const R = reach(player, targets);
    return { upper: [R.lean, 0, 0], arms: R.arms, head: [0.2, 0] };
  } });
}

// 한 자리의 일을 몸으로 한다. 끝나면 판을 든 채로 돌아온다. hook에 확인용 값을 남긴다
export async function doWork(ctx, scene, id, hook = {}, beforeLift = null) {
  const { world, hud, audio } = ctx, W = WORK[id], player = world.player, plank = scene.plank;
  const put = V(...W.put), wood = plank.children[0].material, ends = plank.getObjectByName('ends');
  ctx.testHooks.working = id;
  // 빛나는 자리 위에서 E를 눌렀으므로 남은 몇 걸음만 걸어(다리를 움직이며) 작업 대상을 바라본다
  hook.walked = Math.hypot(player.position.x - W.stand[0], player.position.z - W.stand[1]); hook.legs = 0;
  const legs = world.onUpdate(() => { hook.legs = Math.max(hook.legs, Math.abs(player.userData.legs?.[0]?.rotation.x || 0)); });
  await walkTo(world, player, W.stand, { speed: 2, accel: 0.2, face: { x: put.x, z: put.z } });
  legs();
  const face = Math.atan2(put.x - player.position.x, put.z - player.position.z);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, face + Math.PI / 2, 0)); // 판 길이 방향이 학생 앞에 가로로 놓이게
  if (W.up) q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))); // 말림 선반에는 세워 둔다
  // 일하는 모습이 잘 보이게 옆에서 비스듬히 비춘다
  // 작업 대상 너머(학생 맞은편)에서 비스듬히: 학생의 얼굴·손과 판이 함께 보이고, 둘레 사람에 가리지 않는다
  const side = V(Math.cos(face), 0, -Math.sin(face)), fwd = V(Math.sin(face), 0, Math.cos(face));
  const mid = put.clone().lerp(V(player.position.x, put.y, player.position.z), 0.4);
  const ray = new THREE.Raycaster(), solid = []; world.level.traverse(o => { if (o.isMesh && o.visible && o !== plank && !plank.getObjectById(o.id) && !player.getObjectById(o.id)) solid.push(o); });
  const blocked = c => { const d = c.clone().sub(mid), n = d.length(); ray.set(mid.clone().add(V(0, 0.3, 0)), d.normalize()); ray.far = n; return ray.intersectObjects(solid, false).length; };
  const cams = [[2.4, 1.3], [2.4, -1.3], [1.8, 2.2], [1.8, -2.2], [0.6, 2.6], [0.6, -2.6]].map(([f, sd]) => mid.clone().addScaledVector(fwd, f).addScaledVector(side, sd).add(V(0, 1.1, 0)));
  const cam = W.cam ? V(...W.cam) : cams.reduce((b, c) => (blocked(c) < blocked(b) ? c : b)); // 가리는 것이 가장 적은 자리(맞은편을 먼저 본다)
  world.setFixedCamera(cam.toArray(), mid.clone().add(V(0, 0.15, 0)).toArray());
  const seg = new THREE.Line3(cam, mid), q3 = V(0, 0, 0), hid = []; // 카메라와 일하는 곳 사이를 가리는 사람은 잠깐 숨긴다(끝나면 다시 보인다)
  const people = []; world.level.traverse(o => { if (o.userData?.legs && o.userData.arms && o !== player && o.visible) people.push(o); });
  for (const m of people) { const wp = m.getWorldPosition(V(0, 0, 0)); if (Math.hypot(wp.x - cam.x, wp.z - cam.z) > 4) continue; seg.closestPointToPoint(V(wp.x, mid.y, wp.z), true, q3); if (q3.distanceTo(V(wp.x, mid.y, wp.z)) < 0.9) { m.visible = false; hid.push(m); } }
  await moveBoard(world, player, plank, put, q, 0.6); audio?.play?.('tap');
  hook.placed = plank.position.distanceTo(put);
  if (id === 'soak' && scene.sea) { // 카메라에서 통 속 바닷물이 보이는지(통 뚜껑이 물을 덮던 오류)
    const sea = scene.sea, at = sea.getWorldPosition(V(0, 0, 0)).add(V(0, 0.03, 0)).addScaledVector(side, 0.5), d = at.clone().sub(cam);
    ray.set(cam, d.normalize()); ray.far = 50; const h = ray.intersectObjects([...solid, sea], false)[0];
    hook.waterSeen = !!h && h.object === sea; hook.submerged = false;
  }
  // 도구질: 누를 때마다 한 번
  const tool = W.tool ? holdTool(player, W.tool) : null;
  const c0 = wood.color.clone(), c1 = new THREE.Color(scene.stageColor?.(scene.plank.userData.stage + 1) ?? c0.getHex());
  hook.contact = 0; hook.strokes = 0;
  for (let n = 0; n < W.n; n++) {
    hook.strokes += 1;
    hud.setCounter(`${W.verb} ${n}/${W.n}`);
    await press(ctx, `${W.verb} (${n + 1}/${W.n})`, put);
    const f1 = (n + 1) / W.n;
    let tip;
    if (id === 'soak') tip = (k, on) => { // 두 손으로 판을 물속으로 눌렀다 놓는다(판이 손과 함께 잠긴다)
      plank.position.y = put.y - W.sink * on; plank.updateMatrixWorld(true);
      if (scene.seaTop != null && plank.position.y + 0.04 < scene.seaTop) hook.submerged = true;
      return V(0, 0, 0); };
    else if (id === 'dry') tip = (k, on) => V(0, 0.04 * on, 0); // 세운 판을 두 손으로 바로잡는다
    else if (id === 'boil') tip = k => put.clone().add(V(Math.cos(k * Math.PI * 2) * 0.24, 0.02, Math.sin(k * Math.PI * 2) * 0.24)); // 판 둘레로 솥을 젓는다
    else if (id === 'ends') { // 박을 끝 쪽으로 반 발짝 옮겨 서서(오른손이 닿게) 그 끝을 두드린다
      const sx = n % 2 ? 1 : -1, end = plank.localToWorld(V(sx * 0.62, 0, 0));
      const X = V(Math.cos(face), 0, -Math.sin(face)), F = V(Math.sin(face), 0, Math.cos(face)); // 학생의 오른쪽(오른팔 쪽)·앞
      const sc = player.getWorldScale(ws).x, at = end.clone().addScaledVector(X, 0.45 * sc).addScaledVector(F, -0.8 * sc); // 학생 크기(0.8배)에 맞춰 팔이 닿는 거리에 선다
      await walkTo(world, player, [at.x, at.z], { speed: 1, face: { x: at.x + F.x, z: at.z + F.z } });
      await settle(world, player); // 걸음을 다 멈춘 뒤에 두드린다(걷는 자세가 팔을 흔들지 않게)
      tip = (k, on) => plank.localToWorld(V(sx * 0.62, 0.02 + 0.25 * (1 - on), 0)); }
    else tip = (k, on) => plank.localToWorld(V(-0.38 + 0.76 * ss(0.25, 0.8, k), 0.06 + 0.12 * (1 - on), (id === 'carve' ? 0.05 : 0))); // 판 위를 한쪽 끝에서 다른 쪽 끝으로
    let near = Infinity;
    await stroke(player, plank, W.tool, tip, { steady: id === 'ends' ? 0 : -1, onHit: () => audio?.play?.('tap'), // 마구리를 박을 때 왼손은 판 가운데를 누른다
      onTouch: at => { if (tool) { tool.g.updateWorldMatrix(true, false); near = Math.min(near, tool.g.localToWorld(V(0, -tool.len, 0)).distanceTo(at)); } } }); // 도구 끝과 닿을 곳 사이(닿아 있는 동안 가장 가까울 때)
    if (tool) hook.contact = Math.max(hook.contact, near);
    wood.color.copy(c0).lerp(c1, f1); // 누를 때마다 판이 조금씩 바뀐다(젖고·삶기고·마르고·칠해진다)
    if (id === 'ends' && ends) { ends.visible = true; ends.children.forEach(c => { if (Math.sign(c.position.x) === (n % 2 ? 1 : -1)) c.userData.done = true; c.visible = !!c.userData.done; }); }
  }
  hud.setCounter(null);
  if (tool) tool.g.removeFromParent();
  if (ends) ends.children.forEach(c => { c.visible = true; delete c.userData.done; });
  world.camMode = 'follow'; hid.forEach(m => { m.visible = true; });
  await beforeLift?.(); // 과정 그림 카드(사실과 출처), 3번 자리에서는 판 위에 大藏經 새기기
  await liftBoard(world, player, plank); // 자세를 풀고 판을 다시 든다
  world.camMode = 'follow';
  hook.done = (hook.done || 0) + 1; ctx.testHooks.working = null;
  return hook;
}

// 1인칭으로 경판을 서가 빈자리에 꽂는다. 카메라가 학생 눈으로 옮겨 가고(머리는 숨긴다), 두 손이 경판을 세워 빈자리 앞에 댄 뒤
// E를 누르면 경판이 손과 함께 빈자리로 밀려 들어간다. 손을 놓으면 카메라가 학생 뒤로 돌아온다
export async function shelveFirstPerson(ctx, scene, hook = {}) {
  const { world, audio } = ctx, player = world.player, plank = scene.plank, H = scene.shelf, lib = scene.library;
  lib.updateMatrixWorld(true);
  const slot = lib.localToWorld(V(...H.slot)), entry = slot.clone();
  ctx.testHooks.working = 'shelf';
  await walkTo(world, player, H.stand, { speed: 1.3, face: { x: slot.x, z: slot.z } });
  entry.add(V(0, 0, 0.55));
  // 1인칭 동안은 학생을 제 크기(1배)로 그린다: 몸은 숨고 두 팔만 보이므로, 서가의 다른 경판과 같은 크기인 경판을 두 손이 알맞게 붙든다. 끝나면 되돌린다
  const scale0 = player.scale.x; player.scale.setScalar(1); player.updateMatrixWorld(true);
  // 서가에 꽂힌 다른 경판과 같은 자세: 긴 쪽이 위아래, 글자 면은 옆
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(1, 0, 0), V(0, 0, -1)));
  const qShow = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, 1), V(1, 0, 0))); // 글자 면을 학생 쪽으로 세워 든 자세
  const cam = world.camera, near0 = cam.near, head = player.userData.head;
  head.updateWorldMatrix(true, false); const eye0 = head.localToWorld(V(0, 0.5, -0.4));
  const eye = () => eye0; // 학생 눈 자리(몸을 숙여도 카메라는 그 자리에: 흔들리거나 서가 속으로 들어가지 않게) // 눈보다 조금 위·뒤: 두 손과 경판, 빈자리와 옆 경판이 함께 보인다
  // ① 시점 옮기기(0.7초): 지금 카메라 → 학생 눈. 가까운 손이 잘리지 않게 카메라 앞면을 당긴다
  const c0 = cam.position.clone(), l0 = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).multiplyScalar(5).add(c0);
  cam.near = 0.05; cam.updateProjectionMatrix();
  await new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(0.7, t + dt); const e = ss(0, 0.7, t); world.setFixedCamera(c0.clone().lerp(eye(), e).toArray(), l0.clone().lerp(entry.clone().add(V(0, -0.2, 0)), e).toArray()); if (t >= 0.7) { off(); res(); } }); });
  // 1인칭: 화면에는 학생의 두 팔(손)만 보인다(몸통·머리는 잠깐 숨긴다 — 카메라를 가리거나 뚫지 않게)
  if (player.userData.carry?.obj === plank) dropPlank(world, player, plank); // 경판은 몸과 함께 숨기지 않는다
  const armSet = new Set(); player.userData.arms.forEach(a => a.traverse(o => armSet.add(o))); plank.traverse(o => armSet.add(o));
  const hidden = []; player.traverse(o => { if (o.isMesh && o.visible && !armSet.has(o)) { o.visible = false; hidden.push(o); } });
  hook.fp = true;
  const follow = world.onUpdate(() => world.setFixedCamera(eye().toArray(), entry.clone().add(V(0, -0.2, 0)).toArray())); // 1인칭 동안 눈을 따라간다(경판과 두 손이 화면 가운데)
  // ② 경판을 세워 빈자리 앞에 댄다(두 손이 경판 양옆을 붙든다)
  let edgeOn = false; // 세워 든 동안은 양옆 가장자리, 모로 돌린 뒤에는 학생 쪽 가장자리의 두 면을 붙든다
  const grip = s => plank.localToWorld(edgeOn ? V(0.05, s * 0.07, -0.24) : V(-0.1, 0, s * 0.27));
  let measure = false; const hold = () => { plank.updateMatrixWorld(true); const R = reach(player, [{ i: 0, at: grip(-1) }, { i: 1, at: grip(1) }], { leanMin: -0.2, leanMax: 0.8 }); if (measure) { hook.gap = Math.max(hook.gap || 0, R.err); } return { upper: [R.lean, 0, 0], arms: R.arms, head: [0, 0] }; };
  const p0 = plank.position.clone(), q0 = plank.quaternion.clone();
  await playAction(player, { dur: 0.9, fadeIn: 0.15, fadeOut: 0.01, name: 'raise', pose: t => { const e = ss(0, 0.9, t); plank.position.lerpVectors(p0, entry, e); plank.quaternion.slerpQuaternions(q0, qShow, e); return hold(); } });
  measure = true; hook.gap = 0; hold(); // 세워 든 뒤부터 손이 경판에 붙어 있는지 잰다
  // ③ E를 누르면 밀어 넣는다
  await press(ctx, '경판 꽂기', entry);
  const s0 = player.position.clone(), s1 = s0.clone().add(V(slot.x - s0.x, 0, slot.z - s0.z).setLength(0.4)); // 밀면서 반 발짝 다가선다
  await playAction(player, { dur: 0.5, fadeIn: 0.01, fadeOut: 0.01, name: 'turn', pose: t => { const e = ss(0, 0.5, t); plank.quaternion.slerpQuaternions(qShow, q, e); edgeOn = e > 0.5; return hold(); } }); // 옆 경판처럼 모로 돌려
  await playAction(player, { dur: 1.0, fadeIn: 0.01, fadeOut: 0.01, name: 'push', pose: t => { const e = ss(0, 1.0, t); plank.position.lerpVectors(entry, slot, e); player.position.lerpVectors(s0, s1, e); return hold(); } }); // 빈자리로 밀어 넣는다
  lib.attach(plank); plank.position.copy(V(...H.slot)); plank.scale.setScalar(1); // 서가의 빈자리에 남는다(서가와 함께 움직이고 사라지지 않는다)
  audio?.play?.('correct');
  hook.slotErr = plank.getWorldPosition(V(0, 0, 0)).distanceTo(slot);
  // ④ 손을 놓고 잠깐 보았다가 카메라가 학생 뒤로 돌아온다
  await playAction(player, { dur: 0.6, fadeIn: 0.01, fadeOut: 0.3, name: 'release', pose: t => { const r = 1 - ss(0, 0.6, t); const h = hold(); return { upper: [h.upper[0] * r, 0, 0], arms: h.arms.map(a => a && [a[0] * r, 0, a[2] * r]) }; } });
  follow(); player.scale.setScalar(scale0); hidden.forEach(o => { o.visible = true; }); cam.near = near0; cam.updateProjectionMatrix();
  world.camMode = 'follow'; world.snapCamera?.();
  setLook(player, null); ctx.testHooks.working = null;
  return hook;
}
