// 근대편 5장 「근대 문물과 달라진 생활」(D-34). 사실은 비상 5-2 교과서 102~104쪽(S51)과 S69.
// 탐험: 한성 큰길 마을 문으로 들어와 양복 신사·전차 탄 아주머니·학교 앞 학생 이야기를 아무 차례로 듣고(모두 들어야 전차 운전수),
// 운전수에게 가면 학생의 결심 → 해가 지며 전등·가로등이 켜지는 밤 장면.
// 놀이: 근대 문물 가져다 놓기 → 운전수에게 말을 걸면 전차 몰기 → 학생에게 말을 걸면 문물 체험 걷기(전신·전화·전깃불·학교·양화점).
// 예전 역사책(전신·전화기·전차·전등과 가로등·서양식 건물·학교와 신문·옷과 음식)과 안내판의 출처 있는 문장은 대사·장면으로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#22262e' },
    gentleman: { name: '양복 입은 신사', mark: '紳', color: '#3a3530', look: 'gentleman' },
    woman: { name: '전차 탄 아주머니', mark: '女', color: '#b8768a', look: 'woman' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
    driver: { name: '전차 운전수', mark: '電', color: '#2f3540', look: 'teacherUniform' },
    clerk: { name: '전신국 사람', mark: '信', color: '#4a4f5a', look: 'citizen' },
    teacher: { name: '선생님', mark: '師', color: '#3a4a5a', look: 'scholarModern' },
    shopkeeper: { name: '양화점 주인', mark: '商', color: '#7a5a3c', look: 'citizen' },
  },
  intro: [
    { who: 'narr', text: '개항을 한 뒤 정부는 개화 정책을 추진하여 여러 근대 시설을 마련했어요.', src: ['S51'] },
    { who: 'narr', text: '한성 거리의 모습과 사람들의 생활도 크게 달라졌어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1900년 무렵 한성 큰길이야. 땡땡! 종을 울리며 길 한가운데로 전차가 달려와. 길가에는 처음 보는 물건을 파는 가게도 있네.' },
    { who: 'guide', text: '거리가 왜 이렇게 바뀌었을까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['한성 거리 사람들의 이야기를 모두 들어 보자', '정류장 옆의 전차 운전수를 찾아가자', '해가 지면 밤거리가 어떻게 바뀌는지 지켜보자', '근대 문물을 하는 일에 맞게 가져가자', '전차를 몰아 서대문에서 청량리까지 가 보자', '근대 문물을 직접 써 보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 정류장 옆의 전차 운전수를 찾아가자.' },
  minigameTitle: '근대 문물',
  npc: {
    gentleman: {
      first: [
        { who: 'gentleman', text: '한성과 인천 사이에 전신을 놓은 뒤, 일본과 중국까지 이어지는 통신망이 생겼소.', src: ['S51'] },
        { who: 'gentleman', text: '전화기도 들여와서 소식을 빠르게 주고받을 수 있소.', src: ['S51'] },
        { who: 'gentleman', text: '내 옷차림이 신기하오? 양복과 구두라오. 서양식 옷과 함께 외국 음식과 식료품도 들어왔소.', src: ['S51'] }, // 예전 「달라진 생활」 안내판 내용(D-30 C-03)
      ],
      bridge: { who: 'gentleman', text: '다른 이들 이야기는 들었구려. 내 이야기도 들어 보시오.' },
      later: [{ who: 'gentleman', text: '저 양화점에 가면 구두를 볼 수 있다오.' }],
    },
    woman: {
      first: [
        { who: 'woman', text: '1899년부터 서대문에서 청량리까지 전차가 다니기 시작했단다.', src: ['S51'] },
        { who: 'woman', text: '전차를 다니게 하려고 길을 넓히고 전봇대도 세웠지.', src: ['S51'] },
        { who: 'woman', text: '전차 가운데에는 요금이 비싼 특별석도 있단다.', src: ['S51'] }, // 예전 「전차」 안내판 내용(D-30 C-03)
      ],
      bridge: { who: 'woman', text: '어머, 다른 분들 이야기는 들었니? 나는 전차 이야기를 해 주마.' },
      later: [{ who: 'woman', text: '땡땡 종소리가 들리면 전차가 오는 거란다.' }],
    },
    student: {
      first: [
        { who: 'student', text: '여러 학교가 세워져서 저는 근대식 교육을 받아요.', src: ['S51'] },
        { who: 'student', text: '신문이 나와서 나라 안팎의 소식도 알 수 있어요.', src: ['S51'] },
        { who: 'student', text: '저 학교도, 뾰족탑 성당도 서양식으로 지은 건물이에요.' },
        { who: 'narr', text: '한성 거리에는 전깃불과 유리 창문이 있는 근대식 건물이 세워지고, 교회·성당·학교 등을 서양식으로 지었어요.', src: ['S51'] }, // 예전 「서양식 건물」 안내판 내용(D-30 C-03)
      ],
      bridge: { who: 'student', text: '다른 분들 이야기도 들으셨군요. 저는 학교 이야기를 해 드릴게요.' },
      later: [{ who: 'student', text: '학교에서 새로운 것을 많이 배워요.' }],
    },
    driver: {
      wait: [{ who: 'driver', text: '거리 사람들 이야기를 먼저 모두 듣고 오너라. 그다음에 이 거리의 밤 이야기를 해 주마.' }],
      first: [
        { who: 'driver', text: '거리 사람들 이야기를 다 들었구나. 이 거리는 해가 지면 또 달라진단다.' },
        { who: 'driver', text: '곧 해가 진다. 저 가로등을 잘 보거라.' },
        { who: 'me', text: '밤거리가 어떻게 바뀌는지 지켜보겠습니다!' },
      ],
      later: [{ who: 'driver', text: '전차는 오늘도 선로를 따라 달린단다.' }],
    },
  },
  // 탐험 끝 밤 장면: 해가 지고 가로등이 하나씩 켜진다. 예전 역사책 「전등과 가로등」 쪽 문장 그대로
  night: {
    lines: [
      { who: 'guide', text: '해가 뉘엿뉘엿 지고 거리가 어두워져.' },
      { who: 'narr', text: '전등과 가로등이 생겨서 밤에도 다닐 수 있게 되었어요.', src: ['S51'] },
      { who: 'woman', text: '밤에도 이렇게 환하니 마음 놓고 다닐 수 있구나.' },
      { who: 'driver', text: '한성에는 새로 들어온 문물이 이것 말고도 많단다.' },
      { who: 'me', text: '근대 문물이 하는 일을 하나씩 알아보겠습니다!' },
    ],
  },
  parts: {
    match: {
      type: 'deliver', src: ['S51'], title: '근대 문물을 하는 일에 맞게 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 이름을 들고 그 문물이 하는 일 팻말 앞 원 안에 들어가 잠깐 서 있어요. 그러면 처음 자리에서 다음 이름을 들어요.',
      intro: [{ who: 'gentleman', text: '요즘 한성에는 신기한 물건이 많소. 무엇이 어떤 일을 하는지 알맞게 가져가 보시오.' }],
      bins: [{ id: 'lamp', label: '밤거리를 밝혀요' }, { id: 'tram', label: '사람을 싣고 선로를 달려요' }, { id: 'tele', label: '글자를 전기 신호로 보내요' }, { id: 'phone', label: '먼 곳과 목소리로 이야기해요' }],
      cards: [
        { text: '전차', bin: 'tram' },
        { text: '전화', bin: 'phone', talk: [{ who: 'gentleman', text: '전화기로 소식을 빠르게 주고받을 수 있소.' }] },
        { text: '전등', bin: 'lamp', talk: [{ who: 'woman', text: '전등과 가로등 덕분에 밤에도 다닐 수 있게 되었어.' }] },
        { text: '전신', bin: 'tele', talk: [{ who: 'gentleman', text: '한성과 인천 사이에 전신을 놓은 뒤, 일본과 중국까지 통신망이 이어졌소.' }] },
      ],
      fail: '전신은 글자나 숫자를 전기 신호로 바꾸어 보내는 통신이에요.',
    },
    tram: {
      type: 'drive', src: ['S51'], title: '전차를 몰아 서대문에서 청량리까지 가요', vehicle: 'tram', counter: '지난 정류장', seconds: 110, speed: 1.3,
      howto: '선로를 따라 전차를 몰아요. 빛나는 정류장에서는 손님이 다 타고 내릴 때까지 멈춰요. 동대문은 문 사이로 지나가고, 길을 건너는 수레를 조심해요.',
      intro: [ // 운전수에게 말을 걸면(C-05)
        { who: 'driver', text: '나는 서대문에서 청량리까지 다니는 전차를 몬단다. 1899년부터 다니기 시작했지.', src: ['S51'] },
        { who: 'driver', text: '오늘은 네가 한번 몰아 보거라. 아주머니도 타실 거란다.' },
      ],
      route: [
        { label: '서대문', say: '1899년, 서대문에서 청량리까지 전차가 다니기 시작했어요.' },
        { label: '종로', hold: 3, holdLabel: '손님이 타고 내리는 중', alight: 2, board: 1, holdSay: '종로 정류장! 손님이 타고 내려요.', talk: [{ who: 'woman', text: '이 넓은 길 좀 봐. 전차가 다니게 하려고 길을 넓히고 전봇대를 세운 거야.', src: ['S51'] }] },
        { label: '동대문', hold: 3, holdLabel: '손님이 타고 내리는 중', alight: 1, board: 2, holdSay: '동대문 정류장! 손님이 타고 내려요.', talk: [{ who: 'woman', text: '가운데에는 요금이 비싼 특별석도 있단다.', src: ['S51'] }] },
        { label: '청량리', talk: [{ who: 'woman', text: '청량리에 닿았구나! 운전 솜씨가 좋구나.' }] },
      ],
      bump: '길을 건너던 수레와 부딪힐 뻔했어요! 앞 정류장에서 다시 가요.',
      fail: '시간 안에 청량리에 닿지 못했어요. 수레가 지나간 뒤에 가 봐요.',
    },
    // 문물 체험 걷기(D-34): 역사책 대신 빛나는 자리로 걸어가 대화 버튼을 눌러 근대 문물을 직접 써 본다(장면이라 첫 시도 점수에는 넣지 않는다)
    munmul: {
      type: 'scene', title: '근대 문물을 직접 써 봐요',
      howto: '빛나는 자리로 걸어가 대화 버튼을 눌러 근대 문물을 직접 써 봐요.',
      intro: [ // 학생에게 말을 걸면(C-05)
        { who: 'student', text: '전신, 전화, 학교… 새로 들어온 것들을 직접 써 보러 가요!' },
        { who: 'student', text: '빛나는 자리에 가서 대화 버튼을 눌러 보세요.' },
      ],
      stations: [
        { id: 'tele', label: '전신국', act: '전신 보내 보기', lines: [
          { who: 'clerk', text: '여기를 눌러 보거라. 네가 보낸 소식이 전깃줄을 타고 간단다.' },
          { who: 'narr', text: '전신은 글자나 숫자를 전기 신호로 바꾸어 보내는 통신이에요.', src: ['S51'] },
          { who: 'narr', text: '한성과 인천 사이에 전신을 놓은 뒤, 일본과 중국까지 이어지는 통신망이 생겼어요.', src: ['S51', 'S69'] },
        ] },
        { id: 'phone', label: '전화', act: '전화 걸어 보기', lines: [
          { who: 'me', text: '여보세요? 잘 들리세요?' },
          { who: 'gentleman', text: '(수화기 너머로) 잘 들리오. 멀리 있어도 목소리가 들리지요?' },
          { who: 'narr', text: '전화기를 들여와서 소식을 빠르게 주고받을 수 있게 되었어요.', src: ['S51'] },
        ] },
        { id: 'church', label: '성당', act: '전깃불 켜 보기', lines: [
          { who: 'me', text: '창마다 불이 환하게 켜졌어요!' },
          { who: 'narr', text: '전깃불과 유리 창문이 있는 근대식 건물이 세워지고, 교회·성당·학교 등을 서양식으로 지었어요.', src: ['S51'] },
        ] },
        { id: 'school', label: '학교', act: '학교 들어가 보기', lines: [
          { who: 'teacher', text: '어서 오너라. 자리에 앉아 함께 공부하자꾸나.' },
          { who: 'narr', text: '여러 학교가 세워져 근대식 교육을 받을 수 있었고, 신문이 나와 나라 안팎의 소식을 알 수 있었어요.', src: ['S51'] },
        ] },
        { id: 'shoes', label: '양화점', act: '양화점 들어가 보기', lines: [
          { who: 'shopkeeper', text: '구두 한 켤레 신어 보겠소? 서양식 신이라오.' },
          { who: 'narr', text: '양복, 구두 같은 서양식 옷이 들어오고 외국 음식과 식료품도 들어왔어요. 왕실과 관리를 중심으로 퍼져 나갔어요.', src: ['S51'] },
        ] },
      ],
    },
  },
  result: [{ who: 'narr', text: '근대 문물이 들어오면서 사람들의 생활 모습이 크게 달라졌어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1885, question: '전신은 무엇일까요?', options: ['글자나 숫자를 전기 신호로 바꾸어 보내는 통신', '밤을 밝히는 등', '선로 위를 달리는 차'], answer: 0, explain: '전신은 글자나 숫자를 전기 신호로 바꾸어 보내는 통신이에요.', src: ['S51'] },
    { kind: 'quiz', year: 1899, question: '1899년 서대문에서 청량리까지 다닌 것은?', options: ['기차', '전차', '자동차'], answer: 1, explain: '1899년 서대문에서 청량리까지 전차가 다니기 시작했어요.', src: ['S51'] },
  ],
};
