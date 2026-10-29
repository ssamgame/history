// 근대편 2장 「갑신정변」(D-29). 사실은 비상 5-2 교과서 98~99쪽(S51).
// 탐험: 한성 큰길 문으로 들어와 상인·우정총국 관리의 이야기를 아무 차례로 듣고, 김옥균에게 가면 학생의 결심.
// 놀이(D-30): 김옥균을 따라 그날 밤을 걷기(우정총국 잔치 → 정변 → 창덕궁 → 새 정부와 개혁안) → 한성 곳곳에 진짜 개혁안만 붙이기(붙이면 두루마리로 내용)
//   → 김옥균과 다시 궁으로: 청 군대가 몰려와 김옥균이 달아나고, 3일 만에 끝남.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#3a4a5a' },
    merchant: { name: '한성 상인', mark: '商', color: '#6b4a32', look: 'commoner' },
    clerk: { name: '우정총국 관리', mark: '郵', color: '#55608a', look: 'joseonOfficial' },
    kimokgyun: { name: '김옥균', mark: '金', color: '#3a4a5a', look: 'kimokgyun' },
  },
  intro: [
    { who: 'narr', text: '조선은 서양 문물을 받아들이고 개화 정책을 펼쳤지만 뚜렷한 성과를 거두지 못했어요.', src: ['S51'] },
    { who: 'narr', text: '이 무렵 조선은 청의 간섭을 받고 있었어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1884년 겨울, 한성의 큰길이야. 가게마다 사람들이 북적이고, 가운데 새로 지은 관청에서는 오늘 밤 축하 잔치가 열린대.' },
    { who: 'guide', text: '거리 사람들은 무슨 이야기를 할까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  goals: ['한성 거리 사람들의 이야기를 모두 들어 보자', '김옥균을 찾아가자', '김옥균을 따라 그날 밤을 걸어 보자', '한성 곳곳에 개혁안을 붙이자', '김옥균과 함께 궁으로 가 보자'], // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 길 오른쪽에 선 김옥균을 찾아가자.' },
  minigameTitle: '갑신정변',
  npc: {
    merchant: {
      first: [
        { who: 'merchant', text: '나라에서 개화 정책을 편다지만 크게 달라진 게 없어요.', src: ['S51'] },
        { who: 'merchant', text: '게다가 청나라가 우리 일에 이래라저래라 간섭을 한다니까요.', src: ['S51'] },
      ],
      bridge: { who: 'merchant', text: '우정총국 잔치 이야기는 들으셨구먼요. 시장 사정도 한번 들어 보세요.' },
      later: [{ who: 'merchant', text: '높은 분들이 잔치에 모인다니 오늘은 일찍 가게 문을 닫아야겠어요.' }],
    },
    clerk: {
      first: [
        { who: 'clerk', text: '이곳 우정총국은 우리나라 최초로 우편 업무를 맡은 관청이라네.', src: ['S51'] },
        { who: 'clerk', text: '오늘 밤 우정총국이 생긴 것을 축하하는 잔치가 열리지.', src: ['S51'] },
        { who: 'narr', text: '우정총국 건물은 지금도 서울 종로에 남아 있어요.', src: ['S51'] }, // 예전 「우정총국」 안내판 내용(D-30 C-03)
      ],
      bridge: { who: 'clerk', text: '시장 사람들 걱정은 들었겠지. 오늘 밤 이곳에서는 잔치가 열린다네.' },
      later: [{ who: 'clerk', text: '등불을 더 걸어야 하는데 손이 모자라는군.' }],
    },
    kimokgyun: {
      wait: [{ who: 'kimokgyun', text: '오늘 밤 한성 거리에서 무슨 이야기가 오가는지 모두 들어 보고 오시오.' }],
      first: [
        { who: 'kimokgyun', text: '청에 의지하는 세력을 몰아내고 새로운 조선을 만들어야 하오.', src: ['S51'] },
        { who: 'kimokgyun', text: '우리 개화 세력은 오늘 잔치를 틈타 정변을 일으킬 것이오.', src: ['S51'] },
        { who: 'narr', text: '정변은 법에 맞지 않는 방법으로 생긴 큰 정치적 변화를 말해요.', src: ['S51'] }, // 예전 「갑신정변」 안내판 내용(D-30 C-03)
        { who: 'me', text: '오늘 밤 무슨 일이 벌어지는지, 제가 곁에서 끝까지 지켜보겠습니다!' },
      ],
      later: [{ who: 'kimokgyun', text: '따라오시오. 오늘 밤이 조선의 앞날을 바꿀 것이오.' }],
    },
  },
  // 김옥균을 따라 걷는 밤길: 멈추는 곳마다 그때 일을 본다(읽기·장면이라 첫 시도 점수에 넣지 않는다)
  night: {
    title: '김옥균을 따라 그날 밤을 걸어요',
    howto: { title: '김옥균을 따라 걷기', steps: ['김옥균 뒤를 따라 걸어요. 너무 멀어지면 김옥균이 멈춰 기다려요.', '김옥균이 멈춘 곳의 빛나는 원에 서면 그곳에서 일어난 일을 봐요.'] },
    // 첫 밤: 우정총국 잔치 → 정변(불길과 소란) → 궁으로 가는 길 → 새 정부와 개혁안
    a: [
      { label: '우정총국 축하 잔치', talk: [{ who: 'clerk', text: '우리나라 최초로 우편 업무를 맡은 우정총국이 생긴 것을 축하하는 잔치라네.', src: ['S51'] }] },
      { label: '정변을 일으킴', talk: [
        { who: 'kimokgyun', text: '지금이오! 청에 의지하는 세력을 몰아내고 새로운 조선을 만들 것이오!', src: ['S51'] },
        { who: 'kimokgyun', text: '궁으로 가야 하오. 놓치지 말고 따라오시오.' },
      ] },
      { label: '창덕궁으로', talk: [{ who: 'kimokgyun', text: '궁 안으로 들어갑시다. 오늘 밤 조선이 달라질 것이오.' }] },
      { label: '새 정부와 개혁안', talk: [
        { who: 'kimokgyun', text: '새 정부를 세우고 개혁안을 발표하겠소.', src: ['S51'] },
        { who: 'kimokgyun', text: '이 개혁안을 한성 곳곳에 붙여 백성에게 알려야 하오.' },
      ] },
    ],
    // 다시 궁: 청의 군대가 몰려오고 김옥균이 달아난다 → 3일 만에 끝남
    b: [
      { label: '청의 군대', talk: [
        { who: 'narr', text: '청나라 군대가 몰려와 개화 세력을 공격했어요.', src: ['S51'] },
      ], then: [{ who: 'kimokgyun', text: '청의 군사를 막을 수가 없구려. 몸을 피해야 하오!' }] }, // then: 김옥균이 돌아서서 말한 뒤 달아난다
      { label: '3일 만에 끝남', talk: [
        { who: 'narr', text: '갑신정변은 청이 군사를 동원하면서 3일 만에 끝났어요(1884년).', src: ['S51'] },
      ], after: [{ who: 'narr', text: '김옥균 등은 일본으로 몸을 피했어요.', src: ['S51'] }] }, // 김옥균이 달아난 골목 어귀에서
    ],
  },
  parts: {
    reform: {
      type: 'deliver', src: ['S51'], title: '한성 곳곳에 진짜 개혁안만 붙여요', counter: '붙인 방',
      howto: '두 팔에 든 방을 읽고, 진짜 개혁안이면 빛기둥이 선 벽·게시판에, 아니면 「개혁안이 아닌 것」 원 안에 잠깐 서 있어요.',
      intro: [
        { who: 'kimokgyun', text: '내가 건네는 방을 하나씩 읽어 보시오. 진짜 개혁안이면 빛기둥이 선 곳에 붙여 주시오.' },
        { who: 'kimokgyun', text: '개혁안이 아닌 것은 「개혁안이 아닌 것」 자리에 두시오.' },
      ],
      bins: [{ id: 'gate', label: '큰길 담벼락' }, { id: 'market', label: '시장 게시판' }, { id: 'well', label: '우물가 담' }, { id: 'no', label: '개혁안이 아닌 것' }],
      // 진짜 개혁안은 붙이자마자 그 내용을 두루마리로 본다(talk 첫 줄의 doc, D-30 G-03)
      cards: [
        { text: '청에 바치던 예물을 없앤다', carry: 'notice', bin: 'gate', talk: [{ doc: { title: '한성 곳곳에 붙인 개혁안', heading: '개혁안', items: [{ text: '청에 바치던 예물을 없앤다.' }], src: ['S51'] } }, { who: 'kimokgyun', text: '청에서 벗어나 자주적인 나라가 되어야 하오.' }] },
        { text: '신분에 따라 관리를 뽑는다', carry: 'notice', bin: 'no' },
        { text: '문벌을 없애 백성이 평등한 권리를 갖게 한다', carry: 'notice', bin: 'market', talk: [{ doc: { title: '한성 곳곳에 붙인 개혁안', heading: '개혁안', items: [{ text: '문벌을 없애 백성이 평등한 권리를 갖게 한다.' }], src: ['S51'] } }, { who: 'merchant', text: '백성이 평등해진다니 놀라워요!' }] },
        { text: '청의 간섭을 더 받아들인다', carry: 'notice', bin: 'no' },
        { text: '세금 제도를 고쳐 관리의 부정을 막는다', carry: 'notice', bin: 'well', talk: [{ doc: { title: '한성 곳곳에 붙인 개혁안', heading: '개혁안', items: [{ text: '세금 제도를 고쳐 관리의 부정을 막는다.' }], src: ['S51'] } }] },
      ],
      fail: '개화 세력은 청에서 벗어나고, 백성이 평등하고, 나라 살림이 넉넉해지기를 바랐어요.',
    },
    palace: { // 다시 궁으로(셋째 놀이 앞, 김옥균에게 말을 걸면)
      intro: [{ who: 'kimokgyun', text: '청나라 군대가 움직인다는 소식이오. 함께 궁으로 가 봅시다.' }],
      cards: [],
    },
  },
  result: [{ who: 'narr', text: '갑신정변 뒤 청의 간섭은 더욱 심해졌어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1884, question: '갑신정변을 일으킨 개화 세력의 인물은?', options: ['전봉준', '김옥균', '서재필'], answer: 1, explain: '김옥균 등 개화 세력이 1884년 갑신정변을 일으켰어요.', src: ['S51'] },
    { kind: 'quiz', year: 1884, question: '갑신정변은 며칠 만에 끝났나요?', options: ['3일', '30일', '3년'], answer: 0, explain: '청이 군사를 동원하면서 3일 만에 끝났어요.', src: ['S51'] },
  ],
};
