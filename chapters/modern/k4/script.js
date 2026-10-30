// 근대편 4장 「독립 협회와 대한 제국」(D-33). 사실은 비상 5-2 교과서 101쪽(S51)과 S52~S54.
// 탐험: 한성 서대문 밖 마을 문으로 들어와 한성 시민·선비 이야기를 아무 차례로 듣고(모두 들어야 서재필), 서재필에게 가면 학생의 결심 → 환구단 즉위식 장면.
// 놀이: 독립신문 배달 → 시민에게 말을 걸면 종로 만민 공동회(연설 듣기) → 시민들의 말이 맞는지 가려내기.
// 예전 역사책(을미사변·아관 파천·독립신문·대한 제국·만민 공동회)의 출처 있는 문장은 도입 장면·즉위식·대사·만민 공동회로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#5d7a9a' },
    citizen: { name: '한성 시민', mark: '民', color: '#6b4a32', look: 'commoner' },
    scholar: { name: '한성 선비', mark: '士', color: '#3a4a5a', look: 'scholar' },
    seojaepil: { name: '서재필', mark: '徐', color: '#2b2f36', look: 'seojaepil' },
    gojong: { name: '고종', mark: '帝', color: '#c99a2e', look: 'gojong' },
    speaker: { name: '독립 협회 회원', mark: '演', color: '#4a4f5a', look: 'scholarModern' },
    woman: { name: '한성 아낙', mark: '女', color: '#b8768a', look: 'woman' },
    merchant: { name: '종로 상인', mark: '商', color: '#7a5a3c', look: 'commoner' },
    youth: { name: '젊은이', mark: '靑', color: '#5d7a9a', look: 'citizen' },
    elder: { name: '한성 노인', mark: '老', color: '#6b6258', look: 'scholar' },
  },
  intro: [
    { who: 'narr', text: '청일 전쟁에서 이긴 일본이 조선의 정치에 간섭하자, 고종과 명성 황후는 러시아의 힘을 빌려 이를 벗어나려 했어요.', src: ['S51'] },
    { who: 'narr', text: '그러자 일본은 경복궁에 침입해 명성 황후를 죽였어요(을미사변). 고종은 러시아 공사관으로 몸을 피했어요.', src: ['S51', 'S54'] },
  ],
  start: [
    { who: 'guide', text: '한성 서대문 밖 큰길이야. 새로 세운 돌문 앞에서 사람들이 모여 나라 이야기로 시끌시끌해.' },
    { who: 'guide', text: '왜 이렇게 사람들이 모였을까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['한성 사람들의 이야기를 모두 들어 보자', '독립문 앞의 서재필을 찾아가자', '환구단에서 열리는 즉위식을 지켜보자', '독립신문을 한성 거리에 배달하자', '종로 만민 공동회에서 시민들의 말을 가려 보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 독립문 앞의 서재필을 찾아가자.' },
  minigameTitle: '자주독립을 외치다',
  npc: {
    citizen: {
      first: [
        { who: 'citizen', expr: 'worry', text: '임금께서 러시아 공사관에 머무신다니 나라 꼴이 말이 아니에요.', src: ['S51'] },
        { who: 'citizen', text: '그래도 요즘엔 신문으로 나라 안팎의 소식을 알 수 있어요.', src: ['S51'] },
      ],
      bridge: { who: 'citizen', text: '선비님 이야기는 들으셨군요. 우리 같은 시민 이야기도 들어 보세요.' },
      later: [{ who: 'citizen', text: '신문을 읽으면 세상 돌아가는 일이 한눈에 보여요.' }],
    },
    scholar: {
      first: [
        { who: 'scholar', text: '저 큰 돌문을 보시오. 이름이 독립문이라오.' },
        { who: 'narr', text: '독립 협회는 독립문을 세워 자주독립의 의지를 보여 주었어요.', src: ['S51'] }, // 예전 「독립문」 안내판 내용(D-30 C-03)
        { who: 'scholar', text: '나라가 스스로 서야 한다는 뜻이 담겨 있지요.' },
      ],
      bridge: { who: 'scholar', text: '시민들 사정은 들으셨구려. 내 이야기도 들어 보시오.' },
      later: [{ who: 'scholar', text: '독립문을 볼 때마다 마음이 든든하오.' }],
    },
    seojaepil: {
      wait: [{ who: 'seojaepil', text: '한성 사람들이 요즘 무슨 이야기를 하는지 먼저 모두 들어 보고 오세요.' }],
      first: [
        { who: 'seojaepil', text: '나는 정부의 지원을 받아 독립신문을 펴냈습니다. 나라 안팎의 소식을 알리고 자주독립을 강조하지요.', src: ['S51', 'S53'] },
        { who: 'seojaepil', text: '관리, 지식인과 함께 독립 협회를 만들고 이 독립문을 세웠습니다.', src: ['S51', 'S52'] },
        { who: 'seojaepil', text: '오늘은 환구단에서 임금께서 황제 자리에 오르시는 날입니다. 가서 지켜보세요.', src: ['S54'] },
        { who: 'me', text: '환구단에 가서 지켜보겠습니다!' },
      ],
      later: [{ who: 'seojaepil', text: '신문과 독립문으로 자주독립의 뜻을 널리 알릴 것입니다.' }],
    },
  },
  // 환구단 즉위식(탐험 끝 장면): 사람들이 지켜보는 가운데 고종이 제단에 올라 황제로 즉위한다. 예전 역사책 「대한 제국」 쪽과 고종 대사를 그대로
  coronation: {
    lines: [
      { who: 'gojong', text: '나는 러시아 공사관에 머문 지 1년 만에 경운궁으로 돌아왔다.', src: ['S51', 'S54'] },
      { who: 'narr', text: '고종은 환구단에서 황제로 즉위하고, 나라 이름을 대한 제국으로 바꾸었어요.', src: ['S51', 'S54'] },
      { who: 'narr', text: '환구단은 황제가 하늘에 제사를 지내던 제단이에요. 지금은 황궁우만 남아 있어요.', src: ['S51'] }, // 예전 「환구단」 안내판 내용(D-30 C-03)
      { who: 'gojong', text: '여러 개혁을 펼쳐 근대 국가로 나아갈 것이다.', src: ['S51'] },
    ],
  },
  parts: {
    paper: {
      type: 'drive', src: ['S53'], title: '독립신문을 받아 한성 거리에 배달해요', counter: '배달한 곳', seconds: 150,
      howto: '신문사에서 신문 뭉치를 두 손에 받아 들고, 빛나는 곳을 차례로 지나며 신문을 건네요. 건네는 동안 잠깐 기다려요.',
      intro: [{ who: 'narr', text: '독립신문은 1896년에 창간한 우리나라 최초의 민간 신문이에요.', src: ['S53'] }, { who: 'seojaepil', text: '오늘 신문이 나왔습니다. 한성 사람들에게 나라 안팎의 소식을 전해 주세요!' }],
      route: [
        { label: '독립신문사', hold: 3, holdLabel: '신문 뭉치 받는 중', holdSay: '신문사 사람이 갓 찍은 신문 뭉치를 건네줘요.', look: 'seojaepil', give: true },
        { label: '종로 가게', hold: 2, holdLabel: '신문 건네는 중', hand: true, talk: [{ who: 'citizen', text: '한글로 쓰여 있어서 누구나 읽을 수 있네요!' }] },
        { label: '궁궐 앞 거리', hold: 2, holdLabel: '신문 건네는 중', hand: true, talk: [{ who: 'citizen', text: '신문 덕분에 나라 사정을 알 수 있어 좋아요.' }] },
        { label: '시장', hold: 2, holdLabel: '신문 건네는 중', hand: true, say: '시장 사람들도 신문을 돌려 읽어요.' },
        { label: '서재필 선생', talk: [{ who: 'seojaepil', text: '수고했어요. 신문으로 자주독립의 뜻을 널리 알릴 수 있습니다.' }] },
      ],
      fail: '화살표를 따라 빛나는 곳으로 가요. 시간 안에 모두 배달해요.',
    },
    // 종로 만민 공동회(D-33): 시민에게 말을 걸면 종로로 가서 연단의 연설을 듣는다
    speech: {
      type: 'scene', title: '종로 만민 공동회',
      intro: [ // 시민에게 말을 걸면(C-05)
        { who: 'citizen', text: '종로에서 만민 공동회가 열린대요! 누구나 나라 일에 대한 생각을 말할 수 있대요.', src: ['S52'] },
        { who: 'citizen', text: '함께 가서 연설을 들어 봐요.' },
      ],
      lines: [
        { who: 'narr', text: '첫 만민 공동회는 1898년 종로에서 열렸어요.', src: ['S52'] }, // 예전 「만민 공동회」 안내판 내용(D-30 C-03)
        { who: 'speaker', text: '여러분! 이 자리에서는 신분과 상관없이 누구나 나라 일에 대한 생각을 말할 수 있소!' },
        { who: 'narr', text: '독립 협회는 만민 공동회를 열어 누구나 사회 문제에 대해 자기 생각을 말할 수 있게 했어요.', src: ['S51'] },
        { who: 'speaker', text: '우리 모두 나라의 자주독립을 지켜 나갑시다!' },
        { who: 'speaker', text: '이제 둘레 사람들의 이야기를 들어 보시오. 맞는 말인지 잘 가려 보시오.' },
      ],
    },
    // 시민들의 말 가려내기(judge): 맞는 말은 출처 있는 사실 그대로, 틀린 말은 교과서 사실을 살짝 바꾼 것
    forum: {
      type: 'judge', src: ['S51'], title: '시민들의 말이 맞는지 가려내요', counter: '들은 이야기',
      howto: '종로에 모인 시민에게 다가가 대화 버튼을 눌러 이야기를 듣고, 그 말이 맞는지 골라요.',
      question: '이 사람의 말이 맞나요?', options: ['맞아요', '아니에요'],
      items: [
        { look: 'woman', talk: [{ who: 'woman', text: '독립신문은 한문으로만 쓰여 있어서 양반만 읽을 수 있다던데요?' }], correct: false,
          why: '독립신문은 한글로 써서 누구나 읽을 수 있었어요.' },
        { look: 'scholar', talk: [{ who: 'elder', text: '독립 협회가 서대문 밖에 독립문을 세웠지요.' }], correct: true,
          after: [{ who: 'speaker', text: '그렇소. 독립 협회는 관리, 지식인과 함께 만들어 독립문을 세웠소.', src: ['S51', 'S52'] }] },
        { look: 'commoner', talk: [{ who: 'merchant', text: '을미사변 뒤에 임금께서 청나라 공사관으로 몸을 피하셨다지요?' }], correct: false,
          why: '을미사변 뒤 고종은 러시아 공사관으로 몸을 피했어요.' },
        { look: 'citizen', talk: [{ who: 'youth', text: '임금께서 환구단에서 황제가 되시고, 나라 이름을 대한 제국으로 바꾸셨어요.' }], correct: true,
          after: [{ who: 'narr', text: '1897년, 고종은 환구단에서 황제로 즉위하고 대한 제국을 세웠어요.', src: ['S51', 'S54'] }] },
        { look: 'commoner', talk: [{ who: 'citizen', text: '만민 공동회에서는 양반만 연단에 올라 말할 수 있다오.' }], correct: false,
          why: '만민 공동회에서는 신분과 상관없이 누구나 자기 생각을 말할 수 있었어요.' },
      ],
      fail: '연설과 지금까지 본 일을 떠올려 봐요. 독립신문은 한글, 고종이 몸을 피한 곳은 러시아 공사관이었어요.',
      done: [{ who: 'narr', text: '을미사변 뒤 고종은 몸을 피해 러시아 공사관으로 옮겼어요. 그 뒤 경운궁으로 돌아와 대한 제국을 세웠어요.', src: ['S54'] }],
    },
  },
  result: [{ who: 'narr', text: '대한 제국은 여러 개혁을 추진해 근대 국가로 나아가고자 했어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1896, question: '서재필이 펴낸 신문은?', options: ['황성신문', '독립신문', '대한매일신보'], answer: 1, explain: '서재필은 1896년 독립신문을 펴냈어요.', src: ['S51', 'S53'] },
    { kind: 'quiz', year: 1897, question: '1897년 고종이 바꾼 나라 이름은?', options: ['대한 제국', '조선', '고려'], answer: 0, explain: '고종은 환구단에서 황제로 즉위하고 대한 제국을 세웠어요.', src: ['S51'] },
  ],
};
