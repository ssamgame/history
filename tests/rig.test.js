// 블렌더 몸 시험(core/rigged.js, 2026-10-31): 긴 옷 인물의 몸통 조각을 뼈대 있는 몸(assets/models/person.glb)으로 바꿔도
// 사람의 관절·머리·무기는 그대로이고(지금의 움직임 코드가 그대로 움직인다), 뼈가 관절을 따라가며, 고려 1장을 끝까지 할 수 있다.
import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';
import { makePerson, gaitPose } from '../core/people.js';
import { LOOKS } from '../content/characters.js';
import { loadRig, enableRig, riggedPeople } from '../core/rigged.js';
import { createProbe } from '../tools/qa/probe.js';

const shownMesh = (root, name) => { let n = 0; root.traverse(o => { if (o.isMesh && o.name === name) { let v = true; for (let q = o; q; q = q.parent) if (!q.visible) v = false; if (v) n += 1; } }); return n; };

test('rig: 긴 옷 인물은 뼈대 몸이 되고, 관절·머리·무기는 그대로다. 짧은 옷(저고리·바지)은 바꾸지 않는다', async () => {
  await loadRig();
  const w = testWorld();
  try {
    enableRig(true);
    const seohui = makePerson(LOOKS.seohui), khitan = makePerson(LOOKS.khitan), villager = makePerson(LOOKS.villager);
    enableRig(false);
    for (const p of [seohui, khitan]) {
      const u = p.userData;
      ok(u.rig && p.getObjectByName('rigBody'), '뼈대 몸이 들어 있다');
      ok(u.legs.length === 2 && u.arms.length === 2 && u.upper && u.head, '관절은 그대로(움직임 코드가 쓴다)');
      eq(shownMesh(p, 'robe'), 0, '네모난 긴 옷은 숨긴다'); eq(shownMesh(p, 'shoe'), 0, '네모난 신은 숨긴다');
      let face = 0; u.head.traverse(o => { if (o.isMesh && o.visible) face += 1; }); ok(face > 2, '얼굴·머리는 보인다');
    }
    const spear = khitan.userData.arms[1].getObjectByName('spear'); let sv = 0; spear.traverse(o => { if (o.isMesh && o.visible) sv += 1; }); ok(sv > 0, '창은 보인다');
    ok(!villager.userData.rig, '짧은 옷은 그대로'); ok(shownMesh(villager, 'shoe') === 2, '짧은 옷 인물의 신은 보인다');
    eq(makePerson(LOOKS.seohui).userData.rig, undefined, '끄면 지금과 똑같다');
  } finally { enableRig(false); w.dispose(); }
});

test('rig: 뼈가 관절을 따라간다(다리를 앞으로 들면 허벅지 뼈도, 팔을 들면 팔 뼈도)', async () => {
  await loadRig();
  const w = testWorld();
  try {
    enableRig(true);
    const p = makePerson(LOOKS.seohui); w.level.add(p);
    const thigh = p.getObjectByName('thigh_L'), upperarm = p.getObjectByName('upperarm_R');
    w.step(1 / 30, { x: 0, z: 0 });
    const t0 = thigh.getWorldQuaternion(new THREE.Quaternion()), a0 = upperarm.getWorldQuaternion(new THREE.Quaternion());
    p.userData.legs[1].rotation.x = -0.5; p.userData.arms[0].rotation.x = -1.2; // 왼다리를 앞으로, 오른팔을 앞으로 든다
    w.step(0, { x: 0, z: 0 }); // 걸음 코드가 다시 덮지 않게 시간은 흐르지 않고 뼈만 맞춘다
    const t1 = thigh.getWorldQuaternion(new THREE.Quaternion()), a1 = upperarm.getWorldQuaternion(new THREE.Quaternion());
    const ang = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a.dot(b))));
    ok(Math.abs(ang(t0, t1) - 0.5) < 0.05, `허벅지 뼈가 관절만큼 돈다 ${ang(t0, t1).toFixed(3)}`);
    ok(Math.abs(ang(a0, a1) - 1.2) < 0.05, `팔 뼈가 관절만큼 돈다 ${ang(a0, a1).toFixed(3)}`);
    // 발끝(발 뼈)이 앞(+z)으로 나간다
    const foot = p.getObjectByName('foot_L').getWorldPosition(new THREE.Vector3());
    ok(foot.z > 0.15, `왼발이 앞으로 ${foot.z.toFixed(2)}`);
  } finally { enableRig(false); w.dispose(); }
});

test('rig: 뼈대 몸 인물도 화면 속 오류 감지기에 몸통·머리가 비었다고 잡히지 않는다', async () => {
  await loadRig();
  const w = testWorld();
  try {
    enableRig(true);
    [['seohui', -2], ['khitan', 0], ['soldier', 2]].forEach(([l, x]) => { const p = makePerson(LOOKS[l]); p.position.set(x, 0, -3); w.level.add(p); });
    enableRig(false);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 30), new THREE.MeshLambertMaterial()); ground.position.y = -0.1; w.level.add(ground);
    const probe = createProbe(w);
    for (let i = 0; i < 16; i++) { w.step(1 / 30, { x: 0, z: 0 }); probe.tick(1 / 30); }
    eq(probe.events.filter(e => e.severity === 'error').map(e => `${e.kind}:${e.who}`), []);
  } finally { enableRig(false); w.dispose(); }
});

test('rig: 시험을 켜면(goryeo-rig=1) 고려 1장 사람들이 뼈대 몸이 되고, 터치만으로 끝까지 할 수 있다', async () => {
  const { CHAPTERS } = await import('../chapters/index.js');
  const { runChapter } = await import('../core/flow.js');
  localStorage.setItem('goryeo-rig', '1');
  const mod = (await CHAPTERS[0].load()).default, script = mod.script;
  const s = touchSetup(script.speakers);
  const answers = new Set(); // 대본 속 모든 맞는 답(퀴즈·담판 고르기)
  const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o.options)) { if (typeof o.answer === 'number' && typeof o.options[o.answer] === 'string') answers.add(o.options[o.answer]); o.options.forEach(x => { if (x && x.correct && x.text) answers.add(x.text); }); } Object.values(o).forEach(walk); };
  walk(script);
  const bot = touchBot(s, { answers });
  try {
    let most = 0; const off = s.w.onUpdate(() => { most = Math.max(most, riggedPeople().filter(p => p.parent).length); });
    const r = await runChapter(CHAPTERS[0], mod, s.ctx, memSave());
    off();
    eq(r.quizCorrect, script.quizzes.length, '퀴즈까지 끝');
    ok(most >= 10, `뼈대 몸 인물 ${most}명`);
  } finally { localStorage.removeItem('goryeo-rig'); enableRig(false); bot.stop(); s.done(); }
}, { timeout: 240000 });

test('rig: 말 탄 사람은 블렌더 긴 옷자락을 숨기고 탄 옷을 입는다(말 몸통을 뚫지 않게), 몸통은 비지 않는다', async () => {
  const { makeHorse, mount } = await import('../core/horse.js');
  await loadRig();
  const w = testWorld();
  try {
    enableRig(true);
    const rider = makePerson(LOOKS.mongol);
    enableRig(false);
    ok(rider.userData.rig, '블렌더 몸');
    const h = makeHorse(); h.position.set(0, 0, -4); w.level.add(h); mount(h, rider);
    const body = rider.userData.rig.body;
    ok(!body.getObjectByName('robe_s').visible && !body.getObjectByName('robe_l').visible, '긴 옷자락은 숨긴다');
    eq(shownMesh(rider, 'rideRobe'), 1, '탄 옷');
    const probe = createProbe(w);
    for (let i = 0; i < 12; i++) { w.step(1 / 30, { x: 0, z: 0 }); probe.tick(1 / 30); }
    eq(probe.events.filter(e => e.severity === 'error').map(e => `${e.kind}:${e.who}`), []);
  } finally { enableRig(false); w.dispose(); }
});

test('rig: 시험은 고려편 1~6장에만 켠다(조선편부터는 아직 지금 인물)', async () => {
  const { prepareRig, RIG_CHAPTERS } = await import('../core/rigged.js');
  ok(['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'].every(id => RIG_CHAPTERS.test(id)), '고려편');
  ok(!['j1', 'k1', 'i1', 'h1', 'ch7'].some(id => RIG_CHAPTERS.test(id)), '다른 편');
  localStorage.setItem('goryeo-rig', '1');
  try { eq(await prepareRig('ch4'), true); eq(await prepareRig('j1'), false); } finally { localStorage.removeItem('goryeo-rig'); enableRig(false); }
  eq(await prepareRig('ch4'), false, '시험을 끄면 켜지 않는다');
});
