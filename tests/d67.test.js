// D-67(2026-11-04 선생님 전체 수정): 모인 사람들의 대화, 고려 6장(빛기둥·뛰어 달아나기·항파두리), 조선 1장 압록강 앞에서 머뭇거림, 바닷가 경계.
import { test, ok, eq } from './harness.js';
import * as THREE from 'three';
import { testWorld, touchSetup } from './bot.js';
import { makePerson } from '../core/people.js';
import { LOOKS } from '../content/characters.js';
import { chatter } from '../chapters/kit/walk.js';
import { terrainField } from '../chapters/kit/terrain.js';
import { makeSea } from '../core/sea.js';

test('d67: 모인 사람들은 둘씩 마주 보며 번갈아 말하고(chatter), 멈추면 원래 방향으로 돌아온다', () => {
  const w = testWorld();
  try {
    const ps = [0, 1, 2, 3].map(i => { const p = makePerson(LOOKS.soldier); p.position.set(i * 1.5, 0, 0); p.rotation.y = Math.PI; w.level.add(p); return p; });
    const off = chatter(w, ps);
    eq(off.pairs, 2, '둘씩 짝');
    let spoke = 0;
    for (let i = 0; i < 160; i++) { w.step(1 / 20, { x: 0, z: 0 }); spoke += ps.filter(p => p.userData.talk?.role === 'speak').length; }
    ok(spoke > 0, '말하는 사람이 있다');
    ok(ps.some(p => Math.abs(Math.atan2(Math.sin(p.rotation.y - Math.PI), Math.cos(p.rotation.y - Math.PI))) > 0.4), '짝 쪽으로 몸을 돌린다');
    off();
    ok(ps.every(p => Math.abs(p.rotation.y - Math.PI) < 1e-6 && !p.userData.talk), '멈추면 원래대로');
  } finally { w.dispose(); }
});

test('d67 조선1-1: 첫 장면 군사들은 압록강으로 걸어 들어가지 않고 강가에서 머뭇거리며 서로 이야기한다', async () => {
  const j1 = (await import('../chapters/joseon/j1/chapter.js')).default, script = (await import('../chapters/joseon/j1/script.js')).default;
  const s = touchSetup(script.speakers);
  try {
    const sc = j1.buildScene(s.w, s.ctx), z0 = sc.army.position.z;
    const film = j1.introScene(s.ctx);
    film.shots[0].act();
    let talk = 0;
    for (let i = 0; i < 200; i++) { s.w.step(1 / 20, { x: 0, z: 0 }); talk += sc.army.children.filter(p => p.userData.talk).length; }
    ok(sc.army.position.z >= z0, `북쪽(강)으로 나아가지 않는다 ${sc.army.position.z.toFixed(2)} / ${z0}`);
    ok(talk > 0, '서로 이야기한다');
    film.done();
    eq(sc.army.position.z, z0, '끝나면 제자리');
  } finally { s.done(); }
});

test('d67 고려6-2: 바닷길 도착 지점 원 위에 멀리서도 보이는 빛기둥', async () => {
  const ch6 = (await import('../chapters/ch6/chapter.js')).default, script = (await import('../chapters/ch6/script.js')).default;
  const s = touchSetup(script.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    const beam = sc.ring.getObjectByName('goalBeam'); ok(beam, '빛기둥');
    sc.ring.position.set(10, 0.1, 20); sc.ring.updateMatrixWorld(true);
    const top = beam.localToWorld(new THREE.Vector3(0, 7, 0));
    ok(top.y > 10 && Math.hypot(top.x - 10, top.z - 20) < 0.5, `원 위로 곧게 선다 ${top.toArray().map(v => v.toFixed(1))}`);
  } finally { s.done(); }
});

test('d67 바닷가: shore 물은 걷는 곳 1m 밖부터 물(평평한 여유 땅이 물 위로 뻗지 않는다), 바다 판 가장자리는 물결이 잔잔하다', () => {
  const f = terrainField({ bounds: { x0: -10, x1: 10, z0: -5, z1: 5 }, margin: 13, props: [{ type: 'water', x: 0, z: 30, w: 100, d: 48, shore: true }] });
  eq(f.heightAt(0, 4), 0, '걷는 곳은 땅'); eq(f.heightAt(0, 8), -1.4, '걷는 곳 밖 물 칸은 물');
  const g = terrainField({ bounds: { x0: -10, x1: 10, z0: -5, z1: 5 }, margin: 13, props: [{ type: 'water', x: 0, z: 30, w: 100, d: 48 }] });
  eq(g.heightAt(0, 8), 0, 'shore가 없는 물은 예전처럼');
  const sea = makeSea({ w: 40, d: 40, seg: 10, amp: 0.3 });
  sea.userData.sea.step(0.1, 3.3, { water: 'waves' });
  const pos = sea.geometry.attributes.position; let edge = 0, mid = 0;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = Math.abs(pos.getY(i)); if (Math.abs(x) > 19.9 || Math.abs(z) > 19.9) edge = Math.max(edge, y); else if (Math.abs(x) < 8 && Math.abs(z) < 8) mid = Math.max(mid, y); }
  ok(edge < 1e-6 && mid > 0.05, `가장자리 ${edge.toFixed(3)}, 가운데 ${mid.toFixed(3)}`);
});

test('d67 고려6-3: 용장성이 무너지면 삼별초는 처음부터 끝까지 같은 빠르기로 뛰어 배로 간다', async () => {
  const src = await (await fetch('../chapters/ch6/story.js')).text();
  const m = /march\(world, \[kim, \.\.\.men\], 0, ([\d.]+), ([\d.]+), \{ linear: true \}\)/.exec(src);
  ok(m, '같은 빠르기(linear)'); ok(+m[1] / +m[2] > 2.7, `달리기 빠르기(걷기 동작은 2.7m/s까지) ${(+m[1] / +m[2]).toFixed(1)}m/s`);
});

test('d67 고려6-5(2차): 항파두리 — 삼별초는 흙성 위에서 연합군을 내려다보고, 연합군이 진격해 흙성을 무너뜨리면 삼별초가 쓰러진다', async () => {
  const { touchSetup: ts, touchBot } = await import('./bot.js');
  const ch6 = (await import('../chapters/ch6/chapter.js')).default, script = (await import('../chapters/ch6/script.js')).default;
  const s = ts(script.speakers), bot = touchBot(s, { answers: new Set() });
  try {
    ch6.buildScene(s.w, s.ctx);
    await ch6.stories.hangpaduri(s.ctx);
    const h = s.ctx.testHooks.hangpaduri;
    ok(h.onWall >= h.few && h.wallTop > 1, `흙성 위에 선 삼별초 ${h.onWall}/${h.few}, 높이 ${h.wallTop}`);
    ok(h.facingAllies > 0.85, `연합군 쪽을 본다 ${h.facingAllies?.toFixed(2)}`);
    ok(h.advanced > 4, `연합군이 흙성 앞까지 나아간다 ${h.advanced?.toFixed(1)}m`);
    ok(h.strikes >= 9, `앞줄 군사가 창·칼로 흙성을 친다 ${h.strikes}번`); ok(h.swayed < 0.001, `몸을 앞뒤로 흔들지 않는다 ${h.swayed}`);
    ok(h.collapsed && h.crumbled >= 10, `흙성이 무너진다 ${h.crumbled}`);
    eq(h.defeated, h.few, '삼별초가 모두 쓰러진다(피 없이)');
    ok(h.sunk < 0.05, `땅에 묻히지 않는다 ${h.sunk?.toFixed(3)}`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });

test('d67: 세로 깃폭 글자는 판 안에 모두 들어갈 만큼 크게(「여몽 연합군」 다섯 글자)', async () => {
  const { verticalFont } = await import('../chapters/kit/buildings.js');
  const { size, w, h } = verticalFont('여몽 연합군');
  ok(5 * size * 1.15 + 20 <= h, `세로로 다 들어간다 ${size}px`);
  ok(size >= 34 && size <= w * 0.8, `글자 크기 ${size}px (판 너비 ${w})`);
  eq(verticalFont('상점').size, 40, '짧은 글은 예전 크기');
});

// 조선 3장(시간과 비를 재다)
async function j3Setup() {
  const j3 = (await import('../chapters/joseon/j3/chapter.js')).default, script = (await import('../chapters/joseon/j3/script.js')).default;
  const s = touchSetup(script.speakers); const sc = j3.buildScene(s.w, s.ctx); s.w.level.updateMatrixWorld(true);
  return { j3, script, s, sc };
}
test('d67 조선3-1·5: 앙부일구는 백성 눈높이(그릇 테두리 1.2~1.8m)라 들여다볼 수 있고, 문 앞에서 화면을 덮지 않는다', async () => {
  const { s, sc } = await j3Setup();
  try {
    const rim = sc.dial.localToWorld(new THREE.Vector3(0, 2.25, 0)).y;
    ok(rim > 1.2 && rim < 1.8, `테두리 높이 ${rim.toFixed(2)}m`);
    const box = new THREE.Box3().setFromObject(sc.dial);
    ok(box.min.y > -0.05, `받침이 땅에 묻히지 않는다 ${box.min.y.toFixed(2)}`);
  } finally { s.done(); }
});
test('d67 조선3-2: 앙부일구 동물 그림은 흰 바탕 없이 그릇에 새긴 빛깔로', async () => {
  const { s, sc } = await j3Setup();
  try {
    const tags = []; sc.dial.traverse(o => { if (o.isSprite) tags.push(o); });
    ok(tags.length >= 7, `그림 ${tags.length}`);
    const cv = tags[0].material.map.image, px = cv.getContext('2d').getImageData(4, 4, 1, 1).data;
    eq(px[3], 0, '모서리는 비친다(바탕 없음)');
  } finally { s.done(); }
});
test('d67 조선3-3: 보루각 관리(장영실)는 보루각 돌 기단에 묻히지 않는다', async () => {
  const { s } = await j3Setup();
  try {
    const p = s.w.npcs.get('jangyeongsil').mesh.position;
    ok(!(p.x > 3.8 && p.x < 14.2 && p.z > -7.7 && p.z < -0.3), `기단(0.6m) 밖에 선다 ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`);
  } finally { s.done(); }
});
test('d67 조선3-4: 자격루 — 물은 수수호 안에서 차오르고 살대가 함께 떠올라, 쇠구슬이 비탈을 굴러 동판을 치면 나무 인형이 채로 종·북·징을 친다', async () => {
  const { s, sc } = await j3Setup();
  try {
    const u = sc.clock.userData;
    ok(u.tanks?.length >= 1 && u.plate && u.mallets?.length === 3 && u.instruments?.length === 3, '수수호·동판·채 셋·악기 셋');
    // 채를 휘두르면(strike 1) 채 끝이 악기에 닿는다
    const near = u.mallets.map((m, i) => { u.swing(i, 1); sc.clock.updateMatrixWorld(true); return m.userData.tip.getWorldPosition(new THREE.Vector3()).distanceTo(u.instruments[i].getWorldPosition(new THREE.Vector3())); });
    ok(near.every(d => d < 0.35 * sc.clock.scale.x), `채 끝과 악기 ${near.map(d => d.toFixed(2))}`);
    u.mallets.forEach((_, i) => u.swing(i, 0)); sc.clock.updateMatrixWorld(true);
    const far = u.mallets.map((m, i) => m.userData.tip.getWorldPosition(new THREE.Vector3()).distanceTo(u.instruments[i].getWorldPosition(new THREE.Vector3())));
    ok(far.every(d => d > 0.25), '쉬면 떨어져 있다');
    // 구슬이 비탈 끝에 닿는 자리에 동판
    ok(u.chute.to.distanceTo(u.plate.position) < 0.3, '비탈 끝에 동판');
  } finally { s.done(); }
});

// 조선 2장(세종과 훈민정음)
test('d67 조선2-6: 첫 장면에서 글을 모르는 백성은 운다(눈물 표정·고개 숙여 눈가를 훔침), 탐험 때는 걱정하는 얼굴', async () => {
  const { resolve, buildFace } = await import('../core/facebuild.js');
  ok(resolve(buildFace({}), 'cry').tears, '울음 표정에 눈물');
  const j2 = (await import('../chapters/joseon/j2/chapter.js')).default, script = (await import('../chapters/joseon/j2/script.js')).default;
  const s = touchSetup(script.speakers);
  try {
    j2.buildScene(s.w, s.ctx);
    const cm = s.w.npcs.get('commoner').mesh, film = j2.introScene(s.ctx);
    film.shots[0].act();
    for (let i = 0; i < 20; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    eq(cm.userData.expr, 'cry', '운다'); ok(cm.userData.act, '눈가를 훔친다');
    film.done(); for (let i = 0; i < 10; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    eq(cm.userData.expr, 'worry'); ok(!cm.userData.act, '동작은 끝난다');
  } finally { s.done(); }
});
test('d67 조선2-9: 단상 위에 앉은 세종의 느낌표는 머리 위에 보인다(관 속에 묻히지 않는다)', async () => {
  const j2 = (await import('../chapters/joseon/j2/chapter.js')).default, script = (await import('../chapters/joseon/j2/script.js')).default;
  const s = touchSetup(script.speakers);
  try {
    j2.buildScene(s.w, s.ctx);
    const sj = s.w.npcs.get('sejong'); sj.mark.visible = true;
    s.w.step(1 / 20, { x: 0, z: 0 }); s.w.level.updateMatrixWorld(true);
    const head = new THREE.Box3().setFromObject(sj.mesh.getObjectByName('face') || sj.mesh).max.y, y = sj.mark.getWorldPosition(new THREE.Vector3()).y;
    ok(y > head + 0.4, `느낌표 ${y.toFixed(2)} > 얼굴 위 ${head.toFixed(2)}`);
  } finally { s.done(); }
});
test('d67 조선2-10: 나무·한글 낱자를 흩어 놓은 자리 사이가 좁다', async () => {
  const { LETTER_SPOTS } = await import('../chapters/joseon/j2/chapter.js');
  let far = 0; for (const a of LETTER_SPOTS) for (const b of LETTER_SPOTS) far = Math.max(far, Math.hypot(a.x - b.x, a.z - b.z));
  ok(far < 15, `가장 먼 두 낱자 ${far.toFixed(1)}m`);
});

// 조선 4장(임진왜란과 한산도 대첩)
async function j4Setup() {
  const mod = await import('../chapters/joseon/j4/chapter.js'), script = (await import('../chapters/joseon/j4/script.js')).default;
  const s = touchSetup(script.speakers); mod.default.buildScene(s.w, s.ctx);
  return { mod, j4: mod.default, script, s, sc: mod.devScene() };
}
test('d67 조선4-1: 선조의 의주 피란 해설에 한반도 지도와 한양→의주 길이 보이고, 장면이 끝나면 치운다', async () => {
  const { j4, s } = await j4Setup();
  try {
    const film = j4.introScene(s.ctx); film.shots[1].act();
    const map = document.querySelector('.route-map'); ok(map, '지도');
    ok(map.textContent.includes('한양') && map.textContent.includes('의주') && map.querySelector('.route'), '한양·의주와 피란길');
    film.done(); ok(!document.querySelector('.route-map'), '치운다');
  } finally { s.done(); }
});
test('d67 조선4-2·3·6: 거북선은 판옥선보다 크고, 견내량 적선은 유인 지점에서 멀며, 거북선이 앞설 때 판옥선과 겹치지 않는다', async () => {
  const { mod, s, sc } = await j4Setup();
  try {
    s.w.level.updateMatrixWorld(true);
    const len = o => { const b = new THREE.Box3().setFromObject(o); return Math.max(b.max.x - b.min.x, b.max.z - b.min.z); };
    ok(len(sc.leadTurtle) > len(sc.fleet.children[0]) * 1.15, `거북선 ${len(sc.leadTurtle).toFixed(1)} / 판옥선 ${len(sc.fleet.children[0]).toFixed(1)}`);
    ok(mod.LURE.mouth.z - (mod.STRAIT_Z - 28) >= 30, '유인 지점과 적선 사이 30m 이상');
    sc.setStage('wing'); { const sp = sc.spreadFleet(0.05); for (let i = 0; i < 5; i++) s.w.step(0.05, { x: 0, z: 0 }); await sp; }
    sc.leadTurtle.position.set(0, -0.2, -35); s.w.level.updateMatrixWorld(true);
    const tb = new THREE.Box3().setFromObject(sc.leadTurtle);
    for (const sh of sc.fleet.children) ok(!new THREE.Box3().setFromObject(sh).intersectsBox(tb), '거북선과 겹치지 않는다');
    const ships = sc.fleet.children.map(sh => new THREE.Box3().setFromObject(sh));
    for (let i = 0; i < ships.length; i++) for (let j = i + 1; j < ships.length; j++) ok(!ships[i].intersectsBox(ships[j]), `판옥선끼리 겹치지 않는다 ${i},${j}`);
  } finally { s.done(); }
});
test('d67 조선4-5·7: 학익진은 뒤에서 앞으로 퍼지며 나아가고, 판옥선은 옆구리(포혈)를 적 쪽으로 돌린다', async () => {
  const { s, sc } = await j4Setup();
  try {
    sc.setStage('wing');
    const p = sc.spreadFleet(1); s.w.step(0.001, { x: 0, z: 0 });
    const start = sc.fleet.children.map(sh => sh.position.clone());
    for (let i = 0; i < 30; i++) s.w.step(0.05, { x: 0, z: 0 }); await p;
    sc.fleet.children.forEach((sh, i) => {
      const [tx, tz] = sh.userData.spot;
      ok(start[i].z > tz + 8, `뒤(남쪽)에서 온다 ${start[i].z.toFixed(1)} → ${tz.toFixed(1)}`);
      ok(Math.abs(start[i].x - tx) < Math.abs(start[i].z - tz), '옆으로 길게 미끄러지지 않는다');
      ok(Math.abs(Math.sin(sh.rotation.y)) > 0.8, `옆구리를 적 쪽으로 ${sh.rotation.y.toFixed(2)}`);
    });
  } finally { s.done(); }
});
test('d67 조선4-4: 꾀어낸 뒤 넓은 바다 도착 지점에 빛기둥', async () => {
  const { sc } = await j4Setup().then(r => (r.s.done(), r));
  ok(sc.goalRing.getObjectByName('goalBeam'), '빛기둥');
});
test('d67 조선4-7·8: 적선은 멀리서 포격으로 가라앉고, 포를 쏠 때 불꽃이 번쩍이며 거북선은 용머리에서 쏜다', async () => {
  const { s, sc } = await j4Setup();
  try {
    sc.setStage('wing'); { const sp = sc.spreadFleet(0.05); for (let i = 0; i < 3; i++) s.w.step(0.05, { x: 0, z: 0 }); await sp; }
    sc.leadTurtle.position.set(0, -0.2, -35); sc.setAdvance(sc.FIRE_AT);
    s.w.level.updateMatrixWorld(true);
    const ours = [...sc.fleet.children, sc.leadTurtle].map(o => o.getWorldPosition(new THREE.Vector3())), theirs = sc.enemy.children.map(o => o.getWorldPosition(new THREE.Vector3()));
    let near = 1e9; for (const a of ours) for (const b of theirs) near = Math.min(near, a.distanceTo(b));
    ok(near > 15, `적선과 거리 ${near.toFixed(1)}m`);
    const log = sc.battleLog = [];
    let done = false; const run = sc.playBattle(null).then(() => { done = true; }); for (let i = 0; i < 900 && !done; i++) { s.w.step(0.05, { x: 0, z: 0 }); if (i % 10 === 0) await null; } // 약속이 풀릴 틈을 준다 ok(done, `포격이 끝난다 ${log.length}발, 남은 배 ${sc.enemy.children.filter(e => e.visible).length}`); await run;
    ok(log.filter(e => e.flash).length >= sc.enemy.children.length, `포 불꽃 ${log.filter(e => e.flash).length}`);
    const turtleShots = log.filter(e => e.from === sc.leadTurtle);
    ok(turtleShots.length >= 1 && turtleShots.every(e => e.at.distanceTo(sc.leadTurtle.localToWorld(new THREE.Vector3(0, 2.25, -4.6))) < 1.2), '거북선은 용머리에서');
  } finally { s.done(); }
}, { timeout: 60000 });
test('d67 조선4(2차): 적선은 예전(8척)의 3~4배, 견내량 물길 안에 들어가고, 포격 장면에서 모두 가라앉는다', async () => {
  const { s, sc } = await j4Setup();
  try {
    const n = sc.enemy.children.length;
    ok(n >= 24 && n <= 32, `적선 ${n}척`);
    ok(sc.enemy.children.every(e => Math.abs(e.position.x) <= 8.6), '좁은 물길(x −9~9) 안');
    sc.setStage('wing'); { const sp = sc.spreadFleet(0.05); for (let i = 0; i < 3; i++) s.w.step(0.05, { x: 0, z: 0 }); await sp; }
    sc.leadTurtle.position.set(0, -0.2, -35); sc.setAdvance(sc.FIRE_AT);
    let done = false, sunk = 0; const run = sc.playBattle(null).then(v => { done = true; sunk = v; });
    for (let i = 0; i < 1200 && !done; i++) { s.w.step(0.05, { x: 0, z: 0 }); if (i % 10 === 0) await null; }
    ok(done, '포격이 끝난다'); await run;
    eq(sunk, n, '모두 가라앉는다'); ok(sc.enemy.children.every(e => !e.visible), '남은 적선 없음');
  } finally { s.done(); }
}, { timeout: 90000 });

// 조선 5장(병자호란과 남한산성)
async function j5Setup() {
  const mod = await import('../chapters/joseon/j5/chapter.js'), script = (await import('../chapters/joseon/j5/script.js')).default;
  const s = touchSetup(script.speakers); mod.default.buildScene(s.w, s.ctx); s.w.level.updateMatrixWorld(true);
  return { mod, j5: mod.default, script, s, sc: mod.devScene() };
}
test('d67 조선5-1: 서문은 인조 일행(두 줄)이 벽을 지나지 않고 들어올 만큼 넓고 높다', async () => {
  const { s, sc } = await j5Setup();
  try {
    const lane = new THREE.Box3(new THREE.Vector3(-21.5, 0.4, -1.5), new THREE.Vector3(-18.5, 3.0, 1.5)); // 일행 두 줄(z ±1.1)과 어깨 폭
    const hits = [];
    s.w.level.traverse(o => { if (!o.isMesh || !o.visible) return; for (let q = o; q; q = q.parent) if (q.name === 'gateLeaf' || q === sc.introKing) return; if (new THREE.Box3().setFromObject(o).intersectsBox(lane)) { const b = new THREE.Box3().setFromObject(o); if (b.max.x - b.min.x > 60) return; hits.push((o.parent?.name || o.parent?.type) + ' ' + o.geometry.type + ' x' + b.min.x.toFixed(1) + '~' + b.max.x.toFixed(1) + ' y' + b.min.y.toFixed(1) + '~' + b.max.y.toFixed(1) + ' z' + b.min.z.toFixed(1) + '~' + b.max.z.toFixed(1)); } });
    eq(hits, [], '문 안 길을 막는 것이 없다');
  } finally { s.done(); }
});
test('d67 조선5-2: 남한산성 유네스코 해설은 처음이 아니라 장 끝 해설에', async () => {
  const script = (await import('../chapters/joseon/j5/script.js')).default;
  ok(!script.start.some(l => l.text.includes('유네스코')), '시작에 없다');
  ok(!JSON.stringify(script).includes('유네스코'), 'D-68: 이야기 흐름을 해쳐 아예 뺐다');
});
test('d67 조선5-3·6: 추위에 떠는 엄마와 아이는 좌우로 흔들리지 않고 손을 비비며, 곁의 화톳불을 켜면 「감사합니다!」 하고 손 비비기를 멈춘다', async () => {
  const { s, sc } = await j5Setup();
  try {
    const folk = s.w.npcs.get('coldfolk').mesh, a = folk.userData.arms[0];
    let maxZ = 0; const ax = [];
    for (let i = 0; i < 40; i++) { s.w.step(0.05, { x: 0, z: 0 }); maxZ = Math.max(maxZ, Math.abs(folk.rotation.z), Math.abs(sc.coldKid.rotation.z)); ax.push(a.rotation.z); }
    ok(maxZ < 0.002, `좌우로 떨지 않는다 ${maxZ.toFixed(3)}`);
    ok(Math.max(...ax) - Math.min(...ax) > 0.08, '손을 비빈다');
    const f = sc.folkFire; ok(f, '백성 곁 화톳불');
    sc.light(f);
    ok(s.w.level.getObjectByName('thanks')?.userData.text.includes('감사합니다'), '감사 인사(머리 위 말풍선, 놀이를 끊지 않는다)');
    const bx = []; for (let i = 0; i < 40; i++) { s.w.step(0.05, { x: 0, z: 0 }); bx.push(a.rotation.z); }
    ok(Math.max(...bx.slice(20)) - Math.min(...bx.slice(20)) < 0.01, '따뜻해지면 손 비비기를 멈춘다');
  } finally { s.done(); }
});
test('d67 조선5-4·7: 창고지기는 통나무를 지나 서지 않고, 인조가 서문으로 걷는 길은 군막을 지나지 않는다', async () => {
  const { mod, s } = await j5Setup();
  try {
    const k = s.w.npcs.get('keeper').mesh.position;
    for (let i = 0; i < 5; i++) ok(Math.hypot(k.x - 9.2, k.z - (-5 + i)) > 0.9, `통나무 ${i}와 떨어져 선다`);
    const tent = [-11, -0.5], path = [[0, -7.6], ...mod.INJO_PATH];
    for (let i = 1; i < path.length; i++) { const [ax, az] = path[i - 1], [bx, bz] = path[i];
      for (let t = 0; t <= 1; t += 0.05) ok(Math.hypot(ax + (bx - ax) * t - tent[0], az + (bz - az) * t - tent[1]) > 2.4, `길 ${i}가 군막을 지나지 않는다`); }
  } finally { s.done(); }
});
test('d67 조선5-5: 마당의 신하들은 제자리에 서 있지 않고 길을 오가며 걷는다', async () => {
  const { wanderAt } = await import('../chapters/joseon/j5/chapter.js');
  const base = { x: 0, z: 0 }, ps = [0, 2, 4, 6].map(t => wanderAt(base, 1, t));
  ok(Math.max(...ps.map(p => Math.hypot(p.x, p.z))) > 1.5 && Math.max(...ps.map(p => Math.hypot(p.x, p.z))) < 3.5, '자리 둘레 몇 걸음 안에서 오간다');
  ok(new Set(ps.map(p => p.x.toFixed(1) + p.z.toFixed(1))).size === 4, '시간에 따라 자리가 바뀐다');
});
test('d67 조선4(3차): 포구의 이순신·수군·백성은 땅 위(높이 0)에 서고 물 위에 떠 보이지 않는다', async () => {
  const { s } = await j4Setup();
  try {
    const ground = []; s.w.level.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters?.height === 40) ground.push(o); });
    ok(ground.length === 1, '포구 땅');
    const ray = new THREE.Raycaster();
    for (const id of ['yisunsin', 'navy', 'commoner']) {
      const p = s.w.npcs.get(id).mesh.position; ray.set(new THREE.Vector3(p.x, 5, p.z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObject(ground[0])[0]; ok(hit && Math.abs(hit.point.y) < 0.05, `${id} 발밑 땅 ${hit?.point.y.toFixed(2)}`);
    }
  } finally { s.done(); }
});
test('d67 조선4(3차): 꾀어내기 전 적선은 넓게 벌린 일정한 대열, 쫓아올 때는 촘촘한 대열로 좁은 물길을 지난다', async () => {
  const { s, sc } = await j4Setup();
  try {
    sc.setStage('lure');
    const xs = () => sc.enemy.children.map(e => Math.abs(e.position.x));
    ok(Math.max(...xs()) > 12, `넓게 벌린 대열 ±${Math.max(...xs()).toFixed(1)}`);
    const rows = new Set(sc.enemy.children.map(e => e.position.z.toFixed(1))); ok(rows.size === 5, `일정한 줄 ${rows.size}`);
    sc.setFormation(1); ok(Math.max(...xs()) <= 8.6, '촘촘한 대열은 물길 안');
    const src = await (await fetch('../chapters/joseon/j4/chapter.js')).text();
    ok(/setFormation\(0\)[\s\S]*setFormation\(Math\.min\(1, t \/ 3\)\)/.test(src), '꾀어낼 때 넓은 대열 → 쫓으며 모인다');
  } finally { s.done(); }
});
test('d67 조선5-8·9: 삼전도 — 멈춰 선 뒤 걷는 동작이 남지 않고, 절하기 전에 손을 모아 예를 갖추며, 학생은 절하는 자리가 아니라 청 군사 옆에 선다', async () => {
  const { j5, script, s } = await j5Setup();
  const { touchBot } = await import('./bot.js');
  const bot = touchBot(s, { answers: new Set() });
  try {
    await j5.samjeondo(s.ctx);
    const m = s.ctx.testHooks.samjeondoMeta;
    ok(m.courtesy, '예를 갖추는 동작'); ok(m.idleAfterWalk, '멈추면 서 있는 동작으로');
    eq(m.bowCam, 'behind-above', 'D-68: 절하는 동안 행렬 뒤 위에서(청 황제가 앞에 보이게)');
    ok(m.playerX > 6 && Math.abs(m.playerX - m.qingX) < 3, `학생은 청 군사 옆 x ${m.playerX?.toFixed(1)} (청 군사 ${m.qingX?.toFixed(1)})`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
test('d67 조선3-4(2차): 자격루 물그릇마다 다음 그릇(마지막은 수수호) 위까지 이어진 물길(홈통)이 있다', async () => {
  const { sc, s } = await j3Setup();
  try {
    const u = sc.clock.userData; ok(u.spouts?.length >= 3, `물길 ${u.spouts?.length}마디`);
    const pots = [0, 1, 2].map(i => sc.clock.getObjectByName(`파수호${i + 1}`).position);
    u.spouts.forEach((sp, i) => {
      ok(sp.from.y > sp.to.y, `물길 ${i}은 내리막`);
      if (i > 2) return;
      if (i < 2) ok(Math.abs(sp.to.x - pots[i + 1].x) < 0.5 && sp.to.y > pots[i + 1].y, `물길 ${i} 끝은 다음 그릇 위 ${sp.to.x.toFixed(2)} / ${pots[i + 1].x.toFixed(2)}`);
      else { const last = u.spouts[u.spouts.length - 1].to; ok(last.x > 0.1 && last.x < u.tanks[0].position.x && last.y < 0.6, '마지막 물길은 수수호로 드는 아래 관으로'); }
      ok(Math.abs(sp.from.x - pots[i].x) < 0.7, `물길 ${i}은 그 그릇에서 시작`);
    });
  } finally { s.done(); }
});
test('d67 조선4(4차): 전투 동안 포구에 정박한 배는 없고, 포탄은 크게 빛나며 날아가 적선을 불태우고, 쏠 때 배를 흔들지 않으며 포구 연기가 오래 남는다', async () => {
  const { s, sc } = await j4Setup();
  try {
    ok(sc.portShips?.length >= 4, '포구 정박 배');
    sc.setStage('wing'); ok(sc.portShips.every(p => !p.visible), '학익진·전투 때 포구 배는 없다');
    sc.setStage('harbor'); ok(sc.portShips.every(p => p.visible), '포구에서는 있다');
    sc.setStage('wing'); { const sp = sc.spreadFleet(0.05); for (let i = 0; i < 3; i++) s.w.step(0.05, { x: 0, z: 0 }); await sp; }
    sc.leadTurtle.position.set(0, -0.2, -35); sc.setAdvance(sc.FIRE_AT);
    const log = sc.battleLog = []; let tilt = 0, balls = 0, trails = 0;
    let done = false; const run = sc.playBattle(null).then(() => { done = true; });
    for (let i = 0; i < 1200 && !done; i++) {
      s.w.step(0.05, { x: 0, z: 0 }); if (i % 10 === 0) await null;
      for (const sh of sc.fleet.children) tilt = Math.max(tilt, Math.abs(sh.rotation.z));
      sc.fx.children.forEach(o => { if (o.name === 'cannonball') balls = Math.max(balls, o.geometry.parameters.radius); if (o.name === 'trail') trails += 1; });
    }
    await run;
    ok(tilt < 0.001, `배를 흔들지 않는다 ${tilt.toFixed(3)}`);
    ok(balls >= 0.4, `포탄이 크게 보인다 ${balls}`); ok(trails > 0, '빛나는 꼬리');
    ok(log.every(e => e.smokeLife >= 2.5), '포구 연기가 오래 남는다');
  } finally { s.done(); }
}, { timeout: 90000 });
test('d67 조선4(4차): 승리 뒤 배가 포구로 돌아오는 장면은 없다', async () => {
  const src = await (await fetch('../chapters/joseon/j4/story.js')).text();
  ok(!/돌아오는 배들/.test(src) && !/rowShip\(s, k \* 30/.test(src), '돌아오는 배 장면을 뺐다');
});

// D-68 조선 4장
test('d68 조선4-1·3: 바다에 배를 몰 때 내 배와 적선 말고 다른 배는 숨고, 노란 화살표는 배 위(갑판 높이)에 크게 보인다', async () => {
  const { mod, s, sc } = await j4Setup();
  try {
    sc.setStage('sail'); mod.boardForTest(s.ctx, mod.LURE.start);
    ok(sc.myShip.visible && !sc.lure.visible && !sc.fleet.visible && !sc.flagship.visible && sc.portShips.every(p => !p.visible), '내 배만');
    s.w.setGoal({ x: 0, z: -70 }); s.w.step(0.05, { x: 0, z: 0 });
    ok(s.w.goalArrow.visible && s.w.goalArrow.position.y > 2.5 && s.w.goalArrow.scale.x >= 2, `화살표 높이 ${s.w.goalArrow.position.y.toFixed(1)} 크기 ${s.w.goalArrow.scale.x}`);
    mod.unboardForTest(s.ctx); s.w.step(0.05, { x: 0, z: 0 });
    ok(s.w.goalArrow.position.y < 0.5 && s.w.goalArrow.scale.x === 1, '내리면 땅 높이');
  } finally { s.done(); }
});
test('d68 조선4-2: 꾀어낸 뒤 도착 지점은 견내량 입구에서 35m 넘게 남쪽(대장선 가까이)', async () => {
  const { mod, s, sc } = await j4Setup();
  try {
    ok(mod.LURE.open.z - mod.LURE.mouth.z > 35, `몰고 내려오는 거리 ${(mod.LURE.open.z - mod.LURE.mouth.z).toFixed(0)}m`);
    const f = sc.flagship.position; ok(Math.hypot(f.x - mod.LURE.open.x, f.z - mod.LURE.open.z) < 12, '대장선 가까이');
  } finally { s.done(); }
});
test('d68 조선4: 학익진에서 배에 탈 때 다른 판옥선은 그대로 보인다', async () => {
  const { mod, s, sc } = await j4Setup();
  try { sc.setStage('wing'); mod.boardForTest(s.ctx, [0, -13]); ok(sc.fleet.visible && sc.leadTurtle.visible, '학익진 배'); } finally { s.done(); }
});

// D-68 조선 6장(수원 화성)
async function j6Setup() {
  const mod = await import('../chapters/joseon/j6/chapter.js'), script = (await import('../chapters/joseon/j6/script.js')).default;
  const s = touchSetup(script.speakers); mod.default.buildScene(s.w, s.ctx); s.w.level.updateMatrixWorld(true);
  return { mod, j6: mod.default, script, s, sc: mod.devScene() };
}
test('d68 조선6-3: 돌 나르는 백성의 길은 도르래 틀(가·나·다) 다리를 지나지 않는다', async () => {
  const { sc, s } = await j6Setup();
  try {
    const R = sc.carrierRoute; ok(R?.length >= 2, '길');
    for (let i = 1; i < R.length; i++) for (let t = 0; t <= 1; t += 0.02) {
      const x = R[i - 1].x + (R[i].x - R[i - 1].x) * t, z = R[i - 1].z + (R[i].z - R[i - 1].z) * t;
      for (const p of sc.pulleys) ok(!(Math.abs(x - p.x) < 1.6 && Math.abs(z - p.z) < 0.8), `틀 ${p.label} 다리를 지나지 않는다 (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
  } finally { s.done(); }
});
test('d68 조선6-4·5: 거중기 끝 줄은 마당을 가로지르지 않고 들보와 기둥을 따라 물레로 내려오며, 물레에 감긴 밧줄(무늬)이 물레와 함께 돈다', async () => {
  const { sc, s } = await j6Setup();
  try {
    const w = sc.winch; ok(w.x > 10, `물레는 거중기 오른쪽 기둥 곁 x ${w.x}`);
    for (const r of sc.pullRopes) { const b = new THREE.Box3().setFromObject(r); ok(b.max.x - b.min.x < 3 || b.max.y - b.min.y < 0.6, `줄 하나는 들보를 따라 가로로 또는 기둥을 따라 세로로 ${(b.max.x - b.min.x).toFixed(1)}×${(b.max.y - b.min.y).toFixed(1)}`); }
    const coil = sc.drum.getObjectByName('ropeCoil'); ok(coil?.material.map, '감긴 밧줄 무늬');
    ok(coil.parent === sc.drum || sc.drum.children.includes(coil.parent), '물레와 함께 돈다');
  } finally { s.done(); }
});
test('d68 조선6-6: 화성 둘러보기에서 학생과 정조는 성벽 위에서 같은 방향(성 밖)을 본다', async () => {
  const { mod, s } = await j6Setup();
  try {
    const src = await (await fetch('../chapters/joseon/j6/chapter.js')).text();
    ok(!/world\.player\.clone\(/.test(src), '학생 복사본(뼈대가 원래 학생에 묶인다)을 쓰지 않는다');
  } finally { s.done(); }
});

// D-68 근대 1장(강화도 조약)
test('d68 근대1-2: 이양선·일본 군함은 당시 발전한 증기 외륜선(양옆 물레바퀴 덮개·높은 굴뚝과 연기·돛대 둘), 일본 군함은 일장기', async () => {
  const { BUILD } = await import('../chapters/kit/town.js');
  const g = new THREE.Group(); BUILD.steamship(g, { old: true });
  ok(g.getObjectByName('paddleBox'), '물레바퀴 덮개'); ok(g.getObjectByName('funnelSmoke'), '굴뚝 연기');
  ok(!g.getObjectByName('shipFlag'), '서양 배는 나라를 정하지 않는다');
  const j = new THREE.Group(); BUILD.steamship(j, { old: true, flag: 'japan' }); ok(j.getObjectByName('shipFlag'), '일본 군함은 일장기');
  const src = (await (await fetch('../chapters/modern/k1/chapter.js')).text()) + (await (await fetch('../chapters/modern/k1/story.js')).text());
  ok((src.match(/flag: 'japan'/g) || []).length >= 3, '일본 군함 세 곳(망루·연무당·조약 장면)');
});
test('d68 근대1-1: 흥선 대원군은 관아 건물(문·벽)을 지나 나타나지 않고 축대 위를 옆에서 걸어온다', async () => {
  const src = await (await fetch('../chapters/modern/k1/chapter.js')).text();
  ok(!/regent\.position\.set\(-3\.9, T, -7\.4 \+ 2\.6/.test(src), '건물 안에서 앞으로 걸어 나오지 않는다');
  ok(/regent\.position\.set\(-6\.6 \+ 2\.7/.test(src), '축대 위를 옆에서');
});

// D-68 근대 2장(갑신정변)
test('d68 근대2-1: 개혁안 붙이기에는 빛기둥이 없고, 진짜 개혁안은 순서 상관없이 비어 있는 벽·게시판 어디에 붙여도 된다', async () => {
  const src = await (await fetch('../chapters/modern/k2/chapter.js')).text(), script = (await import('../chapters/modern/k2/script.js')).default;
  ok(!/nextPlaceBeacon/.test(src), '빛기둥 없음');
  const R = script.parts.reform; ok(R.anyYes, '어디에 붙여도 된다');
  ok(!/빛기둥/.test(R.howto + JSON.stringify(R.intro)), '안내 글에 빛기둥 없음');
  const { deliverAccepts } = await import('../chapters/kit/play.js');
  const bins = R.bins.map(b => ({ ...b }));
  const real = R.cards.find(c => c.bin !== 'no');
  ok(bins.filter(b => b.id !== 'no').every(b => deliverAccepts(R, real, b)), '진짜 개혁안은 어느 게시판이든');
  ok(!deliverAccepts(R, real, bins.find(b => b.id === 'no')), '「개혁안이 아닌 것」에는 안 된다');
  const fake = R.cards.find(c => c.bin === 'no'); ok(!deliverAccepts(R, fake, bins[0]) && deliverAccepts(R, fake, bins.find(b => b.id === 'no')), '가짜는 「아닌 것」에만');
  bins[0].placed = 1; ok(!deliverAccepts(R, real, bins[0]), '이미 붙인 곳은 빼고');
});
test('d68 근대2-2·3: 청 군대는 서쪽 담 바로 밖에서 담 틈으로 들어오고, 김옥균·관리·잔치 손님은 벽·집을 지나지 않는 길로 달아난다', async () => {
  const src = await (await fetch('../chapters/modern/k2/chapter.js')).text();
  const m = /p\.position\.set\((-?\d+(?:\.\d+)?) - row\(i\) \* ([\d.]+), 0, \(i % 5 - 2\) \* ([\d.]+) \+ \(row\(i\) % 2\) \* ([\d.]+)\)/.exec(src);
  ok(m, '청 군사 자리'); const x0 = +m[1], zs = +m[3], zo = +m[4];
  ok(x0 >= -20 && x0 - 2 * +m[2] > -24, `담 바로 밖 x ${x0}`);
  ok(2 * zs + zo + 0.35 <= 3 && -2 * zs - 0.35 >= -5, `담 틈(z −5~3) 안 ±${(2 * zs + zo).toFixed(2)}`);
  ok(!/runAway\(world, kim\.mesh, far, 3\)/.test(src) || /far = a\.at\(2[01]/.test(src), '김옥균은 담 바로 밖까지만');
  ok(/const away = \[\[-4, 18\]/.test(src), '잔치 손님은 큰길을 따라');
});
test('d68 근대2(끝 장면): 청 군사 행렬은 양옆 가게 줄(무대 밖 x ±18.5)을 지나지 않는다', async () => {
  const src = await (await fetch('../chapters/modern/k2/story.js')).text();
  const m = /troop\(g, 'qingSoldier', (-?\d+), 0, \{ cols: 2, rows: (\d), gap: ([\d.]+)/.exec(src), g2 = /march\(world, column, (\d+),/.exec(src);
  const front = +m[1], back = front - (+m[2] - 1) * +m[3], d = +g2[1];
  ok(back > -18.5 && front + d < 18.5, `행렬 ${back.toFixed(1)} → ${(front + d).toFixed(1)}`);
});

test('d67 넓히기: 마을 무리(crowd)는 몇 사람이 굳지 않고 둘씩 이야기하며, 태극기를 든 무리는 그대로 선다', async () => {
  const { buildTown } = await import('../chapters/kit/town.js');
  const { bakeLevel } = await import('../core/bake.js');
  const w = testWorld();
  try {
    const t = buildTown(w, { ground: 'earth', bounds: { x0: -15, x1: 15, z0: -10, z1: 10 }, start: [0, 8], nature: false, mountains: false,
      props: [{ type: 'crowd', x: -6, z: -4, n: 10, looks: ['commoner'] }, { type: 'crowd', x: 6, z: -4, n: 10, flags: 1, looks: ['commoner'] }] });
    bakeLevel(w, t);
    ok(t.chats >= 2, `이야기하는 짝 ${t.chats}`);
    const live = []; w.level.traverse(o => { if (o.userData.legs && o.userData.chat) live.push(o); });
    ok(live.length >= 4 && live.length <= 6, `굳지 않은 사람 ${live.length}`);
    const r0 = live.map(p => p.rotation.y);
    for (let i = 0; i < 60; i++) w.step(1 / 20, { x: 0, z: 0 });
    ok(live.some((p, i) => Math.abs(p.rotation.y - r0[i]) > 0.05), '짝 쪽으로 몸을 돌린다');
    ok(live.every(p => p.parent && p.parent.position.x < 0), '태극기 무리는 이야기하지 않는다');
  } finally { w.dispose(); }
});

test('d67 넓히기: 길(roads)이 있는 마을에는 그 시대 사람 둘이 길을 따라 오가고, 집·안내판·사람 자리를 지나지 않는다', async () => {
  const { buildTown } = await import('../chapters/kit/town.js');
  const w = testWorld();
  try {
    const t = buildTown(w, { ground: 'earth', bounds: { x0: -20, x1: 20, z0: -10, z1: 10 }, start: [0, 8], nature: false, mountains: false,
      roads: [{ x: 0, z: 0, w: 36, d: 3 }], props: [{ type: 'hanok', x: 10, z: 0 }, { type: 'crowd', x: -6, z: -7, n: 6, looks: ['peasant'] }, { type: 'crowd', x: 3, z: -1, n: 4, cols: 2, looks: ['peasant'] }], npcs: [{ id: 'a', look: 'commoner', x: -14, z: 0 }] });
    eq(t.walkers.length, 2);
    const blocks = [...w.colliders, { x: -14, z: 0, r: 1.2 }, { x: 3.7, z: -0.3, r: 1.4 }]; // 길 위에 선 무리
    let worst = Infinity; const x0 = t.walkers.map(p => p.position.x);
    for (let i = 0; i < 400; i++) { w.step(1 / 20, { x: 0, z: 0 }); for (const p of t.walkers) for (const c of blocks) worst = Math.min(worst, Math.hypot(p.position.x - c.x, p.position.z - c.z) - c.r); }
    ok(worst > 0.2, `막힌 곳과 거리 ${worst.toFixed(2)}`);
    ok(t.walkers.every((p, i) => Math.abs(p.position.x - x0[i]) > 1), '걸어 다닌다');
    ok(t.walkers.every(p => /walk/.test(p.userData.skel?.target || 'walk')), '걷는 동작');
  } finally { w.dispose(); }
});

test('d67 넓히기: 고려 4장 처인성 안에 모인 백성·승려는 둘씩 이야기한다', async () => {
  const { buildCh4Scene } = await import('../chapters/ch4/scene.js');
  const w = testWorld();
  try {
    const s = buildCh4Scene(w);
    ok(s.cheoinFolk.length === 8, `백성·승려 ${s.cheoinFolk.length}`);
    ok(s.cheoinChats >= 3, `이야기하는 짝 ${s.cheoinChats}`);
    const r0 = s.cheoinFolk.map(p => p.rotation.y);
    for (let i = 0; i < 60; i++) w.step(1 / 20, { x: 0, z: 0 });
    ok(s.cheoinFolk.some((p, i) => Math.abs(p.rotation.y - r0[i]) > 0.05), '짝 쪽으로 몸을 돌린다');
  } finally { w.dispose(); }
});

test('d67 대사 정리 2(선생님 답): 사람이 사실을 읊던 말은 해설로 옮기고, 말 속 괄호 연도는 뺀다', async () => {
  const all = s => JSON.stringify(s);
  const j6 = (await import('../chapters/joseon/j6/script.js')).default, k1 = (await import('../chapters/modern/k1/script.js')).default;
  const k5 = (await import('../chapters/modern/k5/script.js')).default, i5 = (await import('../chapters/colonial/i5/script.js')).default;
  const i6 = (await import('../chapters/colonial/i6/script.js')).default, h6 = (await import('../chapters/present/h6/script.js')).default;
  ok(!j6.npc.worker.first.some(l => /1794/.test(l.text)), '조선 6장 일꾼은 연도를 말하지 않는다');
  ok(/1794년 정월.*1796년/.test(all(j6.result || j6)), '조선 6장 공사 시작은 끝 해설에');
  ok(!/결국 1876/.test(all(k1)) && /"who":"narr","text":"1876년, 조선은 이곳 강화도에서/.test(all(k1)), '근대 1장 연무당 1876년은 해설로');
  ok(!k5.npc.woman.first.some(l => /1899/.test(l.text)), '근대 5장 아주머니는 전차 연도를 되풀이하지 않는다');
  ok(!i5.npc.student.first.some(l => /1926/.test(l.text)) && i5.intro?.some?.(l => /1926년.*6·10 만세 운동/.test(l.text) && l.src?.length), '일제 5장 6·10 만세 운동은 첫 해설에');
  for (const [s, who] of [[i6, 'officer'], [i6, 'kimgu'], [h6, 'citizen']]) {
    const said = []; JSON.parse(all(s), (k, v) => { if (v && v.who === who && typeof v.text === 'string') said.push(v.text); return v; });
    ok(said.length && said.every(t => !/[가-힣]\((\d{4}년|6월 민주 항쟁)\)/.test(t)), `${who} 말 속 괄호 없음`);
  }
});
