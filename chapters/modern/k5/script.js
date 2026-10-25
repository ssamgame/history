// 근대편 5장 「근대 문물과 달라진 생활」. 사실은 비상 5-2 교과서 102~104쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    gentleman: { name: '양복 입은 신사', mark: '紳', color: '#3a3530', look: 'gentleman' },
    woman: { name: '전차 탄 아주머니', mark: '女', color: '#b8768a', look: 'woman' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
  },
  intro: [
    { who: 'narr', text: '개항을 한 뒤 정부는 개화 정책을 추진하여 여러 근대 시설을 마련했어요.', src: ['S51'] },
    { who: 'narr', text: '한성 거리의 모습과 사람들의 생활도 크게 달라졌어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1900년 무렵 한성 큰길이야. 땡땡! 종을 울리며 길 한가운데로 무언가 달려와. 길가에는 처음 보는 물건을 파는 가게도 있네.' },
    { who: 'guide', text: '거리가 왜 이렇게 바뀌었을까? 양복을 차려입은 신사에게 먼저 물어보자.' },
  ],
  goals: ['양복 입은 신사에게 말을 걸어 보자', '전차 탄 아주머니의 이야기를 들어 보자', '학교 앞 학생을 만나자', '근대 문물을 알아보자', '배운 내용을 확인해 보자'],
  minigameTitle: '근대 문물',
  npc: {
    gentleman: {
      first: [
        { who: 'gentleman', text: '한성과 인천 사이에 전신을 놓은 뒤, 일본과 중국까지 이어지는 통신망이 생겼소.', src: ['S51'] },
        { who: 'gentleman', text: '전화기도 들여와서 소식을 빠르게 주고받을 수 있지요.', src: ['S51'] },
      ],
      later: [{ who: 'gentleman', text: '내 옷차림이 신기하오? 양복과 구두라오. 저 아주머니는 전차를 타 보셨다던데.' }],
    },
    woman: {
      tooEarly: [{ who: 'woman', text: '어머, 전차 구경 왔니? 저기 양복 입은 신사분 이야기부터 들어 보렴.' }],
      first: [
        { who: 'woman', text: '1899년부터 서대문에서 청량리까지 전차가 다니기 시작했단다.', src: ['S51'] },
        { who: 'woman', text: '전차를 다니게 하려고 길을 넓히고 전봇대도 세웠지.', src: ['S51'] },
        { who: 'woman', text: '전등과 가로등이 생겨서 밤에도 다닐 수 있게 되었어.', src: ['S51'] },
      ],
      later: [{ who: 'woman', text: '전차 가운데에는 요금이 비싼 특별석도 있단다. 학교 앞 학생도 만나 보렴.', src: ['S51'] }],
    },
    student: {
      tooEarly: [{ who: 'student', text: '전차랑 가게 구경부터 실컷 하고 오세요. 그다음에 학교 이야기를 해 드릴게요.' }],
      first: [
        { who: 'student', text: '여러 학교가 세워져서 저는 근대식 교육을 받아요.', src: ['S51'] },
        { who: 'student', text: '신문이 나와서 나라 안팎의 소식도 알 수 있어요.', src: ['S51'] },
      ],
    },
    signTram: { always: [
      { who: 'narr', text: '전차는 1899년 서대문에서 청량리까지 처음 다녔어요. 가운데에는 요금이 비싼 특별석이 있었어요.', src: ['S51'] },
    ] },
    signChurch: { always: [
      { who: 'narr', text: '한성 거리에는 전깃불과 유리 창문이 있는 근대식 건물이 세워지고, 교회·성당·학교 등을 서양식으로 지었어요.', src: ['S51'] },
    ] },
    signLife: { always: [
      { who: 'narr', text: '양복, 구두 같은 서양식 옷이 들어오고 외국 음식과 식료품도 들어왔어요. 왕실과 관리를 중심으로 퍼져 나갔어요.', src: ['S51'] },
    ] },
  },
  parts: {
    match: {
      type: 'deliver', src: ['S51'], title: '근대 문물을 하는 일에 맞게 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 이름을 그 문물이 하는 일 팻말로 가져가 그 안에서 멈춰 잠깐 서 있어요. 놓으면 처음 자리로 돌아와 다음 것을 들어요.',
      intro: [{ who: 'gentleman', text: '요즘 한성에는 신기한 물건이 많소. 무엇이 어떤 일을 하는지 알맞게 가져가 보시오.' }],
      bins: [{ id: 'lamp', label: '밤거리를 밝혀요' }, { id: 'tram', label: '사람을 싣고 선로를 달려요' }, { id: 'tele', label: '글자를 전기 신호로 보내요' }, { id: 'phone', label: '먼 곳과 목소리로 이야기해요' }],
      cards: [
        { text: '전차', bin: 'tram' },
        { text: '전화', bin: 'phone', talk: [{ who: 'gentleman', text: '전화기로 소식을 빠르게 주고받을 수 있지요.' }] },
        { text: '전등', bin: 'lamp', talk: [{ who: 'woman', text: '전등과 가로등 덕분에 밤에도 다닐 수 있게 되었어.' }] },
        { text: '전신', bin: 'tele', talk: [{ who: 'gentleman', text: '한성과 인천 사이에 전신을 놓은 뒤, 일본과 중국까지 통신망이 이어졌소.' }] },
      ],
      fail: '전신은 글자나 숫자를 전기 신호로 바꾸어 보내는 통신이에요.',
    },
    tram: {
      type: 'drive', src: ['S51'], title: '전차를 몰아 서대문에서 청량리까지 가요', vehicle: 'tram', counter: '지난 정류장', seconds: 110, speed: 1.3,
      howto: '선로를 따라 전차를 몰아요. 정류장(빛나는 곳)에서는 손님이 다 타고 내릴 때까지 멈춰 기다리고(남은 초가 화면 위 가운데에 보여요), 동대문 문길로 지나가요. 길을 건너는 수레를 조심해요.',
      intro: [{ who: 'woman', text: '1899년부터 서대문에서 청량리까지 전차가 다니기 시작했단다. 운전 한번 해 보련?', src: ['S51'] }],
      route: [
        { label: '서대문', say: '1899년, 서대문에서 청량리까지 전차가 다니기 시작했어요.' },
        { label: '종로', hold: 3, holdLabel: '손님이 타고 내리는 중', alight: 2, board: 1, holdSay: '종로 정류장! 손님이 타고 내려요.', talk: [{ who: 'woman', text: '이 넓은 길 좀 봐. 전차가 다니게 하려고 길을 넓히고 전봇대를 세운 거야.' }] },
        { label: '동대문', hold: 3, holdLabel: '손님이 타고 내리는 중', alight: 1, board: 2, holdSay: '동대문 정류장! 손님이 타고 내려요.', talk: [{ who: 'woman', text: '가운데에는 요금이 비싼 특별석도 있단다.' }] },
        { label: '청량리', talk: [{ who: 'woman', text: '청량리에 닿았구나! 걸어서 반나절 걸리던 길을 금세 왔어.' }] },
      ],
      bump: '길을 건너던 수레와 부딪힐 뻔했어요! 앞 정류장에서 다시 가요.',
      fail: '시간 안에 청량리에 닿지 못했어요. 수레가 지나간 뒤에 가 봐요.',
    },
    // 근대 문물 확인하기: 거리에서 찾기 대신 역사책을 넘기며 무엇이 들어왔는지 본다(선생님 의견)
    goods: {
      type: 'book', title: '역사책으로 보는 근대 문물',
      intro: [{ who: 'student', text: '개항 뒤 새로 들어온 것들을 역사책으로 한 쪽씩 넘겨 봐요.' }],
      pages: [
        { title: '전신', pic: 'telegraph', lines: [{ who: 'narr', text: '전신은 글자나 숫자를 전기 신호로 바꾸어 보내는 통신이에요.', src: ['S51'] }, { who: 'narr', text: '한성과 인천 사이에 전신을 놓은 뒤, 일본과 중국까지 이어지는 통신망이 생겼어요.', src: ['S51'] }] },
        { title: '전화기', pic: 'telephone', lines: [{ who: 'narr', text: '전화기를 들여와서 소식을 빠르게 주고받을 수 있게 되었어요.', src: ['S51'] }] },
        { title: '전차', year: '1899년', pic: 'tram', lines: [{ who: 'narr', text: '1899년부터 서대문에서 청량리까지 전차가 다니기 시작했어요.', src: ['S51'] }, { who: 'narr', text: '전차를 다니게 하려고 길을 넓히고 전봇대도 세웠어요.', src: ['S51'] }] },
        { title: '전등과 가로등', pic: 'lamp', lines: [{ who: 'narr', text: '전등과 가로등이 생겨서 밤에도 다닐 수 있게 되었어요.', src: ['S51'] }] },
        { title: '서양식 건물', pic: 'church', lines: [{ who: 'narr', text: '전깃불과 유리 창문이 있는 근대식 건물이 세워지고, 교회·성당·학교 등을 서양식으로 지었어요.', src: ['S51'] }] },
        { title: '학교와 신문', pic: 'school', lines: [{ who: 'narr', text: '여러 학교가 세워져 근대식 교육을 받을 수 있었고, 신문이 나와 나라 안팎의 소식을 알 수 있었어요.', src: ['S51'] }] },
        { title: '옷과 음식', pic: 'clothes', lines: [{ who: 'narr', text: '양복, 구두 같은 서양식 옷이 들어오고 외국 음식과 식료품도 들어왔어요. 왕실과 관리를 중심으로 퍼져 나갔어요.', src: ['S51'] }] },
      ],
      done: [{ who: 'narr', text: '근대 문물이 들어오면서 사람들의 생활 모습이 크게 달라졌어요.', src: ['S51'] }],
    },
  },
  result: [{ who: 'narr', text: '근대 문물이 들어오면서 사람들의 생활 모습이 크게 달라졌어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1885, question: '전신은 무엇일까요?', options: ['글자나 숫자를 전기 신호로 바꾸어 보내는 통신', '밤을 밝히는 등', '선로 위를 달리는 차'], answer: 0, explain: '전신은 문자나 숫자를 전기 신호로 바꾸어 보내는 통신이에요.', src: ['S51'] },
    { kind: 'quiz', year: 1899, question: '1899년 서대문에서 청량리까지 다닌 것은?', options: ['기차', '전차', '자동차'], answer: 1, explain: '1899년 서대문에서 청량리까지 전차가 다니기 시작했어요.', src: ['S51'] },
  ],
};
