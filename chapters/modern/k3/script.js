// 근대편 3장 「동학 농민 운동과 갑오개혁」. 사실은 비상 5-2 교과서 100쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    peasant: { name: '고부 농민', mark: '農', color: '#7a4e32', look: 'peasant' },
    jeonbongjun: { name: '전봉준', mark: '全', color: '#8a2f24', look: 'jeonbongjun' },
    farmer: { name: '농민군', mark: '軍', color: '#6b4a32', look: 'uibyeong' },
  },
  intro: [
    { who: 'narr', text: '개항 뒤 늘어난 세금과 탐관오리의 수탈로 백성의 생활은 어려워졌어요.', src: ['S51'] },
    { who: 'narr', text: '특히 전라도 고부에서는 군수의 횡포에 농민의 불만이 커졌어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1894년 전라도 고부야. 누렇게 익은 논이 끝없이 펼쳐졌는데, 이상하게도 농민들의 얼굴은 어두워.' },
    { who: 'guide', text: '풍년인데 왜 걱정일까? 마을 어귀의 농민에게 사정을 물어보자.' },
  ],
  goals: ['고부 농민에게 말을 걸어 보자', '전봉준을 찾아가자', '농민군의 이야기를 들어 보자', '농민군과 함께하자', '배운 내용을 확인해 보자'],
  minigameTitle: '동학 농민 운동',
  npc: {
    peasant: {
      first: [
        { who: 'peasant', text: '세금이 자꾸 늘어서 먹고살기가 너무 힘들어요.', src: ['S51'] },
        { who: 'peasant', text: '고부 군수는 백성을 괴롭히기만 해요.', src: ['S51'] },
      ],
      later: [{ who: 'peasant', text: '농사를 지어도 남는 게 없어요. 전봉준 장군님이 앞장서 주신다니 마음이 놓여요.' }],
    },
    jeonbongjun: {
      tooEarly: [{ who: 'jeonbongjun', text: '농민들이 얼마나 힘든지 먼저 그들에게 직접 들어 보게.' }],
      first: [
        { who: 'jeonbongjun', text: '나는 동학의 지도자 전봉준이오. 군수의 횡포를 더는 참을 수 없소.', src: ['S51'] },
        { who: 'jeonbongjun', text: '농민들과 함께 고부 관아를 습격할 것이오.', src: ['S51'] },
      ],
      later: [{ who: 'jeonbongjun', text: '혼자서는 아무것도 바꿀 수 없네. 마을을 돌며 뜻을 함께할 농민들을 모아 주게.' }],
    },
    farmer: {
      tooEarly: [{ who: 'farmer', text: '우리를 이끌 분은 전봉준 장군님이시네. 장군님 말씀부터 듣고 오게.' }],
      first: [
        { who: 'farmer', text: '고부에서 시작한 우리 운동이 큰 농민 운동이 되었어.', src: ['S51'] },
        { who: 'farmer', text: '마을마다 다니며 함께할 농민들을 모으자!' },
      ],
    },
    signDonghak: { always: [
      { who: 'narr', text: '동학은 조선 후기에 최제우가 만든 종교로, 모든 사람이 평등하다고 주장해 백성 사이에 널리 퍼졌어요.', src: ['S51'] },
    ] },
    signGabo: { always: [
      { who: 'narr', text: '정부는 갑신정변의 개혁안과 동학 농민군의 요구를 일부 받아들여 갑오개혁을 했어요(1894년).', src: ['S51'] },
      { who: 'narr', text: '갑오개혁으로 신분제와 과거제가 없어졌어요.', src: ['S51'] },
    ] },
  },
  parts: {
    gather: {
      type: 'drive', title: '마을을 돌며 농민군을 모아요', counter: '지난 마을', pickupCounter: '모은 농민', seconds: 150,
      howto: '빛나는 마을 어귀를 차례로 지나가요. 들판에서 일하는 농민을 찾으면 뒤따라와요. 모두 모아 고부 관아 앞으로 가요.',
      intro: [
        { who: 'jeonbongjun', text: '나는 동학의 지도자 전봉준이오. 군수의 횡포를 더는 참을 수 없소.' },
        { who: 'jeonbongjun', text: '마을을 돌며 함께할 농민들을 모아 주게.' },
      ],
      route: [
        { label: '윗마을', talk: [{ who: 'peasant', text: '세금이 자꾸 늘어서 먹고살기가 너무 힘들어요. 저도 함께 가겠어요!' }] },
        { label: '냇가 마을', say: '농민들이 하나둘 모여들었어요.' },
        { label: '장터', talk: [{ who: 'farmer', text: '"백성을 괴롭히는 탐관오리를 몰아내자!"' }] },
        { label: '고부 관아 앞', needPickups: true, needSay: '아직 들판에 남은 농민이 있어요! 화살표를 따라가 봐요.',
          talk: [{ who: 'jeonbongjun', text: '모두 모였구나. 이제 고부 관아로 가자!' }] },
      ],
      pickups: [{ label: '농민', follow: 'peasant', say: '농민이 함께해요!' }, { label: '농민', follow: 'peasant', say: '농민이 함께해요!' }, { label: '농민', follow: 'commoner', say: '농민이 함께해요!' }],
      fail: '화살표가 가리키는 빛나는 곳으로 걸어가요.',
      done: [{ who: 'narr', text: '전봉준이 이끈 농민들의 봉기는 큰 농민 운동이 되었어요. 이것을 동학 농민 운동이라고 해요.', src: ['S51'] }],
    },
    // 고부 관아를 차지하는 장면(선생님 의견으로 넣음). 조병갑은 농민군이 온다는 소식에 미리 전주로 달아났다(S65).
    gobu: {
      type: 'scene', title: '고부 관아로',
      lines: [
        { who: 'narr', text: '1894년 1월, 전봉준이 이끄는 농민 1천여 명이 고부 관아로 몰려갔어요.', src: ['S65'] },
        { who: 'narr', text: '농민군이 온다는 소식에 군수 조병갑은 관아를 버리고 전주로 달아났어요.', src: ['S65'] },
        { who: 'narr', text: '농민군은 관아를 차지하고, 억울하게 거두어 간 곡식을 농민들에게 나누어 주었어요.', src: ['S65'] },
        { who: 'narr', text: '정부는 조병갑을 군수 자리에서 쫓아냈어요.', src: ['S65'] },
      ],
    },
    // 농민군의 요구: 찾아다니지 않고 문서로 바로 본다(선생님 의견)
    demands: {
      type: 'doc', src: ['S51'], title: '농민군이 나라에 바란 것', heading: '농민군의 요구',
      docIntro: '농민군이 나라에 바라는 것을 적은 문서예요. 하나씩 읽어 보아요.',
      intro: [{ who: 'farmer', text: '우리가 나라에 바라는 것들을 적어 두었어. 읽어 봐!' }],
      items: [
        { text: '탐관오리를 모두 쫓아낼 것', note: '백성을 괴롭히는 나쁜 관리를 몰아내 달라는 뜻이에요.' },
        { text: '관직을 파는 사람들을 모두 쫓아낼 것', note: '돈을 받고 벼슬을 파는 일을 없애 달라는 뜻이에요.' },
        { text: '집마다 매기는 여러 가지 세금을 줄일 것', note: '세금이 너무 많아 농민이 살기 어려웠어요.' },
      ],
    },
    // 1·2차 동학 농민 운동: 역사책을 넘기며 본다(선생님 의견). 쪽마다 그 일의 그림(chapters/modern/pictures.js)
    flow: {
      type: 'book', title: '역사책으로 보는 동학 농민 운동',
      intro: [{ who: 'farmer', text: '우리 운동이 어떻게 흘러갔는지 역사책으로 함께 넘겨 보자.' }],
      pages: [
        { title: '고부 관아를 차지하다', year: '1894년 1월', pic: 'gobu', lines: [{ who: 'narr', text: '고부 군수의 횡포를 참다못한 농민들이 전봉준을 앞세워 고부 관아를 차지했어요.', src: ['S65', 'S51'] }] },
        { title: '1차 봉기: 황토현', year: '1894년', pic: 'hwangtohyeon', lines: [{ who: 'narr', text: '다시 일어난 농민군은 황토현에서 관군을 크게 물리쳤어요.', src: ['S64'] }] },
        { title: '전주성을 차지하다', year: '1894년', pic: 'jeonju', lines: [{ who: 'narr', text: '농민군은 기세를 몰아 전라도의 중심인 전주성을 차지했어요.', src: ['S64'] }] },
        { title: '전주 화약과 집강소', year: '1894년', pic: 'hwayak', lines: [
          { who: 'narr', text: '청과 일본 군대가 들어오자 농민군은 정부와 화약을 맺고 물러났어요.', src: ['S64', 'S51'] },
          { who: 'narr', text: '그 뒤 전라도 고을마다 집강소를 두어 스스로 개혁을 펼쳤어요.', src: ['S64'] },
        ] },
        { title: '2차 봉기: 다시 일어서다', year: '1894년', pic: 'rise', lines: [{ who: 'narr', text: '일본군이 경복궁을 점령하자, 나라를 지키려고 농민군이 다시 일어났어요.', src: ['S51', 'S64'] }] },
        { title: '우금치 전투와 전봉준 체포', year: '1894년', pic: 'ugeumchi', lines: [{ who: 'narr', text: '농민군은 공주 우금치에서 일본군과 관군에게 크게 졌고, 전봉준 등 지도자들은 체포되었어요.', src: ['S64', 'S51'] }] },
      ],
    },
  },
  result: [{ who: 'narr', text: '정부는 농민군의 요구를 일부 받아들여 갑오개혁을 했고, 신분제와 과거제가 없어졌어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1894, question: '동학 농민 운동을 이끈 사람은?', options: ['전봉준', '김옥균', '안중근'], answer: 0, explain: '동학 지도자 전봉준이 농민들을 이끌었어요.', src: ['S51'] },
    { kind: 'quiz', year: 1894, question: '갑오개혁으로 없어진 제도는?', options: ['학교', '신분제', '우편'], answer: 1, explain: '갑오개혁으로 신분제와 과거제가 없어졌어요.', src: ['S51'] },
  ],
};
