// 조선편 3장 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 3장 절을 따른다.
// 측우기는 '장영실이 발명했다'고 쓰지 않는다(설계 문서 3장 원칙 2).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    commoner: { name: '백성', mark: '民', color: '#6b4a32', look: 'commoner' },
    jangyeongsil: { name: '장영실', mark: '蔣', color: '#6a5a4a', look: 'jangyeongsil' },
    crownPrince: { name: '세자(훗날 문종)', mark: '世', color: '#2c4a7a', look: 'crownPrince' },
  },

  intro: [
    { who: 'narr', text: '세종 때에는 시간과 비를 재는 여러 기구를 만들었어요.', src: ['S31'] },
    { who: 'narr', text: '해시계 앙부일구와 물시계 자격루는 1434년에 처음 만들었어요.', src: ['S30', 'S32'] },
  ],

  start: [
    { who: 'guide', text: '너는 하늘과 날씨를 살피는 관청(서운관)의 견습생이야.' },
    { who: 'guide', text: '오늘은 한양에 새로 만든 기구들을 살펴보러 왔어. 길가에 둥근 솥처럼 생긴 것 보이지? 그 옆 사람에게 먼저 물어보자.' },
  ],

  goals: ['길가 해시계 옆의 백성에게 말을 걸어 보자', '보루각의 장영실을 찾아가자', '서운관 마당의 세자를 찾아가자', '시간과 비를 재 보자', '배운 내용을 확인해 보자'],

  npc: {
    commoner: {
      first: [
        { who: 'commoner', text: '이 해시계는 앙부일구예요. 글을 몰라도 그려 놓은 동물 그림으로 시간을 알 수 있어요.', src: ['S31'] },
        { who: 'commoner', text: '사람이 많이 다니는 길가에 두어서 누구나 볼 수 있지요.', src: ['S31'] },
        { who: 'commoner', text: '저쪽 보루각에는 스스로 소리를 내는 물시계가 있대요.' },
      ],
      later: [{ who: 'commoner', text: '그림자가 어느 동물 그림에 닿았는지 보면 돼요.' }],
    },
    jangyeongsil: {
      tooEarly: [{ who: 'jangyeongsil', text: '길가의 해시계부터 보고 오너라.' }],
      first: [
        { who: 'jangyeongsil', text: '이것이 자격루다. 정해진 때가 되면 스스로 종과 북을 울려 시간을 알린다.', src: ['S32'] },
        { who: 'jangyeongsil', text: '흘러드는 물과 쇠구슬, 나무 인형, 종을 이어서 움직이게 했지.', src: ['S31'] },
        { who: 'jangyeongsil', text: '서운관 마당에 세자께서 와 계신다. 가 보아라.' },
      ],
      later: [{ who: 'jangyeongsil', text: '세자께서 서운관 마당에서 기다리신다.' }],
    },
    signJongmyo: { always: [
      { who: 'narr', text: '종묘는 조선의 왕과 왕비의 신주를 모신 곳이에요.', src: ['S45'] },
      { who: 'narr', text: '정전은 한 칸마다 한 왕을 모셔서 옆으로 아주 길어요. 1995년 유네스코 세계유산이 되었어요.', src: ['S45'] },
    ] },
    signDial: { always: [
      { who: 'narr', text: '앙부일구는 그림자로 시각과 절기를 함께 알 수 있어서 시계이자 달력이었어요.', src: ['S31'] },
      { who: 'narr', text: '그릇 안쪽의 세로줄은 시각, 가로줄은 절기를 나타내요.', src: ['S30'] },
    ] },
    signClock: { always: [
      { who: 'narr', text: '자격루는 경복궁 보루각에 두고 나라의 표준 시계로 썼어요.', src: ['S32'] },
      { who: 'narr', text: '시간이 되면 나무 인형이 스스로 종과 북을 쳐서, 사람의 손을 거치지 않고 시간을 알렸어요.', src: ['S31', 'S32'] },
    ] },
    signGauge: { always: [
      { who: 'narr', text: '측우기는 깊이 약 31cm, 지름 약 15cm인 쇠 원통이에요.', src: ['S33'] },
      { who: 'narr', text: '돌로 된 측우대 위에 올려 두고 빗물의 깊이를 쟀어요.', src: ['S33'] },
    ] },
    crownPrince: {
      tooEarly: [{ who: 'crownPrince', text: '해시계와 물시계를 먼저 보고 오너라.' }],
      first: [
        { who: 'crownPrince', text: '비가 얼마나 왔는지 재면 가뭄과 홍수에 대비할 수 있다.', src: ['S31'] },
        { who: 'crownPrince', text: '빗물을 받는 쇠 그릇을 두고, 비가 그치면 자로 깊이를 잰다.', src: ['S33'] },
        { who: 'crownPrince', text: '자, 이제 네가 시간과 비를 재 보아라.' },
      ],
    },
  },

  dial: {
    title: '앙부일구: 해를 옮겨 그림자를 맞춰요',
    prompt: ([name, pic]) => `그림자 바늘이 ${pic} ${name} 줄에 오도록 해를 옮긴 뒤 '맞춰 보기'를 눌러요.`,
    fail: '해와 그림자는 서로 반대쪽에 생겨요. 그림자를 서쪽(왼쪽)으로 보내려면 해를 동쪽(오른쪽)으로 옮겨요.',
    howto: {
      title: '해 그림자 맞추기',
      steps: ['앙부일구 위쪽 길에서 해를 끌거나 ◀ ▶ 단추로 옮겨요.', '해가 움직이면 그림자 바늘은 반대쪽으로 움직여요.', '그림자가 알려 준 동물 줄에 오면 \'맞춰 보기\'를 눌러요. 세 번 맞혀요.'],
      keyboard: '← → 로 해 옮기기, 스페이스 · 엔터로 맞춰 보기', touch: '해를 끌거나 ◀ ▶ 단추, 맞춰 보기 단추',
    },
    done: [{ who: 'narr', text: '앙부일구는 사람이 많이 다니는 혜정교와 종묘 앞에 두어 누구나 시간을 알 수 있게 했어요.', src: ['S31'] }],
  },
  clock: {
    src: ['S31', 'S32'],
    title: '자격루가 시간을 알리는 차례대로 찾아가요',
    cards: ['물이 일정하게 흘러 들어와 차오른다', '쇠구슬이 굴러 떨어진다', '나무 인형이 움직인다', '종과 북이 울려 시간을 알린다'],
    fail: '물이 먼저 차올라야 구슬이 구르고, 구슬이 인형을 움직여요. 소리는 맨 마지막이에요.',
    done: [{ who: 'narr', text: '자격루는 장영실이 만든 물시계로, 사람이 손대지 않아도 시간을 알렸어요.', src: ['S31', 'S32'] }],
  },
  rain: {
    shower: [{ who: 'guide', text: '앗, 소나기가 쏟아진다! 측우기에 빗물이 고이고 있어.' }],
    title: '측우기에 고인 빗물의 깊이를 자로 읽어요',
    prompt: '비가 그쳤어요. 물이 찬 높이와 같은 눈금을 고르세요.',
    fail: '물의 윗면(파란 부분의 맨 위)과 같은 높이에 있는 자의 눈금을 읽어요.',
    done: [{ who: 'narr', text: '측우기는 서울의 서운관과 여러 도에 두고, 비가 온 양을 재어 나라에 알리게 했어요.', src: ['S33'] }],
  },

  quizzes: [
    { kind: 'quiz', year: 1434, question: '글을 모르는 백성도 시간을 알 수 있게 앙부일구에 그린 것은?', options: ['별자리', '12지신 동물', '한자 숫자'], answer: 1, explain: '시각마다 12지신 동물 그림을 그려 넣었어요.', src: ['S31'] },
    { kind: 'quiz', year: 1441, question: '비가 온 양을 잰 기구는?', options: ['자격루', '앙부일구', '측우기'], answer: 2, explain: '측우기에 고인 빗물의 깊이를 자로 재었어요.', src: ['S33'] },
  ],
};
