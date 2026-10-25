// 근대편 6장 「을사늑약과 나라를 지키려는 노력」. 사실은 비상 5-2 교과서 114~116쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    student: { name: '학생', mark: '學', color: '#22262e', look: 'student' },
    uibyeong: { name: '의병', mark: '義', color: '#6b4a32', look: 'uibyeong' },
    ahnchangho: { name: '안창호', mark: '安', color: '#3a3a44', look: 'ahnchangho' },
    yijun: { name: '이준', mark: '李', color: '#3a3530', look: 'scholarModern' },
    yisangseol: { name: '이상설', mark: '李', color: '#3a3530', look: 'gentleman' },
    yiwijong: { name: '이위종', mark: '李', color: '#3a3530', look: 'gentleman' },
  },
  intro: [
    { who: 'narr', text: '만주와 한반도를 둘러싸고 러시아와 벌인 전쟁에서 이긴 일제는 대한 제국을 노렸어요.', src: ['S51'] },
    { who: 'narr', text: '일제는 이토 히로부미를 보내 1905년 을사늑약을 맺고 대한 제국의 외교권을 빼앗았어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '을사늑약 소식에 온 나라가 술렁이고 있어. 왼쪽 솔숲에는 의병들이, 오른쪽에는 학교와 신문사가 보이지?' },
    { who: 'guide', text: '같은 나라를 지키려 해도 방법은 달랐대. 길가의 학생부터 무슨 일인지 물어보자.' },
  ],
  goals: ['학생에게 말을 걸어 보자', '의병을 만나자', '학교 앞의 안창호를 찾아가자', '나라를 지키려는 노력을 정리하자', '배운 내용을 확인해 보자'],
  minigameTitle: '나라를 지키려는 노력',
  npc: {
    student: {
      first: [
        { who: 'student', text: '고종 황제께서는 을사늑약이 부당하다는 것을 알리려고 헤이그 국제회의에 특사 세 명을 보내셨대요.', src: ['S51'] },
        { who: 'student', text: '하지만 일제의 방해로 회의장에 들어가지도 못했대요.', src: ['S51'] },
        { who: 'student', text: '일제는 이 일을 빌미로 고종 황제를 물러나게 하고 군대를 해산했어요.', src: ['S51'] },
      ],
      later: [{ who: 'student', text: '솔숲 쪽에 의병들이 모여 있어요. 무기를 들고 싸우겠다는 분들이에요. 가서 이야기를 들어 보세요.' }],
    },
    uibyeong: {
      tooEarly: [{ who: 'uibyeong', text: '한성 소식은 학생들이 빠르지. 저 학생에게 먼저 들어 보고 오게.' }],
      first: [
        { who: 'uibyeong', text: '유학자, 농민, 여성, 어린이까지 여러 사람이 의병으로 나섰네.', src: ['S51'] },
        { who: 'uibyeong', text: '해산된 군인들도 함께해 의병 운동이 더 조직적이 되었지.', src: ['S51'] },
        { who: 'uibyeong', text: '연합 부대를 만들어 한성의 일본군을 치는 서울 진공 작전도 펼쳤다네(1908년).', src: ['S51'] },
      ],
      later: [{ who: 'uibyeong', text: '산길이 험해도 마을 사람들이 숨겨 주고 밥을 나눠 주어 버틸 수 있었네. 저 위의 안창호 선생도 만나 보게.' }],
    },
    ahnchangho: {
      tooEarly: [{ who: 'ahnchangho', text: '무기를 든 의병들은 무엇을 지키려 하는지, 그 이야기부터 듣고 오게.' }],
      first: [
        { who: 'ahnchangho', text: '민족의 실력을 키워 나라를 지켜야 하오. 이것을 애국 계몽 운동이라 하오.', src: ['S51'] },
        { who: 'ahnchangho', text: '나와 이승훈 등은 학교를 세워 새로운 지식을 가르치고, 민족의 산업을 일으키려 하오.', src: ['S51'] },
      ],
    },
    signHague: { always: [
      { who: 'narr', text: '헤이그 특사 이준, 이상설, 이위종은 회의장 밖에서 연설을 하며 대한 제국의 상황을 알렸어요.', src: ['S51'] },
    ] },
    signPress: { always: [
      { who: 'narr', text: '황성신문, 대한매일신보 등은 일제의 침략 행위를 비판하는 기사를 실었어요.', src: ['S51'] },
    ] },
    signAhn: { always: [
      { who: 'narr', text: '안중근은 대한 제국을 침략하는 데 앞장선 이토 히로부미를 하얼빈에서 처단했어요.', src: ['S51'] },
    ] },
  },
  parts: {
    sort: {
      type: 'deliver', src: ['S51'], title: '의병 운동일까요, 애국 계몽 운동일까요? 알맞은 곳으로 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 글을 산속 「의병 진지」나 「애국 계몽 학교」로 가져가 그 안에서 멈춰 잠깐 서 있어요. 놓으면 처음 자리로 돌아와 다음 것을 들어요.',
      intro: [{ who: 'student', text: '나라를 지키는 방법은 여러 가지였어요. 무기를 들거나, 배우고 알려서 힘을 기르거나요.' }],
      bins: [{ id: 'army', label: '의병 운동' }, { id: 'edu', label: '애국 계몽 운동' }],
      cards: [
        { text: '학교를 세워 새로운 지식을 가르쳤다', bin: 'edu', talk: [{ who: 'ahnchangho', text: '민족의 실력을 키워 나라를 지켜야 하오.' }] },
        { text: '연합 부대를 만들어 서울 진공 작전을 펼쳤다', bin: 'army' },
        { text: '해산된 군인들이 참여해 일본군과 싸웠다', bin: 'army', talk: [{ who: 'uibyeong', text: '해산된 군인들이 함께해 의병이 더 조직적이 되었네.' }] },
        { text: '신문에 일제의 침략을 비판하는 글을 실었다', bin: 'edu' },
        { text: '민족의 산업을 일으켜 나라를 부강하게 하려 했다', bin: 'edu' },
        { text: '만주와 연해주로 옮겨 가 계속 싸웠다', bin: 'army' },
      ],
      fail: '무기를 들고 싸운 것은 의병 운동, 배우고 알려서 힘을 기른 것은 애국 계몽 운동이에요.',
    },
    hills: {
      type: 'ambush', src: ['S51'], title: '산속 의병: 고갯길로 들어오는 일본군을 막아요', label: '막아라!', counter: '막아 낸 부대',
      howto: '일본군이 고갯길의 빛나는 곳에 들어오면 그 위의 「막아라!」를 눌러요. 두 차례 이어져요.',
      intro: [
        { who: 'uibyeong', text: '유학자, 농민, 어린이까지 여러 사람이 의병으로 나섰네.' },
        { who: 'uibyeong', text: '고갯길 숲에 숨어 있다가, 일본군이 빛나는 곳에 들어오면 막는 걸세!' },
      ],
      waves: [
        { enemies: 4, need: 3, interval: 2, speed: 2.6 },
        { enemies: 5, need: 4, interval: 1.6, speed: 3, talk: [{ who: 'uibyeong', text: '더 많은 군대가 온다! 물러서지 말게!' }] },
      ],
      fail: '빛나는 고갯길에 들어왔을 때 눌러야 해요. 다시 해 봐요.',
      done: [{ who: 'uibyeong', text: '우리는 만주와 연해주로 가서도 계속 싸울 것이네.' }],
    },
    // 헤이그 특사: 다섯 사람 가운데 찾기 대신 이정표를 따라 걸으며 세 특사를 차례로 만난다(선생님 의견, 근대 2장과 같은 방식)
    envoys: {
      type: 'drive', src: ['S51'], title: '헤이그 만국 평화 회의장 앞: 특사 세 사람을 차례로 만나요', counter: '지난 이정표', showAll: true,
      howto: '길 위에 차례대로 선 이정표를 따라 걸어가요. 이정표에 닿으면 그곳 사람이 이야기를 들려줘요.',
      intro: [{ who: 'student', text: '헤이그로 간 특사 세 분을 이정표를 따라 차례로 만나 봐요. 어떤 마음으로 먼 길을 갔을까요?', src: ['S51'] }],
      route: [
        { label: '1 이준', look: 'scholarModern', post: true, talk: [{ who: 'yijun', text: '을사늑약은 황제께서 허락하신 것이 아니오. 이 사실을 세계에 알리러 왔소.' }] },
        { label: '2 이상설', look: 'gentleman', post: true, talk: [{ who: 'yisangseol', text: '황제 폐하의 뜻을 받들어 먼 길을 왔소.' }] },
        { label: '3 이위종', look: 'gentleman', post: true, talk: [{ who: 'yiwijong', text: '우리 사정을 여러 나라 사람들에게 알리겠습니다.' }] },
        { label: '4 회의장 문 앞', post: true, talk: [{ who: 'student', text: '일제의 방해로 회의장에 들어가지도 못했대요.' }, { who: 'student', text: '그래서 회의장 밖에서 연설을 하며 대한 제국의 상황을 알렸어요.', src: ['S51'] }] },
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
