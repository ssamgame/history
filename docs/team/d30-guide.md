# D-30 개발 안내 (장 담당이 읽는 한 장)

목록: `docs/team/tasks-d30.md`. 결정: `docs/team/decisions.md` D-30. 시범으로 다 넣은 장: `chapters/joseon/j1/chapter.js`(본보기로 읽을 것).

## 장마다 넣는 공통 (C-01 ~ C-05)
1. **퀘스트 목록(C-01)**: 화면은 이미 바뀜(`ctx.setGoal(script.goals[n])`가 목록을 만든다). `script.goals`는 실제 진행 차례대로, 마지막 '배운 내용을 확인해 보자' 같은 퀴즈 목표는 뺀다(빛나는 문 퀘스트가 대신). 안내 알림(`hud.notice`, toast로 하는 '~로 가 보자' 같은 안내)은 지우고, 진행 안내는 사람의 대사와 퀘스트 글로만. 두 줄 방법 카드(`showHowTo`)는 그대로 둔다.
2. **모두 들어야 진행(C-01)**: 탐험에서 이야기 들을 사람을 모두 들어야 메인 인물이 퀘스트를 준다(`heard.size < PEOPLE.length`면 wait 대사, 메인 머리 위 느낌표도 모두 들은 뒤에). wait·more 대사도 '모두'에 맞게 고친다. `tooEarly`로 막던 장도 같은 규칙(순서는 자유, 모두 들어야 메인).
3. **도입 장면(C-03)**: 장 모듈에 `introScene(ctx)` → `{ shots: [{ cam, look, to?, act? }], done? }`. `script.intro` 문장마다 장면 하나(문장이 길면 출처 그대로 둘로 나눠도 됨). 그 해설 내용을 장면의 인물·군대·배로 실제로 보여 준다(움직이는 인물은 다리가 저절로 걷는다). `done`에서 움직인 것을 제자리로. 확인 `?debug=<장>-intro`.
4. **빛나는 문(C-02)**: 장 모듈에 `portal: { at: [x, z], ry }` — 미니게임이 끝나 마을로 돌아온 학생 앞, 마을 가운데의 빈 땅. 앞면(+z를 ry로 돌린 쪽)이 학생 쪽. 길·건물·사람을 막지 않게. 퀴즈 목표 setGoal은 지운다. 확인 `?debug=<장>-quiz`(enterStage('quiz') 뒤 문이 선다).
5. **길 위 안내판 없음(C-03)**: 안내판 목록에 `plaque: { y, back }`을 달아 건물 처마 아래 간판으로(x, z = 그 건물 앞 땅, ry = 간판이 보는 쪽, y = 처마 아래 높이, back = 건물 쪽으로 들어갈 거리). 간판은 이름만 보이고 말 걸 수 없다. 그 안내판의 `always` 대사(출처 있는 해설)는 가까운 사람의 대사(first나 later)로 옮기고 안내판 npc 항목은 지운다. 건물이 없는 곳의 안내판은 없앤다(내용은 사람 대사로). 고려편의 '이름판'(nameBoard, 문 옆 장소 이름)은 그대로 둔다.
6. **다가가서 시작(C-05)**: 미니게임의 부분과 부분 사이에서 다음 부분이 저절로 시작하지 않게 `await waitInteract(ctx, { pos, quest: script.goals[n], label: '○○와 이야기하기', mark: false })`(`core/portal.js`). pos는 그 놀이와 관계있는 사람(머리 위 느낌표 `npc.mark.visible = true`)이나 물건(mark: true면 느낌표가 떠 있음). 말을 걸면 그 사람이 한두 줄로 놀이를 알려 주고 시작. 첫 부분은 탐험 끝의 메인 인물 대화가 그 역할을 한다.

## 지킬 것
- 역사 사실 문장은 출처(`src: ['S..']`) 있는 것만(`core/content.js` 검사). 새 사실을 지어내지 않는다. 대사는 쉬운 말, "~장군" 대신 이름만. 인물 표정은 근엄하게.
- 고치는 파일: 자기 장 폴더만. `core/*`, `chapters/kit/*`, `chapters/joseon/common.js·landmarks.js·ships.js`는 맡은 일에 적힌 것만 고친다. 꼭 다른 공용 파일을 고쳐야 하면 고치지 말고 보고에 적는다.
- 테스트 먼저: `tests/<장>.test.js`에 새 규칙 검사를 넣고 실패를 본 뒤 고친다. 돌리기: `PORT=<맡은 포트> NODE_PATH=$(npm root -g) timeout 900 node tools/test-node.cjs "<장>|signs D-30|C-0"`. 장 테스트의 '터치로 끝까지'(touch-only) 검사가 통과해야 한다(봇은 바닥 화살표 `world.setGoal`과 `ctx.testHooks.walkTo`를 따라가 대화 버튼을 누른다).
- 화면 확인: `python3 -m http.server <포트+1000>` + Playwright(`--use-angle=swiftshader`), 1000×560. `window.__world`, `window.__ctx`. 바뀐 화면마다 사진을 `docs/team/shots/d30-<장>-*.png`로.
- 주석을 코드 줄 끝에 붙여 뒤 코드를 삼키지 않게, 고친 파일마다 `node --check`.
- 커밋 메시지는 한국어, 끝에 아래 두 줄:
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_014LB5kAoBxkJ3uzw5BHNRPe
- 보고(짧게): 끝낸 작업 ID, 바꾼 파일, 테스트 결과(실패 줄 그대로), 사진 경로, 못 한 것과 까닭.
