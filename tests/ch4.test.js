import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { LOOKS } from '../content/characters.js';
import ch4Script from '../chapters/ch4/script.js';
import { buildCh4Scene } from '../chapters/ch4/scene.js';
import { testWorld } from './bot.js';

test('ch4: script passes validation', () => eq(validateScript(ch4Script, SOURCES), []));

test('ch4: quiz answers match the spec', () => {
  eq(ch4Script.quizzes.map(q => q.options[q.answer]), ['몽골군이 바다와 물에서 싸우는 데 약해서', '김윤후']);
  eq(ch4Script.quizzes[1].question, '처인성과 충주성에서 몽골군에 맞선 승려는?');
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
const answers = new Set(ch4Script.quizzes.map(q => q.options[q.answer]));

test('ch4: completes with touch-only actions', async () => {
  const s = touchSetup(ch4Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS.find(c => c.id === 'ch4'), ch4, s.ctx, memSave());
    eq(r.quizCorrect, 2); eq(r.easyModeUsed, false); eq(r.stars, 3);
    eq(r.firstTryTotal, 2); eq(r.firstTryCorrect, 2);
  } finally { bot.stop(); s.done(); }
}, { timeout: 240000 });

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

test('ch4: the capital scene is a map with three places and no picking', () => {
  eq(ch4Script.capital.places.map(p => p.label), ['개경 (지금 도읍)', '서경 (평양)', '강화도']);
  ok(ch4Script.capital.places.every(p => !p.hint), 'no hints: nothing to pick');
});

test('ch4: the envoy incident comes before the invasion, with its source and an open culprit', () => {
  const lines = [...ch4Script.intro, ...ch4Script.jeogo.before, ...ch4Script.jeogo.after]; // 해설 카드 → 압록강 가 장면
  const story = lines.map(l => l.text).join(' ');
  const iEnvoy = story.indexOf('저고여'), iInvade = story.indexOf('1231년 8월');
  ok(iEnvoy >= 0 && iInvade > iEnvoy, 'envoy story first, then the 1231 invasion');
  ok(story.includes('밝혀지지 않았'), 'says the culprit is unknown');
  ok(lines.some(l => l.text.includes('저고여') && l.src.includes('S22')), 'envoy line cites S22');
  ok(ch4Script.jeogo.after[1].text.includes('고려 탓') && ch4Script.jeogo.after[1].src.includes('S22'), 'the invasion follows from it');
});

test('ch4: the capital map stops the Mongol arrow at the sea before 강화도', async () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx), M = sc.areas.capitalMap;
    const p = M.play();
    for (let i = 0; i < 90; i++) s.w.step(0.05, { x: 0, z: 0 });
    await p;
    ok(M.group.visible && M.stop.visible, 'map and stop mark');
    const [, , g] = M.routes, [ix, iz] = M.places.ganghwa;
    ok(Math.hypot(g.mesh.position.x - ix, g.mesh.position.z - iz) > 1.2, 'stops before the island');
    const [sg, kg] = M.routes;
    ok(Math.hypot(kg.mesh.position.x - M.places.gaegyeong[0], kg.mesh.position.z - M.places.gaegyeong[1]) < 1, 'reaches 개경');
    ok(Math.hypot(sg.mesh.position.x - M.places.seogyeong[0], sg.mesh.position.z - M.places.seogyeong[1]) < 1, 'reaches 서경');
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
