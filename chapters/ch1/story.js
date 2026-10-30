// 1장 이야기 장면(D-58): 담판 뒤 압록강 동쪽에 성을 쌓아 강동 6주를 얻는 장면. 일꾼들이 돌을 날라 성벽이 한 켜씩 올라가고, 서희가 지켜본다.
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { nameBoard } from '../kit/gate.js';
import { setCarry } from '../../core/people.js';
import { storyScene, person, wait, march, face, ease } from '../kit/story.js';
import script from './script.js';

export const GANGDONG = { origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, hill: 0.9, bounds: { x0: -16, x1: 16, z0: -8, z1: 14 },
  props: [{ type: 'water', x: 0, z: -22, w: 120, d: 16, solid: false }], edge: { style: 'forest', back: false } };

export function gangdongScene(ctx) {
  const L = script.gangdong;
  return storyScene(ctx, { key: 'gangdong', arena: GANGDONG, mood: 'morning', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 성벽: 가운데 문길을 두고 양쪽으로. 처음엔 낮게, 돌을 나를 때마다 한 켜씩 올라간다
    const walls = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 6.2, 0, -4); BLD.wall(w, { w: 9, h: 3.6, color: 0x9a9284 }); w.scale.y = 0.25; g.add(w); return w; });
    const board = nameBoard(g, '흥화진', 0, -3.4, { y: 0 }); board.visible = false;
    for (const x of [-9, -3.2, 3.2, 9]) { const f = new THREE.Group(); f.position.set(x, 3.6, -4); BLD.banner(f, { color: 0x8a2f24 }); f.visible = false; g.add(f); walls[x < 0 ? 0 : 1].userData.flags = (walls[x < 0 ? 0 : 1].userData.flags || []).concat(f); } // 다 쌓으면 성 위에 깃발
    // 돌무더기와 돌을 나르는 일꾼들
    const pile = new THREE.Group(); pile.position.set(-9, 0, 7); g.add(pile);
    for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + (i % 3) * 0.08, 0), new THREE.MeshLambertMaterial({ color: 0x8c8577, flatShading: true })); st.position.set((i % 3) * 0.6 - 0.6, 0.3 + Math.floor(i / 3) * 0.25, Math.floor(i / 3) * 0.3); pile.add(st); }
    const masons = [[-8, 5], [-6.5, 6.2], [-7.6, 3.4], [-5.2, 4.6]].map(([x, z]) => { const p = person(g, 'villager', x, z, Math.PI * 0.8);
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), new THREE.MeshLambertMaterial({ color: 0x8c8577, flatShading: true })); setCarry(p, s, 'arms'); return p; });
    const guards = [[4, 2], [9.5, 3.6], [-11, -1]].map(([x, z], i) => person(g, i === 2 ? 'archer' : 'soldier', x, z, Math.PI));
    const seohui = person(g, 'seohui', 7, 6.2, Math.PI * 1.15);
    hook.masons = masons.length;
    cam([2, 3.2, 17], [0, 1.6, -3]);
    await fadeIn();
    await say(L.lines[0]);
    // 일꾼들이 돌을 날라 성벽 앞에 놓으면 성벽이 한 켜씩 올라간다(세 번)
    for (let n = 0; n < 3; n++) {
      ctx.dialogue.close();
      await march(world, masons, 4.6, -6.2, 1.6);
      ctx.audio?.play?.('tap');
      const h0 = walls[0].scale.y, h1 = Math.min(1, h0 + 0.25);
      await wait(world, 0.5, k => walls.forEach(w => { w.scale.y = h0 + (h1 - h0) * ease(k); }));
      hook.rows = n + 1;
      if (n === 0) await say(L.lines[1], masons[1]);
      await march(world, masons, -4.6, 6.2, 1.2);
    }
    walls.forEach(w => { w.scale.y = 1; w.userData.flags.forEach(f => { f.visible = true; }); }); board.visible = true; hook.built = true;
    masons.forEach(p => face(p, 0, -4));
    await glide([2, 3.2, 17], [0, 1.6, -3], [2.6, 2.5, 11.5], [6, 1.9, 5.4], 1.4); // 서희 얼굴과 뒤로 다 쌓은 성벽
    face(seohui, 2.6, 11.5);
    await say(L.lines[2], seohui);
    hook.guards = guards.length;
  } });
}
