# 3단계 진행표 (2026-10-25 선생님 허락: 100건 모두, 셋 동시에)

선생님 답: '기록에 남은 말' 표시 그대로 / 대사 길이 지금 정도 / 대사·그래픽·역사책 동시에 / 목록 모두 진행.
고칠 목록: `2026-10-25-stage3-plan.md` (대사 D1~D53, 역사책 B1~B30, 그래픽 G1~G17). 사실 확인: `2026-10-25-stage3-review.md`.
규칙: main 병합·배포·미리보기 아티팩트 다시 올리기 금지. 그림자·선명도·모델 수·역사책 그림 찍는 방식 그대로. 커밋은 작업 브랜치에만.

## 팀원과 맡은 파일
- 검토: `docs/superpowers/specs/2026-10-25-stage3-review.md`만 씀(읽기 전용 검토).
- 개발: 30개 장 `script.js`, `content/sources.js`·`content/sources.md`, `tests/`(stage3-gfx 제외), `core/precache.js`.
- 디자인: `chapters/modern/dioramas.js`·`pictures.js`, `chapters/kit/*.js`, `core/world.js`, `content/characters.js`, 장마다 `chapter.js`·`scene.js`, `tests/stage3-gfx.test.js`.

## 상태 (팀원이 끝낼 때마다 고침)
- [x] 검토: 사실 항목 판정 (47건: 진행 30, 고쳐서 17, 1bb215b)
- [ ] 개발: 대사(사실 아닌 것)
- [ ] 개발: 대사·역사책 글(사실, 검토 뒤)
- [ ] 개발: 성능 측정 테스트 시간 초과 원인
- [ ] 디자인: 역사책 그림 B
- [ ] 디자인: 그래픽 G
- [ ] 마지막: 전체 테스트, 캐시 번호, 인수인계 문서, 보고
