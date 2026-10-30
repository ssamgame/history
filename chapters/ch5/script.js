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
    { who: 'narr', text: '1232년 몽골군이 고려의 대장경(초조대장경)을 불태웠어요.', src: ['S9'] },
    { who: 'narr', text: '고려 사람들은 부처의 힘으로 나라를 지키려는 마음을 모아 다시 대장경을 만들었어요.', src: ['S9', 'S7'] },
  ],

  start: [{ who: 'guide', text: '작업장 가운데에 계신 스님께 먼저 이야기를 들어 보자.' }],

  goals: ['스님의 이야기를 들어 보자', '장인들에게 경판 만드는 법을 들어 보자', '스님께 돌아가 이야기하자', '나무판으로 경판을 만들어 보자', '스님께 다 만든 경판을 보여 드리자', '다 만든 경판을 서가에 놓자'],

  // 장인은 어느 차례로 찾아가도 자기 일을 말해 준다. 2번~4번은 앞 사람의 일을 받아 "그다음엔…"으로 시작한다(D-17)
  npc: {
    artisan1: [
      { who: 'artisan1', text: '베어 낸 나무를 먼저 바닷물에 담가 두었다네.', src: ['S8'] },
      { who: 'artisan1', text: '그다음에는 소금물에 삶지.', src: ['S8'] },
    ],
    artisan2: [{ who: 'artisan2', text: '그다음엔 소금물에 삶아 둔 나무를 그늘에서 말린다네.', src: ['S8'] }],
    artisan3: [{ who: 'artisan3', text: '그다음엔 다 마른 판에 글자를 한 자 한 자 새긴단다.', src: ['S8'] }],
    artisan4: [
      { who: 'artisan4', text: '그다음엔 글자를 새긴 판의 양 끝에 나무를 덧대어 글자끼리 닿지 않게 하고, 네 귀퉁이를 구리판으로 감싸 고정한다네. 이 덧댄 나무를 마구리라고 하지.', src: ['S8', 'S9'] },
      { who: 'artisan4', text: '마지막으로 벌레가 먹지 않도록 옻칠을 한다네.', src: ['S8'] },
    ],
    monk: {
      open: [
        { who: 'monk', expr: 'worry', text: '몽골군이 불태운 대장경을 다시 만들어야 하오.', src: ['S9'] },
        { who: 'monk', text: '부처의 힘으로 나라를 지키려는 마음을 모아 만드는 것이오.', src: ['S7'] },
        { who: 'monk', text: '1번부터 4번까지 장인 네 사람에게 경판 만드는 법을 들어 보시오.' },
      ],
      later: [{ who: 'monk', text: '장인 네 사람에게 경판 만드는 법을 모두 들어 보시오.' }],
    },
  },
  // 앞 번호 장인의 이야기를 아직 안 들었을 때 한 줄 덧붙인다(막지는 않는다)
  earlier: (who, n) => ({ who, text: `앞의 일은 ${n}번 장인에게도 들어 보게.` }),

  making: {
    steps: ['나무를 바닷물에 담그기', '소금물에 삶기', '그늘에서 말리기', '글자 새기기', '마구리(판 양 끝에 나무 덧대기)', '옻칠하기'],
    give: [{ who: 'monk', text: '이 나무판을 들고 장인들에게 들은 순서대로 일을 해 보시오. 빛나는 곳으로 가면 되오.' }],
    howto: { title: '경판 만들기', steps: ['나무판을 들고 빛나는 곳에서 차례로 일을 해요.', '3번 장인 자리에서 大藏經을 새기고 여섯 곳의 일을 마치면 경판이 완성돼요.'] },
    // 자리마다 일을 할 때 뜨는 과정 그림의 제목과 그 아래 설명 한 줄(D-32). id는 장면의 작업 자리 차례와 같다
    pictures: [
      { id: 'soak', title: '나무를 바닷물에 담그기', who: 'narr', text: '베어 낸 나무를 먼저 바닷물에 담가 두어요.', src: ['S8'] },
      { id: 'boil', title: '소금물에 삶기', who: 'narr', text: '바닷물에 담갔던 나무를 소금물에 삶아요.', src: ['S8'] },
      { id: 'dry', title: '그늘에서 말리기', who: 'narr', text: '소금물에 삶은 나무를 그늘에서 말려요.', src: ['S8'] },
      { id: 'carve', title: '글자 새기기', who: 'narr', text: '다 마른 판에 글자를 한 자 한 자 새겨요.', src: ['S8'] },
      { id: 'ends', title: '마구리 달기', who: 'narr', text: '판의 양 끝에 마구리를 덧대어 글자끼리 닿지 않게 하고, 네 귀퉁이를 구리판으로 감싸 고정해요.', src: ['S8', 'S9'] },
      { id: 'lacquer', title: '옻칠하기', who: 'narr', text: '벌레가 먹지 않도록 옻칠을 해요.', src: ['S8'] },
    ],
    failHint: { who: 'monk', text: '장인들에게 들은 순서를 떠올려 보시오. 지금은 빛나는 곳으로 가야 하오.' },
    done: [{ who: 'monk', expr: 'joy', text: '옻칠까지 마쳤으니 경판이 다 되었소.' }],
  },

  carving: {
    intro: [{ who: 'guide', text: '3번 장인 자리에서 경판에 대장경(大藏經) 세 글자를 한자 그대로 새겨 보자. 빛나는 점을 1번부터 차례로 지나가도록 끌어 봐.' }],
    toEnds: { who: 'guide', text: '글자를 새긴 경판을 들고 4번 장인에게 가져가자.' },
    shelve: { who: 'guide', text: '다 새긴 경판을 들고 서가(빛나는 곳)에 놓아 보자.' },
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
