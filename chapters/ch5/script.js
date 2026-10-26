// 5장 대사와 퀴즈. 문장과 출처 번호는 설계 문서 4장 5장 절을 따른다.
import { GLYPHS } from '../../content/glyphs.js';

const READING = { '大': '대', '藏': '장', '經': '경' };

export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    artisan1: { name: '1번 장인 (나무)', mark: '一', color: '#8a6a45', look: 'artisan' },
    artisan2: { name: '2번 장인 (말리기)', mark: '二', color: '#8a6a45', look: 'artisan' },
    artisan3: { name: '3번 장인 (새기기)', mark: '三', color: '#8a6a45', look: 'artisan' },
    artisan4: { name: '4번 장인 (마무리)', mark: '四', color: '#8a6a45', look: 'artisan' },
    monk: { name: '스님', mark: '僧', color: '#8a8780', look: 'monk' },
  },

  intro: [
    { who: 'narr', text: '몽골군이 쳐들어와 고려의 대장경(초조대장경)을 불태웠어요(1232년).', src: ['S9'] },
    { who: 'narr', text: '고려 사람들은 부처의 힘으로 나라를 지키려는 마음을 모아 다시 대장경을 만들었어요.', src: ['S7'] },
  ],

  start: [
    { who: 'guide', text: '여기는 대장경 경판을 만드는 작업장이야. 경판은 1번 장인부터 4번 장인까지 차례로 손을 거쳐 만들어져.' },
    { who: 'guide', text: '머리 위 번호를 보고 1번 장인부터 차례로 이야기를 들어 보자.' },
  ],

  goals: ['1번 장인부터 차례로 경판 만드는 법을 들어 보자', '경판 만드는 순서를 맞춰 보자', '경판에 글자를 새겨 보자', '배운 내용을 확인해 보자'],

  npc: {
    artisan1: [
      { who: 'artisan1', text: '베어 낸 나무를 먼저 바닷물에 담가 두었다네.', src: ['S8'] },
      { who: 'artisan1', text: '그다음에는 소금물에 삶지.', src: ['S8'] },
    ],
    artisan2: [{ who: 'artisan2', text: '삶은 나무는 그늘에서 말린다네.', src: ['S8'] }],
    artisan3: [{ who: 'artisan3', text: '다 마른 판에 글자를 한 자 한 자 새긴단다.', src: ['S8'] }],
    artisan4: [
      { who: 'artisan4', text: '글자를 새긴 판은 양 끝에 나무를 덧대어 글자끼리 닿지 않게 하고, 네 귀퉁이를 구리판으로 감싸 고정한다네. 이 덧댄 나무를 마구리라고 하지.', src: ['S8', 'S9'] },
      { who: 'artisan4', text: '마지막으로 벌레가 먹지 않도록 옻칠을 한다네.', src: ['S8'] },
    ],
    monk: [{ who: 'monk', text: '1번 장인부터 4번 장인까지 차례로 이야기를 들으면 경판 만드는 순서를 알 수 있을 거예요.' }],
  },
  // 차례보다 먼저 찾아간 장인이 하는 말(n: 지금 들어야 할 장인 번호)
  tooEarly: n => [{ who: 'guide', text: `아직 이 장인의 차례가 아니야. 경판은 차례대로 만들어지니 ${n}번 장인의 이야기부터 들어 보자.` }],

  making: {
    title: '경판 만드는 순서대로 그림 카드를 눌러요',
    cards: ['나무를 바닷물에 담그기', '소금물에 삶기', '그늘에서 말리기', '글자 새기기', '마구리(판 양 끝에 나무 덧대기)', '옻칠하기'],
    failHint: '순서가 달라요. 장인들의 이야기를 떠올려 다시 해 봐요.',
  },

  carving: {
    intro: [{ who: 'guide', text: '이제 경판에 대장경(大藏經) 세 글자를 한자 그대로 새겨 보자. 빛나는 점을 1번부터 차례로 지나가도록 끌어 봐.' }],
    glyphs: GLYPHS.map(g => ({ ...g, reading: READING[g.glyph] })),
  },

  result: [
    { who: 'narr', text: '1236년부터 1251년까지 16년 동안 만든 경판은 81,258판이에요. 이것이 팔만대장경이에요.', src: ['S7', 'S9'] },
    { who: 'narr', text: '팔만대장경판은 유네스코 세계기록유산이에요.', src: ['S9'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1236, question: '고려 사람들이 팔만대장경을 만든 까닭은?', options: ['책을 팔기 위해', '부처의 힘으로 몽골의 침입을 물리치려고', '글씨 연습을 하려고'], answer: 1, explain: '부처의 힘으로 나라를 지키려는 마음을 모아 만들었어요.', src: ['S7'] },
    { kind: 'quiz', year: 1236, question: '경판에 옻칠을 한 까닭은?', options: ['색을 예쁘게 하려고', '벌레가 먹지 않도록', '무겁게 하려고'], answer: 1, explain: '옻칠은 벌레가 먹지 않도록 경판을 지켜 줘요.', src: ['S8'] },
  ],
};
