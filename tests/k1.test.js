// 근대편 1장 D-28: 마을 사람 아무 차례로(이어 주는 말), 물건을 안고 가져다 놓기, 조약문 읽고 사람들의 말 가려내기
import { test, eq, ok } from './harness.js';
import k1, { villageTalk } from '../chapters/modern/k1/chapter.js';
import script from '../chapters/modern/k1/script.js';
import { testWorld } from './bot.js';

test('k1 D-28: 마을 사람은 아무 차례로, 두 번째 사람은 이어 주는 말로 시작한다', () => {
  eq(villageTalk('scholar', new Set())[0], script.npc.scholar.first[0]);
  eq(villageTalk('scholar', new Set(['elder']))[0], script.npc.scholar.bridge);
  eq(villageTalk('elder', new Set(['scholar']))[0], script.npc.elder.bridge);
  eq(villageTalk('elder', new Set(['elder'])), script.npc.elder.later);
  ok(!script.npc.scholar.tooEarly && !script.npc.official.tooEarly, '차례 전에 막는 대사가 없다');
  ok(k1.anyOrder);
  ok(script.npc.official.first.some(l => l.who === 'me'), '관리 앞에서 학생의 결심');
});

test('k1 D-28: 놀이는 물건 나르기·해안 순찰·조약문·말 가려내기(팻말 찾기 없음)', () => {
  eq(k1.parts.map(p => p.type), ['deliver', 'drive', 'doc', 'judge']);
  const regent = k1.parts[0];
  eq(regent.cards.map(c => c.carry), ['log', 'sack', 'letter']);
  for (const c of regent.cards) ok(regent.bins.some(b => b.id === c.bin), c.text);
  const rumor = k1.parts[3];
  eq(rumor.items.filter(x => x.correct).length, 2);
  ok(rumor.items.every(x => x.talk?.length && Number.isFinite(x.x)));
  ok(k1.parts.every(p => p.goal), '부분마다 목표 문장');
});

test('k1 D-28: 마을 어귀 문과 이름판, 문 앞은 걸어 들어올 수 있게 비어 있다', () => {
  const w = testWorld();
  try {
    const s = k1.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(w.closeView, '낮은 카메라');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 7 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});
