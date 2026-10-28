// 조선편 2장(폴더 j3) 대사와 퀴즈. 문장과 출처 번호는 조선편 설계 문서 4장 3장 절을 따른다.
// 측우기는 '장영실이 발명했다'고 쓰지 않는다(설계 문서 3장 원칙 2).
// D-30: 길 위 안내판을 없애고 그 해설은 곁 사람의 대사로 옮겼다(C-03). 자격루는 출처 문장보다 자세히 말하지 않는다.
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

  start: [{ who: 'guide', text: '너는 하늘과 날씨를 살피는 관청(서운관)의 견습생이야. 한양에 새로 만든 기구들 이야기를 들어 보자.' }],

  goals: ['한양 사람들에게 새 기구 이야기를 모두 들어 보자', '길가의 앙부일구에 가서 그림자를 읽어 보자', '보루각의 자격루에 물을 부어 보자', '서운관 마당의 측우기로 빗물을 재 보자'],
  // 더 들어 볼 사람이 남았을 때
  more: { who: 'guide', text: '다른 사람의 이야기도 모두 들어 보자. 어느 사람부터 가도 괜찮아.' },
  // 세 사람의 이야기를 모두 들었을 때
  heardAll: [{ who: 'guide', text: '이제 기구를 하나씩 직접 살펴보자. 먼저 길가의 앙부일구로 가 보자.' }],

  npc: {
    commoner: {
      first: [
        { who: 'commoner', text: '이 해시계는 앙부일구예요. 글을 몰라도 그려 놓은 동물 그림으로 시간을 알 수 있어요.', src: ['S31'] },
        { who: 'commoner', text: '그림자로 시각과 절기를 함께 알 수 있어서 시계이자 달력이지요.', src: ['S31'] },
        { who: 'commoner', text: '사람이 많이 다니는 길가에 두어서 누구나 볼 수 있어요.', src: ['S31'] },
      ],
      bridge: { who: 'commoner', text: '새 기구를 보러 다니는군요. 이 길가에도 하나 있어요.' },
      later: [
        { who: 'commoner', text: '저 서쪽의 긴 건물은 종묘예요. 조선의 왕과 왕비의 신주를 모신 곳이지요.', src: ['S45'] },
        { who: 'narr', text: '종묘 정전은 한 칸마다 한 왕을 모셔서 옆으로 아주 길어요. 1995년 유네스코 세계유산이 되었어요.', src: ['S45'] },
      ],
    },
    jangyeongsil: {
      first: [
        { who: 'jangyeongsil', text: '이것이 자격루다. 정해진 때가 되면 스스로 종과 북을 울려 시간을 알린다.', src: ['S32'] },
        { who: 'jangyeongsil', text: '흘러드는 물과 쇠구슬, 나무 인형, 종을 이어서 움직이게 했지.', src: ['S31'] },
        { who: 'jangyeongsil', text: '이 보루각에 두고 나라의 표준 시계로 쓴다네.', src: ['S32'] },
      ],
      bridge: { who: 'jangyeongsil', text: '여러 기구를 보고 왔구나. 이곳 보루각의 물시계도 보아라.' },
      later: [{ who: 'jangyeongsil', text: '사람의 손을 거치지 않고 시간을 알리는 물시계라네.', src: ['S31', 'S32'] }],
    },
    crownPrince: {
      first: [
        { who: 'crownPrince', text: '비가 얼마나 왔는지 재면 가뭄과 홍수에 대비할 수 있다.', src: ['S31'] },
        { who: 'crownPrince', text: '깊이 약 31cm, 지름 약 15cm인 쇠 원통을 돌로 된 측우대 위에 올려 둔다.', src: ['S33'] },
        { who: 'crownPrince', text: '비가 그치면 원통에 고인 빗물의 깊이를 자로 잰다.', src: ['S33'] },
      ],
      bridge: { who: 'crownPrince', text: '시간을 재는 기구를 보았느냐? 비를 재는 일도 중요하다.' },
      later: [{ who: 'crownPrince', text: '비가 그치면 자로 빗물의 깊이를 재는 것을 잊지 마라.', src: ['S33'] }],
    },
  },

  dial: {
    intro: [
      { who: 'guide', text: '앙부일구 속을 가까이 보자. 그릇 안쪽의 세로줄은 시각, 가로줄은 절기를 나타내.', src: ['S30'] },
      { who: 'guide', text: '그림자 바늘의 검은 그림자가 닿은 시각 칸을 읽으면 돼.' },
    ],
    howto: { title: '앙부일구 읽기', steps: ['검은 그림자가 닿은 시각 칸을 손가락으로 눌러요.', '해가 움직이면 그림자도 옮겨 가요. 세 번 맞히면 성공!'] },
    again: { who: 'guide', text: '해가 움직여 그림자가 옮겨 갔어. 지금은 어느 시각일까?' },
    fail: '그릇 안 검은 그림자가 뻗어 닿은 칸의 시각을 눌러요.',
    done: [{ who: 'narr', text: '앙부일구는 사람이 많이 다니는 혜정교와 종묘 앞에 두어 누구나 시간을 알 수 있게 했어요.', src: ['S31'] }],
  },
  clock: {
    done: [{ who: 'narr', text: '자격루는 장영실이 만든 물시계로, 사람이 손대지 않아도 시간을 알렸어요.', src: ['S31', 'S32'] }],
  },
  rain: {
    intro: [{ who: 'guide', text: '서운관 마당의 측우기 속을 크게 보이게 했어. 쇠 원통 안에 빗물이 고이는 게 보일 거야.' }],
    howto: { title: '측우기로 빗물 재기', steps: ['비가 그치면 측우기 속 빗물의 윗면과 같은 높이의 눈금을 눌러요.', '소나기가 두 번 와요. 두 번 맞히면 성공!'] },
    shower: { who: 'guide', text: '앗, 소나기가 쏟아진다! 측우기에 빗물이 고이고 있어.' },
    read: { who: 'guide', text: '비가 그쳤어. 물 높이와 같은 눈금은 몇일까?' },
    fail: '물의 윗면과 같은 높이에 있는 눈금 번호를 눌러요.',
    done: [{ who: 'narr', text: '측우기는 서울의 서운관과 여러 도에 두고, 비가 온 양을 재어 나라에 알리게 했어요.', src: ['S33'] }],
  },

  quizzes: [
    { kind: 'quiz', year: 1434, question: '글을 모르는 백성도 시간을 알 수 있게 앙부일구에 그린 것은?', options: ['별자리', '12지신 동물', '한자 숫자'], answer: 1, explain: '시각마다 12지신 동물 그림을 그려 넣었어요.', src: ['S31'] },
    { kind: 'quiz', year: 1441, question: '비가 온 양을 잰 기구는?', options: ['자격루', '앙부일구', '측우기'], answer: 2, explain: '측우기에 고인 빗물의 깊이를 자로 재었어요.', src: ['S33'] },
  ],
};
