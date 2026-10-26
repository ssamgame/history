// 2장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 2장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '고려 병사', mark: '兵', color: '#7a3b2e', look: 'soldier' },
    yanggyu: { name: '양규', mark: '楊', color: '#7a2a1e', look: 'yanggyu' },
    villager: { name: '백성', mark: '民', color: '#7d7466', look: 'villager' },
  },

  intro: [
    { who: 'narr', text: '1010년, 거란의 성종이 40만 대군을 이끌고 다시 쳐들어왔어요.', src: ['S3'] },
    { who: 'narr', text: '가장 먼저 공격받은 곳은 압록강 가까이 있는 흥화진이었어요.', src: ['S2'] },
  ],

  start: [
    { who: 'guide', text: '눈 덮인 흥화진 성안이야. 성벽 위 깃발이 바람에 펄럭이고, 모두 북쪽만 바라보고 있어. 무슨 일인지 사람들에게 물어보자.' },
  ],

  goals: ['성안의 병사에게 말을 걸어 보자', '양규를 찾아가자', '성벽 계단(빛나는 원)으로 가자', '성벽에서 사다리를 밀어내자', '끌려가는 백성들을 구하자', '배운 내용을 확인해 보자'],

  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '거란 왕이 직접 대군을 이끌고 왔대!', src: ['S3'] },
        { who: 'soldier', text: '양규 님이 성 북쪽에 계셔. 어서 가 봐!' },
      ],
      later: [{ who: 'soldier', text: '양규 님은 성 북쪽에 계셔. 성문을 지킬 계획을 세우고 계실 거야.' }],
    },
    villager: {
      always: [{ who: 'villager', text: '왕(현종)께서는 남쪽 나주까지 피란하셨대요.', src: ['S14'] }],
    },
    signHeunghwa: { always: [
      { who: 'narr', text: '흥화진은 압록강 가까이 있는 고려의 성이에요. 거란의 2차 침입 때 가장 먼저 공격받았어요.', src: ['S2'] },
    ] },
    signNaju: { always: [
      { who: 'narr', text: '거란의 2차 침입 때 현종은 남쪽 나주까지 피란했어요.', src: ['S14'] },
    ] },
    yanggyu: {
      tooEarly: [{ who: 'yanggyu', text: '먼저 성안의 병사에게 소식을 들어 보아라.' }],
      first: [
        { who: 'yanggyu', text: '흥화진은 압록강에서 가장 가까운 성이다. 이곳이 무너지면 안 된다.', src: ['S2'] },
        { who: 'yanggyu', text: '성벽으로 올라가자. 계단은 바로 뒤에 있다.' },
      ],
      later: [{ who: 'yanggyu', text: '성벽 계단으로 올라오너라. 적이 어디까지 왔는지 함께 보자.' }],
    },
  },

  wall: {
    howto: {
      title: '성벽 방어',
      steps: ['거란 병사가 성벽 아래에서 사다리를 세우고 타고 올라와요.', '사다리 위에 뜨는 빨간 "밀기" 버튼을 눌러 사다리를 밀어내요. 버튼 테두리가 금색으로 많이 찰수록 급해요!', '45초 동안 버티면 성공! 사다리 3개가 꼭대기까지 올라오면 다시 해요.'],
      keyboard: '빨간 버튼을 마우스로 클릭',
      touch: '빨간 버튼을 손가락으로 누르기',
    },
    failHint: '사다리가 너무 많이 올라왔어요. 다시 해 봐요.',
    done: [{ who: 'narr', text: '거란군은 흥화진을 끝내 함락하지 못했어요.', src: ['S15'] }],
  },

  rescue: {
    intro: [{ who: 'guide', text: '거란군이 물러가면서 고려 백성들을 끌고 가고 있어! 들판으로 달려가자.' }],
    howto: {
      title: '백성 구출',
      steps: ['북쪽으로 끌려가는 백성 무리에게 달려가요.', '가까이 가면 백성을 구할 수 있어요.', '90초 안에 네 무리 이상 구하면 성공!'],
      keyboard: 'W A S D 또는 방향키로 이동',
      touch: '화면 왼쪽을 끌어 이동',
    },
    failHint: '백성을 네 무리 이상 구해야 해요. 다시 해 봐요.',
    done: [{ who: 'narr', text: '양규는 거란군이 차지한 곽주를 되찾고, 물러가는 거란군을 공격해 끌려가던 많은 백성을 구했어요.', src: ['S15'] }],
  },

  result: [
    { who: 'narr', text: '현종이 거란에 직접 찾아가겠다고 약속하자, 거란군은 물러갔어요.', src: ['S66', 'S15'] },
    { who: 'narr', text: '양규는 끝까지 싸우다 전사했어요.', src: ['S15'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1010, question: '거란의 2차 침입 때 흥화진을 지킨 사람은?', options: ['서희', '양규', '김윤후'], answer: 1, explain: '양규가 흥화진을 끝까지 지켰어요.', src: ['S2'] },
    { kind: 'quiz', year: 1010, question: '거란의 2차 침입 때 양규가 한 일은?', options: ['강화도로 도읍을 옮겼다', '끌려가던 백성을 구했다', '대장경을 만들었다'], answer: 1, explain: '양규는 물러가는 거란군을 공격해 끌려가던 백성을 구했어요.', src: ['S15'] },
  ],
};
