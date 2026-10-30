// 조선편 5장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 5장 절을 따른다.
// 척화·주화는 어느 쪽이 옳다고 정답을 매기지 않는다. 두 생각을 듣고 뜻으로만 나눈다(설계 문서 3장 원칙 5).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '성을 지키는 병사', mark: '兵', color: '#3c4c6a', look: 'joseonSoldier' },
    keeper: { name: '창고지기', mark: '倉', color: '#6b4a32', look: 'worker' },
    kimsangheon: { name: '김상헌', mark: '金', color: '#55608a', look: 'kimsangheon' },
    choemyeonggil: { name: '최명길', mark: '崔', color: '#5d6b52', look: 'choemyeonggil' },
    official: { name: '신하', mark: '臣', color: '#55608a', look: 'joseonOfficial' },
    injo: { name: '인조', mark: '王', color: '#a3262a', look: 'injo' },
    coldfolk: { name: '성안 백성', mark: '民', color: '#7a6a52', look: 'peasant' },
  },

  intro: [
    { who: 'narr', text: '1636년 12월 청나라 군대가 압록강을 건너 쳐들어와 병자호란이 일어났어요.', src: ['S38'] },
    { who: 'narr', text: '인조는 강화도로 가려 했지만 길이 막혀 남한산성으로 들어갔어요.', src: ['S38'] },
  ],

  start: [
    { who: 'guide', text: '너는 남한산성을 지키는 병사야. 눈이 많이 내리고 몹시 추워.' },
    { who: 'guide', text: '남한산성은 2014년 유네스코 세계유산이 되었어요.', src: ['S47'] }, // 예전 '남한산성' 안내판(C-03)
    { who: 'guide', text: '성안 사람들의 이야기를 모두 들어 보자.' },
  ],

  // 퀘스트(C-01): 실제 진행 차례대로. 퀴즈는 빛나는 문이 대신한다
  goals: ['성안 사람들의 이야기를 모두 들어 보자', '행궁 앞 김상헌과 최명길의 생각을 들어 보자', '신하를 같은 생각의 대신 곁으로 데려가자', '추위에 떠는 백성에게 가 보자', '장작을 들고 화톳불을 다시 켜자', '인조의 이야기를 들어 보자', '인조를 따라 삼전도로 가자'],
  more: { who: 'guide', text: '아직 이야기를 듣지 않은 사람이 있어. 모두 들어 보자.' },
  ministerMore: { who: 'guide', text: '다른 대신의 생각도 들어 보자.' },
  closing: { who: 'guide', text: '두 사람 모두 나라를 걱정했지만 생각이 달랐어. 행궁 마당의 신하들은 누구와 같은 생각일까?' },

  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '성안의 군사는 1만 3천 명쯤이야.', src: ['S38'] },
        { who: 'soldier', text: '성 밖에는 청나라 군대가 가득해.', src: ['S38'] },
      ],
      bridge: { who: 'soldier', text: '창고지기 말 들었지? 군사 형편도 좋지 않아.' },
      later: [{ who: 'soldier', text: '손이 꽁꽁 얼었어. 화톳불이 꺼지지 않게 해야 해.' }],
    },
    keeper: {
      first: [
        { who: 'keeper', text: '양식은 50여 일을 버틸 만큼밖에 없어.', src: ['S38'] },
        { who: 'keeper', text: '저 행궁은 전쟁 같은 때에 임금이 머물 수 있게 지은 궁궐이야. 1625년에 완성했지.', src: ['S47'] }, // 예전 '행궁' 안내판(C-03)
        { who: 'keeper', text: '조정의 대신들은 앞으로 어떻게 할지 의견이 나뉘었대. 행궁 앞에 가 봐.' },
      ],
      bridge: { who: 'keeper', expr: 'worry', text: '병사 말대로 성 밖은 적으로 가득하지. 성안 살림도 걱정이야.' },
      later: [{ who: 'keeper', text: '남은 곡식이 얼마 없어. 한 숟가락씩 아껴 먹어야 해.' }],
    },
    // 추위에 떠는 백성(N-03): 미니게임에서 이 사람의 이야기를 들어야 화톳불 켜기가 시작된다(C-05)
    coldfolk: {
      always: [{ who: 'coldfolk', text: '너무 추워서 손발이 꽁꽁 얼었어요.' }],
      first: [
        { who: 'coldfolk', text: '눈보라에 화톳불이 모두 꺼졌어요. 너무 추워서 손발이 꽁꽁 얼었어요.' },
        { who: 'coldfolk', text: '장작더미에서 장작을 가져다 불을 다시 켜 주세요.' },
      ],
    },
    kimsangheon: {
      wait: [{ who: 'kimsangheon', text: '성안 사람들의 이야기를 모두 듣고 오너라.' }],
      first: [
        { who: 'kimsangheon', text: '청과 화의할 수 없다. 끝까지 싸워야 한다.', src: ['S38'] },
        { who: 'kimsangheon', text: '이처럼 화의(싸움을 멈추고 화해하자는 의논)에 반대하는 생각을 척화라고 한다.', src: ['S38'] },
      ],
      later: [{ who: 'kimsangheon', text: '나는 화의에 찬성할 수 없다.' }],
    },
    choemyeonggil: {
      first: [
        { who: 'choemyeonggil', text: '나라와 백성을 지키려면 청과 화의를 해야 한다.', src: ['S38'] },
        { who: 'choemyeonggil', text: '이처럼 화의를 하자는 생각을 주화라고 한다.', src: ['S38'] },
      ],
      wait: [{ who: 'choemyeonggil', text: '성안 사람들의 형편을 모두 살펴보고 오게.' }],
      later: [{ who: 'choemyeonggil', text: '나는 청과 화의를 해야 한다고 생각한다.', src: ['S38'] }],
    },
    // 출발 전 인조의 하소연(N-04): 출처(S38) 안의 사실만 — 강화도 함락, 항복하기로 함, 세자와 함께 서문으로 나가 삼전도로
    injo: {
      first: [
        { who: 'injo', text: '강화도마저 청군에게 함락되었구나. 어찌하면 좋단 말이냐.', src: ['S38'] },
        { who: 'injo', text: '청에 항복하기로 하였다. 세자와 함께 서문으로 나가 삼전도로 가겠다.', src: ['S38'] },
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
    // 신하를 데려가기(D-26): 신하에게 말을 걸면 따라오고, 같은 생각의 대신(김상헌=척화, 최명길=주화) 곁에 닿으면 그 곁에 선다
    use: [0, 2, 4, 5],
    howto: { title: '신하 데려가기', steps: ['마당의 신하에게 말을 걸면 생각을 말하고 나를 따라와요.', '같은 생각의 대신(김상헌=척화, 최명길=주화) 곁으로 데려가요.'] },
    wrong: { who: 'guide', text: '이 신하의 말은 다른 쪽 생각에 가까워요. 화의에 반대하면 척화(김상헌), 화의를 하자면 주화(최명길)예요.' },
    follow: { who: 'guide', text: '신하가 따라온다. 같은 생각의 대신 곁으로 데려가자.' },
  },
  fires: {
    howto: [{ who: 'guide', text: '장작더미에서 장작을 들고, 꺼진 화톳불을 어느 것부터든 모두 다시 켜자.' }],
    card: { title: '화톳불 켜기', steps: ['장작더미에서 대화 버튼을 눌러 장작을 들어요.', '꺼진 화톳불 옆에서 대화 버튼을 눌러 모두 켜요(아무 차례나).'] },
    pick: { who: 'guide', text: '장작을 들었어. 꺼진 화톳불로 가자!' },
    fail: '장작을 든 채 꺼진 화톳불 옆에서 대화 버튼을 눌러 보세요. 화살표는 가장 가까운 불을 가리켜요.',
    done: [{ who: 'guide', text: '화톳불이 다시 타오른다. 병사들이 손을 녹이고 있어.' }],
  },
  // 삼전도의 항복(선생님 의견으로 넣은 장면): 인조가 청 태종에게 삼궤구고두례를 하는 모습을 보여 준다
  walk: {
    start: [{ who: 'guide', text: '인조가 행궁을 나선다. 인조를 따라 서문으로 가자.' }],
  },
  samjeondo: [
    { who: 'narr', text: '1637년 1월 30일, 인조는 소현세자와 신하들을 데리고 남한산성 서문을 나와 삼전도로 갔어요.', src: ['S63', 'S38'] },
    { who: 'narr', text: '삼전도에는 높은 단(수항단)이 세워져 있었고, 그 위에 청나라 황제(청 태종)가 앉아 있었어요.', src: ['S63'] },
    { who: 'narr', text: '인조는 단 아래에서 세 번 무릎을 꿇고, 꿇을 때마다 세 번씩 머리를 땅에 조아렸어요. 이렇게 아홉 번 머리를 조아리는 예(삼궤구고두례)를 올리며 항복했어요.', src: ['S63'] },
  ],

  // 끝 해설 장면(D-58, chapters/joseon/j5/story.js): result 셋째 문장(볼모)을 눈길 행렬 장면 위에
  hostage: { line: { who: 'keeper', expr: 'worry', text: '세자 저하와 대군께서 청나라로 끌려가신다니…' } },
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
