// 2장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 2장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '고려 병사', mark: '兵', color: '#7a3b2e', look: 'soldier' },
    yanggyu: { name: '양규', mark: '楊', color: '#7a2a1e', look: 'yanggyu' },
    villager: { name: '백성', mark: '民', color: '#7d7466', look: 'villager' },
  },

  // 줄거리(D-8): 출처 있는 두 문장을 합친 한 문단
  intro: [
    { who: 'narr', text: '1010년, 거란의 성종이 40만 대군을 이끌고 다시 쳐들어와 압록강 가까이 있는 흥화진을 가장 먼저 공격했어요.', src: ['S3', 'S2'] },
  ],

  start: [
    { who: 'guide', text: '눈 덮인 흥화진 성안이야. 모두 북쪽만 바라보고 있어. 머리 위에 노란 느낌표가 뜬 병사에게 무슨 일인지 물어보자.' },
  ],

  goals: ['성안 사람들의 이야기를 들어 보자', '성벽 계단 앞의 양규를 찾아가자', '양규를 따라 성벽에 오르자', '양규가 가리킨 사다리를 밀어내자', '끌려가는 백성들을 구하자', '배운 내용을 확인해 보자'],

  // 한 사람의 이야기를 처음 다 들은 뒤, 다음에 찾아갈 사람을 알려 주는 진행 안내(병사 → 백성 → 양규)
  next: {
    soldier: { who: 'guide', text: '화톳불 옆의 병사에게도 이야기를 들어 보자.' },
    villager: { who: 'guide', text: '이번에는 장독대 옆의 백성에게도 이야기를 들어 보자.' },
    yanggyu: { who: 'guide', text: '이제 성벽 계단 앞에 있는 양규를 찾아가자.' },
  },
  follow: [{ who: 'guide', text: '양규가 앞장서서 성벽 계단을 올라가. 뒤따라가자.' }],

  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '거란 왕이 직접 대군을 이끌고 왔대!', src: ['S3'] },
        { who: 'soldier', text: '흥화진은 압록강 가까이 있어서 거란군이 가장 먼저 쳐들어왔어.', src: ['S2'] },
      ],
      later: [{ who: 'soldier', text: '양규 님은 성벽 계단 앞에 계셔. 어서 가 봐!' }],
    },
    villager: {
      first: [{ who: 'villager', text: '임금(현종)께서는 남쪽 나주까지 피란하셨대요.', src: ['S14'] }],
      later: [{ who: 'villager', text: '양규 님이 계시니 이 성은 꼭 버텨 낼 거예요.' }],
    },
    // 양규의 첫 말(D-8): 아무 이야기도 안 들었으면 먼저 들어 보라 하고, 들었으면 들은 말을 이어받아 '이곳이 무너지면 안 된다'로 모은다
    yanggyu: {
      greet: [{ who: 'yanggyu', text: '나는 이 흥화진을 지키는 양규다.', src: ['S2'] }],
      tooEarly: [{ who: 'yanggyu', text: '성안의 병사와 백성에게 먼저 이야기를 들어 보아라. 지금 성안 사정을 알아야 한다.' }],
      heard: {
        soldier: { who: 'yanggyu', text: '병사 말대로, 거란 왕이 직접 대군을 끌고 왔다.', src: ['S3'] },
        villager: { who: 'yanggyu', text: '임금께서도 남쪽 나주까지 피란하셨다.', src: ['S14'] },
      },
      land: [{ who: 'yanggyu', text: '흥화진은 압록강에서 가장 가까운 성이다. 이곳이 무너지면 안 된다.', src: ['S2'] }],
      go: [{ who: 'yanggyu', text: '나를 따라 성벽에 오르자. 적이 어디까지 왔는지 함께 보자.' }],
    },
  },

  wall: {
    howto: {
      title: '성벽 방어',
      steps: ['거란 병사가 성벽 아래에서 사다리를 세우고 타고 올라와요.', '양규가 "저기다!" 하고 가리킨 곳(성벽 위 빛나는 원)으로 걸어가면 사다리를 밀어내요.', '사다리 10개를 밀어내거나 45초 동안 버티면 성공! 사다리 3개가 꼭대기까지 올라오면 다시 해요.'],
      keyboard: 'W A S D 또는 방향키로 성벽 위를 걷기',
      touch: '화면 왼쪽을 끌어 성벽 위를 걷기',
    },
    start: [{ who: 'yanggyu', text: '거란군이 사다리를 세운다! 내가 가리키는 곳으로 달려가 사다리를 밀어내라.' }],
    point: '저기다!',
    failHint: '사다리가 너무 많이 올라왔어요. 다시 해 봐요.',
    done: [{ who: 'narr', text: '거란군은 흥화진을 끝내 함락하지 못했어요.', src: ['S15'] }],
  },

  rescue: {
    intro: [{ who: 'guide', text: '거란군이 물러가면서 고려 백성들을 끌고 가고 있어! 들판으로 달려가자.' }],
    howto: {
      title: '백성 구출',
      steps: ['북쪽으로 끌려가는 백성 무리에게 달려가요.', '가까이 가면 백성을 구할 수 있어요. 구한 백성은 너를 따라와요.', '90초 안에 네 무리 이상 구하면 성공!'],
      keyboard: 'W A S D 또는 방향키로 이동',
      touch: '화면 왼쪽을 끌어 이동',
    },
    failHint: '백성을 네 무리 이상 구해야 해요. 다시 해 봐요.',
    home: [{ who: 'guide', text: '구한 백성들과 함께 성으로 돌아가자.' }],
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
