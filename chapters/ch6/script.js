// 6장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 6장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    baejungson: { name: '배중손', mark: '裵', color: '#2a3a5a', look: 'baejungson' },
    kimtongjeong: { name: '김통정', mark: '金', color: '#4a3a2a', look: 'kimtongjeong' },
    sambyeolcho: { name: '삼별초 병사', mark: '兵', color: '#3a2f2a', look: 'sambyeolcho' },
    minister: { name: '관리', mark: '官', color: '#5a4a6a', look: 'minister' },
    villager: { name: '백성', mark: '民', color: '#6b5a3a', look: 'villager' },
  },

  intro: [
    { who: 'narr', text: '1270년 고려 조정이 몽골과 싸움을 멈추고 강화도에서 개경으로 돌아가기로 했어요.', src: ['S21'] },
    { who: 'narr', text: '삼별초는 이에 반대하며 끝까지 싸우기로 했어요.', src: ['S21'] },
  ],

  start: [{ who: 'guide', text: '포구 사람들이 웅성거리고 있어. 무슨 일인지 이야기를 들어 보자.' }],

  goals: ['포구 사람들의 이야기를 들어 보자', '배중손에게 가 보자', '배중손을 따라 부두로 가자', '배를 몰아 진도로 가자', '용장성의 김통정에게 가 보자', '배를 몰아 제주로 가자', '항파두리의 김통정에게 가 보자'],

  // 포구 사람들: 어느 차례로 들어도 "개경으로 돌아간다는데…"가 이어져 배중손의 결심으로 모인다(D-19)
  npc: {
    minister: [{ who: 'minister', text: '조정은 몽골과 싸움을 멈추고 개경으로 돌아가기로 했소.', src: ['S21'] }],
    sambyeolcho: [{ who: 'sambyeolcho', expr: 'anger', text: '개경으로 돌아간다니! 우리 삼별초는 이에 반대하오. 끝까지 싸울 것이오.', src: ['S21'] }],
    villager: [{ who: 'villager', text: '개경으로 돌아간다는데, 배중손이 군사와 백성을 이끌고 남쪽으로 간다고 하오.', src: ['S21'] }],
    baejungson: {
      wait: [{ who: 'baejungson', text: '포구 사람들의 이야기를 모두 들어 보게.' }],
      decide: [{ who: 'baejungson', text: '배에 군사와 백성을 태워 남쪽 진도로 가자.', src: ['S21'] }],
      lead: [{ who: 'baejungson', text: '나를 따라 부두로 오게.' }],
      board: [{ who: 'baejungson', text: '배에 오르게. 남쪽 진도로 가자.', src: ['S21'] }],
    },
  },

  sail: {
    howto: { title: '바닷길 항해', steps: ['노를 저어 앞쪽의 빛나는 원까지 가요. 바위는 옆으로 돌아가요.', '앞과 옆에서 다가오는 몽골 배를 피해 닿으면 성공!'] },
    failHint: '몽골 배에 잡혔어요. 이번 바닷길을 처음부터 다시 가 봐요.',
  },

  jindo: {
    meet: [{ who: 'kimtongjeong', text: '여기가 용장성이다. 우리는 이 성을 근거지로 맞서 왔다.', src: ['S12'] }], // 다가가 말을 걸면, 그다음은 이야기 장면(D-58, chapters/ch6/story.js)
    arrive: [{ who: 'guide', text: '진도에 닿았어. 배에서 내려 용장성 앞의 김통정에게 가 보자.' }],
    talk: [
      { who: 'narr', text: '삼별초는 진도 용장성을 근거지로 9개월 동안 맞섰어요.', src: ['S12'] },
      { who: 'narr', text: '1271년 5월 용장성이 무너지자, 김통정이 남은 군사를 이끌고 제주로 건너갔어요.', src: ['S12'] },
      { who: 'kimtongjeong', expr: 'tension', text: '남은 군사는 나를 따라 제주로 가자!' },
    ],
  },

  jeju: {
    meet: [{ who: 'kimtongjeong', text: '제주까지 왔구나. 이곳 항파두리를 보아라.' }],
    arrive: [{ who: 'guide', text: '제주에 닿았어. 흙으로 쌓은 성을 따라 김통정에게 가 보자.' }],
    talk: [
      { who: 'kimtongjeong', expr: 'tension', text: '이 항파두리에 흙으로 성을 쌓고 끝까지 맞설 것이다.', src: ['S13'] },
      { who: 'narr', text: '삼별초는 1273년 고려와 몽골의 연합군에게 진압되었어요.', src: ['S12', 'S13'] },
    ],
  },

  quizzes: [
    { kind: 'quiz', year: 1270, question: '삼별초가 끝까지 싸운 까닭은?', options: ['고려 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 데 반대해서', '거란을 물리치려고', '대장경을 지키려고'], answer: 0, explain: '삼별초는 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 것에 반대했어요.', src: ['S21'] },
    { kind: 'quiz', year: 1270, question: '삼별초가 근거지를 옮긴 순서는?', options: ['강화도 → 진도 → 제주도', '제주도 → 진도 → 강화도', '진도 → 강화도 → 제주도'], answer: 0, explain: '강화도에서 진도로, 진도에서 제주로 옮겨 가며 싸웠어요.', src: ['S12', 'S21'] },
  ],
};
