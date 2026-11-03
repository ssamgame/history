// D-63(2026-11-03 선생님): 인물 생김새 점검. 장수의 칼은 칼집에 넣어 왼쪽 허리에 비스듬히 찬다(손에 세워 든 것처럼 보이지 않게).
import { test, ok, eq } from './harness.js';
import * as THREE from 'three';
import { LOOKS } from '../content/characters.js';
import { makePerson } from '../core/people.js';
import { faceBlockers } from './faces.test.js';

test('d63: 칼은 칼집째 허리에 비스듬히 찬다(칼자루는 앞으로, 칼집 끝은 뒤로)', () => {
  for (const id of ['yanggyu', 'gangamchan', 'sonn']) {
    const p = makePerson(LOOKS[id], { track: false, stable: true }); p.updateMatrixWorld(true);
    const s = p.getObjectByName('sword'); ok(s, `${id}: 칼`);
    const top = s.localToWorld(new THREE.Vector3(0, 0.5, 0)), tip = s.localToWorld(new THREE.Vector3(0, -0.65, 0));
    const d = top.clone().sub(tip), tilt = Math.acos(d.y / d.length()) * 180 / Math.PI;
    ok(tilt > 40 && tilt < 80, `${id}: 칼집 기울기 ${tilt.toFixed(0)}°(곧게 서면 손에 든 것처럼 보인다)`);
    ok(top.z > tip.z + 0.3, `${id}: 칼자루는 앞, 칼집 끝은 뒤(${top.z.toFixed(2)} / ${tip.z.toFixed(2)})`);
    ok(top.y < 1.25, `${id}: 칼자루가 허리 높이(${top.y.toFixed(2)})`);
  }
});

test('d63: 조선·근대 관리는 사모(둥근 모자 뒤 짧은 날개), 고려 관리는 복두(양옆으로 긴 각)', () => {
  const width = id => { const p = makePerson(LOOKS[id], { track: false, stable: true }); p.updateMatrixWorld(true); const h = p.getObjectByName('head').parent, b = new THREE.Box3();
    for (const c of h.children) if (c.name !== 'head' && c.isMesh) b.union(new THREE.Box3().setFromObject(c)); return b.max.x - b.min.x; };
  for (const id of ['joseonOfficial', 'kimsangheon', 'choemyeonggil', 'jobyeonggap', 'daewongun']) {
    ok(LOOKS[id].hat === 'samo', `${id}: 사모`);
    const w = width(id); ok(w < 1.0, `${id}: 모자 너비 ${w.toFixed(2)}(복두 각처럼 길지 않다)`);
    const bl = faceBlockers(LOOKS[id]); ok(bl.length === 0, `${id}: 사모가 눈썹·눈을 가리지 않는다 ${bl.slice(0, 2)}`);
  }
  for (const id of ['seohui', 'officer']) { ok(LOOKS[id].hat === 'official', `${id}: 복두`); ok(width(id) > 1.1, `${id}: 복두 각`); }
});

// 말 탄 사람(D-63, 2026-11-03 선생님: 흥화진 거란 왕이 말 위에 서 있는 것처럼 보인다): 인물 다리가 짧아 옷 속에 묻혀 기둥처럼 보였다.
// 말 탄 동안 안장 양옆에 걸터앉은 다리(허벅지·정강이·신)가 보이고, 신은 안장보다 한참 아래 말 몸통 바깥에 있다. 말에서 떨어지면 숨는다
test('d63: 말 탄 사람은 걸터앉은 다리가 말 옆구리에 보인다', async () => {
  const { makeHorse, mount, animateHorse, SADDLE } = await import('../core/horse.js');
  for (const id of ['khitan', 'mongol', 'soldier', 'yanggyu']) {
    const h = makeHorse(), p = mount(h, makePerson(LOOKS[id]));
    animateHorse(h, 1 / 30); h.updateMatrixWorld(true);
    const legs = []; h.traverse(o => { if (o.name === 'rideLeg') legs.push(o); });
    eq(legs.length, 2, `${id}: 걸터앉은 다리 둘`);
    for (const L of legs) {
      ok(L.visible, `${id}: 보인다`);
      const boot = L.getObjectByName('rideBoot'), b = h.worldToLocal(boot.getWorldPosition(new THREE.Vector3()));
      ok(SADDLE - b.y > 0.45 && Math.abs(b.x) > 0.34, `${id}: 신이 안장 밑 옆구리 바깥(${b.x.toFixed(2)}, ${(SADDLE - b.y).toFixed(2)})`);
    }
    // 떨어지면(사람이 말에서 떨어져 다른 곳에 있으면) 다리도 숨는다
    const g = new THREE.Group(); g.add(p); animateHorse(h, 1 / 30);
    ok(legs.every(L => !L.visible), `${id}: 떨어지면 숨는다`);
    h.userData.body.add(p); animateHorse(h, 1 / 30);
    ok(legs.every(L => L.visible), `${id}: 다시 타면 보인다`);
  }
});

test('d63: 흥화진 성벽 싸움 동안 거란 왕은 대군 뒤 천막 앞에서 말 탄 채 장군들과 지켜본다(도입은 선봉 그대로)', async () => {
  const { touchSetup } = await import('./bot.js');
  const ch2 = (await import('../chapters/ch2/chapter.js')).default, script = (await import('../chapters/ch2/script.js')).default;
  const s = touchSetup(script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx), K = sc.khitanKing;
    const front = Math.max(...sc.horde.map(k => k.userData.home.z)), back = Math.min(...sc.horde.map(k => k.userData.home.z));
    ok(K.position.z > front, '처음(도입)은 선봉');
    sc.kingToCamp();
    ok(K.position.z < back, `싸움 동안은 대군 뒤(${K.position.z.toFixed(1)} < ${back.toFixed(1)})`);
    const tents = []; sc.khitan.children.forEach(m => { if (m.geometry?.type === 'ConeGeometry') tents.push(m.position); });
    const near = Math.min(...tents.map(t => Math.hypot(t.x - K.position.x, t.z - K.position.z)));
    ok(near < 4.5 && near > 2.4, `천막 앞(가장 가까운 천막 ${near.toFixed(1)}m)`);
    const gens = sc.kingGenerals.filter(g => Math.hypot(g.position.x - K.position.x, g.position.z - K.position.z) < 4);
    ok(gens.length >= 2, `곁의 장군 ${gens.length}`);
    ok(gens.every(g => Math.hypot(g.position.x - K.position.x, g.position.z - K.position.z) > 1.2), '장군이 말과 겹치지 않는다');
  } finally { s.done(); }
});

// 귀주 대첩(D-63, 2026-11-03 선생님): 지원군이 와서 거란군을 칠 때 몸이 좌우로만 흔들렸다 → 짝지어 마주 서서 창·칼로 찌르고 막고 되받아친다
test('d63: 귀주 대첩은 고려군과 거란군이 짝지어 마주 서서 찌르고 막고, 진 거란군은 쓰러지거나 달아난다', async () => {
  const { touchSetup } = await import('./bot.js');
  const { default: ch3, playGujuBattle } = await import('../chapters/ch3/chapter.js');
  const script = (await import('../chapters/ch3/script.js')).default;
  const s = touchSetup(script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx); sc.guju.visible = true;
    const x0 = sc.gujuGoryeo.map(p => p.position.x);
    const p = playGujuBattle(s.ctx);
    let side = 0, gap = Infinity;
    for (let i = 0; i < 180; i++) {
      s.w.step(1 / 30, { x: 0, z: 0 });
      sc.gujuGoryeo.forEach((g, k) => { side = Math.max(side, Math.abs(g.position.x - x0[k])); });
      if (i === 95) gap = Math.min(...sc.gujuGoryeo.map((g, k) => Math.hypot(g.position.x - sc.gujuKhitan[k].position.x, g.position.z - sc.gujuKhitan[k].position.z)));
    }
    for (let i = 0; i < 120; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    await p;
    const h = s.ctx.testHooks.gujuBattle;
    ok(side < 0.05, `좌우로 흔들지 않는다(${side.toFixed(2)}m)`);
    ok(gap < 2.0, `맞붙을 때 짝과의 거리 ${gap.toFixed(2)}m`);
    ok(h.goryeoStrikes >= 12 && h.khitanStrikes >= 4 && h.blocks >= 6, `찌르기 ${h.goryeoStrikes} / 되받아치기 ${h.khitanStrikes} / 막기 ${h.blocks}`);
    ok(h.reinforceStrikes >= 4, `지원군도 싸운다 ${h.reinforceStrikes}`);
    ok(sc.gujuKhitan.some(k => k.rotation.x < -1) && sc.gujuKhitan.some(k => !k.visible), '쓰러진 거란군과 달아난 거란군');
  } finally { s.done(); }
}, { timeout: 60000 });
