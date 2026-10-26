// 조선편 5장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 5장 절을 따른다.
// 척화·주화는 어느 쪽이 옳다고 정답을 매기지 않는다. 두 생각을 듣고 뜻으로만 나눈다(설계 문서 3장 원칙 5).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '성을 지키는 병사', mark: '兵', color: '#3c4c6a', look: 'joseonSoldier' },
    keeper: { name: '창고지기', mark: '倉', color: '#6b4a32', look: 'worker' },
    kimsangheon: { name: '김상헌', mark: '金', color: '#55608a', look: 'kimsangheon' },
    choemyeonggil: { name: '최명길', mark: '崔', color: '#5d6b52', look: 'choemyeonggil' },
  },

  intro: [
    { who: 'narr', text: '1636년 12월, 청나라 군대가 압록강을 건너 쳐들어왔어요. 이 전쟁을 병자호란이라고 해요.', src: ['S38'] },
    { who: 'narr', text: '인조는 강화도로 가려 했지만 길이 막혀 남한산성으로 들어갔어요.', src: ['S38'] },
  ],

  start: [
    { who: 'guide', text: '너는 남한산성을 지키는 병사야. 눈이 많이 내리고 몹시 추워.' },
    { who: 'guide', text: '적에게 둘러싸인 성안은 어떤 형편일까? 성벽 아래에서 불을 쬐는 병사에게 먼저 물어보자.' },
  ],

  goals: ['성벽 아래의 병사에게 말을 걸어 보자', '창고지기에게 말을 걸어 보자', '김상헌의 생각을 들어 보자', '최명길의 생각을 들어 보자', '두 생각을 나누고 성을 지키자', '배운 내용을 확인해 보자'],

  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '성안의 군사는 1만 3천 명쯤이야.', src: ['S38'] },
        { who: 'soldier', text: '성 밖에는 청나라 군대가 가득해.', src: ['S38'] },
        { who: 'soldier', text: '창고지기에게도 가 봐.' },
      ],
      later: [{ who: 'soldier', text: '손이 꽁꽁 얼었어. 화톳불이 꺼지지 않게 해야 해.' }],
    },
    keeper: {
      tooEarly: [{ who: 'keeper', text: '성벽 아래의 병사에게 먼저 가 봐.' }],
      first: [
        { who: 'keeper', text: '양식은 50여 일을 버틸 만큼밖에 없어.', src: ['S38'] },
        { who: 'keeper', text: '조정의 대신들은 앞으로 어떻게 할지 의견이 나뉘었대. 행궁 앞에 가 봐.' },
      ],
      later: [{ who: 'keeper', text: '남은 곡식이 얼마 없어. 한 숟가락씩 아껴 먹어야 해.' }],
    },
    signFortress: { always: [
      { who: 'narr', text: '남한산성은 2014년 유네스코 세계유산이 되었어요.', src: ['S47'] },
    ] },
    signHaenggung: { always: [
      { who: 'narr', text: '행궁은 전쟁 같은 때에 임금이 머물 수 있게 지은 궁궐이에요. 1625년에 완성했어요.', src: ['S47'] },
    ] },
    signWestGate: { always: [
      { who: 'narr', text: '1637년 1월, 인조는 세자와 함께 이 서문으로 나와 삼전도로 갔어요.', src: ['S38'] },
    ] },
    kimsangheon: {
      tooEarly: [{ who: 'kimsangheon', text: '성안의 형편부터 살펴보고 오너라.' }],
      first: [
        { who: 'kimsangheon', text: '청과 화의할 수 없다. 끝까지 싸워야 한다.', src: ['S38'] },
        { who: 'kimsangheon', text: '이처럼 화의에 반대하는 생각을 척화라고 한다.', src: ['S38'] },
      ],
      later: [{ who: 'kimsangheon', text: '나는 화의에 찬성할 수 없다.' }],
    },
    choemyeonggil: {
      tooEarly: [{ who: 'choemyeonggil', text: '김상헌 대감의 말씀부터 들어 보아라.' }],
      first: [
        { who: 'choemyeonggil', text: '나라와 백성을 지키려면 청과 화의를 해야 한다.', src: ['S38'] },
        { who: 'choemyeonggil', text: '이처럼 화의를 하자는 생각을 주화라고 한다.', src: ['S38'] },
        { who: 'guide', text: '두 사람 모두 나라를 걱정했지만 생각이 달랐어. 누구의 말이 어떤 생각인지 나누어 보자.' },
      ],
    },
  },

  sort: {
    src: ['S38'],
    title: '이 말은 어떤 생각일까요?',
    bins: [{ id: 'cheok', label: '척화' }, { id: 'ju', label: '주화' }],
    cards: [
      { text: '청과 화의하지 말고 싸우자', bin: 'cheok' },
      { text: '나라의 뜻을 지키려면 끝까지 버텨야 한다', bin: 'cheok' },
      { text: '화의를 해서 전쟁을 끝내자', bin: 'ju' },
      { text: '백성과 나라를 지키려면 화의해야 한다', bin: 'ju' },
      { text: '청의 요구를 받아들일 수 없다', bin: 'cheok' },
      { text: '청과 이야기를 나누어 길을 찾자', bin: 'ju' },
    ],
    fail: '청과 화의하지 말고 끝까지 싸우자는 생각이 척화, 화의를 하자는 생각이 주화예요. 말의 뜻을 다시 읽어 보세요.',
  },
  fires: {
    howto: [{ who: 'guide', text: '눈보라에 성벽의 화톳불이 꺼졌어! 시간 안에 화톳불에 다가가 모두 다시 켜자.' }],
    fail: '화살표를 따라 가장 가까운 화톳불부터 켜 보세요.',
    done: [{ who: 'guide', text: '화톳불이 다시 타오른다. 병사들이 손을 녹이고 있어.' }],
  },
  // 삼전도의 항복(선생님 의견으로 넣은 장면): 인조가 청 태종에게 삼궤구고두례를 하는 모습을 보여 준다
  samjeondo: [
    { who: 'narr', text: '1637년 1월 30일, 인조는 소현세자와 신하들을 데리고 남한산성 서문을 나와 삼전도로 갔어요.', src: ['S63', 'S38'] },
    { who: 'narr', text: '삼전도에는 높은 단(수항단)이 세워져 있었고, 그 위에 청나라 황제(청 태종)가 앉아 있었어요.', src: ['S63'] },
    { who: 'narr', text: '인조는 단 아래에서 세 번 무릎을 꿇고, 꿇을 때마다 세 번씩 모두 아홉 번 머리를 조아리는 예(삼궤구고두례)를 올리며 항복했어요.', src: ['S63'] },
  ],

  result: [
    { who: 'narr', text: '강화도가 청군에게 함락되자 인조는 항복하기로 했어요.', src: ['S38'] },
    { who: 'narr', text: '1637년 1월, 인조는 남한산성에서 나와 삼전도에서 청나라에 항복했어요.', src: ['S38'] },
    { who: 'narr', text: '소현세자와 봉림대군은 청나라에 볼모로 끌려갔어요.', src: ['S38'] },
  ],

  quizzes: [
    { kind: 'quiz', year: 1636, question: '병자호란 때 인조가 들어가 버틴 곳은?', options: ['강화도', '남한산성', '수원 화성'], answer: 1, explain: '강화도로 가는 길이 막혀 남한산성으로 들어갔어요.', src: ['S38'] },
    { kind: 'quiz', year: 1637, question: '인조가 청나라에 항복한 곳은?', options: ['삼전도', '위화도', '한산도'], answer: 0, explain: '1637년 1월 삼전도에서 항복했어요.', src: ['S38'] },
  ],
};
