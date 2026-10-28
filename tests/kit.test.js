// 근대·일제 강점기·현대편 장 공통 검사: 대본 출처, 장면(사람·안내판 자리), 터치만으로 끝까지 하기, 이어하기.
import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { MODERN, COLONIAL, PRESENT, isUnlocked } from '../chapters/index.js';
import { runChapter } from '../core/flow.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const KIT = [...MODERN, ...COLONIAL, ...PRESENT];

// 대본의 미니게임 부분에서 봇이 누를 정답을 모은다
function botAnswers(script) {
  const cardPicks = new Set(), sortPicks = {}, places = {}, orders = [];
  for (const p of Object.values(script.parts || {})) {
    if (p.type === 'choose') p.cards.filter(c => c.correct).forEach(c => cardPicks.add(c.text));
    if (p.type === 'sort') p.cards.forEach(c => { sortPicks[c.text] = c.bin; });
    if (p.type === 'order') orders.push(p.cards);
    if (p.type === 'place') for (const it of p.items) places[it.label] = [...(places[it.label] || []), ...p.slots.filter(s => s.answer === it.id).map(s => s.id)];
  }
  return { answers: new Set(script.quizzes.map(q => q.options[q.answer])), cardPicks, sortPicks, places, orders };
}

for (const meta of KIT) {
  test(`kit: ${meta.id} script, scene and signs`, async () => {
    const mod = (await meta.load()).default;
    eq(mod.id, meta.id);
    eq(validateScript(mod.script, SOURCES), []);
    eq(mod.script.quizzes.length, 2);
    ok(mod.script.intro.every(l => l.src && l.src.length), 'intro is sourced');
    const w = testWorld();
    try {
      mod.buildScene(w);
      const people = [...w.npcs.values()].filter(n => !n.spot), signs = [...w.npcs.values()].filter(n => n.spot);
      ok(people.length >= 3, `${meta.id}: ${people.length} people`);
      const plaques = (mod.layout?.signs || []).filter(x => x.plaque).length; // D-30 C-03: 건물 간판(이름만, 말 걸 수 없음)도 센다
      ok(signs.length + plaques >= 2, `${meta.id}: ${signs.length} signs`);
      const b = w.bounds, inside = m => m.position.x >= b.x0 && m.position.x <= b.x1 && m.position.z >= b.z0 && m.position.z <= b.z1;
      for (const n of [...people, ...signs]) {
        ok(inside(n.mesh), `${meta.id}/${n.id} reachable`);
        for (const c of w.colliders) {
          if (c === n.collider) continue;
          const d = Math.hypot(c.x - n.mesh.position.x, c.z - n.mesh.position.z);
          ok(d >= c.r + 0.4, `${meta.id}/${n.id} stuck in something at (${c.x}, ${c.z})`);
        }
      }
      for (const s of signs) {
        ok(mod.script.npc[s.id] && mod.script.npc[s.id].always.length, `${meta.id}/${s.id} has lines`);
        for (const p of people) ok(Math.hypot(s.mesh.position.x - p.mesh.position.x, s.mesh.position.z - p.mesh.position.z) >= 3.5, `${meta.id}/${s.id} too close to ${p.id}`);
      }
      for (const id of Object.keys(mod.script.npc)) ok(w.npcs.has(id), `${meta.id}: script talks to ${id} who is in the scene`);
    } finally { w.dispose(); }
  });

  test(`kit: ${meta.id} completes with touch-only actions`, async () => {
    const mod = (await meta.load()).default;
    const s = touchSetup(mod.script.speakers);
    const bot = touchBot(s, botAnswers(mod.script));
    try {
      const r = await runChapter(meta, mod, s.ctx, memSave());
      eq(r.quizCorrect, 2);
      eq(r.easyModeUsed, false);
      eq(r.firstTryCorrect, r.firstTryTotal, 'every part right the first time');
      eq(r.stars, 3);
    } finally { bot.stop(); s.done(); }
  }, { timeout: 150000 });

  test(`kit: ${meta.id} resumes at the quiz`, async () => {
    const mod = (await meta.load()).default;
    const s = touchSetup(mod.script.speakers);
    try {
      mod.buildScene(s.w, s.ctx);
      mod.enterStage(s.ctx, 'quiz');
      ok(s.w.player.visible !== false);
    } finally { s.done(); }
  });
}

test('kit: every new course opens its first chapter', () => {
  for (const list of [MODERN, COLONIAL, PRESENT]) eq(isUnlocked(list[0], { chapterResult: () => null }), true);
});

import { PIC } from '../chapters/modern/pictures.js';
test('kit: 역사책 쪽마다 그림이 있고, 근대 5장은 찾기 대신 근대 문물 역사책과 전차 손님이 있다', async () => {
  for (const meta of KIT) {
    const { script } = (await meta.load()).default;
    for (const p of Object.values(script.parts || {})) if (p.type === 'book') for (const pg of p.pages) ok(PIC[pg.pic], `${meta.id} ${pg.title}: 그림 ${pg.pic}`);
  }
  const k5 = (await import('../chapters/modern/k5/script.js')).default;
  ok(!Object.values(k5.parts).some(p => p.type === 'find'), '근대 문물 찾기는 뺐다');
  ok(k5.parts.goods.type === 'book' && k5.parts.goods.pages.length >= 6);
  ok(k5.parts.tram.route.some(r => r.alight && r.board), '정류장에서 손님이 타고 내린다');
});

import { DIORAMA } from '../chapters/modern/dioramas.js';
import { BUILD } from '../chapters/kit/town.js';
import { LOOKS } from '../content/characters.js';
import { readBook } from '../core/minigame.js';
test('kit: 역사책 쪽마다 3D 재현 그림 설계가 있고, 부품·생김새가 모두 있다', async () => {
  for (const meta of KIT) {
    const { script } = (await meta.load()).default;
    for (const p of Object.values(script.parts || {})) if (p.type === 'book') for (const pg of p.pages) {
      const d = DIORAMA[pg.pic]; ok(d, `${meta.id} ${pg.title}: 재현 그림 ${pg.pic}`);
      for (const pr of d?.props || []) ok(BUILD[pr.type], `${pg.pic}: 부품 ${pr.type}`);
      for (const [look] of d?.people || []) ok(LOOKS[look], `${pg.pic}: 생김새 ${look}`);
    }
  }
});

test('kit: 역사책은 그림이 찍히면 사진과 헷갈리지 않게 \'재현 그림\' 표를 단다', async () => {
  const ui = document.createElement('div'); document.body.append(ui);
  const pages = [{ title: '가', lines: [{ text: '글' }], scene: {}, figure: '<svg></svg>' }, { title: '나', lines: [{ text: '글' }], figure: '<svg id="f"></svg>' }];
  const done = readBook({ ui }, { title: '책', pages, render: () => 'data:image/png;base64,AA==' });
  for (let i = 0; i < 50 && !ui.querySelector('img.book-diorama'); i++) await new Promise(r => setTimeout(r, 20)); // 글을 먼저 보이고 그림은 곧바로 이어서
  ok(ui.querySelector('img.book-diorama'), '그림');
  eq(ui.querySelector('.book-badge')?.textContent, '재현 그림');
  ui.querySelector('.book-next').click(); await new Promise(r => setTimeout(r, 260));
  ok(!ui.querySelector('img.book-diorama') && ui.querySelector('#f'), '설계 없는 쪽은 예전 그림');
  ui.querySelector('.book-next').click(); await done; ui.remove();
});

test('kit: 근대 5장부터 현대편까지는 찾기·차례 맞히기 대신 역사책·문서·이정표 걷기로 본다 (선생님 의견)', async () => {
  const from = KIT.findIndex(m => m.id === 'k5');
  for (const meta of KIT.slice(from)) {
    const { script } = (await meta.load()).default;
    for (const [k, p] of Object.entries(script.parts || {})) ok(p.type !== 'find' && p.type !== 'stops', `${meta.id} ${k}: ${p.type}`);
  }
});
