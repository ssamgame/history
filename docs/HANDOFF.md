# 인계 문서 (2026-10-29) — 다른 Claude 계정이 이어서 할 때

> 이 파일을 먼저 읽고, 이어서 `CLAUDE.md` → `docs/STATUS.md` 순서로 읽는다. 자세한 결정은 `docs/team/decisions.md`(D-번호), 테스트 기록은 `docs/team/tested.md`.

## 0. 한눈에
- 무엇: 초등 5학년 사회 한국사를 3D로 걸어 다니며 배우는 브라우저 게임 「역사 속으로 걸어가기」. 5편 × 6장 = 30장.
- 저장소: https://github.com/ssamgame/history, **작업 브랜치 `claude/goryeo-game-handoff-vus00f`**(이 브랜치에서 이어서 한다). 학생 사이트는 `main`에서 GitHub Pages로 바로 배포된다(https://ssamgame.github.io/history/).
- 선생님 확인용 미리보기: **https://claude.ai/artifact/Hfhs4Zdmb9WL1Q4dsULYuz** (2026-10-29 새로 만듦). 옛 미리보기 https://claude.ai/artifact/QSh1YhvtwooxoyDRsBZsCT (링크 공유 중이라 다시 올리면 보는 사람 모두에게 바로 바뀐다). **이 아티팩트는 원래 계정 소유이므로 다른 계정에서는 고칠 수 없을 수 있다.** 그때는 선생님께 여쭙고 새 미리보기를 만든다.
- 사용자: 포항 초등 교사. 늘 한국어·쉬운 말. **결정이 필요하면 바로 하지 말고 두세 가지 선택지를 먼저 여쭌다**(추천안을 첫째에).

## 1. 지금 상태 (2026-10-29 마지막)
| 구분 | 상태 |
|---|---|
| 학생 사이트(main) | **goryeo-v67** 배포 완료(GitHub Actions 'pages build and deployment' 성공). 고려 1~6장, 조선 1~6장, 근대 1~3장 새 모습 + D-32 공통(무릎 관절, 도입 장면 끝까지, 먼 산 흔들림 고침) |
| 미리보기 | 작업 브랜치 그대로(판 28, 점검 오류 고침 + 2026-10-31 공통 뼈대 몸 연결 + 김윤후·거란군 겹침·발 묻힘·지도 병사 고침 + 걸음 박자·보폭) + **모든 장 열림(임시)** + **공통 뼈대 몸을 늘 켬**(`core/body.js`의 `bodyOn`이 true를 돌려주고 모델을 `assets/models/body.js`(base64)로 읽는 사본) — 학생 태블릿에서 `?perf=1`로 점검한 뒤 배포 여부를 정함 |
| 작업 브랜치 | v67 + 근대 4장(D-33) + 근대 5장(D-34) + 근대 6장(D-35, 2026-10-29 새 계정). push 완료 |
| 만드는 중인 에이전트 | 없음 |

### 이번에 한 일 (순서대로)
1. 근대 3장(D-31: 고부 마을 문, 죽창·낫 든 농민 모으기, 횃불 밤 행진, 전봉준 따라 황토현~우금치 걷기)을 작업 브랜치에 합침 → 사진 확인 → 선생님 승인으로 **v67 배포**(근대 3장의 새 파일 `chapters/modern/k3/stage.js`를 PRECACHE에 넣음).
2. **근대 4장(D-33)**: 탐험에서 한성 사람들 이야기를 모두 들으면 서재필이 퀘스트 → 탐험 끝 **환구단 즉위식 장면**(고종이 황제 옷으로, 신하들이 절함) → 독립신문 배달(그대로) → 역사책 대신 **종로 만민 공동회**(연설 듣고 시민 5명 말이 맞는지 고르기 judge). 합침, 미리보기에만 올림. 사진 `docs/team/shots/d33-k4-*.png`.
3. 선생님 요청: **미리보기에서만 모든 장 열기(임시)**. 저장소 코드는 그대로이고, 미리보기에 올리는 `chapters/index.js`만 `isUnlocked`가 늘 true인 사본이다(아래 3절).
4. **근대 5장(D-34)**: 거리 사람들 이야기를 모두 들으면 전차 운전수가 퀘스트 → 탐험 끝 **해 질 녘→밤, 가로등·창 전깃불이 켜지는 장면** → 근대 문물 가져다 놓기·전차 몰기(그대로) → 역사책 대신 **문물 체험 걷기**(전신 보내기·전화 걸기·성당 전깃불·학교 교실·양화점). 합침, 테스트 통과. **아직 선생님께 사진을 보내지 않았고 미리보기에도 안 올렸다.** 사진 `docs/team/shots/d34-k5-*.png`(town·night·tram·munmul·school).
5. `tools/book-preview.html` 기본 장을 k5 → i1로(k5에 역사책이 없어져서).

## 2. 바로 다음에 할 일
1. ~~새 미리보기 아티팩트를 이 계정에서 새로 만든다~~ → **끝남**: https://claude.ai/artifact/Hfhs4Zdmb9WL1Q4dsULYuz (`index.html`을 페이지로, PRECACHE 124개 파일을 files로, `chapters/index.js`만 모든 장 열림 사본). 다시 올릴 때는 같은 `file_path`(`index.html`)로 올리면 같은 주소가 유지된다. 원래 지시:(선생님 결정 2026-10-29: 옛 미리보기 QSh1YhvtwooxoyDRsBZsCT는 옛 계정 것이라 더 고치지 않는다). 작업 브랜치 그대로(근대 4·5장 포함) + 모든 장 열림 사본으로, 3절 방법대로 `index.html` + PRECACHE 전체를 `files`로 올린다. 만든 새 주소를 선생님께 알리고 `CLAUDE.md`·`docs/STATUS.md`·이 파일의 미리보기 주소를 바꾼다. 근대 5장 사진 5장은 이미 선생님께 보냈다.
2. 학생 사이트 **v68 배포**는 선생님 승인 때만(근대 4·5장이 아직 학생 사이트에 없다). 배포 순서는 4절.
3. 근대 6장(D-35)은 만듦(사진 `d35-k6-*.png`, 선생님 확인, 미리보기에 올림). 일제 1장(D-36)과 근대 6장 고갯길(D-37·38)도 만들어 미리보기에 올림(v3). 일제 2장(D-39)·3장(D-41)·4장(D-42)·5장(D-44)도 만듦(사진 `d39-i2-*.png`·`d41-i3-*.jpg`·`d42-i4-*.jpg`·`d44-i5-*.jpg`). 일제 6장(D-46, 미리보기 v8)·현대 1장(D-47, 새 놀이 문패 바꿔 달기·첫 한글 수업, 장 틀 `type: 'act'`)도 만듦. 현대 2장(D-48, 새 놀이 투표하기·헌법 완성하기)도 만듦. 현대 3~6장(D-50~D-53)도 선생님 지시(묻지 말고 추천안대로, 기존 놀이와 겹치지 않게)로 만들어 미리보기 v12에 올림. **이제 30장을 모두 새로 만들었다.** 다음은 선생님 확인 뒤 고칠 것, 그리고 D-49 계획(모든 인물 생김새 한꺼번에 바꾸기). 선생님 2026-10-29: 놀이는 다른 장과 겹치지 않는 새 놀이·역사 장면 연출로. 걸으며 겪는 장면은 공용 `chapters/kit/walk.js`(walkStations·stationMarks·classroom·meet·minigameWithMeet)를 쓴다: 장마다 ① 탐험 ② 놀이 ③ (역사책이 있으면) 무엇으로 바꿀지를 선택지 두세 개로 여쭌다 → `docs/team/decisions.md`에 D-35부터 적는다 → 만든다(장 담당 에이전트를 `isolation: worktree`로 맡기면 편하다) → 합치고 테스트 → 사진 → 미리보기.
   - 지금까지 선생님이 고른 방향(본보기): 탐험은 "아무 차례로 모두 들으면 메인 인물이 퀘스트" + 탐험 끝 그 사건다운 장면, 놀이는 기존 놀이 하나는 두고 **역사책은 걸으며 보는 장면/고르기 놀이로 바꿈**.
   - 본보기 코드: `chapters/modern/k3/`, `k4/`, `k5/`와 `tests/k3~k5.test.js`. 공통 도구 안내 `docs/team/d30-guide.md`.

## 3. 미리보기 올리는 법 (모든 장 열림 유지)
- 미리보기는 `index.html`을 페이지로, 나머지는 `files`로 올린다(파일 목록 = `core/precache.js`의 PRECACHE). 바뀐 파일만 `files`에 넣어도 나머지는 그대로 남는다.
- 모든 장 열림 사본 만들기: `chapters/index.js`의 `isUnlocked`에서 `if (!chapter.load) return false;` 바로 다음 줄에 `return true; // 미리보기 전용` 한 줄을 넣은 사본을 스크래치패드에 만들어 `files`의 `chapters/index.js`로 올린다. **저장소에는 넣지 않는다.**
- 선생님이 "닫자"고 하시면 저장소 그대로의 `chapters/index.js`를 올린다.

## 4. 배포 순서 (선생님 승인 때만)
1. 전체 테스트: `PORT=8300 NODE_PATH=$(npm root -g) timeout 1800 node tools/test-node.cjs > 결과.txt` 후 `FAIL|RESULT` 줄만 본다(약 20분). 원래부터 실패하는 2개는 괜찮다: `arena ... k1 doc papers`, `stage3 G2 ... 해가 카메라 뒤쪽`.
2. `core/precache.js`의 `CACHE`를 `goryeo-v68`로, `tests/sw.test.js`도 맞춤. 새 코드 파일이 있으면 PRECACHE에(`git diff --name-only --diff-filter=A origin/main HEAD`로 확인; 근대 4·5장은 새 코드 파일 없음).
3. 커밋(한국어) → `main` 체크아웃 → `git pull origin main` → 작업 브랜치 merge → `git push origin main` → 작업 브랜치로 돌아옴.
4. GitHub MCP `actions_list`(list_workflow_runs)로 'pages build and deployment'가 success인지 확인(이 환경에서는 github.io가 막혀 직접 못 연다).
5. 미리보기 다시 올림(3절).

## 5. 꼭 지킬 것
- 역사 사실은 출처(`src: ['S..']`) 있는 문장만(`core/content.js` 검사기가 막는다). 새 사실을 지어내지 않는다. 내용 원칙은 `CLAUDE.md`.
- main 병합·배포·미리보기 다시 올리기는 선생님 승인 때만.
- 커밋 메시지는 한국어, 끝에 Co-Authored-By 줄(계정이 바뀌면 그 계정 안내를 따른다).
- 고친 파일마다 `node --check`. 새 기능은 테스트 먼저(`tests/<장>.test.js`, `tests/index.html` 목록에 넣기).
- 화면 확인: `python3 -m http.server <포트>` + Playwright(`--use-angle=swiftshader`), 1000×560, `index.html?debug=<장>-intro|explore|minigame|quiz`.
- **얼굴이 보이게(D-45)**: 만세·환호·함께 외치기 장면에서 사람들이 등을 보이면 안 된다. 카메라를 사람들 앞쪽에 두거나 사람들이 카메라를 보게 하고, `facingShare(world, people)`(chapters/kit/walk.js)를 테스트 훅에 남겨 0.8 이상인지 테스트한다. 팔은 앞으로 든다(`rotation.x` 음수). 태극기는 `holdFlag`·`cheerFlag`(chapters/kit/town.js).
- **전투(D-45)**: 총에 맞은 적은 옆으로 쓰러져 잠시 누웠다가 사라진다(피 없음). 공용 `PLAY.ambush`가 그렇게 하고, 장면을 새로 짤 때도 같게 한다.
- 장면 사진: 스크래치패드 `botshot.cjs`(테스트 봇으로 장면 함수를 돌리며 캔버스를 찍는다, `node botshot.cjs <폴더> /chapters/.../chapter.js <함수|ambush> 300 400`). 게임 화면 흐름 대신 이 방법이 빠르고 확실하다.

## 6. 남은 묵은 일 (`docs/STATUS.md` 3절과 같음)
- 실제 갤럭시 탭 측정(`docs/tablet-measure-guide.md`), 교과서 대조, 출처 S66~S70 주소 확인, 배경음악 들어 보기, 별점 규칙.
- 원래부터 실패하는 테스트(arena k1 doc papers 위치, stage3 G2 고려 1장 담판 카메라·해, carry 다리 걸음은 함께 돌 때만).
- `content/sources.md` 다시 만들기(`tools/gen-sources.ps1`/`.cjs`)는 배포 때 한 번에(다른 장 대사까지 많이 바뀌어 있음).
- `.claude/worktrees/` 아래 예전 에이전트 작업 사본이 여럿 남아 있다(모두 합친 것). 새 컨테이너에서는 없을 수 있고, 지워도 된다.
