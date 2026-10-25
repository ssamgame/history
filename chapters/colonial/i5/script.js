// 일제 강점기편 5장 「민족 문화를 지킨 사람들」. 사실은 비상 5-2 교과서 126~127쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    student: { name: '광주의 학생', mark: '學', color: '#22262e', look: 'student' },
    linguist: { name: '조선어 학회 학자', mark: '語', color: '#4a4f5a', look: 'scholarModern' },
    historian: { name: '역사학자', mark: '史', color: '#3a3530', look: 'gentleman' },
  },
  intro: [
    { who: 'narr', text: '3·1 운동이 일어난 뒤에도 나라를 되찾으려는 여러 갈래의 독립운동이 이어졌어요.', src: ['S51'] },
    { who: 'narr', text: '우리나라에서 만든 물건을 써서 경제적으로 자립하자는 운동과, 교육으로 민족의 힘을 기르자는 운동이 펼쳐졌어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '경성의 골목이야. 학교에서는 우리말 대신 일본어를 가르치라고 하던 때래.' },
    { who: 'guide', text: '그래도 우리말과 역사를 지키려는 사람들이 있었어. 책가방을 멘 학생에게 먼저 물어보자.' },
  ],
  goals: ['학생에게 말을 걸어 보자', '조선어 학회 학자를 만나자', '역사학자를 찾아가자', '우리말과 역사를 지키자', '배운 내용을 확인해 보자'],
  minigameTitle: '민족 문화 지키기',
  npc: {
    student: {
      first: [
        { who: 'student', text: '우리는 일제의 차별적인 교육에 반대하고, 수업 중에 한국어를 쓰게 해 달라고 요구했어요.', src: ['S51'] },
        { who: 'student', text: '1929년 광주에서 일어난 광주 학생 항일 운동은 3·1 운동 뒤 가장 큰 항일 운동이 되었어요.', src: ['S51'] },
      ],
      later: [{ who: 'student', text: '1926년에는 순종의 장례식에 맞춰 6·10 만세 운동도 있었어요. 기와집의 조선어 학회 선생님도 만나 보세요.', src: ['S51'] }],
    },
    linguist: {
      tooEarly: [{ who: 'linguist', text: '요즘 학생들이 어떤 마음으로 지내는지 저 학생에게 먼저 들어 보렴.' }],
      first: [
        { who: 'linguist', text: '우리 조선어 학회는 우리말을 연구하고 널리 알려 민족 문화를 지키려 한단다.', src: ['S51'] },
        { who: 'linguist', text: '한글 맞춤법 통일안을 만들고, 「우리말 큰사전」을 펴내려 힘쓰고 있지.', src: ['S51'] },
      ],
      later: [{ who: 'linguist', text: '경찰 눈을 피해 사전 원고를 모으고 있단다. 네 도움이 필요하구나.' }],
    },
    historian: {
      tooEarly: [{ who: 'historian', text: '우리말을 지키는 일부터 알아야 하네. 조선어 학회에 먼저 다녀오게.' }],
      first: [
        { who: 'historian', text: '일제는 우리 역사를 왜곡하지만, 신채호와 박은식 같은 역사학자들은 우리 역사가 독자적이고 자주적으로 발전해 왔다고 강조했다네.', src: ['S51'] },
        { who: 'historian', text: '이육사, 윤동주, 한용운 같은 문학가들은 저항 의식을 담은 작품을 썼지.', src: ['S51'] },
      ],
    },
    signGoods: { always: [
      { who: 'narr', text: '사람들은 우리 물건을 쓰자는 운동, 성금을 모아 대학을 세우자는 운동, \'아는 것이 힘\'이라며 글자를 가르치는 운동을 펼쳤어요.', src: ['S51'] },
    ] },
    signJune: { always: [
      { who: 'narr', text: '1926년 순종의 장례식에 맞춰 학생들을 중심으로 6·10 만세 운동이 일어났어요.', src: ['S51'] },
    ] },
  },
  parts: {
    pages: {
      type: 'drive', src: ['S51'], title: '경찰을 피해 「우리말 큰사전」 원고를 모아 학회로 가져가요', counter: '지난 곳', pickupCounter: '모은 원고', seconds: 150,
      howto: '마을 곳곳에 숨겨 둔 원고를 모두 모아 조선어 학회로 가져가요. 순찰하는 경찰과 부딪히면 앞 지점에서 다시 가요.',
      intro: [
        { who: 'linguist', text: '경찰이 우리가 사전 만드는 일을 눈여겨보고 있단다.' },
        { who: 'linguist', text: '「우리말 큰사전」 원고를 여러 집에 나누어 숨겨 두었지. 경찰 눈을 피해 모아 와 주렴.' },
      ],
      route: [
        { label: '서점 앞', talk: [{ who: 'historian', text: '우리말을 지키는 일은 우리 민족을 지키는 일이네.' }] },
        { label: '학교 담장', say: '학생들도 우리말 낱말을 모아 보내 주었어요.' },
        { label: '조선어 학회', needPickups: true, needSay: '아직 모으지 못한 원고가 있어요! 화살표를 따라가 봐요.',
          talk: [{ who: 'linguist', text: '고맙다! 이 원고로 한글 맞춤법을 다듬고 「우리말 큰사전」을 펴낼 거란다.' }] },
      ],
      pickups: [{ label: '원고' }, { label: '원고' }, { label: '원고' }, { label: '원고' }, { label: '원고' }],
      bump: '경찰과 마주쳤어요! 앞 지점에서 다시 가요.',
      fail: '빛나는 곳을 따라가며 원고를 모아요. 경찰이 지나간 뒤에 움직여요.',
      done: [{ who: 'narr', text: '조선어 학회는 우리말을 연구하고 보급해 민족 문화를 지키려 했어요.', src: ['S51'] }],
    },
    match: {
      type: 'deliver', src: ['S51'], title: '한 일을 그 사람에게 가져가요', counter: '전한 것',
      howto: '머리 위의 글을 신채호, 조선어 학회, 이육사 가운데 그 일을 한 쪽으로 가져가 그 안에서 멈춰 잠깐 서 있어요. 놓으면 처음 자리로 돌아와 다음 것을 들어요.',
      intro: [{ who: 'historian', text: '총칼 대신 붓과 글로 싸운 사람들도 있었네. 누가 어떤 일을 했는지 알맞게 전해 주게.' }],
      bins: [{ id: 'shin', label: '신채호' }, { id: 'hak', label: '조선어 학회' }, { id: 'yuk', label: '이육사' }],
      cards: [
        { text: '우리 역사를 연구했다', bin: 'shin', talk: [{ who: 'historian', text: '우리 역사가 독자적이고 자주적으로 발전해 왔음을 밝혔지.' }] },
        { text: '「우리말 큰사전」을 펴내려 했다', bin: 'hak' },
        { text: '저항 의식을 담은 시를 썼다', bin: 'yuk' },
      ],
      fail: '신채호는 역사학자, 이육사는 시인, 조선어 학회는 우리말을 연구했어요.',
    },
    kinds: {
      type: 'deliver', src: ['S51'], title: '어떤 노력일까요? 알맞은 곳으로 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 글을 상점(민족의 힘 기르기), 학교(학생들의 항일 운동), 학회(우리말과 역사 지키기) 가운데 알맞은 곳으로 가져가요.',
      intro: [{ who: 'student', text: '우리 민족은 여러 가지 방법으로 일제에 맞섰어요. 알맞은 곳으로 나눠 주세요.' }],
      bins: [{ id: 'power', label: '민족의 힘 기르기' }, { id: 'students', label: '학생들의 항일 운동' }, { id: 'culture', label: '우리말과 역사 지키기' }],
      cards: [
        { text: '우리나라에서 만든 물건을 쓰자', bin: 'power' },
        { text: '6·10 만세 운동', bin: 'students', talk: [{ who: 'student', text: '1926년 순종의 장례식에 맞춰 만세를 불렀어요.' }] },
        { text: '「우리말 큰사전」 만들기', bin: 'culture' },
        { text: '성금을 모아 대학을 세우자', bin: 'power' },
        { text: '광주 학생 항일 운동', bin: 'students', talk: [{ who: 'student', text: '1929년 광주에서 일어난 운동은 3·1 운동 뒤 가장 큰 항일 운동이었어요.' }] },
        { text: '우리 역사를 연구하기', bin: 'culture' },
      ],
      fail: '물건과 대학은 민족의 힘을 기르는 일, 만세는 학생 운동, 사전과 역사는 우리 문화를 지키는 일이에요.',
    },
  },
  result: [{ who: 'narr', text: '일제가 우리 민족의 전통과 문화를 말살하려 했지만, 우리의 민족정신과 문화를 지키려는 노력은 계속되었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1929, question: '1929년 광주에서 일어난 학생들의 항일 운동은?', options: ['광주 학생 항일 운동', '6·10 만세 운동', '4·19 혁명'], answer: 0, explain: '광주 학생 항일 운동은 3·1 운동 뒤 가장 큰 항일 운동이었어요.', src: ['S51'] },
    { kind: 'quiz', year: 1931, question: '「우리말 큰사전」을 펴내려 한 단체는?', options: ['독립 협회', '조선어 학회', '한인 애국단'], answer: 1, explain: '조선어 학회는 한글 맞춤법 통일안을 만들고 우리말 큰사전을 펴내려 했어요.', src: ['S51'] },
  ],
};
