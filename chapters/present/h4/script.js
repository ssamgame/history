// 현대편 4장 「1·4 후퇴와 정전 협정」(D-51). 사실은 비상 5-2 교과서 142쪽(S51), 정전 회담(S68), 군사 분계선·비무장 지대(S72).
// 탐험: 1951년 1월 초 눈 내리는 서울 가까운 마을. 「피란길」 문으로 들어와 국군 병사·유엔군 병사·이웃 할아버지 이야기를 아무 차례로 듣고(모두 들어야 피란민 어머니),
// 어머니에게 가면 학생의 결심 → 국군과 유엔군이 남쪽으로 물러나는 행렬.
// 놀이: 피란 보따리 꾸리기(끝에 얼어붙은 강을 건너는 피란 행렬) → 유엔군 병사에게 말을 걸면 휴전선 긋기와 정전 협정.
// 예전 안내판(판문점·정전)과 아이 찾기·지도 걷기·역사책의 출처 있는 문장은 사람 대사·장면·놀이로 옮겼다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    me: { name: '나', mark: '我', color: '#22262e' },
    soldier: { name: '국군 병사', mark: '軍', color: '#5a6448', look: 'rokSoldier' },
    mother: { name: '피란민 어머니', mark: '母', color: '#b8768a', look: 'woman' },
    unSoldier: { name: '유엔군 병사', mark: 'UN', color: '#5b92e5', look: 'unSoldier' },
    grandpa: { name: '이웃 할아버지', mark: '老', color: '#6b4a32', look: 'peasant' },
    delegate: { name: '회담 대표', mark: '代', color: '#2b2f36', look: 'gentleman' },
  },
  intro: [
    { who: 'narr', text: '국군과 유엔군이 북쪽 국경으로 나아가자, 중국군이 북한을 도우려고 군대를 보냈어요.', src: ['S51'] },
    { who: 'narr', text: '중국군의 공격을 막아 내지 못한 국군과 유엔군은 남쪽으로 물러났고, 1951년 1월 4일 서울을 다시 빼앗겼어요(1·4 후퇴).', src: ['S51'] },
  ],
  start: [
    { who: 'guide', text: '1951년 1월 초, 눈 내리는 서울 가까운 마을이야. 사람들이 짐 보따리를 꾸리고 있어.' },
    { who: 'guide', text: '추운 겨울에 왜 집을 떠나려는 걸까? 느낌표가 뜬 사람에게 아무 차례로 다가가 물어보자.' },
  ],
  // D-30 C-01: 진행 차례대로, 퀴즈 목표는 빛나는 문이 대신
  goals: ['마을 사람들의 이야기를 모두 들어 보자', '피란민 어머니를 찾아가자', '남쪽으로 물러나는 행렬을 지켜보자', '피란 보따리를 꾸려 피란길에 오르자', '휴전선을 긋고 정전 협정을 지켜보자'],
  more: { who: 'guide', text: '다른 사람 이야기도 들어 보자. 모두 듣고 나면 피란민 어머니를 찾아가자.' },
  minigameTitle: '1·4 후퇴와 정전 협정',
  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '압록강 가까이까지 갔는데, 중국군이 내려와서 다시 물러나야 했어.', src: ['S51'] },
        { who: 'soldier', expr: 'tension', text: '곧 이 마을도 위험해져. 서둘러 남쪽으로 떠나야 해.' },
      ],
      bridge: { who: 'soldier', text: '마을 사람들 이야기를 들었구나. 내 이야기도 들어 봐.' },
      later: [{ who: 'soldier', text: '피란민들을 안전하게 도와줘!' }],
    },
    unSoldier: {
      first: [
        { who: 'unSoldier', text: '중국군이 북한을 도우려고 군대를 보냈어. 그 공격을 막아 내지 못했지.', src: ['S51'] },
        { who: 'unSoldier', text: '우리는 남쪽으로 물러나지만, 국군과 함께 꼭 서울을 다시 되찾을 거야.' },
      ],
      bridge: { who: 'unSoldier', text: '여러 사람을 만났구나. 나도 이야기해 줄게.' },
      later: [{ who: 'unSoldier', text: '언젠가 이 싸움이 멈추는 날이 올 거야.' }],
    },
    grandpa: {
      first: [
        { who: 'grandpa', expr: 'worry', text: '지난여름에도 피란을 갔다가 겨우 돌아왔는데, 또 떠나야 한다는구나.' },
        { who: 'grandpa', text: '이 추운 겨울에 어린아이들까지 데리고 집을 떠나야 하다니.', src: ['S51'] },
      ],
      bridge: { who: 'grandpa', text: '군인 양반들 이야기를 들었구나. 이 늙은이 이야기도 들어 보렴.' },
      later: [{ who: 'grandpa', text: '부디 모두 무사히 돌아와야 할 텐데.' }],
    },
    mother: {
      wait: [{ who: 'mother', text: '마을 사람들 이야기를 먼저 모두 듣고 오렴. 무슨 일이 벌어지는지 알아야 한단다.' }],
      first: [
        { who: 'mother', text: '중국군이 내려온단다. 서울을 떠나야 해!' },
        { who: 'mother', text: '먼 길을 걸어가야 하니 꼭 필요한 것만 싸야 해. 짐 꾸리는 것 좀 도와주렴.' },
        { who: 'me', text: '네! 아이들과 함께 무사히 떠날 수 있게 도울게요!' },
      ],
      later: [{ who: 'mother', expr: 'joy', text: '고맙다, 정말 고마워.' }],
    },
  },
  // 탐험 끝 장면: 눈 내리는 마을 길로 국군과 유엔군이 남쪽으로 물러난다
  retreat: {
    lines: [
      { who: 'narr', text: '중국군의 공격을 막아 내지 못한 국군과 유엔군은 남쪽으로 물러났어요.', src: ['S51'] },
      { who: 'soldier', expr: 'tension', text: '서둘러요! 남쪽으로 가는 길은 이쪽입니다!' },
      { who: 'mother', text: '우리도 어서 짐을 싸야겠구나.' },
    ],
  },
  parts: {
    // 피란 보따리 꾸리기(D-51, 새 놀이): 마당에 꺼내 놓은 살림 가운데 먼 길에 꼭 필요한 것만 고른다. 끝에 얼어붙은 강을 건넌다
    pack: {
      type: 'act', src: ['S51'], title: '피란 보따리 꾸리기', counter: '살펴본 살림',
      howto: '마당의 빛나는 살림으로 가서 대화 버튼을 눌러요. 먼 길을 걸어갈 때 꼭 필요한 것만 보따리에 넣어요.',
      intro: [ // 물러나는 행렬 장면 뒤 바로(어머니)
        { who: 'mother', text: '살림을 마당에 다 꺼내 놓았단다. 무엇을 가져가고 무엇을 두고 갈까?' },
      ],
      items: [
        { id: 'rice', label: '쌀자루', take: true, why: '가는 길에 밥을 지어 먹어야 해요.' },
        { id: 'quilt', label: '솜이불', take: true, why: '추운 겨울밤을 견디려면 꼭 있어야 해요.' },
        { id: 'chest', label: '커다란 장롱', take: false, why: '너무 크고 무거워서 지고 걸어갈 수 없어요.' },
        { id: 'clothes', label: '두꺼운 겨울옷', take: true, why: '눈길을 오래 걸으려면 따뜻하게 입어야 해요.' },
        { id: 'jar', label: '커다란 장독', take: false, why: '무겁고 깨지기 쉬워서 들고 갈 수 없어요.' },
        { id: 'pot', label: '작은 솥', take: true, why: '밥을 지으려면 솥이 있어야 해요.' },
      ],
      wrong: { who: 'mother', text: '다시 생각해 보렴. 먼 눈길을 걸어가야 한단다.' },
      tie: [{ who: 'mother', text: '보따리를 다 쌌구나. 나는 머리에 이고, 너는 등에 지고 가자.' }],
      crossing: [
        { who: 'narr', text: '1951년 1월 4일, 국군과 유엔군은 서울을 다시 빼앗기고 남쪽으로 물러났어요(1·4 후퇴).', src: ['S51'] },
        { who: 'mother', text: '추운 겨울에 아이들을 데리고 집을 떠나왔단다. 얼어붙은 강을 건너 남쪽으로 가자.', src: ['S51'] },
      ],
      fail: '빛나는 살림으로 가서 대화 버튼을 눌러요.',
    },
    // 휴전선 긋기와 정전 협정(D-51, 새 놀이): 양쪽 군대가 맞선 곳을 따라 말뚝을 박아 선을 긋고, 판문점 천막에서 정전 협정
    line: {
      type: 'act', src: ['S51', 'S72'], title: '휴전선 긋기와 정전 협정', counter: '박은 말뚝',
      howto: '양쪽 군대가 맞선 곳의 빛나는 자리로 가서 대화 버튼을 눌러요. 말뚝을 박으면 줄이 이어져 선이 그어져요.',
      intro: [ // 유엔군 병사에게 말을 걸면(C-05)
        { who: 'unSoldier', text: '1951년 3월 서울을 다시 되찾은 뒤 38도선 근처에서 싸움이 오래 이어졌어.', src: ['S51', 'S68'] },
        { who: 'unSoldier', text: '한편에서는 전쟁을 멈추려고 회담을 했어. 판문점 천막에서도 회담이 열렸지.', src: ['S51', 'S68'] },
      ],
      start: [{ who: 'unSoldier', text: '싸움을 멈출 때, 양쪽 군대가 맞선 곳을 따라 선을 긋기로 했어. 빛나는 자리에 말뚝을 박아 줘.', src: ['S72'] }],
      stakes: [{ label: '서쪽' }, { label: '가운데' }, { label: '동쪽' }],
      back: [
        { who: 'narr', text: '이 선을 군사 분계선이라고 해요. 양쪽 군대는 이 선에서 남북으로 2km씩 물러났고, 그 사이는 비무장 지대가 되었어요.', src: ['S72'] },
      ],
      sign: [
        { who: 'narr', text: '1953년 7월 판문점에서 정전 협정이 맺어지면서 휴전선이 그어졌어요.', src: ['S51'] },
        { who: 'delegate', text: '오늘부터 전투를 멈춥니다.' },
        { who: 'narr', text: '정전은 전쟁 중인 나라들이 전투를 잠시 멈추는 일이에요. 전쟁이 완전히 끝난 것은 아니에요.', src: ['S51'] },
      ],
      fail: '빛나는 자리로 가서 대화 버튼을 눌러요.',
    },
  },
  result: [{ who: 'narr', text: '정전 협정으로 전투는 멈추었지만, 남과 북은 휴전선을 사이에 두고 나뉘게 되었어요.', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', year: 1951, question: '1951년 1월 4일 서울을 다시 빼앗긴 일은?', options: ['1·4 후퇴', '인천 상륙 작전', '을미사변'], answer: 0, explain: '중국군의 공격에 밀려 1951년 1월 4일 서울을 다시 빼앗겼어요.', src: ['S51'] },
    { kind: 'quiz', year: 1953, question: '1953년 7월 맺어져 휴전선이 그어진 협정은?', options: ['강화도 조약', '을사늑약', '정전 협정'], answer: 2, explain: '정전 협정으로 휴전선이 그어졌어요.', src: ['S51'] },
  ],
};
