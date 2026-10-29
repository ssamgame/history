// 일제 강점기편 1장(D-36): 항구 마을 문으로 들어와 농민·짐꾼·총독부 앞 사람 이야기를 아무 차례로 듣고(모두 들어야 학교 선생님) →
// 칼 찬 헌병들이 마을 길을 줄지어 순찰하고 사람들이 길을 비키는 장면 →
// 시대별 체험 걷기(1910년대: 토지 측량·칼 찬 교사 / 1920년대: 늘어난 경찰·쌀을 실은 기차 / 1930년대 후반: 일본어 수업·강제 동원) →
// 선생님에게 말을 걸면 헌병 피해 우리 역사책 전하기. 가져다 놓기·역사책은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import i1, { villageTalk, patrolScene, eraWalk, ERAS } from '../chapters/colonial/i1/chapter.js';
import script from '../chapters/colonial/i1/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['farmer', 'porter', 'clerk'];

test('i1 D-36: 마을 사람은 아무 차례로, 모두 들어야 학교 선생님, 끝에 학생의 결심', () => {
  ok(i1.anyOrder, 'anyOrder');
  eq(villageTalk('porter', new Set(['farmer']))[0], script.npc.porter.bridge);
  eq(villageTalk('clerk', new Set())[0], script.npc.clerk.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.teacher.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.teacher.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('i1 D-36: 마을 어귀 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = i1.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('i1 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('선생님'), '둘째 퀘스트는 선생님');
  ok(script.goals[2].includes('헌병'), '셋째 퀘스트는 헌병 순찰');
  const idx = i1.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signGov && !script.npc.signRail && !script.npc.signForce, '안내판 npc 항목은 지웠다');
  ok(i1.layout.signs.length >= 2 && i1.layout.signs.every(s => s.plaque), '건물 간판만');
  const lines = allLines(script);
  for (const want of ['주권을 잃고', '철도를 놓아', '탄광, 공장, 전쟁터']) ok(lines.some(l => l.text.includes(want) && l.src?.length), want);
});

test('i1 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    i1.buildScene(w);
    const [px, pz] = i1.portal.at, fx = px + Math.sin(i1.portal.ry) * 1.2, fz = pz + Math.cos(i1.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = i1.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('i1 D-36 C-05: 놀이는 시대별 체험 걷기 → 헌병 피해 역사책 전하기, 가져다 놓기·역사책 없음, 둘째 놀이는 선생님에게 말을 걸어야 시작', () => {
  eq(i1.parts.map(p => p.type), ['scene', 'sneak']);
  ok(!Object.values(script.parts).some(p => ['deliver', 'book', 'find', 'stops'].includes(p.type)), '가져다 놓기·역사책은 뺐다');
  ok(!i1.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(i1.parts[1].intro?.[0]?.meet?.who, 'teacher');
  ok(i1.parts[1].intro.slice(1).every(l => l.who === 'teacher'), '말 건 선생님이 알려 준다');
});

test('i1 D-36: 가져다 놓기 여섯 글과 역사책 네 쪽은 출처 그대로 시대별 자리의 대사가 되었다', () => {
  const eras = script.parts.eras.eras;
  eq(eras.map(e => e.label), ['1910년대', '1920년대', '1930년대 후반']);
  ok(eras.every(e => e.stations.length === 2), '시대마다 두 자리');
  const lines = allLines(eras);
  const has = t => ok(lines.some(l => l.text.includes(t) && l.src?.includes('S51')), t);
  for (const t of ['토지 조사 사업', '태형', '제복을 입고 칼', '경찰을 늘리고', '친일파', '산미 증식 계획', '더 많은 쌀이 일본으로', '철도를 놓아', '일본식으로 성과 이름', '우리말과 우리 역사', '신사 참배', '일본어로 수업', '탄광, 공장, 전쟁터']) has(t);
});

test('i1 D-36: 헌병 순찰 장면 — 칼 찬 헌병이 줄지어 걷고 사람들이 길을 비키고, 끝나면 치운다', async () => {
  ok(script.patrol.lines.some(l => l.text.includes('헌병') && l.src?.includes('S51')), '출처 있는 해설');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i1.buildScene(s.w);
    const n0 = s.w.level.children.length;
    await patrolScene(s.ctx);
    const h = s.ctx.testHooks.patrol;
    ok(h, 'testHooks');
    ok(h.gendarmes >= 4, `헌병 ${h.gendarmes}`);
    ok(h.walked > 6, `걸어간 거리 ${h.walked}`);
    ok(h.stepAside >= 3, `길을 비킨 사람 ${h.stepAside}`);
    eq(s.w.level.children.length, n0, '더한 것을 치웠다');
    ok(s.w.player.visible, '학생이 보인다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('i1 D-36: 시대별 체험 걷기 — 1910년대 → 1920년대 → 1930년대 후반 여섯 자리를 대화 버튼으로 겪고, 끝나면 무대를 치운다', async () => {
  ok(ERAS.origin[0] >= 300, '마을과 떨어진 무대');
  const st = script.parts.eras.eras.flatMap(e => e.stations);
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i1.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await eraWalk(s.ctx);
    const h = s.ctx.testHooks.eras;
    eq(h.used, st.map(x => x.id), '시대 차례대로 여섯 자리');
    ok(h.pressed >= 6, `대화 버튼으로 시작 ${h.pressed}`);
    eq(h.gates, 3, '시대의 문 셋');
    ok(h.surveyed, '땅을 재는 막대');
    ok(h.sword, '칼 찬 교사');
    ok(h.police >= 4, `늘어난 경찰 ${h.police}`);
    ok(h.carried && h.trainLeft, '쌀가마를 싣고 기차가 떠난다');
    ok(h.classroom >= 6, `교실 학생 ${h.classroom}`);
    ok(h.forced >= 3, `끌려가는 사람 ${h.forced}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 180000 });

// D-40: 헌병의 감시 불빛은 헌병이 걷는 쪽을 비추고, 돌아서면 함께 돈다(들키는 판정과 같은 쪽)
import * as THREE from 'three';
import { PLAY } from '../chapters/kit/play.js';
test('i1 D-40: 감시 불빛이 헌병이 걷는 방향을 따라간다', async () => {
  const part = i1.parts.find(p => p.type === 'sneak');
  const s = touchSetup(script.speakers);
  try {
    i1.buildScene(s.w);
    PLAY.sneak(s.ctx, part, false);
    const guards = s.ctx.testHooks.sneak.guards;
    ok(guards.length >= 3, '헌병 셋');
    const dirs = new Map();
    for (let f = 0; f < 600; f++) {
      s.w.step(1 / 30, { x: 0, z: 0 });
      if (f % 20) continue;
      for (const [i, gd] of guards.entries()) {
        gd.body.updateMatrixWorld(true);
        const geo = gd.cone.geometry; geo.computeBoundingBox();
        const c = geo.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(gd.cone.matrixWorld);
        const b = gd.body.getWorldPosition(new THREE.Vector3());
        const light = Math.atan2(c.x - b.x, c.z - b.z), walk = gd.body.rotation.y;
        const diff = Math.abs(Math.atan2(Math.sin(light - walk), Math.cos(light - walk)));
        ok(diff < 0.35, `헌병 ${i}: 불빛 ${light.toFixed(2)} / 걷는 쪽 ${walk.toFixed(2)}`);
        dirs.set(i, (dirs.get(i) || new Set()).add(Math.round(Math.cos(walk))));
      }
    }
    ok(dirs.get(0)?.size > 1, '돌아서면 불빛도 반대쪽을 비춘다');
  } finally { s.done(); }
}, { timeout: 60000 });
