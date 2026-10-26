// 현대편 1장 「8·15 광복」. 사실은 비상 5-2 교과서 134~135쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    citizen: { name: '서울 시민', mark: '民', color: '#5d7a9a', look: 'citizen' },
    grandma: { name: '할머니', mark: '老', color: '#6b4a32', look: 'grandma' },
    kimgu: { name: '김구', mark: '金', color: '#3a3530', look: 'kimgu' },
  },
  intro: [
    { who: 'narr', text: '일본은 제2차 세계 대전에서 미국, 영국 등의 연합국과 전쟁을 벌였어요. 독립운동가들은 일본이 질 것을 예상하고 새로운 나라를 세울 준비를 했어요.', src: ['S51'] },
    { who: 'narr', text: '1945년 8월 15일, 일본이 연합국에 항복하면서 우리나라는 마침내 광복을 맞이했어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1945년 8월 15일, 서울 큰길이야. 숨겨 두었던 태극기를 꺼내 든 사람들로 길이 가득 찼어!' },
    { who: 'guide', text: '오늘 무슨 일이 있었길래 이렇게 기뻐할까? 가까이 있는 시민에게 물어보자.' },
  ],
  goals: ['서울 시민에게 말을 걸어 보자', '할머니의 이야기를 들어 보자', '김구를 만나자', '광복의 기쁨을 나누자', '배운 내용을 확인해 보자'],
  minigameTitle: '8·15 광복',
  npc: {
    citizen: {
      first: [
        { who: 'citizen', text: '광복은 연합국의 승리로 얻은 것이기도 하지만, 우리 민족이 끊임없이 독립운동을 벌인 결과이기도 해요.', src: ['S51'] },
        { who: 'citizen', text: '이 기쁜 소식을 집집마다 전해 주세요!' },
      ],
      later: [{ who: 'citizen', text: '대한 독립 만세! 이 태극기를 장롱 깊숙이 숨겨 두었는데 오늘에야 꺼냈어요. 저 할머니께도 인사드려 보세요.' }],
    },
    grandma: {
      tooEarly: [{ who: 'grandma', text: '오늘이 무슨 날인지 저기 시민분께 먼저 들어 보렴.' }],
      first: [
        { who: 'grandma', text: '이제 일제가 강제로 바꾸게 한 일본식 이름 대신 우리 성과 이름을 되찾을 수 있단다.', src: ['S51'] },
        { who: 'grandma', text: '우리말과 우리글을 마음껏 쓰고, 학교에서는 한글 교과서로 우리 역사를 배울 거야.', src: ['S51'] },
      ],
      later: [{ who: 'grandma', text: '이제 우리말 신문도 마음껏 읽을 수 있겠구나. 다른 나라에 있던 독립운동가들도 곧 돌아오실 거란다.' }],
    },
    kimgu: {
      tooEarly: [{ who: 'kimgu', text: '오늘 시민들이 무엇을 느끼는지 먼저 들어 보시오.' }],
      first: [
        { who: 'guide', text: '몇 달 뒤의 이야기야. 김구 선생은 1945년 11월에 중국에서 고국으로 돌아왔어.', src: ['S51', 'S67'] },
        { who: 'kimgu', text: '광복 소식에 다른 나라에 머물던 동포들이 고국으로 돌아오고 있소.', src: ['S51'] },
        { who: 'kimgu', text: '미국에서 독립운동을 한 이승만은 10월에, 중국에서 임시 정부를 이끈 나 김구는 11월에 돌아왔소.', src: ['S51', 'S67'] },
      ],
    },
    signChildren: { always: [
      { who: 'narr', text: '광복 뒤 어린이날 기념식에서 어린이들은 다시는 나라를 빼앗기지 않겠다고 약속했어요(1946년).', src: ['S51'] },
    ] },
    signPaper: { always: [
      { who: 'narr', text: '광복 뒤 강제로 문을 닫았던 신문들이 다시 발간되면서 사람들은 다양한 소식을 접할 수 있게 되었어요.', src: ['S51'] },
    ] },
  },
  parts: {
    news: {
      type: 'drive', title: '광복 소식을 전하며 마을 길을 걸어요', counter: '소식을 전한 곳', pickupCounter: '모은 태극기', seconds: 150,
      howto: '빛나는 집 앞을 차례로 지나며 소식을 전해요. 길에 흩어진 태극기를 모두 모아야 마을 광장으로 나갈 수 있어요.',
      intro: [
        { who: 'citizen', text: '일본이 항복했대요! 우리나라가 드디어 광복을 맞았어요!' },
        { who: 'citizen', text: '숨겨 두었던 태극기를 꺼내서, 이 기쁜 소식을 온 마을에 알려 주세요!' },
      ],
      route: [
        { label: '첫째 집', talk: [{ who: 'grandma', text: '정말이냐? 우리나라를 되찾았단 말이냐! 이 늙은이가 살아서 이날을 보는구나.' }] },
        { label: '우물가', talk: [{ who: 'citizen', text: '이제 일본식 이름 대신 우리 이름을 되찾을 수 있어요!' }] },
        { label: '서당', talk: [{ who: 'grandma', text: '아이들이 우리말과 우리글을 마음껏 배우겠구나.' }] },
        { label: '장터', talk: [{ who: 'citizen', text: '장터 사람들도 모두 뛰어나와 만세를 부르고 있어요!' }] },
        { label: '마을 광장', needPickups: true, needSay: '아직 모으지 못한 태극기가 있어요. 화살표를 따라가 봐요.',
          talk: [{ who: 'citizen', text: '이 기쁨은 우리 민족이 끊임없이 독립운동을 벌인 결과이기도 해요.', src: ['S51'] }, { who: 'citizen', text: '만세! 온 동네가 거리로 나와 함께 기뻐하고 있어요!' }] },
      ],
      pickups: [{ label: '태극기' }, { label: '태극기' }, { label: '태극기' }, { label: '태극기' }],
      fail: '빛나는 곳을 따라 가요. 화살표가 길을 알려 줘요.',
    },
    change: {
      type: 'deliver', src: ['S51'], title: '광복 뒤의 모습일까요, 일제 강점기의 모습일까요?', counter: '가져다 놓은 것',
      howto: '머리 위의 글을 들고 「광복 뒤」 학교나 「일제 강점기」 건물 가운데 알맞은 원 안에 들어가 잠깐 서 있어요. 그러면 처음 자리에서 다음 글을 들어요.',
      intro: [{ who: 'grandma', text: '광복 전과 뒤에 무엇이 달라졌는지, 알맞은 곳으로 가져가 보렴.' }],
      bins: [{ id: 'after', label: '광복 뒤', look: 'student' }, { id: 'before', label: '일제 강점기', look: 'gendarme' }],
      cards: [
        { text: '우리말과 우리글을 자유롭게 써요', bin: 'after' },
        { text: '일본식 성과 이름을 써야 해요', bin: 'before', talk: [{ who: 'grandma', text: '그때는 우리 성과 이름까지 빼앗겼지.' }] },
        { text: '학교에서 한글 교과서로 우리 역사를 배워요', bin: 'after' },
        { text: '우리 역사 교육이 금지돼요', bin: 'before' },
        { text: '문을 닫았던 신문이 다시 나와요', bin: 'after', talk: [{ who: 'citizen', text: '신문이 다시 나오니 세상 소식을 알 수 있어요!' }] },
        { text: '신사 참배를 강요해요', bin: 'before' },
      ],
      fail: '우리 것을 되찾은 모습은 광복 뒤, 빼앗긴 모습은 일제 강점기예요.',
    },
  },
  result: [{ who: 'narr', text: '광복 뒤 사람들의 일상생활에도 큰 변화가 나타났어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1945, question: '우리나라가 광복을 맞이한 날은?', options: ['1919년 3월 1일', '1945년 8월 15일', '1950년 6월 25일'], answer: 1, explain: '1945년 8월 15일 일본이 연합국에 항복하면서 광복을 맞이했어요.', src: ['S51'] },
    { kind: 'quiz', year: 1945, question: '광복은 무엇의 결과일까요?', options: ['연합국의 승리와 우리 민족의 끊임없는 독립운동', '강화도 조약', '신탁 통치'], answer: 0, explain: '광복은 연합국의 승리로 얻은 것이자 우리 민족이 끊임없이 독립운동을 벌인 결과예요.', src: ['S51'] },
  ],
};
