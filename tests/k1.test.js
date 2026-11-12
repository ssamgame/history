// 근대편 1장 D-28: 마을 사람 아무 차례로(이어 주는 말), 물건을 안고 가져다 놓기, 조약문 읽고 사람들의 말 가려내기
import * as THREE from 'three';
import { test, eq, ok } from './harness.js';
import k1, { villageTalk } from '../chapters/modern/k1/chapter.js';
import script from '../chapters/modern/k1/script.js';
import { testWorld, touchSetup, sleep } from './bot.js';
import { PLAY } from '../chapters/kit/play.js';
import { terrainField } from '../chapters/kit/terrain.js';
import { showDocument } from '../core/minigame.js';
import { warshipArrives } from '../chapters/modern/k1/chapter.js';

test('k1 D-28: 마을 사람은 아무 차례로, 두 번째 사람은 이어 주는 말로 시작한다', () => {
  eq(villageTalk('scholar', new Set())[0], script.npc.scholar.first[0]);
  eq(villageTalk('scholar', new Set(['elder']))[0], script.npc.scholar.bridge);
  eq(villageTalk('elder', new Set(['scholar']))[0], script.npc.elder.bridge);
  eq(villageTalk('elder', new Set(['elder'])), script.npc.elder.later);
  ok(!script.npc.scholar.tooEarly && !script.npc.official.tooEarly, '차례 전에 막는 대사가 없다');
  ok(k1.anyOrder);
  ok(script.npc.official.first.some(l => l.who === 'me'), '관리 앞에서 학생의 결심');
});

test('k1 D-28: 놀이는 물건 나르기·해안 순찰·조약문·말 가려내기(팻말 찾기 없음)', () => {
  eq(k1.parts.map(p => p.type), ['drive', 'drive', 'doc', 'judge']);
  const regent = k1.parts[0]; // 2026-11-04: 공사장 기둥 → 경복궁 터 → 세금 관리 임무 → 양반 댁 세금 → 관리
  eq(regent.route.map(r => r.give || (r.drop ? 'drop' : '')), ['log', 'drop', '', 'sack', 'drop']);
  ok(regent.route.every(r => Number.isFinite(r.x) && r.label), '자리와 이름표');
  ok(regent.done.some(l => l.who === 'daewongun'), '척화 한 줄');
  const rumor = k1.parts[3];
  ok(!rumor.arena, '마을에서 백성들 이야기를 듣는다');
  eq(rumor.items.filter(x => x.correct).length, 2);
  ok(rumor.items.every(x => x.talk?.length && Number.isFinite(x.x)));
  ok(k1.parts.every(p => p.goal), '부분마다 목표 문장');
});

test('k1 D-28: 마을 어귀 문과 이름판, 문 앞은 걸어 들어올 수 있게 비어 있다', () => {
  const w = testWorld();
  try {
    const s = k1.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(w.closeView, '낮은 카메라');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 7 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('k1 D-28: 조약문은 연무당 무대(탁자 앞)에서 읽고, 망루에서는 일본 군함이 다가온다', () => {
  const paper = k1.parts[2], coast = k1.parts[1];
  ok(paper.arena && paper.arena.props.some(p => p.type === 'desk'), '연무당 탁자');
  ok(Math.hypot(paper.from[0], paper.from[1] + 6) < 3, '탁자 바로 앞');
  eq(typeof coast.route[1].scene, 'function');
  ok(!coast.arena.props.some(p => p.type === 'steamship'), '군함은 처음부터 서 있지 않다');
});

// ── D-30 ──
test('k1 D-30 C-01: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 간판 대사는 사람 대사로 옮겼다', () => {
  eq(script.goals.length, 6);
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(!script.npc.signTreaty && !script.npc.signWest, '간판 npc 항목은 지웠다');
  const lines = [...k1.parts.flatMap(p => p.intro || []), ...script.result].filter(l => l.text);
  ok(lines.some(l => l.text.includes('최초의 근대적 조약') && l.src), '강화도 조약 간판 내용');
  ok(lines.some(l => l.text.includes('서양 여러 나라') && l.src), '서양과의 조약 간판 내용');
  ok(k1.layout.signs.every(s => s.plaque), '길 위 안내판 없음');
});

test('k1 D-30 C-02·C-03: 도입 장면은 문장마다 한 장면, 끝나면 더한 것을 치우고, 빛나는 문은 빈 땅에 선다', () => {
  const w = testWorld();
  try {
    k1.buildScene(w);
    ok(k1.portal && k1.portal.at, 'portal');
    const [px, pz] = k1.portal.at, fx = px + Math.sin(k1.portal.ry) * 1.2, fz = pz + Math.cos(k1.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    const n0 = w.level.children.length;
    const film = k1.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물·배가 더해졌다');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
  } finally { w.dispose(); }
});

test('k1 D-30 C-05: 둘째 놀이부터는 그 사람에게 가서 말을 걸어야 시작한다', () => {
  const who = k1.parts.slice(1).map(p => p.intro?.[0]?.meet?.who);
  eq(who, ['elder', 'official', 'scholar']);
  ok(!k1.parts[0].intro?.[0]?.meet, '첫 놀이는 관리 대화 뒤 바로');
  for (const p of k1.parts.slice(1)) ok(p.intro.slice(1).every(l => l.who === p.intro[0].meet.who), '말 건 사람이 놀이를 알려 준다');
});

test('k1 D-30 D-02: 망루에서 바다를 살피는 남은 시간이 화면 가운데에 크게 보인다', async () => {
  eq(k1.parts[1].route[1].holdCenter, true);
  const s = touchSetup(script.speakers);
  try {
    const p = PLAY.drive(s.ctx, { arena: { origin: [300, 0], bounds: { x0: -20, x1: 20, z0: -20, z1: 20 } }, from: [0, 10], seconds: 60, route: [{ x: 0, z: 0, hold: 2, holdLabel: '바다를 살피는 중', holdCenter: true }] }, false);
    s.w.player.position.set(300, 0, 0);
    for (let i = 0; i < 6; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    const wait = s.ui.querySelector('.hud-bigwait');
    ok(wait && !wait.hidden && wait.classList.contains('center'), '가운데 큰 글씨');
    for (let i = 0; i < 40; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    eq(await p, true);
    ok(wait.hidden && !wait.classList.contains('center'), '끝나면 숨고 보통 자리로');
  } finally { s.done(); }
});

test('k1 D-30 D-03: 해안 무대의 앞쪽은 모두 바다다(군함이 지나는 곳에 산·언덕이 없다)', () => {
  for (const arena of [k1.parts[1].arena, k1.parts[2].arena]) {
    const f = terrainField({ bounds: arena.bounds, props: [...arena.props, ...(arena.center || [])], margin: 13, hill: 0.8 });
    for (let x = -80; x <= 80; x += 4) for (let z = -140; z <= arena.bounds.z0 - 10; z += 4) ok(f.heightAt(x, z) <= 0, `바다 앞에 언덕 (${x}, ${z})`);
    ok(!arena.props.some(p => p.type === 'island'), '섬 없음');
  }
});

test('k1 D-30 D-04: 군함이 쏜 포탄이 날아가 육지에 떨어져 터진다(불꽃·흙먼지·소리)', async () => {
  const w = testWorld();
  const sounds = [], cleanups = [];
  try {
    const g = new THREE.Group(); w.level.add(g);
    const s = { at: (x, z) => ({ x, z }), cleanup: f => cleanups.push(f) };
    let done = false;
    warshipArrives({ world: w, audio: { play: k => sounds.push(k) } }, s, g).then(() => { done = true; });
    const seen = { shell: 0, blast: [] };
    for (let i = 0; i < 220 && !done; i++) {
      w.step(1 / 20, { x: 0, z: 0 });
      g.traverse(o => { if (o.name === 'shell') seen.shell += 1; if (o.name === 'blast' && !seen.blast.includes(o)) seen.blast.push(o); });
      await (i % 40 === 0 ? sleep(0) : null);
    }
    ok(done, '장면이 끝난다');
    ok(seen.shell > 0, '날아가는 포탄');
    ok(seen.blast.length >= 3, `육지에 맞은 곳 ${seen.blast.length}`);
    for (const b of seen.blast) ok(b.position.z > -18 && b.position.z < 0 && b.position.y < 0.5, `육지(바닷가)에 떨어진다 (${b.position.x.toFixed(1)}, ${b.position.z.toFixed(1)})`);
    ok(seen.blast.every(b => b.userData.dust > 0), '흙먼지');
    ok(sounds.filter(k => k === 'boom').length >= 6, '쏘는 소리와 터지는 소리');
  } finally { cleanups.forEach(f => f()); w.dispose(); }
});

test('k1 D-30 D-05: 조약문은 낡은 두루마리(양끝 축·얼룩), 작은 글씨 없이 보인다. 다른 문서는 예전 모양', async () => {
  eq(k1.parts[2].scroll, true);
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const items = [{ text: '첫째 조항', note: '작은 설명' }];
    const p = showDocument({ ui }, { title: 't', heading: '조약문', items, src: ['S51'], scroll: true });
    const sc = ui.querySelector('.screen.doc .doc-scroll');
    ok(sc, '두루마리');
    eq(sc.querySelectorAll('.scroll-rod').length, 2, '양끝 축');
    ok(sc.querySelector('.scroll-stain'), '얼룩');
    ok(!ui.querySelector('.screen.doc small'), '조약문 아래 작은 글씨 없음');
    ok(!ui.textContent.includes('S51') && ui.textContent.includes('첫째 조항'));
    ui.querySelector('.doc-ok').click(); eq(await p, true);
    const p2 = showDocument({ ui }, { title: 't', heading: 'h', items });
    ok(!ui.querySelector('.doc-paper small') && !ui.querySelector('.doc-scroll'), '다른 장도 작은 글씨 해설 없음(2026-11-04)');
    ui.querySelector('.doc-ok').click(); await p2;
  } finally { ui.remove(); }
});

test('k1 D-30 D-06: 연무당 앞 사람들 머리 위에는 느낌표', async () => {
  eq(k1.parts[3].mark, '!');
  const s = touchSetup(script.speakers);
  try {
    const p = PLAY.judge(s.ctx, { arena: { origin: [300, 0], bounds: { x0: -20, x1: 20, z0: -20, z1: 20 } }, from: [0, 10], mark: '!', question: 'q', options: ['맞아요', '아니에요'], items: [{ look: 'peasant', x: 0, z: 0, talk: [], correct: true }] }, false);
    const marks = []; s.w.level.traverse(o => { if (o.isSprite && o.userData.text) marks.push(o.userData.text); });
    ok(marks.includes('!') && !marks.includes('?'), marks.join(','));
    p.catch(() => {});
  } finally { s.done(); }
});

// 플레이 점검(2026-11-04, 선생님: 근대~현대를 학생처럼 직접 플레이하며 오류·개선점 찾기) — 화면 구도
test('k1 플레이 점검: 도입 첫 장면은 카메라 바로 앞의 관리를 숨기고(얼굴 반쪽이 화면 끝에 걸림), 끝나면 다시 보인다', () => {
  const w = testWorld();
  try {
    k1.buildScene(w);
    const off = w.npcs.get('official').mesh, film = k1.introScene({ world: w });
    film.shots[0].act({ world: w });
    eq(off.visible, false, '첫 장면 동안 숨김');
    film.done();
    eq(off.visible, true, '끝나면 다시');
  } finally { w.dispose(); }
});

test('k1 플레이 점검: 도입 바닷가와 망루에서 보는 배는 뱃머리만이 아니라 옆모습(물레바퀴·굴뚝)이 보인다', async () => {
  const w = testWorld(), cleanups = [];
  try {
    k1.buildScene(w);
    const n0 = new Set(w.level.children), film = k1.introScene({ world: w });
    const ship = w.level.children.find(o => !n0.has(o) && !o.userData.legs);
    film.shots[1].act({ world: w });
    for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 });
    ok(Math.abs(Math.sin(ship.rotation.y)) > 0.9, `도입 배 옆모습 ${ship.rotation.y.toFixed(2)}`);
    film.done();
    const g = new THREE.Group(); w.level.add(g);
    const s = { at: (x, z) => ({ x, z }), cleanup: f => cleanups.push(f) };
    warshipArrives({ world: w, audio: { play: () => {} } }, s, g);
    const war = g.children[0]; let side = null;
    for (let i = 0; i < 120 && side === null; i++) { w.step(1 / 20, { x: 0, z: 0 }); if (g.children.some(o => o.name === 'shell')) side = Math.abs(Math.sin(war.rotation.y)); if (i % 40 === 0) await sleep(0); }
    ok(side > 0.9, `첫 포를 쏠 때 군함 옆모습 ${side}`);
  } finally { cleanups.forEach(f => f()); w.dispose(); }
});

test('k1 플레이 점검: 해안 순찰에서 말하는 선비(망루)·관리(포대)가 그 자리에 서 있다(목소리만 들리던 것)', () => {
  const r = k1.parts[1].route;
  eq(r[1].look, 'scholar'); eq(r[2].look, 'joseonOfficial');
  eq(r[1].talk[0].who, 'scholar'); eq(r[2].talk[0].who, 'official');
});

// 2026-11-12 선생님: 시대에 안 맞는 복장(1860년대 양반이 양복)과 맨땅 봉화를 고친다
test('k1 시대: 양반은 갓과 도포 차림이고, 봉화는 돌로 쌓은 봉수대 위에서 오른다', async () => {
  const { LOOKS } = await import('../content/characters.js');
  const lk = script.parts.regent.route.find(r => r.label === '양반 댁').look;
  eq(lk, 'scholar'); eq(script.speakers.yangban.look, 'scholar'); eq(LOOKS[lk].hat, 'gat'); ok(LOOKS[lk].outfit !== 'suit', '양복이 아니다');
  { const srcs = (await Promise.all(['chapter.js', 'story.js'].map(f => fetch(`../chapters/modern/k1/${f}`).then(r => r.text())))).join('\n'); ok(!/'gentleman'/.test(srcs) && /'envoyWestern'/.test(srcs), '일본 사절은 모자 없는 양복 차림'); eq(LOOKS.envoyWestern.hat, 'short'); }
  ok(![script.parts.regent, script.parts.coast].some(p => p.route.some(r => r.look && LOOKS[r.look].outfit === 'suit')), '이 장의 놀이에 양복 차림은 없다');
  const s = touchSetup(script.speakers);
  try {
    const n0 = s.w.colliders.length;
    const p = PLAY.drive(s.ctx, { arena: { origin: [300, 0], bounds: { x0: -20, x1: 20, z0: -20, z1: 20 } }, from: [0, 10], seconds: 60, route: [{ x: 0, z: 0, press: '봉화 올리기', fire: true, look: 'joseonOfficial' }] }, false);
    let beacon = null; s.w.level.traverse(o => { if (o.name === 'beacon') beacon = o; });
    ok(beacon, '봉수대'); const top = new THREE.Box3().setFromObject(beacon).max.y; ok(top > 1.4, `봉수대 높이 ${top.toFixed(2)}`);
    const bp = beacon.getWorldPosition(new THREE.Vector3()), pp = new THREE.Vector3(300 + 1.6, 0, -0.6); // 그 자리 사람은 이름표 오른쪽(+1.6)에 선다
    ok(Math.hypot(bp.x - pp.x, bp.z - pp.z) > 1.6, '그 자리 사람과 겹치지 않는다'); ok(s.w.colliders.length > n0, '봉수대에 부딪힌다');
    s.w.player.position.set(300, 0, 0.5); for (let i = 0; i < 4; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    s.ctx.input.pressAction?.(); for (const f of s.actions || []) f();
    for (let i = 0; i < 30; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    let fire = null; s.w.level.traverse(o => { if (o.isPoints || (o.isMesh && o.material?.blending === THREE.AdditiveBlending)) { const y = o.getWorldPosition(new THREE.Vector3()).y; if (fire === null || y < fire) fire = y; } });
    if (fire !== null) ok(fire >= top - 0.6, `불이 봉수대 위에서 탄다(불 ${fire.toFixed(2)}, 대 ${top.toFixed(2)})`);
    void p;
  } finally { s.done(); }
});
