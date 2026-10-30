// 시대별 머리 모양(D-56): 같은 시대·집단은 기본형을 함께 쓰고 일부만 한 가지씩, 시대가 섞이지 않게, 같은 사람은 늘 같은 머리
import { test, eq, ok } from './harness.js';
import { LOOKS } from '../content/characters.js';
import { hairStyle, HAIR_RULES, BEARD_RULES, setHairEra, eraOfChapter, ERAS } from '../core/hairstyle.js';
import { roleOf } from '../core/facebuild.js';
import { makePerson } from '../core/people.js';
import { faceBlockers } from './faces.test.js';

const crowd = (id, era) => [1, 2, 3, 4, 5, 6].map(n => hairStyle(LOOKS[id], n, roleOf(LOOKS[id]), era));
const VARY_KEYS = ['towel', 'sideburn', 'nape', 'gray'];

test('hairstyle D-56: 장 id로 시대를 정한다', () => {
  eq(eraOfChapter('ch3'), 'goryeo'); eq(eraOfChapter('j4'), 'joseon'); eq(eraOfChapter('k2'), 'modern'); eq(eraOfChapter('i5'), 'colonial'); eq(eraOfChapter('h6'), 'present');
});

test('hairstyle D-56: 시대가 섞이지 않는다(고려·조선에 짧은 머리 없음, 현대에 상투 없음, 고려 상투에 망건 없음)', () => {
  for (const id of ['citizen', 'kidModern']) for (const e of ['goryeo', 'joseon']) for (const h of crowd(id, e)) eq(h.hat, 'topknot', `${id} ${e}`);
  for (const id of ['peasant', 'commoner', 'villager']) for (const h of crowd(id, 'present')) eq(h.hat, 'short', `${id} 현대`);
  for (const h of crowd('villager', 'goryeo')) ok(!h.manggeon, '고려 상투에는 망건이 없다');
  for (const h of crowd('commoner', 'joseon')) ok(h.manggeon || h.towel, '조선 상투는 망건(또는 흰 수건)');
  for (const h of crowd('woman', 'goryeo').concat(crowd('woman', 'joseon'))) ok(!h.perm, '파마머리는 현대만');
  for (const [fam, byEra] of Object.entries(HAIR_RULES)) for (const e of Object.keys(byEra)) ok(ERAS.includes(e), `${fam}: ${e}`);
  for (const h of crowd('citizen', 'present')) ok(!h.beard || h.beard === 'mustache', `현대 남자 수염 ${h.beard}`);
});

test('hairstyle D-56: 같은 집단은 기본형 몇 가지를 나눠 쓰고, 한 사람에 바뀌는 것은 많아야 하나', () => {
  for (const [id, e] of [['villager', 'goryeo'], ['commoner', 'joseon'], ['citizen', 'present'], ['woman', 'joseon'], ['khitan', 'goryeo'], ['schoolgirl', 'colonial']]) {
    const H = crowd(id, e), rules = HAIR_RULES[LOOKS[id].hat === 'topknot' && e === 'present' ? 'short' : LOOKS[id].hat][e];
    const bases = new Set(H.map(h => JSON.stringify(rules.bases.find(b => Object.entries(b).every(([k, v]) => h[k] === v)))));
    ok(!bases.has(undefined), `${id}: 모두 정한 기본형 가운데 하나`);
    ok(bases.size >= 2 && bases.size <= rules.bases.length, `${id} ${e}: 기본형 ${bases.size}가지`);
    for (const h of H) ok(VARY_KEYS.filter(k => h[k]).length <= 1, `${id}: 변형 ${VARY_KEYS.filter(k => h[k])}`);
  }
});

test('hairstyle D-56: 같은 사람은 늘 같은 머리, 이름난 인물·말을 거는 사람은 생김새에 정한 그대로', () => {
  eq(hairStyle(LOOKS.commoner, 3, 'farmer', 'joseon'), hairStyle(LOOKS.commoner, 3, 'farmer', 'joseon'));
  const k = hairStyle(LOOKS.kimgu, 0, roleOf(LOOKS.kimgu), 'colonial'); eq(k.hat, 'buzz'); eq(k.color, LOOKS.kimgu.hairColor); ok(k.beard === undefined, '이름난 인물 수염 그대로');
  const g = hairStyle(LOOKS.grandma, 0, 'elder', 'present'); eq(g.color, LOOKS.grandma.hairColor, '할머니 흰머리');
});

test('hairstyle D-56: 시대 머리를 입힌 군중도 모자·머리가 눈썹·눈을 가리지 않는다', () => {
  const bad = [];
  for (const e of ERAS) {
    setHairEra(e);
    for (const id of ['villager', 'commoner', 'peasant', 'citizen', 'woman', 'schoolgirl', 'kid', 'scholar', 'student', 'gentleman', 'khitan', 'mongol', 'joseonSoldier', 'rokSoldier'])
      for (let n = 1; n <= 6; n++) { const b = faceBlockers({ ...LOOKS[id], _n: n }); if (b.length) { bad.push(`${e} ${id}:${n} ${b[0]}`); break; } }
  }
  setHairEra(null);
  eq(bad.length, 0, bad.join(' | '));
});

test('hairstyle D-56: 머리 모양을 더해도 인물 조각 수가 크게 늘지 않는다(태블릿 성능)', () => {
  setHairEra('joseon');
  const count = p => { let n = 0; p.traverse(o => { if (o.isMesh) n += 1; }); return n; };
  const base = count(makePerson(LOOKS.commoner, { stable: true }));
  for (let n = 1; n <= 6; n++) ok(count(makePerson({ ...LOOKS.commoner, _n: n }, { stable: true })) <= base + 3, `군중 ${n}`);
  setHairEra(null);
  for (const e of Object.keys(BEARD_RULES)) ok(ERAS.includes(e), e);
});

// 2026-10-30 선생님: 투구 뒷모습에 구멍(맨살)이 보이지 않게, 머리 모양이 반원 바가지만 되지 않게
test('hairstyle: 투구 뒤가 비지 않는다(받침 두건과 목덜미까지 내려오는 드림)', () => {
  for (const id of ['soldier', 'yanggyu']) {
    const p = makePerson(LOOKS[id], { track: false, stable: true });
    ok(p.getObjectByName('helmetLiner'), `${id}: 투구 밑 받침`);
    const g = p.getObjectByName('neckGuard'); g.geometry.computeBoundingBox();
    ok(g.position.y + g.geometry.boundingBox.min.y < -0.2, `${id}: 드림이 목덜미까지`);
  }
});

test('hairstyle: 머리 모양마다 윤곽이 다르다(이마 선·정수리·뒤통수)', async () => {
  const { hairCap } = await import('../core/people.js');
  const box = o => { const g = hairCap(0.335, o); g.computeBoundingBox(); const b = g.boundingBox; return [b.max.y, b.min.y, b.min.z].map(v => v.toFixed(3)).join(); };
  const shapes = new Set([{}, { front: 'part' }, { flat: 0.12 }, { crown: 0.28 }, { lift: 0.14 }, { side: 1.5, back: 2.25 }].map(box));
  ok(shapes.size >= 5, `윤곽 ${shapes.size}가지`);
  // 뒤통수는 귀 높이 아래까지, 이마는 눈썹 위(바가지처럼 한 높이로 잘리지 않는다)
  const g = hairCap(0.335, {}), pa = g.attributes.position; let front = 1, back = 1;
  for (let i = 0; i < pa.count; i++) { const z = pa.getZ(i), y = pa.getY(i); if (z > 0.25) front = Math.min(front, y); if (z < -0.2) back = Math.min(back, y); }
  ok(front > 0.12 && back < -0.1, `이마 끝 ${front.toFixed(2)}, 뒤통수 끝 ${back.toFixed(2)}`);
});

// D-60(2026-10-30 선생님: 조선~현대 옷차림, 당시 시대상을 복장에): 신분별 옷과 시대마다 바꿔 입는 옷(eras)
test('outfit D-60: 조선 임금은 곤룡포(둥근 보), 관리는 흉배, 선비는 도포, 군사는 동달이, 여인은 치마저고리', () => {
  setHairEra('joseon', 'j2');
  const has = (id, name) => !!makePerson(LOOKS[id], { stable: true }).getObjectByName(name);
  ok(has('sejong', 'bo') && has('jeongjo', 'bo'), '곤룡포의 보');
  ok(has('joseonOfficial', 'badge') && has('kimsangheon', 'badge'), '흉배');
  eq(LOOKS.scholar.outfit, 'dopo'); eq(LOOKS.joseonSoldier.outfit, 'jeonbok'); ok(LOOKS.joseonSoldier.sleeve, '동달이 소매 빛');
  ok(has('woman', 'goreum'), '치마저고리 옷고름');
  setHairEra(null);
});
test('outfit D-60: 같은 생김새도 시대마다 옷이 다르다(시민: 일제 저고리 → 해방 뒤 셔츠, 여인: 1960~80년대 블라우스와 치마)', () => {
  const collarOf = p => p.getObjectByName('pantsTop') ? 'pants' : 'none';
  setHairEra('colonial', 'i2'); const a = makePerson(LOOKS.citizen, { stable: true }); ok(a.getObjectByName('belt') && !a.getObjectByName('goreum'), '일제: 저고리·바지');
  setHairEra('present', 'h3'); const b = makePerson(LOOKS.citizen, { stable: true }); ok(b.getObjectByName('pantsTop') && b.getObjectByName('collar'), '해방·전쟁기: 셔츠와 바지');
  const w1 = makePerson(LOOKS.woman, { stable: true }); ok(w1.getObjectByName('goreum'), '1950년대 여인: 치마저고리');
  setHairEra('present', 'h6'); const w2 = makePerson(LOOKS.woman, { stable: true }); ok(!w2.getObjectByName('goreum') && w2.getObjectByName('jeogori'), '1960~80년대 여인: 블라우스와 치마');
  setHairEra(null); void collarOf;
});
