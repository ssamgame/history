// 일제 강점기편 5장 「민족 문화를 지킨 사람들」(D-44). 사실은 비상 5-2 교과서 126~127쪽(S51).
// 탐험: 「경성」 골목 문으로 들어와 학생·역사학자·상인 이야기를 아무 차례로 듣고(모두 들어야 조선어 학회 학자),
// 학자에게 가면 학생의 결심 → 1929년 광주에서 학생들이 차별 교육에 반대하며 거리로 나서는 장면.
// 놀이: 경찰 피해 「우리말 큰사전」 원고 모으기 → 역사학자에게 말을 걸면 민족 문화 걷기
// (우리 물건 상점·대학 성금 → 글 배우는 밤 교실 → 역사학자의 서재 → 시인의 책상 → 조선어 학회 사전 원고).
// 예전 가져다 놓기 두 판과 안내판(물산 장려·6·10 만세)의 출처 있는 문장은 사람 대사·걷기 자리로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#22262e' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
    linguist: { name: '조선어 학회 학자', mark: '語', color: '#4a4f5a', look: 'scholarModern' },
    historian: { name: '역사학자', mark: '史', color: '#3a3530', look: 'gentleman' },
    merchant: { name: '상인', mark: '商', color: '#7a5a3c', look: 'commoner' },
    gwangju: { name: '광주의 학생', mark: '學', color: '#22262e', look: 'student' },
    teacher: { name: '밤 교실 선생님', mark: '師', color: '#4a4f5a', look: 'scholarModern' },
    poet: { name: '시인', mark: '詩', color: '#3a3a44', look: 'scholarModern' },
  },
  intro: [
    { who: 'narr', text: '3·1 운동이 일어난 뒤에도 나라를 되찾으려는 여러 갈래의 독립운동이 이어졌어요.', src: ['S51'] },
    { who: 'narr', text: '우리나라에서 만든 물건을 써서 경제적으로 자립하자는 운동과, 교육으로 민족의 힘을 기르자는 운동이 펼쳐졌어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '경성의 골목이야. 학교에서는 우리말 대신 일본어를 가르치라고 하던 때래.' },
    { who: 'guide', text: '그래도 우리말과 역사를 지키려는 사람들이 있었어. 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['경성 골목 사람들의 이야기를 모두 들어 보자', '조선어 학회 학자를 찾아가자', '광주 학생들의 항일 운동을 지켜보자', '경찰을 피해 「우리말 큰사전」 원고를 모으자', '민족 문화를 지킨 사람들을 찾아가 보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 조선어 학회 학자를 찾아가자.' },
  minigameTitle: '민족 문화 지키기',
  npc: {
    student: {
      first: [
        { who: 'student', text: '우리는 일제의 차별적인 교육에 반대하고, 수업 중에 한국어를 쓰게 해 달라고 요구했어요.', src: ['S51'] },
        { who: 'student', text: '1926년에는 순종의 장례식에 맞춰 학생들을 중심으로 6·10 만세 운동도 있었어요.', src: ['S51'] },
        { who: 'student', text: '1929년에는 광주에서도 학생들이 들고일어났대요.', src: ['S51'] },
      ],
      bridge: { who: 'student', text: '다른 분들 이야기도 들으셨군요. 저도 말씀드릴게요.' },
      later: [{ who: 'student', text: '우리말로 공부하고 싶어요.' }],
    },
    historian: {
      first: [
        { who: 'historian', text: '일제는 우리 역사를 거짓으로 꾸며 내지만, 신채호와 박은식 같은 역사학자들은 달랐네.', src: ['S51'] },
        { who: 'historian', text: '우리 역사가 스스로의 힘으로 발전해 왔다고 강조했지.', src: ['S51'] },
      ],
      bridge: { who: 'historian', text: '여러 사람을 만나고 왔구먼. 내 이야기도 들어 보게.' },
      later: [{ who: 'historian', text: '우리 역사를 지키는 일도 나라를 되찾는 일이라네.' }],
    },
    merchant: {
      first: [
        { who: 'merchant', text: '사람들은 우리나라에서 만든 물건을 써서 경제적으로 자립하자는 운동을 펼치고 있소.', src: ['S51'] },
        { who: 'merchant', text: '우리 가게 옷감도 모두 우리 손으로 짠 것이오.' },
      ],
      bridge: { who: 'merchant', text: '자네도 골목을 다 돌아봤구먼. 나도 한마디 하리다.' },
      later: [{ who: 'merchant', text: '우리 물건을 쓰는 것도 나라를 지키는 일이오.' }],
    },
    linguist: {
      wait: [{ who: 'linguist', text: '골목 사람들의 이야기를 먼저 모두 듣고 오렴. 그다음에 부탁할 일을 말해 주마.' }],
      first: [
        { who: 'linguist', text: '우리 조선어 학회는 우리말을 연구하고 널리 알려 민족 문화를 지키려 한단다.', src: ['S51'] },
        { who: 'linguist', text: '마침 광주에서 학생들이 거리로 나섰다는 소식이 들어왔구나. 함께 보자.' },
        { who: 'me', text: '저도 우리말과 역사를 지키겠습니다!' },
      ],
      later: [{ who: 'linguist', text: '우리말을 지키는 일은 우리 민족을 지키는 일이란다.' }],
    },
  },
  // 탐험 끝 장면: 1929년 광주, 학생들이 차별 교육에 반대하며 거리로 나서 주먹을 든다
  gwangju: {
    lines: [
      { who: 'guide', text: '1929년 광주야. 학교 앞 거리에 학생들이 줄지어 나섰어.' },
      { who: 'gwangju', text: '차별 교육 반대! 수업 중에 우리말을 쓰게 하라!', src: ['S51'] },
      { who: 'narr', text: '1929년 광주에서 일어난 광주 학생 항일 운동은 3·1 운동 뒤 가장 큰 항일 운동이 되었어요.', src: ['S51'] },
      { who: 'gwangju', text: '우리는 끝까지 우리말과 우리 역사를 지킬 거예요!' },
      { who: 'linguist', text: '학생들의 뜻을 우리도 이어 가자. 우리말을 지킬 사전을 만들 거란다.' },
    ],
  },
  parts: {
    pages: {
      type: 'drive', src: ['S51'], title: '경찰을 피해 「우리말 큰사전」 원고를 모아 학회로 가져가요', counter: '지난 곳', pickupCounter: '모은 원고', seconds: 150,
      howto: '마을 곳곳에 숨겨 둔 원고를 모두 모아 조선어 학회로 가져가요. 순찰하는 경찰과 부딪히면 앞 지점에서 다시 가요.',
      intro: [ // 광주 장면 뒤 바로(학자)
        { who: 'linguist', text: '경찰이 우리가 사전 만드는 일을 눈여겨보고 있단다.' },
        { who: 'linguist', text: '「우리말 큰사전」 원고를 여러 집에 나누어 숨겨 두었지. 경찰 눈을 피해 모아 와 주렴.' },
      ],
      route: [
        { label: '서점 앞', talk: [{ who: 'historian', text: '우리말을 지키는 일은 우리 민족을 지키는 일이네.' }] },
        { label: '학교 담장', say: '학생들도 우리말 낱말을 모아 보내 주었어요.' },
        { label: '조선어 학회', needPickups: true, needSay: '아직 모으지 못한 원고가 있어요! 화살표를 따라가 봐요.',
          talk: [{ who: 'linguist', expr: 'joy', text: '고맙다! 이 원고로 「우리말 큰사전」을 펴낼 거란다.' }] },
      ],
      pickups: [{ label: '원고' }, { label: '원고' }, { label: '원고' }, { label: '원고' }, { label: '원고' }],
      bump: '경찰과 마주쳤어요! 앞 지점에서 다시 가요.',
      fail: '빛나는 곳을 따라가며 원고를 모아요. 경찰이 지나간 뒤에 움직여요.',
      done: [{ who: 'narr', text: '조선어 학회는 우리말을 연구하고 보급해 민족 문화를 지키려 했어요.', src: ['S51'] }],
    },
    // 민족 문화 걷기(D-44): 가져다 놓기 두 판 대신 빛나는 자리로 걸어가 대화 버튼으로 겪는다(장면이라 첫 시도 점수에는 넣지 않는다)
    culture: {
      type: 'scene', title: '민족 문화를 지킨 사람들',
      howto: '빛나는 자리로 걸어가 대화 버튼을 눌러요. 민족의 힘과 문화를 지킨 사람들을 차례로 만나요.',
      intro: [ // 역사학자에게 말을 걸면(C-05)
        { who: 'historian', text: '총칼 대신 물건과 배움, 붓과 글로 맞선 사람들도 있었네. 함께 찾아가 보세.' },
        { who: 'historian', text: '빛나는 자리에 가서 대화 버튼을 누르게.' },
      ],
      stations: [
        { id: 'goods', label: '우리 물건 상점', act: '우리 옷감 사기', lines: [
          { who: 'merchant', text: '우리 손으로 짠 옷감이오. 우리 물건을 써야 우리 힘이 커지지요.' },
          { who: 'narr', text: '사람들은 우리 물건을 쓰자는 운동과 성금을 모아 대학을 세우자는 운동을 펼쳤어요.', src: ['S51'] },
        ] },
        { id: 'night', label: '밤 교실', act: '글자 배우기', lines: [
          { who: 'teacher', text: '가, 나, 다… 글을 알아야 힘이 생깁니다.' },
          { who: 'narr', text: '\'아는 것이 힘\'이라며 사람들에게 글자를 가르치는 운동도 펼쳐졌어요.', src: ['S51'] },
        ] },
        { id: 'history', label: '역사학자의 서재', act: '역사책 받기', lines: [
          { who: 'historian', text: '우리 역사를 담은 책이네. 소중히 읽어 보게.' },
          { who: 'narr', text: '신채호와 박은식 같은 역사학자들은 우리 역사가 스스로의 힘으로 발전해 왔다고 강조했어요.', src: ['S51'] },
        ] },
        { id: 'poem', label: '시인의 책상', act: '시 읽기', lines: [
          { who: 'poet', expr: 'worry', text: '빼앗긴 나라를 생각하며 이 시를 썼소.' },
          { who: 'narr', text: '이육사, 윤동주, 한용운 같은 문학가들은 저항 의식을 담은 작품을 썼어요.', src: ['S51'] },
        ] },
        { id: 'dict', label: '조선어 학회', act: '사전 원고 쌓기', lines: [
          { who: 'linguist', text: '네가 모아 온 원고란다. 한 장 한 장이 우리말이지.' },
          { who: 'narr', text: '조선어 학회는 한글 맞춤법 통일안을 만들고 「우리말 큰사전」을 펴내려 힘썼어요.', src: ['S51'] },
        ] },
      ],
    },
  },
  result: [{ who: 'narr', text: '일제가 우리 민족의 전통과 문화를 말살하려 했지만, 우리의 민족정신과 문화를 지키려는 노력은 계속되었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1929, question: '1929년 광주에서 일어난 학생들의 항일 운동은?', options: ['광주 학생 항일 운동', '6·10 만세 운동', '4·19 혁명'], answer: 0, explain: '광주 학생 항일 운동은 3·1 운동 뒤 가장 큰 항일 운동이었어요.', src: ['S51'] },
    { kind: 'quiz', year: 1931, question: '「우리말 큰사전」을 펴내려 한 단체는?', options: ['독립 협회', '조선어 학회', '한인 애국단'], answer: 1, explain: '조선어 학회는 한글 맞춤법 통일안을 만들고 우리말 큰사전을 펴내려 했어요.', src: ['S51'] },
  ],
};
