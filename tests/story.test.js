// 이야기 장면(D-58, 2026-10-30 선생님: 장마다 서사가 진행되는 곳과 중요한 해설을 장면으로): 고려·조선·근대편의 장면 없던 13개 장.
// 장마다 stories의 장면을 돌려 보고, 대사가 나오고, 무대를 치우고 걷는 곳·학생 자리를 되돌리는지, 여럿이 기뻐하는 장면은 얼굴이 보이는지(D-45) 본다.
import { test, eq, ok } from './harness.js';
import { ALL_CHAPTERS } from '../chapters/index.js';
import { touchSetup, touchBot } from './bot.js';

const IDS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'j1', 'j2', 'j4', 'j5', 'j6', 'k1', 'k2'];

test('story D-58: 13개 장 모두 이야기 장면이 있다', async () => {
  for (const id of IDS) {
    const mod = (await ALL_CHAPTERS.find(c => c.id === id).load()).default;
    ok(mod.stories && Object.keys(mod.stories).length >= 1, `${id}: stories`);
  }
});

for (const id of IDS) {
  test(`story D-58: ${id} 장면을 보여 주고 치운다`, async () => {
    const mod = (await ALL_CHAPTERS.find(c => c.id === id).load()).default;
    for (const [name, run] of Object.entries(mod.stories)) {
      const s = touchSetup(mod.script.speakers);
      const bot = touchBot(s, { answers: new Set() });
      try {
        mod.buildScene(s.w, s.ctx);
        s.w.player.position.set(1, 0, 2);
        const n0 = s.w.level.children.length, b0 = JSON.stringify(s.w.bounds), vis = s.w.level.children.filter(o => o.visible).length;
        await run(s.ctx);
        const h = s.ctx.testHooks[name];
        ok(h && h.shown, `${id}/${name}: 보였다`);
        ok(h.lines >= 1, `${id}/${name}: 대사 ${h.lines}`);
        ok(h.facing >= 0.8, `${id}/${name}: 얼굴이 보인다(D-45) ${h.facing}`);
        if (h.sunk != null) ok(h.sunk < 0.05, `${id}/${name}: 사람·말이 땅에 박히지 않는다 ${h.sunk.toFixed(2)}m`); // 2026-10-30 몽골군이 산에 박힌 오류
        if (h.kingFeet != null) ok(Math.abs(h.kingFeet - h.daisTop) < 0.02, `${id}/${name}: 왕의 발이 단 윗면에 ${h.kingFeet.toFixed(3)} / ${h.daisTop.toFixed(3)}`);
        if (h.minGap != null) ok(h.minGap > 0.55, `${id}/${name}: 사람·말이 서로 겹치지 않는다 ${h.minGap.toFixed(2)}`);
        if (h.weaponsFacing != null) ok(h.weaponsFacing, `${id}/${name}: 찌르는 쪽이 상대를 향한다`);
        if (h.phases) ok(['defend', 'advance', 'clash', 'collapse', 'after'].every(k => h.phases.includes(k)), `${id}/${name}: 저항→진격→전투→무너짐→끝 ${h.phases}`);
        if (h.mongolRiders != null) ok(h.mongolRiders / h.mongols >= 0.6, `${id}/${name}: 몽골군은 기마병 중심 ${h.mongolRiders}/${h.mongols}`);
        eq(s.w.level.children.length, n0, `${id}/${name}: 무대를 치웠다`);
        eq(s.w.level.children.filter(o => o.visible).length, vis, `${id}/${name}: 마을을 다시 보인다`);
        eq(JSON.stringify(s.w.bounds), b0, `${id}/${name}: 걷는 곳`);
        eq(s.w.player.position.x, 1); eq(s.w.player.position.z, 2);
      } finally { bot.stop(); s.done(); }
    }
  }, { timeout: 180000 });
}
