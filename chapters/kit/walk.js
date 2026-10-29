// 걸으며 겪는 장면 도구(D-35 근대 6장부터): 마을과 떨어진 무대에서 빛나는 자리를 차례로 걸어가 대화 버튼을 누르면 그 자리 장면이 펼쳐진다.
// 역사책·가져다 놓기를 체험으로 바꾼 장(k6 두 갈래 길·나룻배, i1 시대별 걷기)이 같이 쓴다. 다음 놀이 앞에서 사람에게 말 걸기(C-05)도 여기에.
import * as THREE from 'three';
import { labelSprite } from './play.js';
import { makePerson, setCarry, mat } from '../../core/people.js';
import { waitInteract } from '../../core/portal.js';
import { LOOKS } from '../../content/characters.js';

export const wait = (world, sec, f) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(sec, t + dt); f?.(t / sec, dt); if (t >= sec) { off(); res(); } }); });
export const person = (g, look, x, z, ry = 0) => { const p = makePerson(typeof look === 'string' ? LOOKS[look] : look); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); return p; };
export const ease = k => k * k * (3 - 2 * k);
export const face = (p, x, z) => { p.rotation.y = Math.atan2(x - p.position.x, z - p.position.z); };

// 자리마다 빛나는 고리와 이름표(무대 기준 spots[i])
export function stationMarks(a, g, stations, spots) {
  return stations.map((st, i) => {
    const S = spots[i];
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(S.x, 0.09, S.z); g.add(ring);
    const lab = labelSprite(st.label, { size: 0.85 }); lab.position.set(S.x, 4.1, S.z); g.add(lab);
    return { ring, lab, pos: a.at(S.x, S.z) };
  });
}

// 빛나는 자리를 차례로 걸어가 대화 버튼을 누른다(자리 이름은 처음부터 모두 보이고, 겪은 곳은 흐리게). between(i): 그 자리 앞에서 먼저 할 일
export async function walkStations(ctx, { stations, marks, counter, act, between }) {
  const { world, dialogue, hud } = ctx, n = stations.length;
  for (const [i, st] of stations.entries()) {
    await between?.(i);
    hud.setCounter(`${counter} ${i}/${n}`);
    marks.forEach((m, j) => { m.ring.visible = j === i; });
    await waitInteract(ctx, { pos: marks[i].pos, label: st.act, mark: true, markY: 3.2 });
    ctx.input.enabled = false;
    marks[i].ring.visible = false;
    marks.forEach(m => { m.lab.visible = false; }); // 장면 동안 이름표는 숨긴다(카메라를 가리지 않게)
    await act(st, i);
    dialogue.close();
    setCarry(world.player, null);
    world.camMode = 'follow';
    marks.forEach(m => { m.lab.visible = true; });
    marks[i].lab.material.opacity = 0.45;
  }
  hud.setCounter(`${counter} ${n}/${n}`);
}

// 말하는 사람 얼굴을 정면에서 보며 한 줄
export function sayer(ctx) {
  const { world, dialogue } = ctx;
  return async (line, who = null) => {
    if (who) { const m = who.getWorldPosition(new THREE.Vector3()), pp = world.player.position; who.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z); world.setTalkCamera({ position: m }); }
    await dialogue.say(line);
  };
}

// 학교 교실: 앞(+z)이 열린 방, 칠판·선생님 책상·책상 여덟과 학생들. teacher: 선생님 생김새
export function classroom(g, x, z, { teacher = 'scholarModern', wall = 0xe6dcc3 } = {}) {
  const c = new THREE.Group(); c.position.set(x, 0, z); g.add(c);
  const box = (w, h, d, color, bx, by, bz, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(bx, by, bz); m.castShadow = true; m.receiveShadow = true; c.add(m); return m; };
  box(9, 0.1, 7, 0x8a6a48, 0, 0.05, 0);
  box(9, 3.4, 0.2, wall, 0, 1.7, -3.5, 'stone'); box(0.2, 3.4, 7, wall, -4.5, 1.7, 0, 'stone'); box(0.2, 3.4, 7, wall, 4.5, 1.7, 0, 'stone');
  box(3.4, 1.3, 0.06, 0x24382e, 0, 1.9, -3.36, 'grain'); // 칠판
  box(1.2, 0.8, 0.6, 0x6b4a32, 0, 0.4, -2.2);            // 선생님 책상
  const t = person(c, teacher, 0.9, -2.7, 0);
  const kids = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const kx = -2.7 + i * 1.8, kz = -0.4 + r * 1.8;
    box(1.2, 0.7, 0.5, 0x7a5a3c, kx, 0.35, kz - 0.55);
    kids.push(person(c, i % 2 ? 'schoolgirl' : 'student', kx, kz, Math.PI));
  }
  return { group: c, teacher: t, kids, box };
}

// 다음 놀이 앞에서 기다리기(C-05): 부분 intro 맨 앞의 { meet } 표시에서 그 사람 머리 위에 느낌표를 띄우고, 학생이 말을 걸 때까지 기다린다
export const meet = (who, label, lines) => [{ meet: { who, label } }, ...lines];
export async function meetPerson(ctx, { who, label }) {
  const { world } = ctx, npc = world.npcs.get(who);
  npc.mark.visible = true;
  await waitInteract(ctx, { pos: npc.mesh.position, label, mark: false });
  npc.mark.visible = false;
  face(npc.mesh, world.player.position.x, world.player.position.z); // 말을 건 학생 쪽으로 돌아서서 정면으로
  world.setTalkCamera(npc.mesh);
}
// 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다. 끝나면 퀴즈 목표는 빛나는 문이 대신(C-01)
export async function minigameWithMeet(base, ctx) {
  const d = ctx.dialogue, say = d.say;
  d.say = line => (line && line.meet ? meetPerson(ctx, line.meet) : say.call(d, line));
  try { return await base.minigame(ctx); } finally { d.say = say; ctx.setGoal(null); }
}

// 얼굴이 보이는지(D-45 상시 규칙): 사람들 가운데 카메라 쪽을 바라보는(앞 방향과 카메라 쪽이 dot 이상) 비율. 만세·환호처럼 여럿이 함께하는 장면은 0.8 이상이어야 한다
export function facingShare(world, people, dot = 0.2) {
  const cam = world.camera.position, v = new THREE.Vector3(), q = new THREE.Quaternion(), f = new THREE.Vector3();
  const n = people.filter(p => {
    p.getWorldPosition(v); p.getWorldQuaternion(q);
    f.set(0, 0, 1).applyQuaternion(q).setY(0).normalize();
    const to = new THREE.Vector3(cam.x - v.x, 0, cam.z - v.z).normalize();
    return f.dot(to) >= dot;
  }).length;
  return people.length ? n / people.length : 1;
}
