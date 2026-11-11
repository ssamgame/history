// 진행 상황 저장. 기기 안(localStorage)에만 두고 밖으로 보내지 않는다.
const KEY = 'goryeo-game:v1';
const empty = () => ({ name: '', chapters: {}, current: null, course: null, avatar: null }); // avatar: 내 캐릭터(content/avatar.js) // course: 마지막으로 고른 편(goryeo·joseon)

// ★★★ 퀴즈 2개 정답 + 쉬운 모드 안 씀 + 미니게임 절반 이상 첫 시도 성공, ★★☆ 퀴즈 1개 이상 또는 미니게임을 잘함, ★☆☆ 완료
export function computeStars({ quizCorrect, easyModeUsed, firstTryCorrect = 0, firstTryTotal = 0 }) {
  const playWell = firstTryTotal === 0 || firstTryCorrect * 2 >= firstTryTotal;
  if (quizCorrect >= 2 && !easyModeUsed && playWell) return 3;
  if (quizCorrect >= 1 || (firstTryTotal > 0 && playWell)) return 2;
  return 1;
}

export function createSave(storage) {
  const save = {
    data: empty(),
    load() {
      const d = storage.get(KEY);
      const valid = d && typeof d === 'object' && typeof d.name === 'string' && d.chapters && typeof d.chapters === 'object';
      // 편이 생기기 전의 옛 기록: 고려편 장을 하나라도 했으면 고려편으로 본다(이어하기가 고려편 지도로 바로 간다)
      const oldGoryeo = valid && (Object.keys(d.chapters).some(id => /^ch\d$/.test(id)) || /^ch\d$/.test(d.current?.id || ''));
      save.data = valid ? { name: d.name, chapters: d.chapters, current: d.current || null, avatar: d.avatar && typeof d.avatar === 'object' ? d.avatar : null, course: typeof d.course === 'string' ? d.course : oldGoryeo ? 'goryeo' : null, reviews: d.reviews && typeof d.reviews === 'object' ? d.reviews : {}, ...(Array.isArray(d.tmOff) ? { tmOff: d.tmOff } : {}), ...(d.letters && typeof d.letters === 'object' ? { letters: d.letters } : {}), ...(d.lettersRead && typeof d.lettersRead === 'object' ? { lettersRead: d.lettersRead } : {}) } : empty(); // 옛 기록의 역사 수첩(notes)은 버린다(D-9)
      return save.data;
    },
    persist() { return storage.set(KEY, save.data); },
    reset() { save.data = empty(); storage.remove(KEY); },
    // 진행 코드로 되살리기(core/progress-code.js): 지금 기록을 통째로 바꾼다
    restore(d, name = '') { save.data = { ...empty(), reviews: {}, ...d, name, current: null }; save.persist(); },
    setName(name) { save.data.name = name; save.persist(); },
    setAvatar(a) { save.data.avatar = a; save.persist(); },
    setCourse(id) { save.data.course = id; save.persist(); },
    startChapter(id) { save.checkpoint(id, 'intro'); },
    // carry: 다음 단계로 넘겨 줄 점수(예: 미니게임에서 쉬운 모드를 썼는지). 이어하기 때 되살린다.
    checkpoint(id, stage, carry) { save.data.current = carry ? { id, stage, carry } : { id, stage }; save.persist(); },
    finishChapter(id, result) {
      save.data.chapters[id] = result;
      save.data.current = null;
      save.persist();
    },
    chapterResult(id) { return save.data.chapters[id] || null; },
    // 타임머신에서 떼어 둔 부품 번호(content/growth.js TM_STAGES의 차례): 붙였다 뗐다 할 수 있다
    setTmOff(list) { save.data.tmOff = [...list]; save.persist(); },
    // 받은 편지(content/growth.js LETTERS): 복습 퀴즈 앞에서 받는다. 예전 기록은 마친 장이면 받은 것으로 본다
    addLetter(id) { (save.data.letters ||= {})[id] = true; save.persist(); },
    // 편지함에서 펼쳐 읽은 편지(2026-11-11 선생님: 안 읽은 편지는 느낌표와 숫자로 알린다)
    readLetter(id) { if ((save.data.lettersRead ||= {})[id]) return; save.data.lettersRead[id] = true; save.persist(); },
    unreadLetters(ids) { return ids.filter(id => save.hasLetter(id) && !(save.data.lettersRead || {})[id]).length; },
    hasLetter(id) { return !!((save.data.letters || {})[id] || save.data.chapters[id]); },
    // 편 복습 퀴즈 결과(D-21): { correct, total }
    setReview(session, r) { (save.data.reviews ||= {})[session] = r; save.persist(); },
    review(session) { return (save.data.reviews || {})[session] || null; },
    // 메뉴에서 장 선택으로 나갈 때: 하던 장을 버려서 다음에는 지도부터 보이게 한다
    abandonCurrent() { save.data.current = null; save.persist(); },
  };
  return save;
}
