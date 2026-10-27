// 배운 내용 확인(퀴즈) 배경: 문제마다 그 내용과 관련된 장면을 뒤에 보여 준다.
// 문제 글에 이름이 나오는 인물이나 안내판이 장면에 있으면 카메라가 그쪽을 비추고, 장면에 없는 역사 인물(흥선 대원군 등)이면
// 그 인물을 잠깐 세워 비춘다. 관련된 것이 없으면 마을 전체를 천천히 돌며 보여 준다.
// 정답이 화면에 먼저 보이지 않게, 고르는 것은 문제 글(question)에서만 찾는다.
// 문제 창 바로 위에는 "1863년 · 흥선 대원군"처럼 그때(퀴즈의 year)와 비추는 것의 이름을 단 이름표가 뜬다.
import * as THREE from 'three';
import { makePerson } from './people.js';
import { LOOKS } from '../content/characters.js';

const squash = t => String(t || '').replace(/[\s·「」『』'"()]/g, '');

// 교과서에 나오는 역사 인물 → 생김새(LOOKS). 장면에 없어도 퀴즈 배경에 세울 수 있다.
export const FIGURES = {
  서희: 'seohui', 소손녕: 'sonn', 양규: 'yanggyu', 강감찬: 'gangamchan', 김윤후: 'kimyunhu', 배중손: 'baejungson', 김통정: 'kimtongjeong',
  이성계: 'yiseonggye', 세종: 'sejong', 장영실: 'jangyeongsil', 이순신: 'yisunsin', 인조: 'injo', 김상헌: 'kimsangheon', 최명길: 'choemyeonggil',
  정조: 'jeongjo', 정약용: 'jeongyakyong', '흥선 대원군': 'daewongun', 고종: 'gojong', 김옥균: 'kimokgyun', 전봉준: 'jeonbongjun', 서재필: 'seojaepil',
  안중근: 'ahnjunggeun', 안창호: 'ahnchangho', 유관순: 'yugwansun', 김구: 'kimgu', 이승만: 'syngmanrhee', 홍범도: 'hongbeomdo', 김좌진: 'kimjwajin',
};

// 이 문제와 관련된 것: 이름이 문제 글에 가장 길게 들어맞는 인물·안내판. { id, name, mesh?, spot, look? } 또는 null
export function quizSubject(world, speakers, q) {
  const text = squash(q.question);
  let best = null, bestLen = 1; // 한 글자 이름(가, 나)은 우연히 맞기 쉬워 두 글자부터
  for (const [id, n] of world.npcs) {
    const name = n.spot ? (n.mesh.name || '').replace(/^sign:/, '') : speakers?.[id]?.name;
    const key = squash(name);
    if (key.length > bestLen && text.includes(key)) { best = { id, name, mesh: n.mesh, spot: !!n.spot }; bestLen = key.length; }
  }
  if (best) return best;
  for (const [name, look] of Object.entries(FIGURES)) {
    const key = squash(name);
    if (LOOKS[look] && key.length > bestLen && text.includes(key)) { best = { id: look, name, look, spot: false }; bestLen = key.length; }
  }
  return best;
}

// 문제 하나의 배경을 띄운다. 돌려주는 함수를 부르면 이름표와 잠깐 세운 인물을 치운다(카메라는 다음 문제나 장 끝에서 다시 정한다).
export function showQuizView(ctx, chapter, q, k) {
  const { world, ui } = ctx;
  // 장이 문제에 맞는 배경을 따로 정해 두었으면(quizView) 그것을 쓴다: 카메라를 정하고 { name }을 돌려준다
  const custom = chapter.quizView ? chapter.quizView(ctx, q, k) : null;
  const subject = custom ? { id: 'custom', name: custom.name, custom: true } : quizSubject(world, chapter.script?.speakers, q);
  const cam = world.camera, target = new THREE.Vector3(), pos = new THREE.Vector3();
  let orbit = null, guest = null;
  world.player.visible = false; // 학생이 화면을 가리지 않게(장 끝에서 다시 보인다)
  if (subject && subject.custom) { /* 장이 이미 카메라를 정했다 */ } else if (subject && subject.look) { // 장면에 없는 역사 인물: 학생이 서 있던 자리에 잠깐 세운다
    guest = makePerson(LOOKS[subject.look]);
    guest.position.set(world.player.position.x, 0, world.player.position.z); guest.rotation.y = 0;
    world.level.add(guest);
    subject.mesh = guest;
  }
  if (subject && subject.custom) { /* 위와 같음 */ } else if (subject) { // 인물·안내판을 앞에서 조금 비켜 비춘다. 아래쪽 반은 문제 창이 덮으므로 얼굴(글판)이 화면 위쪽에 오게 낮은 곳을 본다
    const m = subject.mesh, ry = m.rotation.y, side = k % 2 ? -1 : 1;
    const dist = subject.spot ? 6.2 : 5.4;
    target.set(m.position.x, 0.9, m.position.z);
    pos.set(m.position.x + Math.sin(ry + side * 0.4) * dist, subject.spot ? 2.9 : 3.0, m.position.z + Math.cos(ry + side * 0.4) * dist);
    world.setFixedCamera(pos.toArray(), target.toArray());
  } else { // 마을 전체를 높이서 천천히 돈다(문제마다 다른 쪽에서 시작)
    const b = world.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const r = Math.max(14, Math.min(30, Math.max(b.x1 - b.x0, b.z1 - b.z0) * 0.75));
    let a = k * 1.9 + 0.6;
    target.set(cx, 1.5, cz);
    const place = () => { world.setFixedCamera([cx + Math.sin(a) * r, r * 0.55, cz + Math.cos(a) * r], target.toArray()); };
    place();
    orbit = world.onUpdate(dt => { a += dt * 0.06; place(); });
  }
  const label = [q.year && `${q.year}년`, subject && subject.name].filter(Boolean).join(' · ');
  const plate = label ? Object.assign(document.createElement('div'), { className: 'quiz-plate', textContent: label }) : null;
  if (plate) (ui.querySelector('.dlg') || ui).append(plate); // 문제 창 바로 위에 붙인다(인물 얼굴을 가리지 않게)
  ctx.testHooks.quizView = { subject: subject && subject.id, label, cam: cam.position.clone() };
  return () => { if (orbit) orbit(); if (plate) plate.remove(); if (guest) world.level.remove(guest); };
}

// 퀴즈가 다 끝나면 카메라를 학생 뒤로 돌린다
export function endQuizView(ctx) {
  ctx.world.player.visible = true;
  ctx.world.camMode = 'follow';
  ctx.world.snapCamera();
}
