// 군대 배치(2026-10-30 선생님: 군대의 규모감·웅장함, 몽골군은 기마병 중심). 이야기 장면·무대에서 같이 쓴다.
// - rider(g, look, x, z, ry, { y }) : 말 탄 사람 하나(core/horse.js). 말과 사람은 함께 움직인다
// - host(g, spec) : 기마병·보병·장수를 섞은 대형. 줄마다 간격·방향·자세를 조금씩 다르게(복제한 듯 보이지 않게),
//   장수는 앞에 서고 깃발을 든 기수가 곁을 지킨다. 땅 높이(ground)를 주면 사람과 말의 발이 그 높이에 닿는다.
// - advance(world, units, dx, dz, sec, { ground, stagger }) : 대열이 줄마다 조금씩 늦게 출발해 천천히 빨라지고 천천히 멈춘다(땅 높이를 따라)
// - command(p) : 장수가 칼·손을 앞으로 뻗어 가리킨다(대열을 지휘)
import * as THREE from 'three';
import { makePerson, setStyle, playAction } from '../../core/people.js';
import { makeHorse, mount } from '../../core/horse.js';
import { LOOKS } from '../../content/characters.js';
import { wait } from './walk.js';
import * as BLD from './buildings.js';

const L = look => (typeof look === 'string' ? LOOKS[look] : look);
const rnd = (i, n) => { const v = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };

export function rider(g, look, x, z, ry = 0, { y = 0, coat, armor = null, saddle } = {}) {
  const h = makeHorse({ coat, armor, saddle }), p = makePerson(L(look));
  mount(h, p);
  h.position.set(x, y, z); h.rotation.y = ry; g.add(h);
  h.userData.person = p;
  return h;
}

// 깃발 기수가 드는 긴 깃대(장수 곁). color 깃폭 색
function standard(p, color) {
  const f = new THREE.Group();
  BLD.banner(f, { color, h: 3.4 });
  f.position.set(0.5, -0.55, 0.15); // 오른손 자리에서 위로
  p.userData.arms[1].add(f); p.userData.arms[1].rotation.set(-0.35, 0, -0.1);
  p.userData.spearHeld = true;
  return f;
}

// spec: { x, z, ry(바라보는 방향), ground(x, z) → 높이, front: 'cavalry'|'infantry',
//   cavalry: { looks, n, cols, gap }, infantry: { looks, n, cols, gap }, general: look, banner: 색, depth(줄 사이) }
// 돌려주는 것: { units(움직일 것 전부: 말과 보병), riders, foot, general, bearer }
export function host(g, spec) {
  const { x = 0, z = 0, ry = 0, ground = () => 0 } = spec;
  const fwd = [Math.sin(ry), Math.cos(ry)], side = [Math.cos(ry), -Math.sin(ry)];
  const at = (a, b) => [x + side[0] * a + fwd[0] * b, z + side[1] * a + fwd[1] * b]; // a: 옆(오른쪽 +), b: 앞(+)
  const units = [], riders = [], foot = [];
  let row = 0, seed = Math.floor(Math.abs(x * 7 + z * 13)) + 1;
  const place = (o, a, b, i, turn = 0.18) => {
    const [px, pz] = at(a + (rnd(seed + i, 1) - 0.5) * 0.7, b + (rnd(seed + i, 2) - 0.5) * 0.7);
    o.position.set(px, ground(px, pz), pz);
    o.rotation.y = ry + (rnd(seed + i, 3) - 0.5) * turn * 2;
    g.add(o); units.push(o);
  };
  const block = (kind, part, b0) => {
    if (!part || !part.n) return b0;
    const looks = Array.isArray(part.looks) ? part.looks : [part.looks || (kind === 'cavalry' ? 'mongolArcher' : 'soldier')];
    const cols = part.cols || 5, gap = part.gap || (kind === 'cavalry' ? 2.6 : 1.35), depth = part.depth || (kind === 'cavalry' ? 3.2 : 1.5);
    for (let i = 0; i < part.n; i++) {
      const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, part.n - r * cols);
      const a = (c - (inRow - 1) / 2) * gap + (r % 2) * gap * 0.35, b = b0 - r * depth;
      seed += 1;
      if (kind === 'cavalry') {
        const h = rider(g, looks[i % looks.length], 0, 0, 0, { coat: part.coats?.[i % part.coats.length] });
        g.remove(h); place(h, a, b, i, 0.12); riders.push(h);
      } else {
        const p = makePerson(L(looks[i % looks.length]));
        place(p, a, b, i, 0.25); foot.push(p);
        if (rnd(seed, 5) < 0.4) setStyle(p, 'guard'); // 몇몇은 둘레를 살피며 경계한다
        else setStyle(p, 'soldier');
      }
      row = Math.max(row, r);
    }
    return b0 - (Math.ceil(part.n / cols)) * depth - (kind === 'cavalry' ? 1.2 : 0.6);
  };
  // 장수: 맨 앞 가운데에서 조금 비켜, 깃발 기수가 곁을 지킨다(말 탄 장수는 병사들 사이에서 묻히지 않는다)
  let general = null, bearer = null, b = 0;
  if (spec.general) {
    general = spec.generalOnFoot ? makePerson(L(spec.general)) : rider(g, spec.general, 0, 0, 0, { armor: spec.generalArmor ?? 0x6a5a40, saddle: 0x8a6a22 });
    if (general.parent) g.remove(general);
    const [px, pz] = at(-1.2, 2.6); general.position.set(px, ground(px, pz), pz); general.rotation.y = ry; g.add(general); units.push(general);
    if (spec.banner) {
      bearer = spec.generalOnFoot ? makePerson(L(spec.bearerLook || 'soldier')) : rider(g, spec.bearerLook || 'mongol', 0, 0, 0);
      if (bearer.parent) g.remove(bearer);
      const [qx, qz] = at(1.6, 1.8); bearer.position.set(qx, ground(qx, qz), qz); bearer.rotation.y = ry; g.add(bearer); units.push(bearer);
      standard(bearer.userData.person || bearer, spec.banner);
    }
  }
  const order = spec.front === 'infantry' ? ['infantry', 'cavalry'] : ['cavalry', 'infantry'];
  for (const k of order) b = block(k, spec[k], b);
  return { units, riders, foot, general, bearer };
}

// 대열이 함께 나아간다: 줄마다(앞에서 뒤로) stagger초씩 늦게 출발, 출발·멈춤은 천천히, 방향은 가는 쪽으로 돌아서며. 땅 높이를 따른다
export function advance(world, units, dx, dz, sec, { ground = null, stagger = 0.25, turn = true } = {}) {
  const p0 = units.map(u => u.position.clone()), y0 = units.map(u => u.rotation.y), want = Math.atan2(dx, dz);
  const fw = [Math.sin(want), Math.cos(want)];
  const lead = Math.max(...p0.map(p => p.x * fw[0] + p.z * fw[1]));
  const delay = p0.map(p => Math.min(1.2, (lead - (p.x * fw[0] + p.z * fw[1])) / 6 * stagger * 4)); // 앞줄이 먼저 나선다
  const total = sec + Math.max(...delay);
  const glide = k => { const a = 0.2; return k <= 0 ? 0 : k >= 1 ? 1 : k < a ? k * k / (2 * a * (1 - a)) : k > 1 - a ? 1 - (1 - k) * (1 - k) / (2 * a * (1 - a)) : (k - a / 2) / (1 - a); };
  return wait(world, total, k => units.forEach((u, i) => {
    const local = Math.max(0, Math.min(1, (k * total - delay[i]) / sec)), e = glide(local);
    const nx = p0[i].x + dx * e, nz = p0[i].z + dz * e;
    u.position.set(nx, ground ? ground(nx, nz) : p0[i].y, nz);
    if (turn && local > 0) u.rotation.y = y0[i] + Math.atan2(Math.sin(want - y0[i]), Math.cos(want - y0[i])) * Math.min(1, local * sec / 0.6);
  }));
}

// 장수의 지휘: 오른팔을 앞으로 높이 뻗어 가리켰다가 내린다(준비 → 뻗기 → 멈춤 → 회복)
export function command(p, { dur = 1.6 } = {}) {
  const person = p.userData.person || p;
  return playAction(person, { dur, fadeIn: 0.35, fadeOut: 0.45, pose: t => ({ arms: [null, [-1.9 - Math.sin(Math.min(1, t / dur) * Math.PI) * 0.2, 0, -0.15]], upper: [-0.04, 0.1, 0], head: [-0.08, 0] }) });
}

// 둘레를 살피는 기마병: 말이 제자리에서 고개를 돌리고 기수는 먼 곳을 본다(가만히 선 장식물처럼 보이지 않게)
export function patrol(world, list) {
  const t0 = list.map((_, i) => rnd(i, 7) * 6);
  return world.onUpdate((dt, t) => list.forEach((h, i) => {
    const p = h.userData.person; if (!p) return;
    const s = Math.sin(t * 0.35 + t0[i]);
    p.userData.look = new THREE.Vector3(h.position.x + Math.sin(h.rotation.y + s * 0.8) * 20, 2, h.position.z + Math.cos(h.rotation.y + s * 0.8) * 20);
  }));
}

// 땅에 박힌 정도(테스트 훅): 사람·말의 발(뿌리) 높이가 그 자리 땅보다 얼마나 낮은지 가장 큰 값
export function sunk(units, ground) {
  const v = new THREE.Vector3(); let worst = 0;
  for (const u of units) { u.getWorldPosition(v); const p = u.parent ? u.parent.worldToLocal(v.clone()) : v; worst = Math.max(worst, ground(p.x, p.z) - u.position.y); }
  return worst;
}

// 섬(town.js island 부품) 윗면 높이: 풀 언덕(반지름 0.75r까지 평평, 0.9r까지 비탈) → 모래톱(r) → 물가
export function islandGround(islands) {
  return (x, z) => {
    let h = 0;
    for (const p of islands) {
      const r = p.r || 4, d = Math.hypot(x - p.x, z - p.z);
      if (d <= r * 0.75) h = Math.max(h, 1.3);
      else if (d <= r * 0.9) h = Math.max(h, 1.3 - (d - r * 0.75) / (r * 0.15) * 0.9);
      else if (d <= r) h = Math.max(h, 0.4);
    }
    return h;
  };
}
