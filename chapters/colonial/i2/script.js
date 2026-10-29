// 일제 강점기편 2장 「3·1 운동」(D-39). 사실은 비상 5-2 교과서 122~123쪽(S51).
// 탐험: 탑골 공원 문으로 들어와 학생·유관순·상인 이야기를 아무 차례로 듣고(모두 들어야 종교 지도자),
// 종교 지도자에게 가면 학생의 결심 → 팔각정에서 학생이 독립 선언서를 읽고 모두 품속 태극기를 꺼내 만세를 외치는 장면.
// 놀이: 숨겨 둔 태극기 모아 나눠 주기 → 학생에게 말을 걸면 만세 행진 →
// 유관순에게 말을 걸면 만세의 흐름 걷기(독립의 희망 → 전국으로 퍼진 만세 → 천안 아우내 장터 → 화성 제암리).
// 예전 역사책 네 쪽과 안내판(독립 선언·유관순·제암리)의 출처 있는 문장은 장면·걷기 자리의 대사로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#22262e' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
    leader: { name: '종교 지도자', mark: '代', color: '#3a3530', look: 'gentleman' },
    yugwansun: { name: '유관순', mark: '柳', color: '#6b6152', look: 'yugwansun' },
    merchant: { name: '상인', mark: '商', color: '#7a5a3c', look: 'commoner' },
    reader: { name: '신문 보는 사람', mark: '民', color: '#4a4f5a', look: 'citizen' },
    worker: { name: '노동자', mark: '工', color: '#4a4f5a', look: 'worker' },
    farmer: { name: '농민', mark: '農', color: '#7a4e32', look: 'peasant' },
  },
  intro: [
    { who: 'narr', text: '제1차 세계 대전이 끝나고, 전쟁에서 진 나라들의 식민지가 독립하자 우리 민족도 독립의 희망을 갖게 되었어요.', src: ['S51'] },
    { who: 'narr', text: '종교 지도자들은 고종의 장례식에 맞춰 한 민족이 함께하는 만세 시위를 계획했어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1919년 3월 1일, 서울 탑골 공원이야. 사람들이 품속에 무언가를 숨기고 모여들어.' },
    { who: 'guide', text: '다들 긴장한 얼굴이야. 느낌표가 뜬 사람에게 아무 차례로 다가가 살짝 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['탑골 공원 사람들의 이야기를 모두 들어 보자', '종교 지도자를 찾아가자', '팔각정에서 독립 선언서를 읽는 모습을 지켜보자', '숨겨 둔 태극기를 모아 사람들에게 나눠 주자', '거리로 나가 만세 행진을 이끌자', '만세 운동이 어떻게 퍼져 나갔는지 따라가 보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 종교 지도자를 찾아가자.' },
  minigameTitle: '대한 독립 만세',
  npc: {
    student: {
      first: [
        { who: 'student', text: '오늘 탑골 공원에서 독립 선언서를 읽고 만세 시위를 할 거예요.', src: ['S51'] },
        { who: 'student', text: '품속에 태극기를 숨겨 왔어요. 신호가 오면 꺼낼 거예요.' },
      ],
      bridge: { who: 'student', text: '다른 분들 이야기도 들으셨군요. 저도 말씀드릴게요.' },
      later: [{ who: 'student', text: '쉿, 조금만 기다리면 시작이에요!' }],
    },
    yugwansun: {
      first: [
        { who: 'yugwansun', text: '만세 시위는 곧 전국으로 퍼질 거예요. 학생, 노동자, 농민, 상인 모두가 함께할 거예요.', src: ['S51'] },
        { who: 'yugwansun', text: '저는 고향 천안으로 내려가 만세 시위를 이끌 거예요.', src: ['S51'] },
      ],
      bridge: { who: 'yugwansun', text: '다른 분들 이야기도 들었군요. 제 각오도 들어 주세요.' },
      later: [{ who: 'yugwansun', text: '고향 사람들에게도 이 만세 소리를 꼭 전할 거예요.' }],
    },
    merchant: {
      first: [
        { who: 'merchant', text: '종교 지도자들이 고종의 장례식에 맞춰 한 민족이 함께하는 만세 시위를 계획했다오.', src: ['S51'] },
        { who: 'merchant', text: '오늘은 가게 문을 닫고 나도 함께할 거요.' },
      ],
      bridge: { who: 'merchant', text: '자네도 소식을 들었구먼. 나도 한마디 하리다.' },
      later: [{ who: 'merchant', text: '장사꾼이라고 나라를 모르겠소?' }],
    },
    leader: {
      wait: [{ who: 'leader', text: '공원 사람들의 이야기를 먼저 모두 듣고 오시오. 그다음에 오늘 일을 말해 주겠소.' }],
      first: [
        { who: 'leader', text: '우리 민족 대표들은 같은 시각 태화관에 모여 독립을 선언하오.', src: ['S51'] },
        { who: 'leader', text: '조선이 독립한 나라이며 조선인이 이 나라의 주인임을 세계에 알릴 것이오.', src: ['S51'] },
        { who: 'me', text: '저도 함께 만세를 부르겠습니다!' },
      ],
      later: [{ who: 'leader', text: '종교도 신분도 달라도 오늘은 모두 한마음이오.' }],
    },
  },
  // 탐험 끝 장면: 팔각정에서 학생이 독립 선언서를 읽고, 모두 품속 태극기를 꺼내 만세를 외친다
  declare: {
    lines: [
      { who: 'guide', text: '팔각정 앞으로 사람들이 모였어. 한 학생이 품에서 종이를 꺼내 읽기 시작해.' },
      { who: 'student', text: '조선이 독립한 나라이며 조선인이 이 나라의 주인임을 선언합니다!', src: ['S51'] },
      { who: 'narr', text: '1919년 3월 1일, 학생과 시민들은 탑골 공원에서 독립 선언서를 읽고 만세 시위를 벌였어요(3·1 운동).', src: ['S51'] },
      { who: 'student', text: '대한 독립 만세!' },
      { who: 'me', text: '대한 독립 만세!' },
      { who: 'leader', text: '자, 이제 거리로 나갑시다!' },
    ],
  },
  parts: {
    flags: {
      type: 'drive', src: ['S51'], title: '숨겨 둔 태극기를 모아 사람들에게 나눠 줘요', counter: '나눠 준 곳', pickupCounter: '모은 태극기', seconds: 120,
      howto: '골목에 숨겨 둔 태극기를 모아, 빛나는 곳의 사람들에게 차례로 나눠 줘요.',
      intro: [ // 탐험 끝 뒤 바로(학생)
        { who: 'student', text: '선언서를 다 읽었어요! 이제 거리로 나갈 거예요.' },
        { who: 'student', text: '골목 여기저기에 태극기를 더 숨겨 두었어요. 모아서 거리로 나갈 사람들에게 나눠 주세요!' },
      ],
      route: [
        { label: '학생들', needPickups: true, needSay: '먼저 숨겨 둔 태극기를 모두 모아요.', talk: [{ who: 'student', text: '고마워요! 이 태극기를 들고 거리로 나갈게요.' }] },
        { label: '시민들', talk: [{ who: 'leader', text: '모두 태극기를 들었구려. 학생들도 조심히 움직이시오.' }] },
      ],
      pickups: [{ label: '태극기' }, { label: '태극기' }, { label: '태극기' }, { label: '태극기' }],
      fail: '화살표를 따라 태극기를 모아 나눠 줘요.',
    },
    march: {
      type: 'drive', title: '공원 문을 나서 거리로! 만세 행진을 이끌어요', counter: '지난 거리', seconds: 150,
      howto: '빛나는 곳을 차례로 지나가요. 공원 문에서는 사람들이 다 모일 때까지 기다려요. 길을 막는 헌병은 피해요.',
      intro: [ // 학생에게 말을 걸면(C-05)
        { who: 'student', text: '태극기를 다 나눠 줬어요. 이제 다 함께 거리로 나가요!' },
      ],
      route: [
        { label: '탑골 공원 문', hold: 5, holdLabel: '사람들이 모이는 중', holdSay: '사람들이 공원 문으로 모여들어요. 다 모일 때까지 기다려요.',
          talk: [{ who: 'student', text: '대한 독립 만세! 우리나라는 독립한 나라이고, 우리가 이 나라의 주인이다!' }] },
        { label: '종로 거리', talk: [{ who: 'student', text: '학생과 시민, 상인이 모두 함께 만세를 불러요!' }] },
        { label: '시장', say: '장날에 모인 사람들도 만세를 외쳤어요.' },
        { label: '큰길', talk: [{ who: 'yugwansun', text: '오늘 들은 만세 소리를 고향 천안 사람들에게도 꼭 전할 거예요.' }] },
      ],
      bump: '헌병이 길을 막았어요! 앞 지점에서 다른 길로 가요.',
      fail: '빛나는 곳을 따라 가요. 헌병이 지나간 뒤에 움직여요.',
      done: [{ who: 'guide', text: '만세 소리가 거리마다 울렸어.' }],
    },
    // 만세의 흐름 걷기(D-39): 역사책 대신 빛나는 자리로 걸어가 대화 버튼으로 겪는다(장면이라 첫 시도 점수에는 넣지 않는다)
    flow: {
      type: 'scene', title: '만세 운동이 퍼져 나간 길',
      howto: '빛나는 자리로 걸어가 대화 버튼을 눌러요. 만세 운동이 어떻게 퍼져 나갔는지 차례로 봐요.',
      intro: [ // 유관순에게 말을 걸면(C-05)
        { who: 'yugwansun', text: '만세 소리가 어떻게 퍼져 나갔는지 함께 가 봐요.' },
        { who: 'yugwansun', text: '빛나는 자리에 가서 대화 버튼을 눌러 보세요.' },
      ],
      stations: [
        { id: 'hope', label: '1918년 신문', act: '신문 펼쳐 보기', lines: [
          { who: 'reader', text: '이 신문 좀 보게! 큰 전쟁이 끝났다는군.' },
          { who: 'narr', text: '제1차 세계 대전이 끝났어요.', src: ['S51'] },
          { who: 'narr', text: '전쟁에서 진 나라들의 식민지가 독립하자, 우리 민족도 독립의 희망을 갖게 되었어요.', src: ['S51'] },
        ] },
        { id: 'spread', label: '전국으로', act: '만세 소리 듣기', lines: [
          { who: 'worker', text: '대한 독립 만세!' },
          { who: 'farmer', text: '대한 독립 만세!' },
          { who: 'narr', text: '만세 시위는 전국으로 퍼졌고, 나라 밖에서도 일어났어요. 여러 계층이 참여한 전 민족적인 운동이었어요.', src: ['S51'] },
        ] },
        { id: 'aunae', label: '천안 아우내 장터', act: '장터 만세 보기', lines: [
          { who: 'yugwansun', text: '대한 독립 만세!' },
          { who: 'narr', text: '유관순은 천안에서 만세 시위를 이끌다가 일제에 체포되었어요.', src: ['S51'] },
        ] },
        { id: 'jeamri', label: '화성 제암리', act: '제암리 마을 보기', lines: [
          { who: 'narr', text: '일제는 만세 시위를 잔인하게 진압하고, 경기도 화성 제암리를 비롯한 여러 마을을 습격했어요.', src: ['S51'] },
        ] },
      ],
    },
  },
  result: [{ who: 'narr', text: '3·1 운동은 일제의 탄압으로 좌절되었지만, 독립을 향한 한국인의 열망과 의지를 전 세계에 알렸어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1919, question: '3·1 운동이 일어난 해는?', options: ['1894년', '1919년', '1945년'], answer: 1, explain: '1919년 3월 1일 3·1 운동이 일어났어요.', src: ['S51'] },
    { kind: 'quiz', year: 1919, question: '학생과 시민이 독립 선언서를 읽고 만세 시위를 시작한 곳은?', options: ['탑골 공원', '남한산성', '위화도'], answer: 0, explain: '학생과 시민은 탑골 공원에서 독립 선언서를 읽었어요.', src: ['S51'] },
  ],
};
