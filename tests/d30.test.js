// D-30 공통 시스템: 퀘스트 목록(C-01), 빛나는 문(C-02), 도입 장면(C-03), 퀴즈 색(C-04), 다가가서 시작(C-05)
import { test, eq, ok } from './harness.js';
import { createHud } from '../core/screens.js';
import { createDialogue } from '../core/dialogue.js';
import { withRo, portalName, makePortal, waitInteract } from '../core/portal.js';
import { playIntro } from '../core/intro.js';
import { touchSetup, touchBot, testWorld, sleep } from './bot.js';

test('C-01: 퀘스트 목록은 마친 것 ✓(앞 두 개), 지금 것 하나, 진행 수는 지금 퀘스트 아래', () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const hud = createHud(ui, { touch: false });
    const goals = ['가', '나', '다', '라'];
    hud.setGoal('다', [3, 4], goals);
    eq([...ui.querySelectorAll('.quest.done')].map(e => e.textContent), ['가', '나']);
    eq(ui.querySelector('.quest.now .goal-text').textContent, '다');
    hud.setCounter('들은 이야기 1/2');
    ok(ui.querySelector('.quest.now .hud-counter') && !ui.querySelector('.quest.now .hud-counter').hidden);
    hud.setGoal('문으로 가자', null, goals); // 목록에 없는 퀘스트: 그때까지의 것을 마친 것으로
    eq([...ui.querySelectorAll('.quest.done')].map(e => e.textContent), ['나', '다']);
    hud.setFound('살펴본 안내판 1 / 2');
    ok(ui.querySelector('.hud-found').hidden, '안내판 칸은 보이지 않는다');
    ok(!ui.textContent.includes('목표'), "'목표' 칸 대신 '퀘스트'");
  } finally { ui.remove(); }
});

test('C-02: 문 이름은 다음 장 제목 + 로/으로 가는 문, 다음 편이면 편 이름', () => {
  eq(withRo('세종 때의 과학 기술'), '세종 때의 과학 기술로');
  eq(withRo('갑신정변'), '갑신정변으로');
  eq(withRo('조선을 걷다'), '조선을 걷다로');
  eq(portalName({ title: '세종과 훈민정음' }), '세종과 훈민정음으로 가는 문');
  eq(portalName({ course: '조선편', title: '조선을 걷다' }), '조선편 「조선을 걷다」로 가는 문');
});

test('C-02: 큰 문(다음 편)은 보통 문보다 크고 빛기둥이 있다', () => {
  const w = testWorld();
  try {
    const a = makePortal(w, { x: 0, z: 0, name: 'a' }), b = makePortal(w, { x: 20, z: 0, name: 'b', grand: true });
    ok(b.H > a.H * 1.3, 'grand is taller');
    let cols = 0; b.group.traverse(o => { if (o.geometry?.type === 'CylinderGeometry' && o.geometry.parameters.height >= 30) cols += 1; });
    eq(cols, 1, 'light pillar');
  } finally { w.dispose(); }
});

test('C-05: waitInteract는 그 자리에 가서 대화 버튼을 눌러야 끝난다', async () => {
  const s = touchSetup({});
  const bot = touchBot(s, { answers: new Set() });
  try {
    s.w.player.position.set(0, 0, 0);
    let done = false;
    const p = waitInteract(s.ctx, { pos: { x: 6, z: -4 }, quest: '물건에게 가자' }).then(() => { done = true; });
    await sleep(60);
    ok(!done, 'does not start by itself');
    eq(s.ui.querySelector('.goal-text').textContent, '물건에게 가자');
    await p;
    ok(Math.hypot(s.w.player.position.x - 6, s.w.player.position.z + 4) < 2.8, 'student walked there');
  } finally { bot.stop(); s.done(); }
}, { timeout: 20000 });

test('C-03: 도입 장면은 해설을 자막으로 띄우고, 누르면 다음 문장, 건너뛰기로 끝난다', async () => {
  const s = touchSetup({});
  try {
    const lines = [{ who: 'narr', text: '첫 문장' }, { who: 'narr', text: '둘째 문장' }];
    let acted = 0, finished = false;
    const shots = lines.map(() => ({ cam: [0, 5, 10], look: [0, 1, 0], act: () => { acted += 1; } }));
    const done = playIntro(s.ctx, { no: 1, years: '1388', event: 'e', title: 't' }, lines, { shots, done: () => { finished = true; } });
    eq(s.ui.querySelector('.intro-sub-text').textContent, '첫 문장');
    ok(!s.w.player.visible, 'student hidden during the film');
    s.ctx.testHooks.intro.next();
    eq(s.ui.querySelector('.intro-sub-text').textContent, '둘째 문장');
    s.ui.querySelector('.intro-skip').click();
    await done;
    eq(acted, 2); ok(finished); ok(!s.ui.querySelector('.intro-film'));
    ok(s.w.player.visible); eq(s.w.camMode, 'follow');
  } finally { s.done(); }
});

test('C-04: 퀴즈 정답은 연두, 오답은 분홍 바탕', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const d = createDialogue(ui, {}, { typeMs: 0 });
  try {
    const q = { question: '?', options: ['맞음', '틀림'], answer: 0, explain: '해설' };
    const run = d.quiz(q);
    await sleep(300); d.pick(1); await sleep(20);
    const box = ui.querySelector('.dlg');
    ok(box.classList.contains('dlg-wrong'));
    const bg = getComputedStyle(box).backgroundColor; ok(bg === 'rgb(255, 217, 228)', bg);
    d.advance(); await sleep(300);
    ok(!box.classList.contains('dlg-wrong'), 'reset while choosing again');
    d.pick(0); await sleep(20);
    ok(box.classList.contains('dlg-right'));
    eq(getComputedStyle(box).backgroundColor, 'rgb(220, 245, 192)');
    d.advance(); await run;
  } finally { d.dispose(); ui.remove(); }
});
