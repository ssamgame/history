// 일제 강점기편 6장 「한인 애국단과 한국광복군」. 사실은 비상 5-2 교과서 128~129쪽(S51)과 S55·S56.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '광복군 대원', mark: '光', color: '#6b6a4a', look: 'gwangbokgun' },
    kimgu: { name: '김구', mark: '金', color: '#3a3530', look: 'kimgu' },
    officer: { name: '광복군 지휘관', mark: '將', color: '#6b6a4a', look: 'gwangbokgun' },
  },
  intro: [
    { who: 'narr', text: '1920년대 중반 이후 일제의 감시와 탄압이 심해지면서 대한민국 임시 정부의 활동은 어려워졌어요.', src: ['S51'] },
    { who: 'narr', text: '김구는 임시 정부에 활기를 불어넣고자 한인 애국단을 만들었어요(1931년).', src: ['S51', 'S55'] },
  ],
  start: [
    { who: 'guide', text: '여기는 중국 충칭의 훈련장이야. 흙먼지 날리는 연병장에서 젊은이들이 태극기 아래 줄지어 섰어.' },
    { who: 'guide', text: '이 사람들은 무엇을 준비하고 있을까? 줄 밖에 서 있는 대원에게 먼저 물어보자.' },
  ],
  goals: ['광복군 대원에게 말을 걸어 보자', '김구를 만나자', '광복군 지휘관을 찾아가자', '광복군과 함께 훈련하자', '배운 내용을 확인해 보자'],
  minigameTitle: '광복을 향해',
  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '한인 애국단의 이봉창은 일본 도쿄에서 일본 왕이 탄 마차에 폭탄을 던졌대.', src: ['S51'] },
        { who: 'soldier', text: '윤봉길은 상하이 훙커우 공원의 일본군 행사장에 폭탄을 던져 일본군 사령관과 고위 관리들을 쓰러뜨렸어(1932년).', src: ['S51', 'S55'] },
      ],
      later: [{ who: 'soldier', text: '오늘도 훈련이 고됐지만 다들 눈빛이 살아 있어. 김구 선생님은 깃발 앞에 계셔.' }],
    },
    kimgu: {
      tooEarly: [{ who: 'kimgu', text: '대원들이 왜 여기까지 왔는지 그들에게 먼저 들어 보시오.' }],
      first: [
        { who: 'kimgu', text: '그 뒤 일제의 감시가 심해져 임시 정부는 중국 여러 곳으로 옮겨 다녔소.', src: ['S51'] },
        { who: 'kimgu', text: '충칭에 자리 잡은 뒤 우리 임시 정부는 한국광복군을 만들었소(1940년).', src: ['S51', 'S56'] },
      ],
      later: [{ who: 'kimgu', text: '우리 손으로 나라를 되찾을 날을 준비해야 하오. 지휘관에게 훈련 이야기도 들어 보시오.' }],
    },
    officer: {
      tooEarly: [{ who: 'officer', text: '훈련 이야기는 나중에 하자. 김구 선생님께 먼저 인사드려라.' }],
      first: [
        { who: 'officer', text: '태평양 전쟁이 일어나자 한국광복군은 전쟁에 참여해 일본군에 맞서 싸웠다.', src: ['S51'] },
        { who: 'officer', text: '미군과 함께 국내로 들어가 일제를 몰아낼 계획을 세우고 있다. 훈련에 함께하자!', src: ['S51'] },
      ],
    },
    signFlag: { always: [
      { who: 'narr', text: '한국광복군 대원들은 태극기의 여백에 자신의 이름과 독립에 대한 각오를 적었어요.', src: ['S51'] },
    ] },
    signPacific: { always: [
      { who: 'narr', text: '태평양 전쟁은 일제가 미국 하와이를 기습적으로 공격하여 일어난 전쟁이에요.', src: ['S51'] },
    ] },
  },
  parts: {
    run: {
      type: 'drive', title: '광복군 훈련: 통나무 길과 사격장을 지나 깃발 언덕까지', counter: '지난 곳', pickupCounter: '모은 훈련 깃발', seconds: 150, speed: 1.15,
      howto: '빛나는 곳을 차례로 지나가요. 굴러오는 통나무를 피하고, 사격장에서는 과녁을 겨누는 동안 기다려요. 훈련 깃발도 모두 모아요.',
      intro: [
        { who: 'officer', text: '한국광복군은 충칭에서 만든 임시 정부의 군대다. 나라 안으로 들어갈 날을 준비한다!', src: ['S51', 'S56'] },
        { who: 'officer', text: '훈련 시작! 통나무를 피해 달리고, 훈련 깃발을 모아 언덕까지 올라라!' },
      ],
      route: [
        { label: '출발', say: '"광복군, 훈련 시작!"' },
        { label: '통나무 길', talk: [{ who: 'soldier', text: '헉헉, 통나무가 굴러와요! 잘 보고 피해야 해요.' }] },
        { label: '사격장', hold: 4, holdLabel: '과녁을 겨누는 중', holdSay: '숨을 고르고 과녁을 겨눠요.', talk: [{ who: 'officer', text: '좋다! 태평양 전쟁에서 우리도 일본군과 싸운다.' }] },
        { label: '깃발 언덕', needPickups: true, needSay: '아직 모으지 못한 훈련 깃발이 있어요!',
          talk: [{ who: 'officer', text: '훈련 끝! 미군과 함께 국내로 들어갈 계획을 세우고 있다.' }] },
      ],
      pickups: [{ label: '훈련 깃발' }, { label: '훈련 깃발' }, { label: '훈련 깃발' }],
      bump: '통나무에 부딪혔어요! 앞 지점에서 다시 가요.',
      fail: '화살표를 따라 통나무를 피해서 달려요.',
    },
    sort: {
      type: 'deliver', src: ['S51', 'S55', 'S56'], title: '한인 애국단일까요, 한국광복군일까요? 알맞은 깃발 아래로 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 글을 들고 「한인 애국단」이나 「한국광복군」 가운데 알맞은 깃발 아래 원 안에 들어가 잠깐 서 있어요. 그러면 처음 자리에서 다음 글을 들어요.',
      intro: [{ who: 'kimgu', text: '나는 한인 애국단을 만들었고, 임시 정부는 한국광복군을 만들었소. 일을 알맞은 쪽으로 나눠 주시오.' }],
      bins: [{ id: 'aegukdan', label: '한인 애국단' }, { id: 'gwangbok', label: '한국광복군' }],
      cards: [
        { text: '이봉창이 도쿄에서 의거를 일으켰다', bin: 'aegukdan' },
        { text: '충칭에서 만든 임시 정부의 군대다', bin: 'gwangbok' },
        { text: '윤봉길이 훙커우 공원에서 의거를 일으켰다', bin: 'aegukdan', talk: [{ who: 'kimgu', text: '윤봉길의 의거로 중국도 우리 독립운동을 돕게 되었소.' }] },
        { text: '태평양 전쟁에 참여해 일본군과 싸웠다', bin: 'gwangbok' },
        { text: '미군과 함께 국내로 들어갈 계획을 세웠다', bin: 'gwangbok', talk: [{ who: 'officer', text: '하지만 일제가 갑자기 항복해서 그 계획은 실행하지 못했지.' }] },
      ],
      fail: '한 사람 한 사람의 의거는 한인 애국단, 군대를 만들어 싸운 것은 한국광복군이에요.',
    },
  },
  result: [{ who: 'narr', text: '하지만 일제가 갑자기 항복하면서 한국광복군의 국내 진공 계획은 실행하지 못했어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1931, question: '한인 애국단을 만든 사람은?', options: ['김구', '서재필', '전봉준'], answer: 0, explain: '김구가 한인 애국단을 만들었어요.', src: ['S51'] },
    { kind: 'quiz', year: 1940, question: '임시 정부가 충칭에서 만든 군대는?', options: ['의병', '한국광복군', '별무반'], answer: 1, explain: '임시 정부는 충칭에서 한국광복군을 만들었어요.', src: ['S51'] },
  ],
};
