// 조선 2장 끝 해설 장면(D-58): 1446년 훈민정음을 세상에 널리 알린다. 저잣거리 알림판 앞에 백성들이 모여 새 글자를 읽어 보고 기뻐한다.
import * as THREE from 'three';
import * as BLD from '../../kit/buildings.js';
import { storyScene, person, wait, march, face, facingShare } from '../../kit/story.js';
import script from './script.js';

export const MARKET = { origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, hill: 0.7, bounds: { x0: -14, x1: 14, z0: -8, z1: 12 }, edge: { style: 'thatch' } };

export function proclaimScene(ctx) {
  const R = script.result;
  return storyScene(ctx, { key: 'proclaim', arena: MARKET, mood: 'spring', async run({ g, hook, cam, glide, say, people, fadeIn }) {
    const { world } = ctx;
    const board = new THREE.Group(); board.position.set(0, 0, -3); g.add(board); BLD.noticeBoard(board, { n: 3 }); board.scale.setScalar(1.4);
    for (const x of [-2.2, 2.2]) { const b = new THREE.Group(); b.position.set(x, 0, -3.3); BLD.banner(b, { text: '훈민정음', h: 3.4 }); g.add(b); }
    const scholar = person(g, 'scholar', 2.6, -1.6, -0.4);
    // 사방에서 모여드는 백성들
    const looks = ['commoner', 'woman', 'kid', 'commoner', 'woman', 'villager', 'commoner', 'kid'];
    const spots = [[-2.4, 2.6], [-0.8, 2.9], [0.8, 2.6], [2.2, 3], [-1.6, 4.2], [0, 4.4], [1.6, 4.2], [-3, 4]];
    const folk = looks.map((lk, i) => person(g, lk, spots[i][0] + (i % 2 ? 9 : -9), spots[i][1] + 5, 0));
    cam([0, 3.4, 14], [0, 1.8, -2]);
    await fadeIn();
    await Promise.all(folk.map((p, i) => march(world, [p], -(i % 2 ? 9 : -9), -5, 2.4)));
    folk.forEach(p => face(p, 0, -3));
    hook.gathered = folk.length;
    await say(R[0]);
    ctx.dialogue.close();
    // 알림판 쪽에서 백성들의 얼굴을 본다(새 글자를 읽고 고개를 들어 기뻐한다)
    folk.forEach(p => face(p, 0.8, -2.5));
    people.push(...folk);
    await glide([0, 3.4, 14], [0, 1.8, -2], [0.8, 3, -2.5], [0, 1.5, 4], 1.6);
    hook.facing = facingShare(world, folk);
    await say(script.proclaim.line, folk[1]);
    face(scholar, 0.8, -2.5);
    await say(R[1]);
  } });
}
