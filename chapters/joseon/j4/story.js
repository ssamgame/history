// 조선 4장 끝 해설 장면(D-58): 한산도 대첩에서 이긴 소식에 포구 사람들이 기뻐한다(얼굴이 보이게, D-45; 배가 돌아오는 장면은 D-67에서 뺐다),
// 마지막은 해 질 녘 바다의 판옥선 한 척(7년 전쟁과 노량 해전).
import * as THREE from 'three';
import { panokseon } from '../ships.js';
import { holdFlag } from '../../kit/town.js';
import { storyScene, person, wait, face, troop, facingShare, raiseArms } from '../../kit/story.js';
import script from './script.js';

export const HARBOR = { origin: [400, 0], ground: 'earth', groundColor: 0x9a8a68, hill: 0.8, bounds: { x0: -16, x1: 16, z0: -4, z1: 10 },
  props: [{ type: 'water', x: 0, z: -34, w: 160, d: 56, solid: false, shore: true }, { type: 'pier', x: 2, z: -6, solid: false }], edge: { style: 'thatch', back: false } };

export function victoryScene(ctx) {
  const R = script.result;
  return storyScene(ctx, { key: 'victory', arena: HARBOR, mood: 'noon', async run({ g, hook, cam, glide, say, people, fadeIn }) {
    const { world } = ctx;
    // D-67(2026-11-04 선생님): 이긴 뒤 배가 포구로 돌아오는 장면은 뺐다. 포구 사람들이 기뻐하고, 해 질 녘 바다의 판옥선 한 척으로 맺는다
    const lone = panokseon(); lone.visible = false; g.add(lone);
    // 포구에 모인 사람들(카메라 쪽을 보고 손을 흔든다)
    const crowd = troop(g, ['commoner', 'woman', 'kid', 'commoner', 'woman', 'commoner'], 0, 3.5, { cols: 6, rows: 2, gap: 1.3, ry: 0 });
    crowd.forEach(p => face(p, 0, 12));
    people.push(...crowd);
    cam([0, 2.8, 13], [0, 1.6, 2]);
    await fadeIn();
    await say(R[0]);
    ctx.dialogue.close();
    hook.facing = facingShare(world, crowd);
    ctx.audio?.play?.('correct');
    for (let n = 0; n < 2; n++) await wait(world, 0.9, k => crowd.forEach((p, i) => raiseArms(p, Math.sin(Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.05)) * Math.PI))));
    hook.cheers = 2;
    await say(script.victory.line, crowd[0]);
    await say(R[1]);
    ctx.dialogue.close();
    // 해 질 녘 바다의 판옥선 한 척
    world.setMood('sunset');
    lone.visible = true; lone.position.set(0, -0.3, -24);
    crowd.forEach(p => { p.visible = false; });
    await glide([0, 2.6, 4], [0, 1.4, -24], [5, 3.4, -6], [0, 1.6, -24], 2.4);
    await say(R[2]);
  } });
}
