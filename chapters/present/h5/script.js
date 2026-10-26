// 현대편 5장 「전쟁 뒤의 삶」. 사실은 비상 5-2 교과서 145쪽(S51)과 이산가족 찾기(S62).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    mother: { name: '행상 아주머니', mark: '母', color: '#b8768a', look: 'woman' },
    grandma: { name: '밀면집 할머니', mark: '老', color: '#6b4a32', look: 'grandma' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
  },
  intro: [
    { who: 'narr', text: '6·25 전쟁을 거치면서 우리 사회는 많은 변화를 겪었어요.', src: ['S51'] },
    { who: 'narr', text: '도시를 중심으로 복구가 이루어지면서 서울을 비롯한 대도시에 사람들이 몰렸어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '부산의 피란민 마을이야. 바다가 보이는 비탈에 축대를 쌓고 판잣집을 층층이 지었어.' },
    { who: 'guide', text: '이 많은 사람들은 어디서 왔을까? 함지박을 인 아주머니에게 먼저 말을 걸어 보자.' },
  ],
  goals: ['행상 아주머니에게 말을 걸어 보자', '밀면집 할머니를 만나자', '학생의 이야기를 들어 보자', '이웃을 도와 함께 일어서자', '배운 내용을 확인해 보자'],
  minigameTitle: '다시 일어서다',
  npc: {
    mother: {
      first: [
        { who: 'mother', text: '도시로 몰려든 사람들은 판잣집 같은 어려운 환경에서 살았지요.', src: ['S51'] },
        { who: 'mother', text: '전쟁으로 많은 남성이 죽거나 다쳐서, 여성들이 공장에 다니거나 행상을 하며 가족의 생계를 책임지는 경우가 많아졌어요.', src: ['S51'] },
      ],
      later: [{ who: 'mother', text: '오늘도 열심히 팔아야 아이들 밥을 먹이지요. 국숫집 할머니도 만나 보세요.' }],
    },
    grandma: {
      tooEarly: [{ who: 'grandma', text: '저기 아주머니가 이 마을 사정을 잘 안단다. 먼저 만나 보렴.' }],
      first: [
        { who: 'grandma', text: '38도선 북쪽에서 피란 온 사람들은 고향 음식 냉면을 그리워했단다.', src: ['S51'] },
        { who: 'grandma', text: '메밀을 구하기 어려워서 구호물품으로 받은 밀가루로 냉면을 만들었지. 이렇게 부산 밀면이 시작되었다고 하더구나.', src: ['S51'] },
      ],
      later: [{ who: 'grandma', text: '밀면 한 그릇 먹고 가렴. 운동장에서 공부하는 학생들도 보고 오고.' }],
    },
    student: {
      tooEarly: [{ who: 'student', text: '우리 마을 어른들이 어떻게 사시는지 먼저 들어 보세요.' }],
      first: [
        { who: 'student', text: '교실이 부서져서 운동장에서 수업을 받아요.', src: ['S51'] },
        { who: 'student', text: '전쟁 뒤 남과 북은 서로를 적으로 여기는 교육을 강화하기도 했어요. 그래서 오랫동안 긴장이 이어졌지요.', src: ['S51'] },
      ],
    },
    signFamily: { always: [
      { who: 'narr', text: '전쟁으로 헤어진 가족을 찾으려고 1983년 텔레비전 생방송이 138일 동안 이어졌고, 1만여 명이 다시 만났어요.', src: ['S62'] },
    ] },
    signTask: { always: [
      { who: 'narr', text: '분단이 이어지면서 오늘날까지 전쟁의 상처는 아물지 않았어요. 평화 통일을 이루는 일은 우리의 과제로 남아 있어요.', src: ['S51'] },
    ] },
  },
  parts: {
    help: {
      type: 'drive', src: ['S51'], title: '피란민 마을: 우물물을 길어 이웃집에 날라 줘요', counter: '물을 나른 집', seconds: 150,
      howto: '빛나는 곳을 차례로 지나요. 우물에서는 물을 긷고, 이웃집 앞에서는 물을 붓는 동안 잠깐 기다려요.',
      intro: [
        { who: 'mother', text: '전쟁 통에 남편을 잃어서, 행상을 하며 아이들을 키우고 있어요.' },
        { who: 'grandma', text: '마을에 물이 귀하단다. 우물물을 길어 이웃집에 좀 날라 주렴.' },
      ],
      route: [
        { label: '우물', hold: 3, holdLabel: '물 긷는 중', holdSay: '두레박으로 물을 길어요.' },
        { label: '첫째 판잣집', hold: 2, holdLabel: '물 붓는 중', talk: [{ who: 'mother', text: '고마워요. 판잣집이라 비가 오면 물이 새지만, 그래도 우리 집이에요.' }] },
        { label: '우물', hold: 3, holdLabel: '물 긷는 중' },
        { label: '밀면집', hold: 2, holdLabel: '물 붓는 중', talk: [{ who: 'grandma', text: '이 물로 밀면을 삶는단다. 고향 냉면 맛이 그리워서 밀가루로 만들었지.' }] },
        { label: '우물', hold: 3, holdLabel: '물 긷는 중' },
        { label: '운동장 교실', hold: 2, holdLabel: '물 붓는 중', talk: [{ who: 'student', text: '교실이 부서져서 운동장에서 공부해요. 물 고마워요!' }] },
      ],
      fail: '시간 안에 물을 다 나르지 못했어요. 화살표를 따라 다시 해 봐요.',
    },
    // 전쟁 뒤의 생활: 차례대로 찾아가기·찾기 대신 역사책을 넘기며 본다(선생님 의견, 근대 4·5장과 같은 방식)
    life: {
      type: 'book', title: '역사책으로 보는 전쟁 뒤의 생활',
      intro: [{ who: 'student', text: '우리 마을 사람들이 어떻게 살고 있는지 역사책으로 넘겨 보세요.' }],
      pages: [
        { title: '판잣집', pic: 'shanty', lines: [{ who: 'narr', text: '도시로 몰려든 사람들은 판잣집 같은 어려운 환경에서 살았어요.', src: ['S51'] }] },
        { title: '가족을 돌본 여성들', pic: 'peddler', lines: [{ who: 'narr', text: '전쟁으로 많은 남성이 죽거나 다쳤어요.', src: ['S51'] }, { who: 'narr', text: '그래서 여성들이 공장에 다니거나 행상을 하며 가족의 생계를 책임지는 경우가 많아졌어요.', src: ['S51'] }] },
        { title: '부산 밀면', pic: 'milmyeon', lines: [{ who: 'narr', text: '메밀을 구하기 어려워서 구호물품으로 받은 밀가루로 냉면을 만들었어요. 부산 밀면은 이렇게 시작되었다고 해요.', src: ['S51'] }] },
        { title: '운동장 교실', pic: 'outdoor', lines: [{ who: 'narr', text: '교실이 부서져서 학생들은 운동장에서 수업을 받았어요.', src: ['S51'] }] },
        { title: '이산가족 찾기', year: '1983년', pic: 'reunion', lines: [{ who: 'narr', text: '전쟁으로 헤어진 가족을 찾으려고 1983년 텔레비전 생방송이 138일 동안 이어졌고, 1만여 명이 다시 만났어요.', src: ['S62'] }] },
      ],
    },
  },
  result: [{ who: 'narr', text: '사람들은 어려움 속에서도 서로 도우며 다시 일어섰어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1953, question: '피란민이 밀가루로 냉면을 만들면서 생긴 음식은?', options: ['밀면', '떡볶이', '짜장면'], answer: 0, explain: '구호물품 밀가루로 만든 냉면에서 부산 밀면이 시작되었다고 해요.', src: ['S51'] },
    { kind: 'quiz', year: 1953, question: '6·25 전쟁 뒤 우리에게 남은 과제는?', options: ['평화 통일', '개항', '신분제 없애기'], answer: 0, explain: '분단이 이어져 평화 통일은 우리의 과제로 남아 있어요.', src: ['S51'] },
  ],
};
