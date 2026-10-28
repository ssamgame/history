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
  ],

  start: [{ who: 'guide', text: '너는 궁궐에서 심부름을 하는 아이야. 오늘은 궁궐 안이 바빠 보여. 무슨 일인지 사람들에게 들어 보자.' }],

  goals: ['궁궐 사람들의 이야기를 들어 보자', '전각 앞의 세종을 찾아가자', '소리 내는 모양을 보고 자음을 만들어 보자', '하늘·땅·사람을 보고 모음을 만들어 보자', '낱자를 주워 낱말을 만들어 보자', '배운 내용을 확인해 보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 볼까? 아니면 전각 앞의 세종을 찾아가도 돼.' },

  npc: {
    commoner: {
      first: [
        { who: 'commoner', text: '저는 한자를 몰라서 하고 싶은 말을 글로 적을 수가 없어요.', src: ['S27'] },
      ],
      bridge: { who: 'commoner', text: '학자님들이 바쁘신 걸 보셨어요? 저 같은 사람에게도 글자가 있으면 좋겠어요.' },
      later: [{ who: 'commoner', text: '누구나 쓸 수 있는 글자가 있으면 얼마나 좋을까요.' }],
    },
    scholar: {
      first: [
        { who: 'scholar', text: '세종께서는 집현전을 두어 젊은 학자들이 학문을 연구하게 하셨지.', src: ['S29'] },
        { who: 'scholar', text: '우리 집현전 학자들도 새 글자 만드는 일을 돕고 있단다.', src: ['S29'] },
      ],
      bridge: { who: 'scholar', text: '백성의 이야기를 들었구나. 그래서 새 글자가 필요하단다.' },
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
      wait: [{ who: 'sejong', text: '먼저 백성과 학자의 이야기를 들어 보아라.' }],
      // 결심 장면(D-24): 백성과 학자가 곁으로 모이고 세종이 말한다
      first: [
        { who: 'sejong', text: '백성이 하고 싶은 말을 글로 적지 못하니, 백성이 쓸 수 있는 새 글자를 내가 직접 만들겠다.', src: ['S27'] },
        { who: 'sejong', text: '소리를 낼 때의 입과 혀, 목구멍의 모양을 본떠 글자를 만들 것이다.', src: ['S28'] },
        { who: 'sejong', text: '집현전 학자들과 함께, 너도 글자 만드는 일을 거들어 보아라.', src: ['S29'] },
      ],
    },
  },

  consonants: {
    title: '기본 자음 다섯 자: 어떤 모양을 본떴을까요?',
    howto: { title: '자음 만들기', steps: ['그림판 다섯 곳을 아무 차례로 찾아가 대화 버튼을 눌러요.', '그림의 모양을 본뜬 글자를 고르면 그림판에 글자가 새겨져요.'] },
    ask: caption => ({ who: 'scholar', text: `이 그림은 「${caption}」이에요. 이 모양을 본떠 만든 글자는?` }),
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
    title: '소리가 세질수록 획을 더해요',
    cards: ['ㄴ', 'ㄷ', 'ㅌ'],
    ask: base => ({ who: 'scholar', text: `소리가 세지면 획을 더한단다. 「${base}」에 획을 하나 더하면 어떤 글자가 될까?` }),
    steps: [{ base: 'ㄴ', answer: 'ㄷ', options: ['ㄹ', 'ㄷ', 'ㅁ', 'ㅌ'] }, { base: 'ㄷ', answer: 'ㅌ', options: ['ㅌ', 'ㄹ', 'ㅂ', 'ㄴ'] }],
    fail: '획이 적은 글자부터 놓아요. ㄴ에 획을 하나 더하면 ㄷ, 또 더하면 ㅌ이에요.',
    done: [{ who: 'narr', text: '소리가 세지면 기본 글자에 획을 더해 새 글자를 만들었어요.', src: ['S27'] }],
  },
  vowels: {
    title: '모음의 기본 세 글자: 무엇을 본떴을까요?',
    howto: { title: '모음 만들기', steps: ['안내가 보여 주는 모음이 무엇을 본떴는지 생각해요.', '하늘·땅·사람 모형 가운데 맞는 곳에 가서 대화 버튼을 눌러요.'] },
    ask: letter => ({ who: 'guide', text: `모음 「${letter}」는 무엇을 본떴을까? 그 모형 앞에 가서 대화 버튼을 눌러 봐.` }),
    models: [{ shape: 'sky', label: '하늘', letter: 'ㆍ' }, { shape: 'earth', label: '땅', letter: 'ㅡ' }, { shape: 'person', label: '사람', letter: 'ㅣ' }],
    rounds: ['ㅡ', 'ㆍ', 'ㅣ'],
    pictures: [
      { shape: 'sky', caption: '둥근 하늘', answer: 'ㆍ' },
      { shape: 'earth', caption: '평평한 땅', answer: 'ㅡ' },
      { shape: 'person', caption: '서 있는 사람', answer: 'ㅣ' },
    ],
    options: ['ㅣ', 'ㆍ', 'ㅡ'],
    fail: '둥근 하늘은 점(ㆍ), 평평한 땅은 가로선(ㅡ), 서 있는 사람은 세로선(ㅣ)이에요.',
    done: [{ who: 'narr', text: '모음은 하늘(ㆍ), 땅(ㅡ), 사람(ㅣ)을 본뜬 세 글자를 바탕으로 만들었어요.', src: ['S27'] }],
  },
  // 낱자 주워 모으기(D-24): 마당에 흩어진 낱자를 소리 나는 차례대로 주우면 글자판에 낱말이 모인다
  wordsHowto: { title: '낱말 만들기', steps: ['마당에 흩어진 낱자를 소리 나는 차례대로 찾아가 대화 버튼을 눌러요.', '글자판에 낱말이 다 모이면 성공!'] },
  words: [
    { word: '나무', intro: { who: 'guide', text: '저 나무의 이름을 글자로 적어 보자. 낱자를 소리 나는 차례대로 주워 봐.' }, cards: ['ㄴ', 'ㅏ', 'ㅁ', 'ㅜ'], build: ['ㄴ', '나', '나ㅁ', '나무'] },
    { word: '한글', intro: { who: 'guide', text: '이번에는 우리 글자의 이름 「한글」을 적어 보자.' }, cards: ['ㅎ', 'ㅏ', 'ㄴ', 'ㄱ', 'ㅡ', 'ㄹ'], build: ['ㅎ', '하', '한', '한ㄱ', '한그', '한글'] },
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
