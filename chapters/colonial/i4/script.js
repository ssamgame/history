// 일제 강점기편 4장 「봉오동 전투와 청산리 대첩」. 사실은 비상 5-2 교과서 128쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '독립군', mark: '軍', color: '#5a6448', look: 'independenceArmy' },
    hongbeomdo: { name: '홍범도', mark: '洪', color: '#4e5840', look: 'hongbeomdo' },
    kimjwajin: { name: '김좌진', mark: '金', color: '#4e5840', look: 'kimjwajin' },
  },
  intro: [
    { who: 'narr', text: '나라 밖에서도 독립운동과 저항이 이어졌어요. 만주에서는 독립군 부대들이 일본군과 맞서 싸웠어요.', src: ['S51'] },
    { who: 'narr', text: '1920년, 홍범도가 이끄는 독립군 부대는 만주 봉오동 일대에서 일본군을 크게 무찔렀어요(봉오동 전투).', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '여기는 만주의 깊은 산골짜기야. 가파른 산과 솔숲 사이에 독립군이 천막을 치고 있어.' },
    { who: 'guide', text: '나라를 빼앗겼는데도 왜 이 먼 곳까지 왔을까? 천막 앞 독립군에게 먼저 물어보자.' },
  ],
  goals: ['독립군에게 말을 걸어 보자', '홍범도를 만나자', '김좌진을 찾아가자', '청산리에서 싸우자', '배운 내용을 확인해 보자'],
  minigameTitle: '청산리 대첩',
  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '봉오동에서 진 일본군이 더 많은 군대를 이끌고 다시 쳐들어온대.', src: ['S51'] },
        { who: 'soldier', text: '홍범도 장군님이 진영 위쪽에 계셔.' },
      ],
      later: [{ who: 'soldier', text: '이 골짜기는 길이 좁고 숲이 깊어. 홍범도 장군님은 길 건너 진영 위쪽에 계셔. 얼른 가 봐.' }],
    },
    hongbeomdo: {
      tooEarly: [{ who: 'hongbeomdo', text: '진영의 대원들이 어떤 각오로 여기 왔는지 먼저 들어 보게.' }],
      first: [
        { who: 'hongbeomdo', text: '봉오동에서 우리는 일본군을 공격해 크게 무찔렀네.', src: ['S51'] },
        { who: 'hongbeomdo', text: '이번에는 김좌진 장군의 부대와 힘을 합칠 것이네.', src: ['S51'] },
      ],
      later: [{ who: 'hongbeomdo', text: '이번 싸움은 김좌진 장군과 함께하네. 김 장군의 계획도 들어 보게.' }],
    },
    kimjwajin: {
      tooEarly: [{ who: 'kimjwajin', text: '봉오동에서 이긴 홍범도 장군께 먼저 인사드리고 오너라.' }],
      first: [
        { who: 'kimjwajin', text: '청산리 골짜기의 지형을 이용해 일본군과 맞설 것이다.', src: ['S51'] },
        { who: 'kimjwajin', text: '흩어진 부대를 모으고, 적이 골짜기 깊이 들어오면 공격한다!' },
      ],
    },
    signHeroes: { always: [
      { who: 'narr', text: '남자현은 3·1 운동 뒤 만주로 가 독립운동을 했고, 권기옥은 우리나라 최초의 여성 비행사가 되어 독립운동을 도왔어요.', src: ['S51'] },
    ] },
    signUiyeol: { always: [
      { who: 'narr', text: '만주에서 만든 의열단의 단원들은 나라 안팎에서 일제의 고위 관리를 처단하고 식민 통치 기구를 파괴하려 했어요.', src: ['S51'] },
    ] },
  },
  parts: {
    gather: {
      type: 'drive', title: '숲속 진지를 돌며 흩어진 독립군 부대를 모아요', counter: '지난 진지', pickupCounter: '찾은 대원', seconds: 150,
      howto: '빛나는 진지를 차례로 지나가요. 숲에 흩어진 대원을 찾으면 뒤따라와요. 모두 모아야 골짜기 입구로 갈 수 있어요.',
      intro: [
        { who: 'kimjwajin', text: '봉오동에서 진 일본군이 더 많은 군대를 이끌고 다시 쳐들어온다.', src: ['S51'] },
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
    ambush: {
      type: 'ambush', title: '청산리 골짜기: 일본군이 깊이 들어오면 공격 신호!', label: '공격!', counter: '물리친 부대',
      howto: '일본군이 골짜기 한가운데 빛나는 곳에 들어오면 그 위의 「공격!」을 눌러요. 싸움은 세 차례 이어져요.',
      intro: [{ who: 'kimjwajin', text: '골짜기의 지형을 이용한다. 적이 빛나는 곳까지 깊이 들어왔을 때 신호를 보내라!' }],
      waves: [
        { enemies: 4, need: 3, interval: 2.1, speed: 2.8 },
        { enemies: 5, need: 4, interval: 1.7, speed: 3.1, talk: [{ who: 'hongbeomdo', text: '일본군이 다시 밀려온다! 산 위에서 내려다보며 맞서라!' }] },
        { enemies: 6, need: 4, interval: 1.4, speed: 3.4, talk: [{ who: 'kimjwajin', text: '마지막이다! 우리 독립군의 힘을 보여 주자!' }] },
      ],
      fail: '골짜기 한가운데 들어왔을 때 신호를 보내야 해요. 다시 해 봐요.',
      done: [{ who: 'narr', text: '김좌진과 홍범도가 이끄는 독립군 부대는 청산리의 지형을 이용한 전술로 일본군에 큰 승리를 거두었어요(청산리 대첩, 1920년).', src: ['S51'] }],
    },
    // 승리를 이끈 장군: 네 사람 가운데 찾기 대신 이정표를 따라 걸으며 차례로 만난다(선생님 의견, 근대 2장과 같은 방식)
    leaders: {
      type: 'drive', src: ['S51'], title: '청산리 대첩을 이끈 두 장군을 차례로 만나요', counter: '지난 이정표', showAll: true,
      howto: '길 위에 차례대로 선 이정표를 따라 걸어가요. 이정표에 닿으면 그곳 사람이 이야기를 들려줘요.',
      intro: [{ who: 'soldier', text: '승리를 이끈 장군님들께 인사드리러 가요. 이정표를 따라가요.' }],
      route: [
        { label: '1 홍범도', look: 'hongbeomdo', post: true, talk: [{ who: 'hongbeomdo', text: '봉오동에 이어 청산리에서도 일본군을 물리쳤네.', src: ['S51'] }, { who: 'hongbeomdo', text: '나라를 되찾는 날까지 싸움은 계속되네.' }] },
        { label: '2 김좌진', look: 'kimjwajin', post: true, talk: [{ who: 'kimjwajin', text: '청산리 골짜기의 지형을 이용해 일본군과 맞섰다.', src: ['S51'] }, { who: 'kimjwajin', text: '모두가 힘을 합친 덕분이다.' }] },
        { label: '3 독립군 진영', look: 'independenceArmy', post: true, talk: [{ who: 'soldier', text: '두 장군님의 부대가 힘을 합쳐 크게 이겼어요!' }] },
      ],
      fail: '빛나는 이정표를 차례대로 따라 걸어가요.',
      done: [{ who: 'narr', text: '독립군의 승리는 나라를 빼앗긴 우리 민족에게 큰 용기를 주었어요.', src: ['S51'] }],
    },
  },
  result: [{ who: 'narr', text: '독립군의 승리는 나라를 빼앗긴 우리 민족에게 큰 용기를 주었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1920, question: '봉오동 전투에서 독립군을 이끈 사람은?', options: ['홍범도', '김구', '안창호'], answer: 0, explain: '홍범도가 이끄는 독립군 부대가 봉오동에서 일본군을 무찔렀어요.', src: ['S51'] },
    { kind: 'quiz', year: 1920, question: '1920년 독립군이 지형을 이용해 크게 이긴 싸움은?', options: ['한산도 대첩', '귀주 대첩', '청산리 대첩'], answer: 2, explain: '김좌진과 홍범도의 독립군이 청산리에서 크게 이겼어요.', src: ['S51'] },
  ],
};
