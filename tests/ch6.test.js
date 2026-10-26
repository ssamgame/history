import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { LOOKS } from '../content/characters.js';
import { runChapter } from '../core/flow.js';
// 옛 삼별초 장(ch6)은 2026-10-26 장 구성 변경 때 목록에서 뺐다(새 6장 ch5에 합침). 폴더는 남아 있어 옛 장 정보로 시험한다
const OLD_CH6 = { id: 'ch6', no: 6, session: 1, title: '삼별초의 항쟁', years: '1270~1273', event: '몽골에 맞선 항쟁', place: '진도·제주', mapXY: [32, 85] };
import ch6Script from '../chapters/ch6/script.js';
import ch6 from '../chapters/ch6/chapter.js';
import { buildCh6Scene } from '../chapters/ch6/scene.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';
import * as THREE from 'three';

const answers = new Set(ch6Script.quizzes.map(q => q.options[q.answer]));

test('ch6: script passes validation', () => {
  eq(validateScript(ch6Script, SOURCES), []);
  for (const [id, sp] of Object.entries(ch6Script.speakers)) if (id !== 'guide') ok(LOOKS[sp.look], id);
  eq(ch6Script.quizzes.map(q => q.options[q.answer]), ['고려 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 데 반대해서', '강화도 → 진도 → 제주도']); // 까닭(1270) → 옮겨 간 순서(1270~1273)
  eq(ch6Script.fit.figures.length, 5); eq(ch6Script.fit.circles.length, 5);
  ok(ch6Script.fit.circles.every(c => ch6Script.fit.figures.some(f => f.id === c.answer)), 'every circle has its person');
});

test('ch6: destinations start ahead of the boat', () => {
  const w = testWorld();
  const s = buildCh6Scene(w);
  eq(s.legs.length, 2);
  for (const leg of s.legs) ok(leg.to.z < leg.from[1] - 30, `goal ${leg.to.z} is ahead (north) of start ${leg.from[1]}`);
  ok(w.npcs.has('baejungson'), 'baejungson at the port');
  w.dispose();
});

test('ch6: caught by a pursuer restarts the leg', async () => {
  const s = touchSetup(ch6Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
  let caught = false;
  const bot = touchBot(s, { answers, fits: Object.fromEntries(ch6Script.fit.circles.map(c => [c.answer, c.id])), holdStill: () => !caught && !said.includes(ch6Script.sail.failHint) });
  try {
    ch6.buildScene(s.w, s.ctx);
    ch6.enterStage(s.ctx, 'minigame');
    await ch6.minigame(s.ctx);
    ok(said.includes(ch6Script.sail.failHint), 'caught once, then sailed again');
    caught = true;
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch6: completes with touch-only actions', async () => {
  const s = touchSetup(ch6Script.speakers);
  const bot = touchBot(s, { answers, fits: Object.fromEntries(ch6Script.fit.circles.map(c => [c.answer, c.id])) });
  try {
    const r = await runChapter(OLD_CH6, ch6, s.ctx, memSave());
    eq(r.quizCorrect, 2); eq(r.easyModeUsed, false); eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch6: pursuers wait a moment before chasing so the student can get going', async () => {
  const s = touchSetup(ch6Script.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    ch6.enterStage(s.ctx, 'minigame');
    ch6.minigame(s.ctx);
    await new Promise(r => setTimeout(r, 30));
    s.ui.querySelector('.screen.howto button.primary').click();
    await new Promise(r => setTimeout(r, 30));
    const start = sc.pursuers.map(p => [p.position.x, p.position.z]);
    for (let i = 0; i < 40; i++) s.w.step(0.05, { x: 0, z: 0 }); // 2초
    eq(sc.pursuers.map(p => [p.position.x, p.position.z]), start, 'not moving yet');
    for (let i = 0; i < 40; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(sc.pursuers.some((p, i) => p.position.x !== start[i][0]), 'then they chase');
  } finally { s.done(); }
});

test('ch6: 김통정 stands on a dock at 진도, not in the sea, and 제주 is solid', () => {
  const w = testWorld();
  try {
    const sc = buildCh6Scene(w);
    const k = w.npcs.get('kimtongjeong').mesh.position;
    ok(sc.docks.some(d => { const b = new THREE.Box3().setFromObject(d); return k.x > b.min.x && k.x < b.max.x && k.z > b.min.z && k.z < b.max.z && b.max.y >= -0.05; }), `dock under 김통정 at ${k.x},${k.z}`);
    const leg = sc.legs[1];
    w.bounds = sc.seaBounds;
    // 제주 도착점 바로 뒤(섬 안쪽)로는 배가 들어가지 못한다
    w.player.position.set(leg.to.x, 0, leg.to.z);
    for (let i = 0; i < 60; i++) w.step(0.05, { x: 0, z: -1 });
    ok(w.player.position.z > leg.to.z - 4, `stopped at the shore (z ${w.player.position.z.toFixed(1)})`);
  } finally { w.dispose(); }
});
