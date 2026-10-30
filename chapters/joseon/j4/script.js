// 조선편 4장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 4장 절을 따른다.
// 거북선이 학익진 앞에 섰다는 것은 S43(여러 자료에서 확인). 전투 불꽃은 D-16 원칙에 따라 넣는다(D-25).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    navy: { name: '조선 수군', mark: '水', color: '#2f4a5e', look: 'navy' },
    commoner: { name: '포구 백성', mark: '民', color: '#6b4a32', look: 'commoner' },
    yisunsin: { name: '이순신', mark: '李', color: '#7a2a1e', look: 'yisunsin' },
  },

  intro: [
    { who: 'narr', text: '1592년 4월 일본군이 부산으로 쳐들어와 임진왜란이 일어났어요.', src: ['S34'] },
    { who: 'narr', text: '일본군이 빠르게 북쪽으로 올라오자 선조는 의주까지 피란했어요.', src: ['S34'] },
  ],

  start: [{ who: 'guide', text: '너는 이순신 함대의 젊은 수군이야. 포구 사람들에게 바다 소식을 들어 보자.' }],

  goals: ['포구 사람들의 이야기를 모두 들어 보자', '지휘하는 이순신을 찾아가자', '배를 몰아 적을 넓은 바다로 꾀어내자', '대장선의 이순신에게 배를 몰고 가자', '학익진의 빈자리로 배를 몰아 넣자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 들으면 포구 앞의 이순신을 찾아가자.' },

  npc: {
    navy: {
      first: [
        { who: 'navy', text: '부두의 큰 배들이 판옥선이야. 판옥선은 조선 수군의 주력 전투선이지.', src: ['S50'] },
        { who: 'navy', text: '갑판이 2층이라 노 젓는 군사는 아래층에서, 싸우는 군사는 위층에서 일을 나누어.', src: ['S50'] },
        { who: 'navy', text: '저 배가 거북선이야. 이순신이 군관들과 함께 고쳐 만들었대.', src: ['S36'] },
        { who: 'navy', text: '판옥선 위를 덮개로 덮고 칼과 송곳을 꽂았어. 앞의 용머리 입은 총구멍으로 썼지.', src: ['S36'] },
        { who: 'navy', text: '거북선은 사천 앞바다 싸움에 처음 나섰어.', src: ['S37'] },
      ],
      bridge: { who: 'navy', text: '육지 소식은 들었구나. 바다에는 우리 배들이 있지.' },
      later: [{ who: 'navy', text: '포구의 백성들도 소식을 많이 알고 있어.' }],
    },
    commoner: {
      first: [
        { who: 'commoner', text: '곽재우 같은 사람들이 고향을 지키려고 스스로 의병을 일으켰대요.', src: ['S34'] },
      ],
      bridge: { who: 'commoner', text: '바다 쪽 이야기는 들으셨군요. 육지 소식도 들어 보세요.' },
      later: [{ who: 'commoner', expr: 'worry', text: '육지 소식은 늘 나빠요. 바다만큼은 꼭 지켜 주세요.' }],
    },
    yisunsin: {
      wait: [{ who: 'yisunsin', text: '먼저 포구 사람들의 이야기를 모두 듣고 오너라.' }],
      first: [
        { who: 'yisunsin', text: '적의 배들이 견내량에 모여 있다.', src: ['S35'] },
        { who: 'yisunsin', text: '견내량은 좁고 암초가 많다. 적을 넓은 한산도 앞바다로 끌어내자.', src: ['S35'] },
        { who: 'yisunsin', expr: 'tension', text: '너는 앞장선 배를 몰아 적을 꾀어내라. 출전이다!' },
      ],
    },
  },

  sail: { title: '배 몰기', steps: ['노를 저어 빛나는 원으로 배를 몰아요. 바위는 돌아가요.', '적이 쫓아오면 잡히지 않게 넓은 바다의 원까지 가요.'] },
  lure: {
    go: [{ who: 'guide', text: '앞장선 판옥선을 몰아 견내량 입구(빛나는 원)까지 가 보자. 적이 우리를 보게 해야 해.' }],
    seen: { who: 'guide', text: '적이 우리를 보고 쫓아온다! 배를 돌려 넓은 바다(빛나는 원)로 가자!' },
    fail: '적의 배에 너무 가까이 잡혔어요. 입구에서 적을 보면 바로 배를 돌려 넓은 바다로 가요.',
    done: [{ who: 'guide', text: '적의 배들이 우리 배를 쫓아 넓은 바다로 나왔어!' }],
  },
  wing: {
    howto: { title: '학익진', steps: ['우리 배들이 학이 날개를 편 모양으로 펼쳐져요.', '날개에 빈자리(빛나는 원)를 찾아 배를 몰아 넣어요.'] },
    call: [{ who: 'yisunsin', expr: 'joy', text: '적을 잘 꾀어냈다. 이제 넓은 바다에서 적을 둘러쌀 차례다.' }],
    spread: { who: 'yisunsin', text: '학이 날개를 편 모양으로 배를 늘어세워라! 너는 날개의 빈자리를 채워라.' },
    fail: '학이 날개를 펼친 것처럼 둥글게 휜 줄의 빈자리(빛나는 원)에 넣어요.',
    done: [{ who: 'narr', text: '이순신은 거북선을 앞세우고, 학이 날개를 편 모양으로 배를 늘어세우는 학익진으로 적을 둘러쌌어요.', src: ['S35', 'S43'] }],
  },
  turtle: [
    { who: 'yisunsin', text: '거북선을 앞세워라!' },
    { who: 'navy', text: '거북선이 앞장선다! 덮개 위에는 칼과 송곳, 앞에는 용머리!', src: ['S36'] },
  ],
  // 끝 해설 장면(D-58, chapters/joseon/j4/story.js): result 세 문장을 돌아오는 수군과 포구 사람들 장면 위에
  victory: { line: { who: 'commoner', expr: 'joy', text: '수군이 돌아왔어요! 바다를 지켜 냈어요!' } },
  result: [
    { who: 'narr', text: '1592년 7월, 조선 수군은 한산도 앞바다에서 일본 배를 크게 물리쳤어요. 이 싸움을 한산도 대첩이라고 해요.', src: ['S35'] },
    { who: 'narr', text: '조선 수군은 남쪽 바다를 지켜 냈어요.', src: ['S34', 'S35'] },
    { who: 'narr', text: '임진왜란은 1592년부터 1598년까지 7년 동안 이어졌고, 1598년 노량 해전에서 이순신이 전사했어요.', src: ['S34'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1592, question: '임진왜란 때 나라를 지키려고 스스로 일어난 사람들은?', options: ['삼별초', '의병', '집현전 학자'], answer: 1, explain: '곽재우 같은 의병이 각지에서 일어났어요.', src: ['S34'] },
    { kind: 'quiz', year: 1592, question: '한산도 대첩에서 이순신이 쓴 진법은?', options: ['물막이 작전', '학익진', '성 쌓기'], answer: 1, explain: '학이 날개를 편 모양으로 배를 늘어세워 적을 둘러쌌어요.', src: ['S35'] },
  ],
};
