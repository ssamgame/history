// 근대편 2장 「갑신정변」. 사실은 비상 5-2 교과서 98~99쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
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
    { who: 'guide', text: '잔치 소식은 시장 사람들이 제일 빨리 알지. 길가의 상인부터 말을 걸어 보자.' },
  ],
  goals: ['한성 상인에게 말을 걸어 보자', '우정총국 관리를 찾아가자', '김옥균의 이야기를 들어 보자', '갑신정변을 살펴보자', '배운 내용을 확인해 보자'],
  minigameTitle: '갑신정변',
  npc: {
    merchant: {
      first: [
        { who: 'merchant', text: '나라에서 개화 정책을 편다지만 크게 달라진 게 없어요.', src: ['S51'] },
        { who: 'merchant', text: '게다가 청나라가 우리 일에 이래라저래라 간섭을 한다니까요.', src: ['S51'] },
      ],
      later: [{ who: 'merchant', text: '높은 분들이 잔치에 모인다니 오늘은 일찍 가게 문을 닫아야겠어요. 관청 앞 관리에게 물어보세요.' }],
    },
    clerk: {
      tooEarly: [{ who: 'clerk', text: '잔치 준비로 정신이 없네. 무슨 일인지 궁금하면 시장 쪽 상인에게 먼저 들어 보게.' }],
      first: [
        { who: 'clerk', text: '이곳 우정총국은 우리나라 최초로 우편 업무를 맡은 관청이라네.', src: ['S51'] },
        { who: 'clerk', text: '오늘 밤 우정총국이 생긴 것을 축하하는 잔치가 열리지.', src: ['S51'] },
      ],
      later: [{ who: 'clerk', text: '등불을 더 걸어야 하는데 손이 모자라는군. 저기 서 있는 젊은 관리도 오늘 잔치에 온다네.' }],
    },
    kimokgyun: {
      tooEarly: [{ who: 'kimokgyun', text: '오늘 밤 우정총국에서 무슨 잔치가 열리는지부터 알아보고 오시오.' }],
      first: [
        { who: 'kimokgyun', text: '청에 의지하는 세력을 몰아내고 새로운 조선을 만들어야 하오.', src: ['S51'] },
        { who: 'kimokgyun', text: '우리 개화 세력은 오늘 잔치를 틈타 정변을 일으킬 것이오.', src: ['S51'] },
        { who: 'kimokgyun', text: '우리가 발표할 개혁안을 함께 살펴보시오.' },
      ],
    },
    signPost: { always: [
      { who: 'narr', text: '우정총국은 우리나라 최초로 우편 업무를 맡은 관청이에요. 지금도 서울 종로에 남아 있어요.', src: ['S51'] },
    ] },
    signCoup: { always: [
      { who: 'narr', text: '정변은 법에 맞지 않는 방법으로 생긴 큰 정치적 변화를 말해요.', src: ['S51'] },
    ] },
  },
  parts: {
    // 이정표를 일어난 차례대로 길을 따라 세워 두고, 학생이 직접 걸어가며 하나씩 확인한다(선생님 의견: 찾기 놀이 대신)
    flow: {
      type: 'drive', src: ['S51'], title: '1884년 겨울밤, 갑신정변 길 따라 걷기', counter: '지난 이정표', showAll: true,
      howto: '길 위에 차례대로 선 이정표(1~5)를 따라 걸어가요. 이정표에 닿으면 그곳 사람이 무슨 일이 있었는지 들려줘요.',
      intro: [{ who: 'merchant', text: '오늘 밤 우정총국 쪽이 시끌시끌해요. 이정표를 따라가며 무슨 일이 벌어졌는지 봐요.' }],
      route: [
        { label: '1 우정총국 축하 잔치', look: 'joseonOfficial', post: true, talk: [{ who: 'clerk', text: '우리나라 최초로 우편 업무를 맡은 우정총국이 생긴 것을 축하하는 잔치라네.' }] },
        { label: '2 개화 세력의 정변', look: 'kimokgyun', post: true, talk: [{ who: 'kimokgyun', text: '청에 의지하는 세력을 몰아내고 새로운 조선을 만들 것이오!' }] },
        { label: '3 개혁안 발표', look: 'kimokgyun', post: true, talk: [{ who: 'kimokgyun', text: '새 정부를 세우고 개혁안을 발표하오.' }] },
        { label: '4 청의 군대', look: 'qingSoldier', post: true, talk: [{ who: 'merchant', text: '청나라 군대가 몰려와 개화 세력을 공격했어요!' }] },
        { label: '5 3일 만에 끝남', look: 'commoner', post: true, talk: [{ who: 'merchant', text: '결국 정변은 3일 만에 끝나 버렸어요.' }] },
      ],
      fail: '빛나는 이정표를 차례대로 따라 걸어가요.',
      done: [{ who: 'narr', text: '갑신정변은 청이 군사를 동원하면서 3일 만에 끝났어요(1884년).', src: ['S51'] }],
    },
    reform: {
      type: 'find', src: ['S51'], title: '방에 붙은 개혁안 가운데 갑신정변 때 발표한 내용을 찾아요', counter: '찾은 내용',
      howto: '마당의 방(벽보) 가운데 개화 세력이 발표한 개혁안을 찾아 대화 버튼을 눌러요. 틀린 것을 고르면 해설을 듣고 이어서 찾아요.',
      intro: [{ who: 'kimokgyun', text: '우리가 발표한 개혁안이 방에 붙어 있소. 진짜 개혁안만 골라 보시오.' }],
      items: [
        { text: '청에 바치던 예물을 없앤다', correct: true, talk: [{ who: 'kimokgyun', text: '청에서 벗어나 자주적인 나라가 되어야 하오.' }] },
        { text: '신분에 따라 관리를 뽑는다', correct: false },
        { text: '문벌을 없애 백성이 평등한 권리를 갖게 한다', correct: true, talk: [{ who: 'merchant', text: '백성이 평등해진다니 놀라워요!' }] },
        { text: '청의 간섭을 더 받아들인다', correct: false },
        { text: '세금 제도를 고쳐 관리의 부정을 막는다', correct: true },
      ],
      fail: '개화 세력은 청에서 벗어나고, 백성이 평등하고, 나라 살림이 넉넉해지기를 바랐어요.',
    },
  },
  result: [{ who: 'narr', text: '김옥균 등은 일본으로 몸을 피했고, 그 뒤 청의 간섭은 더욱 심해졌어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1884, question: '갑신정변을 일으킨 개화 세력의 인물은?', options: ['전봉준', '김옥균', '서재필'], answer: 1, explain: '김옥균 등 개화 세력이 1884년 갑신정변을 일으켰어요.', src: ['S51'] },
    { kind: 'quiz', year: 1884, question: '갑신정변은 며칠 만에 끝났나요?', options: ['3일', '30일', '3년'], answer: 0, explain: '청이 군사를 동원하면서 3일 만에 끝났어요.', src: ['S51'] },
  ],
};
