# 역사 속으로 걸어가기 — 작업 안내

> 다른 계정에서 이어받았다면 먼저 `docs/HANDOFF.md`(인수인계, 사용자 규칙·최근 변경·남은 일)를 읽는다.

초등 5학년 사회의 한국사를 3D로 걸어 다니며 배우는 브라우저 게임이다(사이트 이름 「역사 속으로 걸어가기」). 첫 화면 → 편 고르기 → 그 편의 1~6장. 편마다 6장을 한 흐름으로 이어서 한다(장마다 약 10분).

- 고려편 「고려를 지켜라」(외세의 침입과 고려의 노력): 장 id `ch1`~`ch6`, 폴더 `chapters/ch1`~`ch6`, 결과 카드 `SESSIONS[1]`.
- 조선편 「조선을 걷다」(조선의 건국과 발전): 장 id `j1`~`j6`, 폴더 `chapters/joseon/j1`~`j6`, 결과 카드 `SESSIONS[2]`. 설계는 `docs/superpowers/specs/2026-10-22-joseon-course-design.md`.
- 근대편 「새 나라를 꿈꾸다」(session 3, `k1`~`k6`, `chapters/modern/`), 일제 강점기편 「빼앗긴 나라를 되찾아라」(session 4, `i1`~`i6`, `chapters/colonial/`), 현대편 「대한민국을 세우다」(session 5, `h1`~`h6`, `chapters/present/`). 사실은 교사의 비상 5-2 교과서 98~145쪽(S51)을 따르고, 현대편 6장(4·19~서울 올림픽)은 교과서 밖이라 S58~S61을 따른다. 설계는 `docs/superpowers/specs/2026-10-23-modern-courses-design.md`.
- 이 세 편은 장 부품 상자 `chapters/kit/`로 만든다: `town.js`의 `buildTown(world, layout)`(배치표로 건물·사람·안내판), `chapter.js`의 `makeKitChapter({ id, mood, player, script, layout, order, parts, spot })`. 장마다 `script.js`(대사·미니게임·퀴즈)와 `chapter.js`(배치표)만 쓴다. 미니게임은 장면 속 상황 놀이(`chapters/kit/play.js`): drive(배·차·전차 몰기, 행진, 걸어서 이정표 따라가기 `showAll`·`post`·`look`, 건네받아 들고 다니기 `give`/`hand`, 정류장에서 손님이 타고 내리기 `alight`·`board`), stops(차례대로 찾아가기), deliver(가져다 놓기), find(찾기), ambush(매복), sneak(몰래 지나가기), collect(빛나는 곳), judge(사람 말을 듣고 맞는지 고르기), build(터에 짓기). 읽기 부분: book(역사책 넘기기, 쪽마다 3D 재현 그림 `chapters/kit/diorama.js`+설계 `chapters/modern/dioramas.js`, 못 찍으면 평면 그림 `chapters/modern/pictures.js`), doc(문서 보기), scene(짧은 장면 `play(ctx, scene)`) — 읽기·장면은 첫 시도 점수에 넣지 않는다. 남은 시간은 화면 위 가운데에 크게 보인다. 마을과 떨어진 무대(arena, x 400)를 따로 세우고 끝나면 치운다. 바닥 지도는 `mapSpot`. 카드 놀이(choose·sort·place·order·gauge)는 남아 있지만 새 장에는 쓰지 않는다(2026-10-23 사용자: 카드는 단조롭다). 근대 5장부터 현대 6장까지는 find·stops(찾기·차례 찾아가기)도 쓰지 않고 역사책·문서·이정표 걷기로 본다(2026-10-24 선생님 의견, 테스트가 막음). 고려·조선편의 순서·고르기 카드도 같은 부품으로 바꿨다(그림 읽기·도읍 고르기·학익진 배치판만 남김).

- 저장소: https://github.com/ssamgame/history (조직 `ssamgame`, 브랜치 `main`) — 2026-10-23에 goryeo에서 history로 이름을 바꿨다(옛 주소 ssamgame.github.io/goryeo/는 열리지 않음)
- 학생 주소: https://ssamgame.github.io/history/ (GitHub Pages, main에서 바로 배포)
- 미리보기: https://claude.ai/artifact/QSh1YhvtwooxoyDRsBZsCT (링크 공유 중, 다시 올리면 모두에게 바뀐다)
- 사용자는 초등 교사다. 답은 늘 한국어로, 쉬운 말로 한다.

## 기술 구성

- 빌드 없는 정적 ES 모듈 사이트. Three.js r160(`vendor/three.module.min.js`, import map). 외부 서버·소리 파일·그림 파일 없음.
- 기기: 갤럭시 탭 S6 Lite, 크롬북. 가로 화면. 키보드와 터치 모두 된다.
- 모든 3D 모양은 코드로 만든다(로우폴리). 표면 무늬는 캔버스로 그린다(`core/textures.js`, 위치 기준 매핑, `mat(color)`가 색으로 무늬를 자동 선택).
- 장 모듈 형식: `{ id, mood, player?, script, quizzes, buildScene(world), enterStage(ctx, stage), explore(ctx), minigame(ctx) }`. `player`는 그 장의 학생 생김새(없으면 고려 병사). `core/flow.js`의 `runChapter`가 해설 → 탐험 → 미니게임 → 퀴즈 순으로 돌리고 단계마다 저장한다.
- 주요 파일
  - `core/world.js` 렌더러·분위기·카메라(따라가기·대화·고정 맞춤)·해와 그림자
  - `core/people.js` 인물(만화풍 얼굴, 무기), `content/characters.js` 생김새
  - `core/props.js` 풀·꽃·바위·덤불·소나무 흩뿌리기(InstancedMesh, 화질에 따라 개수 조절)
  - `core/minigame.js` 미니게임 도구, `core/dialogue.js` 대화창, `core/screens.js` 화면들
  - `core/music.js` 장별 배경음악(Web Audio로 연주), `core/audio.js` 효과음
  - `core/quality.js` 화질 3단계와 자동 하향, `core/save.js` 저장(기기 안 localStorage만)
  - `chapters/chN/` 장별 `script.js`(대사·퀴즈·출처) `scene.js`(장면) `chapter.js`(진행)
  - `chapters/index.js` 편 목록(`COURSES`), 장 목록, 열림·완료 규칙(같은 편 안에서만 센다)
  - `chapters/kit/buildings.js` 건물·소품 모양(한옥: 기단·기둥·툇마루·창살·처마가 들린 곡선 기와지붕/초가, 서양 건물, 나무, 돌담, 장독대·수레·짚더미·장작·가로등). 한 건물의 조각을 재질별로 합쳐 그리기 횟수를 줄인다. `curvedHipRoof`는 고려·조선편 장면의 기와지붕도 맡는다.
  - 시대별 부품(2026-10-24 전면 개선): `shop`(한옥 가게·1910~30년대 2층 상점, 간판 `sign`), `lanehouse`(상하이 석고문), `concrete`(1950~80년대 시멘트 건물, 세로 간판), `barracks`(막사), `stall`(노점), `bridge`, `boat`(나룻배), `paddy`(논), `terrace`(축대, 위에 놓는 부품은 `y`), 진영 소품 `watchtower`(망루)·`spearRack`(창걸이)·`archeryTarget`(과녁), 나무 `kind`(pine·willow·bare·poplar), 배치표 `skyline`(먼 도시 실루엣 hanok·brick·concrete). 모든 미니게임 무대에도 언덕 소나무·바위·풀포기가 깔린다. 부품은 `tools/kit-gallery.html`로 한 마당에 늘어놓고 본다.
  - `core/bake.js` 장면 굳히기: `runChapter`가 장면을 지은 뒤 움직이지 않는 조각을 재질별로 합친다(그리기 수 절반 안팎). 장면이 돌려준 물건·사람·안내판·잠깐 돌려 보아 움직인 것은 그대로 둔다. 장 코드가 장면 조각을 나중에 이름으로 찾거나 바꾸려면 buildScene이 돌려주는 객체에 넣어야 한다(아니면 합쳐진다). 끄려면 장 모듈에 `bake: false`.
  - `chapters/kit/terrain.js` 땅: 걷는 곳(bounds+여유)은 높이 0으로 평평하게 두고(이동·충돌·미니게임이 그대로) 바깥은 언덕, 멀리 산줄기. 마을·미니게임 무대와 조선 2·3·6장(`sceneGround`)이 쓴다.
  - `core/notebook.js` 역사 수첩: 대화창에 나온 출처 있는 문장(`src`)을 살펴본 곳(안내판)·만난 사람·사건 해설로, 퀴즈는 정답·해설과 함께 모은다(`save.notes(id)`). 메뉴와 장 결과 카드의 '역사 수첩'으로 본다. 탐험 중 안내판 가까이 가면 '새 장소 발견', 화면 위에 '살펴본 안내판 a / b', 목표 옆에 '2/6'(script.goals 차례).
  - 대사 표시: 사람의 말에는 '꾸민 대사', 실제 기록에 남은 말은 대사에 `quote: true`를 달면 '기록에 남은 말'로 보인다.
  - `core/signs.js` 안내판(볼거리) 모양, `world.addSpot`으로 세우면 인물처럼 다가가 읽는다(파란 i 표시). 대사는 `script.npc[id].always`. 읽지 않아도 장이 끝난다(어려워지지 않게).
  - `chapters/joseon/landmarks.js` 유물·유적 모형(앙부일구, 자격루, 측우기, 종묘 정전, 근정전, 장안문)
  - `chapters/joseon/common.js` 조선편 진행 도구(차례대로 말 걸기 `talkInOrder`, 다시 하기 `tryPart`, 때 맞춰 누르기 `timingPress`)
  - `core/minigame.js` 카드 고르기 `chooseCards`(그림 가능), 카드 나누기 `sortCards`, 자리 놓기 `placeOnBoard`, 순서 맞추기 `orderCards`, 획 따라 그리기 `traceGlyph`
  - `content/sources.js` 출처 S1~S22(고려편)·S23~S50(조선편)·S51~S62(근대~현대편), `content/glyphs.js` 5장 大藏經 획 자료(`tools/gen-glyphs.ps1`로 생성, 손으로 고치지 않음)

## 실행과 테스트

- 개발 서버: `.claude/launch.json`의 `goryeo-game`(포트 8130). 장면 확인은 `?debug=ch3-scene`, 탐험부터는 `?debug=ch3-explore`, 미니게임부터는 `?debug=ch3-minigame`, 퀴즈부터는 `?debug=ch3-quiz`(조선편은 `?debug=j3-scene`, 근대·일제 강점기·현대편은 `k3`·`i3`·`h3`).
- 개발용: `?debug=h3-minigame&part=1` 처럼 미니게임의 몇 번째 부분부터 볼 수 있다. 근대~현대편 카드형 미니게임은 `tools/minigame-gallery.html?part=h3:0`(&fill=1이면 자리 놓기를 채운 모습)으로 장면 없이 띄워 본다. `tests/layout.test.js`가 모든 화면 크기에서 버튼이 화면 안에 있고 손가락으로 누를 수 있는지(다른 판에 덮이지 않는지) 검사하고, 테스트 봇(`tests/bot.js`)도 누르기 전에 같은 검사를 한다.
- 테스트: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/test.ps1 -Port 8141` (헤드리스 Edge, 자체 하네스 `tests/harness.js`). 포트 8123은 막혀 있어 8141을 쓴다. 출력이 길면 파일로 받아 `FAIL|RESULT` 줄만 본다.
- 새 기능과 버그 수정은 테스트를 먼저 쓰고 실패를 본 뒤 고친다. 새 테스트 파일은 `tests/index.html`의 목록에 넣는다.
- 화면에 보이는 변경은 브라우저 창에서 직접 확인한다(1000×560 정도로 탭 크기 흉내).

## 고친 뒤 올리는 순서 (매번)

1. 작업 브랜치에서 고치고 전체 테스트 통과를 확인한다.
2. `core/precache.js`의 `CACHE`(goryeo-vN)를 하나 올리고 `tests/sw.test.js`도 맞춘다. 새 파일은 `PRECACHE`에 넣는다.
3. 커밋(메시지는 한국어) → main에 병합 → `git push origin main`.
4. https://ssamgame.github.io/history/core/precache.js 에 새 판 번호가 뜰 때까지 확인한다(1~2분).
5. 바뀐 파일을 스크래치패드의 `goryeo-dist` 복사본에 넣고 미리보기 아티팩트를 다시 올린다(없으면 저장소 내용으로 새로 만든다).

## 내용 원칙 (매우 중요)

- 역사 사실이 틀리면 매우 위험하다. 다만 모든 것을 한 백과사전 고증에 맞출 필요는 없다: 여러 자료에서 확인되는 사실은 그대로 쓰고 그중 하나를 출처로 단다(2026-10-23 사용자 기준). 실제로 학설이 갈리는 것(측우기 발명자 등)만 조심한다. 모든 해설·퀴즈 문장은 백과사전(한국민족문화대백과사전, 우리역사넷 등)으로 확인하고 `src: ['S..']`를 단다. 출처 없는 사실 주장은 넣지 않는다(검사기 `core/content.js`가 막는다). 새 출처는 `content/sources.js`와 설계 문서 표에 넣고 `tools/gen-sources.ps1`로 `content/sources.md`를 다시 만든다.
- 교과서는 비상 2022 개정 5학년 사회를 따른다.
- 표현: "서희 장군"이 아니라 "서희". "사귀다" 대신 "친하게 지내다". 1장 선택지는 "고려는 고구려를 이은 나라이다.", "여진이 길을 막고 있어서 거란과 교류를 할 수 없다."를 그대로 쓴다.
- 4장 저고여 사건은 "누가 죽였는지는 밝혀지지 않았어요"를 꼭 유지한다.
- 획 수 같은 아주 세세한 부분은 고치자고 하지 않는다(藏 17획 그대로).
- 인물 표정은 모두 근엄하게.

## 정한 것과 뺀 것

- 1·2차시를 합쳐 한 흐름. 결과 카드는 편마다 6장 뒤 한 장(핵심 정리 6줄).
- 조선편 원칙: 측우기는 장영실 발명이라고 쓰지 않는다(세자가 제안, 세종 때 만듦). 한산도 대첩에서 거북선을 앞세웠다(S43). 척화·주화는 옳고 그름을 매기지 않는다. 훈민정음은 1443 창제·1446 반포를 나눠 쓴다. 전투는 불길 없이 연기·물러남으로.
- 뺀 것: 교사용 안내 페이지, QR코드 버튼, 대사 읽어 주기(음성). 다시 넣지 않는다.
- 그래픽은 태블릿 성능 안에서 단계적으로 강화한다. 무거운 효과는 화질 '보통·높음'에서만. 2026-10-23: 학생 태블릿에서 충분히 돌아가서 보통(1.25배 선명, 부드러운 그림자, 풀·나무 0.9)과 높음(1.75배, 그림자 4096, 1.3)을 올렸다.

## 아직 남은 일

- 전면 개선(2026-10-24, 추적표 `docs/superpowers/specs/2026-10-24-overhaul-tracker.md`): 근대~현대 18장은 마을 재설계·대사까지 끝, 고려·조선 12장도 장면 안 건물·소품 재설계까지 끝(2026-10-24, goryeo-v57·v58). 미니게임 무대는 공통 자연 꾸미기만 했고 무대별 재설계는 남음.

- 조선편: 교사의 교과서 대조(비상 교과서의 조선 단원 순서·범위), 실제 탭에서 1~6장 시간과 프레임 재기.
- 근대·일제 강점기·현대편: 실제 탭에서 시간과 프레임 재기, 교사의 플레이 의견 반영.
- 실제 갤럭시 탭에서 프레임 확인(그래픽 강화 뒤), 1~6장 전체 시간 재기, 교사의 교과서 대조.
- 배경음악은 소리를 직접 들어 보지 못했다(크기만 측정). 사용자 의견에 따라 장별 조정.
- 첫 화면의 3D 병사가 버튼 뒤에 겹쳐 보인다(사용자에게 제안만 함).
- 작은 미완: 별점에 첫 시도 점수 미사용(별점 규칙은 선생님께 여쭤본 뒤 정한다). (2026-10-24: 2장 구출 뒤 들판에 멈춘 포로를 치웠고, 이어하기 ch4·ch5 테스트를 넣었다.)
