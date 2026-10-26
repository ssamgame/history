// 고려 새 4장 「윤관과 별무반」 대사와 퀴즈(docs/superpowers/specs/2026-10-26-ch7-spec.md 4-2·4-3절).
// 사실 줄은 S71(별무반)·S72(여진 정벌·9성)만 쓴다. 쓰지 않는 것(명세 3-3): 9성의 이름·자리, 동원한 군사 수, 돌려준 까닭, 장군 호칭.
// 꼭 듣는 대사 7줄: 출정 2 · 윤관 1 · 놀이 앞 2 · 진군 1 · 결과 1.
// 갈림길 판정 rule(사람)은 여기 한 곳에만 둔다(말이 있으면 신분과 관계없이 신기군, 승려는 항마군, 나머지는 신보군 — S71).
const rule = p => (p.horse ? 'cav' : p.monk ? 'monk' : 'inf');

// 갈림길에 오는 마을 사람. kind: leader 말 끄는 사람 · rider 말 탄 사람 · official 관리 · youth 젊은이 · monk 승려 · farmer 농부
const P = {
  leader: { kind: 'leader', name: '말을 끌고 온 사람', horse: true },
  rider: { kind: 'rider', name: '말을 타고 온 사람', horse: true },
  officialRider: { kind: 'rider', name: '말을 타고 온 관리', horse: true, official: true },
  official: { kind: 'official', name: '걸어서 온 관리', official: true },
  youth: { kind: 'youth', name: '걸어서 온 젊은이' },
  monk: { kind: 'monk', name: '절에서 온 승려', monk: true },
  farmer: { kind: 'farmer', name: '괭이를 든 농부' },
};
const w = (...keys) => keys.map((k, i) => ({ ...P[k], seed: i + 1 }));

export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    yungwan: { name: '윤관', mark: '尹', color: '#3a5a4e', look: 'yungwan' },
    villager: { name: '마을 어른', mark: '民', color: '#6b4a32', look: 'drafteeLeader' },
  },

  intro: [
    { who: 'narr', text: '여진이 힘을 키워 고려 동북쪽 국경을 위협했어요.', src: ['S72'] },
    { who: 'narr', text: '1104년, 고려군은 말을 탄 여진 군사를 당해 내지 못했어요.', src: ['S71'] },
  ],

  goals: ['윤관을 찾아가 말씀을 듣자', '갈림길: 마을 사람을 알맞은 부대 길로 보내자', '별무반이 동북쪽으로 나아간다', '배운 내용을 확인해 보자'],

  npc: {
    yungwan: {
      first: [{ who: 'yungwan', text: '말 탄 적을 이길 새 군대가 필요하다. 갈림길로 가서 사람들을 나누어라.', src: ['S71'] }],
      later: [{ who: 'yungwan', text: '갈림길에서 사람들이 기다린다. 서둘러라.' }],
    },
    villager: {
      always: [{ who: 'villager', text: '말이 있는 집도, 없는 집도 모두 갈림길로 모이고 있다네.' }],
    },
  },

  switch: {
    before: [
      { who: 'narr', text: '윤관의 건의로 별무반이라는 새 군대를 만들었어요.', src: ['S71'] },
      { who: 'narr', text: '말이 있으면 신기군, 말이 없으면 신보군, 승려는 항마군이 되었어요.', src: ['S71'] },
    ],
    howto: {
      title: '별무반 갈림길',
      steps: ['마을 사람이 갈림길 앞에 오면 알맞은 부대 길을 골라 보내요.', '말이 있으면 신기군, 말이 없으면 신보군, 승려는 항마군이에요.', '한 무리에서 두 번 틀리면 그 무리를 다시 해요.'],
      keyboard: '1 · 2 · 3 키 또는 길 단추 누르기',
      touch: '아래 길 단추를 누르거나, 사람 카드를 길 단추로 끌어 놓기',
    },
    rule,
    lanes: [
      { id: 'cav', label: '신기군', icon: 'horse', color: '#8a4a2e', dark: '#4e2818' },
      { id: 'inf', label: '신보군', icon: 'spear', color: '#2f6b5e', dark: '#1d3a33' },
      { id: 'monk', label: '항마군', icon: 'beads', color: '#6e6a62', dark: '#3e3b36' },
    ],
    hints: {
      cav: '말이 있나요? 말이 있으면 신기군이에요.',
      inf: '말이 없으면 걸어서 싸우는 신보군이에요.',
      monk: '머리를 깎은 승려는 항마군이에요.',
    },
    // 1무리: 겉모습으로 쉽게 나뉘는 넷 → 2무리: 말 탄 관리와 말 끄는 사람(신분이 아니라 말이 기준) → 3무리: 3초마다 한 사람씩 와서 줄을 선다
    waves: [
      { people: w('leader', 'youth', 'monk', 'farmer') },
      { people: w('farmer', 'officialRider', 'monk', 'leader', 'official', 'youth') },
      { people: w('rider', 'youth', 'monk', 'farmer', 'leader', 'official', 'monk', 'rider'), gap: 3 },
    ],
    waveLabels: ['첫째 무리', '둘째 무리', '셋째 무리'],
    failHint: '두 번 틀렸어요. 이 무리를 처음부터 다시 보내 봐요.',
    gauge: { title: '별무반 모으기', left: '마을', right: '별무반', leftIcon: 'soldier', rightIcon: 'horse' },
    done: '별무반이 모였다!',
  },

  march: [{ who: 'narr', text: '1107년, 윤관은 별무반을 이끌고 여진을 물리친 뒤 동북쪽에 성 아홉 개를 쌓았어요.', src: ['S72'] }],

  result: [{ who: 'narr', text: '그 뒤 1109년, 고려는 이 성들을 여진에게 돌려주었어요.', src: ['S72'] }],

  // 장 끝 도장과 지혜 카드(카드 문장은 놀이 앞 첫 문장 그대로)
  finale: { stamp: '별무반', sub: '별무반을 꾸렸다!' },
  guardian: { title: '나의 지킴이', text: '고려편 내내 함께할 지킴이를 골라요. 옷 색만 달라요.' },

  quizzes: [
    { kind: 'quiz', year: 1104, question: '윤관의 건의로 만든 새 군대는?', options: ['별무반', '삼별초', '강동 6주'], answer: 0, explain: '윤관의 건의로 말 탄 여진 군사에 맞설 새 군대 별무반을 만들었어요.', src: ['S71'] },
    { kind: 'quiz', year: 1107, question: '1107년 윤관이 쌓은 것은?', options: ['강동 6주', '동북 9성', '천리장성'], answer: 1, explain: '윤관은 별무반을 이끌고 여진을 물리친 뒤 동북쪽에 성 9개를 쌓았어요.', src: ['S72'] },
  ],
};
