// 도전 쪽지(2026-11-10 선생님, content/growth.js CHALLENGES): 탐험이 시작되면 한쪽에 숨은 안내판을 세우고 퀘스트 목록에 「✦ 도전 쪽지」를 붙인다.
// 안내판을 찾아 읽으면 시간지기가 한 가지를 묻고, 맞히면 금빛 도장(save.setQuest). 틀리면 다시 읽고 도전한다. 안 해도 장은 끝난다.
// runChapter가 장면을 지은 뒤 만들고(ctx.challenge), core/flow.js roam이 탐험을 시작할 때 place(), 안내판을 누르면 read(), 탐험이 끝나면 remove().
import { makeSign } from './signs.js';
import { CHALLENGES } from '../content/growth.js';
import { showSeal } from './growth-ui.js';

export const NOTE_ID = 'questnote';

// 안내판 자리: 걷는 곳 안에서 사람·건물과 떨어진 빈 곳 가운데, 학생이 선 곳에서 8m쯤 떨어지고 바라보는 쪽에서 비켜난 곳
// (눈앞에 바로 보이지 않고 조금 둘러봐야 찾는다. 같은 장면이면 늘 같은 자리). 빈 곳이 없으면 null
export function findNoteSpot(world) {
  const p = world.player.position, ry = world.player.rotation.y, b = world.bounds;
  if (!b) return null;
  const free = (x, z) => world.colliders.every(c => Math.hypot(c.x - x, c.z - z) > c.r + 1.4)
    && [...world.npcs.values()].every(n => Math.hypot(n.mesh.position.x - x, n.mesh.position.z - z) > 2.8);
  let best = null, score = -Infinity;
  for (let x = Math.ceil(b.x0 + 1.5); x <= b.x1 - 1.5; x += 1) for (let z = Math.ceil(b.z0 + 1.5); z <= b.z1 - 1.5; z += 1) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < 3.5 || d > 14 || !free(x, z)) continue;
    const off = Math.abs(Math.atan2(Math.sin(Math.atan2(x - p.x, z - p.z) - ry), Math.cos(Math.atan2(x - p.x, z - p.z) - ry))); // 바라보는 쪽에서 벗어난 각(0~π)
    const sc = -Math.abs(d - 8) + Math.min(off, 2) * 1.5; // 8m쯤, 옆·뒤쪽일수록 좋다
    if (sc > score) { score = sc; best = { x, z }; }
  }
  return best;
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
      const at = c.at ? { x: c.at[0], z: c.at[1] } : findNoteSpot(world);
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
