// 근대편 4장 「독립 협회와 대한 제국」. 사실은 비상 5-2 교과서 101쪽(S51)과 S52~S54.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    citizen: { name: '한성 시민', mark: '民', color: '#6b4a32', look: 'commoner' },
    seojaepil: { name: '서재필', mark: '徐', color: '#2b2f36', look: 'seojaepil' },
    gojong: { name: '고종', mark: '帝', color: '#c99a2e', look: 'gojong' },
  },
  intro: [
    { who: 'narr', text: '청일 전쟁에서 이긴 일본이 조선의 정치에 간섭하자, 고종과 명성 황후는 러시아의 힘을 빌려 이를 벗어나려 했어요.', src: ['S51'] },
    { who: 'narr', text: '그러자 일본은 경복궁에 침입해 명성 황후를 시해했어요(을미사변). 고종은 러시아 공사관으로 몸을 피했어요.', src: ['S51', 'S54'] },
  ],
  start: [
    { who: 'guide', text: '한성 서대문 밖 큰길이야. 새로 세운 돌문 앞에서 사람들이 모여 나라 이야기로 시끌시끌해.' },
    { who: 'guide', text: '왜 이렇게 사람들이 모였을까? 길가의 시민에게 먼저 물어보자.' },
  ],
  goals: ['한성 시민에게 말을 걸어 보자', '독립문 앞의 서재필을 찾아가자', '고종 황제를 만나자', '자주독립을 위한 일을 해 보자', '배운 내용을 확인해 보자'],
  minigameTitle: '자주독립을 외치다',
  npc: {
    citizen: {
      first: [
        { who: 'citizen', text: '임금께서 러시아 공사관에 머무신다니 나라 꼴이 말이 아니에요.', src: ['S51'] },
        { who: 'citizen', text: '그래도 요즘엔 신문으로 나라 안팎의 소식을 알 수 있어요.', src: ['S51'] },
      ],
      later: [{ who: 'citizen', text: '저 돌문 앞에 서재필 선생이 계세요. 신문을 만든 분이니 궁금한 걸 여쭤보세요.' }],
    },
    seojaepil: {
      tooEarly: [{ who: 'seojaepil', text: '거리의 시민들이 요즘 어떤 이야기를 하는지 먼저 들어 보고 오세요.' }],
      first: [
        { who: 'seojaepil', text: '나는 정부의 지원을 받아 독립신문을 펴냈습니다. 나라 안팎의 소식을 알리고 자주독립을 강조하지요.', src: ['S51', 'S53'] },
        { who: 'seojaepil', text: '관리, 지식인과 함께 독립 협회를 만들고 이 독립문을 세웠습니다.', src: ['S51', 'S52'] },
      ],
      later: [{ who: 'seojaepil', text: '저 연단 보이지요? 신분과 상관없이 누구나 올라가 생각을 말할 수 있답니다.' }],
    },
    gojong: {
      tooEarly: [{ who: 'gojong', text: '백성들이 무엇을 바라는지 서재필에게 먼저 듣고 오너라.' }],
      first: [
        { who: 'gojong', text: '나는 러시아 공사관에 머문 지 1년 만에 경운궁으로 돌아왔다.', src: ['S51', 'S54'] },
        { who: 'gojong', text: '환구단에서 황제로 즉위하고, 나라 이름을 대한 제국으로 바꾸었다.', src: ['S51', 'S54'] },
        { who: 'gojong', text: '여러 개혁을 펼쳐 근대 국가로 나아갈 것이다.', src: ['S51'] },
      ],
    },
    signGate: { always: [
      { who: 'narr', text: '독립 협회는 독립문을 세워 자주독립의 의지를 보여 주었어요.', src: ['S51'] },
    ] },
    signForum: { always: [
      { who: 'narr', text: '독립 협회는 만민 공동회를 열어 누구나 사회 문제에 대해 자기 생각을 말할 수 있게 했어요.', src: ['S51'] },
      { who: 'narr', text: '첫 만민 공동회는 1898년 종로에서 열렸어요.', src: ['S52'] },
    ] },
    signAltar: { always: [
      { who: 'narr', text: '환구단은 황제가 하늘에 제사를 지내던 제단이에요. 지금은 황궁우만 남아 있어요.', src: ['S51'] },
    ] },
  },
  parts: {
    paper: {
      type: 'drive', src: ['S53'], title: '독립신문을 받아 한성 거리에 배달해요', counter: '배달한 곳', seconds: 150,
      howto: '신문사에서 신문 뭉치를 두 손에 받아 들고, 빛나는 곳을 차례로 지나며 신문을 건네요. 건네는 동안 잠깐 기다려요.',
      intro: [{ who: 'narr', text: '독립신문은 1896년에 창간한 우리나라 최초의 민간 신문이에요.', src: ['S53'] }, { who: 'seojaepil', text: '오늘 신문이 나왔습니다. 한성 사람들에게 나라 안팎의 소식을 전해 주세요!' }],
      route: [
        { label: '독립신문사', hold: 3, holdLabel: '신문 뭉치 받는 중', holdSay: '신문사 사람이 갓 찍은 신문 뭉치를 건네줘요.', look: 'seojaepil', give: true },
        { label: '종로 가게', hold: 2, holdLabel: '신문 건네는 중', hand: true, talk: [{ who: 'citizen', text: '한글로 쓰여 있어서 누구나 읽을 수 있네요!' }] },
        { label: '궁궐 앞 거리', hold: 2, holdLabel: '신문 건네는 중', hand: true, talk: [{ who: 'citizen', text: '임금께서 러시아 공사관에 머무신다니 걱정이에요.' }] },
        { label: '시장', hold: 2, holdLabel: '신문 건네는 중', hand: true, say: '시장 사람들도 신문을 돌려 읽어요.' },
        { label: '서재필 선생', talk: [{ who: 'seojaepil', text: '수고했어요. 신문으로 자주독립의 뜻을 널리 알릴 수 있습니다.' }] },
      ],
      fail: '화살표를 따라 빛나는 곳으로 가요. 시간 안에 모두 배달해요.',
    },
    // 그동안 있었던 일: 해마다 차례로 찾아가기 대신 역사책을 넘기며 본다(선생님 의견)
    flow: {
      type: 'book', title: '역사책으로 보는 1895~1898년의 한성',
      intro: [{ who: 'citizen', text: '그동안 한성에서 있었던 일을 역사책으로 차례차례 넘겨 봐요.' }],
      pages: [
        { title: '을미사변', year: '1895년', pic: 'eulmi', lines: [{ who: 'narr', text: '1895년, 일본이 경복궁에 침입해 명성 황후를 시해했어요. 이 일을 을미사변이라고 해요.', src: ['S54'] }] },
        { title: '러시아 공사관으로', year: '1896년 2월', pic: 'agwan', lines: [{ who: 'narr', text: '을미사변 뒤 고종은 몸을 피해 러시아 공사관으로 옮겼어요.', src: ['S54'] }] },
        { title: '독립신문', year: '1896년 4월', pic: 'newspaper', lines: [{ who: 'narr', text: '서재필이 독립신문을 펴냈어요. 한글로 쓴 우리나라 최초의 민간 신문이에요.', src: ['S53'] }] },
        { title: '대한 제국', year: '1897년 10월', pic: 'hwangudan', lines: [{ who: 'narr', text: '고종은 환구단에서 황제로 즉위하고, 나라 이름을 대한 제국으로 바꾸었어요.', src: ['S51', 'S54'] }] },
        { title: '만민 공동회', year: '1898년', pic: 'forum', lines: [{ who: 'narr', text: '독립 협회는 종로에서 만민 공동회를 열었어요. 누구나 나라 일에 대한 생각을 말할 수 있었어요.', src: ['S52'] }] },
      ],
      done: [{ who: 'guide', text: '역사책을 다 넘겼어. 을미사변부터 만민 공동회까지, 한성에서 있었던 일을 차례로 떠올려 보자.' }],
    },
  },
  result: [{ who: 'narr', text: '대한 제국은 여러 개혁을 추진해 근대 국가로 나아가고자 했어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1896, question: '서재필이 펴낸 신문은?', options: ['황성신문', '독립신문', '대한매일신보'], answer: 1, explain: '서재필은 1896년 독립신문을 펴냈어요.', src: ['S51', 'S53'] },
    { kind: 'quiz', year: 1897, question: '1897년 고종이 바꾼 나라 이름은?', options: ['대한 제국', '조선', '고려'], answer: 0, explain: '고종은 환구단에서 황제로 즉위하고 대한 제국을 세웠어요.', src: ['S51'] },
  ],
};
