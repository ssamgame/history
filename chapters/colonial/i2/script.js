// 일제 강점기편 2장 「3·1 운동」. 사실은 비상 5-2 교과서 122~123쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
    leader: { name: '종교 지도자', mark: '代', color: '#3a3530', look: 'gentleman' },
    yugwansun: { name: '유관순', mark: '柳', color: '#6b6152', look: 'yugwansun' },
  },
  intro: [
    { who: 'narr', text: '제1차 세계 대전이 끝나고, 전쟁에서 진 나라들의 식민지가 독립하자 우리 민족도 독립의 희망을 갖게 되었어요.', src: ['S51'] },
    { who: 'narr', text: '종교 지도자들은 고종의 장례식에 맞춰 한 민족이 함께하는 만세 시위를 계획했어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1919년 3월 1일, 서울 탑골 공원이야. 사람들이 품속에 무언가를 숨기고 모여들어.' },
    { who: 'guide', text: '다들 긴장한 얼굴이야. 무엇을 숨기고 있는지 저기 학생에게 살짝 물어보자.' },
  ],
  goals: ['학생에게 말을 걸어 보자', '종교 지도자를 만나자', '유관순의 이야기를 들어 보자', '만세 운동에 함께하자', '배운 내용을 확인해 보자'],
  minigameTitle: '대한 독립 만세',
  npc: {
    student: {
      first: [
        { who: 'student', text: '오늘 탑골 공원에서 독립 선언서를 읽고 만세 시위를 할 거예요.', src: ['S51'] },
        { who: 'student', text: '품속에 태극기를 숨겨 왔어요. 함께 나눠 주실래요?' },
      ],
      later: [{ who: 'student', text: '쉿, 조금만 기다리면 시작이에요! 저쪽 신사분이 종교 지도자예요. 말씀을 들어 보세요.' }],
    },
    leader: {
      tooEarly: [{ who: 'leader', text: '오늘 이 공원에 무슨 일이 있는지, 저기 학생들에게 먼저 들어 보시오.' }],
      first: [
        { who: 'leader', text: '우리 민족 대표들은 같은 시각 태화관에 모여 독립을 선언하오.', src: ['S51'] },
        { who: 'leader', text: '조선이 독립한 나라이며 조선인이 이 나라의 주인임을 세계에 알릴 것이오.', src: ['S51'] },
      ],
      later: [{ who: 'leader', text: '종교도 신분도 달라도 오늘은 모두 한마음이오. 저 소녀의 각오도 들어 보시오.' }],
    },
    yugwansun: {
      tooEarly: [{ who: 'yugwansun', text: '먼저 종교 지도자분의 말씀을 들어 보세요. 그다음에 제 고향 이야기를 할게요.' }],
      first: [
        { who: 'yugwansun', text: '만세 시위는 곧 전국으로 퍼질 거예요. 학생, 노동자, 농민, 상인 모두가 함께할 거예요.', src: ['S51'] },
        { who: 'yugwansun', text: '저는 고향 천안으로 내려가 만세 시위를 이끌 거예요.', src: ['S51'] },
      ],
    },
    signDeclare: { always: [
      { who: 'narr', text: '1919년 3월 1일, 학생과 시민들은 탑골 공원에서 독립 선언서를 읽고 만세 시위를 벌였어요(3·1 운동).', src: ['S51'] },
    ] },
    signYu: { always: [
      { who: 'narr', text: '유관순은 천안에서 만세 시위를 이끌다가 일제에 체포되었어요.', src: ['S51'] },
    ] },
    signJeam: { always: [
      { who: 'narr', text: '일제는 만세 시위를 잔인하게 진압하고, 경기도 화성 제암리를 비롯한 여러 마을을 습격했어요.', src: ['S51'] },
    ] },
  },
  parts: {
    flags: {
      type: 'drive', src: ['S51'], title: '숨겨 둔 태극기를 모아 학생들에게 나눠 줘요', counter: '나눠 준 곳', pickupCounter: '모은 태극기', seconds: 120,
      howto: '골목에 숨겨 둔 태극기를 모아, 빛나는 곳의 학생들에게 차례로 나눠 줘요.',
      intro: [
        { who: 'student', text: '곧 탑골 공원에서 선언서를 읽어요. 그 전에 꼭 해야 할 일이 있어요.' },
        { who: 'student', text: '태극기를 골목 여기저기에 숨겨 두었어요. 모아서 친구들에게 나눠 주세요!' },
      ],
      route: [
        { label: '학생들', needPickups: true, needSay: '먼저 숨겨 둔 태극기를 모두 모아요.', talk: [{ who: 'student', text: '고마워요! 품속에 숨겨 두었다가 신호가 오면 꺼낼게요.' }] },
        { label: '시민들', talk: [{ who: 'leader', text: '곧 선언서를 읽을 시각이오. 학생들도 조심히 움직이시오.' }] },
      ],
      pickups: [{ label: '태극기' }, { label: '태극기' }, { label: '태극기' }, { label: '태극기' }],
      fail: '화살표를 따라 태극기를 모아 나눠 줘요.',
    },
    march: {
      type: 'drive', title: '독립 선언 뒤 거리로! 만세 행진을 이끌어요', counter: '지난 거리', seconds: 150,
      howto: '빛나는 곳을 차례로 지나가요. 탑골 공원에서는 독립 선언서를 다 읽을 때까지 기다려요. 길을 막는 헌병은 피해요.',
      intro: [{ who: 'student', text: '이제 시작이에요! 독립 선언서를 읽고 다 함께 거리로 나가요!' }],
      route: [
        { label: '탑골 공원', hold: 5, holdLabel: '독립 선언서를 읽는 중', holdSay: '독립 선언서를 읽고 있어요. 다 읽을 때까지 기다려요.',
          talk: [{ who: 'student', text: '대한 독립 만세! 우리나라는 독립한 나라이고, 우리가 이 나라의 주인이다!' }] },
        { label: '종로 거리', talk: [{ who: 'student', text: '학생과 시민, 상인이 모두 함께 만세를 불러요!' }] },
        { label: '시장', say: '장날에 모인 사람들도 만세를 외쳤어요.' },
        { label: '큰길', talk: [{ who: 'yugwansun', text: '오늘 들은 만세 소리를 고향 천안 사람들에게도 꼭 전할 거예요.' }, { who: 'student', text: '만세 시위가 전국으로, 나라 밖으로도 퍼져 나가요!' }] },
      ],
      bump: '헌병이 길을 막았어요! 앞 지점에서 다른 길로 가요.',
      fail: '빛나는 곳을 따라 가요. 헌병이 지나간 뒤에 움직여요.',
      done: [{ who: 'guide', text: '만세 소리가 거리마다 울렸어. 이제 역사책으로 3·1 운동의 흐름을 살펴보자.' }],
    },
    // 3·1 운동의 흐름: 차례대로 찾아가기·찾기 대신 역사책을 넘기며 본다(선생님 의견, 근대 4·5장과 같은 방식)
    flow: {
      type: 'book', title: '역사책으로 보는 3·1 운동',
      intro: [{ who: 'leader', text: '3·1 운동이 어떻게 일어나고 퍼졌는지 역사책으로 차례차례 넘겨 보시오.' }],
      pages: [
        { title: '독립의 희망', year: '1918년', pic: 'ww1end', lines: [{ who: 'narr', text: '제1차 세계 대전이 끝났어요.', src: ['S51'] }, { who: 'narr', text: '전쟁에서 진 나라들의 식민지가 독립하자, 우리 민족도 독립의 희망을 갖게 되었어요.', src: ['S51'] }] },
        { title: '독립 선언', year: '1919년 3월 1일', pic: 'declaration', lines: [{ who: 'narr', text: '1919년 3월 1일, 학생과 시민들은 탑골 공원에서 독립 선언서를 읽고 만세 시위를 벌였어요(3·1 운동).', src: ['S51'] }] },
        { title: '전국으로 퍼진 만세 시위', year: '1919년', pic: 'spread', lines: [{ who: 'narr', text: '만세 시위는 전국으로 퍼졌고, 나라 밖에서도 일어났어요. 여러 계층이 참여한 전 민족적인 운동이었어요.', src: ['S51'] }, { who: 'narr', text: '유관순은 천안에서 만세 시위를 이끌다가 일제에 체포되었어요.', src: ['S51'] }] },
        { title: '일제의 진압', year: '1919년', pic: 'crackdown', lines: [{ who: 'narr', text: '일제는 만세 시위를 잔인하게 진압하고, 경기도 화성 제암리를 비롯한 여러 마을을 습격했어요.', src: ['S51'] }] },
      ],
    },
  },
  result: [{ who: 'narr', text: '3·1 운동은 일제의 탄압으로 좌절되었지만, 독립을 향한 한국인의 열망과 의지를 전 세계에 알렸어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1919, question: '3·1 운동이 일어난 해는?', options: ['1894년', '1919년', '1945년'], answer: 1, explain: '1919년 3월 1일 3·1 운동이 일어났어요.', src: ['S51'] },
    { kind: 'quiz', year: 1919, question: '학생과 시민이 독립 선언서를 읽고 만세 시위를 시작한 곳은?', options: ['탑골 공원', '남한산성', '위화도'], answer: 0, explain: '학생과 시민은 탑골 공원에서 독립 선언서를 읽었어요.', src: ['S51'] },
  ],
};
