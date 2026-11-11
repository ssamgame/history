// 성장의 재미(2026-11-10·11 선생님): ① 타임머신 키우기(부품을 모으고, 언제든 떼었다 붙였다) ② 역사 인물의 편지.
// 걸린 시간은 어디에도 쓰지 않는다(대충 하게 만든다). 도전 쪽지(숨은 안내판 문제)는 2026-11-11 선생님 말씀으로 뺐다.
// 편지는 고려편 여섯 장부터(나머지 편은 선생님 확인 뒤). 글 속 사실은 그 장 대본에 이미 있는 문장을 그대로 따르고 같은 출처(src)를 단다.

// 타임머신 단계: 마친 장 수(at)에 닿으면 부품이 붙는다(core/timemachine.js makeTimeMachine({ level }))
export const TM_STAGES = [ // 3~4장마다 하나씩(2026-11-11 선생님): 30장을 모두 마치면 아홉 번 자란다
  { at: 0, name: '기본 타임머신', parts: '시간 여행의 시작' },
  { at: 3, name: '금빛 시계', parts: '금빛 시계 테 · 굵은 창틀 · 꼭대기 큰 불빛' },
  { at: 6, name: '단청 날개', parts: '금빛 테를 두른 붉은 날개 한 쌍' },
  { at: 9, name: '청사초롱', parts: '문 양옆 청사초롱 · 날개 끝 등불 · 금빛 허리띠' },
  { at: 12, name: '꼬리 날개와 쌍부스터', parts: '꼬리 날개 · 부스터 둘 더' },
  { at: 15, name: '단청 띠와 깃발', parts: '네 빛깔 단청 무늬 띠 · 날개 위 깃발' },
  { at: 18, name: '시간 고리', parts: '몸통 둘레를 도는 금 고리와 빛 구슬' },
  { at: 22, name: '금관', parts: '코 둘레에 솟은 금빛 관' },
  { at: 26, name: '별 조각', parts: '떠도는 별 조각 · 푸른 겹고리' },
  { at: 30, name: '시간의 달인', parts: '발밑 빛 고리 · 푸른 불꽃 · 머리 위 큰 별' },
];
export const tmLevel = done => TM_STAGES.reduce((lv, s, i) => (done >= s.at ? i : lv), 0);
export const finishedCount = save => Object.keys(save?.data?.chapters || {}).length;
// 지금 붙여 둔 부품 번호들: 얻은 부품(1~단계) 가운데 떼어 둔 것(save.data.tmOff)을 뺀다
export const tmParts = save => { const off = save?.data?.tmOff || []; return Array.from({ length: tmLevel(finishedCount(save)) }, (_, i) => i + 1).filter(i => !off.includes(i)); };

// 역사 인물의 편지: 장을 처음 마치면 그 장에서 도운 인물이 보낸다. from: content/characters.js 생김새(얼굴 그림), name: 보낸 사람,
// body: *별표 사이*는 붉게 강조하는 사실, when: 끝인사 앞 때, seal: 도장 글자
export const LETTERS = {
  ch1: { from: 'seohui', name: '서희', when: '993년', seal: '徐',
    body: '거란 진영까지 함께 가 주어 고맙구나. 나는 소손녕에게 *고려는 고구려를 이은 나라*라고 당당히 말했고, *싸우지 않고 말로 거란군을 물러나게* 했단다. 그 뒤 고려는 압록강 동쪽에 *강동 6주*를 얻었지. 말의 힘을 잊지 말거라.', src: ['S18', 'S19', 'S1'] },
  ch2: { from: 'yanggyu', name: '양규', when: '1010년 겨울', seal: '楊',
    body: '그날 성벽 위에서 함께 버텨 주어 고맙구나. 거란의 대군이 몰려왔어도 *흥화진은 끝내 함락되지 않았고*, 우리는 물러가는 거란군을 공격해 *끌려가던 많은 백성을 구했단다*. 네가 사는 먼 훗날에도 이 성을 기억해 다오.', src: ['S15', 'S2'] },
  ch3: { from: 'gangamchan', name: '강감찬', when: '1019년', seal: '姜',
    body: '냇물을 막을 때 힘을 보태 주어 고맙다. *쇠가죽으로 막아 둔 물을 한꺼번에 내려보내* 거란군에 큰 피해를 주었고, *1019년 귀주에서 거란군을 크게 물리쳤단다*. 사람들은 이 싸움을 *귀주 대첩*이라 부르지.', src: ['S3', 'S5'] },
  ch4: { from: 'kimyunhu', name: '김윤후', when: '1253년', seal: '金',
    body: '처인성과 충주성에서 함께 싸워 주어 고맙소. 조정은 *몽골군이 바다와 물에서 싸우는 데 약해서 강화도로 도읍을 옮겼고*, 나는 *백성과 함께 성을 지켰소*. 함께 지키는 사람들은 쉽게 무너지지 않는다오.', src: ['S10', 'S4'] },
  ch5: { from: 'monk', name: '스님', when: '1251년', seal: '佛',
    body: '경판을 끝까지 만들어 주어 고맙소. *몽골군이 불태운 대장경을 다시 만들며*, 우리는 *부처의 힘으로 나라를 지키려는 마음*을 모았소. *벌레가 먹지 않도록 옻칠*까지 했으니 오래오래 남을 것이오.', src: ['S9', 'S7', 'S8'] },
  ch6: { from: 'kimtongjeong', name: '김통정', when: '1273년', seal: '金',
    body: '먼 바닷길을 함께 건너 주어 고맙다. 우리 삼별초는 *조정이 개경으로 돌아가는 데 반대해 끝까지 싸우기로* 했고, *강화도에서 진도로, 진도에서 제주로* 옮겨 가며 맞섰다. 우리가 지키려 한 마음을 기억해 다오.', src: ['S21', 'S12', 'S13'] },
};
// *강조*를 조각으로: [{ text, strong }]
export const letterParts = body => body.split('*').map((text, i) => ({ text, strong: i % 2 === 1 })).filter(p => p.text);
