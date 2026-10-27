// 조선편 4장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 4장 절을 따른다.
// 거북선이 학익진 앞에 섰다는 것은 S43(여러 자료에서 확인). 전투는 불길 없이 연기와 물러남으로 보여 준다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    navy: { name: '조선 수군', mark: '水', color: '#2f4a5e', look: 'navy' },
    commoner: { name: '포구 백성', mark: '民', color: '#6b4a32', look: 'commoner' },
    yisunsin: { name: '이순신', mark: '李', color: '#7a2a1e', look: 'yisunsin' },
  },

  intro: [
    { who: 'narr', text: '1592년 4월, 일본군이 부산으로 쳐들어왔어요. 이 전쟁을 임진왜란이라고 해요.', src: ['S34'] },
    { who: 'narr', text: '일본군은 빠르게 북쪽으로 올라왔고, 선조는 의주까지 피란했어요.', src: ['S34'] },
  ],

  start: [
    { who: 'guide', text: '너는 이순신 함대의 젊은 수군이야. 포구에 우리 배들이 모여 있어.' },
    { who: 'guide', text: '바다 건너 일본군이 몰려온다는 소문이 돌고 있어. 부두의 수군에게 먼저 소식을 물어보자.' },
  ],

  goals: ['부두의 수군에게 말을 걸어 보자', '포구 백성의 이야기를 들어 보자', '지휘하는 이순신을 찾아가자', '한산도 앞바다에서 싸우자', '배운 내용을 확인해 보자'],

  npc: {
    navy: {
      first: [
        { who: 'navy', text: '저 배가 거북선이야. 이순신 장군께서 군관들과 함께 고쳐 만드셨대.', src: ['S36'] },
        { who: 'navy', text: '덮개 위에는 칼과 송곳을 꽂았고, 앞에는 용머리가 있지.', src: ['S36'] },
        { who: 'navy', text: '거북선은 사천 앞바다 싸움에 처음 나섰어.', src: ['S37'] },
      ],
      later: [{ who: 'navy', text: '포구의 백성들도 소식을 많이 알고 있어.' }],
    },
    commoner: {
      tooEarly: [{ who: 'commoner', text: '부두의 수군에게 먼저 가 보세요.' }],
      first: [
        { who: 'commoner', text: '곽재우 같은 사람들이 고향을 지키려고 스스로 의병을 일으켰대요.', src: ['S34'] },
        { who: 'commoner', text: '이순신 장군님은 저쪽 지휘소에 계세요.' },
      ],
      later: [{ who: 'commoner', text: '육지 소식은 늘 나빠요. 바다만큼은 꼭 지켜 주세요.' }],
    },
    signPanok: { always: [
      { who: 'narr', text: '판옥선은 조선 수군의 주력 전투선이에요.', src: ['S50'] },
      { who: 'narr', text: '갑판이 2층이라 노 젓는 군사는 아래층에서, 싸우는 군사는 위층에서 일을 나누었어요.', src: ['S50'] },
    ] },
    signTurtle: { always: [
      { who: 'narr', text: '거북선은 판옥선 위를 덮개로 덮고 칼과 송곳을 꽂은 배예요.', src: ['S36'] },
      { who: 'narr', text: '앞의 용머리 입은 총구멍으로 썼어요.', src: ['S36'] },
    ] },
    signWar: { always: [
      { who: 'narr', text: '임진왜란은 1592년부터 1598년까지 7년 동안 이어졌어요.', src: ['S34'] },
      { who: 'narr', text: '1598년 노량 해전에서 이순신이 전사했어요.', src: ['S34'] },
    ] },
    yisunsin: {
      tooEarly: [{ who: 'yisunsin', text: '먼저 부두와 포구를 둘러보아라.' }],
      first: [
        { who: 'yisunsin', text: '적의 배들이 견내량에 모여 있다.', src: ['S35'] },
        { who: 'yisunsin', text: '견내량은 좁고 암초가 많다. 적을 넓은 한산도 앞바다로 끌어내자.', src: ['S35'] },
        { who: 'yisunsin', text: '배에 올라라. 출전이다!' },
      ],
    },
  },

  lure: {
    howto: [{ who: 'guide', text: '앞장선 배 몇 척이 견내량으로 들어가 적을 꾀어내 보자. 적이 우리를 보면 배를 돌려!' }],
    early: '너무 일찍 돌렸어요. 우리 배가 견내량 입구(빛나는 곳)에 닿아 적이 볼 때까지 기다려요.',
    late: '너무 늦었어요. 좁은 견내량 안으로 깊이 들어가면 위험해요. 입구에 닿았을 때 돌려요.',
    done: [{ who: 'guide', text: '적의 배들이 우리 배를 쫓아 넓은 바다로 나왔어!' }],
  },
  wing: {
    title: '학익진: 학이 날개를 편 모양으로 배를 늘어세워요',
    fail: '학이 날개를 펼친 것처럼 둥글게 휜 자리에 놓아요. 곧은 줄이나 뒤쪽 자리가 아니에요.',
    done: [{ who: 'narr', text: '이순신은 거북선을 앞세우고, 학이 날개를 편 모양으로 배를 늘어세우는 학익진으로 적을 둘러쌌어요.', src: ['S35', 'S43'] }],
  },
  attack: {
    howto: [{ who: 'yisunsin', text: '적이 날개 안으로 모두 들어오면 한꺼번에 공격한다. 신호를 기다려라.' }],
    early: '너무 일찍 신호를 보냈어요. 적의 배가 날개 안(빛나는 원)으로 다 들어올 때까지 기다려요.',
    late: '너무 늦었어요. 적의 배가 날개를 빠져나가기 전에 신호를 보내요.',
  },
  result: [
    { who: 'narr', text: '1592년 7월, 조선 수군은 한산도 앞바다에서 일본 배를 크게 물리쳤어요. 이 싸움을 한산도 대첩이라고 해요.', src: ['S35'] },
    { who: 'narr', text: '조선 수군은 남쪽 바다를 지켜 냈어요.', src: ['S34', 'S35'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1592, question: '임진왜란 때 나라를 지키려고 스스로 일어난 사람들은?', options: ['삼별초', '의병', '집현전 학자'], answer: 1, explain: '곽재우 같은 의병이 각지에서 일어났어요.', src: ['S34'] },
    { kind: 'quiz', year: 1592, question: '한산도 대첩에서 이순신이 쓴 진법은?', options: ['물막이 작전', '학익진', '성 쌓기'], answer: 1, explain: '학이 날개를 편 모양으로 배를 늘어세워 적을 둘러쌌어요.', src: ['S35'] },
  ],
};
