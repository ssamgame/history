// 근대편 2장 D-29: 거리 사람 아무 차례로, 김옥균을 따라 밤길 걷기, 방을 들고 진짜 개혁안만 게시판에 붙이기
import { test, eq, ok } from './harness.js';
import k2, { villageTalk } from '../chapters/modern/k2/chapter.js';
import script from '../chapters/modern/k2/script.js';
import { testWorld } from './bot.js';

test('k2 D-29: 거리 사람은 아무 차례로, 김옥균 앞에서 학생의 결심', () => {
  eq(villageTalk('clerk', new Set(['merchant']))[0], script.npc.clerk.bridge);
  eq(villageTalk('merchant', new Set())[0], script.npc.merchant.first[0]);
  ok(!script.npc.clerk.tooEarly && !script.npc.kimokgyun.tooEarly);
  ok(k2.anyOrder && script.npc.kimokgyun.wait.length);
  ok(script.npc.kimokgyun.first.some(l => l.who === 'me'));
});

test('k2 D-29: 놀이는 김옥균 따라 밤길(장면)과 방 붙이기, 이정표·팻말 찾기 없음', () => {
  eq(k2.parts.map(p => p.type), ['scene', 'deliver']);
  eq(script.night.stops.length, 5);
  ok(script.night.stops[4].after.some(l => l.text.includes('일본으로 몸을 피했')), '몸을 피한 뒤 그 자리에서 해설');
  ok(script.night.stops.every(s => s.talk.length));
  const reform = k2.parts[1];
  ok(reform.cards.every(c => c.carry === 'notice'));
  eq(reform.cards.filter(c => c.bin === 'yes').length, 3);
  ok(reform.bins[0].drop, '진짜 개혁안은 게시판 판에 붙는다');
});

test('k2 D-29: 큰길 어귀 문, 문길은 비어 있다', () => {
  const w = testWorld();
  try {
    const s = k2.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2);
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 7 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});
