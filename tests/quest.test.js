// 퀘스트 진행 데이터 검사: 차례대로 말 걸기에 필요한 대사·목표·인물이 빠짐없이 있는지(근대~현대편 18장).
// 실제로 걸어가서 차례대로 말을 걸어 끝까지 가는지는 장마다 터치 봇 테스트(kit·ch·j)가 확인한다.
import { test, ok } from './harness.js';
import { MODERN, COLONIAL, PRESENT } from '../chapters/index.js';

test('quest: 차례대로 말 걸 사람마다 첫 대사·차례 전 대사·다시 말 걸 때 대사가 있고, 목표 문장이 차례 수보다 많다', async () => {
  for (const meta of [...MODERN, ...COLONIAL, ...PRESENT]) {
    const ch = (await meta.load()).default, { script, order, layout } = ch;
    ok(order?.length >= 2, `${meta.id}: 말 걸 차례`);
    ok(script.goals.length > order.length, `${meta.id}: 목표 ${script.goals.length}개 < 차례 ${order.length}+1`);
    ok(script.start?.length, `${meta.id}: 시작 안내`);
    for (const [i, id] of order.entries()) {
      const n = script.npc[id];
      ok(n && n.first?.length, `${meta.id} ${id}: 첫 대사`);
      if (i > 0) ok(n.tooEarly?.length, `${meta.id} ${id}: 차례보다 먼저 왔을 때 대사`);
      ok(n.later?.length || n.first?.length, `${meta.id} ${id}: 다시 말 걸 때 대사`);
      ok(layout.npcs.some(p => p.id === id), `${meta.id} ${id}: 마을에 서 있다`);
      ok(script.speakers[id] || n.first.every(l => script.speakers[l.who] || l.who === 'narr'), `${meta.id} ${id}: 말하는 사람 이름`);
    }
    for (const p of layout.npcs) ok(script.npc[p.id], `${meta.id} ${p.id}: 마을 사람 대사`);
    for (const s of layout.signs || []) ok(script.npc[s.id]?.always?.length, `${meta.id} ${s.id}: 안내판 글`);
    // 같은 사람이 같은 장에서 똑같은 말을 되풀이하지 않는다(다시 말 걸 때·놀이 중 대사)
    const seen = new Map(), walk = (o, path) => { if (!o || typeof o !== 'object') return; if (typeof o.text === 'string' && o.who && o.who !== 'narr') { const k = `${o.who}|${o.text}`; ok(!seen.has(k), `${meta.id}: ${o.who}가 같은 말을 두 번 (${seen.get(k)} / ${path}) "${o.text}"`); seen.set(k, path); return; } for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`); };
    walk(script, meta.id);
  }
});
