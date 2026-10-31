// 화면 속 오류 감지기(tools/qa/probe.js)가 일부러 만든 오류를 하나씩 잡고, 멀쩡한 장면에서는 아무것도 잡지 않는지 본다.
// 감지기가 조용하다고 장면이 멀쩡하다는 뜻이 되려면, 먼저 감지기가 오류를 실제로 잡는다는 것을 보여야 한다.
import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { testWorld } from './bot.js';
import { createProbe } from '../tools/qa/probe.js';
import { makePerson, setCarry } from '../core/people.js';
import { makeHorse, mount } from '../core/horse.js';
import { LOOKS } from '../content/characters.js';

function scene() {
  const w = testWorld();
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 0.2, 60), new THREE.MeshLambertMaterial()); ground.position.y = -0.1; w.level.add(ground);
  const P = (look, x, z) => { const p = makePerson(LOOKS[look]); p.position.set(x, 0, z); w.level.add(p); return p; };
  return { w, P };
}
const run = (probe, n = 24, between = null) => { for (let i = 0; i < n; i++) { between?.(i); probe.tick(1 / 30); } };
const kinds = probe => probe.events.map(e => `${e.kind}:${e.who}`);

test('qa probe: 멀쩡한 장면(서 있는 사람·말 탄 사람·짐 든 사람)에서는 아무것도 잡지 않는다', () => {
  const { w, P } = scene();
  try {
    P('villager', -3, -3); P('soldier', 0, -3); P('woman', 3, -3); // (0,0)에는 학생(world.player)이 서 있다
    const carrier = P('worker', 0, 3); setCarry(carrier, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), new THREE.MeshLambertMaterial()), 'arms');
    const h = makeHorse(); h.position.set(-4, 0, 4); w.level.add(h); mount(h, makePerson(LOOKS.mongol));
    const probe = createProbe(w);
    run(probe);
    eq(kinds(probe), [], '잡은 것');
    ok(probe.stats.people >= 5 && probe.stats.horses === 1, `사람 ${probe.stats.people}, 말 ${probe.stats.horses}`);
  } finally { w.dispose(); }
});

test('qa probe: 일부러 만든 오류를 종류마다 잡는다(몸통 빔·머리 빔·반투명·땅에 묻힘·겹침·기수 이탈·손에서 떨어진 물건·미끄러짐·순간이동·숫자 아님)', () => {
  const { w, P } = scene();
  try {
    const hollow = P('scholar', -8, -6); hollow.traverse(o => { if (['robe', 'jeogori', 'belt', 'pantsTop', 'badge', 'flap', 'collar', 'tie', 'goreum'].includes(o.name)) o.visible = false; }); // 2026-10-30 말 탄 사람 몸통 투명 오류와 같은 꼴
    const headless = P('villager', -5, -6); headless.userData.head.traverse(o => { if (o.isMesh) o.visible = false; });
    const ghost = P('villager', -2, -6); ghost.traverse(o => { if (o.name === 'robe' || o.name === 'jeogori') { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.3; } });
    const sunk = P('soldier', 1, -6); sunk.position.y = -0.3;
    const a = P('villager', 4, -6), b = P('woman', 4.1, -6.05);
    const h = makeHorse(); h.position.set(8, 0, -6); w.level.add(h); const rider = mount(h, makePerson(LOOKS.mongol)); rider.position.x += 1.2;
    const carrier = P('worker', -8, 2), crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), new THREE.MeshLambertMaterial()); setCarry(carrier, crate, 'arms'); w.level.attach(crate); crate.position.set(-8, 0.2, 6);
    const glider = P('villager', -4, 2), jumper = P('villager', 0, 2), broken = P('villager', 4, 2);
    const probe = createProbe(w);
    run(probe, 60, i => { if (i < 30) glider.position.x += 0.05; if (i === 20) jumper.position.x += 5; if (i === 25) broken.position.x = NaN; });
    const got = new Set(kinds(probe)), id = o => probe.events.find(e => e.at && Math.abs(e.at[0] - o.position.x) < 0.01)?.who;
    const want = [['torso', hollow], ['head', headless], ['seeThrough', ghost], ['sunk', sunk], ['overlap', a], ['rider', rider], ['hand', carrier], ['glide', glider], ['jump', jumper]];
    for (const [k] of want) ok([...got].some(g => g.startsWith(k + ':')), `${k}를 잡는다: ${[...got].join(' ')}`);
    ok([...got].some(g => g.startsWith('nan:')), 'nan을 잡는다');
    // 잡은 사람이 바로 그 사람이고, 멀쩡한 사람(겹친 둘 말고)은 잡지 않는다
    const torsoEv = probe.events.find(e => e.kind === 'torso'); ok(Math.abs(torsoEv.at[0] - hollow.position.x) < 0.01, '몸통이 빈 사람을 가리킨다');
    const sunkEv = probe.events.find(e => e.kind === 'sunk'); ok(/0\.(2|3)\dm under/.test(sunkEv.detail), `묻힌 깊이 ${sunkEv.detail}`);
    eq(probe.events.filter(e => e.kind === 'glide').length, 1, '미끄러진 사람은 하나'); void id;
    ok(probe.events.every(e => typeof e.t === 'number' && 'scene' in e), '사건마다 시각·장면 이름');
  } finally { w.dispose(); }
});

test('qa probe: 화면 밖으로 나간 단추와 다른 판에 덮인 단추를 잡는다', () => {
  const { w } = scene();
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const off = document.createElement('button'); off.textContent = '밖'; Object.assign(off.style, { position: 'fixed', left: `${innerWidth + 50}px`, top: '10px', width: '60px', height: '40px', zIndex: 10000 });
    const under = document.createElement('button'); under.textContent = '덮임'; Object.assign(under.style, { position: 'fixed', left: '10px', top: '10px', width: '60px', height: '40px' });
    const cover = document.createElement('div'); cover.className = 'qa-cover'; Object.assign(cover.style, { position: 'fixed', left: '0', top: '0', width: '120px', height: '80px', zIndex: 9999 });
    const fine = document.createElement('button'); fine.textContent = '정상'; Object.assign(fine.style, { position: 'fixed', left: '200px', top: '10px', width: '60px', height: '40px', zIndex: 10000 }); // 시험 페이지의 결과 글(PRE) 위로
    ui.append(off, under, cover, fine);
    const probe = createProbe(w, { ui });
    probe.checkUi();
    const got = probe.events.map(e => `${e.kind}:${e.who}`);
    ok(got.includes('uiOff:밖'), got.join(' ')); ok(got.includes('uiCovered:덮임'), got.join(' ')); ok(!got.some(g => g.endsWith(':정상')), `정상 단추는 잡지 않는다 ${JSON.stringify(probe.events)}`);
  } finally { ui.remove(); w.dispose(); }
});
