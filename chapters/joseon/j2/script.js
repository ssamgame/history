// 조선편 2장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 2장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    commoner: { name: '백성', mark: '民', color: '#6b4a32', look: 'commoner' },
    scholar: { name: '집현전 학자', mark: '學', color: '#3a4a5a', look: 'scholar' },
    sejong: { name: '세종', mark: '王', color: '#a3262a', look: 'sejong' },
  },

  intro: [
    { who: 'narr', text: '많은 백성은 어려운 한자를 배우기 힘들어서 하고 싶은 말을 글로 적지 못했어요.', src: ['S27'] },
    { who: 'narr', text: '세종은 백성이 쓸 수 있는 새 글자를 직접 만들기로 했어요.', src: ['S27'] },
  ],

  start: [
    { who: 'guide', text: '너는 궁궐에서 심부름을 하는 아이야. 오늘은 궁궐 안이 바빠 보여.' },
    { who: 'guide', text: '무슨 일로 바쁠까? 마당 남쪽에서 한숨 쉬는 백성에게 먼저 다가가 보자.' },
  ],

  goals: ['마당 남쪽의 백성에게 말을 걸어 보자', '집현전 앞의 학자에게 말을 걸어 보자', '전각 앞의 세종을 찾아가자', '세종과 함께 글자를 만들어 보자', '배운 내용을 확인해 보자'],

  npc: {
    commoner: {
      first: [
        { who: 'commoner', text: '저는 한자를 몰라서 하고 싶은 말을 글로 적을 수가 없어요.', src: ['S27'] },
        { who: 'commoner', text: '오른쪽 집현전에 학자님들이 계셔. 가 봐.' },
      ],
      later: [{ who: 'commoner', text: '누구나 쓸 수 있는 글자가 있으면 얼마나 좋을까요.' }],
    },
    scholar: {
      tooEarly: [{ who: 'scholar', text: '마당 남쪽의 백성이 무언가 할 말이 있는 것 같더구나.' }],
      first: [
        { who: 'scholar', text: '세종께서는 집현전을 두어 젊은 학자들이 학문을 연구하게 하셨지.', src: ['S29'] },
        { who: 'scholar', text: '우리 집현전 학자들도 새 글자 만드는 일을 돕고 있단다.', src: ['S29'] },
        { who: 'scholar', text: '세종께서 전각 앞에서 너를 찾으셨다.' },
      ],
      later: [{ who: 'scholar', text: '전하께서 전각 앞에 계시다. 어서 가 보아라.' }],
    },
    signThrone: { always: [
      { who: 'narr', text: '근정전은 1395년 경복궁을 지을 때 세운 으뜸 전각이에요.', src: ['S46'] },
      { who: 'narr', text: '왕의 즉위식 같은 나라의 큰 의식을 이곳에서 치렀어요.', src: ['S46'] },
    ] },
    signJiphyeon: { always: [
      { who: 'narr', text: '집현전은 1420년에 세웠어요. 젊은 학자들이 이곳에서 학문을 연구했어요.', src: ['S29'] },
    ] },
    signHaerye: { always: [
      { who: 'narr', text: '훈민정음 해례본은 글자를 만든 까닭과 원리를 풀어 1446년에 펴낸 책이에요.', src: ['S49'] },
      { who: 'narr', text: '1940년 안동에서 발견되었고, 1997년 유네스코 세계기록유산이 되었어요.', src: ['S49'] },
    ] },
    sejong: {
      tooEarly: [{ who: 'sejong', text: '먼저 백성과 학자의 이야기를 들어 보아라.' }],
      first: [
        { who: 'sejong', text: '소리를 낼 때의 입과 혀, 목구멍의 모양을 본떠 글자를 만들 것이다.', src: ['S28'] },
        { who: 'sejong', text: '네가 직접 글자를 만들어 보아라.' },
      ],
    },
  },

  consonants: {
    title: '기본 자음 다섯 자: 어떤 모양을 본떴을까요?',
    // 그림(소리 낼 때의 모양)을 보고 그 모양을 본떠 만든 글자를 고른다
    pictures: [
      { shape: 'root', caption: '혀뿌리가 목구멍을 막는 모양', answer: 'ㄱ' },
      { shape: 'mouth', caption: '입 모양', answer: 'ㅁ' },
      { shape: 'tongue', caption: '혀가 윗잇몸에 붙는 모양', answer: 'ㄴ' },
      { shape: 'throat', caption: '목구멍 모양', answer: 'ㅇ' },
      { shape: 'teeth', caption: '이 모양', answer: 'ㅅ' },
    ],
    options: ['ㄱ', 'ㄴ', 'ㅁ', 'ㅅ', 'ㅇ'],
    fail: '소리를 낼 때 혀와 입, 이, 목구멍이 어떤 모양인지 떠올려 보세요. ㅁ은 입, ㅅ은 이 모양이에요.',
    done: [{ who: 'narr', text: '기본 자음 ㄱ, ㄴ, ㅁ, ㅅ, ㅇ은 소리를 내는 입과 혀, 이, 목구멍의 모양을 본떠 만들었어요.', src: ['S28'] }],
  },
  strokes: {
    title: '소리가 세질수록 획을 더해요: 차례대로 놓아요',
    cards: ['ㄴ', 'ㄷ', 'ㅌ'],
    steps: [{ base: 'ㄴ', answer: 'ㄷ', options: ['ㄹ', 'ㄷ', 'ㅁ', 'ㅌ'] }, { base: 'ㄷ', answer: 'ㅌ', options: ['ㅌ', 'ㄹ', 'ㅂ', 'ㄴ'] }],
    fail: '획이 적은 글자부터 놓아요. ㄴ에 획을 하나 더하면 ㄷ, 또 더하면 ㅌ이에요.',
    done: [{ who: 'narr', text: '소리가 세지면 기본 글자에 획을 더해 새 글자를 만들었어요.', src: ['S27'] }],
  },
  vowels: {
    title: '모음의 기본 세 글자: 무엇을 본떴을까요?',
    pictures: [
      { shape: 'sky', caption: '둥근 하늘', answer: 'ㆍ' },
      { shape: 'earth', caption: '평평한 땅', answer: 'ㅡ' },
      { shape: 'person', caption: '서 있는 사람', answer: 'ㅣ' },
    ],
    options: ['ㅣ', 'ㆍ', 'ㅡ'],
    fail: '둥근 하늘은 점(ㆍ), 평평한 땅은 가로선(ㅡ), 서 있는 사람은 세로선(ㅣ)이에요.',
    done: [{ who: 'narr', text: '모음은 하늘(ㆍ), 땅(ㅡ), 사람(ㅣ)을 본뜬 세 글자를 바탕으로 만들었어요.', src: ['S27'] }],
  },
  words: [
    { title: '\'나무\'를 만들어요: 낱자를 차례대로 놓아요', cards: ['ㄴ', 'ㅏ', 'ㅁ', 'ㅜ'], prompt: '그림의 이름을 바르게 모아 쓴 것은 무엇일까요?', answer: '나무', options: ['너무', '나무', '나모', '누마'] },
    { title: '\'한글\'을 만들어요: 낱자를 차례대로 놓아요', cards: ['ㅎ', 'ㅏ', 'ㄴ', 'ㄱ', 'ㅡ', 'ㄹ'], prompt: '이 낱자들을 소리 나는 차례대로 모아 쓴 것은 무엇일까요?', answer: '한글', options: ['한굴', '헌글', '한글', '한길'] },
  ],
  wordsFail: '소리 나는 차례대로 놓아요. 첫소리(자음) 다음에 가운뎃소리(모음)가 와요.',
  wordsDone: [{ who: 'guide', text: '자음과 모음을 모으니 낱말이 되었어! 이제 누구나 소리를 글로 적을 수 있어.' }],

  result: [
    { who: 'narr', text: '세종은 1443년에 훈민정음을 만들고, 1446년에 세상에 널리 알렸어요.', src: ['S27'] },
    { who: 'narr', text: '집현전 학자들이 훈민정음을 만드는 일을 도왔어요.', src: ['S29'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1443, question: '훈민정음을 만든 왕은?', options: ['태조', '세종', '정조'], answer: 1, explain: '세종이 1443년에 만들고 1446년에 널리 알렸어요.', src: ['S27'] },
    { kind: 'quiz', year: 1443, question: '자음 \'ㄴ\'은 무엇을 본떠 만들었나요?', options: ['혀가 윗잇몸에 붙는 모양', '입 모양', '이 모양'], answer: 0, explain: 'ㄴ은 혀가 윗잇몸에 붙는 모양을 본떴어요.', src: ['S28'] },
  ],
};
