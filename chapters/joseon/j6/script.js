// 조선편 6장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 6장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    official: { name: '관리', mark: '官', color: '#55608a', look: 'joseonOfficial' },
    worker: { name: '일꾼', mark: '工', color: '#6b4a32', look: 'worker' },
    jeongyakyong: { name: '정약용', mark: '丁', color: '#3a4a5a', look: 'jeongyakyong' },
    jeongjo: { name: '정조', mark: '王', color: '#a3262a', look: 'jeongjo' },
  },

  intro: [
    { who: 'narr', text: '영조와 정조는 여러 당파의 인재를 고르게 쓰려는 탕평책을 펼쳤어요.', src: ['S41'] },
    { who: 'narr', text: '정조는 아버지 사도세자의 무덤을 수원의 \'화산\'이라는 산(지금의 화성시 융릉 자리)으로 옮기고, 그 가까이에 새 성을 쌓게 했어요.', src: ['S39'] },
  ],

  start: [
    { who: 'guide', text: '너는 수원 화성을 쌓는 젊은 일꾼이야. 공사장이 무척 바빠.' },
    { who: 'guide', text: '커다란 돌을 어떻게 저 높이까지 올릴까? 공사를 맡은 관리 나리께 먼저 여쭈어보자.' },
  ],

  goals: ['공사장의 관리에게 말을 걸어 보자', '돌을 나르는 일꾼에게 말을 걸어 보자', '거중기 옆의 정약용을 찾아가자', '차일 아래의 정조를 찾아가자', '거중기로 성을 쌓아 보자', '배운 내용을 확인해 보자'],

  npc: {
    official: {
      first: [
        { who: 'official', text: '영조께서는 여러 당파의 인재를 고르게 쓰는 탕평책을 펼치셨지.', src: ['S41'] },
        { who: 'official', text: '탕평의 뜻을 새긴 비석을 성균관에 세우시기도 했다네.', src: ['S41'] },
        { who: 'official', text: '지금 임금께서도 탕평을 이어 가고 계시지.', src: ['S41'] },
      ],
      later: [{ who: 'official', text: '일꾼들이 지치지 않아야 공사가 빨리 끝날 텐데. 저쪽 일꾼들에게도 가 보아라.' }],
    },
    worker: {
      tooEarly: [{ who: 'worker', text: '저기 관리 나리께 먼저 인사드려.' }],
      first: [
        { who: 'worker', text: '1794년 정월에 성 쌓는 공사를 시작했어.', src: ['S39'] },
        { who: 'worker', text: '돌이 너무 무거워! 정약용 나리가 만든 기계를 보러 가 봐.' },
      ],
      later: [{ who: 'worker', text: '영차, 영차! 이 돌 하나 옮기는 데도 여럿이 붙어야 해.' }],
    },
    jeongyakyong: {
      tooEarly: [{ who: 'jeongyakyong', text: '공사장을 먼저 둘러보고 오너라.' }],
      first: [
        { who: 'jeongyakyong', text: '『기기도설』이라는 책을 참고해서 무거운 돌을 드는 거중기를 고안했다.', src: ['S40'] },
        { who: 'jeongyakyong', text: '거중기는 도르래로 무거운 물건을 들어 올리는 기구란다.', src: ['S40'] },
        { who: 'jeongyakyong', text: '임금께서 차일 아래에서 너를 부르신다.' },
      ],
      later: [{ who: 'jeongyakyong', text: '도르래를 여럿 쓰면 힘이 덜 든단다.' }],
    },
    signGate: { always: [
      { who: 'narr', text: '화성의 북문은 장안문, 남문은 팔달문이에요. 서문은 화서문, 동문은 창룡문이에요.', src: ['S48'] },
      { who: 'narr', text: '문마다 반달 모양의 옹성을 둘러 문을 지켰어요.', src: ['S48'] },
    ] },
    signUigwe: { always: [
      { who: 'narr', text: '『화성성역의궤』는 화성을 쌓은 과정을 자세히 적은 책으로, 1801년에 인쇄했어요.', src: ['S42'] },
    ] },
    signTangpyeong: { always: [
      { who: 'narr', text: '영조는 1742년 성균관에 탕평비를 세워 탕평의 뜻을 새겼어요.', src: ['S41'] },
    ] },
    jeongjo: {
      tooEarly: [{ who: 'jeongjo', text: '정약용에게 거중기 이야기를 먼저 들어 보아라.' }],
      first: [
        { who: 'jeongjo', text: '나는 아버지 사도세자의 무덤을 수원의 \'화산\'이라는 산으로 옮겼다.', src: ['S39'] },
        { who: 'jeongjo', text: '이 성 안에 행궁을 지어 아버지 무덤에 갈 때 머물 것이다.', src: ['S39'] },
        { who: 'jeongjo', text: '자, 거중기로 성을 쌓아 보아라.' },
      ],
    },
  },

  pulley: {
    title: '도르래 실험: 같은 돌을 가장 적은 힘으로 드는 것은?',
    prompt: '돌의 무게는 셋 다 같아요. 돌에 달린 움직도르래의 수를 세어 보세요.',
    cards: [
      { text: '가 (도르래 없음)', correct: false },
      { text: '나 (움직도르래 1개)', correct: false },
      { text: '다 (움직도르래 2개)', correct: true },
    ],
    fail: '돌에 달린 움직도르래가 많을수록 줄을 당기는 힘이 줄어들어요.',
    done: [{ who: 'guide', text: '맞아! 거중기는 도르래 여러 개로 무거운 돌을 적은 힘으로 들어 올려.' }],
  },
  wall: {
    howto: [{ who: 'guide', text: '거중기가 돌을 매달고 성벽 위를 천천히 지나갈 거야. 돌이 빛나는 빈자리 바로 위에 오면 \'내리기\'를 눌러 봐!' }],
    early: '조금 일찍 내렸어요. 돌이 빛나는 빈자리 바로 위에 올 때까지 기다려요.',
    late: '조금 늦었어요. 돌이 빈자리를 지나가기 전에 눌러요.',
    done: [{ who: 'guide', text: '성벽의 빈자리가 모두 채워졌어!' }],
  },
  result: [
    { who: 'narr', text: '수원 화성은 공사를 시작한 지 2년 반 만인 1796년에 완성되었어요.', src: ['S39'] },
    { who: 'narr', text: '화성을 쌓은 과정은 『화성성역의궤』라는 책에 자세히 기록했어요.', src: ['S42'] },
    { who: 'narr', text: '수원 화성은 1997년 유네스코 세계문화유산이 되었어요.', src: ['S44'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1724, question: '영조와 정조가 인재를 고르게 쓰려고 펼친 정책은?', options: ['탕평책', '4불가론', '북벌'], answer: 0, explain: '여러 당파의 인재를 고르게 쓰려는 탕평책이에요.', src: ['S41'] },
    { kind: 'quiz', year: 1792, question: '수원 화성을 쌓을 때 무거운 돌을 들어 올린 기구는?', options: ['측우기', '거중기', '자격루'], answer: 1, explain: '정약용이 『기기도설』을 참고해 고안한 거중기예요.', src: ['S40'] },
  ],
};
