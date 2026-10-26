// 현대편 4장 「1·4 후퇴와 정전 협정」. 사실은 비상 5-2 교과서 142쪽(S51).
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '국군 병사', mark: '軍', color: '#5a6448', look: 'rokSoldier' },
    mother: { name: '피란민 어머니', mark: '母', color: '#b8768a', look: 'woman' },
    unSoldier: { name: '유엔군 병사', mark: 'UN', color: '#5b92e5', look: 'unSoldier' },
  },
  intro: [
    { who: 'narr', text: '국군과 유엔군이 북쪽 국경으로 나아가자, 중국군이 북한을 도우려고 군대를 보냈어요.', src: ['S51'] },
    { who: 'narr', text: '중국군의 공격을 막아 내지 못한 국군과 유엔군은 남쪽으로 물러났고, 1951년 1월 4일 서울을 다시 빼앗겼어요(1·4 후퇴).', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '눈 내리는 1951년 겨울, 피란길이야. 사람들이 짐 보따리를 이고 지고 남쪽으로 걸어가고 있어.' },
    { who: 'guide', text: '추운 겨울에 왜 집을 떠났을까? 길을 지키는 국군 병사에게 먼저 물어보자.' },
  ],
  goals: ['국군 병사에게 말을 걸어 보자', '피란민 어머니를 돕자', '유엔군 병사의 이야기를 들어 보자', '전쟁이 멈추기까지를 따라가자', '배운 내용을 확인해 보자'],
  minigameTitle: '1·4 후퇴와 정전 협정',
  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '압록강 가까이까지 갔는데, 중국군이 내려와서 다시 물러나야 했어.', src: ['S51'] },
        { who: 'soldier', text: '피란민들을 안전하게 도와줘!' },
      ],
      later: [{ who: 'soldier', text: '추워도 힘을 내자. 저 아주머니가 아이를 잃어버렸대. 도와드려.' }],
    },
    mother: {
      tooEarly: [{ who: 'mother', text: '지금 무슨 일이 벌어지는지 병사님 말씀부터 들어 보렴.' }],
      first: [
        { who: 'mother', text: '추운 겨울에 아이들을 데리고 집을 떠나왔단다.', src: ['S51'] },
        { who: 'mother', text: '짐이 무거워서 걷기가 힘들구나. 다른 가족들도 좀 도와주렴.' },
      ],
      later: [{ who: 'mother', text: '고맙다, 정말 고마워. 네 덕분에 아이들이랑 같이 갈 수 있겠구나.' }],
    },
    unSoldier: {
      tooEarly: [{ who: 'unSoldier', text: '지금은 피란민을 돕는 게 먼저야. 그다음에 이야기하자.' }],
      first: [
        { who: 'unSoldier', text: '1·4 후퇴로 서울을 다시 빼앗겼지만, 우리는 국군과 함께 꼭 서울을 되찾을 거야.', src: ['S51'] },
        { who: 'unSoldier', text: '전쟁이 어떻게 멈추게 되는지, 앞의 이정표를 따라가 보자.' },
      ],
    },
    signPanmun: { always: [
      { who: 'narr', text: '1953년 7월 판문점에서 정전 협정이 맺어지면서 휴전선이 그어졌어요.', src: ['S51'] },
    ] },
    signTruce: { always: [
      { who: 'narr', text: '정전은 전쟁 중인 나라들이 전투를 잠시 멈추는 일이에요. 전쟁이 완전히 끝난 것은 아니에요.', src: ['S51'] },
    ] },
  },
  parts: {
    help: {
      type: 'drive', src: ['S51'], title: '피란길: 아이들을 데리고 남쪽으로 가요', counter: '지난 곳', pickupCounter: '찾은 아이', seconds: 150,
      howto: '눈 내리는 피란길을 따라 남쪽으로 가요. 길에서 헤어진 아이들을 모두 찾아 데려가고, 군용 트럭을 피해요.',
      intro: [
        { who: 'mother', text: '중국군이 내려온단다. 서울을 떠나야 해!' },
        { who: 'mother', text: '사람들 틈에서 아이들 손을 놓쳤구나. 제발 같이 찾아 주렴!' },
      ],
      route: [
        { label: '마을 어귀', talk: [{ who: 'soldier', text: '서둘러요! 남쪽으로 가는 길은 이쪽입니다.' }] },
        { label: '얼어붙은 강', hold: 4, holdLabel: '얼음 길을 건너는 중', holdSay: '얼음이 깨지지 않게 천천히 건너요. 빛나는 곳에서 잠깐 기다려요.',
          talk: [{ who: 'mother', text: '휴, 무사히 강을 건넜구나. 아이들은 어디 있을까?' }] },
        { label: '고갯길', say: '수많은 사람이 짐을 지고 남쪽으로 걸어가요.' },
        { label: '피란민 쉼터', needPickups: true, needSay: '아직 찾지 못한 아이가 있어요! 화살표를 따라가 봐요.',
          talk: [{ who: 'mother', text: '아이들을 모두 찾았구나. 정말 고맙다!' }, { who: 'unSoldier', text: '이 추운 겨울에 많은 사람이 고향을 떠나 피란을 왔어.' }] },
      ],
      pickups: [{ label: '아이', follow: 'kid', small: true, say: '울고 있던 아이를 찾았어요!' }, { label: '아이', follow: 'schoolgirl', small: true, say: '아이를 찾았어요!' }, { label: '아이', follow: 'kid', small: true, say: '마지막 아이까지 찾았어요!' }],
      bump: '트럭이 지나가요! 앞 지점에서 다시 가요.',
      fail: '화살표를 따라 아이들을 찾고, 트럭이 지나간 뒤에 길을 건너요.',
      done: [{ who: 'narr', text: '1951년 1월 4일, 국군과 유엔군은 서울을 다시 빼앗기고 남쪽으로 물러났어요(1·4 후퇴).', src: ['S51'] }],
    },
    // 전쟁의 흐름: 이름표를 차례대로 맞히기 대신 지도 위 이정표를 따라 걸으며 본다(선생님 의견, 근대 2장과 같은 방식)
    flow: {
      type: 'drive', src: ['S51'], title: '땅 위 지도에서 전쟁의 흐름을 따라 걸어요', counter: '지난 이정표', showAll: true,
      howto: '바닥 지도 위에 차례대로 선 이정표를 따라 걸어가요. 이정표에 닿으면 그곳 사람이 무슨 일이 있었는지 들려줘요.',
      intro: [{ who: 'unSoldier', text: '전쟁이 어떻게 흘러갔는지 지도 위 이정표를 따라 걸으며 짚어 보자.' }],
      route: [
        { label: '1 북쪽 국경까지', look: 'rokSoldier', post: true, talk: [{ who: 'soldier', text: '여기 압록강 앞까지 올라갔었지. 그런데 중국군이 내려와서 다시 물러났어.', src: ['S51'] }] },
        { label: '2 중국군이 내려옴', look: 'unSoldier', post: true, talk: [{ who: 'unSoldier', text: '중국군이 북한을 도우려고 군대를 보냈지.', src: ['S51'] }] },
        { label: '3 1·4 후퇴', look: 'woman', post: true, talk: [{ who: 'mother', text: '1951년 1월 4일, 서울을 다시 빼앗기고 피란길에 올랐단다.', src: ['S51'] }] },
        { label: '4 서울을 다시 되찾음', look: 'rokSoldier', post: true, talk: [{ who: 'unSoldier', text: '우리는 다시 서울을 되찾았지만, 38도선 근처에서 싸움이 오래 이어졌어.', src: ['S51'] }] },
        { label: '5 판문점 정전 협정', look: 'unSoldier', post: true, talk: [{ who: 'unSoldier', text: '1953년 7월, 판문점에서 정전 협정을 맺었어.', src: ['S51'] }] },
      ],
      fail: '빛나는 이정표를 차례대로 따라 걸어가요.',
    },
    // 판문점 정전 협정: 차례대로 찾아가기·찾기 대신 역사책을 넘기며 본다(선생님 의견, 근대 4·5장과 같은 방식)
    truce: {
      type: 'book', title: '역사책으로 보는 정전 협정',
      intro: [{ who: 'unSoldier', text: '여기가 판문점이야. 정전 협정을 맺기까지의 일을 역사책으로 넘겨 보자.' }],
      pages: [
        { title: '정전 회담', year: '1951년 7월', pic: 'talks', lines: [{ who: 'narr', text: '1951년 3월 서울을 다시 되찾은 뒤 38도선 근처에서 싸움이 오래 이어졌어요.', src: ['S51', 'S68'] }, { who: 'narr', text: '한편에서는 전쟁을 멈추려고 회담을 했어요.', src: ['S51', 'S68'] }] },
        { title: '정전 협정', year: '1953년 7월', pic: 'armistice', lines: [{ who: 'narr', text: '1953년 7월 판문점에서 정전 협정이 맺어지면서 휴전선이 그어졌어요.', src: ['S51'] }] },
        { title: '정전이란?', pic: 'ceasefire', lines: [{ who: 'narr', text: '정전은 전쟁 중인 나라들이 전투를 잠시 멈추는 일이에요. 전쟁이 완전히 끝난 것은 아니에요.', src: ['S51'] }] },
      ],
    },
  },
  result: [{ who: 'narr', text: '정전 협정으로 전투는 멈추었지만, 남과 북은 휴전선을 사이에 두고 나뉘게 되었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1951, question: '1951년 1월 4일 서울을 다시 빼앗긴 일은?', options: ['1·4 후퇴', '인천 상륙 작전', '을미사변'], answer: 0, explain: '중국군의 공격에 밀려 1951년 1월 4일 서울을 다시 빼앗겼어요.', src: ['S51'] },
    { kind: 'quiz', year: 1953, question: '1953년 7월 맺어져 휴전선이 그어진 협정은?', options: ['강화도 조약', '을사늑약', '정전 협정'], answer: 2, explain: '정전 협정으로 휴전선이 그어졌어요.', src: ['S51'] },
  ],
};
