// 근대편 6장 「을사늑약과 나라를 지키려는 노력」(D-35). 사실은 비상 5-2 교과서 114~116쪽(S51).
// 탐험: 한성 마을 문으로 들어와 학생·의병·신문 읽는 선비 이야기를 아무 차례로 듣고(모두 들어야 안창호),
// 안창호에게 가면 학생의 결심 → 을사늑약 소식에 사람들이 신문 앞에 모여 슬퍼하고 가게가 문을 닫는 장면.
// 놀이: 두 갈래 길(애국 계몽 길: 학교 수업·신문 찍기·민족 산업 / 의병 길: 해산 군인 맞이·연합 부대 출정) →
// 의병에게 말을 걸면 한성으로 가는 고갯길 매복 → 다시 의병에게 말을 걸면 만주·연해주로 가는 나룻배 → 학생에게 말을 걸면 헤이그 특사.
// 예전 가져다 놓기 여섯 글과 안내판(헤이그 특사·신문·안중근)의 출처 있는 문장은 체험 자리·사람 대사로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#22262e' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
    uibyeong: { name: '의병', mark: '義', color: '#6b4a32', look: 'uibyeong' },
    reader: { name: '신문 읽는 선비', mark: '士', color: '#3a3530', look: 'scholarModern' },
    ahnchangho: { name: '안창호', mark: '安', color: '#3a3a44', look: 'ahnchangho' },
    citizen: { name: '한성 사람', mark: '民', color: '#4a4f5a', look: 'citizen' },
    merchant: { name: '가게 주인', mark: '商', color: '#7a5a3c', look: 'commoner' },
    teacher: { name: '선생님', mark: '師', color: '#3a4a5a', look: 'scholarModern' },
    printer: { name: '신문사 일꾼', mark: '印', color: '#4a4f5a', look: 'worker' },
    soldier: { name: '해산된 군인', mark: '兵', color: '#2f3540' },
    villager: { name: '마을 할머니', mark: '民', color: '#7a6a5a', look: 'grandma' },
    yijun: { name: '이준', mark: '李', color: '#3a3530', look: 'scholarModern' },
    yisangseol: { name: '이상설', mark: '李', color: '#3a3530', look: 'gentleman' },
    yiwijong: { name: '이위종', mark: '李', color: '#3a3530', look: 'gentleman' },
  },
  intro: [
    { who: 'narr', text: '만주와 한반도를 둘러싸고 러시아와 벌인 전쟁에서 이긴 일제는 대한 제국을 노렸어요.', src: ['S51'] },
    { who: 'narr', text: '일제는 이토 히로부미를 보내 1905년 을사늑약을 맺고 대한 제국의 외교권을 빼앗았어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1905년 한성 거리야. 사람들 얼굴이 어둡고 거리가 술렁이고 있어.' },
    { who: 'guide', text: '무슨 일일까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['한성 사람들의 이야기를 모두 들어 보자', '학교 앞의 안창호를 찾아가자', '을사늑약 소식에 술렁이는 거리를 지켜보자', '두 갈래 길을 걸으며 나라를 지키려는 노력을 겪어 보자', '한성으로 가는 고갯길에서 일본군을 막아 내자', '의병과 함께 만주·연해주로 가는 나룻배까지 가 보자', '헤이그 특사 세 사람을 차례로 만나자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 학교 앞의 안창호를 찾아가자.' },
  minigameTitle: '나라를 지키려는 노력',
  npc: {
    student: {
      first: [
        { who: 'student', text: '일제가 이토 히로부미를 보내 을사늑약을 맺었대요.', src: ['S51'] },
        { who: 'student', text: '이제 대한 제국은 외교권을 빼앗겨서 다른 나라와 마음대로 외교를 할 수 없대요.', src: ['S51'] },
      ],
      bridge: { who: 'student', text: '다른 분들 이야기도 들으셨군요. 저도 들은 게 있어요.' },
      later: [{ who: 'student', text: '이제 우리나라는 어떻게 되는 걸까요?' }],
    },
    reader: {
      first: [
        { who: 'reader', text: '이 신문을 보시오. 황성신문, 대한매일신보 등은 일제의 침략 행위를 비판하는 기사를 실었소.', src: ['S51'] },
        { who: 'reader', text: '글을 읽은 사람마다 분해서 어쩔 줄 모르오.' },
      ],
      bridge: { who: 'reader', text: '다른 이들에게도 소식을 들었구려. 이 신문도 보시오.' },
      later: [{ who: 'reader', text: '신문은 붓으로 나라를 지키는 것이라오.' }],
    },
    uibyeong: {
      first: [
        { who: 'uibyeong', text: '나라를 이대로 빼앗길 수는 없네. 우리는 무기를 들고 싸울 것이네.' },
        { who: 'uibyeong', text: '유학자, 농민, 여성, 어린이까지 여러 사람이 의병으로 나섰네.', src: ['S51'] },
      ],
      bridge: { who: 'uibyeong', text: '자네도 소식을 들었구먼. 내 이야기도 들어 보게.' },
      later: [{ who: 'uibyeong', text: '산길이 험해도 우리는 물러서지 않을 것이네.' }],
    },
    ahnchangho: {
      wait: [{ who: 'ahnchangho', text: '거리 사람들의 이야기를 먼저 모두 듣고 오시오. 그다음에 내 생각을 말해 주겠소.' }],
      first: [
        { who: 'ahnchangho', text: '사람들 이야기를 다 들었구려. 나라를 지키려는 길은 여러 가지라오.' },
        { who: 'ahnchangho', text: '나는 민족의 실력을 키워 나라를 지켜야 한다고 생각하오. 이것을 애국 계몽 운동이라 하오.', src: ['S51'] },
        { who: 'me', text: '나라를 지키려는 사람들을 직접 만나 보겠습니다!' },
      ],
      later: [{ who: 'ahnchangho', text: '배우고 알려서 힘을 길러야 하오.' }],
    },
  },
  // 탐험 끝 을사늑약 소식 장면: 신문사 앞에 사람들이 모여들어 신문을 펼쳐 보고, 큰길 가게가 문을 닫는다
  news: {
    lines: [
      { who: 'guide', text: '신문사 앞으로 사람들이 모여들어. 다들 신문을 들여다보고 있어.' },
      { who: 'narr', text: '일제는 이토 히로부미를 보내 1905년 을사늑약을 맺고 대한 제국의 외교권을 빼앗았어요.', src: ['S51'] },
      { who: 'citizen', text: '이럴 수가… 나라의 외교권을 빼앗기다니!' },
      { who: 'merchant', text: '오늘은 도저히 장사를 할 마음이 나지 않소. 가게 문을 닫아야겠소.' },
      { who: 'ahnchangho', text: '슬퍼만 하고 있을 수는 없소. 나라를 지킬 길을 함께 찾아봅시다.' },
      { who: 'me', text: '네, 함께 가겠습니다!' },
    ],
  },
  parts: {
    // 두 갈래 길(D-35): 갈림길에서 애국 계몽 길 세 자리 → 의병 길 두 자리를 걸어가 대화 버튼으로 겪는다(장면이라 첫 시도 점수에는 넣지 않는다)
    roads: {
      type: 'scene', title: '두 갈래 길: 애국 계몽 길과 의병 길',
      howto: '빛나는 자리로 걸어가 대화 버튼을 눌러요. 오른쪽 애국 계몽 길을 다 걸으면 왼쪽 의병 길로 가요.',
      intro: [ // 탐험 끝 뒤 바로(안창호)
        { who: 'ahnchangho', text: '저 갈림길에서 길이 두 갈래로 나뉘오. 오른쪽은 학교와 신문사가 있는 길, 왼쪽은 의병 진지로 가는 길이오.' },
        { who: 'ahnchangho', text: '먼저 오른쪽 길부터 걸어 봅시다. 빛나는 자리에 가서 대화 버튼을 눌러 보시오.' },
      ],
      fork: { edu: '애국 계몽 길', army: '의병 길' },
      edu: {
        stations: [
          { id: 'school', label: '학교', act: '수업 들어 보기', lines: [
            { who: 'teacher', text: '어서 오너라. 오늘도 새로운 지식을 배워 보자꾸나.' },
            { who: 'narr', text: '안창호, 이승훈 등은 학교를 세워 새로운 지식을 가르쳤어요.', src: ['S51'] },
          ] },
          { id: 'press', label: '신문사', act: '신문 찍어 보기', lines: [
            { who: 'printer', text: '이 손잡이를 힘껏 내려 보거라. 오늘 낼 신문이란다.' },
            { who: 'narr', text: '황성신문, 대한매일신보 등은 일제의 침략 행위를 비판하는 기사를 실었어요.', src: ['S51'] },
          ] },
          { id: 'goods', label: '우리 물건 가게', act: '가게 들어가 보기', lines: [
            { who: 'merchant', text: '우리 손으로 만든 물건이오. 우리 물건을 써야 나라가 힘을 얻는다오.' },
            { who: 'narr', text: '애국 계몽 운동을 펼친 사람들은 민족의 산업을 일으켜 나라를 부강하게 하려 했어요.', src: ['S51'] },
          ] },
        ],
        sum: { who: 'narr', text: '배우고 알려서 민족의 실력을 키워 나라를 지키려 한 이 노력을 애국 계몽 운동이라고 해요.', src: ['S51'] },
        turn: { who: 'ahnchangho', text: '이번에는 왼쪽 길로 가 보시오. 무기를 든 의병들이 기다리고 있소.' },
      },
      army: {
        stations: [
          { id: 'soldiers', label: '의병 진지', act: '해산된 군인 맞이하기', lines: [
            { who: 'narr', text: '일제는 고종 황제를 물러나게 하고 대한 제국의 군대를 해산했어요.', src: ['S51'] },
            { who: 'soldier', text: '군대는 흩어졌지만 나라를 지키는 일은 멈출 수 없소! 의병과 함께 싸우겠소.' },
            { who: 'uibyeong', text: '해산된 군인들이 함께해 의병 운동이 더 조직적이 되었네.', src: ['S51'] },
          ] },
          { id: 'march', label: '연합 부대', act: '연합 부대와 함께 서기', lines: [
            { who: 'uibyeong', text: '여러 곳의 의병 부대가 힘을 모았네.' },
            { who: 'narr', text: '의병들은 연합 부대를 만들어 한성의 일본군을 치는 서울 진공 작전을 펼쳤어요(1908년).', src: ['S51'] },
            { who: 'uibyeong', text: '자, 한성으로 가세!' },
          ] },
        ],
      },
    },
    hills: {
      type: 'ambush', src: ['S51'], title: '한성으로 가는 고갯길: 언덕 풀숲에 숨어 일본군을 막아요', label: '발사!', counter: '막아 낸 부대',
      howto: '의병들이 언덕 풀숲에 엎드려 총을 겨누고 있어요. 일본군이 빛나는 곳에 들어오면 「발사!」를 눌러요. 두 차례 이어져요.',
      intro: [ // 의병에게 말을 걸면(C-05)
        { who: 'uibyeong', text: '한성으로 가는 고갯길이네. 일본군이 이 길로 몰려오고 있어.' },
        { who: 'uibyeong', text: '양쪽 언덕 풀숲에 엎드려 총을 겨누게. 일본군이 빛나는 곳에 들어오면 쏘는 걸세!' },
      ],
      waves: [
        { enemies: 4, need: 3, interval: 2, speed: 2.6 },
        { enemies: 5, need: 4, interval: 1.6, speed: 3, talk: [{ who: 'uibyeong', text: '더 많은 군대가 온다! 물러서지 말게!' }] },
      ],
      fail: '빛나는 고갯길에 들어왔을 때 눌러야 해요. 다시 해 봐요.',
      done: [{ who: 'uibyeong', text: '잘 막아 냈네! 하지만 일본군은 점점 더 많이 몰려오고 있네.' }],
    },
    // 만주·연해주로(D-35): 의병들과 함께 강가로 걸어가 마을 할머니와 인사하고 나룻배를 탄다(장면)
    exile: {
      type: 'scene', title: '의병과 함께 만주·연해주로',
      howto: '의병들과 함께 빛나는 자리로 걸어가 대화 버튼을 눌러요.',
      intro: [ // 의병에게 말을 걸면(C-05)
        { who: 'uibyeong', text: '일본군이 산마다 뒤쫓아 오고 있네. 우리는 강을 건너가서도 계속 싸울 것이네.' },
        { who: 'uibyeong', text: '나와 함께 강가 나룻배까지 가세.' },
      ],
      stations: [
        { id: 'farewell', label: '마을 사람들', act: '마을 사람들과 인사하기', lines: [
          { who: 'villager', text: '몸 성히 가시오. 주먹밥이라도 챙겨 가시구려.' },
          { who: 'uibyeong', text: '고맙소. 나라를 되찾는 날 꼭 다시 오겠소.' },
        ] },
        { id: 'boat', label: '나룻배', act: '나룻배 타기', lines: [
          { who: 'narr', text: '많은 의병이 만주와 연해주로 옮겨 가 계속 싸웠어요.', src: ['S51'] },
          { who: 'narr', text: '안중근은 대한 제국을 침략하는 데 앞장선 이토 히로부미를 하얼빈에서 처단했어요.', src: ['S51'] },
        ] },
      ],
      sum: { who: 'narr', text: '무기를 들고 일본군과 싸워 나라를 지키려 한 이 노력을 의병 운동이라고 해요.', src: ['S51'] },
    },
    // 헤이그 특사: 이정표를 따라 걸으며 세 특사를 차례로 만난다(선생님 의견, 근대 2장과 같은 방식)
    envoys: {
      type: 'drive', src: ['S51'], title: '헤이그 만국 평화 회의장 앞: 특사 세 사람을 차례로 만나요', counter: '지난 이정표', showAll: true,
      howto: '길 위에 차례대로 선 이정표를 따라 걸어가요. 이정표에 닿으면 그곳 사람이 이야기를 들려줘요.',
      intro: [ // 학생에게 말을 걸면(C-05)
        { who: 'student', text: '고종 황제께서는 을사늑약이 부당하다는 것을 알리려고 헤이그 국제회의에 특사 세 명을 보내셨대요.', src: ['S51'] },
        { who: 'student', text: '헤이그로 간 특사 세 분을 이정표를 따라 차례로 만나 봐요.' },
      ],
      route: [
        { label: '1 이준', look: 'scholarModern', post: true, talk: [{ who: 'yijun', text: '을사늑약은 황제께서 허락하신 것이 아니오. 이 사실을 세계에 알리러 왔소.' }] },
        { label: '2 이상설', look: 'gentleman', post: true, talk: [{ who: 'yisangseol', text: '황제 폐하의 뜻을 받들어 먼 길을 왔소.' }] },
        { label: '3 이위종', look: 'gentleman', post: true, talk: [{ who: 'yiwijong', text: '우리 사정을 여러 나라 사람들에게 알리겠습니다.' }] },
        { label: '4 회의장 문 앞', post: true, talk: [{ who: 'student', text: '일제의 방해로 끝내 회의장에 들어가지 못했대요.', src: ['S51'] }, { who: 'student', text: '그래서 회의장 밖에서 연설을 하며 대한 제국의 상황을 알렸어요.', src: ['S51'] }] },
      ],
      fail: '빛나는 이정표를 차례대로 따라 걸어가요.',
      done: [{ who: 'narr', text: '헤이그 특사 이준, 이상설, 이위종은 회의장 밖에서 연설을 하며 대한 제국의 상황을 알렸어요.', src: ['S51'] }],
    },
  },
  result: [
    { who: 'narr', text: '많은 사람이 나라를 지키려 애썼지만, 대한 제국은 1910년 일제에 국권을 강제로 빼앗겼어요.', src: ['S51'] },
  ],
  quizzes: [
    { kind: 'quiz', year: 1905, question: '1905년 일제가 대한 제국의 외교권을 빼앗은 조약은?', options: ['강화도 조약', '을사늑약', '정전 협정'], answer: 1, explain: '일제는 을사늑약으로 외교권을 빼앗았어요.', src: ['S51'] },
    { kind: 'quiz', year: 1905, question: '학교를 세워 새로운 지식을 가르친 운동은?', options: ['의병 운동', '애국 계몽 운동', '동학 농민 운동'], answer: 1, explain: '안창호, 이승훈 등은 학교를 세워 애국 계몽 운동을 펼쳤어요.', src: ['S51'] },
  ],
};
