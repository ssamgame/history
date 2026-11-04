# 인수인계 (2026-11-04 밤, D-71까지) — 새 세션은 이 파일부터

`CLAUDE.md`(꼭 지킬 것·내용 원칙) → 이 파일 순서로 읽는다. 결정은 `docs/team/decisions.md`, 테스트 기록은 `docs/team/tested.md`.

## 1. 지금 상태
- 작업 브랜치 `claude/goryeo-game-handoff-vus00f`. 학생 사이트 **goryeo-v80**(D-71과 덧붙임: 일제 1장 선로·트럭, 2장 문서 쥐기, 3장 편지 길 건물, 4장 매복 바로 이어짐).
- 미리보기 https://claude.ai/artifact/QSh1YhvtwooxoyDRsBZsCT 에 v76 코드를 올림(4절).
- 전체 테스트(C) 결과는 `docs/team/tested.md` 마지막 줄. 예전부터 알려진 실패 2개: `arena … k1 doc papers(0,-8.5)`, `stage3 G2 … 해가 카메라 뒤쪽`.

## 2. 오늘(2026-11-04) 한 일 요약
- D-67~D-70: 고려 6장·조선 1~6장·근대 1·2장 고침, 플레이 점검(근대~현대 18장), 카메라 되돌림.
- D-71 선생님 수정 목록 3: 전체 4가지(게임 방법 짧게, 안경 두 겹, 편 복습 퀴즈 뺌, 걷는 사람 몸 겹침) + 근대 1~6장·일제 1~3장. 자세히는 `docs/team/decisions.md` D-71.

## 3. 다음에 할 일(추천 순서)
1. 선생님이 v76을 보고 주시는 수정 목록을 장 하나씩 고친다. 카메라 자리는 선생님 확인 없이 바꾸지 않는다(D-70, 새로 만든 장면·선생님이 '잘 보이게' 하라신 곳만 예외).
2. 일제 4~6장·현대편은 D-71 목록에 없었다(공용 수정 — 길 반짝임·바닷가·손에 쥔 물건·사람 겹침·게임 방법 — 은 함께 바뀌었다).
3. 묵은 일: 알려진 실패 2개, 실제 갤럭시 탭 측정(`docs/tablet-measure-guide.md`), 교과서 대조, 출처 S66~S70 주소 확인, 배경음악, 별점 규칙, `content/sources.md` 다시 만들기(`tools/gen-sources.cjs`), 임금 느린 걸음, 편 복습 퀴즈 파일(`content/review.js`·`showReviewQuiz`)은 남아 있으나 쓰지 않는다.

## 4. 일하는 법
- 테스트: `PORT=8183 NODE_PATH=$(npm root -g) timeout 900 node tools/test-node.cjs "k5"`(이름 앞부분, `|`로 여럿). 전체는 인자 없이 `PORT=8180 … timeout 3300`(약 50분, run_in_background). 출력은 `FAIL|RESULT` 줄만.
- 테스트 먼저 → 실패 확인 → 고침. 고친 파일 `node --check`. 한 줄에 `//` 주석을 코드 앞에 두지 않는다(뒤 코드가 주석이 된다).
- 화면 점검 도구(`tools/qa/`):
  - `play.cjs k1 900 intro`: 장을 끝까지 학생처럼(0.4초마다 화면, `qa-out/play/k1-intro/log.txt`에 대사·감지 기록). 다음 장으로 넘어가면 멈춘다.
  - `python3 tools/qa/sheet.py qa-out/play/k1-intro 1 64 4 4`: 화면 16장을 한 판으로.
  - `introshot.cjs k4 0 2 out.jpg`(도입 n번째 화면), `partshot.cjs k5-minigame "대사 글" out.jpg 260`(그 대사가 뜰 때 화면).
  - `run.cjs game:k2-explore+bot --sec 150`(감지기: 묻힘·겹침·순간이동, 자리와 사진). 매복 놀이의 '묻힘'은 엎드린 사람이라 오류 아님.
- 배포: 전체 테스트 → `core/precache.js` CACHE(다음 **goryeo-v81**)와 `tests/sw.test.js` → 커밋 → main 병합·push(GitHub 500 오류가 잦다: 4·8·16초 간격으로 다시) → GitHub MCP `actions_list`로 'pages build and deployment' success 확인(github.io는 이 환경에서 막힘) → 미리보기 다시 올림.
- 미리보기 올리는 법: 페이지 `index.html`, url 위 주소, 바뀐 파일만 `files`로(나머지는 남는다). 미리보기 전용 사본 셋은 스크래치패드에 만들어 보낸다(저장소에 넣지 않음):
  - `core/body.js`: `loadBody`의 `base = await new GLTFLoader().loadAsync(url);`를 `url === BODY_URL`이면 `(await import('../assets/models/body.js')).default`(base64)를 `parseAsync`로 읽게 바꾼 사본.
  - `chapters/index.js`: `isUnlocked`에서 `if (!chapter.load) return false;` 다음 줄에 `return true;`(모든 장 열림). 이 파일을 안 바꿨으면 다시 보낼 필요 없다.
  - `assets/models/body.js`: `export default '<body.glb base64>';`(이미 올라가 있음).
  - 처음 보내는 파일이 아니면 Artifact가 "먼저 읽으라"며 거절할 수 있다: `action: read`로 읽은 뒤 다시 올린다.
- 선생님: 결정이 필요하면 바로 하지 말고 두세 가지를 먼저 여쭌다(추천안 첫째). 답은 한국어로 쉽게.
