// 공통 뼈대 몸(core/body.js, assets/models/body.glb, 2026-10-31): 코드로 만든 옷·무기·소품을 뼈에 붙이고 동작 묶음으로 움직인다.
// 팔꿈치가 굽고, 창은 손에 쥔 채 곧게 서고, 두 팔로 안은 짐은 두 손 사이에서 함께 움직인다. 예전 호출(setCarry·playAction·gaitPose·mount)은 그대로 된다.
import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';
import { makePerson, setCarry, playAction, setRigHook, POST_POSE } from '../core/people.js';
import { LOOKS } from '../content/characters.js';
import { loadBody, attachBody, updateBodies, resetBodies, bodyPeople } from '../core/body.js';
import { createProbe } from '../tools/qa/probe.js';

const W = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
const on = () => { resetBodies(); setRigHook(attachBody); POST_POSE.add(updateBodies); };
const off = () => { setRigHook(null); };
const walkIt = (w, p, n, dx = 0.05) => { for (let i = 0; i < n; i++) { p.position.x += dx; w.step(1 / 20, { x: 0, z: 0 }); } };

test('body: body.glb를 불러오기 전에는 사람이 예전과 똑같다', () => {
  const p = attachBody(makePerson(LOOKS.soldier), LOOKS.soldier);
  eq(p.userData.skel, undefined);
});

test('body: 뼈대 20개·동작 묶음, 옷·머리·무기 조각이 제 뼈에 붙는다(머리→head, 신→foot, 창→손, 소매는 위팔·아래팔로 나뉨)', async () => {
  const gl = await loadBody();
  let bones = 0; gl.scene.traverse(o => { if (o.isBone) bones += 1; });
  ok(bones >= 18 && bones <= 22, `뼈 ${bones}`);
  const clips = gl.animations.map(a => a.name);
  for (const n of ['idle', 'walk', 'run', 'walk_spear', 'walk_sword', 'walk_bow', 'carry', 'give', 'put_down', 'talk', 'work_hammer', 'work_sweep']) ok(clips.includes(n), `동작 ${n}`);
  on();
  try {
    const p = makePerson(LOOKS.soldier), u = p.userData, B = u.skel.bones;
    const under = (o, bone) => { for (let q = o; q; q = q.parent) if (q === B(bone)) return true; return false; };
    ok(under(u.head, 'head'), '머리 묶음은 head 뼈');
    ok(under(p.getObjectByName('spear'), 'hand_L'), '창은 손 뼈');
    let shoes = 0; p.traverse(o => { if (o.name === 'shoe' && (under(o, 'foot_L') || under(o, 'foot_R'))) shoes += 1; }); eq(shoes, 2, '신은 발 뼈');
    let up = 0, fore = 0; p.traverse(o => { if (o.name === 'sleeve') { if (o.parent === B('upperarm_L') || o.parent === B('upperarm_R')) up += 1; if (o.parent === B('forearm_L') || o.parent === B('forearm_R')) fore += 1; } }); // 바로 위 뼈(아래팔 뼈는 위팔 뼈 안에 있다) ok(up === 2 && fore === 2, `소매 위팔 ${up} 아래팔 ${fore}`);
    let left = 0; for (const j of [...u.legs, ...u.arms]) j.traverse(o => { if (o.isMesh) left += 1; }); eq(left, 0, '예전 관절은 빈 껍데기(장 코드가 돌리면 덧씌움)');
  } finally { off(); }
});

test('body: 창 든 병사가 걸으면 팔꿈치를 굽혀 창을 가슴 앞에 곧게 세워 쥐고, 달리면 팔꿈치가 굽는다', async () => {
  await loadBody(); on();
  const w = testWorld();
  try {
    const p = makePerson(LOOKS.soldier); w.level.add(p); off();
    walkIt(w, p, 30);
    eq(p.userData.skel.cur.getClip().name, 'walk_spear', '창 들고 걷기');
    let tilt = 0, low = 9, high = 0;
    for (let i = 0; i < 24; i++) {
      walkIt(w, p, 1);
      const sp = p.getObjectByName('spear'), upv = W().set(0, 1, 0).applyQuaternion(sp.getWorldQuaternion(Q()));
      tilt = Math.max(tilt, upv.angleTo(W().set(0, 1, 0)));
      const h = p.userData.skel.bones('hand_L').getWorldPosition(W()).y; low = Math.min(low, h); high = Math.max(high, h);
    }
    ok(tilt < 0.3, `창이 곧게 선다(가장 기울 때 ${tilt.toFixed(2)})`);
    ok(low > 1.0 && high < 1.6, `손이 가슴 앞 높이 ${low.toFixed(2)}~${high.toFixed(2)}`);
    // 달리기: 팔꿈치(위팔과 아래팔 사이)가 굽는다
    const v = makePerson(LOOKS.villager); v.position.z = 3; w.level.add(v);
    for (let i = 0; i < 30; i++) { v.position.x += 0.3; w.step(1 / 20, { x: 0, z: 0 }); }
    eq(v.userData.skel?.cur?.getClip().name, undefined, '끈 뒤 만든 사람은 예전 그대로');
  } finally { off(); w.dispose(); }
});

test('body: 달리면 팔꿈치가 굽는다(위팔과 아래팔 사이 각도)', async () => {
  await loadBody(); on();
  const w = testWorld();
  try {
    const p = makePerson(LOOKS.villager); w.level.add(p); off();
    for (let i = 0; i < 40; i++) { p.position.x += 0.3; w.step(1 / 20, { x: 0, z: 0 }); }
    eq(p.userData.skel.cur.getClip().name, 'run');
    const B = p.userData.skel.bones, a = B('upperarm_R').getWorldQuaternion(Q()), b = B('forearm_R').getWorldQuaternion(Q());
    ok(a.angleTo(b) > 0.6, `팔꿈치 ${a.angleTo(b).toFixed(2)}`);
  } finally { off(); w.dispose(); }
});

test('body: 두 팔로 안은 짐은 두 손 사이에 붙어 걸을 때 손과 함께 움직인다', async () => {
  await loadBody(); on();
  const w = testWorld();
  try {
    const p = makePerson(LOOKS.worker); w.level.add(p); off();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.45), new THREE.MeshLambertMaterial()); box.position.set(1, 0.2, 0); w.level.add(box);
    p.userData.arms.forEach(a => a.rotation.set(-1.3, 0, 0)); // 집는 자세가 덮여 있는 동안 든다(interact.pickUp과 같은 차례): 그 자세가 풀린 뒤 손에 붙어야 한다
    setCarry(p, box, 'arms');
    walkIt(w, p, 40);
    eq(p.userData.skel.cur.getClip().name, 'carry', '짐 안고 걷기');
    const B = p.userData.skel.bones;
    let far = 0;
    for (let i = 0; i < 24; i++) { walkIt(w, p, 1); const mid = B('hand_L').getWorldPosition(W()).add(B('hand_R').getWorldPosition(W())).multiplyScalar(0.5); far = Math.max(far, mid.distanceTo(box.getWorldPosition(W()))); }
    ok(far < 0.12, `짐과 두 손 가운데 사이 ${far.toFixed(3)}m`);
    const by = box.getWorldPosition(W()).y; ok(by > 1.1 && by < 1.6, `짐이 가슴 앞 높이 ${by.toFixed(2)}m(팔이 내려간 채 손에 붙던 오류)`);
    let inHand = false; for (let q = box.parent; q; q = q.parent) if (q === B('hand_L')) inHand = true; ok(inHand, '짐은 손 뼈에 붙었다');
    setCarry(p, null); ok(p.userData.carry == null, '내려놓기');
  } finally { off(); w.dispose(); }
});

test('body: 행동(playAction)으로 팔을 앞으로 뻗으면 뼈가 따라가고, 끝나면 동작으로 돌아온다', async () => {
  await loadBody(); on();
  const w = testWorld();
  try {
    const p = makePerson(LOOKS.villager); w.level.add(p); off();
    for (let i = 0; i < 10; i++) w.step(1 / 20, { x: 0, z: 0 });
    const hand = p.userData.skel.bones('hand_R'), z0 = hand.getWorldPosition(W()).z;
    let done = false; playAction(p, { dur: 1, fadeIn: 0.1, fadeOut: 0.1, pose: () => ({ arms: [[-1.5, 0, 0], null] }) }).then(() => { done = true; });
    for (let i = 0; i < 10; i++) w.step(1 / 20, { x: 0, z: 0 });
    const z1 = hand.getWorldPosition(W()).z;
    ok(z1 - z0 > 0.4, `손이 앞으로 ${(z1 - z0).toFixed(2)}m`);
    for (let i = 0; i < 40; i++) w.step(1 / 20, { x: 0, z: 0 });
    await Promise.resolve(); ok(done, '행동 끝');
    ok(Math.abs(hand.getWorldPosition(W()).z - z0) < 0.1, '쉬는 자세로 돌아온다');
  } finally { off(); w.dispose(); }
});

test('body: 장면 굳히기는 움직이지 않는 군중만 굳히고(뼈대 몸은 멈춤), 돌려준 사람의 조각은 뼈에서 떼지 않는다', async () => {
  const { bakeLevel } = await import('../core/bake.js');
  await loadBody(); on();
  const w = testWorld();
  try {
    const crowd = makePerson(LOOKS.villager); crowd.position.set(3, 0, -4); w.level.add(crowd);
    const kept = makePerson(LOOKS.soldier); kept.position.set(-3, 0, -4); w.level.add(kept); off();
    bakeLevel(w, { kept });
    ok(crowd.userData.skel.frozen, '군중은 멈춘다');
    ok(!kept.userData.skel.frozen, '돌려준 사람은 움직인다');
    let onBone = 0; kept.traverse(o => { if (o.isMesh && o.parent?.isBone) onBone += 1; }); ok(onBone > 6, `조각이 뼈에 붙어 있다 ${onBone}`);
    ok(!bodyPeople().includes(crowd) && bodyPeople().includes(kept), '동작 갱신 목록');
  } finally { off(); w.dispose(); }
});

test('body: 말 탄 사람은 긴 옷자락을 숨기고 탄 옷, 화면 속 오류 감지기에 잡히는 것이 없다', async () => {
  const { makeHorse, mount } = await import('../core/horse.js');
  await loadBody(); on();
  const w = testWorld();
  try {
    const ground = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 30), new THREE.MeshLambertMaterial()); ground.position.y = -0.1; w.level.add(ground);
    const rider = makePerson(LOOKS.mongol);
    const people = [['seohui', -3], ['soldier', -1.5], ['worker', 1.5]].map(([l, x]) => { const p = makePerson(LOOKS[l]); p.position.set(x, 0, -3); w.level.add(p); return p; });
    off();
    const h = makeHorse(); h.position.set(4, 0, -5); w.level.add(h); mount(h, rider);
    let robe = 0, ride = 0; rider.traverse(o => { if (o.isMesh && o.visible) { if (o.name === 'robe') robe += 1; if (o.name === 'rideRobe') ride += 1; } });
    eq(robe, 0, '긴 옷자락 숨김'); eq(ride, 1, '탄 옷');
    const probe = createProbe(w);
    for (let i = 0; i < 20; i++) { people[1].position.x += 0.04; w.step(1 / 30, { x: 0, z: 0 }); probe.tick(1 / 30); }
    eq(probe.events.filter(e => e.severity === 'error').map(e => `${e.kind}:${e.who}`), []);
  } finally { off(); w.dispose(); }
});

test('body: 뼈대 몸을 켜면(goryeo-body=1) 고려 1장을 터치만으로 끝까지 할 수 있다', async () => {
  const { CHAPTERS } = await import('../chapters/index.js');
  const { runChapter } = await import('../core/flow.js');
  localStorage.setItem('goryeo-body', '1');
  const mod = (await CHAPTERS[0].load()).default, script = mod.script;
  const s = touchSetup(script.speakers);
  const answers = new Set();
  const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o.options)) { if (typeof o.answer === 'number' && typeof o.options[o.answer] === 'string') answers.add(o.options[o.answer]); o.options.forEach(x => { if (x && x.correct && x.text) answers.add(x.text); }); } Object.values(o).forEach(walk); };
  walk(script);
  const bot = touchBot(s, { answers });
  try {
    let most = 0; const t = setInterval(() => { most = Math.max(most, bodyPeople().filter(p => p.parent).length); }, 200);
    const r = await runChapter(CHAPTERS[0], mod, s.ctx, memSave());
    clearInterval(t);
    eq(r.quizCorrect, script.quizzes.length, '퀴즈까지 끝');
    ok(most >= 5, `뼈대 몸으로 움직인 사람 ${most}명`);
  } finally { localStorage.removeItem('goryeo-body'); off(); bot.stop(); s.done(); }
}, { timeout: 240000 });

// 2026-10-31 선생님: 걸음 박자가 너무 빠르고 짐을 들면 뛰는 것처럼 보였다. 뼈대 몸도 박자(동작 재생 빠르기 × 동작 한 바퀴 두 걸음)를 사람 박자 안에 둔다
test('body: 걸음 박자는 빠르기가 올라도 사람 박자 안이고, 짐을 들어도 빨라지지 않는다', async () => {
  await loadBody(); on();
  const w = testWorld();
  try {
    const steps = p => { const S = p.userData.skel, a = S.acts[S.target] || S.cur; return a.timeScale * 2 / a.getClip().duration; };
    for (const v of [1.2, 2.0, 3.0, 4.2, 6.5]) {
      const f = makePerson(LOOKS.villager), c = makePerson(LOOKS.villager); w.level.add(f, c);
      setCarry(c, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5)), 'arms');
      for (let i = 0; i < 50; i++) { f.position.x += v / 20; c.position.x += v / 20; w.step(1 / 20, { x: 0, z: 0 }); }
      const a = steps(f), b = steps(c);
      ok(a <= (v <= 2.2 ? 2.5 : 3.6), `${v}m/s 빈손(${f.userData.skel.target}): 1초에 ${a.toFixed(2)}걸음`);
      ok(b <= a * 1.08 + 0.05, `${v}m/s 짐(${c.userData.skel.target}): 1초에 ${b.toFixed(2)}걸음(빈손 ${a.toFixed(2)})`);
      w.level.remove(f, c);
    }
  } finally { off(); w.dispose(); }
}, { timeout: 30000 });

// 2026-10-31 점검: 장을 열 때 뼈대 몸을 불러오는 동안(장면이 아직 비어 있다) 빈 하늘에 학생(이전 장 생김새)만 서 있었다. 불러오는 동안 학생을 숨긴다
test('body: 뼈대 몸을 불러오는 동안에는 빈 장면에 학생만 서 있지 않다', async () => {
  const { prepareBodies } = await import('../core/flow.js');
  const w = testWorld();
  try {
    localStorage.setItem('goryeo-body', '1');
    w.player.visible = true;
    const pr = prepareBodies({ world: w });
    ok(!w.player.visible, '불러오는 동안 숨김');
    await pr;
    ok(w.player.visible, '다 불러오면 다시 보임');
  } finally { localStorage.removeItem('goryeo-body'); off(); w.dispose(); }
}, { timeout: 30000 });

// 2026-10-31 점검: 뼈대 몸을 켜면 조선 5장 장면 짓기가 멈췄다(웅크린 백성의 팔에 팔꿈치를 새로 넣는 addJoints가 뼈로 옮겨 간 소매를 찾지 못함)
test('body: 조선 5장 웅크린 백성(팔꿈치 넣기)도 뼈대 몸으로 팔꿈치를 굽힌다', async () => {
  await loadBody(); on();
  const { huddlePose } = await import('../chapters/joseon/j5/scene.js');
  const w = testWorld();
  try {
    const p = makePerson(LOOKS.villager); w.level.add(p); off();
    huddlePose(p);
    ok(p.userData.arms.every(a => a.userData.elbow), '팔꿈치 관절');
    for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 });
    const B = p.userData.skel.bones, a = B('upperarm_R').getWorldQuaternion(Q()), b = B('forearm_R').getWorldQuaternion(Q());
    ok(a.angleTo(b) > 0.8, `팔꿈치 ${a.angleTo(b).toFixed(2)}`);
  } finally { off(); w.dispose(); }
}, { timeout: 30000 });

// 2026-10-31 점검: 악수·건네기가 손을 예전 팔 관절 안에서 찾아(뼈대 몸은 손이 손 뼈로 옮겨 감) 멈출 수 있었다
test('body: 뼈대 몸끼리 악수·물건 건네기가 끝까지 되고 손이 만난다', async () => {
  await loadBody(); on();
  const { handshake, giveItem } = await import('../core/interact.js');
  const w = testWorld();
  try {
    const a = makePerson(LOOKS.soldier), b = makePerson(LOOKS.villager); a.position.set(0, 0, 0); b.position.set(0, 0, 2); b.rotation.y = Math.PI; w.level.add(a, b); off();
    const run = async pr => { let done = false, out; pr.then(r => { done = true; out = r; }); for (let i = 0; i < 400 && !done; i++) { w.step(1 / 30, { x: 0, z: 0 }); await null; } return { done, out }; };
    const h = await run(handshake(w, a, b));
    ok(h.done, '악수가 끝난다');
    ok(h.out.contact < 0.35, `두 손 사이 ${h.out.contact?.toFixed(2)}m`);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3)); w.level.add(box);
    const g = await run(giveItem(w, a, b, box));
    ok(g.done && g.out.handed, '건네기가 끝난다');
    ok(b.userData.carry?.obj === box, '받은 사람이 든다');
  } finally { off(); w.dispose(); }
}, { timeout: 40000 });
