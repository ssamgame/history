// 성장의 재미(2026-11-10 선생님): 타임머신 키우기, 도전 쪽지(고려편), 역사 인물의 편지(고려편)
import { test, eq, ok } from './harness.js';
import { TM_STAGES, tmLevel, finishedCount, CHALLENGES, LETTERS, letterParts } from '../content/growth.js';
import { SOURCES } from '../content/sources.js';
import { LOOKS } from '../content/characters.js';
import { CHAPTERS } from '../chapters/index.js';
import { makeTimeMachine } from '../core/timemachine.js';
import { setupChallenge, findNoteSpot, NOTE_ID } from '../core/challenge.js';
import { showLetter, showLetterBox, showMachineUpgrade, showSeal } from '../core/growth-ui.js';
import { showMap, showChapterResult, createHud } from '../core/screens.js';
import { testWorld, memSave } from './bot.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const root = () => { const el = document.createElement('div'); document.body.appendChild(el); return el; };
const btn = (el, text) => [...el.querySelectorAll('button')].find(b => b.textContent.includes(text));

test('growth: 타임머신 단계 — 3~4장마다 부품이 하나씩(아홉 번), 단계가 오를 때마다 조각이 늘어난다', () => {
  eq(TM_STAGES.map(s => s.at), [0, 3, 6, 9, 12, 15, 18, 22, 26, 30]);
  for (let i = 1; i < TM_STAGES.length; i++) { const gap = TM_STAGES[i].at - TM_STAGES[i - 1].at; ok(gap === 3 || gap === 4, `${TM_STAGES[i].name}: ${gap}장 만에`); }
  eq([0, 2, 3, 5, 6, 9, 12, 15, 18, 21, 22, 26, 29, 30].map(tmLevel), [0, 0, 1, 1, 2, 3, 4, 5, 6, 6, 7, 8, 8, 9]);
  ok(TM_STAGES.every(s => s.name && s.parts)); eq(new Set(TM_STAGES.map(s => s.name)).size, TM_STAGES.length, '이름이 서로 다르다');
  eq(finishedCount({ data: { chapters: { ch1: {}, ch2: {} } } }), 2); eq(finishedCount(null), 0);
  const count = L => { const tm = makeTimeMachine({ level: L }); let n = 0; tm.group.traverse(o => { if (o.isMesh) n += 1; }); eq(tm.level, L); tm.dispose(); return n; };
  const n = TM_STAGES.map((_, L) => count(L));
  for (let i = 1; i < n.length; i++) ok(n[i] >= n[i - 1] + 3, `단계 ${i}: 조각 ${n[i - 1]} → ${n[i]}`);
  // 4단계부터 부스터가 넷(+가운데)이라 불꽃 다섯, 6단계부터 시간 고리가 돈다, 8단계부터 별 조각
  const flamesOf = L => { const tm = makeTimeMachine({ level: L }); tm.setFlame(1); tm.tick(0); let f = 0; tm.group.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'ConeGeometry' && o.material.type === 'MeshBasicMaterial') f += 1; }); tm.dispose(); return f; };
  eq([flamesOf(3), flamesOf(4), flamesOf(9)], [3, 5, 5]);
  const tm = makeTimeMachine({ level: 9 }); let glow = 0; const ring = [];
  tm.group.traverse(o => { if (o.isMesh && o.geometry.type === 'OctahedronGeometry') glow += 1; if (o.isMesh && o.geometry.type === 'TorusGeometry' && o.geometry.parameters.radius > 2.5 && o.position.y > 1) ring.push(o); });
  ok(glow >= 8, '별 조각과 큰 별'); ok(ring.length >= 2, '시간 고리 둘');
  tm.tick(0); const z0 = ring[0].rotation.z; tm.tick(1); ok(ring[0].rotation.z !== z0, '고리가 돈다');
  tm.dispose();
});

test('growth: 도전 쪽지와 편지는 고려편 여섯 장 — 사실마다 출처, 답은 보기 안, 4장은 "밝혀지지 않았어요"', () => {
  const ids = CHAPTERS.map(c => c.id);
  eq(Object.keys(CHALLENGES), ids); eq(Object.keys(LETTERS), ids);
  for (const id of ids) {
    const c = CHALLENGES[id], L = LETTERS[id];
    ok(c.task && c.sign && c.question && c.options.length === 3 && c.answer >= 0 && c.answer < 3, `${id} 쪽지`);
    ok(c.lines.length && c.lines.every(l => l.who === 'narr' && l.text && l.src?.length && l.src.every(s => SOURCES[s])), `${id} 안내판 글 출처`);
    ok(c.src.every(s => SOURCES[s]), `${id} 문제 출처`);
    ok(new Set(c.options).size === 3, `${id} 보기가 서로 다르다`);
    ok(LOOKS[L.from], `${id} 편지 보낸 사람 생김새 ${L.from}`); ok(L.name && L.when && L.seal && L.src.every(s => SOURCES[s]), `${id} 편지 출처`);
    const parts = letterParts(L.body); ok(parts.some(p => p.strong) && parts.some(p => !p.strong), `${id} 편지에 강조한 사실`);
    ok(!L.body.includes('장군'), `${id}: "장군" 호칭은 쓰지 않는다`);
  }
  ok(CHALLENGES.ch4.lines[0].text.includes('누가 죽였는지는 끝내 밝혀지지 않았어요'), '4장 저고여 사건');
  eq(letterParts('가 *나* 다'), [{ text: '가 ', strong: false }, { text: '나', strong: true }, { text: ' 다', strong: false }]);
});

test('growth: 도전 쪽지 — 탐험이 시작되면 숨은 안내판이 서고, 틀리면 다시, 맞히면 금빛 도장과 저장, 끝나면 치운다', async () => {
  const world = testWorld(), save = memSave(), ui = root();
  try {
    world.bounds = { x0: -12, x1: 12, z0: -10, z1: 10 }; world.player.position.set(0, 0, 6); world.player.rotation.y = Math.PI;
    world.addCollider({ x: -6.5, z: 6, r: 2 }); // 왼쪽 첫 자리는 막혀 있다
    const said = [], hudCalls = []; let pick = 2;
    const ctx = { world, ui, testHooks: {}, hud: { setChallenge: (t, d) => hudCalls.push([t, !!d]) },
      dialogue: { say: l => { said.push(l.text); return Promise.resolve(); }, choose: () => Promise.resolve(pick), close() {} } };
    const meta = CHAPTERS[1], ch = setupChallenge(ctx, meta, save);
    ok(ch && !ch.done); eq(world.npcs.has(NOTE_ID), false, '탐험 전에는 없다');
    ch.place(); ch.place();
    const sp = world.npcs.get(NOTE_ID); ok(sp && sp.spot, '안내판'); eq([...world.npcs.keys()].filter(k => k === NOTE_ID).length, 1);
    const { x, z } = sp.mesh.position, b = world.bounds;
    ok(x > b.x0 + 1 && x < b.x1 - 1 && z > b.z0 + 1 && z < b.z1 - 1, '걷는 곳 안'); ok(Math.hypot(x + 6.5, z - 6) > 3.5, '막힌 자리는 피한다');
    const d = Math.hypot(x - 0, z - 6); ok(d >= 3.5 && d <= 14, `학생에게서 ${d.toFixed(1)}m`);
    ok(world.colliders.filter(c => c !== sp.collider).every(c => Math.hypot(c.x - x, c.z - z) > c.r + 1.3), '건물·사람과 떨어진 곳');
    eq(hudCalls[0], [CHALLENGES.ch2.task, false]); ok(said[0].includes('도전 쪽지가 왔어'));
    await ch.read(); ok(!ch.done && !save.quest('ch2'), '틀리면 아직'); ok(said.at(-1).includes('다시 읽고'));
    pick = CHALLENGES.ch2.answer;
    const p = ch.read(); await sleep(30); ok(ui.querySelector('.gold-seal-mark').textContent.includes('잘했어요'), '금빛 도장 「참 잘했어요」'); await p;
    ok(ch.done && save.quest('ch2')); eq(hudCalls.at(-1), [CHALLENGES.ch2.task, true]); ok(!ui.querySelector('.gold-seal'), '도장은 저절로 사라진다');
    const n0 = world.colliders.length; ch.remove(); eq(world.npcs.has(NOTE_ID), false); eq(world.colliders.length, n0 - 1);
    eq(setupChallenge(ctx, meta, save), null, '해낸 쪽지는 다시 내지 않는다');
    eq(setupChallenge(ctx, { id: 'j1' }, save), null, '쪽지가 없는 장');
    // 저장했다가 다시 읽어도 남는다
    ok(save.quest('ch2') && !save.quest('ch1'));
    world.npcs.clear(); world.colliders.length = 0; world.bounds = { x0: -1, x1: 1, z0: -1, z1: 1 }; eq(findNoteSpot(world), null, '자리가 없으면 쪽지 없이');
  } finally { ui.remove(); world.dispose?.(); }
});

test('growth: 퀘스트 목록의 도전 쪽지 줄은 퀘스트가 바뀌어도 남고, 결과 카드·장 고르기에 표시된다', async () => {
  const ui = root();
  try {
    const hud = createHud(ui, { touch: false }); hud.show(CHAPTERS[0]);
    hud.setChallenge('숨은 안내판 찾기'); hud.setGoal('가', [1, 2], ['가', '나']); hud.setGoal('나', [2, 2], ['가', '나']);
    const li = ui.querySelector('.quest.note'); ok(li && li.textContent.includes('✦ 도전 쪽지') && li.textContent.includes('숨은 안내판 찾기'));
    eq(ui.querySelectorAll('.quest.note').length, 1);
    hud.setChallenge('숨은 안내판 찾기', true); ok(ui.querySelector('.quest.note.got').textContent.includes('참 잘했어요'));
    hud.setChallenge(null); ok(!ui.querySelector('.quest.note'));
    ui.innerHTML = '';
    const r = { stars: 3, quizCorrect: 2, quizTotal: 2, firstTryCorrect: 1, firstTryTotal: 1, seconds: 300 };
    const p1 = showChapterResult(ui, CHAPTERS[0], r, { quest: true }); ok(ui.querySelector('.result-quest.got')); btn(ui, '다음').click(); await p1;
    const p2 = showChapterResult(ui, CHAPTERS[0], r, { quest: false }); ok(ui.querySelector('.result-quest') && !ui.querySelector('.result-quest.got')); btn(ui, '다음').click(); await p2;
    const p3 = showChapterResult(ui, CHAPTERS[0], r); ok(!ui.querySelector('.result-quest'), '쪽지가 없는 장'); btn(ui, '다음').click(); await p3;
    const save = memSave(); save.finishChapter('ch1', r); save.setQuest('ch1');
    let opened = 0; const pm = showMap(ui, CHAPTERS, save, { onLetters: () => { opened += 1; } });
    eq(ui.querySelectorAll('.stop-quest').length, 1, '도전 쪽지를 해낸 장만 금빛 표시'); ok(ui.querySelector('[data-chapter="ch1"] .stop-quest'));
    btn(ui, '편지함').click(); eq(opened, 1); ui.querySelector('.screen').remove(); void pm;
    const pm2 = showMap(ui, CHAPTERS, memSave(), { onLetters: () => {} }); ok(!btn(ui, '편지함'), '받은 편지가 없으면 단추도 없다'); ui.querySelector('.screen').remove(); void pm2;
  } finally { ui.remove(); }
});

test('growth: 편지 — 장을 마치면 인물의 편지(내 이름·강조한 사실·도장), 편지함에서 받은 것만 다시 읽는다', async () => {
  const ui = root();
  try {
    const p = showLetter(ui, 'ch2', { name: '김여행', have: 2, total: 6 });
    const card = ui.querySelector('.letter'); ok(card.textContent.includes('시간 여행자 김여행에게') && card.textContent.includes('양규의 편지'));
    ok(card.querySelector('.letter-face').style.backgroundImage.includes('data:image'), '보낸 사람 얼굴');
    ok(card.querySelectorAll('.letter-body b').length >= 2, '강조한 사실'); ok(!card.textContent.includes('*'));
    ok(ui.textContent.includes('편지함 2/6'));
    btn(ui, '편지함에 넣기').click(); eq(await p, true); eq(await showLetter(ui, 'j1'), false, '편지가 없는 장');
    const save = memSave(); save.setName('김여행'); save.finishChapter('ch1', { stars: 2 }); save.finishChapter('ch3', { stars: 3 });
    const pb = showLetterBox(ui, CHAPTERS, save);
    eq(ui.querySelectorAll('.letter-tab').length, 6); eq(ui.querySelectorAll('.letter-tab:disabled').length, 4, '안 받은 편지는 잠김');
    ok(ui.querySelector('.letter').textContent.includes('서희의 편지'));
    ui.querySelector('[data-letter-tab="ch3"]').click(); ok(ui.querySelector('.letter').textContent.includes('강감찬의 편지'));
    for (const b of ui.querySelectorAll('button:not(:disabled)')) { const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 40, `단추 크기 ${b.textContent}`); }
    btn(ui, '닫기').click(); await pb;
    const pe = showLetterBox(ui, CHAPTERS, memSave()); ok(ui.textContent.includes('아직 받은 편지가 없어요')); btn(ui, '닫기').click(); await pe;
  } finally { ui.remove(); }
});

test('growth: 타임머신에 새 부품이 붙으면 알림 — 부품 이름과 다음 부품까지 남은 장', async () => {
  const ui = root();
  try {
    const p = showMachineUpgrade(ui, 1, { preview: false, done: 3 });
    ok(ui.textContent.includes('타임머신이 자랐어요') && ui.textContent.includes('금빛 시계'));
    ok(ui.textContent.includes('다음 부품 「단청 날개」: 6장을 마치면 (지금 3장)'));
    btn(ui, '멋지다').click(); await p; ok(!ui.querySelector('.tmup'));
    const p4 = showMachineUpgrade(ui, 9, { preview: false, done: 30 }); ok(ui.textContent.includes('모든 부품을 모았어요')); btn(ui, '멋지다').click(); await p4;
    const s = showSeal(ui, '시험', 40); ok(ui.querySelector('.gold-seal-text').textContent === '시험'); await s; ok(!ui.querySelector('.gold-seal'));
  } finally { ui.remove(); }
});
