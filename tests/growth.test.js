// 성장의 재미(2026-11-10·11 선생님): 타임머신 키우기(부품 떼었다 붙이기), 역사 인물의 편지(고려편). 도전 쪽지는 2026-11-11에 뺐다
import { test, eq, ok } from './harness.js';
import { TM_STAGES, tmLevel, tmParts, finishedCount, LETTERS, letterParts } from '../content/growth.js';
import * as GROWTH from '../content/growth.js';
import { SOURCES } from '../content/sources.js';
import { LOOKS } from '../content/characters.js';
import { CHAPTERS } from '../chapters/index.js';
import { makeTimeMachine } from '../core/timemachine.js';
import { showLetter, showLetterBox, showMachineUpgrade, showMachineShop } from '../core/growth-ui.js';
import * as GROWTH_UI from '../core/growth-ui.js';
import { showMap, showMenu, createHud } from '../core/screens.js';
import { runChapter } from '../core/flow.js';
import { memSave } from './bot.js';

const root = () => { const el = document.createElement('div'); document.body.appendChild(el); return el; };
const btn = (el, text) => [...el.querySelectorAll('button')].find(b => b.textContent.includes(text));
const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
const meshes = tm => { let n = 0; tm.group.traverse(o => { if (o.isMesh && shown(o)) n += 1; }); return n; };

test('growth: 타임머신 단계 — 3~4장마다 부품이 하나씩(아홉 번), 단계가 오를 때마다 보이는 조각이 늘어난다', () => {
  eq(TM_STAGES.map(s => s.at), [0, 3, 6, 9, 12, 15, 18, 22, 26, 30]);
  for (let i = 1; i < TM_STAGES.length; i++) { const gap = TM_STAGES[i].at - TM_STAGES[i - 1].at; ok(gap === 3 || gap === 4, `${TM_STAGES[i].name}: ${gap}장 만에`); }
  eq([0, 2, 3, 5, 6, 9, 12, 15, 18, 21, 22, 26, 29, 30].map(tmLevel), [0, 0, 1, 1, 2, 3, 4, 5, 6, 6, 7, 8, 8, 9]);
  ok(TM_STAGES.every(s => s.name && !s.parts), '부품은 이름만(설명 없음)'); eq(new Set(TM_STAGES.map(s => s.name)).size, TM_STAGES.length, '이름이 서로 다르다');
  eq(finishedCount({ data: { chapters: { ch1: {}, ch2: {} } } }), 2); eq(finishedCount(null), 0);
  const n = TM_STAGES.map((_, L) => { const tm = makeTimeMachine({ level: L }); eq(tm.parts, Array.from({ length: L }, (_, i) => i + 1)); const c = meshes(tm); tm.dispose(); return c; });
  for (let i = 1; i < n.length; i++) ok(n[i] >= n[i - 1] + 3, `단계 ${i}: 조각 ${n[i - 1]} → ${n[i]}`);
  // 4번 부품(쌍부스터)을 붙이면 불꽃 다섯, 6번 시간 고리는 돈다, 8번 별 조각
  const flamesOf = parts => { const tm = makeTimeMachine({ parts }); tm.setFlame(1); tm.tick(0); let f = 0; tm.group.traverse(o => { if (o.isMesh && shown(o) && o.userData.len) f += 1; }); tm.dispose(); return f; };
  eq([flamesOf([1, 2, 3]), flamesOf([4]), flamesOf([1, 2, 3, 4, 5, 6, 7, 8, 9])], [3, 5, 5]);
  const tm = makeTimeMachine({ level: 9 }); let glow = 0; const ring = [];
  tm.group.traverse(o => { if (o.isMesh && o.geometry.type === 'OctahedronGeometry') glow += 1; if (o.isMesh && o.geometry.type === 'TorusGeometry' && o.geometry.parameters.radius > 2.5 && o.position.y > 1) ring.push(o); });
  ok(glow >= 8, '별 조각과 큰 별'); ok(ring.length >= 2, '시간 고리 둘');
  tm.tick(0); const z0 = ring[0].rotation.z; tm.tick(1); ok(ring[0].rotation.z !== z0, '고리가 돈다');
  tm.dispose();
});

test('growth: 타임머신 부품은 따로따로 떼었다 붙인다 — 하나만 붙여도 되고, 살아 있는 타임머신도 바로 바뀐다', () => {
  const tm = makeTimeMachine({ parts: [] }), base = meshes(tm);
  eq(tm.parts, []);
  const alone = [];
  for (let n = 1; n <= 9; n++) { tm.setParts([n]); eq(tm.parts, [n]); alone.push(meshes(tm) - base); }
  ok(alone.every(c => c >= 3), `부품 하나만 붙여도 조각이 보인다: ${alone}`);
  tm.setParts([2, 7]); const two = meshes(tm); eq(two, base + alone[1] + alone[6], '부품끼리 섞이지 않는다');
  // 날개 끝 등불(3번)·날개 위 깃발(5번)은 날개(2번)에 얹힌다: 날개를 떼면 함께 안 보이고 다시 붙이면 돌아온다
  tm.setParts([2, 3, 5]); const withWing = meshes(tm); tm.setParts([3, 5]); ok(meshes(tm) < withWing - alone[1], '날개를 떼면 날개 위 조각도');
  tm.setParts([2, 3, 5]); eq(meshes(tm), withWing);
  // 9번(시간의 달인)을 붙이면 불꽃이 푸르고, 떼면 주황으로 돌아온다
  const flame = []; tm.group.traverse(o => { if (o.userData.len) flame.push(o); });
  tm.setParts([9]); ok(flame.every(f => f.material.color.getHex() === 0x8fd8ff)); tm.setParts([]); ok(flame.every(f => f.material.color.getHex() === 0xffb040));
  eq(meshes(tm), base, '모두 떼면 기본 타임머신');
  tm.dispose();
  // 저장: 얻은 부품(1~단계) 가운데 떼어 둔 것만 빠진다. 새로 얻는 부품은 붙은 채로 온다
  const save = memSave(); eq(tmParts(save), []);
  for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6']) save.finishChapter(id, { stars: 1 });
  eq(tmParts(save), [1, 2]); save.setTmOff([1]); eq(tmParts(save), [2]);
  for (const id of ['j1', 'j2', 'j3']) save.finishChapter(id, { stars: 1 });
  eq(tmParts(save), [2, 3], '새 부품은 붙어서 온다'); save.setTmOff([]); eq(tmParts(save), [1, 2, 3]);
});

test('growth: 타임머신 꾸미기 — 얻은 부품을 눌러 떼고 붙이고, 못 얻은 부품은 잠김, 바꿀 때마다 저장하고 알린다', async () => {
  const ui = root();
  try {
    const save = memSave(); for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'j1']) save.finishChapter(id, { stars: 1 });
    let changed = 0; const p = showMachineShop(ui, save, { preview: false, onChange: () => { changed += 1; } });
    const cards = [...ui.querySelectorAll('.tmshop-part')]; eq(cards.length, 9);
    eq(cards.filter(b => !b.disabled).length, 2, '얻은 부품 둘만 누를 수 있다'); eq(cards.filter(b => b.classList.contains('on')).length, 2);
    eq(cards.map(b => b.textContent), TM_STAGES.slice(1).map(s => s.name), '부품 이름만 보인다(설명 글 없음)'); eq(ui.querySelector('.tmshop-count').textContent, '');
    cards[0].click(); eq(save.data.tmOff, [1]); eq(tmParts(save), [2]); eq(changed, 1); ok(!cards[0].classList.contains('on'));
    eq(cards[0].getAttribute('aria-pressed'), 'false');
    cards[0].click(); eq(save.data.tmOff, []); eq(changed, 2);
    cards[2].click(); eq(save.data.tmOff, [], '잠긴 부품은 눌러도 그대로');
    btn(ui, '모두 떼기').click(); eq(tmParts(save), []); btn(ui, '모두 붙이기').click(); eq(tmParts(save), [1, 2]);
    for (const b of ui.querySelectorAll('button')) { const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 40, `단추 크기 ${b.textContent}`); }
    btn(ui, '닫기').click(); await p; ok(!ui.querySelector('.tmshop'));
    const p0 = showMachineShop(ui, memSave(), { preview: false }); ok(ui.textContent.includes('아직 얻은 부품이 없어요')); ok(!btn(ui, '모두 떼기')); btn(ui, '닫기').click(); await p0;
  } finally { ui.remove(); }
});

test('growth: 편지는 고려편 여섯 장 — 사실마다 출처, "장군" 호칭 없음. 도전 쪽지는 없다(2026-11-11 선생님)', () => {
  const ids = CHAPTERS.map(c => c.id);
  eq(Object.keys(LETTERS), ids);
  for (const id of ids) {
    const L = LETTERS[id];
    ok(LOOKS[L.from], `${id} 편지 보낸 사람 생김새 ${L.from}`); ok(L.name && L.when && L.seal && L.src.every(s => SOURCES[s]), `${id} 편지 출처`);
    const parts = letterParts(L.body); ok(parts.some(p => p.strong) && parts.some(p => !p.strong), `${id} 편지에 강조한 사실`);
    ok(!L.body.includes('장군'), `${id}: "장군" 호칭은 쓰지 않는다`);
  }
  eq(letterParts('가 *나* 다'), [{ text: '가 ', strong: false }, { text: '나', strong: true }, { text: ' 다', strong: false }]);
  ok(!('CHALLENGES' in GROWTH) && !('showSeal' in GROWTH_UI), '도전 쪽지 자료·금빛 도장은 뺐다');
  const ui = root();
  try { const hud = createHud(ui, { touch: false }); ok(!hud.setChallenge, '퀘스트 목록의 도전 쪽지 줄도 없다'); } finally { ui.remove(); }
});

test('growth: 장 고르기에 「타임머신」·「편지함」 단추, 게임 중 메뉴 두루마리에 「편지함」(받은 수)·「타임머신 꾸미기」', async () => {
  const ui = root();
  try {
    const save = memSave(); save.addLetter('ch1');
    let letters = 0, machine = 0; const pm = showMap(ui, CHAPTERS, save, { onLetters: () => { letters += 1; }, onMachine: () => { machine += 1; } });
    ok(btn(ui, '편지함').querySelector('.bang'), '장 고르기 편지함에도 느낌표'); btn(ui, '편지함').click(); btn(ui, '타임머신').click(); eq([letters, machine], [1, 1]); ok(!ui.querySelector('.stop-quest')); ui.querySelector('.screen').remove(); void pm;
    const pm2 = showMap(ui, CHAPTERS, memSave(), { onLetters: () => {} }); ok(!btn(ui, '편지함'), '받은 편지가 없으면 단추도 없다'); ok(!btn(ui, '타임머신')); ui.querySelector('.screen').remove(); void pm2;
    const m1 = showMenu(ui, { muted: false, quality: 'medium', letters: 2, machine: true }, () => {}); ok(btn(ui, '편지함').textContent.includes('2통') && btn(ui, '편지함').querySelector('.bang'), '안 읽은 편지 수와 느낌표'); btn(ui, '편지함').click(); eq(await m1, 'letters');
    const m2 = showMenu(ui, { muted: false, quality: 'medium', letters: 0, machine: true }, () => {}); ok(btn(ui, '편지함') && !btn(ui, '편지함').textContent.includes('통') && !btn(ui, '편지함').querySelector('.bang'), '다 읽었으면 숫자도 느낌표도 없다');
    for (const b of [...ui.querySelectorAll('button')].filter(x => x.offsetParent)) { const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 40 && r.bottom <= innerHeight + 1, `단추 ${b.textContent}`); }
    ok(!btn(ui, '캐릭터'), '한 번 정한 캐릭터는 바꾸지 못한다: 메뉴에 「내 캐릭터 바꾸기」가 없다');
    btn(ui, '타임머신').click(); eq(await m2, 'machine');
    const m3 = showMenu(ui, { muted: false, quality: 'medium' }, () => {}); ok(!btn(ui, '편지함') && !btn(ui, '타임머신')); btn(ui, '닫기').click(); await m3;
  } finally { ui.remove(); }
});

test('growth: 편지는 복습 퀴즈를 풀기 전에 받는다 — 놀이가 끝나면 편지, 그다음 퀴즈', async () => {
  const log = [];
  const chapter = { script: { intro: [] }, quizzes: [{ question: 'q', options: ['a', 'b'], answer: 0, explain: 'e' }], buildScene() {}, explore: async () => { log.push('explore'); }, minigame: async () => { log.push('minigame'); return { firstTryCorrect: 1, firstTryTotal: 1 }; } };
  const ctx = { testHooks: {}, hud: { setFound() {} }, dialogue: { quiz: async () => { log.push('quiz'); return { correct: true }; }, close() {} }, giveLetter: async m => { log.push(`letter:${m.id}`); } };
  await runChapter(CHAPTERS[0], chapter, ctx, memSave(), { resumeStage: 'explore' });
  eq(log, ['explore', 'minigame', 'letter:ch1', 'quiz']);
});

test('growth: 편지 — 인물의 편지(내 이름·강조한 사실·도장), 편지함에서 받은 것만 다시 읽는다', async () => {
  const ui = root();
  try {
    const p = showLetter(ui, 'ch2', { name: '김여행', have: 2, total: 6 });
    const card = ui.querySelector('.letter'); ok(card.textContent.includes('시간 여행자 김여행에게') && card.textContent.includes('양규의 편지'));
    ok(card.querySelector('.letter-face').style.backgroundImage.includes('data:image'), '보낸 사람 얼굴');
    ok(card.querySelectorAll('.letter-body b').length >= 2, '강조한 사실'); ok(!card.textContent.includes('*'));
    ok(ui.textContent.includes('편지함 2/6'));
    btn(ui, '편지함에 넣기').click(); eq(await p, true); eq(await showLetter(ui, 'j1'), false, '편지가 없는 장');
    const save = memSave(); save.setName('김여행'); save.addLetter('ch1'); save.finishChapter('ch3', { stars: 3 }); // 받은 편지, 그리고 예전 기록(마친 장)
    ok(save.hasLetter('ch1') && save.hasLetter('ch3') && !save.hasLetter('ch2'));
    const pb = showLetterBox(ui, CHAPTERS, save);
    eq(ui.querySelectorAll('.letter-tab').length, 6); eq(save.unreadLetters(['ch1', 'ch2', 'ch3']), 1, '펼친 1장 편지는 읽은 것, 3장은 아직'); eq(ui.querySelectorAll('.letter-tab .bang').length, 1); eq(ui.querySelectorAll('.letter-tab:disabled').length, 4, '안 받은 편지는 잠김');
    ok(ui.querySelector('.letter').textContent.includes('서희의 편지'));
    ui.querySelector('[data-letter-tab="ch3"]').click(); ok(ui.querySelector('.letter').textContent.includes('강감찬의 편지')); eq(save.unreadLetters(['ch1', 'ch3']), 0); ok(!ui.querySelector('.bang'), '읽으면 느낌표가 사라진다');
    for (const b of ui.querySelectorAll('button:not(:disabled)')) { const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 40, `단추 크기 ${b.textContent}`); }
    btn(ui, '닫기').click(); await pb;
    const pe = showLetterBox(ui, CHAPTERS, memSave()); ok(ui.textContent.includes('아직 받은 편지가 없어요')); btn(ui, '닫기').click(); await pe;
  } finally { ui.remove(); }
});

test('growth: 타임머신에 새 부품이 붙으면 알림 — 부품 이름과 다음 부품까지 남은 장', async () => {
  const ui = root();
  try {
    const p = showMachineUpgrade(ui, 1, { preview: false, done: 3 });
    ok(ui.textContent.includes('타임머신이 자랐어요') && ui.textContent.includes('금빛 시계')); ok(!ui.querySelector('.tmup-parts'), '부품 설명 글은 없다');
    ok(ui.textContent.includes('다음 부품 「단청 날개」: 6장을 마치면 (지금 3장)'));
    btn(ui, '멋지다').click(); await p; ok(!ui.querySelector('.tmup'));
    const p4 = showMachineUpgrade(ui, 9, { preview: false, done: 30 }); ok(ui.textContent.includes('모든 부품을 모았어요')); btn(ui, '멋지다').click(); await p4;
  } finally { ui.remove(); }
});
