// 근대 2장 끝 해설 장면(D-58): 갑신정변이 3일 만에 끝난 뒤, 청나라 군사들이 한성 큰길을 줄지어 지나가고 가게 앞 사람들이 걱정스럽게 바라본다
// (갑신정변 뒤 청의 간섭은 더욱 심해졌다, S51).
import * as THREE from 'three';
import { storyScene, person, march, face, troop, facingShare } from '../../kit/story.js';
import script from './script.js';

export const HANSEONG = { origin: [400, 0], ground: 'earth', groundColor: 0x8f7a5a, hill: 0.6, bounds: { x0: -16, x1: 16, z0: -6, z1: 10 }, edge: { style: 'street' } };

export function qingStreetScene(ctx) {
  const L = script.qingStreet;
  return storyScene(ctx, { key: 'qingStreet', arena: HANSEONG, mood: 'overcast', async run({ g, hook, cam, say, people, fadeIn }) {
    const { world } = ctx;
    const column = troop(g, 'qingSoldier', -16, 0, { cols: 2, rows: 5, gap: 1.4, ry: Math.PI / 2, jitter: 0.15 });
    // 길가 가게 앞 사람들(카메라 쪽 길가에서 얼굴이 보이게)
    const folk = [[-4, 5.2], [-2.4, 5.6], [2.2, 5.4], [3.8, 5.8], [0, 6.4]].map(([x, z], i) => person(g, ['commoner', 'commoner', 'woman', 'peasant', 'kidModern'][i], x, z, 0));
    folk.forEach(p => face(p, 0, 15)); people.push(...folk);
    cam([0, 3.6, 15], [0, 1.4, 0]);
    await fadeIn();
    hook.facing = facingShare(world, folk);
    const go = march(world, column, 32, 0, 8, { turn: false });
    await say(L[0], folk[0]);
    ctx.dialogue.close();
    folk.forEach(p => face(p, 4, 0));
    await go;
    hook.passed = column.length;
  } });
}
