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
    { who: 'narr', text: '영조와 정조는 여러 당파의 인재를 고르게 쓰려는 탕평책을 펼쳤고, 정조는 아버지 사도세자의 무덤을 수원의 \'화산\'이라는 산으로 옮긴 뒤 그 가까이에 새 성을 쌓게 했어요.', src: ['S41', 'S39'] },
  ],

  start: [{ who: 'guide', text: '너는 수원 화성을 쌓는 젊은 일꾼이야. 공사장 사람들의 이야기를 들어 보자.' }],

  goals: ['공사장 사람들의 이야기를 모두 들어 보자', '차일 아래의 정조를 찾아가자', '정약용에게 가 보자', '도르래 세 틀을 당겨 보자', '거중기 물레로 가서 성을 쌓자', '정조에게 가서 화성을 둘러보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 들으면 차일 아래의 정조를 찾아가자.' },

  npc: {
    official: {
      first: [
        { who: 'official', text: '영조께서는 여러 당파의 인재를 고르게 쓰는 탕평책을 펼치셨지.', src: ['S41'] },
        { who: 'official', text: '탕평의 뜻을 새긴 비석을 성균관에 세우시기도 했다네.', src: ['S41'] },
        { who: 'official', text: '지금 임금께서도 탕평을 이어 가고 계시지.', src: ['S41'] },
      ],
      bridge: { who: 'official', text: '일꾼의 말을 들었구나. 이 공사는 임금의 큰 뜻으로 하는 일이란다.' },
      later: [{ who: 'official', text: '일꾼들이 지치지 않아야 공사가 빨리 끝날 텐데. 저쪽 일꾼들에게도 가 보아라.' }],
    },
    worker: {
      first: [
        { who: 'worker', text: '1794년 정월에 성 쌓는 공사를 시작했어.', src: ['S39'] },
        { who: 'worker', text: '돌이 너무 무거워! 정약용 나리가 만든 기계가 있대.' },
      ],
      bridge: { who: 'worker', text: '관리 나리 말씀은 들었지? 우리는 돌 나르느라 정신이 없어.' },
      later: [{ who: 'worker', text: '영차, 영차! 이 돌 하나 옮기는 데도 여럿이 붙어야 해.' }],
    },
    jeongyakyong: {
      first: [
        { who: 'jeongyakyong', text: '『기기도설』이라는 책을 참고해서 무거운 돌을 드는 거중기를 고안했다.', src: ['S40'] },
        { who: 'jeongyakyong', text: '거중기는 도르래로 무거운 물건을 들어 올리는 기구란다.', src: ['S40'] },
        { who: 'jeongyakyong', text: '여기 도르래 세 틀이 있다. 같은 돌을 달았으니 하나씩 당겨 보아라.' },
      ],
      later: [{ who: 'jeongyakyong', text: '도르래를 여럿 쓰면 힘이 덜 든단다.' }],
    },
    // 장안문 안내판(signGate)은 간판(이름만)으로 바뀌었다(C-03). 성문 이야기는 화성 둘러보기(tour) 해설에 그대로 있다
    jeongjo: {
      wait: [{ who: 'jeongjo', text: '공사장 사람들의 이야기를 모두 들어 보아라.' }],
      first: [
        { who: 'jeongjo', text: '나는 아버지 사도세자의 무덤을 수원의 \'화산\'이라는 산으로 옮겼다.', src: ['S39'] },
        { who: 'jeongjo', text: '이 성 안에 행궁을 지어 아버지 무덤에 갈 때 머물 것이다.', src: ['S39'] },
        { who: 'jeongjo', text: '정약용이 만든 거중기로 성을 쌓아 보아라. 먼저 정약용에게 가 보아라.' },
      ],
    },
  },

  // 도르래 직접 당겨 보기(D-27): 세 틀을 아무 차례로 당겨 보고, 가장 가볍게 들린 것을 고른다
  pulley: {
    howto: { title: '도르래 당겨 보기', steps: ['도르래 틀 세 곳(가·나·다) 앞에서 줄 당기기 버튼을 길게 눌러 돌을 들어 봐요.', '셋 다 당겨 본 뒤 가장 가볍게 들린 것을 골라요.'] },
    feel: [
      { who: 'guide', text: '끙! 「가」는 돌이 아주 무거워. 겨우 조금 올라가.' },
      { who: 'guide', text: '「나」는 아까보다 조금 가벼워.' },
      { who: 'guide', text: '「다」는 돌이 가볍게 쑥 올라가!' },
    ],
    ask: { who: 'jeongyakyong', text: '같은 돌인데, 어느 틀에서 가장 가볍게 들리더냐?' },
    options: ['가 (도르래 없음)', '나 (움직도르래 1개)', '다 (움직도르래 2개)'],
    answer: 2,
    fail: '돌에 달린 움직도르래가 많을수록 줄을 당기는 힘이 줄어들어요.',
    done: [{ who: 'guide', text: '맞아! 거중기는 도르래 여러 개로 무거운 돌을 적은 힘으로 들어 올려.' }],
  },
  // 물레 돌려 성 쌓기(D-27, D-30): 물레 버튼을 길게 눌러 돌을 들고, 돌을 끌어(방향키도 됨) 성벽 빈자리에 내려놓는다
  wall: {
    howto: { title: '거중기로 성 쌓기', steps: ['물레 돌리기 버튼을 길게 눌러 돌을 성벽보다 높이 들어 올려요.', '돌을 끌어서(방향키도 돼요) 성벽의 빛나는 빈자리에 내려놓아요.'] },
    wind: { who: 'guide', text: '물레를 돌리자! 버튼을 떼지 말고 길게 누르면 돌이 성벽보다 높이 올라가.' },
    up: { who: 'guide', text: '돌이 다 올라갔어. 이제 돌을 끌어서 빛나는 빈자리에 내려놓자.' },
    notGap: '여기는 빈자리가 아니에요. 돌을 빛나는 빈자리 위로 옮긴 뒤 내려놓아요.',
    done: [{ who: 'guide', text: '성벽의 빈자리가 모두 채워졌어!' }],
  },
  // 마무리: 정조와 함께 장안문 곁 성벽 위에서 완성된 화성을 둘러본다
  tour: [
    { who: 'guide', text: '정조와 함께 장안문 곁 성벽 위에 올라 완성된 화성을 둘러보자.' },
    { who: 'narr', text: '화성의 북문은 장안문, 남문은 팔달문이에요. 서문은 화서문, 동문은 창룡문이에요.', src: ['S48'] },
    { who: 'narr', text: '문마다 반달 모양의 옹성을 둘러 문을 지켰어요.', src: ['S48'] },
  ],
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
