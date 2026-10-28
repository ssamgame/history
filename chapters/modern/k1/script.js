// 근대편 1장 「흥선 대원군과 강화도 조약」(D-28). 사실은 비상 5-2 교과서 98~99쪽(S51).
// 탐험: 마을 문으로 들어와 어르신·선비의 이야기를 아무 차례로 듣고, 관아 앞 관리에게 가면 학생의 결심.
// 놀이: 물건을 안고 흥선 대원군이 한 일의 자리로 → 해안 순찰 → 연무당에서 조약문 읽기 → 사람들의 말이 조약과 맞는지 고르기.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#7a4e32' },
    elder: { name: '마을 어르신', mark: '老', color: '#6b4a32', look: 'commoner' },
    scholar: { name: '젊은 선비', mark: '士', color: '#3a4a5a', look: 'scholar' },
    official: { name: '조선 관리', mark: '官', color: '#55608a', look: 'joseonOfficial' },
    daewongun: { name: '흥선 대원군', mark: '雲', color: '#4f5f86', look: 'daewongun' },
    fisher: { name: '어부', mark: '漁', color: '#5d6b3e', look: 'peasant' },
  },
  intro: [
    { who: 'narr', text: '19세기 후반, 어린 나이로 왕이 된 고종을 대신해 아버지 흥선 대원군이 나라를 다스렸어요.', src: ['S51'] },
    { who: 'narr', text: '흥선 대원군은 서양 나라들이 교류하자고 하는 것을 거절했어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '짠 바닷바람이 부는 강화도 바닷가 마을이야. 저 멀리 바다에 검은 연기를 뿜는 배가 떠 있지?' },
    { who: 'guide', text: '마을 사람들은 저 배를 어떻게 생각할까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  goals: ['마을 사람들의 이야기를 모두 들어 보자', '관아 앞의 조선 관리를 찾아가자', '흥선 대원군이 한 일을 되짚어 보자', '강화도 해안을 살펴보자', '연무당에서 강화도 조약문을 읽어 보자', '사람들의 말이 조약과 맞는지 가려내자'], // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 돌 축대 위 관아 앞의 조선 관리를 찾아가자.' },
  minigameTitle: '강화도 조약',
  npc: {
    elder: {
      first: [
        { who: 'elder', text: '흥선 대원군께서는 경복궁을 고쳐 지으셨지.', src: ['S51'] },
        { who: 'elder', text: '양반에게도 세금을 내게 하셨다네.', src: ['S51'] },
        { who: 'elder', text: '서양 나라들이 교류하자고 했지만 모두 거절하셨다네.', src: ['S51'] },
      ],
      bridge: { who: 'elder', text: '선비 양반한테 나랏일을 들었구먼. 나는 그 앞의 일을 들려주지.' },
      later: [{ who: 'elder', text: '저런 배가 자꾸 나타나니 고기잡이 나가기도 겁이 난다네.' }],
    },
    scholar: {
      first: [
        { who: 'scholar', text: '흥선 대원군이 물러난 뒤, 나라 안에서 문을 열고 다른 나라와 교류하자는 목소리가 커졌소.', src: ['S51'] },
        { who: 'scholar', text: '다른 나라와 교류할 수 있게 항구를 여는 것을 개항이라고 하오.', src: ['S51'] },
      ],
      bridge: { who: 'scholar', text: '어르신께 흥선 대원군 이야기를 들었구려. 그다음 이야기를 해 주겠소.' },
      later: [{ who: 'scholar', text: '돌 축대 위의 관아에 가 보시오. 나라의 앞날이 걸린 일로 관리들이 바쁘다오.' }],
    },
    official: {
      wait: [{ who: 'official', text: '지금은 바쁘다. 마을 사람들에게 요즘 무슨 일이 있었는지 모두 들어 보아라.' }],
      first: [
        { who: 'official', text: '저 바다를 보아라. 일본이 무력을 앞세워 개항을 요구하고 있다.', src: ['S51'] },
        { who: 'official', text: '마을 사람들 말을 들었다면 지금이 얼마나 큰일인지 알겠지?' },
        { who: 'me', text: '어르신께 들은 흥선 대원군 이야기부터 되짚어 보고, 해안을 살핀 뒤, 조약을 맺는 연무당까지 가 보겠습니다!' },
      ],
      later: [{ who: 'official', text: '해안에 낯선 배가 보이면 곧바로 알려라.' }],
    },
  },
  parts: {
    regent: {
      type: 'deliver', src: ['S51'], title: '흥선 대원군이 한 일을 되짚어 봐요', counter: '가져다 놓은 것',
      howto: '두 팔에 안은 것을 알맞은 곳의 빛나는 원 안으로 가져가 잠깐 서 있어요. 그러면 처음 자리에서 다음 것을 안아요.',
      intro: [{ who: 'official', text: '어르신께 들은 흥선 대원군이 한 일을 떠올리며, 이것들을 알맞은 곳에 가져다 놓아라.' }],
      bins: [
        { id: 'palace', label: '경복궁 공사장', look: 'worker' },
        { id: 'tax', label: '세금 거두는 관리', look: 'joseonOfficial' },
        { id: 'regent', label: '흥선 대원군', look: 'daewongun' },
      ],
      cards: [
        { text: '경복궁에 세울 나무 기둥', carry: 'log', bin: 'palace', talk: [{ who: 'narr', text: '흥선 대원군은 경복궁을 고쳐 지었어요.', src: ['S51'] }] },
        { text: '양반 댁에서 낸 세금', carry: 'sack', bin: 'tax', talk: [{ who: 'official', text: '이제는 양반 댁에서도 세금을 낸다.', src: ['S51'] }] },
        { text: '서양 배가 보낸 편지', carry: 'letter', bin: 'regent', talk: [
          { who: 'daewongun', text: '서양 나라와는 교류하지 않겠다. 돌려보내라.' },
          { who: 'narr', text: '흥선 대원군은 서양 나라들의 교류 요구를 거절했어요.', src: ['S51'] },
        ] },
      ],
      fail: '마을 어르신이 한 이야기를 떠올려 보세요. 궁궐을 고쳐 짓고, 양반에게도 세금을 내게 하고, 서양 나라의 교류 요구를 거절했어요.',
    },
    coast: {
      type: 'drive', src: ['S51'], title: '강화도 해안을 순찰해요', counter: '살핀 곳', seconds: 120,
      howto: '빛나는 곳을 차례로 지나며 바다를 살펴요. 망루에서는 바다를 살피는 동안 잠깐 기다려요.',
      intro: [{ who: 'elder', text: '바다 건너 낯선 배들이 자꾸 찾아온다네. 해안을 한번 둘러봐 주게. 망루에서는 먼바다를 잘 살피게.' }],
      route: [
        { label: '갯벌 길', say: '바닷바람이 거세요.' },
        { label: '망루', hold: 4, holdLabel: '바다를 살피는 중', holdSay: '망루에 올라 먼바다를 살펴요.',
          talk: [{ who: 'scholar', text: '저기, 일본 군함이오! 대포를 앞세우고 다가오고 있소.' }] },
        { label: '포대', talk: [{ who: 'official', text: '일본이 무력을 앞세워 항구를 열라고 요구하고 있다.', src: ['S51'] }] },
        { label: '연무당', talk: [{ who: 'official', text: '결국 1876년, 조선은 이곳 강화도에서 일본과 조약을 맺게 되었다.', src: ['S51'] }] },
      ],
      fail: '빛나는 곳을 따라 해안을 돌아봐요.',
    },
    paper: {
      type: 'doc', src: ['S51'], title: '연무당 탁자 앞에서 조약문을 읽어요', heading: '강화도 조약 (1876년) 가운데에서',
      docIntro: '조선과 일본이 맺은 조약이에요. 무엇이 쓰여 있는지 잘 읽어 두면, 다음에 사람들의 말이 맞는지 가려낼 수 있어요.',
      intro: [ // 관아 간판 「강화도 조약」의 내용(D-30 C-03: 간판 옆 관리의 말로 옮김)
        { who: 'official', text: '강화도 조약은 조선이 맺은 최초의 근대적 조약이다. 하지만 조선에 불리한 내용이 담겨 있다.', src: ['S51'] },
        { who: 'official', text: '연무당 탁자 위에 놓인 것이 그 조약문이다. 무엇이 쓰여 있는지 똑똑히 읽어 보아라.' },
      ],
      items: [
        { text: '일본인은 조선의 해안을 자유롭게 측량할 수 있다.', note: '일본만 할 수 있는 일이에요.' },
        { text: '조선에서 죄를 지은 일본인은 일본 관리가 재판한다.', note: '조선 관리는 일본인을 벌줄 수 없어요.' },
      ],
    },
    rumor: {
      type: 'judge', src: ['S51'], title: '사람들의 말이 조약과 맞는지 가려내요', counter: '들은 이야기',
      howto: '연무당 앞 사람들에게 다가가 대화 버튼을 눌러 이야기를 듣고, 방금 읽은 조약과 맞는지 골라요.',
      question: '이 말이 방금 읽은 강화도 조약의 내용과 맞나요?', options: ['맞아요', '아니에요'],
      intro: [{ who: 'scholar', text: '연무당 앞에서는 조약을 두고 이런저런 말이 돈다오. 방금 읽은 조약문을 떠올리며 누구 말이 맞는지 가려 보시오.' }],
      items: [
        { look: 'peasant', talk: [{ who: 'fisher', text: '이제 일본 배가 우리 바다를 마음대로 재고 다닌다던데?' }], correct: true,
          after: [{ who: 'scholar', text: '맞소. 일본인은 조선의 해안을 자유롭게 측량할 수 있게 되었소.', src: ['S51'] }] },
        { look: 'commoner', talk: [{ who: 'elder', text: '우리 땅에서 죄를 지은 일본 사람은 우리 고을 원님이 벌주겠지.' }], correct: false,
          why: '조약에는 죄를 지은 일본인을 일본 관리가 재판한다고 쓰여 있었어요.' },
        { look: 'scholar', talk: [{ who: 'scholar', text: '죄를 지은 일본인을 조선 관리가 재판할 수 없다니, 이건 조선에 불리하오.' }], correct: true,
          after: [{ who: 'official', text: '그렇다. 조선 땅에서 죄를 지어도 우리가 벌줄 수 없다.', src: ['S51'] }] },
        { look: 'joseonOfficial', talk: [{ who: 'official', text: '두 나라가 서로의 해안을 똑같이 잴 수 있다고 들었다.' }], correct: false,
          why: '조약에는 일본인만 조선의 해안을 측량할 수 있다고 쓰여 있었어요.' },
      ],
      fail: '방금 읽은 조약문을 떠올려 봐요. 해안을 잴 수 있는 쪽은 일본, 일본인을 재판하는 쪽도 일본이었어요.',
      done: [{ who: 'narr', text: '강화도 조약에는 일본인이 조선 해안을 측량하고, 죄를 지어도 일본 관리가 재판하는 불리한 내용이 있었어요.', src: ['S51'] }],
    },
  },
  result: [
    { who: 'narr', text: '조선은 이렇게 문을 열고 새로운 시대를 맞이했어요.', src: ['S51'] },
    { who: 'narr', text: '조선은 그 뒤 서양 여러 나라와도 조약을 맺고 교류했어요.', src: ['S51'] }, // 서쪽 초가 간판 「서양과의 조약」의 내용(D-30 C-03)
  ],
  quizzes: [
    { kind: 'quiz', year: 1863, question: '흥선 대원군은 서양 나라들의 교류 요구에 어떻게 했나요?', options: ['거절했다', '모두 받아들였다', '조약을 맺었다'], answer: 0, explain: '흥선 대원군은 서양 나라의 교류 요구를 거절했어요.', src: ['S51'] },
    { kind: 'quiz', year: 1876, question: '1876년 조선이 일본과 맺은 조약은?', options: ['을사늑약', '강화도 조약', '정전 협정'], answer: 1, explain: '강화도 조약은 조선이 맺은 최초의 근대적 조약이에요.', src: ['S51'] },
  ],
};
