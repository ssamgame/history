# 테스트 실행 전략 (2026-10-31 선생님 지시)

매 수정마다 40분 안팎의 전체 테스트를 돌리지 않는다. **바뀐 범위와 위험도에 따라 필요한 단계만** 돌린다.
검사 항목이나 통과 기준은 시간을 줄이려고 낮추지 않는다. 실제로 돌리지 않은 테스트는 통과했다고 보고하지 않는다(보고에 "돌린 것 / 안 돌린 것"을 나눠 적는다).
돌린 결과와 찾은 오류·고친 결과는 `docs/team/tested.md`에 적는다. 이미 통과한 테스트는 관련 코드가 바뀌었을 때만 다시 돌린다.

## A. 바뀐 부분 집중 테스트 (몇 분)

고친 모델·움직임·기능만 빠르게 본다.

| 바꾼 것 | 돌리는 것 |
|---|---|
| 한 장의 대본·진행 | `node tools/test-node.cjs "<장 id>"` (예: `"ch4"`) |
| 움직임 코드(core/motion.js·interact.js·horse.js) | `node tools/test-node.cjs "motion"` + `"horse:"` + `node tools/qa/run.cjs --suite motion` |
| 블렌더 몸(tools/blender/person.py·core/rigged.js) | 아래 "블렌더 모델 검증" |
| 점검 도구(tools/qa) | `node tools/test-node.cjs "qa probe"` |

### 블렌더 모델 검증 (모델을 고칠 때마다, 전체 테스트 대신)

1. 모델을 만든다: `bl/bin/python tools/blender/person.py assets/models/person.glb && python3 tools/blender/glb2js.py assets/models/person.glb assets/models/person.js` — 출력의 삼각형 수와 파일 크기를 기록한다.
2. `node tools/test-node.cjs "rig: "` (약 2분): 뼈대 몸이 들어가는지, 관절·머리·무기 유지, 뼈가 관절을 따라가는지(각도), 말 탄 사람, 감지기에 몸통·머리 빔 없음, 시험 켠 고려 1장 끝까지.
3. 시험 장면에서 눈으로 + 감지기로: `node tools/qa/run.cjs "motion:rig&looks=seohui,khitan,soldier" --sec 60 --video`
   - 신체 투명·일부 사라짐(감지기 torso·head·seeThrough), 재질·조명(사진), 관절 이음새·애니메이션 중 비정상 변형(사진·영상), 지형 관통(감지기 sunk)
4. 성능·용량: `node tools/qa/drawcalls.cjs ch1-explore ch4-explore` (그리기 횟수·삼각형, 시험 켬/끔 비교)와 `assets/models/person.js` 크기.

## B. 관련 장면 테스트 (10~20분)

바뀐 것이 실제로 나오는 장면에서 본다. 퀘스트 진행·NPC 대화·이동이 그대로 되는지 확인한다.

- 그 장: `node tools/qa/run.cjs "game:<장>-explore+bot" --sec 180` (블렌더 몸 시험이면 `"game:<장>-explore&rig=1+bot"`)
- 공통 모델·움직임을 바꿨다면 다른 시대의 대표 장면도: `ch4-minigame`(기마병·성벽), `j1-quiz`(궁궐·왕), `k3-explore`(군중·횃불), `i4-explore`(매복), `h1-explore`(만세 군중) — 각 120초
- 관련 장의 단위 테스트: `node tools/test-node.cjs "<장 id>"`

## C. 전체 테스트 (약 15~40분)

다음일 때만 돌린다.

- 공통 모델 생성·애니메이션 시스템을 바꿨을 때(core/people.js·motion.js·rigged.js의 구조)
- 모델 불러오기·그리기 구조를 바꿨을 때(core/world.js·bake.js·flow.js)
- 여러 시대에 걸친 큰 수정
- 퀘스트 진행·장면 전환 시스템을 바꿨을 때
- 배포(main) 직전 최종 확인 — 이때는 편마다 자동 플레이(`run.cjs game:<편 첫 장>-intro+bot --sec 2400`)도 돌린다

돌리는 것: `PORT=8180 NODE_PATH=$(npm root -g) node tools/test-node.cjs` (+ 필요하면 편별 자동 플레이)

## 알려진 실패(새로 깨진 것과 구분)

- `arena: … k1 doc papers(0,-8.5)` · `stage3 G2: ch1 담판 카메라…해가 카메라 뒤쪽` — 2026-10-29부터 계속 실패(남은 일). 전체 테스트에서 이 둘만 실패하면 새로 깨진 것은 없다.
