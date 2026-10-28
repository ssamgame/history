// 아무 차례로 말 잇기 탐험(D-28 근대 1장부터 근대·일제 강점기·현대편 공용): 문으로 걸어 들어온 뒤 people의 이야기를
// 아무 차례로 듣는다(두 번째부터는 이어 주는 말 bridge로 시작, 막지 않음). 한 사람이라도 들었으면 final에게 가서 결심을 듣고 끝난다.
// script.npc[사람]: first, bridge, later / script.npc[final]: wait(아무도 안 들었을 때), first(마지막에 학생의 결심) / script.more: 아직 남았을 때 안내
// script.goals[0] = 이야기 듣기, [1] = final 찾아가기
import { roam } from '../../core/flow.js';
import { sayAll, placePlayer } from '../joseon/common.js';
import { enterThroughGate, closeGate } from './gate.js';

export function anyOrderTalk(script, people, id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return people.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

function mark(ctx, script, people, final, heard) {
  const { world, hud } = ctx;
  people.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get(final).mark.visible = heard.size > 0;
  const next = world.npcs.get(people.find(id => !heard.has(id)) || final).mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === people.length ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${people.length}`);
}

// { people, final, gate, from(문 밖), to(들어와 서는 곳) }
export async function walkInAndTalk(ctx, script, { people, final, gate, from, to }) {
  const { world, dialogue, hud } = ctx;
  world.closeView = true;
  placePlayer(world, from);
  await enterThroughGate(ctx, { from, to, gate, speed: 1 });
  closeGate(world, gate);
  const heard = new Set();
  mark(ctx, script, people, final, heard);
  await sayAll(dialogue, script.start);
  dialogue.close();
  ctx.input.enabled = true;
  await new Promise(resolve => {
    const stop = roam(ctx, {
      async onTalk(id) {
        const n = script.npc[id];
        if (people.includes(id)) {
          const isNew = !heard.has(id);
          await sayAll(dialogue, anyOrderTalk(script, people, id, heard));
          heard.add(id); mark(ctx, script, people, final, heard);
          if (isNew && heard.size < people.length) await dialogue.say(script.more);
          return;
        }
        if (id !== final) { await sayAll(dialogue, n.always || n.later || n.first); return; } // 안내판·다른 사람
        if (!heard.size) { await sayAll(dialogue, n.wait); return; }
        await sayAll(dialogue, n.first);
        [...people, final].forEach(k => { world.npcs.get(k).mark.visible = false; });
        world.setGoal(null); hud.setCounter(null);
        stop(); setTimeout(resolve, 0);
      },
    });
  });
}
