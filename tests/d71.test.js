// D-71(2026-11-04 선생님 수정 목록): 게임 방법 짧게, 안경 두 겹, 편 복습 퀴즈 뺌, 걷는 사람끼리 몸이 겹치지 않게, 손에 쥔 물건.
import { test, ok, eq } from './harness.js';
import * as THREE from 'three';
import { testWorld } from './bot.js';
import { makePerson } from '../core/people.js';
import { LOOKS } from '../content/characters.js';
import { faceTexture } from '../core/faces.js';
import { showHowTo } from '../core/minigame.js';

test('d71: 게임 방법은 세 줄까지, 줄마다 첫 문장만', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const p = showHowTo(ui, { title: 't', steps: ['하나예요. 길게 덧붙인 말.', '둘이에요.', '셋이에요.', '넷이에요.'] });
    const li = [...ui.querySelectorAll('.howto-steps li')].map(l => l.textContent);
    eq(li, ['하나예요.', '둘이에요.', '셋이에요.']);
    ui.querySelector('.screen.howto button.primary').click(); await p;
  } finally { ui.remove(); }
});

test('d71: 안경 쓴 얼굴은 얼굴 무늬에 안경을 또 그리지 않는다(3D 테만)', () => {
  eq(faceTexture({ ...LOOKS.kimgu.face }), faceTexture({ ...LOOKS.kimgu.face, glasses: null }));
  const p = makePerson(LOOKS.kimgu); ok(p.getObjectByName('glasses'), '3D 안경 테');
});

test('d71: 편 복습 퀴즈는 장 흐름에서 뺐다', async () => {
  const src = await (await fetch('../core/main.js')).text();
  ok(!src.includes('showReviewQuiz('), 'main.js가 복습 퀴즈를 부르지 않는다');
});

test('d71: 걷는 사람은 다른 사람 몸을 뚫고 지나가지 않는다', () => {
  const w = testWorld();
  try {
    const a = makePerson(LOOKS.commoner), b = makePerson(LOOKS.commoner);
    a.position.set(-3, 0, 0); b.position.set(0, 0, 0); w.level.add(a); w.level.add(b);
    let minD = Infinity;
    for (let i = 0; i < 120; i++) { a.position.x += 0.05; a.position.z = 0; w.step(1 / 30, { x: 0, z: 0 }); minD = Math.min(minD, a.position.distanceTo(b.position)); }
    ok(minD > 0.4, `가장 가까웠던 거리 ${minD.toFixed(2)}`);
  } finally { w.dispose(); }
});
