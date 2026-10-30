// 조선 1장 이야기 장면(D-58): 1392년 이성계가 왕위에 올라 새 나라를 세운다. 궁궐 단 위에 선 이성계 앞에 신하들이 줄지어 절을 올린다.
import * as THREE from 'three';
import * as BLD from '../../kit/buildings.js';
import { storyScene, person, wait, face, troop, ease } from '../../kit/story.js';
import { playAction } from '../../../core/people.js';
import script from './script.js';
import { LOOKS } from '../../../content/characters.js';

export const CORONATION = { origin: [400, 0], ground: 'stone', groundColor: 0xb3ab99, hill: 0.6, bounds: { x0: -14, x1: 14, z0: -10, z1: 12 }, edge: { style: 'tile' } };

export function coronationScene(ctx) {
  const T = script.turnback;
  return storyScene(ctx, { key: 'coronation', arena: CORONATION, mood: 'morning', async run({ g, hook, cam, glide, say, fadeIn }) {
    const { world } = ctx;
    const t = new THREE.Group(); t.position.set(0, 0, -6); g.add(t); BLD.terrace(t, { w: 12, d: 5, h: 1.2 });
    const hall = new THREE.Group(); hall.position.set(0, 1.2, -8.2); g.add(hall); BLD.hanok(hall, { tile: true, seed: 9 }); hall.scale.setScalar(1.5); // 전각 돌계단이 단 위 왕의 발에 겹치지 않게 뒤로(2026-10-30)
    
    const dais = new THREE.Group(); dais.position.y = 1.2 + 0.095; g.add(dais); // 단 윗면(축대 덮개 윗면, 2026-10-30: 발이 덮개에 묻히지 않게). 걸음 흔들기가 높이를 바꾸지 않게 무리째 올린다
    const king = person(dais, { ...LOOKS.sejong, face: LOOKS.yiseonggye.face, named: true }, 0, -4.4, 0); king.userData.noWalk = true;
    g.updateMatrixWorld(true);
    const shoes = []; king.traverse(o => { if (o.name === 'shoe') shoes.push(new THREE.Box3().setFromObject(o).expandByScalar(-0.01)); });
    hook.kingFeetHidden = 0; [hall, t].forEach(r => r.traverse(o => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o); if (b.max.y > dais.position.y + 0.02 && shoes.some(sh => sh.intersectsBox(b))) hook.kingFeetHidden += 1; })); // 발에 겹친 돌
    hook.kingFeet = king.getWorldPosition(new THREE.Vector3()).y; hook.daisTop = t.position.y + 1.2 + 0.095; // 발바닥 = 단 윗면 // 왕이 된 이성계: 곤룡포와 익선관, 얼굴은 이성계
    // 마당 양쪽에 줄지어 선 신하들(가운데 길을 보며 선다)
    const left = troop(g, ['joseonOfficial', 'minister', 'scholar'], -4.5, 0, { cols: 1, rows: 4, gap: 1.6, ry: Math.PI / 2, jitter: 0.1 });
    const right = troop(g, ['minister', 'joseonOfficial', 'scholar'], 4.5, 0, { cols: 1, rows: 4, gap: 1.6, ry: -Math.PI / 2, jitter: 0.1 });
    const all = [...left, ...right];
    // 줄을 앞뒤로 펼친다(troop은 바라보는 쪽 뒤로 쌓으므로 z로 다시 놓는다)
    all.forEach((p, i) => { p.position.z = -1.5 + (i % 4) * 2.1; face(p, 0, -4.4); });
    cam([0, 3.2, 13], [0, 2.2, -4]);
    await fadeIn();
    await glide([0, 3.2, 13], [0, 2.2, -4], [0, 3.6, 6], [0, 2.6, -4], 2.2); // 단 위 이성계에게 다가간다
    // 신하들이 왕을 향해 허리와 고개를 숙여 예를 갖춘다(2026-10-30): 앞줄부터 조금씩 늦게, 몸통(허리)과 고개를 함께 숙이고, 숙인 채 잠시 머물렀다가 천천히 편다.
    // 발은 땅에 붙어 있다(몸 전체를 기울이지 않는다)
    all.forEach(p => face(p, 0, -4.4));
    const bow = (p, d) => playAction(p, { dur: 2.4, fadeIn: 0.5, fadeOut: 0.6, name: 'bow', pose: () => ({ upper: [0.62, 0, 0], head: [0.35, 0], arms: [[-0.55, 0, 0.35], [-0.55, 0, -0.35]] }) }).then(() => d);
    await Promise.all(all.map((p, i) => wait(world, (i % 4) * 0.22 + (i < 4 ? 0 : 0.1) + Math.sin(i * 7.1) * 0.05).then(() => bow(p))));
    hook.bows = all.length; hook.bowedUpper = true;
    await say(T[2]);
    hook.king = true;
  } });
}
