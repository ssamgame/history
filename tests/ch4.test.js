import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { LOOKS } from '../content/characters.js';
import ch4Script from '../chapters/ch4/script.js';
import { buildCh4Scene } from '../chapters/ch4/scene.js';
import { testWorld } from './bot.js';

test('ch4: script passes validation', () => eq(validateScript(ch4Script, SOURCES), []));

test('ch4: quiz answers and capital reason match the spec', () => {
  eq(ch4Script.quizzes.map(q => q.options[q.answer]), ['몽골군이 바다와 물에서 싸우는 데 약해서', '김윤후']);
  eq(ch4Script.capital.reason.options.find(o => o.correct).text, '몽골군을 상대로 바다와 물에서 싸우면 고려가 유리할 것입니다.');
  for (const [id, sp] of Object.entries(ch4Script.speakers)) if (id !== 'guide') ok(LOOKS[sp.look], id);
});

test('ch4: scene builds with npcs and areas', () => {
  const w = testWorld();
  const s = buildCh4Scene(w);
  ok(w.npcs.has('minister') && w.npcs.has('kimyunhu'), 'npcs');
  ok(s.areas.palace && s.areas.ganghwa && s.areas.cheoin && s.areas.chungju, 'four areas');
  eq(s.mongols.length, 8);
  ok(s.mongols.every(m => !m.group.visible), 'attackers start hidden');
  eq(s.documents.visible, true);
  w.dispose();
});

import * as THREE from 'three';
import ch4 from '../chapters/ch4/chapter.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import { touchSetup, touchBot, memSave, sleep } from './bot.js';
const answers = new Set([...ch4Script.quizzes.map(q => q.options[q.answer]), ch4Script.capital.reason.options.find(o => o.correct).text]);

test('ch4: completes with touch-only actions', async () => {
  const s = touchSetup(ch4Script.speakers);
  const bot = touchBot(s, { answers, mapPicks: ['ganghwa'] });
  try {
    const r = await runChapter(CHAPTERS[3], ch4, s.ctx, memSave());
    eq(r.quizCorrect, 2); eq(r.easyModeUsed, false); eq(r.stars, 3);
    eq(r.firstTryTotal, 2); eq(r.firstTryCorrect, 2);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch4: picking 개경 first gives a hint and retries', async () => {
  const s = touchSetup(ch4Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
  const bot = touchBot(s, { answers, mapPicks: ['gaegyeong', 'ganghwa'] });
  try {
    ch4.buildScene(s.w, s.ctx);
    await ch4.minigame(s.ctx);
    ok(said.includes(ch4Script.capital.places[0].hint), 'hint for 개경');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch4: approaching Mongols are on screen at any screen shape', () => {
  for (const aspect of [0.6, 0.75, 1, 1.33, 1.78, 2.2]) {
    const s = touchSetup(ch4Script.speakers);
    try {
      const sc = ch4.buildScene(s.w, s.ctx);
      s.w.camera.aspect = aspect;
      const f = sc.areas.cheoin.fit;
      s.w.fitFixedCamera(f.target, f.dir, f.points);
      s.w.camera.updateMatrixWorld();
      const v = new THREE.Vector3();
      for (const p of f.points) { v.set(...p).project(s.w.camera); ok(Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.92, `aspect ${aspect}: ${v.x.toFixed(2)},${v.y.toFixed(2)}`); }
    } finally { s.done(); }
  }
});

test('ch4: map and reason hints make no unsourced claims', () => {
  const hints = [...ch4Script.capital.places.map(p => p.hint), ...ch4Script.capital.reason.options.map(o => o.hint)].filter(Boolean);
  ok(!hints.some(h => h.includes('넓은 땅')), 'no claim about the size of Ganghwa');
});

test('ch4: the envoy incident comes before the invasion, with its source and an open culprit', () => {
  const lines = [...ch4Script.intro, ...ch4Script.jeogo.before, ...ch4Script.jeogo.after]; // 해설 카드 → 압록강 가 장면
  const story = lines.map(l => l.text).join(' ');
  const iEnvoy = story.indexOf('저고여'), iInvade = story.indexOf('1231년 8월');
  ok(iEnvoy >= 0 && iInvade > iEnvoy, 'envoy story first, then the 1231 invasion');
  ok(story.includes('밝혀지지 않았'), 'says the culprit is unknown');
  ok(lines.some(l => l.text.includes('저고여') && l.src.includes('S22')), 'envoy line cites S22');
  ok(ch4Script.npc.minister.first.some(l => l.text.includes('사신') && l.src && l.src.includes('S22')), 'minister mentions it');
});

test('ch4: Goryeo archers rise on the wall and a tapped Mongol is shot and falls', async () => {
  const { cheoinDefense } = await import('../chapters/ch4/chapter.js');
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    ok(sc.archers.length >= 4, 'archers exist');
    ok(sc.archers.every(a => !a.group.visible), 'hidden before the battle');
    const f = sc.areas.cheoin.fit;
    s.w.fitFixedCamera(f.target, f.dir, f.points);
    cheoinDefense(s.ctx, false);
    const step = n => { for (let i = 0; i < n; i++) s.w.step(0.05, { x: 0, z: 0 }); };
    step(20); // 1초: 궁수가 올라오고 첫 몽골군이 나타난다
    ok(sc.archers.every(a => a.group.visible), 'archers appear');
    const top = Math.max(...sc.archers.map(a => a.group.position.y));
    ok(top > 0.5, `archers stand up on the wall (y ${top.toFixed(2)})`);
    const btn = [...s.ui.querySelectorAll('.tap-target')].find(b => !b.hidden);
    ok(btn, 'a Mongol to shoot');
    const target = sc.mongols.find(m => m.group.visible);
    btn.click();
    step(2);
    ok(sc.arrows.some(a => a.visible), 'an arrow flies');
    ok(target.group.visible, 'the Mongol does not vanish at once');
    step(22); // 1.2초 뒤: 화살(0.85초 동안 날아감)이 닿아 쓰러지는 중
    ok(target.group.rotation.x < -0.6, `falls backward (rx ${target.group.rotation.x.toFixed(2)})`);
    step(40); // 2초 뒤: 쓰러진 몽골군은 치워진다
    ok(!target.group.visible, 'cleared after falling');
  } finally { s.done(); }
});

test('ch4: resume at minigame puts the player in the palace', () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    ch4.enterStage(s.ctx, 'minigame');
    eq(s.w.bounds, sc.areas.palace.bounds);
  } finally { s.done(); }
});

test('ch4: resume at quiz shows Chungju with the slave documents already burnt', () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    ch4.enterStage(s.ctx, 'quiz');
    eq(s.w.camMode, 'fixed');
    eq(s.w.player.visible, false);
    eq(sc.documents.visible, false, 'documents gone');
    eq(sc.fire.visible, true, 'fire still burning');
  } finally { s.done(); }
});
