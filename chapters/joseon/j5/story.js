// 조선 5장 끝 해설 장면(D-58): 항복 뒤 소현세자와 봉림대군이 청나라 군사에게 이끌려 눈길을 따라 북쪽으로 떠나고, 백성들이 길가에서 지켜본다.
import * as THREE from 'three';
import { storyScene, person, wait, march, face, troop, facingShare } from '../../kit/story.js';
import { LOOKS } from '../../../content/characters.js';
import script from './script.js';

export const NORTH_ROAD = { origin: [400, 0], ground: 'earth', groundColor: 0xe2e4e8, hill: 1, bounds: { x0: -18, x1: 18, z0: -10, z1: 12 }, edge: { style: 'snow' } };

export function hostageScene(ctx) {
  const R = script.result;
  return storyScene(ctx, { key: 'hostage', arena: NORTH_ROAD, mood: 'snow', async run({ g, hook, cam, glide, say, people, fadeIn }) {
    const { world } = ctx;
    // 왼쪽(남쪽)에서 오른쪽(북쪽)으로 눈길을 걸어가는 행렬: 청 군사 사이에 두 왕자
    const princes = [person(g, 'crownPrince', -13, 0.4, Math.PI / 2), person(g, { ...LOOKS.crownPrince, robe: 0x3a4a6a, named: true }, -14.4, -0.6, Math.PI / 2)];
    const guards = [[-11.2, 1.2], [-11.4, -1.2], [-16.2, 1], [-16.4, -1.4], [-18, 0]].map(([x, z]) => person(g, 'qingSoldier', x, z, Math.PI / 2));
    // 길가에서 지켜보는 백성들(카메라 쪽 길가, 얼굴이 보이게)
    const folk = [...troop(g, ['commoner', 'woman', 'kid'], -6.5, 4.2, { cols: 3, rows: 1, gap: 1.4, ry: 0 }), ...troop(g, ['woman', 'commoner'], 6.5, 4.4, { cols: 2, rows: 1, gap: 1.4, ry: 0 })]; // 길 양쪽 가(가운데는 비워 행렬이 보이게)
    folk.forEach(p => face(p, 0, 14)); people.push(...folk);
    cam([0, 4.6, 15], [0, 1.2, -1]);
    await fadeIn();
    hook.facing = facingShare(world, folk);
    const go = march(world, [...princes, ...guards], 22, 0, 9, { turn: false });
    await say(script.hostage.line, folk[1]);
    ctx.dialogue.close();
    folk.forEach(p => face(p, 6, 0)); // 떠나는 행렬을 바라본다
    await say(R[2]);
    ctx.dialogue.close();
    await go;
    hook.left = princes.length;
  } });
}
