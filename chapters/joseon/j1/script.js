// 조선편 1장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 1장 절을 따른다.
// 해설(narr)은 출처가 꼭 있어야 하고, 사실이 아닌 진행 안내는 '안내(guide)'가 말한다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    archer: { name: '궁수', mark: '弓', color: '#5d6b3e', look: 'archer' },
    soldier: { name: '고려 병사', mark: '兵', color: '#7a3b2e', look: 'soldier' },
    yiseonggye: { name: '이성계', mark: '李', color: '#7a2a1e', look: 'yiseonggye' },
    minister: { name: '관리', mark: '官', color: '#5a4a6a', look: 'minister' },
  },

  intro: [
    { who: 'narr', text: '1388년 고려는 명나라의 요동을 치려고 5만여 명의 군사를 보냈고, 장수 이성계는 이 싸움에 반대했지만 우왕과 최영의 뜻대로 군대가 떠났어요.', src: ['S23'] },
  ],

  start: [{ who: 'guide', text: '비가 그치지 않는 위화도 진영이야. 군사들은 무슨 걱정을 하고 있을까?' }],

  goals: ['군사들의 걱정을 들어 보자', '지휘 천막 앞의 이성계를 찾아가자', '이성계가 반대한 까닭을 골라 보자', '관리를 따라 한양 터를 둘러보자', '새 도읍 한양을 꾸며 보자', '배운 내용을 확인해 보자'],

  // 군사들: 어느 차례로 들어도 막지 않는다. 다른 사람 말을 먼저 들었으면 그 말을 받아 잇는다(D-22)
  npc: {
    archer: {
      first: [
        { who: 'archer', text: '여기 위화도는 압록강에 있는 섬이야. 요동으로 가던 우리 군대가 여기 머물고 있지.', src: ['S23'] },
        { who: 'archer', text: '비가 그치지 않아. 활을 붙인 아교가 풀어질 지경이야.', src: ['S23'] },
        { who: 'archer', text: '덥고 비가 많으니 군사들 사이에 병이 돌까 걱정이야.', src: ['S23'] },
      ],
      bridge: { who: 'archer', text: '병사 말대로 왜구도 걱정이지만, 이 비도 큰일이야.' },
      later: [{ who: 'archer', text: '활시위가 자꾸 늘어져. 비가 그쳐야 할 텐데.' }],
    },
    soldier: {
      first: [
        { who: 'soldier', text: '요동 정벌에는 5만여 명의 군사와 2만여 필의 말이 나섰어.', src: ['S23'] },
        { who: 'soldier', text: '이성계 장군과 조민수 장군이 군대를 나누어 이끌고 계셔.', src: ['S23'] },
        { who: 'soldier', text: '우리가 북쪽으로 간 사이 남쪽 바닷가에 왜구가 쳐들어오면 어쩌지?', src: ['S23'] },
      ],
      bridge: { who: 'soldier', text: '궁수 말대로 비도 걱정이지만, 걱정이 하나 더 있어.' },
      later: [{ who: 'soldier', text: '지휘 천막은 진영 가운데에 있어. 장군님도 밤새 고민하셨대.' }],
    },
    // 더 들어 볼 사람이 남았으면 한 줄로 알려 준다
    more: { who: 'guide', text: '다른 군사의 걱정도 들어 볼까? 아니면 지휘 천막 앞의 이성계를 찾아가도 돼.' },
    yiseonggye: {
      wait: [{ who: 'yiseonggye', text: '먼저 군사들의 이야기를 들어 보아라.' }],
      first: [
        { who: 'yiseonggye', text: '작은 나라가 큰 나라를 거스르는 것은 옳지 않다.', src: ['S23'] },
        { who: 'yiseonggye', text: '여름에 군사를 일으키는 것도 옳지 않다.', src: ['S23'] },
        { who: 'yiseonggye', text: '내가 왜 이 싸움에 반대하는지, 네가 들은 이야기로 정리해 보아라.' },
      ],
      turn: [{ who: 'yiseonggye', text: '군사를 돌려 개경으로 돌아가자.', src: ['S23'] }],
    },
  },

  // 이성계가 반대한 까닭: 진영의 병사들이 이성계의 말을 전해 준다. 듣고 나서 '이성계가 말한 까닭인지' 고른다.
  // 넷은 실제로 이성계가 든 까닭(4불가론), 둘은 진영에 떠도는 소문이다.
  reasons: {
    src: ['S23'],
    title: '이성계가 반대한 까닭: 병사들이 전해 주는 말 듣기',
    question: '이 말은 이성계가 요동 정벌에 반대하며 든 까닭일까요?',
    options: ['이성계가 말한 까닭이에요', '이성계가 말한 까닭이 아니에요'],
    people: [
      { look: 'soldier', correct: true, talk: [{ who: 'soldier', text: '장군께서 "작은 나라가 큰 나라를 거스르는 것은 옳지 않다"고 하셨대.', src: ['S23'] }] },
      { look: 'archer', correct: false, talk: [{ who: 'archer', text: '어떤 병사가 그러는데, 요동은 너무 멀어서 아무도 가는 길을 모른대.' }],
        why: '이성계는 길을 모른다는 말을 하지 않았어요. 나라의 크기, 여름, 왜구, 장맛비를 까닭으로 들었어요.' },
      { look: 'soldier', correct: true, talk: [{ who: 'soldier', text: '장군께서 "여름에 군사를 일으키는 것은 옳지 않다"고 하셨어. 한창 농사철이잖아.', src: ['S23'] }] },
      { look: 'archer', correct: true, talk: [{ who: 'archer', text: '장군께서 "나라의 군사가 멀리 나가면 그 틈에 왜구가 쳐들어온다"고 걱정하셨어.', src: ['S23'] }] },
      { look: 'soldier', correct: false, talk: [{ who: 'soldier', text: '누가 그러는데, 명나라 군사가 우리보다 훨씬 적대.' }],
        why: '이성계는 적의 수를 까닭으로 들지 않았어요. 나라의 크기, 여름, 왜구, 장맛비를 까닭으로 들었어요.' },
      { look: 'archer', correct: true, talk: [{ who: 'archer', text: '장군께서 "장맛비에 활을 붙인 아교가 풀어지고 군사들이 병에 걸린다"고 하셨어.', src: ['S23'] }] },
    ],
    fail: '이성계와 군사들이 한 말을 떠올려 보세요. 나라의 크기, 계절, 왜구, 날씨에 대한 말이었어요.',
    done: [{ who: 'narr', text: '이성계가 든 네 가지 까닭을 4불가론이라고 해요.', src: ['S23'] }],
  },

  turnback: [
    { who: 'narr', text: '1388년, 이성계는 위화도에서 군사를 돌려 개경으로 돌아왔어요.', src: ['S23'] },
    { who: 'narr', text: '이성계는 우왕을 쫓아내고 나라의 권력을 잡았어요. 이 일을 위화도 회군이라고 해요.', src: ['S23'] },
    { who: 'narr', text: '1392년, 이성계는 왕위에 올라 새 나라를 세웠어요.', src: ['S23', 'S24'] },
    { who: 'narr', text: '이듬해부터 나라 이름을 \'조선\'이라고 했고, 1394년 한양으로 도읍을 옮겼어요.', src: ['S24'] },
  ],

  hanyang: {
    // 짓기 전에 관리를 따라 한양 터를 둘러본다(D-22)
    tour: {
      start: [{ who: 'minister', text: '새 도읍 한양의 터를 함께 둘러봅시다. 나를 따라오시오.' }],
      north: [{ who: 'minister', text: '저 북쪽 산이 백악이오. 궁궐인 경복궁은 백악을 뒤로 하고 지을 것이오.', src: ['S26'] }],
      east: [{ who: 'minister', text: '임금이 궁궐에서 남쪽을 바라볼 때 왼쪽, 곧 이 동쪽에 종묘를 둘 것이오.', src: ['S25'] }],
      west: [{ who: 'minister', text: '오른쪽, 곧 이 서쪽에는 사직단을 둘 것이오.', src: ['S25'] }],
    },
    howto: { title: '한양 짓기', steps: ['궁궐, 종묘, 사직단을 알맞은 터에 하나씩 지어요.', '터로 걸어가 대화 버튼을 누르면 그 자리에 지어져요.'] },
    title: '한양에 궁궐·종묘·사직단 짓기',
    fail: '임금은 궁궐에서 남쪽을 바라봐요. 그때 왼손 쪽이 동쪽(지도의 오른쪽)이고, 오른손 쪽이 서쪽(지도의 왼쪽)이에요.',
    done: [{ who: 'narr', text: '경복궁의 동쪽에 종묘, 서쪽에 사직단이 자리 잡았어요.', src: ['S25', 'S26'] }],
  },

  quizzes: [
    { kind: 'quiz', year: 1388, question: '이성계가 군사를 돌린 곳은?', options: ['귀주', '위화도', '강화도'], answer: 1, explain: '압록강의 섬 위화도에서 군사를 돌렸어요. 이 일을 위화도 회군이라고 해요.', src: ['S23'] },
    { kind: 'quiz', year: 1394, question: '조선이 새 도읍으로 정한 곳은?', options: ['개경', '평양', '한양'], answer: 2, explain: '1394년 한양으로 도읍을 옮겼어요.', src: ['S24'] },
  ],
};
