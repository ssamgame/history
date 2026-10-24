// 4장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 4장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    minister: { name: '관리', mark: '官', color: '#55608a', look: 'minister' },
    kimyunhu: { name: '김윤후', mark: '金', color: '#7d7a74', look: 'kimyunhu' },
    monk: { name: '승병', mark: '僧', color: '#8a8780', look: 'monk' },
    villager: { name: '백성', mark: '民', color: '#7d7466', look: 'villager' },
  },

  intro: [
    { who: 'narr', text: '몽골은 아시아 대부분과 유럽 일부까지 지배한 나라였어요.', src: ['S19'] },
    { who: 'narr', text: '1225년, 고려와 몽골 사이에 큰 사건이 일어났어요. 무슨 일이 있었는지 함께 보아요.', src: ['S22'] },
  ],

  // 저고여 피살 사건(1225년): 압록강 가 장면. before는 걷는 모습 전, after는 사건 뒤
  jeogo: {
    before: [{ who: 'narr', text: '1225년, 고려에 왔던 몽골 사신 저고여가 압록강 가 길을 따라 돌아가고 있어요.', src: ['S22'] }],
    after: [
      { who: 'narr', text: '그런데 압록강 가에서 저고여가 누군가에게 죽임을 당했어요. 누가 죽였는지는 끝내 밝혀지지 않았어요.', src: ['S22'] },
      { who: 'narr', text: '몽골은 이 일을 고려 탓으로 돌리며 국교를 끊었고, 이 사건을 구실로 삼아 1231년 8월 고려에 쳐들어왔어요.', src: ['S22', 'S10'] },
    ],
  },

  start: [{ who: 'guide', text: '고려의 도읍 개경이야. 궁궐 앞이 웅성웅성해. 북쪽에서 무슨 소식이 왔는지 궁궐 앞의 관리에게 물어보자.' }],

  goals: ['궁궐 앞의 관리에게 말을 걸어 보자', '새 도읍을 골라 보자', '처인성을 지키자', '충주성 이야기를 들어 보자', '배운 내용을 확인해 보자'],

  npc: {
    minister: {
      first: [
        { who: 'minister', text: '몽골은 사신이 죽은 일을 고려 탓으로 돌리며 쳐들어왔소.', src: ['S22'] },
        { who: 'minister', text: '몽골의 요구가 너무 지나치다. 도읍을 옮겨 오래 맞서자는 의견이 나왔소.', src: ['S10'] },
        { who: 'minister', text: '지도를 보고 어디로 옮기면 좋을지 골라 보시오.' },
      ],
    },
  },

  capital: {
    title: '도읍을 어디로 옮길까요?',
    places: [
      { id: 'gaegyeong', label: '개경 (지금 도읍)', xy: [40, 50], labelAt: [64, 46], hint: '개경은 지금의 도읍이에요. 도읍을 "옮기는" 것이니 다른 곳을 골라 보세요.' },
      { id: 'ganghwa', label: '강화도', xy: [33, 55], labelAt: [20, 62], hint: null },
      { id: 'seogyeong', label: '서경 (평양)', xy: [30, 36], labelAt: [30, 28], hint: '바다로 둘러싸여 적이 쉽게 건너오지 못하는 곳은 어디일까요? 다시 골라 보세요.' },
    ],
    reason: {
      kind: 'choice', who: 'minister', src: ['S10'],
      prompt: { who: 'minister', text: '좋소. 그런데 왜 하필 강화도요?' },
      options: [
        { text: '강화도가 고려에서 가장 넓은 땅이기 때문입니다.', correct: false, reply: null, hint: '강화도가 섬이라는 점을 떠올려 보세요.' },
        { text: '몽골군을 상대로 바다와 물에서 싸우면 고려가 유리할 것입니다.', correct: true, reply: { who: 'minister', text: '그렇소. 몽골군은 바다와 물에서 싸우는 데 약하니, 섬인 강화도로는 쉽게 건너오지 못할 것이오.', src: ['S10'] }, hint: null },
        { text: '몽골이 강화도로 옮겨도 된다고 허락했기 때문입니다.', correct: false, reply: null, hint: '몽골은 고려를 공격하던 나라예요. 허락해 줄 리 없어요.' },
      ],
    },
    done: [
      { who: 'narr', text: '1232년 7월, 고려 조정은 강화도로 도읍을 옮겼어요.', src: ['S10'] },
      { who: 'narr', text: '이 때문에 몽골군은 고려의 도읍을 쉽게 함락시킬 수 없었어요.', src: ['S10'] },
    ],
  },

  cheoin: {
    intro: [
      { who: 'narr', text: '처인성은 지금의 용인에 있던 성이에요.', src: ['S11'] },
      { who: 'kimyunhu', text: '성 안의 백성과 함께 이 성을 지키자. 다가오는 적에게 활을 쏘아라!' },
    ],
    howto: {
      title: '처인성 방어',
      steps: ['몽골군이 들판 여러 곳에서 성으로 다가와요.', '다가오는 병사 위의 "활" 버튼을 눌러 막아요. 테두리가 많이 찰수록 성에 가까워요!', '40초 동안 버티면 성공! 3명이 성벽에 닿으면 다시 해요.'],
      keyboard: '"활" 버튼을 마우스로 클릭',
      touch: '"활" 버튼을 손가락으로 누르기',
    },
    failHint: '몽골군이 성벽에 너무 많이 닿았어요. 다시 해 봐요.',
    done: [
      { who: 'narr', text: '1232년 12월, 처인성에는 피란 온 백성과 승려들이 함께 있었어요.', src: ['S11'] },
      { who: 'narr', text: '승려 김윤후가 활로 몽골 장수 살리타를 쏘아 쓰러뜨렸다고 전해져요.', src: ['S4'] },
      { who: 'narr', text: '몽골군은 물러갔어요.', src: ['S19'] },
    ],
  },

  chungju: [
    { who: 'narr', text: '1253년, 충주성이 70여 일 동안 몽골군에 둘러싸여 식량이 떨어져 갔어요.', src: ['S4'] },
    { who: 'narr', text: '김윤후는 관노(관청의 노비)의 문서를 불태우고, 공을 세우면 벼슬을 주겠다고 약속했어요.', src: ['S4'] },
    { who: 'narr', text: '그러자 노비와 백성들이 힘을 모아 성을 지켰어요.', src: ['S4'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1232, question: '고려 조정이 강화도로 도읍을 옮긴 까닭은?', options: ['몽골군이 바다와 물에서 싸우는 데 약해서', '강화도가 가장 따뜻해서', '몽골이 허락해서'], answer: 0, explain: '섬인 강화도는 몽골군이 쉽게 건너오지 못했어요.', src: ['S10'] },
    { kind: 'quiz', year: 1232, question: '처인성과 충주성에서 몽골군에 맞선 승려 출신 인물은?', options: ['강감찬', '양규', '김윤후'], answer: 2, explain: '승려 출신 김윤후는 처인성과 충주성에서 백성과 함께 싸웠어요.', src: ['S4'] },
  ],
};
