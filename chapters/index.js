// 고려편 6개 장. load가 null인 장은 지도에 "준비 중"으로 보인다.
export const CHAPTERS = [
  { id: 'ch1', no: 1, session: 1, title: '서희의 외교 담판', years: '993', event: '거란 1차 침입', place: '고려 서북쪽 국경', mapXY: [33, 27], load: () => import('./ch1/chapter.js') },
  { id: 'ch2', no: 2, session: 1, title: '양규와 흥화진', years: '1010', event: '거란 2차 침입', place: '흥화진', mapXY: [20, 17], load: () => import('./ch2/chapter.js') },
  { id: 'ch3', no: 3, session: 1, title: '강감찬과 귀주 대첩', years: '1018~1019', event: '거란 3차 침입', place: '귀주', mapXY: [28, 21], load: () => import('./ch3/chapter.js') },
  { id: 'ch4', no: 4, session: 1, title: '강화도 천도와 처인성·충주성', years: '1231~1253', event: '몽골 침입', place: '강화도', mapXY: [33, 55], load: () => import('./ch4/chapter.js') },
  { id: 'ch5', no: 5, session: 1, title: '팔만대장경', years: '1236~1251', event: '몽골 침입', place: '합천 해인사', mapXY: [62, 78], load: () => import('./ch5/chapter.js') },
  { id: 'ch6', no: 6, session: 1, title: '삼별초의 항쟁', years: '1270~1273', event: '몽골에 맞선 항쟁', place: '진도·제주', mapXY: [32, 85], load: () => import('./ch6/chapter.js') },
];

// 조선편 6개 장 (조선편 설계 문서). 장을 완성하면 load를 채운다. 일어난 차례대로: 과학 기구(1434~) 다음에 훈민정음(1443~)
export const JOSEON = [
  { id: 'j1', no: 1, session: 2, title: '위화도 회군과 조선 건국', years: '1388~1394', event: '새 나라 조선', place: '위화도·한양', mapXY: [20, 20], load: () => import('./joseon/j1/chapter.js') },
  { id: 'j3', no: 2, session: 2, title: '세종 때의 과학 기술', years: '1434~1442', event: '시간과 비를 재다', place: '한양', mapXY: [45, 49], load: () => import('./joseon/j3/chapter.js') },
  { id: 'j2', no: 3, session: 2, title: '세종과 훈민정음', years: '1443~1446', event: '우리 글자', place: '한양 경복궁', mapXY: [35, 51], load: () => import('./joseon/j2/chapter.js') },
  { id: 'j4', no: 4, session: 2, title: '임진왜란과 한산도 대첩', years: '1592', event: '일본의 침입', place: '한산도 앞바다', mapXY: [60, 88], load: () => import('./joseon/j4/chapter.js') },
  { id: 'j5', no: 5, session: 2, title: '병자호란과 남한산성', years: '1636~1637', event: '청의 침입', place: '남한산성', mapXY: [50, 58], load: () => import('./joseon/j5/chapter.js') },
  { id: 'j6', no: 6, session: 2, title: '영조·정조와 수원 화성', years: '1742~1796', event: '탕평과 화성', place: '수원', mapXY: [39, 62], load: () => import('./joseon/j6/chapter.js') },
];

// 근대편·일제 강점기편·현대편 (비상 5-2 교과서 98~145쪽, 2026-10-23)
const L = (course, id) => () => import(`./${course}/${id}/chapter.js`);
export const MODERN = [
  { id: 'k1', no: 1, session: 3, title: '흥선 대원군과 강화도 조약', years: '1863~1876', event: '문을 연 조선', place: '강화도', mapXY: [33, 54], load: L('modern', 'k1') },
  { id: 'k2', no: 2, session: 3, title: '갑신정변', years: '1884', event: '개화를 위한 노력', place: '한성 우정총국', mapXY: [41, 52], load: L('modern', 'k2') },
  { id: 'k3', no: 3, session: 3, title: '동학 농민 운동과 갑오개혁', years: '1894', event: '농민들이 일어서다', place: '전라도 고부', mapXY: [37, 74], load: L('modern', 'k3') },
  { id: 'k4', no: 4, session: 3, title: '독립 협회와 대한 제국', years: '1896~1897', event: '자주독립을 외치다', place: '한성 독립문', mapXY: [45, 49], load: L('modern', 'k4') },
  { id: 'k5', no: 5, session: 3, title: '근대 문물과 달라진 생활', years: '1880~1900년대', event: '전차가 달리다', place: '한성 거리', mapXY: [36, 56], load: L('modern', 'k5') },
  { id: 'k6', no: 6, session: 3, title: '을사늑약과 나라를 지키려는 노력', years: '1905~1909', event: '의병과 애국 계몽 운동', place: '한성·전국', mapXY: [50, 60], load: L('modern', 'k6') },
];
export const COLONIAL = [
  { id: 'i1', no: 1, session: 4, title: '일제의 식민 통치', years: '1910~1945', event: '나라를 빼앗기다', place: '항구와 마을', mapXY: [62, 82], load: L('colonial', 'i1') },
  { id: 'i2', no: 2, session: 4, title: '3·1 운동', years: '1919', event: '대한 독립 만세', place: '서울 탑골 공원', mapXY: [41, 52], load: L('colonial', 'i2') },
  { id: 'i3', no: 3, session: 4, title: '대한민국 임시 정부', years: '1919', event: '민주 공화제 정부', place: '중국 상하이', mapXY: [8, 70], load: L('colonial', 'i3') },
  { id: 'i4', no: 4, session: 4, title: '봉오동 전투와 청산리 대첩', years: '1920', event: '독립군의 승리', place: '만주', mapXY: [70, 8], load: L('colonial', 'i4') },
  { id: 'i5', no: 5, session: 4, title: '민족 문화를 지킨 사람들', years: '1920~1940년대', event: '우리말과 역사 지키기', place: '서울·광주', mapXY: [36, 76], load: L('colonial', 'i5') },
  { id: 'i6', no: 6, session: 4, title: '한인 애국단과 한국광복군', years: '1931~1945', event: '광복을 향해', place: '중국 충칭', mapXY: [10, 40], load: L('colonial', 'i6') },
];
export const PRESENT = [
  { id: 'h1', no: 1, session: 5, title: '8·15 광복', years: '1945', event: '되찾은 나라', place: '서울', mapXY: [41, 52], load: L('present', 'h1') },
  { id: 'h2', no: 2, session: 5, title: '대한민국 정부 수립', years: '1945~1948', event: '5·10 총선거', place: '서울', mapXY: [45, 55], load: L('present', 'h2') },
  { id: 'h3', no: 3, session: 5, title: '6·25 전쟁', years: '1950', event: '전쟁이 일어나다', place: '낙동강·인천', mapXY: [58, 72], load: L('present', 'h3') },
  { id: 'h4', no: 4, session: 5, title: '1·4 후퇴와 정전 협정', years: '1951~1953', event: '휴전선이 그어지다', place: '판문점', mapXY: [38, 46], load: L('present', 'h4') },
  { id: 'h5', no: 5, session: 5, title: '전쟁 뒤의 삶', years: '1953~', event: '다시 일어서다', place: '부산 피란민 마을', mapXY: [64, 86], load: L('present', 'h5') },
  { id: 'h6', no: 6, session: 5, title: '민주주의와 경제 성장', years: '1960~1988', event: '함께 이룬 대한민국', place: '서울', mapXY: [44, 51], load: L('present', 'h6') },
];

export const ALL_CHAPTERS = [...CHAPTERS, ...JOSEON, ...MODERN, ...COLONIAL, ...PRESENT];

// 결과 카드의 핵심 정리 (편마다 장마다 한 줄). 한 편의 1~6장을 한 번에 이어서 한다.
export const SESSIONS = {
  1: {
    title: '외세의 침입과 고려의 노력',
    points: [
      '서희는 담판으로 강동 6주를 얻었다',
      '양규는 흥화진을 지키고 백성을 구했다',
      '강감찬은 귀주 대첩에서 거란군을 크게 물리쳤다',
      '고려는 강화도로 도읍을 옮겨 몽골에 맞섰고, 김윤후와 백성들은 처인성과 충주성을 지켰다',
      '고려 사람들은 부처의 힘으로 나라를 지키려고 팔만대장경을 만들었다',
      '삼별초는 진도와 제주에서 끝까지 싸웠다',
    ],
  },
  2: {
    title: '조선의 건국과 발전',
    points: [
      '이성계는 위화도에서 군사를 돌리고 조선을 세워 한양으로 도읍을 옮겼다',
      '세종 때 앙부일구·자격루·측우기 같은 과학 기구를 만들었다',
      '세종은 백성을 위해 훈민정음을 만들었다',
      '이순신은 한산도 대첩에서 학익진으로 일본 수군을 물리쳤고, 각지에서 의병이 일어났다',
      '병자호란 때 인조는 남한산성에서 버티다 삼전도에서 항복했다',
      '영조와 정조는 탕평책을 펼쳤고, 정조는 거중기를 써서 수원 화성을 쌓았다',
    ],
  },
  3: {
    title: '근대 국가를 세우려는 노력',
    points: [
      '조선은 강화도 조약(1876)으로 문을 열었지만 불리한 조약이었다',
      '김옥균 등 개화 세력은 갑신정변(1884)을 일으켰지만 3일 만에 끝났다',
      '전봉준이 이끈 동학 농민 운동(1894) 뒤 갑오개혁으로 신분제가 없어졌다',
      '독립 협회는 독립신문과 독립문으로 자주독립을 외쳤고, 고종은 대한 제국(1897)을 세웠다',
      '전신·전화·전등·전차 같은 근대 문물로 생활 모습이 달라졌다',
      '을사늑약(1905)에 맞서 의병 운동과 애국 계몽 운동이 일어났다',
    ],
  },
  4: {
    title: '일제의 식민 통치와 우리 민족의 저항',
    points: [
      '일제는 1910년 국권을 빼앗고 우리 민족을 억압하고 수탈하였다',
      '1919년 3·1 운동으로 독립을 향한 열망을 세계에 알렸다',
      '1919년 상하이에 민주 공화제의 대한민국 임시 정부를 세웠다',
      '1920년 봉오동 전투와 청산리 대첩에서 독립군이 크게 이겼다',
      '우리말·우리 역사를 지키고 학생과 시민이 독립운동을 이어 갔다',
      '한인 애국단과 한국광복군이 광복을 위해 싸웠다',
    ],
  },
  5: {
    title: '광복과 대한민국의 발전',
    points: [
      '1945년 8월 15일 우리나라는 광복을 맞이하였다',
      '5·10 총선거(1948)를 거쳐 1948년 8월 15일 대한민국 정부가 수립되었다',
      '1950년 6월 25일 6·25 전쟁이 일어났고 인천 상륙 작전으로 서울을 되찾았다',
      '1953년 7월 정전 협정이 맺어지고 휴전선이 그어졌다',
      '전쟁 뒤 사람들은 어려움 속에서도 다시 일어섰지만 분단의 아픔은 남았다',
      '국민들은 4·19 혁명과 6월 민주 항쟁 등으로 민주주의를 지키고 경제를 크게 성장시켰다',
    ],
  },
};

// 시대별 편. 첫 화면 뒤 편 고르기에서 고른다. 두 편 모두 처음부터 열려 있다.
export const COURSES = [
  { id: 'goryeo', session: 1, title: '고려를 지켜라', era: '고려', eyebrow: '외세의 침입과 고려의 노력', chapters: CHAPTERS,
    lead: '거란과 몽골이 쳐들어왔을 때, 고려 사람들은 외교와 전투와 끈질긴 항쟁으로 나라를 지켰어요.' },
  { id: 'joseon', session: 2, title: '조선을 걷다', era: '조선', eyebrow: '조선의 건국과 발전', chapters: JOSEON,
    lead: '조선을 세운 사람들, 우리 글자와 과학 기구를 만든 사람들, 전쟁을 이겨 낸 사람들을 만나 보세요.' },
  { id: 'modern', session: 3, title: '새 나라를 꿈꾸다', era: '근대', eyebrow: '근대 국가를 세우려는 노력', chapters: MODERN,
    lead: '문을 연 조선, 개화와 개혁을 꿈꾼 사람들, 자주독립을 외친 사람들을 만나 보세요.' },
  { id: 'colonial', session: 4, title: '빼앗긴 나라를 되찾아라', era: '일제 강점기', eyebrow: '식민 통치와 우리 민족의 저항', chapters: COLONIAL,
    lead: '나라를 빼앗긴 시대, 만세를 외치고 독립을 위해 싸운 사람들과 함께해요.' },
  { id: 'present', session: 5, title: '대한민국을 세우다', era: '현대', eyebrow: '광복과 대한민국의 발전', chapters: PRESENT,
    lead: '광복의 기쁨, 정부 수립, 6·25 전쟁의 아픔을 딛고 민주주의를 이룬 이야기예요.' },
];

export const courseById = id => COURSES.find(c => c.id === id) || COURSES[0];
export const courseOfChapter = chapterId => COURSES.find(c => c.chapters.some(ch => ch.id === chapterId)) || COURSES[0];

// 장을 열 수 있는지: 각 편의 1장은 언제나, 나머지는 같은 편의 앞 장을 마쳐야 한다.
export function isUnlocked(chapter, save) {
  if (!chapter.load) return false;
  if (chapter.no === 1) return true;
  const prev = ALL_CHAPTERS.find(c => c.session === chapter.session && c.no === chapter.no - 1);
  return !!(prev && save.chapterResult(prev.id));
}

// 결과 카드를 띄울 때: 그 편의 모든 장을 마쳤는지
export function isSessionDone(session, save) {
  return ALL_CHAPTERS.filter(c => c.session === session).every(c => save.chapterResult(c.id));
}
