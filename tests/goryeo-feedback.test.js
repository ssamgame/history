// 2026-10-24 선생님 의견(고려편 3~6장): 둑 터뜨리기 때, 귀주 싸움 장면, 저고여 사건, 강화도 까닭, 화살, 노비 문서, 퀴즈 배경,
// 차례대로 만나는 장인과 그림 카드, 몽골군이 탄 적선, 바다 말, 인물 넣기.
import { test, eq, ok } from './harness.js';
import ch3, { DAM_WINDOW, playGujuBattle } from '../chapters/ch3/chapter.js';
import ch3Script from '../chapters/ch3/script.js';
import ch4 from '../chapters/ch4/chapter.js';
import ch4Script from '../chapters/ch4/script.js';
import ch5, { MAKING_CARDS } from '../chapters/ch5/chapter.js';
import ch5Script from '../chapters/ch5/script.js';
import ch6 from '../chapters/ch6/chapter.js';
import ch6Script from '../chapters/ch6/script.js';
import { fitFigures } from '../core/minigame.js';
import { touchSetup, sleep } from './bot.js';

const step = (w, sec) => { for (let i = 0; i < sec * 20; i++) w.step(1 / 20, { x: 0, z: 0 }); };

test('goryeo3: 둑 터뜨리기 판정 칸이 거란군 무리가 냇물 한가운데 있는 때를 담는다', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    const { army, setCross, zNorth, zSouth } = sc.river;
    const mid = (zNorth + zSouth) / 2;
    const center = k => { setCross(k); const zs = army.children.map(p => army.position.z + p.position.z); return (Math.min(...zs) + Math.max(...zs)) / 2; };
    // 무리 가운데가 냇물 한가운데에 오는 진행도 찾기
    let best = 0; for (let k = 0; k <= 1; k += 0.01) if (Math.abs(center(k) - mid) < Math.abs(center(best) - mid)) best = k;
    const [lo, hi] = DAM_WINDOW.normal;
    ok(best > lo + 0.08 && best < hi - 0.08, `한가운데(k=${best.toFixed(2)})가 판정 칸(${lo}~${hi}) 안쪽에 넉넉히`);
    setCross(hi); const zs = army.children.map(p => army.position.z + p.position.z);
    ok(Math.min(...zs) < zSouth + 1.5, '판정 칸 끝에서도 무리가 아직 다 건너지 않았다');
  } finally { s.done(); }
});

test('goryeo3: 공격 신호 뒤 귀주 벌판에서 고려군이 돌격해 거란군이 쓰러지고 달아난다', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    const z0 = sc.gujuGoryeo[0].position.z;
    const p = playGujuBattle(s.ctx);
    step(s.w, 3);
    ok(sc.gujuGoryeo[0].position.z < z0 - 3, '고려군이 앞으로 나아간다');
    step(s.w, 5);
    await p;
    ok(sc.gujuKhitan.some(k => k.rotation.x < -1), '쓰러진 거란군');
    ok(sc.gujuKhitan.some(k => !k.visible), '달아난 거란군');
    ok(ch3Script.guju.charge.length >= 1);
  } finally { s.done(); }
});

test('goryeo4: 압록강 가에서 저고여가 쓰러지는 장면이 있고, 범인은 밝혀지지 않았다고 말한다', async () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    const J = sc.areas.jeogo;
    const done = J.play(); step(s.w, 7); await done;
    const fallen = s.w.level.children.some(o => o.userData && o.userData.legs && o.rotation.x < -1.2);
    ok(fallen, '사신이 쓰러진다');
    ok(ch4Script.jeogo.after.some(l => l.text.includes('밝혀지지 않았') && l.src.includes('S22')));
  } finally { s.done(); }
});

test('goryeo4: 왜 강화도냐는 물음에 상황에 맞는 말로 답하고, 천도로 도읍을 쉽게 함락시킬 수 없었다고 말한다', () => {
  const right = ch4Script.capital.reason.options.find(o => o.correct);
  eq(right.text, '몽골군을 상대로 바다와 물에서 싸우면 고려가 유리할 것입니다.');
  ok(ch4Script.capital.reason.options.every(o => /니다\.$/.test(o.text)), '세 답 모두 관리에게 하는 말');
  const done = ch4Script.capital.done.map(l => l.text).join(' ');
  ok(done.includes('1232') && done.includes('함락'), done);
});

test('goryeo4: 처인성 화살은 멀리서도 보이게 크고 빛나는 꼬리가 있다', () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    ok(sc.arrows.every(a => a.scale.x >= 3.5 && a.getObjectByName('trail')), '큰 화살과 꼬리');
  } finally { s.done(); }
});

test('goryeo4: 노비 문서는 글씨가 있는 종이이고, 불에 타 검게 그을리다 사라진다', async () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    const paper = sc.documents.children[0];
    ok(paper.material.map, '종이 그림(노비 문서)');
    const burn = sc.burnDocuments();
    step(s.w, 2);
    ok(sc.fire.visible && paper.material.color.r < 0.9, '불이 붙어 종이 색이 변한다');
    step(s.w, 6.5); await burn;
    eq(sc.documents.visible, false, '다 타서 사라진다');
  } finally { s.done(); }
});

test('goryeo4: 퀴즈 배경은 강화도 문제에 강화도, 처인성·충주성 문제에 처인성을 비춘다', () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    ch4.buildScene(s.w, s.ctx);
    eq(ch4.quizView(s.ctx, ch4Script.quizzes[0]).name, '강화도');
    eq(s.w.camMode, 'fixed');
    eq(ch4.quizView(s.ctx, ch4Script.quizzes[1]).name, '처인성');
  } finally { s.done(); }
});

test('goryeo5: 장인은 1번~4번이고, 차례보다 먼저 찾아가면 앞 번호 장인부터 들으라고 한다', () => {
  eq(['artisan1', 'artisan2', 'artisan3', 'artisan4'].map(id => ch5Script.speakers[id].name.slice(0, 5)), ['1번 장인', '2번 장인', '3번 장인', '4번 장인']);
  ok(ch5Script.tooEarly(1)[0].text.includes('1번 장인'));
  const s = touchSetup(ch5Script.speakers);
  try {
    ch5.buildScene(s.w, s.ctx);
    ok(s.w.npcs.get('artisan3').mesh.getObjectByName('numTag'), '머리 위 번호 이름표');
  } finally { s.done(); }
});

test('goryeo5: 경판 만드는 순서는 그림이 있는 카드로 고른다', async () => {
  eq(MAKING_CARDS.length, 6);
  ok(MAKING_CARDS.every(c => c.figure.startsWith('<svg') && !c.figure.includes('<text')), '그림만 있는 SVG');
  const { orderCards } = await import('../core/minigame.js');
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const p = orderCards({ ui }, { title: '경판', cards: MAKING_CARDS });
  eq(ui.querySelectorAll('.order-card svg').length, 6, '카드마다 그림');
  for (const c of MAKING_CARDS) [...ui.querySelectorAll('.order-card')].find(b => b.textContent === c.text).click();
  eq(await p, true); ui.remove();
});

test('goryeo6: 뒤쫓는 배에는 몽골군이 타 있고, 남은 거리는 바다에 맞는 말로 센다', () => {
  const s = touchSetup(ch6Script.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    ok(sc.pursuers.every(b => b.children.filter(c => c.name === 'enemy').length >= 2), '적선마다 군사');
    ok(sc.legs.every(l => l.name), '뱃길 이름');
  } finally { s.done(); }
});

test('goryeo6: 인물을 골라 그 사건의 원에 넣고, 틀리면 해설을 보고 맞는 원이 빛난다', async () => {
  const s = touchSetup(ch6Script.speakers);
  try {
    const F = ch6Script.fit;
    const p = fitFigures(s.ctx, { title: F.title, figures: F.figures, circles: F.circles, hint: F.failHint });
    const fig = id => s.ui.querySelector(`.fit-figure[data-figure="${id}"]`), circ = id => s.ui.querySelector(`.fit-circle[data-circle="${id}"]`);
    fig('seohui').click(); circ('guju').click();
    ok(s.ui.querySelector('.card-why').textContent.includes(F.failHint), '해설');
    ok(circ('talks').classList.contains('hint'), '맞는 원이 빛난다');
    circ('talks').click();
    ok(circ('talks').querySelector('.fit-inside').textContent.includes('서희'), '서희가 원 안에 들어간다');
    for (const c of F.circles.slice(1)) { fig(c.answer).click(); circ(c.id).click(); }
    await sleep(700);
    eq(await p, 'missed');
  } finally { s.done(); }
});
