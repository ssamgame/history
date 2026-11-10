// 도전 쪽지(2026-11-10 선생님, content/growth.js CHALLENGES): 탐험이 시작되면 한쪽에 숨은 안내판을 세우고 퀘스트 목록에 「✦ 도전 쪽지」를 붙인다.
// 안내판을 찾아 읽으면 시간지기가 한 가지를 묻고, 맞히면 금빛 도장(save.setQuest). 틀리면 다시 읽고 도전한다. 안 해도 장은 끝난다.
// runChapter가 장면을 지은 뒤 만들고(ctx.challenge), core/flow.js roam이 탐험을 시작할 때 place(), 안내판을 누르면 read(), 탐험이 끝나면 remove().
import { makeSign } from './signs.js';
import { CHALLENGES } from '../content/growth.js';
import { showSeal } from './growth-ui.js';

export const NOTE_ID = 'questnote';

// 안내판 자리: 학생이 선 곳에서 옆·뒤쪽으로 5~8m, 걷는 곳 안이고 사람·건물에서 떨어진 곳(같은 장면이면 늘 같은 자리)
export function findNoteSpot(world) {
  const p = world.player.position, ry = world.player.rotation.y, b = world.bounds;
  const free = (x, z) => (!b || (x > b.x0 + 1.5 && x < b.x1 - 1.5 && z > b.z0 + 1.5 && z < b.z1 - 1.5))
    && world.colliders.every(c => Math.hypot(c.x - x, c.z - z) > c.r + 1.6)
    && [...world.npcs.values()].every(n => Math.hypot(n.mesh.position.x - x, n.mesh.position.z - z) > 3);
  for (const r of [6.5, 5, 8, 4]) for (const a of [Math.PI / 2, -Math.PI / 2, 2.1, -2.1, 1.05, -1.05, 2.7, -2.7, Math.PI]) {
    const x = p.x + Math.sin(ry + a) * r, z = p.z + Math.cos(ry + a) * r;
    if (free(x, z)) return { x, z };
  }
  return null;
}

export function setupChallenge(ctx, meta, save) {
  const c = CHALLENGES[meta.id];
  if (!c || !ctx.world || save.quest(meta.id)) return null; // 이미 해낸 쪽지는 다시 내지 않는다
  const { world, hud, dialogue } = ctx;
  let spot = null, placed = false, busy = false;
  const ch = {
    id: meta.id, task: c.task, done: false,
    place() {
      if (placed) return; placed = true;
      const at = findNoteSpot(world);
      if (!at) return; // 자리가 없으면 이번에는 쪽지 없이(장은 그대로)
      const p = world.player.position;
      spot = world.addSpot(NOTE_ID, makeSign(c.sign), at.x, at.z, Math.atan2(p.x - at.x, p.z - at.z)); // 글이 학생 쪽을 보게
      spot.mesh.userData.dynamic = true;
      hud.setChallenge?.(c.task);
      dialogue?.say({ who: 'guide', text: `도전 쪽지가 왔어! ${c.task}. 해내면 금빛 도장을 받아.` });
      ctx.testHooks.challenge = { at: [at.x, at.z], done: false };
    },
    async read() {
      if (busy || ch.done) return; busy = true;
      try {
        for (const l of c.lines) await dialogue.say(l);
        const i = await dialogue.choose({ who: 'guide', text: c.question }, c.options);
        dialogue.close();
        if (i === c.answer) {
          ch.done = true; save.setQuest(meta.id);
          hud.setChallenge?.(c.task, true);
          if (spot) spot.mark.visible = false;
          if (ctx.testHooks.challenge) ctx.testHooks.challenge.done = true;
          ctx.audio?.play?.('bell');
          await showSeal(ctx.ui, `${c.options[c.answer]} — 금빛 도장을 받았어요`);
        } else dialogue.say({ who: 'guide', text: '아쉬워! 안내판을 다시 읽고 한 번 더 도전해 보자.' });
      } finally { busy = false; }
    },
    remove() { // 탐험이 끝나면 안내판을 치운다(미니게임 무대·다음 단계에 남지 않게)
      if (spot) { spot.mesh.removeFromParent(); const k = world.colliders.indexOf(spot.collider); if (k >= 0) world.colliders.splice(k, 1); world.npcs.delete(NOTE_ID); spot = null; }
      if (!ch.done) hud.setChallenge?.(null);
    },
  };
  return ch;
}
