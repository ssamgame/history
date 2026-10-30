// 인물 움직임(2026-10-30 선생님: 뻣뻣하고 기계적인 움직임 → 목적을 가진 사람처럼). core/motion.js(걷기·몸통·팔·머리 층)와 core/interact.js(함께 하는 행동).
import * as THREE from 'three';
import { test, eq, ok } from './harness.js';
import { makePerson, animateWalk, setCarry, setStyle, setTalking, HIP } from '../core/people.js';
import { walkTo, turnTo, handshake, giveItem, escort, strike, block, pickUp, putDown } from '../core/interact.js';
import { LOOKS } from '../content/characters.js';
import { testWorld } from './bot.js';

const run = async (w, promise, max = 400, label = '') => { let done = false, out; promise.then(r => { done = true; out = r; }); for (let i = 0; i < max && !done; i++) { w.step(1 / 30, { x: 0, z: 0 }); await null; } ok(done, `행동이 끝난다 ${label}`); return out; };
const walkAt = (p, speed, frames = 60) => { const out = { amp: 0, lean: 0, steps: 0 }; const w0 = p.userData.walk || 0; for (let i = 0; i < frames; i++) { p.position.x += speed / 30; animateWalk(p, true, 1 / 30); out.amp = Math.max(out.amp, Math.abs(p.userData.legs[0].rotation.x)); out.lean = Math.max(out.lean, p.userData.upper.rotation.x); } out.steps = (p.userData.walk - w0); return out; };

test('motion: 몸통 관절(upper)이 상체·팔·머리를 함께 움직인다(다리와 긴 옷자락은 그대로)', () => {
  const p = makePerson(LOOKS.soldier), u = p.userData;
  ok(u.upper && u.upper.position.y === HIP, '골반 높이 관절');
  ok(u.arms.every(a => a.parent === u.upper) && u.head.parent === u.upper, '팔·머리는 몸통 관절에');
  ok(u.legs.every(l => l.parent === p), '다리는 몸에');
  const h = new THREE.Vector3(); u.head.getWorldPosition(h); ok(Math.abs(h.y - 2.1 * p.scale.y) < 0.3, `머리 높이 그대로 ${h.y.toFixed(2)}`);
});

test('motion: 빠르기에 따라 보폭·걸음 박자·상체 숙임이 달라진다(걷기 < 빠른 걸음 < 달리기)', () => {
  const r = [1.3, 2.8, 5.5].map(v => { const p = makePerson(LOOKS.villager, { track: false }); p.scale.setScalar(1); walkAt(p, v, 30); return walkAt(p, v, 60); });
  ok(r[0].amp < r[2].amp, `보폭 ${r.map(x => x.amp.toFixed(2))}`);
  ok(r[0].steps < r[1].steps && r[1].steps < r[2].steps, `걸음 박자 ${r.map(x => x.steps.toFixed(1))}`);
  ok(r[2].lean > r[0].lean + 0.05, `달릴 때 더 숙인다 ${r.map(x => x.lean.toFixed(2))}`);
  // 걸음 박자는 빠르기에 맞춘다(발이 미끄러지지 않게): 걸음 수 × 보폭 ≈ 간 거리
  const p = makePerson(LOOKS.villager, { track: false }); p.scale.setScalar(1); walkAt(p, 1.6, 30); const w = walkAt(p, 1.6, 90);
  const dist = 1.6 * 3, strides = w.steps / Math.PI; ok(Math.abs(dist / strides - 0.67) < 0.25, `걸음당 ${(dist / strides).toFixed(2)}m`);
});

test('motion: 출발은 가속, 멈춤은 감속(다리·몸통이 한 번에 바뀌지 않는다)', () => {
  const p = makePerson(LOOKS.villager, { track: false }), u = p.userData;
  animateWalk(p, true, 1 / 30); const first = Math.abs(u.legs[0].rotation.x);
  for (let i = 0; i < 40; i++) { p.position.x += 1.6 / 30; animateWalk(p, true, 1 / 30); }
  ok(first < 0.15, `첫 걸음은 작게 ${first.toFixed(2)}`);
  let maxJump = 0, prev = u.legs[0].rotation.x;
  for (let i = 0; i < 40; i++) { animateWalk(p, false, 1 / 30); maxJump = Math.max(maxJump, Math.abs(u.legs[0].rotation.x - prev)); prev = u.legs[0].rotation.x; }
  ok(maxJump < 0.25, `멈출 때 한 프레임 변화 ${maxJump.toFixed(2)}`); // 30fps 한 프레임에 14도 안쪽(걸음 박자 그대로 줄어든다)
  ok(Math.abs(u.legs[0].rotation.x) < 0.05 && Math.abs(u.upper.rotation.y) < 0.05, '멈추면 바로 선다');
});

test('motion: 방향을 틀면 상체는 조금 늦게 따라오고 머리가 먼저 새 방향을 본다', () => {
  const p = makePerson(LOOKS.villager, { track: false }), u = p.userData;
  for (let i = 0; i < 20; i++) { p.position.x += 1.6 / 30; animateWalk(p, true, 1 / 30); }
  p.rotation.y += 0.8; animateWalk(p, true, 1 / 30);
  ok(u.upper.rotation.y < -0.2, `상체가 늦게 따라온다 ${u.upper.rotation.y.toFixed(2)}`);
  const headWorld = u.upper.rotation.y + u.head.rotation.y;
  for (let i = 0; i < 4; i++) animateWalk(p, true, 1 / 30);
  ok(u.upper.rotation.y + u.head.rotation.y > headWorld, '머리는 새 방향 쪽으로 먼저 돈다');
  for (let i = 0; i < 40; i++) animateWalk(p, true, 1 / 30);
  ok(Math.abs(u.upper.rotation.y) < 0.15, '곧 몸 전체가 같은 방향');
});

test('motion: 창은 걸어도·팔을 들어도 곧게 서고, 칼 찬 사람은 왼손을 칼자루에, 쥔 팔은 덜 흔든다', () => {
  const s = makePerson(LOOKS.soldier, { track: false }), sp = s.userData.spear, up = new THREE.Vector3(), q = new THREE.Quaternion();
  ok(sp, '창');
  let worst = 1;
  for (let i = 0; i < 40; i++) { s.position.x += 1.6 / 30; animateWalk(s, true, 1 / 30); sp.getWorldQuaternion(q); worst = Math.min(worst, up.set(0, 1, 0).applyQuaternion(q).y); }
  ok(worst > 0.95, `창이 곧다 ${worst.toFixed(3)}`);
  const a = s.userData.arms; ok(Math.abs(a[1].rotation.x - -0.25) < 0.2, `창 쥔 팔 ${a[1].rotation.x.toFixed(2)}`);
  const y = makePerson(LOOKS.yanggyu, { track: false });
  for (let i = 0; i < 30; i++) { y.position.x += 1.6 / 30; animateWalk(y, true, 1 / 30); }
  for (let i = 0; i < 30; i++) animateWalk(y, false, 1 / 30);
  ok(Math.abs(y.userData.arms[0].rotation.z - 0.12) < 0.05, `왼손을 칼자루에 ${y.userData.arms[0].rotation.z.toFixed(2)}`);
});

test('motion: 물건을 집으면 원래 자리에서 손으로 옮겨 오고(순간이동 없이), 놓을 때는 팔이 천천히 내려온다', () => {
  const g = new THREE.Group(), p = makePerson(LOOKS.villager, { track: false }); g.add(p);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), new THREE.MeshBasicMaterial()); box.position.set(0, 0.15, 1.2); g.add(box);
  animateWalk(p, false, 1 / 30); // 움직임 상태를 만든다
  const start = box.getWorldPosition(new THREE.Vector3());
  setCarry(p, box, 'arms');
  const after = box.getWorldPosition(new THREE.Vector3());
  ok(after.distanceTo(start) < 0.05, `집은 순간 제자리 ${after.distanceTo(start).toFixed(3)}`);
  for (let i = 0; i < 15; i++) animateWalk(p, false, 1 / 30);
  const hands = p.userData.arms.map(a => a.getObjectByName('hand').getWorldPosition(new THREE.Vector3())), at = box.getWorldPosition(new THREE.Vector3());
  ok(hands.every(h => h.distanceTo(at) < 0.6), `손 사이에 ${hands.map(h => h.distanceTo(at).toFixed(2))}`);
  setCarry(p, null); const x0 = p.userData.arms[0].rotation.x; animateWalk(p, false, 1 / 30);
  ok(Math.abs(p.userData.arms[0].rotation.x - x0) < 0.4, '팔이 한 번에 떨어지지 않는다');
  for (let i = 0; i < 30; i++) animateWalk(p, false, 1 / 30);
  ok(Math.abs(p.userData.arms[0].rotation.x) < 0.05, '팔을 내렸다');
});

test('motion: 걷는 모양 — 포로는 숙이고 손을 모으고 짧게 걷고, 무거운 짐은 보폭이 준다', () => {
  const a = makePerson(LOOKS.villager, { track: false }), b = makePerson(LOOKS.villager, { track: false });
  setStyle(b, 'captive');
  const ra = walkAt(a, 1.2, 40), rb = walkAt(b, 1.2, 40);
  ok(rb.lean > ra.lean + 0.1, `포로는 숙인다 ${ra.lean.toFixed(2)} ${rb.lean.toFixed(2)}`);
  ok(rb.amp < ra.amp, '짧은 걸음');
  ok(b.userData.arms.every(x => x.rotation.x < -0.3), '앞으로 모은 손');
  const c = makePerson(LOOKS.worker, { track: false }); setCarry(c, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5)), 'back');
  ok(walkAt(c, 1.2, 40).amp < ra.amp, '등짐은 보폭이 준다');
});

test('motion: 대화 손짓은 표정마다 다르고, 끝나면 팔을 내린다', () => {
  const p = makePerson(LOOKS.villager, { track: false }), u = p.userData, seen = {};
  for (const e of ['talk', 'worry', 'anger', 'joy']) { setTalking(p, e); for (let i = 0; i < 15; i++) animateWalk(p, false, 1 / 30); seen[e] = u.arms[1].rotation.x.toFixed(1) + u.arms[0].rotation.z.toFixed(1); }
  ok(new Set(Object.values(seen)).size >= 3, `손짓 ${JSON.stringify(seen)}`);
  setTalking(p, null); for (let i = 0; i < 40; i++) animateWalk(p, false, 1 / 30);
  ok(u.arms.every(a => Math.abs(a.rotation.x) < 0.05), '팔을 내렸다');
});

test('interact: 걸어가기는 가속·감속하고 도착하면 정한 방향으로 선다', async () => {
  const w = testWorld();
  try {
    const p = makePerson(LOOKS.villager); p.position.set(0, 0, 0); w.level.add(p);
    let maxV = 0, last = 0, firstV = null;
    const off = w.onUpdate(dt => { const d = p.position.x - last; last = p.position.x; const v = d / dt; if (firstV === null && v > 0) firstV = v; maxV = Math.max(maxV, v); });
    await run(w, walkTo(w, p, [6, 0], { speed: 1.6, face: { x: 6, z: 10 } }));
    off();
    ok(firstV < 0.6 && maxV > 1.4, `출발 ${firstV?.toFixed(2)} → ${maxV.toFixed(2)}`);
    ok(Math.abs(p.position.x - 6) < 0.01, '도착');
    ok(Math.abs(Math.atan2(Math.sin(p.rotation.y), Math.cos(p.rotation.y))) < 0.05, '정한 방향으로 선다');
  } finally { w.dispose(); }
});

test('interact: 악수 — 서로 마주 보고 다가서서 오른손이 한가운데서 만나고, 끝나면 팔을 내린다', async () => {
  const w = testWorld();
  try {
    const a = makePerson(LOOKS.seojaepil), b = makePerson(LOOKS.gentleman); a.position.set(0, 0, 0); a.rotation.y = Math.PI / 2; b.position.set(3, 0, 1); w.level.add(a, b);
    const h = await run(w, handshake(w, a, b), 600);
    ok(h.contact < 0.3, `손이 만난다 ${h.contact.toFixed(2)}`);
    for (let i = 0; i < 40; i++) w.step(1 / 30, { x: 0, z: 0 });
    ok([a, b].every(p => Math.abs(p.userData.arms[1].rotation.x) < 0.1), '팔을 내렸다');
  } finally { w.dispose(); }
});

test('interact: 건네기 — 받는 사람이 잡기 전에는 물건이 건넨 사람 손에, 넘겨받은 뒤에는 받는 사람 손에', async () => {
  const w = testWorld();
  try {
    const a = makePerson(LOOKS.commoner), b = makePerson(LOOKS.woman); a.position.set(0, 0, 0); b.position.set(2.6, 0, 0); w.level.add(a, b);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.4), new THREE.MeshBasicMaterial()); setCarry(a, box, 'arms');
    let early = false; const off = w.onUpdate(() => { if (b.userData.carry && !b.userData.carry.obj) early = true; if (box.parent === b.userData.upper && a.userData.act) early = true; });
    const h = await run(w, giveItem(w, a, b, box), 600); off();
    ok(!early, '받기 전에 넘어가지 않는다');
    ok(h.handed && box.parent === b.userData.upper && !a.userData.carry, '넘겨받았다');
    ok(h.gap < 0.6, `넘겨받는 순간 손과 물건 ${h.gap.toFixed(2)}`);
  } finally { w.dispose(); }
});

test('interact: 포로 호송 — 같은 빠르기로 대열을 지키고 서로 부딪히지 않으며, 포로·호송병 걸음이 다르다', async () => {
  const w = testWorld();
  try {
    const caps = [0, 1].map(i => { const p = makePerson(LOOKS.villager); p.position.set(0, 0, i * 0.9); p.rotation.y = Math.PI / 2; w.level.add(p); return p; });
    const gd = makePerson(LOOKS.khitan); gd.position.set(-1.6, 0, 0.4); gd.rotation.y = Math.PI / 2; w.level.add(gd);
    const h = await run(w, escort(w, { captives: caps, guards: [gd], path: [[4, 0], [6, -3]] }), 900);
    ok(h.done && h.minGap > 1.0, `간격 ${h.minGap.toFixed(2)}`);
    eq(caps[0].userData.style, 'captive'); eq(gd.userData.style, 'guard');
  } finally { w.dispose(); }
});

test('interact: 찌르기·막기·밀기는 준비 → 실행 → 회복으로 돌아오고, 집기·내려놓기는 물건이 떠 있지 않다', async () => {
  const w = testWorld();
  try {
    const s = makePerson(LOOKS.soldier); w.level.add(s);
    let minArm = 0; const off = w.onUpdate(() => { minArm = Math.min(minArm, s.userData.arms[1].rotation.x); });
    await run(w, strike(s, 'spear'), 400, 'strike'); off();
    ok(minArm < -1.0, `앞으로 찌른다 ${minArm.toFixed(2)}`);
    for (let i = 0; i < 40; i++) w.step(1 / 30, { x: 0, z: 0 });
    ok(Math.abs(s.userData.arms[1].rotation.x - -0.25) < 0.25, '창 쥔 자세로 돌아온다');
    await run(w, block(s), 400, 'block');
    const p = makePerson(LOOKS.worker); w.level.add(p);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), new THREE.MeshBasicMaterial()); box.position.set(0, 0.2, 1.3); w.level.add(box);
    const place = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1), new THREE.MeshBasicMaterial()); place.position.set(3, 0.3, 1.3); w.level.add(place);
    await run(w, pickUp(w, p, box, { from: [0, 0.4] }), 400, 'pickUp');
    ok(p.userData.carry?.obj === box, '집었다');
    await run(w, putDown(w, p, place, { at: [2.0, 1.3] }), 600, 'putDown');
    const bb = new THREE.Box3().setFromObject(box), pb = new THREE.Box3().setFromObject(place);
    ok(Math.abs(bb.min.y - pb.max.y) < 0.02, `놓을 곳 위에 앉는다 ${(bb.min.y - pb.max.y).toFixed(3)}`);
  } finally { w.dispose(); }
});

// 2026-10-30 선생님: 학생 캐릭터가 움직일 때 폴짝폴짝 뛰는 느낌 → 빠르게 움직여도 몸은 거의 오르내리지 않는다
test('motion: 학생 빠르기(6.5m/s)로 움직여도 몸이 폴짝거리지 않는다(들썩임 4cm 안쪽, 한 걸음 1.1m 이상)', () => {
  const p = makePerson(LOOKS.soldier, { track: false }); p.scale.setScalar(1);
  for (let i = 0; i < 30; i++) { p.position.x += 6.5 / 30; animateWalk(p, true, 1 / 30); }
  let lo = Infinity, hi = -Infinity; const w0 = p.userData.walk;
  for (let i = 0; i < 60; i++) { p.position.x += 6.5 / 30; animateWalk(p, true, 1 / 30); lo = Math.min(lo, p.position.y); hi = Math.max(hi, p.position.y); }
  ok(hi - lo < 0.04, `들썩임 ${(hi - lo).toFixed(3)}m`);
  const strides = (p.userData.walk - w0) / Math.PI; ok(13 / strides > 1.1, `한 걸음 ${(13 / strides).toFixed(2)}m`);
});

// 2026-10-30 선생님(종종걸음): 걸음 박자는 실제로 간 거리에서 나온다. 느리게 가는 사람도 다리만 바쁘게 움직이지 않고, 한 걸음이 다리 벌린 폭만큼 나아간다(발이 미끄러지지 않게)
const LEGLEN = 0.55;
test('motion: 느린 걸음·보통·빠른 걸음 모두 한 걸음에 간 거리 ≈ 다리를 벌린 폭(종종걸음·미끄럼 없음)', () => {
  for (const v of [0.6, 0.9, 1.4, 2.2]) {
    const p = makePerson(LOOKS.villager, { track: false }); p.scale.setScalar(1); walkAt(p, v, 45); const w = walkAt(p, v, 90);
    const per = v * 3 / (w.steps / Math.PI), span = 2 * LEGLEN * Math.sin(w.amp);
    ok(per / span > 0.8 && per / span < 1.25, `${v}m/s: 한 걸음 ${per.toFixed(2)}m, 다리 폭 ${span.toFixed(2)}m`);
    ok(w.steps / Math.PI / 3 < (v > 2 ? 3.1 : 2.4), `${v}m/s: 1초에 ${(w.steps / Math.PI / 3).toFixed(2)}걸음`);
  }
});

test('motion: 제자리에 선 사람은 moving이어도 발만 계속 움직이지 않는다', () => {
  const p = makePerson(LOOKS.villager, { track: false }); p.scale.setScalar(1); walkAt(p, 1.4, 30);
  for (let i = 0; i < 45; i++) animateWalk(p, true, 1 / 30);
  ok(Math.abs(p.userData.legs[0].rotation.x) < 0.06, `다리 ${p.userData.legs[0].rotation.x.toFixed(2)}`);
});

// 2026-10-30 선생님: 말 걸음(평보·속보·구보)은 빠르기에 맞고, 발굽이 미끄러지거나 땅에 박히거나 뜨지 않으며, 기수는 안장 위에 붙어 함께 흔들린다
test('horse: 빠르기에 따라 평보·속보·구보, 디딘 발굽은 미끄러지지 않고 땅 위에, 기수는 안장에', async () => {
  const { makeHorse, mount, animateHorse } = await import('../core/horse.js');
  const scene = new THREE.Scene();
  for (const [v, want] of [[1.4, 'walk'], [3.5, 'trot'], [6.2, 'canter']]) {
    const h = makeHorse(), r = makePerson(LOOKS.mongol); mount(h, r); h.rotation.y = Math.PI / 2; scene.add(h); // +x 쪽을 보고 +x로 간다
    const hoofs = h.userData.legs.map(l => l.userData.knee.children[1]), wp = new THREE.Vector3(), seat = new THREE.Vector3();
    for (let i = 0; i < 90; i++) { h.position.x += v / 30; h.updateMatrixWorld(true); animateHorse(h, 1 / 30); }
    eq(h.userData.gaitName, want, `${v}m/s`);
    let slip = 0, travel = 0, lo = Infinity, hi = -Infinity, prev = null, s0 = null, sd = 0;
    for (let i = 0; i < 90; i++) {
      h.position.x += v / 30; h.updateMatrixWorld(true); animateHorse(h, 1 / 30); h.updateMatrixWorld(true);
      const ys = hoofs.map(f => { f.getWorldPosition(wp); return { y: wp.y - 0.04 * h.scale.y, x: wp.x }; }), low = ys.reduce((a, b) => (a.y < b.y ? a : b));
      lo = Math.min(lo, low.y); hi = Math.max(hi, low.y);
      if (prev && prev.i === ys.indexOf(low) && low.y < 0.02 && prev.y < 0.02) { slip += Math.abs(low.x - prev.x); travel += v / 30; } // 땅에 디딘 발굽만(속보·구보는 네 발이 다 뜬 순간이 있다)
      prev = { x: low.x, y: low.y, i: ys.indexOf(low) };
      r.getWorldPosition(seat); h.userData.body.updateMatrixWorld(); const local = h.userData.body.worldToLocal(seat.clone()); if (!s0) s0 = local.clone(); sd = Math.max(sd, local.distanceTo(s0));
    }
    ok(travel > v * 0.8 && slip < travel * 0.3, `${v}m/s 발굽 미끄럼 ${slip.toFixed(2)} / 간 거리 ${travel.toFixed(2)}`);
    ok(lo > -0.05 && hi < 0.08, `${v}m/s 가장 낮은 발굽 높이 ${lo.toFixed(3)}~${hi.toFixed(3)}`);
    ok(sd < 0.01, `기수는 안장에서 움직이지 않는다 ${sd.toFixed(3)}`);
    scene.remove(h);
  }
  const h = makeHorse(); scene.add(h); for (let i = 0; i < 30; i++) { h.position.x += 0.05; animateHorse(h, 1 / 30); }
  for (let i = 0; i < 60; i++) animateHorse(h, 1 / 30);
  eq(h.userData.gaitName, 'stand'); ok(h.userData.legs.every(l => Math.abs(l.rotation.x) < 0.05), '서면 다리를 모은다');
});

// 2026-10-30 선생님(긴급): 말에 탄 사람의 몸이 투명하게 보이던 오류. 긴 옷(델·단령·장삼)의 몸통을 숨겨 가슴이 비었다.
// 서 있을 때·걸을 때·달릴 때·돌 때, 앞·옆·뒤에서 허리·배·가슴 높이로 쏜 빛이 모두 기수 몸에 맞아야 한다(뚫린 곳 없음)
test('horse: 말 탄 사람의 몸통이 비어 보이지 않는다(델·단령·장삼·갑옷·저고리, 서기·걷기·달리기·돌기)', async () => {
  const { makeHorse, mount, animateHorse } = await import('../core/horse.js');
  const scene = new THREE.Scene(), inv = new THREE.Matrix4(), M = new THREE.Matrix4(), box = new THREE.Box3(), p = new THREE.Vector3(), miss = [];
  // 몸통 자리(사람 좌표): 허리·배·가슴 높이마다 가운데와 좌우·앞뒤. 이 점마다 보이는 기수 조각이 하나는 감싸야 한다(빈 곳이 없다)
  const pts = []; for (const y of [0.75, 1.05, 1.35, 1.6]) for (const [x, z] of [[0, 0], [0.22, 0], [-0.22, 0], [0, 0.2], [0, -0.2]]) pts.push([x, y, z]);
  const covered = r => {
    r.updateWorldMatrix(true, true); inv.copy(r.matrixWorld).invert();
    const boxes = []; r.traverse(m => { if (!m.isMesh || m.name === 'face') return; let n = m; while (n && n !== r) { if (!n.visible) return; n = n.parent; } if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); boxes.push(box.copy(m.geometry.boundingBox).applyMatrix4(M.multiplyMatrices(inv, m.matrixWorld)).clone()); });
    return pts.filter(q => !boxes.some(b => b.containsPoint(p.set(...q))));
  };
  for (const id of ['mongol', 'mongolArcher', 'mongolLancer', 'mongolGeneral', 'khitan', 'sonn', 'yanggyu', 'soldier', 'minister', 'monk', 'villager', 'sambyeolcho']) {
    if (!LOOKS[id]) continue;
    const h = makeHorse(), r = makePerson(LOOKS[id]); mount(h, r); scene.add(h); h.rotation.y = 0.4;
    for (const [v, frames, turn] of [[0, 5, 0], [1.4, 30, 0], [6, 30, 0], [2, 20, 0.05], [0, 40, 0]]) {
      for (let i = 0; i < frames; i++) { h.rotation.y += turn; h.position.x += Math.sin(h.rotation.y) * v / 30; h.position.z += Math.cos(h.rotation.y) * v / 30; h.updateMatrixWorld(true); animateHorse(h, 1 / 30); }
      const hole = covered(r); if (hole.length) miss.push(`${id} ${v}m/s 빈 곳 ${hole.map(q => q.join('/')).join(' ')}`);
    }
    scene.remove(h);
  }
  ok(miss.length === 0, `몸통이 비어 보이는 곳: ${miss.slice(0, 6).join(' | ')}`);
  // 같은 기수를 말에서 내리지 않은 보통 사람과 비교: 걸어 다니는 사람은 그대로(긴 옷을 숨기지 않는다)
  const walker = makePerson(LOOKS.mongol); ok(walker.children.some(c => c.name === 'robe' && c.visible), '걷는 사람의 긴 옷은 그대로');
});

// 2026-10-30 점검(자동 플레이): 깃발을 든 군중(일제 2장·현대 1·6장)의 빈 팔이 NaN이 되어 굳힌 조각에서 사라지던 오류
test('motion: 걷기 전에 물건을 들려도(깃발·짐) 팔·몸 각도가 모두 숫자다', async () => {
  const { holdFlag } = await import('../chapters/kit/town.js');
  for (const style of ['flag', 'arms', 'side', 'shoulder', 'back']) {
    const p = makePerson(LOOKS.commoner);
    if (style === 'flag') holdFlag(p); else setCarry(p, new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3)), style);
    p.updateMatrixWorld(true);
    let bad = 0; p.traverse(o => { if (o.matrixWorld.elements.some(Number.isNaN)) bad += 1; });
    eq(bad, 0, `${style}: NaN인 조각`);
  }
});
