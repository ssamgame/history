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
  eq(k1.parts.map(p => p.type), ['deliver', 'drive', 'doc', 'judge']);
  const regent = k1.parts[0];
  eq(regent.cards.map(c => c.carry), ['log', 'sack', 'letter']); // D-30 D-01: 셋, 다른 때의 일은 뺐다
  eq(regent.bins.length, 3);
  for (const b of regent.bins) eq(regent.cards.filter(c => c.bin === b.id).length, 1, `${b.label}에 놓을 것 하나`);
  const rumor = k1.parts[3];
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
  for (const arena of [k1.parts[1].arena, k1.parts[3].arena]) {
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
    ok(ui.querySelector('.doc-paper small') && !ui.querySelector('.doc-scroll'), '다른 장은 예전 모양 그대로');
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
