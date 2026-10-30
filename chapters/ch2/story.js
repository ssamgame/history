// 2장 이야기 장면(D-58): 흥화진을 지켜 낸 뒤 양규가 군사를 이끌고 거란군이 차지한 곽주를 되찾는다.
// 해 질 녘 곽주 성문 앞: 고려군이 성문을 열고 들어가 거란 깃발이 고려 깃발로 바뀌고, 갇혀 있던 백성들이 성문 밖으로 나와 기뻐한다(얼굴이 보이게, D-45).
import * as THREE from 'three';
import * as BLD from '../kit/buildings.js';
import { gateLeaves, nameBoard } from '../kit/gate.js';
import { storyScene, person, wait, march, face, troop, facingShare } from '../kit/story.js';
import script from './script.js';

export const GWAKJU = { origin: [400, 0], ground: 'earth', groundColor: 0xdfe2e6, hill: 0.8, bounds: { x0: -16, x1: 16, z0: -10, z1: 14 }, edge: { style: 'forest' } };

export function gwakjuScene(ctx) {
  const L = script.gwakju;
  return storyScene(ctx, { key: 'gwakju', arena: GWAKJU, mood: 'winterDusk', async run({ g, hook, cam, glide, say, people, fadeIn }) {
    const { world } = ctx;
    for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 7, 0, -6); BLD.wall(w, { w: 10, h: 4.4, color: 0x8c8577 }); g.add(w); }
    const gate = gateLeaves(g, { x: 0, z: -6, width: 4, height: 3.4, inward: -1 });
    const lintel = new THREE.Group(); lintel.position.set(0, 3.4, -6); g.add(lintel); BLD.wall(lintel, { w: 4.2, h: 1, color: 0x8c8577 });
    nameBoard(g, '곽주', 3.2, -4.9);
    // 성 위 깃발: 처음엔 거란 깃발(검은빛), 되찾으면 고려 깃발(붉은빛)
    const flags = [-8, -3.5, 3.5, 8].map(x => { const f = new THREE.Group(); f.position.set(x, 4.4, -6); BLD.banner(f, { color: 0x2e2a26, h: 3 }); g.add(f); return f; });
    const recolor = c => flags.forEach(f => f.traverse(m => { if (m.isMesh && m.geometry.type === 'PlaneGeometry') { m.material = m.material.clone(); m.material.color.setHex(c); } }));
    // 성 밖 고려군과 앞장선 양규
    const yg = person(g, 'yanggyu', -1.2, 2.5, Math.PI);
    const army = troop(g, ['soldier', 'archer', 'soldier'], 0.6, 5, { cols: 4, rows: 2, gap: 1.3, ry: Math.PI });
    cam([5, 6, 17], [0, 1.8, -4]); // 높이서 내려다봐 군사 너머로 성문이 보이게
    await fadeIn();
    await say(L.lines[0]);
    await say(L.lines[1], yg);
    ctx.dialogue.close();
    ctx.audio?.play?.('whoosh');
    await wait(world, 1, k => gate.setOpen(k));
    hook.open = true;
    await march(world, [yg, ...army], 0, -12, 2.6);
    [yg, ...army].forEach(p => { p.visible = false; }); // 성안으로 들어갔다
    recolor(0x8a2f24); hook.flag = 'goryeo';
    ctx.audio?.play?.('correct');
    // 갇혀 있던 백성들이 성문 밖으로 나온다
    const folk = [[-1.2, -8], [0.2, -9], [1.3, -8.4], [-0.5, -10], [0.9, -10.6], [-1.4, -10.8]].map(([x, z], i) => person(g, i === 5 ? 'kid' : 'villager', x, z, 0));
    await march(world, folk, 0, 13, 2.8);
    const spots = [[-3.2, 4.2], [-1.2, 5], [1, 4.4], [3, 5.2], [-2, 6.6], [2, 6.9]];
    folk.forEach((p, i) => { p.position.x = spots[i][0]; p.position.z = spots[i][1]; face(p, 0.5, 15); });
    people.push(...folk);
    await glide([5, 6, 17], [0, 1.8, -4], [0.5, 3, 15], [0, 1.6, 3], 1.2);
    hook.facing = facingShare(world, folk);
    await say(L.lines[2], folk[1]);
    await say(L.lines[3]);
    hook.freed = folk.length;
  } });
}

// 2장 끝 해설 장면(D-58): 현종이 거란에 직접 찾아가겠다고 약속하자 거란군이 북쪽으로 물러가고,
// 양규는 적은 군사로 물러가는 거란군 앞을 막아서며 끝까지 싸운다(피는 넣지 않는다. 눈발 속 깃발로 마무리).
export const LAST = { origin: [400, 0], ground: 'earth', groundColor: 0xdfe2e6, hill: 1, bounds: { x0: -20, x1: 20, z0: -14, z1: 14 }, edge: { style: 'forest' } };
export function lastStandScene(ctx) {
  const L = script.result;
  return storyScene(ctx, { key: 'lastStand', arena: LAST, mood: 'snow', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    // 왼쪽에서 오른쪽(북쪽 길)으로 물러가는 거란군 행렬
    const column = troop(g, ['khitan', 'khitanBright'], -12, -3, { cols: 3, rows: 4, gap: 1.4, ry: Math.PI / 2, jitter: 0.4 });
    const kflag = new THREE.Group(); kflag.position.set(-11, 0, -4.2); BLD.banner(kflag, { color: 0x2e2a26, h: 3.4 }); g.add(kflag);
    // 언덕 위 양규와 적은 군사(카메라 쪽 앞에서 행렬을 바라본다)
    const yg = person(g, 'yanggyu', 3, 4, Math.PI * 0.85);
    const few = [[1.4, 5.2], [4.6, 5.4], [2.2, 6.6], [5.4, 3.4]].map(([x, z], i) => person(g, i === 3 ? 'archer' : 'soldier', x, z, Math.PI * 0.85));
    const gflag = new THREE.Group(); gflag.position.set(4, 0, 6.4); BLD.banner(gflag, { color: 0x8a2f24, h: 3.6 }); g.add(gflag);
    cam([-2, 4.5, 15], [0, 1.2, -2]);
    await fadeIn();
    const go = march(world, [...column, kflag], 34, 0, 9, { turn: false });
    await say(L[0]);
    ctx.dialogue.close();
    few.forEach(p => face(p, -2, -1)); face(yg, -1, -0.5);
    await glide([-2, 4.5, 15], [0, 1.2, -2], [-1, 2.3, -0.5], [3, 1.9, 4.5], 1.6); // 행렬 쪽에서 양규와 군사들의 얼굴을
    await say(script.lastStand.line, yg);
    ctx.dialogue.close();
    await go;
    hook.retreated = column.length;
    await march(world, [yg, ...few], 6, -5, 2.2); // 물러가는 거란군 쪽으로 달려 나간다
    await glide([-1, 2.3, -0.5], [3, 1.9, 4.5], [2, 3, 12], [4, 3.2, 6.4], 1.4); // 남은 고려 깃발
    await say(L[1]);
    hook.flag = true;
  } });
}
