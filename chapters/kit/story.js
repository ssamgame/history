// 이야기 장면(D-58, 2026-10-30 선생님: 장마다 서사가 진행되는 곳에 장면 연출): 마을과 떨어진 무대(x 400 안팎)에 그 순간을 세우고,
// 고정 카메라로 보여 주며 해설·인물 대사를 띄운 뒤 무대를 치우고 학생·카메라·분위기를 처음대로 되돌린다.
// 일제 강점기·현대편 '탐험 끝 장면'(chapters/colonial/*, chapters/present/*)과 같은 방식을 고려·조선·근대편 장도 함께 쓰게 한 곳.
// 장면은 읽기와 같아서 첫 시도 점수에 넣지 않는다. 테스트 훅: ctx.testHooks[key] = { shown, lines, facing, ... }.
import * as THREE from 'three';
import { buildArena } from './play.js';
import { wait, person, ease, face, facingShare } from './walk.js';
import { setExpression, setTalking, mat } from '../../core/people.js';

export { wait, person, ease, face, facingShare };

// run({ a, g, hook, cam, glide, say, people }) 안에서 장면을 짓고 움직인다. say(line, who?)는 대사(who가 있으면 그 사람 3D 얼굴도 표정)
export async function storyScene(ctx, { key, arena, mood = null, run }) {
  const { world, dialogue } = ctx;
  const P = world.player.position.clone(), ry = world.player.rotation.y, mode = world.camMode, cv = world.closeView, mood0 = world.moodName, inp = ctx.input.enabled, vis = world.player.visible;
  const hook = ctx.testHooks[key] = { shown: false, lines: 0, facing: 1 };
  ctx.input.enabled = false;
  world.storyOn = true; // 이야기 장면 중(고정 카메라를 쓰는 때라고 테스트·장 코드가 알 수 있게)
  await ctx.fade?.(true);
  const a = buildArena(world, arena), g = a.group;
  const hidden = world.level.children.filter(o => o !== g && o.visible); hidden.forEach(o => { o.visible = false; }); // 마을 땅·산이 무대 너머로 비치지 않게(그리기도 줄어든다)
  if (mood) world.setMood(mood);
  world.player.visible = false; // 학생은 마을에 그대로 두고(장면에는 나오지 않는다) 끝나면 같은 자리로
  const abs = ([x, y, z]) => { const p = a.at(x, z); return [p.x, y, p.z]; };
  const cam = (pos, look) => world.setFixedCamera(abs(pos), abs(look));
  // 카메라를 sec초 동안 pos0→pos1로 천천히 옮긴다(보는 곳도 함께)
  const glide = (p0, l0, p1, l1, sec) => { const A = new THREE.Vector3(...abs(p0)), B = new THREE.Vector3(...abs(p1)), C = new THREE.Vector3(...abs(l0)), D = new THREE.Vector3(...abs(l1)), p = new THREE.Vector3(), l = new THREE.Vector3();
    return wait(world, sec, k => { const e = ease(k); p.lerpVectors(A, B, e); l.lerpVectors(C, D, e); world.setFixedCamera(p.toArray(), l.toArray()); }); };
  const say = async (line, who = null) => {
    hook.lines += 1;
    if (who && line.expr) setExpression(who, line.expr);
    if (who) setTalking(who, line.expr || 'talk'); // 말하는 사람의 손짓·끄덕임(2026-10-30 움직임 개선)
    await dialogue.say(line);
    if (who && line.expr) setExpression(who, 'neutral');
    if (who) setTalking(who, null);
  };
  const people = []; // facingShare를 잴 사람들(여럿이 한마음으로 하는 장면은 얼굴이 보이게, D-45)
  try {
    hook.shown = true;
    await run({ a, g, hook, cam, glide, say, people, abs, fadeIn: () => ctx.fade?.(false) });
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    hidden.forEach(o => { o.visible = true; });
    a.dispose();
    if (mood0) world.setMood(mood0);
    world.player.visible = vis;
    world.player.position.copy(P); world.player.rotation.y = ry;
    world.closeView = cv;
    world.camMode = mode === 'fixed' ? 'follow' : mode; world.snapCamera?.();
    ctx.input.enabled = inp;
    world.storyOn = false;
    await ctx.fade?.(false);
  }
  return hook;
}

// 줄지어 선 무리: cols×rows, 간격 gap, 바라보는 방향 ry(0이면 +z 쪽). 조금씩 비켜 서서 바둑판처럼 보이지 않게
export function troop(g, looks, x, z, { cols = 4, rows = 2, gap = 1.2, ry = 0, jitter = 0.25 } = {}) {
  const out = [], L = Array.isArray(looks) ? looks : [looks];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, j = n => { const v = Math.sin((i + 1) * n * 12.9898 + x * 3.1 + z) * 43758.5453; return (v - Math.floor(v) - 0.5) * jitter * 2; };
    const dx = (c - (cols - 1) / 2) * gap + (r % 2) * gap * 0.4 + j(1), dz = r * gap + j(2);
    const px = x + dx * Math.cos(ry) - dz * Math.sin(ry), pz = z - dx * Math.sin(ry) - dz * Math.cos(ry); // 앞줄이 (x, z), 뒷줄은 바라보는 쪽의 뒤로
    out.push(person(g, L[i % L.length], px, pz, ry + j(3) * 0.4));
  }
  return out;
}

// 사람들을 sec초 동안 (dx, dz)만큼 걸어가게 한다(걸음은 인물이 스스로 흔든다). 바라보는 방향도 가는 쪽으로
// 출발할 때 천천히 빨라지고 멈출 때 천천히 느려진다(가운데는 고른 빠르기). 방향은 그쪽으로 부드럽게 돌아서며 출발한다(2026-10-30 움직임 개선)
const glideK = k => { const a = 0.18; return k < a ? k * k / (2 * a * (1 - a)) : k > 1 - a ? 1 - (1 - k) * (1 - k) / (2 * a * (1 - a)) : (k - a / 2) / (1 - a); };
export function march(world, list, dx, dz, sec, { turn = true } = {}) {
  const p0 = list.map(p => p.position.clone()), y0 = list.map(p => p.rotation.y), want = Math.atan2(dx, dz);
  return wait(world, sec, k => list.forEach((p, i) => {
    const e = glideK(k);
    p.position.set(p0[i].x + dx * e, p0[i].y, p0[i].z + dz * e);
    if (turn) p.rotation.y = y0[i] + Math.atan2(Math.sin(want - y0[i]), Math.cos(want - y0[i])) * Math.min(1, k * sec / 0.35);
  }));
}

// 땅 위에 놓는 간단한 상자 조각(무대 소품)
export function blk(g, w, h, d, color, x, y, z, kind = 'wood') {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}

// 만세·환호: 오른팔(과 왼팔 조금)을 앞으로 들어 머리 위로(D-45: rotation.x는 음수, 앞으로 든다)
export function raiseArms(p, u, both = false) {
  const a = p.userData.arms; if (!a) return;
  a[1].rotation.set(-Math.PI * 0.9 * u, 0, 0); a[0].rotation.set(both ? -Math.PI * 0.9 * u : -0.4 * u, 0, 0);
}
