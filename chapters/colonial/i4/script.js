// 일제 강점기편 4장 「봉오동 전투와 청산리 대첩」(D-42). 사실은 비상 5-2 교과서 128쪽(S51).
// 탐험: 「독립군 진영」 문으로 들어와 독립군 대원·홍범도·남자현 이야기를 아무 차례로 듣고(모두 들어야 김좌진),
// 김좌진에게 가면 학생의 결심 → 봉오동 골짜기 양쪽 숲에 숨은 홍범도 부대가 들어온 일본군을 무찌르는 장면.
// 놀이: 흩어진 부대 모으기 → 김좌진에게 말을 걸면 청산리 골짜기 산비탈 풀숲에 엎드려 매복 →
// 홍범도에게 말을 걸면 승리한 진영 걷기(홍범도 → 김좌진 → 모닥불 가 대원들).
// 예전 안내판(여성 독립운동가·의열단)과 이정표 걷기의 출처 있는 문장은 사람 대사·장면으로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#22262e' },
    soldier: { name: '독립군', mark: '軍', color: '#5a6448', look: 'independenceArmy' },
    hongbeomdo: { name: '홍범도', mark: '洪', color: '#4e5840', look: 'hongbeomdo' },
    kimjwajin: { name: '김좌진', mark: '金', color: '#4e5840', look: 'kimjwajin' },
    namjahyeon: { name: '남자현', mark: '南', color: '#6b6152', look: 'woman' },
  },
  intro: [
    { who: 'narr', text: '나라 밖에서도 독립운동과 저항이 이어졌어요.', src: ['S51'] },
    { who: 'narr', text: '만주에서는 독립군 부대들이 일본군과 맞서 싸웠어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '여기는 만주의 깊은 산골짜기야. 가파른 산과 솔숲 사이에 독립군이 천막을 치고 있어.' },
    { who: 'guide', text: '나라를 빼앗겼는데도 왜 이 먼 곳까지 왔을까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['독립군 진영 사람들의 이야기를 모두 들어 보자', '김좌진을 찾아가자', '봉오동 골짜기의 싸움을 지켜보자', '흩어진 독립군 부대를 모으자', '청산리 골짜기에서 일본군을 막자', '승리한 진영을 돌아보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 김좌진을 찾아가자.' },
  minigameTitle: '청산리 대첩',
  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '만주에서 만든 의열단의 단원들은 나라 안팎에서 일제의 고위 관리를 처단하고 식민 통치 기구를 파괴하려 했대.', src: ['S51'] },
        { who: 'soldier', text: '우리는 총을 들고 싸워. 언젠가 나라를 되찾을 거야.' },
      ],
      bridge: { who: 'soldier', text: '다른 분들도 만났구나. 나도 한마디 할게.' },
      later: [{ who: 'soldier', text: '이 골짜기는 길이 좁고 숲이 깊어.' }],
    },
    hongbeomdo: {
      first: [
        { who: 'hongbeomdo', text: '나는 독립군 부대를 이끌고 만주에서 일본군과 맞서 싸우고 있네.', src: ['S51'] },
        { who: 'hongbeomdo', text: '일본군이 봉오동 골짜기 쪽으로 온다는 소식이 들어왔네. 우리 부대는 골짜기 양쪽 숲에 숨어 기다릴 것이네.' },
      ],
      bridge: { who: 'hongbeomdo', text: '여러 사람을 만나고 왔구먼. 내 이야기도 들어 보게.' },
      later: [{ who: 'hongbeomdo', text: '김좌진 장군에게도 가 보게.' }],
    },
    namjahyeon: {
      first: [
        { who: 'namjahyeon', text: '저는 3·1 운동 뒤 만주로 와서 독립운동을 하고 있어요.', src: ['S51'] },
        { who: 'namjahyeon', text: '권기옥은 우리나라 최초의 여성 비행사가 되어 독립운동을 도왔대요.', src: ['S51'] },
      ],
      bridge: { who: 'namjahyeon', text: '벌써 여러 분을 만났군요. 제 이야기도 들어 보세요.' },
      later: [{ who: 'namjahyeon', text: '여자든 남자든 나라를 되찾는 일에 함께해요.' }],
    },
    kimjwajin: {
      wait: [{ who: 'kimjwajin', text: '진영 사람들의 이야기를 먼저 모두 듣고 오너라. 그다음에 할 일을 말해 주마.' }],
      first: [
        { who: 'kimjwajin', text: '방금 홍범도 장군의 부대가 봉오동 골짜기로 나갔다.' },
        { who: 'kimjwajin', text: '골짜기 높은 곳에서 함께 지켜보자.' },
        { who: 'me', text: '저도 독립군과 함께 싸우겠습니다!' },
      ],
      later: [{ who: 'kimjwajin', text: '흩어진 부대를 모아 청산리로 간다.' }],
    },
  },
  // 탐험 끝 장면: 봉오동 골짜기 양쪽 숲에 숨은 홍범도 부대가 골짜기에 들어온 일본군을 무찌른다
  bongo: {
    lines: [
      { who: 'guide', text: '골짜기 양쪽 숲에 독립군이 숨어 있어. 저 아래 길로 일본군이 들어와.' },
      { who: 'hongbeomdo', text: '조금만 더 깊이 들어오게 두어라. 지금이다, 쏴라!' },
      { who: 'narr', text: '1920년, 홍범도가 이끄는 독립군 부대는 만주 봉오동 일대에서 일본군을 크게 무찔렀어요(봉오동 전투).', src: ['S51'] },
      { who: 'kimjwajin', text: '봉오동에서 진 일본군이 더 많은 군대를 이끌고 다시 쳐들어온다.', src: ['S51'] },
    ],
  },
  parts: {
    gather: {
      type: 'drive', title: '숲속 진지를 돌며 흩어진 독립군 부대를 모아요', counter: '지난 진지', pickupCounter: '찾은 대원', seconds: 150,
      howto: '빛나는 진지를 차례로 지나가요. 숲에 흩어진 대원을 찾으면 뒤따라와요. 모두 모아야 골짜기 입구로 갈 수 있어요.',
      intro: [ // 봉오동 장면 뒤 바로(김좌진)
        { who: 'kimjwajin', text: '이번에는 홍범도 장군의 부대와 우리 부대가 힘을 합칠 것이다.', src: ['S51'] },
        { who: 'kimjwajin', text: '흩어진 부대를 모아 청산리 골짜기로 가자!' },
      ],
      route: [
        { label: '첫째 진지', talk: [{ who: 'soldier', text: '장군님, 저희도 함께 싸우겠습니다!' }] },
        { label: '둘째 진지', talk: [{ who: 'hongbeomdo', text: '잘 왔네. 우리 부대도 김좌진 장군의 부대와 함께 청산리로 가겠네.' }] },
        { label: '셋째 진지', say: '흩어졌던 부대가 다시 모였어요.' },
        { label: '청산리 골짜기 입구', needPickups: true, needSay: '아직 숲에 남은 대원이 있어요! 화살표를 따라가 봐요.',
          talk: [{ who: 'kimjwajin', text: '모두 골짜기 양쪽 산에 숨어 기다려라. 적이 깊이 들어오면 공격한다!' }] },
      ],
      pickups: [{ label: '대원', follow: 'independenceArmy' }, { label: '대원', follow: 'independenceArmy' }, { label: '대원', follow: 'independenceArmy' }],
      fail: '화살표가 가리키는 빛나는 곳으로 가요.',
    },
    // 청산리 매복(D-42): 근대 6장 고갯길처럼 독립군이 골짜기 양쪽 산비탈 풀숲에 엎드려 총을 겨누고 있다가 쏜다
    ambush: {
      type: 'ambush', src: ['S51'], title: '청산리 골짜기: 산비탈 풀숲에 숨어 일본군을 막아요', label: '공격!', counter: '물리친 부대',
      howto: '독립군이 골짜기 산비탈 풀숲에 엎드려 총을 겨누고 있어요. 일본군이 빛나는 곳에 들어오면 「공격!」을 눌러요. 세 차례 이어져요.',
      intro: [ // 김좌진에게 말을 걸면(C-05)
        { who: 'kimjwajin', text: '청산리 골짜기의 지형을 이용해 일본군과 맞설 것이다.', src: ['S51'] },
        { who: 'kimjwajin', text: '산비탈 풀숲에 엎드려 총을 겨누어라. 적이 빛나는 곳까지 깊이 들어오면 공격이다!' },
      ],
      waves: [
        { enemies: 4, need: 3, interval: 2.1, speed: 2.8 },
        { enemies: 5, need: 4, interval: 1.7, speed: 3.1, talk: [{ who: 'hongbeomdo', text: '일본군이 다시 밀려온다! 물러서지 마라!' }] },
        { enemies: 6, need: 4, interval: 1.4, speed: 3.4, talk: [{ who: 'kimjwajin', text: '마지막이다! 우리 독립군의 힘을 보여 주자!' }] },
      ],
      fail: '골짜기 한가운데 들어왔을 때 신호를 보내야 해요. 다시 해 봐요.',
      done: [{ who: 'narr', text: '김좌진과 홍범도가 이끄는 독립군 부대는 청산리의 지형을 이용한 전술로 일본군에 큰 승리를 거두었어요(청산리 대첩, 1920년).', src: ['S51'] }],
    },
    // 승리한 진영 걷기(D-42): 이정표 걷기 대신 빛나는 자리로 걸어가 대화 버튼으로 겪는다(장면이라 첫 시도 점수에는 넣지 않는다)
    victory: {
      type: 'scene', title: '승리한 독립군 진영',
      howto: '빛나는 자리로 걸어가 대화 버튼을 눌러요. 승리를 이끈 사람들을 차례로 만나요.',
      intro: [ // 홍범도에게 말을 걸면(C-05)
        { who: 'hongbeomdo', text: '잘 싸워 주었네! 진영으로 돌아가 승리를 함께 나누세.' },
        { who: 'hongbeomdo', text: '빛나는 자리에 가서 대화 버튼을 누르게.' },
      ],
      stations: [
        { id: 'hong', label: '홍범도', act: '홍범도와 이야기하기', lines: [
          { who: 'hongbeomdo', text: '봉오동에 이어 청산리에서도 일본군을 물리쳤네.', src: ['S51'] },
          { who: 'hongbeomdo', text: '나라를 되찾는 날까지 싸움은 계속되네.' },
        ] },
        { id: 'kim', label: '김좌진', act: '김좌진과 이야기하기', lines: [
          { who: 'kimjwajin', text: '김좌진과 홍범도의 부대가 청산리의 지형을 이용해 일본군과 맞섰다.', src: ['S51'] },
          { who: 'kimjwajin', text: '모두가 힘을 합친 덕분이다.' },
        ] },
        { id: 'camp', label: '모닥불', act: '대원들과 만세 부르기', lines: [
          { who: 'soldier', text: '대한 독립 만세!' },
          { who: 'narr', text: '독립군의 승리는 나라를 빼앗긴 우리 민족에게 큰 용기를 주었어요.', src: ['S51'] },
        ] },
      ],
    },
  },
  result: [{ who: 'narr', text: '독립군의 승리는 나라를 빼앗긴 우리 민족에게 큰 용기를 주었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1920, question: '봉오동 전투에서 독립군을 이끈 사람은?', options: ['홍범도', '김구', '안창호'], answer: 0, explain: '홍범도가 이끄는 독립군 부대가 봉오동에서 일본군을 무찔렀어요.', src: ['S51'] },
    { kind: 'quiz', year: 1920, question: '1920년 독립군이 지형을 이용해 크게 이긴 싸움은?', options: ['한산도 대첩', '귀주 대첩', '청산리 대첩'], answer: 2, explain: '김좌진과 홍범도의 독립군이 청산리에서 크게 이겼어요.', src: ['S51'] },
  ],
};
