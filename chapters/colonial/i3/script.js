// 일제 강점기편 3장 「대한민국 임시 정부」. 사실은 비상 5-2 교과서 125쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    messenger: { name: '연락원', mark: '信', color: '#4a4f5a', look: 'student' },
    ahnchangho: { name: '안창호', mark: '安', color: '#3a3a44', look: 'ahnchangho' },
    kimgu: { name: '김구', mark: '金', color: '#3a3530', look: 'kimgu' },
  },
  intro: [
    { who: 'narr', text: '3·1 운동을 전후하여 나라 안팎에 여러 임시 정부가 세워졌어요.', src: ['S51'] },
    { who: 'narr', text: '독립운동의 힘을 하나로 모으려고, 1919년 9월 중국 상하이에서 여러 임시 정부를 통합한 대한민국 임시 정부가 세워졌어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '여기는 중국 상하이야. 회색 벽돌집이 줄지어 선 낯선 거리인데, 귀를 기울이면 우리말이 들려.' },
    { who: 'guide', text: '나라 밖에서 무슨 일을 하고 있을까? 서류 뭉치를 든 연락원에게 먼저 말을 걸어 보자.' },
  ],
  goals: ['연락원에게 말을 걸어 보자', '안창호를 만나자', '청사 앞의 김구를 찾아가자', '임시 정부의 일을 도와 보자', '배운 내용을 확인해 보자'],
  minigameTitle: '대한민국 임시 정부',
  npc: {
    messenger: {
      first: [
        { who: 'messenger', text: '임시 정부는 비밀 조직을 두어 나라 안팎의 독립운동 단체와 연락해요.', src: ['S51'] },
        { who: 'messenger', text: '독립신문을 펴내 동포들에게 독립운동 소식을 전하고 있어요.', src: ['S51'] },
      ],
      later: [{ who: 'messenger', text: '오늘도 몰래 전할 소식이 한가득이에요. 안창호 선생님께 가 보세요. 저기 계세요.' }],
    },
    ahnchangho: {
      tooEarly: [{ who: 'ahnchangho', text: '우리가 나라 안과 어떻게 연락하는지, 연락원에게 먼저 들어 보시오.' }],
      first: [
        { who: 'ahnchangho', text: '대한민국 임시 정부는 모든 국민이 평등하고 국민에게 주권이 있는 민주주의 정치 체계를 갖추었소.', src: ['S51'] },
        { who: 'ahnchangho', text: '임시 정부의 헌법에는 \'대한민국은 민주 공화제로 한다\'라는 내용을 담았소.', src: ['S51'] },
      ],
      later: [{ who: 'ahnchangho', text: '나라를 되찾으면 왕이 아니라 국민이 주인인 나라를 만들 것이오. 청사 앞의 김구 선생도 만나 보시오.' }],
    },
    kimgu: {
      tooEarly: [{ who: 'kimgu', text: '임시 정부가 어떤 나라를 꿈꾸는지 안창호 선생께 먼저 듣고 오게.' }],
      first: [
        { who: 'kimgu', text: '임시 정부는 독립운동 자금을 모으고, 다른 나라에 외교 기관을 두어 독립을 도와 달라고 요청하오.', src: ['S51'] },
        { who: 'kimgu', text: '독립군 단체를 아래에 두고 만주 지역에서 투쟁을 벌이기도 하지.', src: ['S51'] },
      ],
    },
    signOffice: { always: [
      { who: 'narr', text: '대한민국 임시 정부는 1919년 9월 중국 상하이에서 세워졌어요.', src: ['S51'] },
    ] },
    signBond: { always: [
      { who: 'narr', text: '임시 정부는 독립 공채를 발행했어요. 우리나라가 독립하면 돈을 갚겠다고 약속하는 증서예요.', src: ['S51'] },
    ] },
  },
  parts: {
    // 임시 정부의 헌법: 팻말 찾기 대신 문서로 바로 본다(선생님 의견, 근대 3장 농민군의 요구와 같은 방식)
    charter: {
      type: 'doc', src: ['S51'], title: '임시 정부가 꿈꾼 나라', heading: '대한민국 임시 정부의 헌법 (1919년)',
      docIntro: '임시 정부가 만든 헌법에 담긴 내용이에요. 하나씩 읽어 보아요.',
      intro: [{ who: 'ahnchangho', text: '우리는 왕이 다스리는 나라가 아니라, 국민이 주인인 나라를 세우려 하오. 헌법에 담은 내용을 읽어 보시오.' }],
      items: [
        { text: '대한민국은 민주 공화제로 한다', note: '왕이 아니라 국민이 뽑은 사람들이 나라를 다스린다는 뜻이에요.' },
        { text: '대한민국의 주권은 대한 인민 전체에 있다', note: '나라의 주인은 국민 모두라는 뜻이에요.' },
        { text: '대한민국의 인민은 일체 평등하다', note: '신분이나 남녀, 재산에 따라 차별하지 않는다는 뜻이에요.' },
      ],
    },
    letters: {
      type: 'sneak', title: '일본 경찰의 눈을 피해 비밀 편지를 전해요', counter: '지난 숨을 곳', seconds: 150,
      howto: '불빛(경찰이 보는 곳)에 들어가지 않게 파란 고리를 차례로 지나 연락원에게 편지를 전해요. 짐 더미 뒤에 숨으면 들키지 않아요.',
      intro: [
        { who: 'messenger', text: '임시 정부는 비밀 조직으로 나라 안팎과 연락해요. 이 편지를 골목 끝 연락원에게 전해 주세요.' },
        { who: 'messenger', text: '상하이 골목에도 일본 경찰이 돌아다녀요. 불빛에 들어가면 안 돼요!' },
      ],
      waypoints: [
        { label: '골목 담 뒤' },
        { label: '쌀가게 뒤', talk: [{ who: 'messenger', text: '잘했어요. 저 앞 경찰은 왔다 갔다 해요. 불빛이 멀어지면 가요.' }] },
        { label: '창고 옆' },
        { label: '찻집 앞', talk: [{ who: 'messenger', text: '거의 다 왔어요. 마지막 골목만 지나면 돼요.' }] },
        { label: '연락원', talk: [{ who: 'messenger', text: '편지를 무사히 받았어요! 이 소식은 독립신문으로 동포들에게 전해질 거예요.' }] },
      ],
      caught: '들켰어요! 앞의 숨을 곳에서 다시 가요.',
      fail: '시간 안에 전하지 못했어요. 불빛이 지나간 뒤에, 짐 더미 뒤를 따라 움직여 봐요.',
    },
    roles: {
      type: 'deliver', src: ['S51'], title: '임시 정부의 활동을 알맞은 부서로 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 글을 알맞은 부서 책상으로 가져가 그 안에서 멈춰 잠깐 서 있어요. 놓으면 처음 자리로 돌아와 다음 것을 들어요.',
      intro: [{ who: 'kimgu', text: '임시 정부는 할 일이 많소. 각 부서에 일을 나누어 주시오.' }],
      bins: [{ id: 'home', label: '나라 안과 연락', look: 'citizen' }, { id: 'diplo', label: '외교와 자금', look: 'ahnchangho' }, { id: 'army', label: '무장 투쟁', look: 'independenceArmy' }],
      cards: [
        { text: '비밀 조직으로 독립운동 자금을 모았다', bin: 'home' },
        { text: '다른 나라에 외교 기관을 두었다', bin: 'diplo', talk: [{ who: 'kimgu', text: '세계에 우리의 독립을 도와 달라고 요청하오.' }] },
        { text: '독립군 단체를 아래에 두었다', bin: 'army' },
        { text: '독립신문으로 소식을 전했다', bin: 'home' },
        { text: '독립 공채를 발행했다', bin: 'diplo', talk: [{ who: 'messenger', text: '독립하면 돈을 갚겠다고 약속하는 증서예요.' }] },
        { text: '만주 지역에서 투쟁을 벌였다', bin: 'army' },
      ],
      fail: '나라 안 동포와 연락하는 일, 다른 나라와 돈에 관한 일, 군대와 싸움에 관한 일로 나눠요.',
    },
  },
  result: [{ who: 'narr', text: '대한민국 임시 정부는 독립운동을 이끌며 우리 민족의 희망이 되었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1919, question: '1919년 대한민국 임시 정부가 세워진 도시는?', options: ['상하이', '충칭', '하얼빈'], answer: 0, explain: '1919년 9월 상하이에서 통합된 임시 정부가 세워졌어요.', src: ['S51'] },
    { kind: 'quiz', year: 1919, question: '임시 정부가 헌법에 쓴 대한민국의 정치 체제는?', options: ['왕이 다스리는 나라', '민주 공화제', '귀족 정치'], answer: 1, explain: '대한민국은 민주 공화제로 한다고 정했어요.', src: ['S51'] },
  ],
};
