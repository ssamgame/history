// 고려편 시범(2026-10-26) 사람: 지금 게임의 사람(core/people.js makePerson·content/characters.js 생김새)을 그대로 쓰고,
// 직업별 옷·모자 실루엣(갑옷 조끼·단령 깃과 넓은 소매·가사·앞치마·두건·털 깃·방패·화살통·손에 든 활), 지킴이 견습생,
// 군중 변화(키·옷색·모자·든 것), 동작(밀기·활쏘기·옮기기·기뻐함·놀람·끄덕임)만 더한다. 얼굴·머리 크기·몸 비율은 바꾸지 않는다.
// 그리기 수: 움직이는 마디(몸통·팔 둘·다리 둘·머리)마다 같은 재질 조각을 하나로 합친다(모양은 그대로, 재질은 people.js의 것을 함께 쓴다).
// core/people.js는 고치지 않는다(다른 29장이 쓴다).
import * as THREE from 'three';
import { makePerson, mat } from './people.js';
import { LOOKS } from '../content/characters.js';
import { merge } from '../chapters/kit/buildings.js';

const STERN = { eyes: 'stern', brows: 'stern', mouth: 'flat' };
const HAIR = 0x1e1c1a;

// 보이는 그리기 조각 수(메시·점·스프라이트)
export function drawPieces(obj) {
  let n = 0;
  obj.traverseVisible(o => { if (o.isMesh || o.isPoints || o.isSprite) n += 1; });
  return n;
}

// ── 생김새: 기존 LOOKS를 바탕으로 직업(job)과 더할 부품(add)만 붙인다 ──
// hat: makePerson 모자 또는 여기서 그리는 모자(hood 두건·band 머리띠·towel 머리 수건·kid 견습생 머리)
export const FIGURE_LOOKS = {
  soldier: { ...LOOKS.soldier, job: 'soldier', name: '고려 병사', add: ['armor'] },
  archer: { ...LOOKS.archer, job: 'archer', name: '궁수', hat: 'hood', gear: 'bowHand', add: ['quiver'] },
  official: { ...LOOKS.officer, job: 'official', name: '관리', add: ['dallyeong', 'wideSleeves'] },
  monk: { ...LOOKS.monk, job: 'monk', name: '승려', add: ['kasa', 'wideSleeves'] },
  artisan: { ...LOOKS.artisan, job: 'artisan', name: '장인', hat: 'band', gear: 'hammer', add: ['apron'] },
  commoner: { ...LOOKS.villager, job: 'commoner', name: '백성', trim: 0x8a7356 },
  commonerWoman: { robe: 0xe6dcc8, hat: 'bun', trim: 0x8a5a4a, face: { ...STERN }, job: 'commonerWoman', name: '백성(여자)', add: ['skirt'] },
  khitan: { ...LOOKS.khitan, job: 'khitan', name: '거란 병사', prop: 'shield', add: ['furCollar', 'earflaps'] },
};
// 지킴이 견습생: 생김새 3가지(머리 모양·소매색) × 장별 옷 3가지. 얼굴은 지금 게임의 아이(LOOKS.kid)와 같다
export const GUARDIAN_LOOKS = {
  a: { name: '소년(땋은 머리)', hair: 'braid', sleeve: 0x2f6b9e },
  b: { name: '소녀(댕기 머리)', hair: 'ribbon', sleeve: 0xb8452f },
  c: { name: '소년(쌍상투)', hair: 'buns', sleeve: 0x2f6b5e },
};
export const GUARDIAN_OUTFITS = {
  soldier: { name: '병사 옷', robe: 0x7a3b2e, trim: 0x2b241c, hat: 'helmet', gear: 'spear', add: ['armor'] },
  archer: { name: '궁수 두건', robe: 0x5d6b3e, trim: 0x2b241c, hat: 'hood', gear: 'bowHand', add: ['quiver'] },
  worker: { name: '일꾼 앞치마', robe: 0xc8b89a, trim: 0x6b4a32, hat: 'band', gear: null, add: ['apron'] },
};
export function guardianLook(id, outfit = 'soldier') {
  const g = GUARDIAN_LOOKS[id], o = GUARDIAN_OUTFITS[outfit];
  return { ...o, add: [...o.add], job: 'guardian', name: `지킴이 ${g.name} · ${o.name}`, guardian: id, outfit, kid: true, hair: g.hair, sleeve: g.sleeve, face: { ...LOOKS.kid.face } };
}
// 군중 변화: seed(1~4)마다 키·옷색·모자·든 것이 서로 다르다. 백성 옷은 흰색·연한 베 색 위주(고증 체크리스트 4-2)
const CROWD = {
  soldier: { robes: [0x7a3b2e, 0x8a4434, 0x6e3428, 0x924a36], hats: ['helmet', 'helmet', 'helmet', 'helmet'], props: [null, 'shield', 'bundle', null] },
  official: { robes: [0x6a4c6e, 0x8a3a30, 0x3f6a4e, 0x55608a], hats: ['official', 'official', 'official', 'official'], props: [null, 'tablet', null, 'tablet'] },
  archer: { robes: [0x5d6b3e, 0x4f6a48, 0x66703f, 0x58664a], hats: ['hood', 'band', 'hood', 'band'], props: [null, null, null, null] },
  monk: { robes: [0x8a8780, 0x7d7468, 0x969288, 0x857a6c], hats: ['bald', 'bald', 'bald', 'bald'], props: [null, 'staff', null, 'staff'] },
  artisan: { robes: [0xc8b89a, 0xbcae92, 0xd2c4a6, 0xb8a888], hats: ['band', 'towel', 'band', 'towel'], props: [null, 'basket', null, 'bundle'] },
  commoner: { robes: [0xd8cfbf, 0xe6dcc3, 0xcfc6b0, 0xddd2bb], hats: ['topknot', 'towel', 'band', 'topknot'], props: [null, 'bundle', 'basket', 'staff'] },
  commonerWoman: { robes: [0xe6dcc8, 0xd8cfbf, 0xe8e2d6, 0xddd0bc], hats: ['bun', 'towel', 'bun', 'towel'], props: [null, 'bundle', 'basket', null] },
  khitan: { robes: [0x6e5a44, 0x7a6248, 0x5f4e3c, 0xa8834f], hats: ['fur', 'fur', 'fur', 'fur'], props: ['shield', null, 'shield', null] },
};
const HEIGHTS = [0.94, 0.98, 1.02, 1.06];
export function crowdLook(job, seed = 1) {
  const base = FIGURE_LOOKS[job], c = CROWD[job], i = ((seed % 4) + 4) % 4;
  return { ...base, add: [...(base.add || [])], robe: c.robes[(i + 1) % 4], hat: c.hats[(i * 3) % 4], prop: c.props[i] ?? (job === 'khitan' ? null : base.prop ?? null), height: HEIGHTS[i], crowd: seed, face: { ...base.face } };
}
export const ACTIONS = ['idle', 'walk', 'cheer', 'surprise', 'push', 'shoot', 'carry', 'nod'];

// ── 덧붙이는 부품: people.js와 같은 재질(mat(색, 무늬, 'object'))과 같은 크기 기준(머리 중심 2.02, 머리 묶음 1.3배) ──
const HEAD_Y = 2.02;
function part(geo, color, x, y, z, parent, kind = 'cloth', rot = null) {
  const m = new THREE.Mesh(geo, mat(color, kind, 'object'));
  m.position.set(x, y, z); if (rot) m.rotation.set(...rot); m.castShadow = true;
  parent.add(m); return m;
}
const hairCap = (hg, color = HAIR) => part(new THREE.SphereGeometry(0.33, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), color, 0, 0.02, -0.01, hg, 'grain');

function addHat(hg, hat, L) {
  const hp = (geo, color, x, y, z, kind = 'cloth', rot = null) => part(geo, color, x, y - HEAD_Y, z, hg, kind, rot);
  if (hat === 'hood') { // 두건: 머리를 감싼 천과 뒤로 늘어진 두 자락
    hp(new THREE.SphereGeometry(0.36, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.1), 0x3e4a32, 0, 2.06, -0.03, 'cloth', [-0.25, 0, 0]);
    hp(new THREE.TorusGeometry(0.34, 0.045, 6, 16), 0x2e3826, 0, 2.12, 0.0, 'cloth', [Math.PI / 2 + 0.25, 0, 0]);
    for (const s of [-1, 1]) hp(new THREE.BoxGeometry(0.09, 0.36, 0.03), 0x3e4a32, s * 0.07, 1.88, -0.36, 'cloth', [0.25, 0, s * 0.15]);
  } else if (hat === 'band' || hat === 'towel') { // 머리띠·머리 수건(상투 위로)
    if (!L.kid) { hairCap(hg); hp(new THREE.SphereGeometry(0.1, 8, 6), HAIR, 0, 2.4, -0.02, 'grain'); }
    if (hat === 'band') {
      hp(new THREE.TorusGeometry(0.335, 0.035, 6, 18), 0xe6dcc3, 0, 2.12, -0.02, 'cloth', [Math.PI / 2 + 0.2, 0, 0]);
      hp(new THREE.BoxGeometry(0.1, 0.16, 0.04), 0xe6dcc3, 0.08, 2.0, -0.34, 'cloth', [0.2, 0, 0.5]);
    } else hp(new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), 0xece6d8, 0, 2.08, -0.03, 'cloth', [-0.2, 0, 0]);
  } else if (hat === 'earflaps') {
    for (const s of [-1, 1]) hp(new THREE.BoxGeometry(0.1, 0.3, 0.22), 0x4a3a2a, s * 0.34, 1.98, -0.02, 'grain');
  }
  if (L.kid) { // 견습생 머리(아이·미혼은 뒤로 묶은 머리)
    if (hat !== 'hood' && hat !== 'helmet') hairCap(hg);
    if (L.hair === 'braid' || L.hair === 'ribbon') {
      const n = L.hair === 'ribbon' ? 3 : 5;
      for (let i = 0; i < n; i++) hp(new THREE.SphereGeometry(0.075 - i * 0.004, 8, 6), HAIR, 0, 1.92 - i * 0.11, -0.31 - i * 0.01, 'grain');
      if (L.hair === 'ribbon') { // 붉은 댕기
        for (const s of [-1, 1]) hp(new THREE.BoxGeometry(0.2, 0.11, 0.03), 0xb8452f, s * 0.1, 1.6, -0.34, 'cloth', [0, 0, s * 0.35]);
        hp(new THREE.BoxGeometry(0.06, 0.2, 0.03), 0xb8452f, 0, 1.5, -0.34);
      }
    } else if (L.hair === 'buns' && hat !== 'hood' && hat !== 'helmet') {
      for (const s of [-1, 1]) hp(new THREE.SphereGeometry(0.1, 8, 6), HAIR, s * 0.18, 2.34, -0.04, 'grain');
    } else if (L.hair === 'buns') hp(new THREE.SphereGeometry(0.1, 8, 6), HAIR, 0, 1.95, -0.33, 'grain');
  }
}

function addBody(g, arms, L) {
  const has = k => (L.add || []).includes(k);
  if (has('armor')) { // 찰갑 느낌의 단순한 갑옷 조끼(가로 비늘 줄 둘)
    part(new THREE.CylinderGeometry(0.41, 0.475, 0.5, 7), 0x6b6862, 0, 1.48, 0, g, 'grain').name = 'armor';
    for (const y of [1.38, 1.56]) part(new THREE.CylinderGeometry(0.455 - (y - 1.38) * 0.3, 0.46 - (y - 1.38) * 0.3, 0.04, 7), 0x4e4c48, 0, y, 0, g, 'grain');
  }
  if (has('dallyeong')) { // 단령: 둥근 깃(엇갈린 흰 깃 대신)
    g.children.filter(o => o.name === 'collar').forEach(o => { o.visible = false; g.remove(o); });
    part(new THREE.TorusGeometry(0.2, 0.05, 6, 14), 0xece4d2, 0, 1.73, 0.06, g, 'cloth', [Math.PI / 2 - 0.15, 0, 0]);
  }
  if (has('wideSleeves')) for (const a of arms) { a.children[0].scale.set(1.8, 1, 1.6); a.children[1].scale.set(1.75, 1, 1.55); }
  if (has('kasa')) part(new THREE.TorusGeometry(0.46, 0.065, 6, 18), 0x9a4a32, 0, 1.35, 0, g, 'cloth', [Math.PI / 2, 0.6, 0]);
  if (has('apron')) {
    part(new THREE.BoxGeometry(0.6, 0.75, 0.04), 0x6b4a32, 0, 0.92, 0.52, g, 'cloth', [-0.12, 0, 0]);
    part(new THREE.BoxGeometry(0.06, 0.4, 0.04), 0x5a3f2a, 0, 1.5, 0.43, g, 'cloth', [-0.28, 0, 0]);
  }
  if (has('skirt')) part(new THREE.CylinderGeometry(0.5, 0.68, 1.05, 9), 0x7a86a4, 0, 0.6, 0, g, 'cloth');
  if (has('furCollar')) part(new THREE.TorusGeometry(0.3, 0.1, 6, 12), 0x4a3a2a, 0, 1.72, 0, g, 'grain', [Math.PI / 2, 0, 0]);
  if (has('quiver')) {
    part(new THREE.CylinderGeometry(0.1, 0.09, 0.75, 7), 0x6b4a32, 0.15, 1.45, -0.45, g, 'wood', [0, 0, 0.45]);
    for (let i = 0; i < 3; i++) part(new THREE.ConeGeometry(0.04, 0.15, 4), 0xe6dcc3, 0.32 + i * 0.03, 1.86 + i * 0.02, -0.45 + (i - 1) * 0.05, g, 'cloth', [0, 0, 0.45]);
  }
}

function addHands(arms, L) {
  const hy = -0.78; // 손 높이(팔 마디 기준)
  if (L.gear === 'hammer') { // 오른손(arms[1]) 망치
    part(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5), 0x5a3f2a, 0, hy - 0.05, 0.14, arms[1], 'wood', [Math.PI / 2, 0, 0]);
    part(new THREE.BoxGeometry(0.14, 0.14, 0.26), 0x6b6862, 0, hy - 0.05, 0.42, arms[1], 'grain');
  }
  if (L.prop === 'tablet') part(new THREE.BoxGeometry(0.06, 0.45, 0.13), 0xe6dcc3, 0, hy + 0.12, 0.08, arms[1], 'cloth', [0.2, 0, 0]); // 홀
  const left = arms[0];
  if (L.prop === 'shield') {
    part(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 12), L.job === 'khitan' ? 0x6b4a32 : 0x7a3b2e, -0.1, hy + 0.1, 0.05, left, 'wood', [0, 0, Math.PI / 2]);
    part(new THREE.SphereGeometry(0.08, 6, 5), 0xd9a441, -0.14, hy + 0.1, 0.05, left, 'grain');
  } else if (L.prop === 'bundle') {
    part(new THREE.SphereGeometry(0.24, 8, 6), 0x55608a, 0, hy - 0.15, 0.05, left, 'cloth').scale.set(1.1, 0.9, 1);
    part(new THREE.SphereGeometry(0.07, 6, 5), 0x55608a, 0, hy + 0.02, 0.05, left, 'cloth');
  } else if (L.prop === 'basket') {
    part(new THREE.CylinderGeometry(0.24, 0.17, 0.24, 9), 0xc9a865, 0, hy - 0.17, 0.08, left, 'thatch');
  } else if (L.prop === 'staff') {
    part(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 5), 0x5a3f2a, 0, hy + 0.55, 0.06, left, 'wood');
  }
}

// 손에 든 활(따로 둔 조각: 팔을 들어도 늘 세로로 서도록 팔 기울기를 되돌린다)
function makeBow() {
  const g = new THREE.Group(); g.name = 'bowHand';
  const end = Math.PI * 0.42, r = 0.7;
  const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 4, 14, end * 2), mat(0x5a3f2a, 'wood', 'object'));
  arc.rotation.set(end, -Math.PI / 2, 0); arc.position.z = -r; arc.castShadow = true; g.add(arc);
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 2 * r * Math.sin(end), 3), mat(0xe6dcc3, 'cloth', 'object'));
  str.position.z = -r + r * Math.cos(end); g.add(str);
  return g;
}

// 같은 마디(pivot) 안에서 같은 재질 조각을 하나로 합친다. 모양·자리는 그대로.
function mergePivot(pivot, isPivot) {
  pivot.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
  const buckets = new Map(), done = [];
  const visit = o => {
    for (const c of [...o.children]) {
      if (isPivot(c)) continue;
      if (c.isMesh && c.visible) {
        const rel = new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld);
        const geo = c.geometry.clone().applyMatrix4(rel);
        if (!buckets.has(c.material.uuid)) buckets.set(c.material.uuid, { mat: c.material, geos: [], names: [], shadow: false });
        const b = buckets.get(c.material.uuid); b.geos.push(geo); if (c.name) b.names.push(c.name); b.shadow ||= c.castShadow;
        done.push(c);
      }
      visit(c);
    }
  };
  visit(pivot);
  for (const c of done) { c.parent.remove(c); c.geometry.dispose(); }
  const prune = o => { for (const c of [...o.children]) { if (isPivot(c)) continue; prune(c); if (!c.isMesh && c.children.length === 0) o.remove(c); } };
  prune(pivot);
  const out = [];
  for (const b of buckets.values()) {
    const m = new THREE.Mesh(merge(b.geos), b.mat);
    m.name = b.names.includes('head') ? 'head' : b.names.includes('face') ? 'face' : (b.names[0] || '');
    m.castShadow = b.shadow; pivot.add(m); out.push(m);
  }
  return out;
}

let count = 0;
export function makeFigure(look) {
  const L = { ...look };
  const ownHat = ['hood', 'band', 'towel'].includes(L.hat);
  const opts = { robe: L.robe, trim: L.trim, face: L.face, hairColor: L.hairColor, outfit: L.outfit === 'suit' ? 'suit' : null,
    hat: ownHat || (L.kid && L.hat !== 'helmet') ? null : L.hat, gear: L.gear === 'spear' || L.gear === 'sword' ? L.gear : null };
  const fig = makePerson(opts, { track: false });
  const u = fig.userData, hg = u.head;
  hg.name = 'headGroup';
  // 몸(엉덩이에서 기울일 수 있게): 다리 말고 모두 body 묶음으로 옮긴다
  const HIP = 0.55, body = new THREE.Group(); body.name = 'body'; body.position.y = HIP;
  for (const c of [...fig.children]) if (!u.legs.includes(c)) { fig.remove(c); c.position.y -= HIP; body.add(c); }
  fig.add(body);
  if (L.hat === 'earflaps' || (L.add || []).includes('earflaps')) addHat(hg, 'earflaps', L);
  addHat(hg, L.hat, L);
  addBody(body, u.arms, L);
  addHands(u.arms, L);
  if (L.sleeve) for (const a of u.arms) a.children[0].material = mat(L.sleeve, 'cloth', 'object'); // 지킴이 소매색
  // 마디마다 같은 재질 조각 합치기
  const pivots = new Set([body, hg, ...u.arms, ...u.legs]);
  const isPivot = o => pivots.has(o);
  for (const p of pivots) mergePivot(p, isPivot);
  // 마디 밖에 따로 두는 것: 손에 든 활, 옮기는 짐, 지킴이 표시
  let bow = null;
  if (L.gear === 'bowHand') { bow = makeBow(); bow.position.set(0, -0.78, 0.02); u.arms[0].add(bow); }
  const load = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), mat(0x8a6a48, 'wood', 'object'));
  load.name = 'carryLoad'; load.castShadow = true; load.visible = false; load.position.set(0, 0.85, 0.75); body.add(load);
  if (L.guardian) {
    const mk = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), mat(0xd9a441, 'grain', 'object'));
    mk.name = 'guardianMark'; mk.scale.set(0.8, 1.3, 0.8); mk.position.set(0, 3.25 - HIP, 0); body.add(mk);
  }
  count += 1;
  fig.scale.setScalar((L.height || 1) * (L.kid ? 0.82 : 1));
  fig.name = `figure:${L.job}`;
  Object.assign(u, { look: L, kid: !!L.kid, body, bow, load, action: 'idle', t: 0, ph: (count * 1.7) % 6, HIP });
  return fig;
}

export function setAction(fig, action) {
  const u = fig.userData;
  if (u.action !== action) { u.action = action; u.t = 0; }
  return fig;
}

// 동작: 팔은 어깨, 다리는 엉덩이, 몸은 허리에서 돈다(지금 사람의 마디 그대로)
export function animateFigure(fig, dt) {
  const u = fig.userData;
  if (!u.body) return;
  u.t += dt;
  const t = u.t + u.ph, a = u.action, k = Math.min(1, dt * 12);
  const ease = (o, p, v) => { o[p] += (v - o[p]) * k; };
  let L0 = 0, L1 = 0, A = [[0, 0], [0, 0]], lean = 0, turn = 0, hop = 0, hx = 0, hy = 0, bob = 0;
  if (a === 'walk' || a === 'carry') {
    const s = Math.sin(t * (a === 'carry' ? 8 : 11));
    L0 = s * (a === 'carry' ? 0.45 : 0.8); L1 = -L0; bob = Math.abs(Math.cos(t * 11)) * 0.04;
    A = a === 'walk' ? [[-s * 0.56, 0], [s * 0.56, 0]] : [[-1.2, 0.15], [-1.2, -0.15]];
  } else if (a === 'cheer') {
    const w = Math.sin(t * 12) * 0.25;
    A = [[-2.8 + w, -0.35], [-2.8 - w, 0.35]]; hop = Math.max(0, Math.sin(t * 7)) * 0.18; hx = -0.15;
  } else if (a === 'surprise') {
    A = [[-0.9, -0.9], [-0.9, 0.9]]; lean = -0.18; hx = -0.15; hop = u.t < 0.25 ? Math.sin(u.t / 0.25 * Math.PI) * 0.12 : 0; L0 = 0.15; L1 = -0.1;
  } else if (a === 'push') {
    const p = Math.sin(t * 6) * 0.15;
    A = [[-1.45 + p, 0.1], [-1.45 + p, -0.1]]; lean = 0.3; L0 = 0.5; L1 = -0.45;
  } else if (a === 'shoot') { // 왼팔(arms[0])로 활을 내밀고 오른팔(arms[1])로 당겼다 놓는다
    const c = (u.t % 1.6) / 1.6, draw = c < 0.7 ? c / 0.7 : 0;
    A = [[-1.5, 0.05], [-1.45 + draw * 0.2, -0.15 - draw * 0.55]]; turn = -0.35; hy = 0.3; L0 = -0.2; L1 = 0.3;
  } else if (a === 'nod') {
    hx = Math.max(0, Math.sin(t * 5)) * 0.28;
  } else hy = Math.sin(t * 0.45) * 0.3 * Math.max(0, Math.sin(t * 0.21));
  ease(u.legs[0].rotation, 'x', L0); ease(u.legs[1].rotation, 'x', L1);
  for (let i = 0; i < 2; i++) { ease(u.arms[i].rotation, 'x', A[i][0]); ease(u.arms[i].rotation, 'z', A[i][1]); }
  ease(u.body.rotation, 'x', lean); ease(u.body.rotation, 'y', turn);
  ease(u.head.rotation, 'x', hx); ease(u.head.rotation, 'y', hy);
  u.body.position.y = u.HIP + bob; fig.children.forEach(c => { if (c !== u.body) c.position.y = 0.55 + hop; }); u.body.position.y += hop;
  if (u.bow) u.bow.rotation.x = -u.arms[0].rotation.x - u.body.rotation.x;
  u.load.visible = a === 'carry';
}
