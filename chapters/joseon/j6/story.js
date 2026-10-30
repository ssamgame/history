// 조선 6장 끝 해설 장면(D-58): 1796년 완성된 화성(장안문과 성벽에 깃발) → 관청 마루에서 관리들이 공사 과정을 『화성성역의궤』에 적고 그린다.
import * as THREE from 'three';
import * as BLD from '../../kit/buildings.js';
import { hwaseongGate } from '../landmarks.js';
import { labelSprite } from '../../kit/play.js';
import { storyScene, person, wait, face, troop, blk } from '../../kit/story.js';
import script from './script.js';

export const HWASEONG_DONE = { origin: [400, 0], ground: 'earth', groundColor: 0x9a8a68, hill: 0.8, bounds: { x0: -16, x1: 16, z0: -10, z1: 14 }, edge: { style: 'tile' } };

export function uigweScene(ctx) {
  const R = script.result;
  return storyScene(ctx, { key: 'uigwe', arena: HWASEONG_DONE, mood: 'autumn', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // ① 완성된 장안문과 양쪽 성벽, 깃발
    const gate = hwaseongGate(); gate.position.set(0, 0, -6); g.add(gate);
    for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 10, 0, -6); BLD.wall(w, { w: 10, h: 4, color: 0xb3ab99 }); g.add(w); }
    for (const x of [-13, -8, 8, 13]) { const f = new THREE.Group(); f.position.set(x, 4, -6); BLD.banner(f, { color: [0x2f4a7a, 0x8a2f24, 0xd9a441, 0x3a6a3a][(x + 13) % 4 | 0], h: 2.6 }); g.add(f); }
    const crowd = troop(g, ['worker', 'commoner', 'worker', 'woman', 'commoner'], 0, 4, { cols: 5, rows: 1, gap: 1.5, ry: Math.PI });
    cam([3, 3.6, 16], [0, 3, -6]);
    await fadeIn();
    await say(R[0]);
    ctx.dialogue.close();
    // ② 관청 마루: 책상 위 펼친 의궤와 붓을 든 관리들(무대 오른쪽 따로 세운 마루)
    const floor = new THREE.Group(); floor.position.set(0, 0, 9); g.add(floor);
    blk(floor, 8, 0.4, 5, 0x8a6a48, 0, 0.2, 0, 'wood');
    const desk = blk(floor, 2.6, 0.5, 1.1, 0x6b4a32, 0, 0.65, -0.4, 'wood');
    const book = blk(floor, 1.4, 0.06, 0.9, 0xe8e2d2, 0, 0.93, -0.4, 'cloth'); void desk; void book;
    for (let i = 0; i < 3; i++) blk(floor, 0.5, 0.04, 0.7, 0xe8e2d2, -1.8 + i * 1.8, 0.45, 1.2, 'cloth'); // 바닥에 펼친 그림(거중기·성문 그림)
    const title = labelSprite('화성성역의궤', { size: 0.8 }); title.position.set(-2.8, 2.4, -1); floor.add(title);
    const writers = [[-1.1, 0.5], [1.1, 0.5], [0, 1.6]].map(([x, z], i) => { const p = person(floor, i === 2 ? 'scholar' : 'joseonOfficial', x, z, Math.PI); p.position.y = 0.4; return p; });
    crowd.forEach(p => { p.visible = false; });
    cam([3.2, 3.2, 2.6], [0, 1.1, 9.8]); // 책상 너머에서 붓을 든 관리들의 얼굴을
    writers.forEach(p => face(p, 0, 8.6 - 9)); // 책상(의궤)을 본다
    hook.book = true;
    await say(R[1]);
  } });
}
