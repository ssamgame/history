// 장 만들기 틀: 근대·일제 강점기·현대편 장은 대본(script)과 배치표(layout)와 미니게임 순서(parts)만 쓰면 된다.
// 흐름: 해설 카드 → 차례대로 말 걸기 탐험(안내판은 볼거리) → 미니게임 부분들 → 해설 → 퀴즈.
// 부분(part) 종류
//   choose  : 카드 고르기 { title, prompt?, cards: [{ text, correct }], figure? }
//   sort    : 카드 나누기 { title, bins: [{ id, label }], cards: [{ text, bin }] }
//   place   : 자리 놓기 { title, items, slots, decor?, boardClass? }
//   order   : 순서 맞추기 { title, cards: [정답 순서] }
//   gauge   : 때 맞춰 누르기(움직이는 막대) { title, label, zone: [시작, 끝] (0~1) }
//   collect : 장면 속 빛나는 곳에 차례로 가기 { title, spots: [{ x, z }], seconds, howto }
// 모든 부분에 goal(그 부분 동안 목표 문장)을 둘 수 있다.
// 모든 부분에 fail(다시 할 때 힌트), done(끝난 뒤 대사), before/after(ctx, scene) 를 둘 수 있다.
import * as THREE from 'three';
import { renderDiorama } from './diorama.js';
import { DIORAMA } from '../modern/dioramas.js';
import { showHowTo, chooseCards, sortCards, placeOnBoard, orderCards, timingBar, readBook, showDocument } from '../../core/minigame.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts } from '../joseon/common.js';
import { buildTown } from './town.js';
import { PLAY, buildArena } from './play.js';

const HOWTO = { // 짧게(2026-11-04 선생님: 게임 방법은 최대한 간략하게)
  choose: '맞는 카드를 모두 골라요.',
  sort: '알맞은 쪽을 눌러요.',
  place: '알맞은 자리를 눌러요.',
  order: '차례대로 카드를 눌러요.',
  gauge: '빛나는 칸에서 버튼을 눌러요.',
  collect: '빛나는 곳으로 걸어가요.',
  drive: '빛나는 곳을 차례로 지나가요.',
  stops: '이름표가 선 곳을 차례로 찾아가요.',
  deliver: '든 것을 알맞은 원에 놓아요.',
  find: '맞는 팻말을 찾아가요.',
  ambush: '적이 빛나는 곳에 오면 버튼을 눌러요.',
  sneak: '불빛을 피해 파란 고리를 지나가요.',
  judge: '사람들 말을 듣고 맞는지 골라요.',
  build: '알맞은 터로 가서 지어요.',
  book: '책을 읽고 다음 쪽을 눌러요.',
  doc: '문서를 읽어요.',
};

// 역사책 그림 이름(같은 이름은 한 번만 찍는다)
const bookKey = (part, page) => `${part.title}|${page.title}`;
// 역사책 앞의 안내 대사를 읽는 동안 첫 쪽 그림을 미리 찍어 둔다(처음 찍을 때는 그림 도구를 준비하느라 무겁다).
// 대사 글자가 다 나온 뒤(1.2초쯤) 찍고, 돌려준 함수를 부르면(책이 먼저 열리면) 그만둔다. draw(spec, key)는 renderDiorama
export function bookWarmup(part, draw = renderDiorama, delay = 400, onTime = null) {
  const page = part.pages?.[0], spec = page && (page.scene || DIORAMA[page.pic]);
  if (!spec) return () => {};
  const h = setTimeout(() => { const t0 = performance.now(); draw(spec, bookKey(part, page)); onTime?.(performance.now() - t0); }, delay);
  return () => clearTimeout(h);
}

// 장면 속 빛나는 고리들을 차례로 찾아가기. seconds 안에 다 가면 성공(쉬우면 시간 1.5배).
function collect(ctx, scene, part, easy) {
  const { world, hud, audio } = ctx;
  const duration = (part.seconds || 80) * (easy ? 1.5 : 1);
  placePlayer(world, part.from || scene.start);
  ctx.input.enabled = true;
  const rings = part.spots.map(s => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2; r.position.set(s.x, 0.08, s.z); world.level.add(r);
    return { ...s, r, got: false };
  });
  let t = 0, done = false;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); rings.forEach(x => world.level.remove(x.r));
      hud.setTimer(null); hud.setCounter(null); world.setGoal(null); ctx.input.enabled = false;
      resolve(ok);
    };
    const off = world.onUpdate((dt, el) => {
      if (done) return;
      t += dt;
      const p = world.player.position;
      let near = null, nd = Infinity;
      for (const x of rings) {
        if (x.got) continue;
        x.r.material.opacity = 0.55 + Math.sin(el * 4) * 0.3;
        const d = Math.hypot(p.x - x.x, p.z - x.z);
        if (d < 1.6) { x.got = true; x.r.visible = false; audio.play('correct'); if (part.onReach) part.onReach(ctx, scene, rings.indexOf(x)); continue; }
        if (d < nd) { nd = d; near = x; }
      }
      const got = rings.filter(x => x.got).length;
      hud.setTimer(duration - t);
      hud.setCounter(`${part.counter || '찾은 곳'} ${got}/${rings.length}`);
      world.setGoal(near ? { x: near.x, z: near.z } : null);
      if (got === rings.length) return finish(true);
      if (t >= duration) finish(false);
    });
  });
}

// 읽기 부분에 arena가 있으면 그 무대(예: 연무당 탁자 앞, part.from)에 서서 읽는다. 다 읽으면 무대를 치우고 원래 자리로
async function atArena(ctx, part, read) {
  if (!part.arena) return read();
  const { world } = ctx, a = buildArena(world, part.arena);
  const back = { p: world.player.position.clone(), ry: world.player.rotation.y };
  const at = a.at(...(part.from || [0, 0]));
  placePlayer(world, [at.x, at.z], part.face ?? Math.PI);
  if (part.view) { // view: { eye: [x, y, z], at: [x, y, z] } 무대 기준. 그 모습을 잠깐 보여 준 뒤 문서를 연다
    const e = a.at(part.view.eye[0], part.view.eye[2]), t = a.at(part.view.at[0], part.view.at[2]);
    world.setFixedCamera([e.x, part.view.eye[1], e.z], [t.x, part.view.at[1], t.z]);
    await new Promise(r => setTimeout(r, part.view.ms ?? 1600));
  }
  try { return await read(); } finally { world.camMode = 'follow'; a.dispose(); world.player.position.copy(back.p); world.player.rotation.y = back.ry; world.snapCamera(); }
}

function runPart(ctx, scene, part, easy) {
  switch (part.type) {
    case 'choose': return chooseCards(ctx, { title: part.title, prompt: part.prompt, cards: part.cards, figure: part.figure, hint: typeof part.fail === 'string' ? part.fail : undefined, easy });
    case 'sort': return sortCards(ctx, { title: part.title, bins: part.bins, cards: part.cards, hint: typeof part.fail === 'string' ? part.fail : undefined, easy });
    case 'place': return placeOnBoard(ctx, { title: part.title, items: part.items, slots: part.slots, decor: part.decor, boardClass: part.boardClass, hint: typeof part.fail === 'string' ? part.fail : undefined, easy });
    case 'order': return orderCards(ctx, { title: part.title, cards: part.cards, hint: typeof part.fail === 'string' ? part.fail : undefined, easy });
    case 'gauge': return timingBar(ctx, { title: part.title, prompt: part.prompt, label: part.label, zone: part.zone, seconds: part.seconds, easy });
    case 'collect': return collect(ctx, scene, part, easy);
    case 'book': return readBook(ctx, { title: part.title, pages: part.pages.map(p => ({ ...p, scene: p.scene || DIORAMA[p.pic] })), render: p => renderDiorama(p.scene, bookKey(part, p)), onTiming: (label, ms, note) => ctx.world?.perf?.time(label, ms, `${part.title} ${note}`) });
    case 'scene': return part.play(ctx, scene).then(() => true); // 짧은 장면(관아를 차지하는 모습 등)
    case 'act': return part.play(ctx, scene, easy); // 장 고유 놀이(점수에 들어간다, D-47 현대 1장 문패 바꿔 달기 등)
    case 'doc': return atArena(ctx, part, () => showDocument(ctx, { title: part.title, heading: part.heading, intro: part.docIntro, items: part.items, src: part.src, scroll: part.scroll }));
    case 'drive': case 'stops': case 'deliver': case 'find': case 'ambush': case 'sneak': case 'judge': case 'build': return PLAY[part.type](ctx, part, easy);
    default: throw new Error(`unknown part ${part.type}`);
  }
}

// def: { id, mood, player, script, layout, order: [말 걸 차례], parts: [...], spot: [x, z], decorate?(world, built) }
export function makeKitChapter(def) {
  const { script } = def;
  let scene = null;
  const restoreEnd = ctx => { for (const p of def.parts) if (p.after) p.after(ctx, scene); };
  return {
    id: def.id, mood: def.mood, player: def.player, script, quizzes: script.quizzes, parts: def.parts, order: def.order, layout: def.layout, // parts·order·layout: 개발용 무대 보기와 진행 검사(tests/quest.test.js)
    buildScene(world) {
      const built = buildTown(world, def.layout);
      scene = { ...built, start: def.layout.start };
      if (def.decorate) Object.assign(scene, def.decorate(world, built) || {});
      return scene;
    },
    enterStage(ctx, stage) {
      if (stage === 'minigame' || stage === 'quiz') placePlayer(ctx.world, def.spot || def.layout.start);
      if (stage === 'quiz') { restoreEnd(ctx); ctx.setGoal(script.goals[script.goals.length - 1]); }
    },
    explore(ctx) { return talkInOrder(ctx, script, def.order, def.layout.start); },
    async minigame(ctx) {
      const { world, dialogue, input } = ctx;
      input.enabled = false;
      setTalkStep(ctx, script, def.order, def.order.length);
      world.setGoal(null);
      await showHowTo(ctx.ui, {
        title: script.minigameTitle,
        steps: def.parts.filter(p => !['book', 'doc', 'scene'].includes(p.type)).map(p => p.howto || HOWTO[p.type]).filter(Boolean),
      });
      const results = [];
      const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
      const from = q && q.get('debug') ? +(q.get('part') || 0) : 0; // 개발용: ?debug=h3-minigame&part=1 이면 그 부분부터
      for (const [k, part] of def.parts.slice(from).entries()) {
        world.perf?.segment(`${def.id} 미니게임 ${from + k + 1}: ${part.title || part.type}`); // 개발용 성능 측정(?perf=1)
        const warm = part.type === 'book' && part.intro ? bookWarmup(part, renderDiorama, 1200, ms => world.perf?.time('역사책 첫 그림(안내 대사 동안 미리)', ms, part.title)) : null;
        if (part.goal) ctx.setGoal(part.goal); // 부분마다 목표 문장(없으면 앞의 것 그대로)
        if (part.intro) { await sayAll(dialogue, part.intro); dialogue.close(); }
        warm?.();
        if (part.before) part.before(ctx, scene);
        if (['book', 'doc', 'scene'].includes(part.type)) await runPart(ctx, scene, part, false); // 읽기·장면은 첫 시도 점수에 넣지 않는다
        else results.push(await tryPart(ctx, easy => runPart(ctx, scene, part, easy), part.fail));
        if (part.after) part.after(ctx, scene);
        if (part.done) { await sayAll(dialogue, part.done); dialogue.close(); }
      }
      await sayAll(dialogue, script.result); dialogue.close();
      placePlayer(world, def.spot || def.layout.start);
      ctx.setGoal(script.goals[script.goals.length - 1]);
      return sumParts(results);
    },
  };
}
