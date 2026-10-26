// 1장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 1장 절을 따른다.
// 해설(narr)은 출처가 꼭 있어야 하고, 사실이 아닌 진행 안내는 '안내(guide)'가 말한다.
// 2026-10-26 새로 만들기(docs/superpowers/specs/2026-10-26-ch1-spec.md): 사실 문장·출처는 그대로 두고 꼭 듣는 대사를 6줄로 줄였다
// (병사 1 · 서희 1 · 담판 앞 해설 1 · 담판 뒤 해설 1 · 물러남 2). 시작 안내 2줄은 뺐다(목표 글자가 대신한다). 병사·서희 대사는 머리 위 말풍선.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '고려 병사', mark: '兵', color: '#7a3b2e', look: 'soldier' },
    officer: { name: '나이 든 관리', mark: '官', color: '#6a4c6e', look: 'officer' },
    archer: { name: '궁수', mark: '弓', color: '#5d6b3e', look: 'archer' },
    seohui: { name: '서희', mark: '徐', color: '#2b4c7e', look: 'seohui' },
    sonn: { name: '소손녕', mark: '蕭', color: '#5b4a36', look: 'sonn' },
  },

  intro: [
    { who: 'narr', text: '993년, 북쪽의 거란이 고려에 쳐들어왔어요.', src: ['S16'] },
    { who: 'narr', text: '거란 장수 소손녕은 "80만 대군"이 왔다며 항복하라고 했어요.', src: ['S16'] },
  ],

  goals: ['진영의 병사에게 말을 걸어 보자', '지휘소에 있는 서희를 찾아가자', '강가의 나루터(빛나는 원)로 가자', '담판: 소손녕의 말을 받아치자', '배운 내용을 확인해 보자'],

  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '거란 장수 소손녕이 항복하라고 한대. 80만 대군이라고 큰소리를 친대.', src: ['S16'] },
      ],
      later: [{ who: 'soldier', text: '서희 님은 왼쪽 지휘소에 계셔. 오늘따라 말씀이 적으셔서 다들 숨죽이고 있어.' }],
    },
    officer: {
      always: [
        { who: 'officer', text: '조정에서는 땅을 떼어 주고 거란을 달래자는 말까지 나왔다네.', src: ['S17'] },
        { who: 'officer', text: '하지만 서희 님은 땅을 내주면 안 된다고 하셨지.', src: ['S17'] },
      ],
    },
    archer: {
      always: [{ who: 'archer', text: '거란은 송나라와 다투고 있어서, 송과 가까운 고려를 경계한대.', src: ['S19'] }],
    },
    signGangdong: { always: [
      { who: 'narr', text: '서희의 담판 뒤 고려는 압록강 동쪽에 흥화진, 용주, 통주, 철주, 귀주, 곽주를 쌓았어요.', src: ['S1'] },
      { who: 'narr', text: '이 여섯 고을을 강동 6주라고 해요.', src: ['S1'] },
    ] },
    signSong: { always: [
      { who: 'narr', text: '거란은 송나라와 다투고 있어서, 송과 가까이 지내는 고려를 경계했어요.', src: ['S19'] },
    ] },
    seohui: {
      tooEarly: [{ who: 'seohui', text: '먼저 진영의 병사에게 지금 상황을 들어 보아라.' }],
      first: [
        { who: 'seohui', text: '땅을 떼어 주고 달랠 수는 없다. 내가 직접 소손녕을 만나 담판을 짓겠다.', src: ['S17'] },
      ],
      later: [{ who: 'seohui', text: '강가 나루터에서 기다리마. 마음을 단단히 먹고 오너라.' }],
    },
  },

  negotiation: {
    opening: [
      { who: 'narr', text: '소손녕이 절을 하라고 하자, 서희는 대신끼리는 절할 수 없다며 당당히 맞섰어요.', src: ['S16'] },
    ],
    q1: {
      kind: 'choice', who: 'sonn', src: ['S18'],
      prompt: { who: 'sonn', text: '고려는 신라 땅에서 일어났다. 고구려의 옛 땅은 거란의 것인데 왜 너희가 차지하고 있느냐?', src: ['S18'] },
      options: [
        { text: '고려는 고구려를 이은 나라이다.', correct: true, reply: { who: 'seohui', text: '그래서 나라 이름도 \'고려\'라고 하였다.', src: ['S18'] }, hint: null },
        { text: '고구려의 옛 땅을 모두 거란에 돌려주겠다.', correct: false, reply: null, hint: '땅을 내주면 고려가 작아져요. 고려가 어느 나라를 이었는지 떠올려 보세요.' },
        { text: '우리 군사가 더 많으니 돌아가라.', correct: false, reply: null, hint: '힘보다 말과 논리로 설득해야 해요.' },
      ],
    },
    q2: {
      kind: 'choice', who: 'sonn', src: ['S17'],
      prompt: { who: 'sonn', text: '고려는 왜 가까운 거란과 친하게 지내지 않느냐?', src: ['S17'] },
      options: [
        { text: '송나라가 더 좋아서 그렇다.', correct: false, reply: null, hint: '거란과 친하게 지내지 못한 \'까닭\'을 말해 보세요.' },
        { text: '여진이 길을 막고 있어서 거란과 교류를 할 수 없다.', correct: true, reply: { who: 'seohui', text: '여진을 몰아내고 그 땅을 되찾으면 거란과 교류할 수 있다.', src: ['S17'] }, hint: null },
        { text: '거란과는 절대 친하게 지내지 않겠다.', correct: false, reply: null, hint: '그러면 전쟁이 이어져요. 조건을 걸어 보세요.' },
      ],
    },
    closing: [
      { who: 'narr', text: '소손녕은 군대를 물렸어요.', src: ['S19'] },
    ],
  },

  // 놀이 「말 받아치기」(chapters/kit/rally.js) 안내. 규칙 안내만 있고 사실 문장은 없다
  rally: {
    howto: {
      title: '담판: 말 받아치기',
      steps: ['소손녕의 말이 말풍선으로 뜨고, 말 공이 서희 쪽으로 날아와요.', '아래 대답 구슬 가운데 알맞은 것을 골라 쏘아 올리면 말을 받아쳐요. 틀리면 같은 판을 다시 해요.'],
      keyboard: '숫자 1 · 2 · 3',
      touch: '구슬을 누르거나 위로 끌어 올리기',
    },
    gauge: '담판 기세',
    timeoutHint: '말 공이 서희에게 닿기 전에 대답 구슬을 골라 봐요.',
  },

  // 장 끝 도장과 지혜 카드(카드 문장은 아래 물러남 첫 문장을 그대로 쓴다)
  finale: { stamp: '담판', sub: '강동 6주를 얻었다!' },
  guardian: { title: '나의 지킴이', text: '고려편 내내 함께할 지킴이를 골라요. 옷 색만 달라요.' },

  retreat: [
    { who: 'narr', text: '고려는 압록강 동쪽에 흥화진, 용주, 통주, 철주, 귀주(구주), 곽주를 쌓아 강동 6주를 얻었어요.', src: ['S1'] },
    // 역사 검토(redesign-review.md Q1): 원문 확인이 끝나면 아래 한 줄을 "서희는 칼 대신 말로 소손녕을 설득해 거란군을 물러나게 했어요."로 바꾼다
    { who: 'narr', text: '서희는 싸우지 않고 말로 거란군을 물러나게 했어요.', src: ['S19'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 993, question: '서희가 담판으로 얻은 땅은?', options: ['동북 9성', '강동 6주', '강화도'], answer: 1, explain: '압록강 동쪽의 흥화진, 용주, 통주, 철주, 귀주, 곽주예요.', src: ['S1'] },
    // 2번은 놀이(고구려 계승)와 겹치지 않게 S19 문장(궁수 대사·안내판 signSong)으로 바꿨다(2026-10-26). 오답 보기 둘은 헛보기
    { kind: 'quiz', year: 993, question: '거란이 고려를 경계한 까닭은?', options: ['송나라와 가까이 지내서', '땅이 너무 좁아서', '바다에서 쳐들어와서'], answer: 0, explain: '거란은 송나라와 다투고 있어서 송과 가까이 지내는 고려를 경계했어요.', src: ['S19'] },
  ],
};
