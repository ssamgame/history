// 내 캐릭터(시간 여행자, 2026-11-09): 부위 넘기기·무작위, 역할 옷에 얼굴만 얹기, 여자아이 머리, 저장, 등록 화면, 도착 안내 한 줄
import { test, eq, ok } from './harness.js';
import { AVATAR_PARTS, DEFAULT_AVATAR, cycleAvatar, randomAvatar, applyAvatar, isAvatar, arrivalLine, TRAVELER_LOOK } from '../content/avatar.js';
import { LOOKS } from '../content/characters.js';
import { ROLES, roleLook } from '../content/roles.js';
import { createSave } from '../core/save.js';
import { showAvatarMaker } from '../core/avatar-ui.js';
import { CHAPTERS } from '../chapters/index.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const btn = (el, text) => [...el.querySelectorAll('button')].find(b => b.textContent.includes(text));

test('avatar: 부위마다 2개 이상, 넘기면 끝에서 처음으로 돌고, 무작위도 올바른 값', () => {
  ok(AVATAR_PARTS.length >= 7); AVATAR_PARTS.forEach(p => ok(p.options.length >= 2, p.key));
  ok(isAvatar(DEFAULT_AVATAR));
  let a = DEFAULT_AVATAR; const n = AVATAR_PARTS.find(p => p.key === 'eye').options.length;
  for (let i = 0; i < n; i++) a = cycleAvatar(a, 'eye', 1);
  eq(a.eye, DEFAULT_AVATAR.eye, '한 바퀴 돌면 제자리');
  eq(cycleAvatar(DEFAULT_AVATAR, 'shape', -1).shape, 'heart', '처음에서 뒤로 가면 마지막');
  let k = 0; const r = randomAvatar(() => ((k += 7) % 10) / 10); ok(isAvatar(r));
  ok(!isAvatar({ sex: 'x' }) && !isAvatar(null));
});

test('avatar: 역할 옷에는 얼굴만 얹는다(옷·투구·무기 그대로), 여자아이는 머리카락일 때만 땋은 머리', () => {
  const a = { ...DEFAULT_AVATAR, shape: 'round', eye: 'droopy', skin: 'tan', extra: 'glasses' };
  const soldier = applyAvatar(roleLook('ch1'), a);
  eq(soldier.outfit, 'armor'); eq(soldier.hat, 'helmet', '투구는 그대로'); eq(soldier.skin, 'tan'); eq(soldier.face.build.shape, 'round'); eq(soldier.face.build.eye, 'droopy'); eq(soldier.face.glasses, 'round');
  ok(!soldier.face.beard && !soldier.face.stubble, '아이 얼굴: 수염 없음');
  const girl = { ...a, sex: 'f' };
  eq(applyAvatar(roleLook('ch1'), girl).hat, 'helmet', '여자아이도 병사일 때는 투구');
  eq(applyAvatar(LOOKS.kid, girl).hat, 'braid', '머리카락(댕기)일 때는 땋은 머리');
  eq(applyAvatar(LOOKS.kid, girl).face.sex, 'f'); ok(!('sex' in applyAvatar(LOOKS.kid, a).face));
  eq(applyAvatar(roleLook('ch1'), null), roleLook('ch1'), '캐릭터가 없으면 그대로');
  ok(TRAVELER_LOOK.named && TRAVELER_LOOK.hat === 'short', '2026년 여행자 옷은 시대에 바뀌지 않는 짧은 머리');
});

test('avatar: 저장하고 다시 불러온다', () => {
  const mem = new Map(), storage = { get: k => mem.get(k) ?? null, set: (k, v) => { mem.set(k, JSON.parse(JSON.stringify(v))); return true; }, remove: k => mem.delete(k) };
  const s = createSave(storage); s.setName('김고려'); s.setAvatar({ ...DEFAULT_AVATAR, sex: 'f' });
  const s2 = createSave(storage); s2.load();
  eq(s2.data.avatar.sex, 'f'); eq(s2.data.name, '김고려');
  s2.reset(); eq(s2.data.avatar, null);
});

test('avatar: 등록 화면 — ◀ ▶로 부위가 바뀌고, 무작위, 이름, 대원증 얼굴, 「대원증 받고 출발」로 끝난다', async () => {
  const el = document.createElement('div'); document.body.appendChild(el);
  try {
    const p = showAvatarMaker(el, { name: '5-3 12번', preview: false });
    await sleep(20);
    const val = key => el.querySelector(`.av-row[data-part="${key}"] .av-val`).textContent;
    eq(val('shape'), '달걀형');
    el.querySelector('[data-next="shape"]').click(); eq(val('shape'), '둥근 얼굴');
    el.querySelector('[data-prev="shape"]').click(); el.querySelector('[data-prev="shape"]').click(); eq(val('shape'), '하트형', '뒤로 돌면 마지막');
    el.querySelector('[data-key="sex"][data-value="f"]').click(); ok(el.querySelector('[data-key="sex"][data-value="f"]').classList.contains('on'));
    el.querySelector('[data-key="skin"][data-value="tan"]').click(); ok(el.querySelector('[data-key="skin"][data-value="tan"]').classList.contains('on'));
    ok(el.querySelector('.av-portrait').style.backgroundImage.includes('data:image'), '대원증 얼굴 그림');
    eq(el.querySelector('#avatar-name').value, '5-3 12번');
    btn(el, '무작위').click(); ok(isAvatar(JSON.parse(JSON.stringify(DEFAULT_AVATAR))));
    el.querySelector('#avatar-name').value = '김여행';
    for (const b of el.querySelectorAll('button')) { const r = b.getBoundingClientRect(); ok(r.width >= 30 && r.height >= 28, `단추가 손가락 크기 "${b.textContent || b.getAttribute('aria-label')}"`); }
    btn(el, '대원증 받고 출발').click();
    const r = await p;
    ok(isAvatar(r.avatar)); eq(r.name, '김여행'); eq(el.children.length, 0, '화면이 닫힌다');
  } finally { el.remove(); }
});

test('avatar: 도착 안내는 장의 연도·장소와 역할 이름으로 만든다(장마다 새 글 없음)', () => {
  const ch2 = CHAPTERS[1];
  eq(arrivalLine(ch2, ROLES.ch2), '1010년 흥화진에 도착했어. 여기 사람처럼 보여야 하니 흥화진을 지키는 병사 차림으로 변장하자!');
  ok(arrivalLine(CHAPTERS[2], ROLES.ch3, true).startsWith('1018년 귀주(으)로 옮겨 왔어.'), '같은 편 안에서는 짧게');
  for (const c of CHAPTERS) ok(arrivalLine(c, ROLES[c.id]).includes('차림으로 변장하자'), c.id);
});

test('avatar: 모든 장에 도착 자리(spawn)가 있고 탐험 시작 자리와 맞다', async () => {
  const { ALL_CHAPTERS } = await import('../chapters/index.js');
  const { ARRIVAL_SEC, SWAP_AT } = await import('../core/arrival.js');
  ok(ARRIVAL_SEC >= 3 && SWAP_AT > 1.5 && SWAP_AT < ARRIVAL_SEC, `도착 연출 ${ARRIVAL_SEC}초, 변장 ${SWAP_AT}초`);
  let n = 0;
  for (const c of ALL_CHAPTERS.filter(c => c.load)) { const mod = (await c.load()).default; if (mod.spawn) n += 1; else ok(false, `${c.id}: spawn 없음`); }
  ok(n >= 30, `spawn 있는 장 ${n}`);
  // 캐릭터는 그 장의 문에서 BACK만큼 뒤에 서고(시간의 문 너비 4m의 절반보다 넉넉히), 걸어 들어오기는 그 자리에서 잇는다(2026-11-10 선생님)
  const { BACK } = await import('../core/arrival.js');
  ok(BACK >= 4, `문에서 ${BACK}m 뒤`);
  const { enterThroughGate } = await import('../chapters/kit/gate.js');
  const pos = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
  const world = { bounds: { x0: -5, x1: 5, z0: -5, z1: 5 }, player: { position: pos, rotation: {} }, snapCamera() {}, onUpdate(f) { this.f = f; return () => { this.f = null; }; } };
  const ctx = { world, input: {}, arrivalFrom: [0, 12, 0.6] };
  const done = enterThroughGate(ctx, { from: [0, 8], to: [0, 2], openTime: 0 });
  eq([pos.x, pos.y, pos.z], [0, 0.6, 12], '도착 자리에서 이어 걷는다');
  eq(ctx.arrivalFrom, null, '한 번만 쓴다');
  pos.z = 7; world.f(0.1); ok(pos.y > 0.2 && pos.y < 0.4, `걸으며 땅 높이로 내려온다 ${pos.y}`);
  pos.z = 1.9; world.f(0.1); await done; eq([pos.y, pos.z], [0, 2]);
});

test('avatar: 타임머신 — 다음 여행지 이름, 이동 장면의 연도, 모형(불꽃·시곗바늘)', async () => {
  const { machineLabel } = await import('../core/portal.js');
  const { yearOf } = await import('../core/travel.js');
  const { makeTimeMachine } = await import('../core/timemachine.js');
  eq(machineLabel({ title: '귀주 대첩' }), '다음 여행지: 귀주 대첩'); eq(machineLabel({ era: '조선' }), '다음 여행지: 조선 시대'); eq(machineLabel(null), '2026년으로 돌아가기');
  eq(yearOf({ years: '1018~1019' }), 1018); eq(yearOf({ years: '1880~1900년대' }), 1880);
  const tm = makeTimeMachine();
  ok(tm.group.name === 'timeMachine' && tm.group.userData.dynamic, '굳히기에 합쳐지지 않는다');
  const flames = () => { let n = 0; tm.group.traverse(o => { if (o.isMesh && o.visible && o.material.type === 'MeshBasicMaterial' && o.geometry.type === 'ConeGeometry') n += 1; }); return n; };
  eq(flames(), 0, '세워 두면 불꽃이 없다'); tm.setFlame(1); tm.tick(1); eq(flames(), 3, '날 때는 불꽃 셋');
  tm.dispose();
});
