// D-73(2026-11-05 고려편 플레이 점검): 장 선택으로, 1장 부딪힘, 화면 밖 목표 화살표, 대화 중 느낌표 숨김, 서희 따라와 표시.
import { test, ok, eq } from './harness.js';
import { testWorld } from './bot.js';
import { createHud } from '../core/screens.js';

test('d73: 메뉴 「장 선택으로」는 그 편을 주소(#map=편)에 실어 다시 열고, 첫 화면 없이 지도로', async () => {
  const src = await (await fetch('../core/main.js')).text();
  ok(/location\.hash = `map=\$\{c \|\| ''\}`/.test(src), '메뉴 map → #map=편');
  ok(src.includes("/^#map=(\\w*)$/.exec(location.hash)") && src.includes('world.player.visible = false; await mapLoop();'), '열 때 #map이면 지도부터');
});

test('d73: 1장 천막·수레·모닥불·지휘소·거란 천막은 실제 크기만큼 부딪힌다', async () => {
  const w = testWorld(); const { buildCh1Scene } = await import('../chapters/ch1/scene.js');
  buildCh1Scene(w);
  const at = (x, z) => w.colliders.filter(c => Math.hypot(c.x - x, c.z - z) < 0.01);
  ok(at(10, 3)[0].r >= 2.3, '천막 귀퉁이까지'); ok(at(6, 10.5)[0].r >= 1.3, '모닥불 돌까지');
  ok(w.colliders.filter(c => Math.abs(c.z + 3) < 0.01 && c.x >= -13.5 && c.x <= -8.5).length >= 3, '지휘소 마루');
  ok(at(0, -41).length === 1, '거란 큰 천막');
  const p = w.player.position; p.set(10, 0, 7); for (let i = 0; i < 120; i++) w.step(1 / 60, { x: 0, z: -1 });
  ok(p.z > 3 + 2.3, `천막 앞에서 멈춘다 ${p.z.toFixed(2)}`);
});

test('d73: 대화하는 사람의 느낌표는 숨긴다. 화면 가장자리 노란 화살표는 없다(2026-11-05 선생님: 제거)', () => {
  const w = testWorld();
  w.player.position.set(0, 0, 0); w.camMode = 'follow'; w.snapCamera(); w.step(1 / 60, { x: 0, z: 0 });
  eq(w.offscreenTarget, undefined);
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try { const hud = createHud(ui, { touch: false }); eq(hud.setEdge, undefined); eq(ui.querySelector('.hud-edge'), null); } finally { ui.remove(); }
  const npc = w.addNpc('a', undefined, 0, -3, 0); npc.mark.visible = true; w.setTalkCamera(npc.mesh); w.step(1 / 60, { x: 0, z: 0 });
  ok(npc.mark.scale.x < 0.01, '대화 중 느낌표 숨김');
});

test('d73: 서희가 기다릴 때 「따라와!」, 강가에서 막히면 「다리로 건너자」', async () => {
  const src = await (await fetch('../chapters/ch1/chapter.js')).text();
  ok(src.includes("labelSprite('따라와!')") && src.includes('call.visible = waiting'), '따라와 표시');
  ok(src.includes('강은 다리로 건너자'), '다리 안내');
});

test('d73 겹침: 근대~현대 마을을 오가는 사람(행인)이 건물·전차·소품을 뚫고 지나가지 않고, 마을에 세운 사람이 건물 속에 서 있지 않다(2026-11-12 선생님)', async () => {
  const { MODERN, COLONIAL, PRESENT } = await import('../chapters/index.js');
  const { buildTown } = await import('../chapters/kit/town.js');
  const { clashes } = await import('../tools/qa/probe.js');
  const bad = [];
  for (const meta of [...MODERN, ...COLONIAL, ...PRESENT]) {
    const ch = (await meta.load()).default, w = testWorld();
    try {
      const t = buildTown(w, ch.layout);
      for (const c of clashes(w)) if (c.person !== w.player) bad.push(`${ch.id} ${c.person ? '사람' : '무리'} ${c.at.x.toFixed(1)},${c.at.z.toFixed(1)} ${c.what}`);
      for (let i = 0; i < 400; i++) { // 20초(행인이 길 끝까지 오간다)
        w.step(1 / 20, { x: 0, z: 0 });
        if (i % 8 === 0) for (const c of clashes(w, { people: t.walkers })) bad.push(`${ch.id} 행인 ${c.at.x.toFixed(1)},${c.at.z.toFixed(1)} ${c.what}`);
      }
    } finally { w.dispose(); }
  }
  eq([...new Set(bad.map(b => b.replace(/(-?\d+)\.\d,(-?\d+)\.\d/, '$1,$2')))], []);
}, { timeout: 600000 });

test('d73 겹침 무대: 근대~현대 미니게임 무대에 세운 무리·소품의 사람이 무대 건물·소품 속에 서 있지 않다(2026-11-12 선생님)', async () => {
  const { MODERN, COLONIAL, PRESENT } = await import('../chapters/index.js');
  const { buildArena } = await import('../chapters/kit/play.js');
  const { clashes } = await import('../tools/qa/probe.js');
  const arenas = (v, out = new Set(), d = 0) => { if (v && typeof v === 'object' && d < 5) { if (v.origin && v.bounds) out.add(v); else for (const x of Object.values(v)) arenas(x, out, d + 1); } return out; };
  const bad = []; let n = 0;
  for (const meta of [...MODERN, ...COLONIAL, ...PRESENT]) {
    const ch = (await meta.load()).default;
    for (const a of arenas(ch.parts)) {
      const w = testWorld(); n += 1;
      try { buildArena(w, a); for (const c of clashes(w)) if (c.person !== w.player) bad.push(`${ch.id} (${a.origin}) ${c.at.x.toFixed(1)},${c.at.z.toFixed(1)} ${c.what}`); } finally { w.dispose(); }
    }
  }
  ok(n >= 17, `무대 ${n}`);
  eq(bad, []);
}, { timeout: 600000 });
