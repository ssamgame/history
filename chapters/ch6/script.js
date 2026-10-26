// 6장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 6장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    baejungson: { name: '배중손', mark: '裵', color: '#2a3a5a', look: 'baejungson' },
    kimtongjeong: { name: '김통정', mark: '金', color: '#4a3a2a', look: 'kimtongjeong' },
    sambyeolcho: { name: '삼별초 병사', mark: '兵', color: '#3a2f2a', look: 'sambyeolcho' },
  },

  intro: [
    { who: 'narr', text: '1270년, 고려 조정은 몽골과 싸움을 멈추고 강화도에서 개경으로 돌아가기로 했어요.', src: ['S21'] },
    { who: 'narr', text: '삼별초는 이에 반대하며 끝까지 싸우기로 했어요.', src: ['S21'] },
  ],

  start: [{ who: 'guide', text: '강화도 포구야. 부두에 배들이 줄지어 있고, 사람들이 서둘러 짐을 싣고 있어. 앞쪽 부두의 배중손에게 가 보자.' }],

  goals: ['부두의 배중손에게 말을 걸어 보자', '배를 몰아 진도로 가자', '배를 몰아 제주로 가자', '고려를 지킨 사람들을 그 사건의 원에 넣어 보자', '배운 내용을 확인해 보자'],

  npc: {
    baejungson: [{ who: 'baejungson', text: '배에 군사와 백성을 태워 남쪽 진도로 가자.', src: ['S21'] }],
    sambyeolcho: [{ who: 'sambyeolcho', text: '배는 준비됐어! 먼저 배중손 님께 가 봐.' }],
  },

  sail: {
    howto: {
      title: '바닷길 항해',
      steps: ['배를 몰아 앞쪽의 빛나는 원(도착 지점)까지 가요. 남은 뱃길은 노 젓기 횟수로 보여요.', '바위에 막히면 옆으로 돌아가요.', '몽골군을 태우고 뒤쫓아 오는 배에 잡히면 그 바닷길을 처음부터 다시 가요.'],
      keyboard: 'W A S D 또는 방향키로 배 몰기',
      touch: '화면 왼쪽을 끌어 배 몰기',
    },
    failHint: '추격선에 잡혔어요. 이번 바닷길을 처음부터 다시 가 봐요.',
  },

  jindo: [
    { who: 'narr', text: '삼별초는 진도 용장성을 근거지로 9개월 동안 맞섰어요.', src: ['S12'] },
    { who: 'narr', text: '1271년 5월 용장성이 무너지자, 김통정이 남은 군사를 이끌고 제주로 건너갔어요.', src: ['S12'] },
    { who: 'kimtongjeong', text: '남은 군사는 나를 따라 제주로 가자!' },
  ],

  jeju: [
    { who: 'narr', text: '김통정은 항파두리에 흙으로 성을 쌓고 맞섰어요.', src: ['S13'] },
    { who: 'narr', text: '삼별초는 1273년 고려와 몽골의 연합군에게 진압되었어요.', src: ['S12', 'S13'] },
  ],

  // 마무리: 1~6장에서 만난 인물을 하나씩 골라, 그 사람이 활약한 사건의 원에 넣는다
  fit: {
    intro: [{ who: 'guide', text: '거란과 몽골의 침입에 맞선 고려 사람들을 돌아보자. 인물을 한 명씩 골라 그 사람이 활약한 사건의 원에 넣어 봐.' }],
    title: '고려를 지킨 사람들: 인물을 골라 그 사건의 원에 넣어요',
    figures: [
      { id: 'seohui', name: '서희', look: 'seohui' }, { id: 'yanggyu', name: '양규', look: 'yanggyu' }, { id: 'gangamchan', name: '강감찬', look: 'gangamchan' },
      { id: 'kimyunhu', name: '김윤후', look: 'kimyunhu' }, { id: 'baejungson', name: '배중손', look: 'baejungson' },
    ],
    circles: [
      { id: 'talks', label: '거란과의 외교 담판 (993)', answer: 'seohui' },
      { id: 'heunghwa', label: '흥화진 방어 (1010)', answer: 'yanggyu' },
      { id: 'guju', label: '귀주 대첩 (1019)', answer: 'gangamchan' },
      { id: 'cheoin', label: '처인성·충주성 싸움 (1232·1253)', answer: 'kimyunhu' },
      { id: 'sambyeolcho', label: '삼별초의 항쟁 (1270~1273)', answer: 'baejungson' },
    ],
    failHint: '그 사람이 한 일을 떠올려 봐요. 1장부터 6장까지 만난 사람들이에요.',
    done: [
      { who: 'guide', text: '서희는 말로, 양규와 강감찬은 싸움으로 거란을 막았어.' },
      { who: 'guide', text: '몽골에 맞서서는 김윤후와 백성들이 처인성과 충주성을, 삼별초는 진도와 제주도를 지켰지.' },
    ],
  },

  quizzes: [
    { kind: 'quiz', year: 1270, question: '삼별초가 끝까지 싸운 까닭은?', options: ['고려 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 데 반대해서', '거란을 물리치려고', '대장경을 지키려고'], answer: 0, explain: '삼별초는 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 것에 반대했어요.', src: ['S21'] },
    { kind: 'quiz', year: 1270, question: '삼별초가 근거지를 옮긴 순서는?', options: ['강화도 → 진도 → 제주도', '제주도 → 진도 → 강화도', '진도 → 강화도 → 제주도'], answer: 0, explain: '강화도에서 진도로, 진도에서 제주로 옮겨 가며 싸웠어요.', src: ['S12', 'S21'] },
  ],
};
