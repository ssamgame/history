# 자동 점검(시각 오류) 도구

실제 브라우저(헤드리스 크로미움, Playwright)로 게임이나 개발 마당을 띄우고 **화면 속 오류 감지기**를 넣어 돌린다.
사진·감지 기록·콘솔 오류·(원하면) 영상을 장면 이름·시각과 함께 남긴다. 학생 화면 코드는 바꾸지 않는다(감지기는 점검할 때만 페이지에 넣는다).

| 파일 | 하는 일 |
|---|---|
| `probe.js` | 감지기. 실제 장면(`window.__world`)을 매 프레임 읽어 사람·말·든 물건·화면 단추를 살핀다 |
| `run.cjs` | 실행기. 스스로 서버를 띄우고 대상마다 브라우저를 열어 감지기·점검 봇을 넣고 결과를 저장한다 |
| `baseline.cjs` | 기준 화면 비교. 개발 마당을 고정 시계로 돌려 정한 시각의 사진을 기준 사진(`baseline/`)과 견준다 |
| `serve.cjs` | 위 둘이 쓰는 정적 서버 |
| `../../tests/qa-probe.test.js` | 감지기가 일부러 만든 오류를 종류마다 잡고, 멀쩡한 장면은 잡지 않는지 확인(전체 테스트에 들어 있다) |

## 실행

```bash
NODE_PATH=$(npm root -g) node tools/qa/run.cjs --suite motion
```

```bash
NODE_PATH=$(npm root -g) node tools/qa/run.cjs --suite smoke --sec 60
```

```bash
NODE_PATH=$(npm root -g) node tools/qa/run.cjs game:ch4-minigame+bot motion:horse --sec 60 --video
```

```bash
NODE_PATH=$(npm root -g) node tools/qa/baseline.cjs
```

- 대상
  - `motion:<act>`: 개발 마당 `tools/motion-gallery.html?act=<act>`. 동작 한 가지를 처음부터 끝까지(끝나면 멈춘다).
    - act 목록: walk, turn, weapons, carry, handshake, give, escort, strike, talk, chain, horse, rider, row, gait, lineup
  - `game:<debug>`: 실제 게임 `index.html?debug=<debug>`(예: `ch4-minigame`, `j1-quiz`, `k3-explore`). 끝에 `+bot`을 붙이면 점검 봇(`tools/e2e-bot.js`)이 학생처럼 버튼·조이스틱으로 진행한다.
- 묶음: `--suite motion`(동작 11가지), `--suite smoke`(게임 장면 4곳), `--suite all`
- 그 밖
  - `--sec 40`: 대상마다 최대 초
  - `--every 3`: 몇 초마다 사진
  - `--video`: 영상(webm)
  - `--out qa-out`: 결과 폴더(git에 넣지 않는다)
- 결과: `qa-out/<시각>/summary.md`(대상별 표) → 대상 폴더의 `report.md`
  - 감지 표: 시각·장면·무게·종류·누구·위치, 그 순간의 3D 사진 `snaps/`, 페이지 사진 `shots/`
  - 그 밖: `events.json`, `console.json`, `video.webm`
- 기준 화면을 새로 저장하는 것(`baseline.cjs --update`)은 바뀐 화면이 맞다고 사람이 본 뒤에만 한다.

## 감지기가 자동으로 보는 것

| 종류 | 무게 | 뜻 | 판정 |
|---|---|---|---|
| torso | error | 몸통이 비어 투명해 보임(2026-10-30 말 탄 사람 오류) | 가슴 높이 한 점을 덮는 보이는 불투명 조각이 없음(팔 제외) |
| head | error | 머리가 비어 보임 | 머리 자리를 덮는 조각이 없음 |
| seeThrough | error | 사람 조각이 반투명 | 불투명도 < 0.9 |
| rider | error | 기수가 말에서 떨어져 있음 | 말에 붙어 있지 않은데 0.6초 넘게 똑바로 서 있음(화살 맞고 떨어지는 기수는 뺀다) / 안장에서 0.35m 넘게 벗어남 |
| hand | error | 든 물건이 손에서 떨어짐 | 손끝에서 0.6m 넘게, 1초 넘게(어깨·등에 멘 것은 뺀다) |
| nan | error | 위치·각도가 숫자가 아님 | |
| sunk | warn | 발이 땅에 묻힘 | 신발 바닥이 지형·납작한 판보다 0.12m 넘게 아래(탄 사람 제외) |
| overlap / horseOverlap | warn | 사람·말이 서로 겹침 | 사람 0.42m, 말 0.9m 안쪽(크기 비례) |
| glide | warn | 다리를 움직이지 않고 미끄러져 감 | 0.35m/s 넘게 움직이는데 걸음·동작이 0.6초 넘게 없음 |
| jump | warn | 한 프레임에 크게 순간이동 | 한 프레임에 2.5m 넘게, 25m/s 넘게(장면 전환으로 옮긴 것일 수 있다) |
| uiOff / uiCovered | warn | 단추가 화면 밖 / 다른 판에 덮임 | |

warn은 장면 연출일 수도 있다(예: 장이 학생을 새 자리로 옮김). 사진을 보고 사람이 정한다.

## 자동으로 판정하지 않는 것(사람이 사진·영상으로 본다)

- 걸음·달리기의 자연스러움, 악수·건네기의 어색함, 자세·표정
- 발이 땅에 붙어 디디는지(미끄럼의 정도). 걸음 자체는 `tests/motion.test.js`가 숫자로 확인한다
- 조명·그림자·색감, 카메라 구도
- 역사 내용의 정확성

## 문제를 고칠 때의 순서

1. `run.cjs`로 재현한다: 그 장면을 대상으로 하고, 필요하면 `--video`를 붙인다.
2. `report.md`의 감지 표와 `snaps/`(그 순간)·`shots/`(화면 단추 포함) 사진으로 원인 장면을 찾는다.
3. 코드를 최소로 고친다. 가능하면 `tests/`에 같은 조건의 테스트를 먼저 쓴다.
4. 같은 대상으로 `run.cjs`를 다시 돌려 그 감지가 사라졌는지, 사진이 맞는지 본다.
5. 동작을 바꿨다면 `baseline.cjs`로 개발 마당 화면이 어떻게 바뀌었는지(`-diff.png`) 본다.
6. 전체 테스트(`tools/test-node.cjs`)를 돌린다.

## 언제 무엇을 돌리나

`docs/team/test-strategy.md`(A 바뀐 부분 · B 관련 장면 · C 전체, 블렌더 모델 검증). 그리기 횟수 비교는 `drawcalls.cjs`.
