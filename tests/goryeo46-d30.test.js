// D-30 고려 4·5·6장: 도입 장면(C-03), 빛나는 문(C-02), 퀴즈 퀘스트 없음(C-01), 모두 들어야 진행(C-01)
import { test, eq, ok } from './harness.js';
import ch4Script from '../chapters/ch4/script.js';
import ch5Script from '../chapters/ch5/script.js';
import ch6Script from '../chapters/ch6/script.js';
import ch4 from '../chapters/ch4/chapter.js';
import ch5 from '../chapters/ch5/chapter.js';
import ch6 from '../chapters/ch6/chapter.js';
import { touchSetup } from './bot.js';

test('ch4 D-30: introScene shows the envoy walking the river road, portal is in the palace yard, no quiz goal, culprit stays unknown', async () => {
  ok(typeof ch4.introScene === 'function', 'introScene');
  ok(ch4.portal && ch4.portal.at.length === 2, 'portal');
  ok(!ch4Script.goals.some(g => g.includes('배운 내용')), 'no quiz goal');
  ok(ch4Script.jeogo.after[0].text.includes('밝혀지지 않았'), 'culprit unknown line kept');
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    const J = sc.areas.jeogo, x0 = J.envoy.position.x;
    const film = ch4.introScene(s.ctx);
    ok(film.shots.length >= 1 && film.shots.length >= ch4Script.intro.length, 'a shot per sentence');
    film.shots[0].act(s.ctx);
    for (let i = 0; i < 20; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(J.envoy.position.x > x0 + 0.5, 'the envoy walks in the intro');
    ok(!J.archer.visible, 'the hidden soldier is not shown in the intro');
    film.done(s.ctx);
    eq(J.envoy.position.x, x0, 'put back for the story');
    ok(J.archer.visible);
    const P = sc.areas.palace.bounds;
    ok(ch4.portal.at[0] > P.x0 + 3 && ch4.portal.at[0] < P.x1 - 3 && ch4.portal.at[1] > P.z0 && ch4.portal.at[1] < P.z1, 'inside the yard');
    ch4.enterStage(s.ctx, 'quiz');
    eq(s.w.bounds, P); eq(s.w.player.visible, true);
  } finally { s.done(); }
});

test('ch5 D-30: two-sentence intro film (burning, then re-making), portal in the yard, no quiz goal, monk waits until all four were heard', async () => {
  ok(typeof ch5.introScene === 'function' && ch5.portal && ch5.portal.at.length === 2);
  eq(ch5Script.intro.length, 2); ok(ch5Script.intro.every(l => l.src && l.src.length));
  ok(!ch5Script.goals.some(g => g.includes('배운 내용')), 'no quiz goal');
  ok(ch5Script.npc.monk.later[0].text.includes('모두'));
  const s = touchSetup(ch5Script.speakers);
  try {
    ch5.buildScene(s.w, s.ctx);
    const film = ch5.introScene(s.ctx);
    ok(film.shots.length >= 2);
    const before = s.w.level.children.length;
    film.shots[0].act(s.ctx);
    for (let i = 0; i < 10; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(s.w.level.children.length > before, 'the burning scene is built');
    film.shots[1].act(s.ctx);
    film.done(s.ctx);
    eq(s.w.level.children.length, before, 'cleaned up');
    ok([...s.w.npcs.values()].every(n => n.mesh.visible), 'people back');
  } finally { s.done(); }
});

test('ch6 D-30: two-sentence intro film, big portal in a clear spot, goals without quiz, 배중손 waits until all three were heard', async () => {
  ok(typeof ch6.introScene === 'function' && typeof ch6.portal === 'function');
  eq(ch6Script.intro.length, 2); ok(ch6Script.intro.every(l => l.src && l.src.includes('S21')));
  ok(!ch6Script.goals.some(g => g.includes('배운 내용')), 'no quiz goal');
  eq(ch6Script.goals.length, 7);
  ok(ch6Script.npc.baejungson.wait[0].text.includes('모두'));
  ok(ch6Script.npc.baejungson.board[0].src.includes('S21'));
  const s = touchSetup(ch6Script.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    const film = ch6.introScene(s.ctx);
    ok(film.shots.length >= 2);
    film.shots[1].act(s.ctx);
    for (let i = 0; i < 10; i++) s.w.step(0.05, { x: 0, z: 0 });
    film.done(s.ctx);
    ch6.enterStage(s.ctx, 'quiz');
    eq(s.w.bounds, sc.portBounds); eq(s.w.player.visible, true);
    const [px, pz] = ch6.portal(s.ctx).at, B = sc.portBounds; // 문을 세울 때 곁의 군사는 비켜 선다
    ok(px - 4 > B.x0 && px + 4 < B.x1 && pz > B.z0 && pz < B.z1, 'inside the port');
    for (const n of s.w.npcs.values()) if (n.mesh.visible) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 4.5, `clear of ${n.id}`);
    for (const c of s.w.colliders) if (c.r >= 1) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 3.2, `clear of something at (${c.x}, ${c.z})`);
  } finally { s.done(); }
});
