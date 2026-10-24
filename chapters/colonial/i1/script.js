// 일제 강점기편 1장 「일제의 식민 통치」. 사실은 비상 5-2 교과서 117~119쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    farmer: { name: '농민', mark: '農', color: '#7a4e32', look: 'peasant' },
    teacher: { name: '학교 선생님', mark: '師', color: '#4a4f5a', look: 'scholarModern' },
    porter: { name: '항구의 짐꾼', mark: '人', color: '#6b4a32', look: 'commoner' },
  },
  intro: [
    { who: 'narr', text: '대한 제국은 1910년 일제에 국권을 강제로 빼앗겼어요.', src: ['S51'] },
    { who: 'narr', text: '일제는 우리 민족을 식민 통치하려고 조선 총독부라는 기구를 세웠어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '항구 마을이야. 부두에는 쌀가마가 산더미처럼 쌓였고, 기차와 배가 쉴 새 없이 드나들어.' },
    { who: 'guide', text: '저 쌀은 다 어디로 가는 걸까? 나라를 빼앗긴 뒤 사람들의 삶이 어떻게 달라졌는지 농민에게 먼저 물어보자.' },
  ],
  goals: ['농민에게 말을 걸어 보자', '학교 선생님을 만나자', '항구의 짐꾼에게 가 보자', '식민 통치를 정리해 보자', '배운 내용을 확인해 보자'],
  minigameTitle: '일제의 식민 통치',
  npc: {
    farmer: {
      first: [
        { who: 'farmer', text: '일제가 토지 조사 사업을 벌여서 많은 땅을 빼앗겼어요.', src: ['S51'] },
        { who: 'farmer', text: '살 길이 막막해진 사람들은 고향을 떠나 만주나 연해주로 옮겨 가기도 했지요.', src: ['S51'] },
      ],
      later: [{ who: 'farmer', text: '내 손으로 지은 쌀인데 우리 식구는 잡곡으로 버텨요. 마을 선생님께도 여쭤보세요.' }],
    },
    teacher: {
      tooEarly: [{ who: 'teacher', text: '먼저 농민들이 어떻게 살고 있는지 들어 보렴. 학교 이야기는 그다음에 해 주마.' }],
      first: [
        { who: 'teacher', text: '1910년대에는 헌병이 경찰 일을 맡아 한국인에게 태형을 내리기도 했단다.', src: ['S51'] },
        { who: 'teacher', text: '선생님들도 제복을 입고 칼을 차게 해서 무서운 분위기를 만들었지.', src: ['S51'] },
        { who: 'teacher', text: '1920년대에는 경찰을 늘리고, 일제에 협력하는 친일파를 키웠단다.', src: ['S51'] },
      ],
      later: [{ who: 'teacher', text: '교실에서는 마음껏 말할 수 없지만, 우리말과 우리 역사를 잊어서는 안 된다. 부두의 짐꾼도 만나 보렴.' }],
    },
    porter: {
      tooEarly: [{ who: 'porter', text: '난 쌀가마 나르느라 바쁘다네. 학교 선생님 이야기부터 듣고 오게.' }],
      first: [
        { who: 'porter', text: '일제가 쌀 생산을 늘리는 산미 증식 계획을 세웠지만, 늘어난 것보다 더 많은 쌀이 일본으로 빠져나가.', src: ['S51'] },
        { who: 'porter', text: '그래서 한국인의 생활은 더욱 어려워졌다네.', src: ['S51'] },
      ],
    },
    signGov: { always: [
      { who: 'narr', text: '식민 통치는 주권을 잃고 정치적·경제적으로 다른 나라에 속해 지배를 받는 것이에요.', src: ['S51'] },
    ] },
    signRail: { always: [
      { who: 'narr', text: '일제는 철도를 놓아 주요 도시와 항구를 이었어요. 한반도에서 나는 물자를 일본으로 가져가고 일본 상품을 팔기 쉬워졌어요.', src: ['S51'] },
    ] },
    signForce: { always: [
      { who: 'narr', text: '1930년대 후반 전쟁을 넓힌 일제는 한국인을 탄광, 공장, 전쟁터로 강제로 끌고 갔어요.', src: ['S51'] },
      { who: 'narr', text: '젊은 여성 가운데 일부는 일본군 \'위안부\'로 끌려가 큰 고통을 겪었어요.', src: ['S51'] },
    ] },
  },
  parts: {
    eras: {
      type: 'deliver', src: ['S51'], title: '언제 일어난 일일까요? 알맞은 시대의 문으로 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 글을 「1910년대」, 「1920년대」, 「1930년대 후반」 가운데 알맞은 문으로 가져가 그 안에서 멈춰 잠깐 서 있어요. 놓으면 처음 자리로 돌아와 다음 것을 들어요.',
      intro: [{ who: 'teacher', text: '일제의 통치는 시기마다 모습이 달랐단다. 일어난 일을 알맞은 시대의 문으로 가져가 보렴.' }],
      bins: [{ id: 'a', label: '1910년대', look: 'gendarme' }, { id: 'b', label: '1920년대', look: 'gentleman' }, { id: 'c', label: '1930년대 후반', look: 'student' }],
      cards: [
        { text: '헌병이 경찰 일을 맡고 태형을 내렸다', bin: 'a', talk: [{ who: 'farmer', text: '그때는 헌병이 무서워 말 한마디도 조심했지요.' }] },
        { text: '경찰을 늘리고 친일파를 키웠다', bin: 'b' },
        { text: '일본식으로 성과 이름을 바꾸게 했다', bin: 'c' },
        { text: '교사도 제복을 입고 칼을 찼다', bin: 'a', talk: [{ who: 'teacher', text: '나도 칼을 차고 수업을 해야 했단다.' }] },
        { text: '산미 증식 계획으로 쌀을 일본으로 가져갔다', bin: 'b', talk: [{ who: 'porter', text: '늘어난 쌀보다 더 많은 쌀이 배에 실려 갔소.' }] },
        { text: '우리말과 우리 역사 교육을 금지했다', bin: 'c' },
      ],
      fail: '헌병과 칼은 1910년대, 경찰을 늘리고 쌀을 가져간 것은 1920년대, 이름과 우리말을 빼앗은 것은 1930년대 후반이에요.',
    },
    book: {
      type: 'sneak', src: ['S51'], title: '헌병의 눈을 피해 우리 역사책을 전해요', counter: '지난 숨을 곳', seconds: 120,
      howto: '헌병의 불빛을 피해 파란 고리를 차례로 지나 선생님께 책을 전해요. 짐 더미(덤불) 뒤에 숨으면 들키지 않아요.',
      intro: [
        { who: 'teacher', text: '학교에서는 우리 역사를 가르칠 수 없게 되었단다.' },
        { who: 'teacher', text: '이 우리 역사책을 마을 끝 서당에 몰래 전해 주겠니? 헌병에게 들키면 안 된다.' },
      ],
      waypoints: [
        { label: '쌀가마 뒤' },
        { label: '담 모퉁이', talk: [{ who: 'farmer', text: '쉿, 헌병이 지나가요. 불빛이 지나간 뒤에 움직여요.' }] },
        { label: '우물가' },
        { label: '서당', talk: [{ who: 'teacher', text: '고맙다. 우리말과 우리 역사를 잊으면 안 된다. 아이들에게 꼭 가르치마.' }] },
      ],
      caught: '헌병에게 들켰어요! 앞의 숨을 곳에서 다시 가요.',
      fail: '시간 안에 전하지 못했어요. 불빛이 지나간 뒤에, 짐 더미 뒤를 따라 움직여 봐요.',
    },
    // 일제의 수탈: 차례대로 찾아가기·찾기 대신 역사책을 넘기며 본다(선생님 의견, 근대 4·5장과 같은 방식)
    rail: {
      type: 'book', title: '역사책으로 보는 일제의 수탈',
      intro: [{ who: 'porter', text: '오늘도 쌀가마를 가득 실은 기차가 항구로 가오. 그동안 무슨 일이 있었는지 역사책으로 넘겨 보시오.' }],
      pages: [
        { title: '토지 조사 사업', pic: 'tojisa', lines: [{ who: 'narr', text: '일제가 토지 조사 사업을 벌여서 많은 농민이 땅을 빼앗겼어요.', src: ['S51'] }] },
        { title: '철도', pic: 'railway', lines: [{ who: 'narr', text: '일제는 철도를 놓아 주요 도시와 항구를 이었어요. 한반도에서 나는 물자를 일본으로 가져가고 일본 상품을 팔기 쉬워졌어요.', src: ['S51'] }] },
        { title: '산미 증식 계획', pic: 'sanmi', lines: [{ who: 'narr', text: '일제가 쌀 생산을 늘리는 산미 증식 계획을 세웠지만, 늘어난 것보다 더 많은 쌀이 일본으로 빠져나갔어요.', src: ['S51'] }] },
        { title: '민족 말살 정책', pic: 'classroom', lines: [{ who: 'narr', text: '1930년대 후반, 일제는 우리 민족의 전통과 문화를 뿌리 뽑으려 했어요. 신사 참배를 강요하고 학교에서는 일본어로 수업했어요.', src: ['S51'] }] },
      ],
    },
  },
  result: [{ who: 'narr', text: '일제의 억압과 수탈 속에서도 우리 민족은 나라를 되찾으려는 노력을 멈추지 않았어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1910, question: '일제가 우리 민족을 다스리려고 세운 기구는?', options: ['조선 총독부', '대한민국 임시 정부', '독립 협회'], answer: 0, explain: '일제는 조선 총독부를 세워 식민 통치를 했어요.', src: ['S51'] },
    { kind: 'quiz', year: 1920, question: '1920년대 일제가 쌀을 더 많이 가져가려고 세운 계획은?', options: ['토지 조사 사업', '산미 증식 계획', '서울 진공 작전'], answer: 1, explain: '산미 증식 계획으로 늘어난 것보다 더 많은 쌀이 일본으로 빠져나갔어요.', src: ['S51'] },
  ],
};
