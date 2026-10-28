// 6장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 6장 절을 따른다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    baejungson: { name: '배중손', mark: '裵', color: '#2a3a5a', look: 'baejungson' },
    kimtongjeong: { name: '김통정', mark: '金', color: '#4a3a2a', look: 'kimtongjeong' },
    sambyeolcho: { name: '삼별초 병사', mark: '兵', color: '#3a2f2a', look: 'sambyeolcho' },
    minister: { name: '관리', mark: '官', color: '#5a4a6a', look: 'minister' },
    villager: { name: '백성', mark: '民', color: '#6b5a3a', look: 'villager' },
    seohui: { name: '서희', mark: '徐', color: '#3a4a5a', look: 'seohui' },
    yanggyu: { name: '양규', mark: '楊', color: '#4a3a3a', look: 'yanggyu' },
    gangamchan: { name: '강감찬', mark: '姜', color: '#3a4a3a', look: 'gangamchan' },
    kimyunhu: { name: '김윤후', mark: '允', color: '#5a5048', look: 'kimyunhu' },
  },

  intro: [
    { who: 'narr', text: '1270년 고려 조정이 몽골과 싸움을 멈추고 강화도에서 개경으로 돌아가기로 하자, 삼별초는 이에 반대하며 끝까지 싸우기로 했어요.', src: ['S21'] },
  ],

  start: [{ who: 'guide', text: '포구 사람들이 웅성거리고 있어. 무슨 일인지 이야기를 들어 보자.' }],

  goals: ['포구 사람들의 이야기를 들어 보자', '배중손을 따라 부두로 가자', '배를 몰아 진도로 가자', '용장성의 김통정에게 가 보자', '배를 몰아 제주로 가자', '항파두리의 김통정에게 가 보자', '고려를 지킨 사람들을 만나 보자', '배운 내용을 확인해 보자'],

  // 포구 사람들: 어느 차례로 들어도 "개경으로 돌아간다는데…"가 이어져 배중손의 결심으로 모인다(D-19)
  npc: {
    minister: [{ who: 'minister', text: '조정은 몽골과 싸움을 멈추고 개경으로 돌아가기로 했소.', src: ['S21'] }],
    sambyeolcho: [{ who: 'sambyeolcho', text: '개경으로 돌아간다니! 우리 삼별초는 이에 반대하오. 끝까지 싸울 것이오.', src: ['S21'] }],
    villager: [{ who: 'villager', text: '개경으로 돌아간다는데, 배중손이 군사와 백성을 이끌고 남쪽으로 간다고 하오.', src: ['S21'] }],
    baejungson: {
      wait: [{ who: 'baejungson', text: '포구 사람들의 이야기를 먼저 들어 보게.' }],
      decide: [{ who: 'baejungson', text: '배에 군사와 백성을 태워 남쪽 진도로 가자.', src: ['S21'] }],
      lead: [{ who: 'baejungson', text: '나를 따라 부두로 오게.' }],
    },
  },

  sail: {
    howto: { title: '바닷길 항해', steps: ['배를 몰아 앞쪽의 빛나는 원까지 가요. 바위는 옆으로 돌아가요.', '뒤쫓는 몽골 배에 잡히지 않고 닿으면 성공!'] },
    failHint: '추격선에 잡혔어요. 이번 바닷길을 처음부터 다시 가 봐요.',
  },

  jindo: {
    arrive: [{ who: 'guide', text: '진도에 닿았어. 배에서 내려 용장성 앞의 김통정에게 가 보자.' }],
    talk: [
      { who: 'narr', text: '삼별초는 진도 용장성을 근거지로 9개월 동안 맞섰어요.', src: ['S12'] },
      { who: 'narr', text: '1271년 5월 용장성이 무너지자, 김통정이 남은 군사를 이끌고 제주로 건너갔어요.', src: ['S12'] },
      { who: 'kimtongjeong', text: '남은 군사는 나를 따라 제주로 가자!' },
    ],
  },

  jeju: {
    arrive: [{ who: 'guide', text: '제주에 닿았어. 흙으로 쌓은 성을 따라 김통정에게 가 보자.' }],
    talk: [
      { who: 'kimtongjeong', text: '이 항파두리에 흙으로 성을 쌓고 끝까지 맞설 것이다.', src: ['S13'] },
      { who: 'narr', text: '삼별초는 1273년 고려와 몽골의 연합군에게 진압되었어요.', src: ['S12', 'S13'] },
    ],
  },

  // 마무리(D-19): 바닷가에 선 1~6장 인물을 걸어가 만나면 한 줄을 말하고 자기 사건 표지판 옆으로 간다
  meet: {
    intro: [{ who: 'guide', text: '거란과 몽골의 침입에 맞선 고려 사람들을 돌아보자. 바닷가에 선 사람들을 한 명씩 만나 봐.' }],
    people: [
      { id: 'seohui', board: '거란과의 외교 담판 (993)', line: { who: 'seohui', text: '나는 거란 장수 소손녕과 담판하여 강동 6주를 얻었소.', src: ['S1'] } },
      { id: 'yanggyu', board: '흥화진 방어 (1010)', line: { who: 'yanggyu', text: '나는 흥화진을 지켜 거란군에 맞섰다.', src: ['S2'] } },
      { id: 'gangamchan', board: '귀주 대첩 (1019)', line: { who: 'gangamchan', text: '나는 1019년 귀주에서 거란군을 크게 물리쳤다.', src: ['S3', 'S5'] } },
      { id: 'kimyunhu', board: '처인성·충주성 싸움 (1232·1253)', line: { who: 'kimyunhu', text: '나는 처인성과 충주성에서 백성과 함께 몽골군에 맞섰소.', src: ['S4'] } },
      { id: 'baejungson', board: '삼별초의 항쟁 (1270~1273)', line: { who: 'baejungson', text: '나는 군사와 백성을 이끌고 강화도에서 진도로 옮겨 맞섰다.', src: ['S21'] } },
    ],
    done: [
      { who: 'guide', text: '서희는 말로, 양규와 강감찬은 싸움으로 거란을 막았어.' },
      { who: 'guide', text: '몽골에 맞서서는 김윤후와 백성들이 처인성과 충주성을 지켰고, 삼별초는 진도와 제주도로 옮겨 가며 끝까지 맞섰지.' },
    ],
  },

  quizzes: [
    { kind: 'quiz', year: 1270, question: '삼별초가 끝까지 싸운 까닭은?', options: ['고려 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 데 반대해서', '거란을 물리치려고', '대장경을 지키려고'], answer: 0, explain: '삼별초는 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 것에 반대했어요.', src: ['S21'] },
    { kind: 'quiz', year: 1270, question: '삼별초가 근거지를 옮긴 순서는?', options: ['강화도 → 진도 → 제주도', '제주도 → 진도 → 강화도', '진도 → 강화도 → 제주도'], answer: 0, explain: '강화도에서 진도로, 진도에서 제주로 옮겨 가며 싸웠어요.', src: ['S12', 'S21'] },
  ],
};
