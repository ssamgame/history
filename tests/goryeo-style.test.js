// 고려편 새 기준 시안(2026-10-26 기획서 7-3 1단계): 새 사람 모델(core/figures.js), 고려 성 세트(chapters/goryeo/set.js),
// 놀이 화면 부품(core/hud-ops.js), 시안 갤러리(tools/goryeo-style.html). 기존 core/people.js와 다른 편은 건드리지 않는다.
import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { makePerson } from '../core/people.js';
import { MOODS } from '../core/world.js';
import { LOOKS } from '../content/characters.js';
import { FIGURE_LOOKS, GUARDIAN_LOOKS, GUARDIAN_OUTFITS, ACTIONS, guardianLook, crowdLook, makeFigure, setAction, animateFigure, drawPieces } from '../core/figures.js';
import { SNOW_MOOD, PALETTE, cityWall, gateWithOngseong, watchtower, ladder, flag, giwaHouse, jangdok, woodpile, campfire } from '../chapters/goryeo/set.js';
import { createGauge, createCardHand, stampSeal } from '../core/hud-ops.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const JOBS = ['soldier', 'official', 'archer', 'monk', 'artisan', 'commoner', 'commonerWoman', 'khitan'];
const allLooks = () => [
  ...Object.values(FIGURE_LOOKS),
  ...Object.keys(GUARDIAN_LOOKS).flatMap(id => Object.keys(GUARDIAN_OUTFITS).map(o => guardianLook(id, o))),
  ...JOBS.flatMap(j => [1, 2, 3, 4].map(s => crowdLook(j, s))),
];
// 모양 지문: 전체·머리 묶음(모자 포함)·몸통 묶음의 크기
function silhouette(fig) {
  fig.updateMatrixWorld(true);
  const r = v => Math.round(v * 20) / 20;
  const size = o => new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
  const all = size(fig), head = size(fig.getObjectByName('headGroup')), body = size(fig.getObjectByName('body'));
  return [all.x, all.y, all.z, head.x, head.y, head.z, body.x, body.y, body.z].map(r).join(',');
}

test('goryeo-style: 모든 새 인물(직업·지킴이·군중 변형)의 표정은 근엄하다(눈·눈썹 stern, 입 flat)', () => {
  for (const l of allLooks()) {
    ok(l.face && l.face.eyes === 'stern' && l.face.brows === 'stern' && l.face.mouth === 'flat', JSON.stringify(l.face));
  }
  ok(makeFigure(FIGURE_LOOKS.soldier).getObjectByName('face').material.map, '얼굴 그림');
});

test('goryeo-style: 새 사람은 지금 사람(core/people.js)과 머리 크기·얼굴·몸 비율이 같다', () => {
  const old = makePerson(LOOKS.soldier, { track: false }), f = makeFigure(FIGURE_LOOKS.soldier);
  eq(f.getObjectByName('headGroup').scale.toArray(), old.getObjectByName('headGroup').scale.toArray(), '머리 크기');
  eq(f.getObjectByName('face').material.uuid, old.getObjectByName('face').material.uuid, '같은 얼굴 그림');
  const h = o => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).y; };
  ok(Math.abs(h(f) - h(old)) < 0.15, `키 ${h(f)} / ${h(old)}`);
  eq(FIGURE_LOOKS.soldier.robe, LOOKS.soldier.robe, '옷색도 지금 병사');
  const kid = makeFigure(guardianLook('a', 'worker'));
  eq(kid.getObjectByName('face').material.uuid, makePerson(LOOKS.kid, { track: false }).getObjectByName('face').material.uuid, '지킴이 얼굴은 지금 아이 얼굴');
});

test('goryeo-style: 그리기 조각은 지금 사람보다 적다(같은 재질 조각 합치기), 재질은 people.js 것을 함께 쓴다', () => {
  const old = drawPieces(makePerson(LOOKS.soldier, { track: false }));
  ok(drawPieces(makeFigure(FIGURE_LOOKS.soldier)) < old, '병사');
  for (const l of allLooks()) { const n = drawPieces(makeFigure(l)); ok(n <= old, `${l.job}: ${n} <= ${old}`); }
  const a = makeFigure(FIGURE_LOOKS.soldier), c = makeFigure(crowdLook('soldier', 3));
  const mats = o => { const s = new Set(); o.traverse(m => m.material && s.add(m.material.uuid)); return s; };
  const shared = [...mats(a)].filter(u => mats(c).has(u));
  ok(shared.length >= 4, `같은 재질 ${shared.length}`);
});

test('goryeo-style: 직업마다 실루엣(모자·몸 모양)이 다르다', () => {
  const sigs = JOBS.map(j => silhouette(makeFigure(FIGURE_LOOKS[j])));
  eq(new Set(sigs).size, JOBS.length, sigs.join(' | '));
  for (const j of JOBS) ok(FIGURE_LOOKS[j] && FIGURE_LOOKS[j].job === j, j);
});

test('goryeo-style: 지킴이는 생김새 3가지 × 장별 옷 3가지, 옷이 바뀌면 실루엣이 바뀌고 얼굴은 그대로다', () => {
  eq(Object.keys(GUARDIAN_LOOKS).length, 3);
  for (const o of ['soldier', 'archer', 'worker']) ok(GUARDIAN_OUTFITS[o], o);
  for (const id of Object.keys(GUARDIAN_LOOKS)) {
    const figs = Object.keys(GUARDIAN_OUTFITS).map(o => makeFigure(guardianLook(id, o)));
    eq(new Set(figs.map(silhouette)).size, figs.length, `${id} 옷마다 다른 모양`);
    eq(new Set(figs.map(f => f.getObjectByName('head').material.uuid)).size, 1, `${id} 얼굴은 같다`);
    ok(figs.every(f => f.userData.kid), '견습생은 아이 비율');
  }
  const ids = Object.keys(GUARDIAN_LOOKS).map(id => silhouette(makeFigure(guardianLook(id, 'worker'))));
  eq(new Set(ids).size, 3, '생김새끼리도 머리 모양이 다르다');
});

test('goryeo-style: 군중 변형은 키·옷색·모자·손에 든 것이 바뀐다', () => {
  const v = [1, 2, 3, 4].map(s => crowdLook('commoner', s));
  ok(new Set(v.map(l => l.height)).size >= 3, '키');
  ok(new Set(v.map(l => l.robe)).size >= 3, '옷색');
  ok(new Set(v.map(l => l.hat)).size >= 2, '모자');
  ok(new Set(v.map(l => l.prop || 'none')).size >= 3, '든 것');
  const a = makeFigure(v[0]), b = makeFigure(v[1]);
  ok(Math.abs(a.scale.y - b.scale.y) > 0.01, '실제 키가 다르다');
});

test('goryeo-style: 동작 6가지(걷기·기뻐함·놀람·밀기·활쏘기·옮기기)가 팔다리를 움직인다', () => {
  for (const a of ['walk', 'cheer', 'surprise', 'push', 'shoot', 'carry']) ok(ACTIONS.includes(a), a);
  const pose = f => { const u = f.userData; return [u.arms[0].rotation.x, u.arms[0].rotation.z, u.arms[1].rotation.x, u.arms[1].rotation.z, u.legs[0].rotation.x, u.body.rotation.x, f.userData.body.position.y].map(x => x.toFixed(2)).join(','); };
  const idle = makeFigure(FIGURE_LOOKS.archer); setAction(idle, 'idle');
  for (let i = 0; i < 20; i++) animateFigure(idle, 0.03);
  const base = pose(idle), seen = new Set([base]);
  for (const a of ['walk', 'cheer', 'surprise', 'push', 'shoot', 'carry']) {
    const f = makeFigure(FIGURE_LOOKS.archer); setAction(f, a);
    for (let i = 0; i < 20; i++) animateFigure(f, 0.03);
    const p = pose(f);
    ok(p !== base, `${a}가 서 있기와 같다`);
    seen.add(p);
  }
  eq(seen.size, 7, '동작마다 자세가 다르다');
  const c = makeFigure(FIGURE_LOOKS.commoner); setAction(c, 'carry'); animateFigure(c, 0.03);
  ok(c.getObjectByName('carryLoad').visible, '옮기기는 짐을 든다');
  setAction(c, 'idle'); animateFigure(c, 0.03);
  ok(!c.getObjectByName('carryLoad').visible, '내려놓으면 짐이 없다');
});

test('goryeo-style: 고려 성 세트 — 여장 성벽·옹성 성문·망루·사다리·깃발·기와집·장독·나무 더미·모닥불(불길 없이)', () => {
  const pieces = { wall: cityWall({ length: 16 }), gate: gateWithOngseong(), tower: watchtower(), ladder: ladder(), flag: flag(), house: giwaHouse(), jars: jangdok(), wood: woodpile(), fire: campfire() };
  for (const [k, g] of Object.entries(pieces)) {
    ok(g.isObject3D, k);
    const n = drawPieces(g);
    ok(n >= 1 && n <= (k === 'house' ? 14 : 10), `${k}: 그리기 ${n}`); // 기와집은 kit 한옥(그리기 11) + 지붕 눈
  }
  ok(pieces.wall.getObjectByName('parapet'), '여장');
  ok(pieces.wall.children.filter(o => o.name === 'parapet').length <= 2, '여장은 돌과 눈뿐(총안 없음)');
  eq(SNOW_MOOD.fog, MOODS.snow.fog, '지금 2장 분위기(snow)를 바탕으로');
  eq(PALETTE.wall, 0xe4ded2, '지금 2장 성벽 돌색');
  ok(pieces.gate.getObjectByName('ongseong'), '옹성');
  const names = []; pieces.fire.traverse(o => names.push(o.name));
  ok(names.includes('smoke') && names.includes('embers'), '연기·숯불');
  ok(!names.some(n => /flame/.test(n)), '불꽃은 없다');
  ok(typeof pieces.fire.userData.update === 'function' && typeof pieces.flag.userData.update === 'function', '연기·깃발이 움직인다');
  const lum = c => { const x = new THREE.Color(c); return 0.3 * x.r + 0.59 * x.g + 0.11 * x.b; };
  ok(lum(SNOW_MOOD.skyHorizon) > 0.6 && lum(SNOW_MOOD.fog[0]) > 0.6, '밝은 눈 아침');
  for (const k of ['sky', 'snow', 'wall', 'flag']) ok(typeof PALETTE[k] === 'number', k);
});

test('goryeo-style: 지킴 게이지·지혜 카드 손·도장 쾅', async () => {
  const root = document.createElement('div'); root.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:560px'; document.body.appendChild(root);
  try {
    const g = createGauge(root, { value: 0.3 });
    const fill = root.querySelector('.ops-gauge-fill');
    ok(fill, '게이지');
    g.set(0.8);
    ok(fill.style.width === '80%', fill.style.width);
    const r = root.querySelector('.ops-gauge').getBoundingClientRect();
    ok(Math.abs((r.left + r.right) / 2 - 500) < 4 && r.top < 40, '위 가운데');
    let picked = null;
    const hand = createCardHand(root, [{ id: 'a', title: '병사 옮기기', text: '사다리 쪽으로' }, { id: 'b', title: '돌 굴리기', text: '아래로' }, { id: 'c', title: '깃발 올리기', text: '기세' }], { onPick: id => { picked = id; } });
    const cards = [...root.querySelectorAll('.ops-card')];
    eq(cards.length, 3);
    for (const c of cards) { const b = c.getBoundingClientRect(); ok(b.width >= 80 && b.height >= 100 && b.bottom <= 560, '손가락 크기, 화면 안'); }
    cards[1].click();
    eq(picked, 'b'); ok(cards[1].classList.contains('picked'), '고른 카드가 올라온다');
    const done = stampSeal(root, { text: '지킴', sub: '흥화진' });
    ok(root.querySelector('.ops-stamp'), '도장');
    await done;
    hand.dispose(); g.dispose();
    eq(root.querySelectorAll('.ops-card, .ops-gauge').length, 0, '치운다');
  } finally { root.remove(); }
});

test('goryeo-style: 시안 갤러리(tools/goryeo-style.html)의 화면 여섯이 오류 없이 뜬다', async () => {
  for (const view of ['compare', 'people', 'guardian', 'actions', 'castle', 'play']) {
    const frame = document.createElement('iframe');
    frame.src = `../tools/goryeo-style.html?view=${view}`;
    frame.style.cssText = 'width:1000px;height:560px;position:fixed;left:0;top:0;border:0;z-index:9999';
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const w = frame.contentWindow;
      for (let i = 0; i < 500 && !w.__ready && !(w.__errors && w.__errors.length); i++) await sleep(40);
      eq(w.__errors || [], [], view);
      ok(w.__ready, `${view} 준비`);
      ok(w.__calls > 0, `${view} 그림`);
    } finally { frame.remove(); }
  }
}, { timeout: 120000 });
