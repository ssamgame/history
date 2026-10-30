// 5장 끝 해설 장면(D-58): 1236년부터 1251년까지 16년 동안 만든 경판이 서가를 가득 채운다(81,258판, 팔만대장경).
// 스님과 일꾼들이 경판을 안고 서가로 나르고, 해가 바뀔 때마다 서가가 한 칸씩 찬다. 위에 뜬 해(연도)가 1236년에서 1251년까지.
import * as THREE from 'three';
import { labelSprite } from '../kit/play.js';
import { setCarry } from '../../core/people.js';
import { storyScene, person, wait, march, face, blk } from '../kit/story.js';
import script from './script.js';

export const STOREHOUSE = { origin: [400, 0], ground: 'earth', groundColor: 0x8a7a62, hill: 0.9, bounds: { x0: -14, x1: 14, z0: -8, z1: 12 }, edge: { style: 'forest' } };

export function tripitakaScene(ctx) {
  const L = script.result;
  return storyScene(ctx, { key: 'tripitaka', arena: STOREHOUSE, mood: 'autumn', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 판전(경판 보관 건물): 뒤 벽과 지붕, 그 앞에 늘어선 나무 서가 다섯
    blk(g, 22, 3.6, 0.4, 0xd8ccb0, 0, 1.8, -5.2, 'plaster');
    for (const x of [-10.5, -5.25, 0, 5.25, 10.5]) blk(g, 0.4, 3.6, 0.4, 0x6b4a32, x, 1.8, -1.2);
    const roof = blk(g, 23.5, 0.35, 6, 0x3e3a36, 0, 3.9, -3.2, 'tile'); roof.rotation.x = 0.08;
    const racks = [-8, -4, 0, 4, 8].map(x => { const r = new THREE.Group(); r.position.set(x, 0, -3.6); g.add(r);
      for (const sx of [-1.6, 1.6]) blk(r, 0.12, 3, 0.9, 0x6b4a32, sx, 1.5, 0);
      for (let k = 0; k < 5; k++) blk(r, 3.3, 0.08, 0.9, 0x6b4a32, 0, 0.3 + k * 0.62, 0);
      const boards = []; for (let k = 0; k < 5; k++) for (let j = 0; j < 9; j++) { const b = blk(r, 0.28, 0.5, 0.8, 0x7a5a36, -1.4 + j * 0.35, 0.6 + k * 0.62, 0); b.visible = false; boards.push(b); }
      return { r, boards }; });
    const all = racks.flatMap(r => r.boards);
    const years = [1236, 1240, 1244, 1248, 1251].map(y => { const s = labelSprite(`${y}년`, { size: 1.4 }); s.position.set(0, 5.6, -3); s.visible = false; g.add(s); return s; });
    // 경판을 안고 나르는 스님과 일꾼
    const carriers = [[-6, 6], [-3, 7], [0, 6.5], [3, 7.2], [6, 6.2]].map(([x, z], i) => { const p = person(g, i % 2 ? 'artisan' : 'monk', x, z, Math.PI);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.26), new THREE.MeshLambertMaterial({ color: 0x7a5a36 })); setCarry(p, b, 'arms'); return p; });
    const monk = person(g, 'monk', 9.5, 4, -Math.PI * 0.7);
    cam([0, 3.4, 15], [0, 1.9, -3]);
    await fadeIn();
    const chunk = Math.ceil(all.length / years.length);
    for (let y = 0; y < years.length; y++) {
      years.forEach((s, i) => { s.visible = i === y; });
      await march(world, carriers, 0, -5.4, 1.1);
      all.slice(y * chunk, (y + 1) * chunk).forEach(b => { b.visible = true; });
      ctx.audio?.play?.('tap');
      await march(world, carriers, 0, 5.4, 0.8);
      if (y === 1) await say(L[0]);
      if (y === 1) ctx.dialogue.close();
    }
    hook.filled = all.filter(b => b.visible).length === all.length;
    hook.years = years.length;
    [[-11, 2], [-9.6, 3.4], [-12, 4], [9.6, 2.6], [11.2, 3.8]].forEach(([x, z], i) => { carriers[i].position.set(x, 0, z); face(carriers[i], 0, 12); }); // 서가 앞을 비킨다
    monk.position.set(2.6, 0, 2.4); face(monk, 1, 11);
    await glide([0, 3.4, 15], [0, 1.9, -3], [1, 2.8, 10.5], [1.5, 2, -2], 1.4); // 가득 찬 서가와 스님
    await say(script.tripitaka.line, monk);
    await say(L[1]);
  } });
}
