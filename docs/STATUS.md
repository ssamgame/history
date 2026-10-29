# 진행 정리 (2026-10-29) — 새 세션은 이 파일부터

- 작업 브랜치 `claude/goryeo-game-handoff-vus00f`. 학생 사이트(main)는 **goryeo-v67**(2026-10-29 배포). 미리보기 아티팩트 https://claude.ai/artifact/QSh1YhvtwooxoyDRsBZsCT 도 v67.
- 결정 기록 `docs/team/decisions.md`(D-번호), 공통 도구 안내 `docs/team/d30-guide.md`, 작업 목록 `docs/team/tasks-d30.md`, 사진 `docs/team/shots/`.

## 꼭 지킬 것
- 선생님: 포항 초등 교사. 한국어·쉬운 말. **결정이 필요하면 바로 하지 말고 두세 가지를 먼저 여쭌다**(AskUserQuestion, 추천안 첫째).
- main 병합·배포·미리보기 다시 올리기는 선생님 승인 때만.
- 역사 사실은 출처(`src`) 있는 문장만(선생님 2026-10-29: 출처 메모에 없는 표현도 그대로 진행해도 됨). 내용 원칙은 `CLAUDE.md`.
- 사진은 선생님께 `SendUserFile`로 보낸다(선생님은 저장소 경로를 못 본다).

## 1. 계획한 일
- 고려 1장 ~ 현대 6장(30장)을 한 장씩: 바꿀 곳을 여쭘 → 만들기 → 사진으로 보여 드림 → 고칠 것 반영 → 배포.
- 모든 장에 D-30 공통 시스템: 퀘스트 목록, 모두 들어야 메인 인물 진행, 자막+3D 도입 장면(건너뛰기 없음), 놀이 사이 다가가서 시작, 빛나는 문 → 복습 퀴즈 → 다음 장 바로(6장은 큰 문 '○○로 가는 문'), 길 위 안내판 → 이름만 있는 건물 간판, 퀴즈 연두·분홍.

## 2. 진행된 일
- **고려 1~6장, 조선 1~6장, 근대 1~3장(15장)**: D-30 공통 + 장별 고침 모두 만들어 v67로 배포. 고려 2장·5장 D-32, D-32 공통(무릎 관절, 도입 장면 끝까지, 먼 산 흔들림 고침), 근대 3장 D-31도 v67에 들어감(선생님이 사진 확인 뒤 배포 승인).
- **지금 장 담당 에이전트가 만드는 중**(각자 작업 사본 브랜치에 커밋 → 끝나면 작업 브랜치에 merge, 충돌 확인, 테스트):
  | 장 | 할 일 | 사본 브랜치 |
  |---|---|---|
  | 근대 4장 k4 (D-33) | 탐험 끝 환구단 즉위식 장면(대한 제국), 신문 배달 그대로, 역사책 → 종로 만민 공동회(judge), D-30 공통 | `worktree-agent-a311a16c3ee02da5a`(예상 이름, `git worktree list`로 확인) |
  - 세션이 바뀌어 에이전트 알림이 안 오면: `git log --oneline claude/goryeo-game-handoff-vus00f..<사본 브랜치>`로 커밋이 있는지 보고, 있으면 merge. 없거나 덜 됐으면 그 장을 새로 맡긴다.

## 3. 남은 일
1. 근대 4장을 합치고 테스트 → 사진을 선생님께 보내 확인 → 승인 받으면 v68 배포.
2. 근대 5장 ~ 현대 6장(16장): 장마다 바꿀 곳 세 가지를 여쭌 뒤 D-30 공통 시스템과 함께 고친다(근대 4장 다음은 k5).
3. 배포 순서: 전체 테스트 → `core/precache.js` CACHE 올림(다음 v68) + `tests/sw.test.js` → 새 파일은 PRECACHE에 → main 병합·push → GitHub Actions 'pages build and deployment' 성공 확인(이 환경에서는 github.io가 막힘) → 승인 있으면 미리보기 아티팩트 다시 올림(`index.html` + PRECACHE 파일 목록을 `files`로).
4. 예전부터: 실제 갤럭시 탭 측정(`docs/tablet-measure-guide.md`), 교과서 대조, 출처 S66~S70 주소 확인, 배경음악 들어 보기, 첫 화면 병사가 버튼 뒤에 겹침, 별점 규칙.
5. 원래부터 실패하는 테스트 3개(고칠 일): arena `k1 doc papers` 위치, carry 다리 걸음(함께 돌 때만), stage3 G2(고려 1장 담판 카메라·해).
6. 참고: optim-jev 플러그인은 이 컨테이너에만 설치됨(작동하려면 선생님이 환경 설정에 `TYPESAFE_API_KEY`와 허용 도메인 `api.typesafe.ai`를 넣어야 함).

## 클라우드에서 일하는 법
- 테스트: `PORT=8300 NODE_PATH=$(npm root -g) timeout 900 node tools/test-node.cjs "j6|content"`(이름 앞부분을 `|`로, 전체는 인자 없이 약 20분).
- 화면: `python3 -m http.server 8150` + Playwright(`--use-angle=swiftshader`), `index.html?debug=<장>-intro|explore|minigame|quiz`, `window.__world`·`window.__ctx`.
- 장 담당 에이전트는 `isolation: worktree`로, 포트를 서로 다르게, 사진·임시 파일은 스크래치패드 안 자기 폴더에. 같은 공용 파일을 동시에 고치지 않게 맡길 때 적어 준다.
- 고친 뒤 `node --check`. 커밋 메시지는 한국어, 끝에 Co-Authored-By·Claude-Session 두 줄.
