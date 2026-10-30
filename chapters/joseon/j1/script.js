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
    { who: 'narr', text: '1388년 고려는 명나라의 요동을 치려고 5만여 명의 군사를 보냈어요.', src: ['S23'] },
    { who: 'narr', text: '장수 이성계는 이 싸움에 반대했지만, 우왕과 최영의 뜻대로 군대가 떠났어요.', src: ['S23'] },
  ],

  start: [{ who: 'guide', text: '비가 그치지 않는 위화도 진영이야. 군사들은 무슨 걱정을 하고 있을까?' }],

  goals: ['군사들의 걱정을 모두 들어 보자', '지휘 천막 앞의 이성계를 찾아가자', '이성계가 든 까닭과 소문을 가려내자', '이성계에게 가서 결심을 듣자', '진영의 관리를 찾아가자', '관리를 따라 한양 터를 둘러보자', '새 도읍 한양을 꾸며 보자'],

  // 군사들: 어느 차례로 들어도 막지 않는다. 다른 사람 말을 먼저 들었으면 그 말을 받아 잇는다(D-22)
  npc: {
    archer: {
      first: [
        { who: 'archer', text: '여기 위화도는 압록강에 있는 섬이야. 요동으로 가던 우리 군대가 여기 머물고 있지.', src: ['S23'] },
        { who: 'archer', expr: 'worry', text: '비가 그치지 않아. 활을 붙인 아교가 풀어질 지경이야.', src: ['S23'] },
        { who: 'archer', text: '덥고 비가 많으니 군사들 사이에 병이 돌까 걱정이야.', src: ['S23'] },
      ],
      bridge: { who: 'archer', text: '병사 말대로 왜구도 걱정이지만, 이 비도 큰일이야.' },
      later: [{ who: 'archer', text: '활시위가 자꾸 늘어져. 비가 그쳐야 할 텐데.' }],
    },
    soldier: {
      first: [
        { who: 'soldier', text: '요동 정벌에는 5만여 명의 군사와 2만여 필의 말이 나섰어.', src: ['S23'] },
        { who: 'soldier', text: '이성계와 조민수가 군대를 나누어 이끌고 있어.', src: ['S23'] },
        { who: 'soldier', expr: 'worry', text: '우리가 북쪽으로 간 사이 남쪽 바닷가에 왜구가 쳐들어오면 어쩌지?', src: ['S23'] },
      ],
      bridge: { who: 'soldier', text: '궁수 말대로 비도 걱정이지만, 걱정이 하나 더 있어.' },
      later: [{ who: 'soldier', text: '지휘 천막은 진영 가운데에 있어. 장군님도 밤새 고민하셨대.' }],
    },
    // 더 들어 볼 사람이 남았으면 한 줄로 알려 준다
    more: { who: 'guide', text: '다른 군사의 걱정도 들어 보자. 모두 듣고 나면 지휘 천막 앞의 이성계를 찾아가자.' },
    yiseonggye: {
      wait: [{ who: 'yiseonggye', text: '먼저 군사들의 이야기를 모두 들어 보아라.' }],
      first: [
        { who: 'yiseonggye', expr: 'tension', text: '군사들의 걱정을 들었구나. 나는 이 싸움에 반대했다.', src: ['S23'] },
      ],
      // 4불가론(H-01): 이성계가 네 까닭을 직접 말한다(S23)
      reasons: [
        { who: 'yiseonggye', text: '내가 요동 정벌에 반대한 까닭은 네 가지다.', src: ['S23'] },
        { who: 'yiseonggye', text: '첫째, 작은 나라가 큰 나라를 거스르는 것은 옳지 않다.', src: ['S23'] },
        { who: 'yiseonggye', text: '둘째, 여름에 군사를 일으키는 것은 옳지 않다.', src: ['S23'] },
        { who: 'yiseonggye', text: '셋째, 온 나라의 군사가 멀리 나가면 그 틈에 왜구가 쳐들어올 것이다.', src: ['S23'] },
        { who: 'yiseonggye', text: '넷째, 덥고 비가 많아 활을 붙인 아교가 풀어지고, 군사들 사이에 병이 돌 것이다.', src: ['S23'] },
        { who: 'yiseonggye', text: '그런데 진영에는 내가 하지 않은 말도 떠돈다. 군사들의 말을 듣고, 내가 든 까닭인지 소문인지 가려내 보아라.' },
      ],
      turn: [{ who: 'yiseonggye', text: '군사를 돌려 개경으로 돌아가자.', src: ['S23'] }],
    },
    // 회군 뒤 진영에 남은 관리: 말을 걸면 새 도읍 터를 둘러보러 간다(C-05)
    minister: {
      first: [{ who: 'minister', text: '조선을 세운 뒤 새 도읍을 정해야 하오. 나를 따라 한양 터를 둘러봅시다.' }],
    },
  },

  // 이성계가 반대한 까닭: 이성계가 직접 네 까닭을 말한 뒤(npc.yiseonggye.reasons), 진영 병사들이 하는 말이 이성계가 든 까닭인지 소문인지 가려낸다(H-01).
  // 넷은 실제로 이성계가 든 까닭(4불가론), 둘은 진영에 떠도는 소문이다.
  reasons: {
    src: ['S23'],
    title: '이성계가 든 까닭과 진영의 소문 가려내기',
    question: '이 말은 이성계가 든 까닭일까요, 진영에 떠도는 소문일까요?',
    options: ['이성계가 든 까닭이에요', '떠도는 소문이에요'],
    people: [
      { look: 'soldier', correct: true, talk: [{ who: 'soldier', text: '이성계께서 작은 나라가 큰 나라를 거스르는 것은 옳지 않다고 하셨지.', src: ['S23'] }] },
      { look: 'archer', correct: false, talk: [{ who: 'archer', text: '어떤 병사가 그러는데, 요동은 너무 멀어서 아무도 가는 길을 모른대.' }],
        why: '이성계는 길을 모른다는 말을 하지 않았어요. 이성계가 든 까닭은 나라의 크기, 여름, 왜구, 장맛비였어요.' },
      { look: 'soldier', correct: true, talk: [{ who: 'soldier', text: '이성계께서 여름에 군사를 일으키는 것은 옳지 않다고 하셨어. 한창 농사철이잖아.', src: ['S23'] }] },
      { look: 'archer', correct: true, talk: [{ who: 'archer', text: '이성계께서 군사가 멀리 나간 틈에 왜구가 쳐들어올까 걱정하셨어.', src: ['S23'] }] },
      { look: 'soldier', correct: false, talk: [{ who: 'soldier', text: '누가 그러는데, 명나라 군사가 우리보다 훨씬 적대.' }],
        why: '이성계는 적의 수를 까닭으로 들지 않았어요. 이성계가 든 까닭은 나라의 크기, 여름, 왜구, 장맛비였어요.' },
      { look: 'archer', correct: true, talk: [{ who: 'archer', text: '이성계께서 장맛비에 활을 붙인 아교가 풀어지고 병이 돈다고 하셨어.', src: ['S23'] }] },
    ],
    fail: '이성계가 직접 한 말을 떠올려 보세요. 나라의 크기, 계절, 왜구, 날씨에 대한 말이었어요.',
    // 진영을 돌며 듣고 이성계에게 돌아와 가린다(2026-10-30 선생님: 마을 탐색 중심)
    howto: { title: '까닭과 소문 가려내기', steps: ['진영 곳곳의 군사 여섯 명(느낌표)을 찾아가 이야기를 들어요.', '모두 들으면 이성계에게 돌아가, 들은 말이 이성계가 든 까닭인지 소문인지 가려요.'] },
    notYet: { who: 'yiseonggye', text: '아직 듣지 못한 군사가 있다. 진영을 더 돌아보아라.' },
    back: { who: 'guide', text: '여섯 군사의 이야기를 모두 들었어. 이성계에게 돌아가자.' },
    judgeIntro: { who: 'yiseonggye', text: '들은 이야기를 하나씩 말해 보아라. 내가 한 말인지, 떠도는 소문인지 가려 보자.' },
    heardAs: '들은 말',
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

  // 한양 궁궐 마당의 관리(2026-10-30): 도읍을 옮긴 뒤 다음 일(배운 것 되짚기)을 알려 준다
  court: {
    goal: '궁궐 마당의 관리와 이야기하자',
    official: [{ who: 'minister', text: '새 도읍 한양에 궁궐과 종묘, 사직단이 자리를 잡았소. 이제 지금까지 본 일을 되짚어 봅시다.' }],
  },

  quizzes: [
    { kind: 'quiz', year: 1388, question: '이성계가 군사를 돌린 곳은?', options: ['귀주', '위화도', '강화도'], answer: 1, explain: '압록강의 섬 위화도에서 군사를 돌렸어요. 이 일을 위화도 회군이라고 해요.', src: ['S23'] },
    { kind: 'quiz', year: 1394, question: '조선이 새 도읍으로 정한 곳은?', options: ['개경', '평양', '한양'], answer: 2, explain: '1394년 한양으로 도읍을 옮겼어요.', src: ['S24'] },
  ],
};
