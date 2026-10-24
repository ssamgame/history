// 근대편 1장 「흥선 대원군과 강화도 조약」. 사실은 비상 5-2 교과서 98~99쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    elder: { name: '마을 어르신', mark: '老', color: '#6b4a32', look: 'commoner' },
    scholar: { name: '젊은 선비', mark: '士', color: '#3a4a5a', look: 'scholar' },
    official: { name: '조선 관리', mark: '官', color: '#55608a', look: 'joseonOfficial' },
  },
  intro: [
    { who: 'narr', text: '19세기 후반, 어린 나이로 왕이 된 고종을 대신해 아버지 흥선 대원군이 나라를 다스렸어요.', src: ['S51'] },
    { who: 'narr', text: '흥선 대원군은 서양 나라들이 교류하자고 하는 것을 거절했어요.', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '짠 바닷바람이 부는 강화도 바닷가 마을이야. 저 멀리 바다에 검은 연기를 뿜는 배가 떠 있지?' },
    { who: 'guide', text: '마을 사람들은 저 배를 어떻게 생각할까? 머리 위에 느낌표가 뜬 사람에게 다가가서 물어보자.' },
  ],
  goals: ['마을 어르신에게 말을 걸어 보자', '젊은 선비의 이야기를 들어 보자', '관아 앞의 조선 관리를 찾아가자', '강화도 조약을 살펴보자', '배운 내용을 확인해 보자'],
  minigameTitle: '강화도 조약',
  npc: {
    elder: {
      first: [
        { who: 'elder', text: '흥선 대원군께서는 경복궁을 고쳐 지으셨지.', src: ['S51'] },
        { who: 'elder', text: '양반에게도 세금을 내게 하셨다네.', src: ['S51'] },
        { who: 'elder', text: '서양 나라들이 교류하자고 했지만 모두 거절하셨어.', src: ['S51'] },
      ],
      later: [{ who: 'elder', text: '저런 배가 자꾸 나타나니 고기잡이 나가기도 겁이 난다네. 저 선비에게도 물어보게.' }],
    },
    scholar: {
      tooEarly: [{ who: 'scholar', text: '이 마을 일은 어르신이 제일 잘 아시오. 먼저 어르신께 여쭈어 보시오.' }],
      first: [
        { who: 'scholar', text: '흥선 대원군이 물러난 뒤, 나라 안에서 문을 열고 다른 나라와 교류하자는 목소리가 커졌소.', src: ['S51'] },
        { who: 'scholar', text: '다른 나라와 교류할 수 있게 항구를 여는 것을 개항이라고 하오.', src: ['S51'] },
      ],
      later: [{ who: 'scholar', text: '돌 축대 위의 관아에 가 보시오. 나라의 앞날이 걸린 일로 관리들이 바쁘다오.' }],
    },
    official: {
      tooEarly: [{ who: 'official', text: '지금은 바쁘다. 마을 사람들에게 요즘 무슨 일이 있었는지 먼저 들어 보아라.' }],
      first: [
        { who: 'official', text: '일본이 무력을 앞세워 개항을 요구하였다.', src: ['S51'] },
        { who: 'official', text: '결국 1876년, 조선은 일본과 강화도 조약을 맺었다.', src: ['S51'] },
        { who: 'official', text: '이 조약에 무엇이 쓰여 있는지 너도 똑똑히 살펴보아라.' },
      ],
    },
    signTreaty: { always: [
      { who: 'narr', text: '강화도 조약은 조선이 맺은 최초의 근대적 조약이에요.', src: ['S51'] },
      { who: 'narr', text: '하지만 조선에 불리한 내용이 담겨 있었어요.', src: ['S51'] },
    ] },
    signWest: { always: [
      { who: 'narr', text: '조선은 그 뒤 서양 여러 나라와도 조약을 맺고 교류했어요.', src: ['S51'] },
    ] },
  },
  parts: {
    regent: {
      type: 'deliver', src: ['S51'], title: '흥선 대원군이 한 일일까요? 알맞은 쪽으로 가져가요', counter: '가져다 놓은 것',
      howto: '머리 위의 글을 「흥선 대원군이 한 일」이나 「다른 때의 일」로 가져가 그 안에서 멈춰 잠깐 서 있어요. 놓으면 처음 자리로 돌아와 다음 것을 들어요.',
      intro: [{ who: 'elder', text: '흥선 대원군께서 하신 일을 기억하느냐? 알맞은 쪽으로 가져가 보거라.' }],
      bins: [{ id: 'yes', label: '흥선 대원군이 한 일', look: 'daewongun' }, { id: 'no', label: '다른 때의 일' }],
      cards: [
        { text: '경복궁을 고쳐 지었다', bin: 'yes', talk: [{ who: 'elder', text: '왕실의 위엄을 세우려고 경복궁을 다시 지으셨지.' }] },
        { text: '강화도 조약을 맺었다', bin: 'no' },
        { text: '양반에게도 세금을 내게 했다', bin: 'yes' },
        { text: '대한 제국을 세웠다', bin: 'no' },
        { text: '서양 나라의 교류 요구를 거절했다', bin: 'yes', talk: [{ who: 'scholar', text: '하지만 대원군이 물러난 뒤에는 문을 열자는 목소리가 커졌소.' }] },
      ],
      fail: '마을 어르신이 한 이야기를 떠올려 보세요. 궁궐, 세금, 서양 나라에 대한 이야기였어요.',
    },
    coast: {
      type: 'drive', src: ['S51'], title: '강화도 해안을 순찰해요', counter: '살핀 곳', seconds: 120,
      howto: '빛나는 곳을 차례로 지나며 바다를 살펴요. 망루에서는 바다를 살피는 동안 잠깐 기다려요.',
      intro: [{ who: 'elder', text: '바다 건너 낯선 배들이 자꾸 찾아온다네. 해안을 한번 둘러봐 주게.' }],
      route: [
        { label: '갯벌 길', say: '바닷바람이 거세요.' },
        { label: '망루', hold: 4, holdLabel: '바다를 살피는 중', holdSay: '망루에 올라 먼바다를 살펴요.',
          talk: [{ who: 'scholar', text: '저기, 일본 군함이오! 대포를 앞세우고 다가오고 있소.' }] },
        { label: '포대', talk: [{ who: 'official', text: '일본이 무력을 앞세워 항구를 열라고 요구하고 있다.' }] },
        { label: '연무당', talk: [{ who: 'official', text: '결국 1876년, 조선은 이곳 강화도에서 일본과 조약을 맺게 되었다.' }] },
      ],
      fail: '빛나는 곳을 따라 해안을 돌아봐요.',
    },
    treaty: {
      type: 'find', src: ['S51'], title: '조약을 맺는 곳에서 조선에 불리한 내용을 찾아요', counter: '찾은 내용',
      howto: '팻말 가운데 강화도 조약에서 조선에 불리한 내용을 찾아 대화 버튼을 눌러요. 틀린 것을 고르면 해설을 듣고 이어서 찾아요.',
      intro: [{ who: 'official', text: '조약에 어떤 내용이 들어 있는지 살펴보아라. 조선에 불리한 것을 찾아야 한다.' }],
      items: [
        { text: '죄를 지은 일본인은 일본 관리가 재판한다', correct: true, talk: [{ who: 'official', text: '우리 땅에서 죄를 지어도 우리가 벌줄 수 없다니!' }] },
        { text: '두 나라가 서로의 해안을 똑같이 측량한다', correct: false },
        { text: '일본인이 조선의 해안을 자유롭게 측량한다', correct: true, talk: [{ who: 'scholar', text: '우리 바다를 일본만 마음대로 잴 수 있게 되었소.' }] },
        { text: '죄를 지은 일본인은 조선 관리가 재판한다', correct: false },
      ],
      fail: '조선은 할 수 없고 일본만 할 수 있는 내용, 일본인을 조선이 벌줄 수 없는 내용을 찾아요.',
      done: [{ who: 'narr', text: '강화도 조약에는 일본인이 조선 해안을 측량하고, 죄를 지어도 일본 관리가 재판하는 불리한 내용이 있었어요.', src: ['S51'] }],
    },
  },
  result: [{ who: 'narr', text: '조선은 이렇게 문을 열고 새로운 시대를 맞이했어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1863, question: '흥선 대원군은 서양 나라들의 교류 요구에 어떻게 했나요?', options: ['거절했다', '모두 받아들였다', '조약을 맺었다'], answer: 0, explain: '흥선 대원군은 서양 나라의 교류 요구를 거절했어요.', src: ['S51'] },
    { kind: 'quiz', year: 1876, question: '1876년 조선이 일본과 맺은 조약은?', options: ['을사늑약', '강화도 조약', '정전 협정'], answer: 1, explain: '강화도 조약은 조선이 맺은 최초의 근대적 조약이에요.', src: ['S51'] },
  ],
};
