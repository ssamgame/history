// 일제 강점기편 3장 「대한민국 임시 정부」(D-41). 사실은 비상 5-2 교과서 125쪽(S51).
// 탐험: 「상하이」 거리 문으로 들어와 연락원·독립신문 기자·안창호 이야기를 아무 차례로 듣고(모두 들어야 김구),
// 청사 앞의 김구에게 가면 학생의 결심 → 청사 앞에 사람들이 모이고 태극기가 오르며 대한민국 임시 정부가 세워지는 장면.
// 놀이: 임시 정부의 헌법 읽기 → 연락원에게 말을 걸면 일본 경찰 피해 비밀 편지 전하기 →
// 김구에게 말을 걸면 임시 정부 청사 걷기(비밀 연락 → 독립신문 → 독립 공채 → 외교 → 독립군).
// 예전 가져다 놓기 여섯 글과 안내판(청사·독립 공채)의 출처 있는 문장은 장면·걷기 자리의 대사로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#22262e' },
    messenger: { name: '연락원', mark: '信', color: '#4a4f5a', look: 'student' },
    reporter: { name: '독립신문 기자', mark: '新', color: '#4a4f5a', look: 'scholarModern' },
    ahnchangho: { name: '안창호', mark: '安', color: '#3a3a44', look: 'ahnchangho' },
    kimgu: { name: '김구', mark: '金', color: '#3a3530', look: 'kimgu' },
    envoy: { name: '외교관', mark: '外', color: '#3a3a44', look: 'gentleman' },
    fighter: { name: '독립군', mark: '軍', color: '#4a5a3a', look: 'independenceArmy' },
    citizen: { name: '동포', mark: '民', color: '#4a4f5a', look: 'citizen' },
  },
  intro: [
    { who: 'narr', text: '3·1 운동을 전후하여 나라 안팎에 여러 임시 정부가 세워졌어요.', src: ['S51'] },
    { who: 'narr', text: '사람들은 독립운동의 힘을 하나로 모으려고 중국 상하이로 모여들었어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '여기는 중국 상하이야. 회색 벽돌집이 줄지어 선 낯선 거리인데, 귀를 기울이면 우리말이 들려.' },
    { who: 'guide', text: '나라 밖에서 무슨 일을 하고 있을까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['상하이 거리 사람들의 이야기를 모두 들어 보자', '청사 앞의 김구를 찾아가자', '대한민국 임시 정부가 세워지는 모습을 지켜보자', '임시 정부가 꿈꾼 나라를 알아보자', '일본 경찰의 눈을 피해 비밀 편지를 전하자', '임시 정부 청사를 돌며 하는 일을 겪어 보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 청사 앞의 김구를 찾아가자.' },
  minigameTitle: '대한민국 임시 정부',
  npc: {
    messenger: {
      first: [
        { who: 'messenger', text: '임시 정부는 비밀 조직을 두어 나라 안팎의 독립운동 단체와 연락해요.', src: ['S51'] },
        { who: 'messenger', text: '그래서 저는 편지를 옷 속에 숨기고 다녀요. 일본 경찰에게 들키면 안 되거든요.' },
      ],
      bridge: { who: 'messenger', text: '다른 분들도 만나셨군요. 저는 몰래 소식을 나르는 일을 해요.' },
      later: [{ who: 'messenger', text: '오늘도 몰래 전할 편지가 한가득이에요.' }],
    },
    reporter: {
      first: [
        { who: 'reporter', text: '임시 정부의 신문인 독립신문을 펴내 동포들에게 독립운동 소식을 전하고 있어요.', src: ['S51'] },
        { who: 'reporter', text: '오늘 찍은 신문도 나라 안 동포들에게 몰래 보낼 거예요.' },
      ],
      bridge: { who: 'reporter', text: '벌써 여러 분을 만났군요. 신문 이야기도 들어 보세요.' },
      later: [{ who: 'reporter', text: '먹물 냄새가 나지요? 방금 찍은 신문이에요.' }],
    },
    ahnchangho: {
      first: [
        { who: 'ahnchangho', text: '대한민국 임시 정부는 모든 국민이 평등하고 국민에게 주권이 있는 민주주의 정치 체계를 갖추었소.', src: ['S51'] },
        { who: 'ahnchangho', text: '나라를 되찾으면 왕이 아니라 국민이 주인인 나라를 만들 것이오.' },
      ],
      bridge: { who: 'ahnchangho', text: '여러 사람을 만나고 왔구려. 내 이야기도 들어 보시오.' },
      later: [{ who: 'ahnchangho', text: '청사 앞의 김구 선생도 만나 보시오.' }],
    },
    kimgu: {
      wait: [{ who: 'kimgu', text: '거리 사람들의 이야기를 먼저 모두 듣고 오시오. 그다음에 오늘 일을 말해 주겠소.' }],
      first: [
        { who: 'kimgu', text: '나라 안팎에 세워진 여러 임시 정부가 오늘 이곳 상하이에서 하나로 합쳐지오.', src: ['S51'] },
        { who: 'kimgu', text: '이제 곧 청사 앞에서 그 소식을 알릴 것이오. 함께 지켜보시오.' },
        { who: 'me', text: '저도 임시 정부의 일을 돕겠습니다!' },
      ],
      later: [{ who: 'kimgu', text: '나라를 되찾을 때까지 이 일을 멈추지 않을 것이오.' }],
    },
  },
  // 탐험 끝 장면: 청사 앞에 사람들이 모이고, 깃대에 태극기가 오르며 대한민국 임시 정부가 세워진다
  launch: {
    lines: [
      { who: 'guide', text: '청사 앞으로 사람들이 모였어. 김구가 앞으로 나서.' },
      { who: 'kimgu', text: '오늘 여러 임시 정부를 하나로 합쳐 대한민국 임시 정부를 세웁니다!', src: ['S51'] },
      { who: 'narr', text: '1919년 9월 중국 상하이에서 여러 임시 정부를 통합한 대한민국 임시 정부가 세워졌어요.', src: ['S51'] },
      { who: 'citizen', text: '대한민국 만세!' },
      { who: 'me', text: '대한민국 만세!' },
      { who: 'kimgu', text: '할 일이 많소. 먼저 우리가 세울 나라의 모습부터 읽어 보시오.' },
    ],
  },
  parts: {
    // 임시 정부의 헌법: 문서로 바로 본다(선생님 의견, 근대 3장 농민군의 요구와 같은 방식). 출범 장면 뒤 바로
    charter: {
      type: 'doc', src: ['S51'], title: '임시 정부가 꿈꾼 나라', heading: '대한민국 임시 정부의 헌법 (1919년)',
      docIntro: '임시 정부가 만든 헌법에 담긴 내용이에요. 하나씩 읽어 보아요.',
      intro: [
        { who: 'ahnchangho', text: '임시 정부의 헌법에는 \'대한민국은 민주 공화제로 한다\'라는 내용을 담았소.', src: ['S51'] },
        { who: 'ahnchangho', text: '헌법에 담은 내용을 하나씩 읽어 보시오.' },
      ],
      items: [
        { text: '대한민국은 민주 공화제로 한다', note: '왕이 아니라 국민이 뽑은 사람들이 나라를 다스린다는 뜻이에요.' },
        { text: '대한민국의 주권은 대한 인민 전체에 있다', note: '나라의 주인은 국민 모두라는 뜻이에요.' },
        { text: '대한민국의 인민은 일체 평등하다', note: '신분이나 남녀, 재산에 따라 차별하지 않는다는 뜻이에요.' },
      ],
    },
    letters: {
      type: 'sneak', title: '일본 경찰의 눈을 피해 비밀 편지를 전해요', counter: '지난 숨을 곳', seconds: 150,
      howto: '불빛(경찰이 보는 곳)에 들어가지 않게 파란 고리를 차례로 지나 연락원에게 편지를 전해요. 짐 더미 뒤에 숨으면 들키지 않아요.',
      intro: [ // 연락원에게 말을 걸면(C-05)
        { who: 'messenger', text: '이 편지를 골목 끝 연락원에게 전해 주세요. 나라 안 독립운동 단체로 갈 편지예요.' },
        { who: 'messenger', text: '상하이 골목에도 일본 경찰이 돌아다녀요. 불빛에 들어가면 안 돼요!' },
      ],
      waypoints: [
        { label: '골목 담 뒤' },
        { label: '쌀가게 뒤', talk: [{ who: 'messenger', text: '잘했어요. 저 앞 경찰은 왔다 갔다 해요. 불빛이 멀어지면 가요.' }] },
        { label: '창고 옆' },
        { label: '찻집 앞', talk: [{ who: 'messenger', text: '거의 다 왔어요. 마지막 골목만 지나면 돼요.' }] },
        { label: '연락원', talk: [{ who: 'messenger', text: '편지를 무사히 받았어요! 이 소식은 나라 안 동포들에게 전해질 거예요.' }] },
      ],
      caught: '들켰어요! 앞의 숨을 곳에서 다시 가요.',
      fail: '시간 안에 전하지 못했어요. 불빛이 지나간 뒤에, 짐 더미 뒤를 따라 움직여 봐요.',
    },
    // 임시 정부 청사 걷기(D-41): 가져다 놓기 대신 빛나는 자리로 걸어가 대화 버튼으로 겪는다(장면이라 첫 시도 점수에는 넣지 않는다)
    office: {
      type: 'scene', title: '임시 정부 청사에서 하는 일',
      howto: '빛나는 자리로 걸어가 대화 버튼을 눌러요. 임시 정부가 하는 일을 차례로 겪어 봐요.',
      intro: [ // 김구에게 말을 걸면(C-05)
        { who: 'kimgu', text: '편지를 잘 전했구려. 이제 청사 안을 돌며 우리가 하는 일을 함께 해 보시오.' },
        { who: 'kimgu', text: '빛나는 자리에 가서 대화 버튼을 누르시오.' },
      ],
      stations: [
        { id: 'contact', label: '비밀 연락', act: '편지 숨기기', lines: [
          { who: 'messenger', text: '이 편지는 옷 속에 숨겨서 나라 안으로 가져갈 거예요.' },
          { who: 'narr', text: '임시 정부는 비밀 조직을 두어 나라 안팎의 독립운동 단체와 연락했어요.', src: ['S51'] },
        ] },
        { id: 'news', label: '독립신문', act: '신문 찍기', lines: [
          { who: 'reporter', text: '손잡이를 누르면 신문이 찍혀 나와요.' },
          { who: 'narr', text: '임시 정부는 독립신문을 펴내 동포들에게 독립운동 소식을 전했어요.', src: ['S51'] },
        ] },
        { id: 'bond', label: '독립 공채', act: '공채 받기', lines: [
          { who: 'kimgu', text: '독립운동에는 돈이 필요하오. 동포들이 정성을 모아 주고 있소.' },
          { who: 'narr', text: '임시 정부는 독립 공채를 발행해 독립운동 자금을 모았어요.', src: ['S51'] },
          { who: 'narr', text: '독립 공채는 우리나라가 독립하면 돈을 갚겠다고 약속하는 증서예요.', src: ['S51'] },
        ] },
        { id: 'diplo', label: '외교', act: '외교관 배웅하기', lines: [
          { who: 'envoy', text: '다른 나라에 가서 우리의 독립을 도와 달라고 요청하겠소.' },
          { who: 'narr', text: '임시 정부는 다른 나라에 외교 기관을 두어 독립을 도와 달라고 요청했어요.', src: ['S51'] },
        ] },
        { id: 'army', label: '독립군', act: '독립군 배웅하기', lines: [
          { who: 'fighter', text: '우리는 만주로 가서 싸우겠습니다!' },
          { who: 'narr', text: '임시 정부는 독립군 단체를 아래에 두고 만주 지역에서 투쟁을 벌이기도 했어요.', src: ['S51'] },
        ] },
      ],
    },
  },
  result: [{ who: 'narr', text: '대한민국 임시 정부는 독립운동을 이끌며 우리 민족의 희망이 되었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1919, question: '1919년 대한민국 임시 정부가 세워진 도시는?', options: ['상하이', '충칭', '하얼빈'], answer: 0, explain: '1919년 9월 상하이에서 통합된 임시 정부가 세워졌어요.', src: ['S51'] },
    { kind: 'quiz', year: 1919, question: '임시 정부가 헌법에 쓴 대한민국의 정치 체제는?', options: ['왕이 다스리는 나라', '민주 공화제', '귀족 정치'], answer: 1, explain: '대한민국은 민주 공화제로 한다고 정했어요.', src: ['S51'] },
  ],
};
