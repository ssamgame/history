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
