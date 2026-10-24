// 현대편 3장 「6·25 전쟁」. 교과서 사진에 빠진 쪽(140~141쪽)은 우리역사넷(S57)으로 채운다.
export default {
  speakers: {
    guide: { name: '안내', mark: '◎', color: '#2f6b5e' },
    soldier: { name: '국군 병사', mark: '軍', color: '#5a6448', look: 'rokSoldier' },
    unSoldier: { name: '유엔군 병사', mark: 'UN', color: '#5b92e5', look: 'unSoldier' },
    officer: { name: '국군 지휘관', mark: '將', color: '#5a6448', look: 'rokSoldier' },
  },
  intro: [
    { who: 'narr', text: '1950년 6월 25일 새벽, 북한군이 38도선 전 지역에서 남쪽으로 쳐내려왔어요(6·25 전쟁).', src: ['S57'] },
    { who: 'narr', text: '국군은 3일 만에 서울을 빼앗기고 낙동강까지 물러났어요.', src: ['S57'] },
  ],
  start: [
    { who: 'guide', text: '1950년 여름, 낙동강 가의 국군 진영이야. 강둑에는 모래주머니가 쌓여 있고 모두 긴장한 얼굴이야.' },
    { who: 'guide', text: '왜 여기까지 밀려왔을까? 모래주머니 옆의 국군 병사에게 먼저 물어보자.' },
  ],
  goals: ['국군 병사에게 말을 걸어 보자', '유엔군 병사를 만나자', '국군 지휘관을 찾아가자', '전쟁의 흐름을 따라가자', '배운 내용을 확인해 보자'],
  minigameTitle: '6·25 전쟁',
  npc: {
    soldier: {
      first: [
        { who: 'soldier', text: '병력과 장비가 모자라 여기 낙동강까지 밀려왔어.', src: ['S57'] },
        { who: 'soldier', text: '낙동강은 우리가 꼭 지켜야 할 마지막 방어선이야.', src: ['S57'] },
      ],
      later: [{ who: 'soldier', text: '우리만 싸우는 게 아니야. 저기 유엔군 병사도 먼 나라에서 왔대. 이야기를 들어 봐.' }],
    },
    unSoldier: {
      tooEarly: [{ who: 'unSoldier', text: '여기 상황은 국군 병사가 더 잘 알아. 먼저 이야기해 봐.' }],
      first: [
        { who: 'unSoldier', text: '국제 연합은 북한의 남침을 침략으로 보았어. 미국을 비롯한 16개 나라가 유엔군을 보냈지.', src: ['S57'] },
      ],
      later: [{ who: 'unSoldier', text: '지휘관님이 지도를 펴 놓고 큰 작전을 짜고 계셔. 가 봐.' }],
    },
    officer: {
      tooEarly: [{ who: 'officer', text: '작전 이야기 전에, 유엔군 병사에게 어떤 나라들이 왔는지 들어 보게.' }],
      first: [
        { who: 'officer', text: '바다로 돌아가 인천에 상륙하는 작전을 펼칠 것이다.', src: ['S57'] },
        { who: 'officer', text: '그러면 서울을 되찾을 수 있을 것이다.', src: ['S57'] },
      ],
    },
    signUN: { always: [
      { who: 'narr', text: '6·25 전쟁에는 미국, 영국, 튀르키예, 에티오피아, 콜롬비아 등 16개 나라가 유엔군으로 참전했어요.', src: ['S57'] },
    ] },
    signRiver: { always: [
      { who: 'narr', text: '국군과 유엔군은 낙동강을 마지막 방어선으로 삼아 끝까지 지켜 냈어요.', src: ['S57'] },
    ] },
  },
  parts: {
    river: {
      type: 'ambush', title: '낙동강 방어선을 지켜요', label: '막아라!', counter: '막아 낸 공격',
      howto: '강을 건너오는 북한군이 빛나는 강가에 들어오면 그 위의 「막아라!」를 눌러요. 공격은 세 차례 이어져요.',
      intro: [
        { who: 'officer', text: '북한군이 낙동강을 건너오려 한다! 이곳이 우리의 마지막 방어선이다.' },
        { who: 'soldier', text: '모래주머니 뒤에서 강을 지켜보자. 빛나는 강가에 들어오면 막는 거야!' },
      ],
      waves: [
        { enemies: 4, need: 3, interval: 1.8, speed: 2.4 },
        { enemies: 5, need: 4, interval: 1.5, speed: 2.8, talk: [{ who: 'unSoldier', text: '유엔군도 함께 지키고 있어! 저쪽에서 다시 몰려온다!' }] },
        { enemies: 6, need: 4, interval: 1.3, speed: 3.1, talk: [{ who: 'officer', text: '마지막 고비다! 끝까지 버텨라!' }] },
      ],
      fail: '빛나는 강가에 들어왔을 때 눌러야 해요. 다시 지켜 봐요.',
      done: [{ who: 'narr', text: '국군과 유엔군은 낙동강을 마지막 방어선으로 삼아 끝까지 지켜 냈어요.', src: ['S57'] }],
    },
    landing: {
      type: 'drive', title: '인천 상륙 작전: 물때를 맞춰 인천에 상륙해요', vehicle: 'boat', counter: '지난 곳', pickupCounter: '구한 대원', seconds: 150,
      howto: '화살표를 따라 상륙정을 몰아요. 월미도 앞에서는 밀물이 찰 때까지 빛나는 곳에서 기다리고, 바다에 빠진 대원을 모두 구해 인천에 상륙해요.',
      intro: [
        { who: 'officer', text: '이제 바다로 돌아가 인천에 상륙한다. 인천 앞바다는 밀물과 썰물의 차이가 아주 크다.' },
        { who: 'unSoldier', text: '물이 찰 때를 기다렸다가 들어가야 해. 기뢰와 적의 배를 조심해!' },
      ],
      route: [
        { label: '출발', talk: [{ who: 'soldier', text: '상륙정 출발! 군함들이 뒤를 받쳐 주고 있어.' }] },
        { label: '기뢰 지대', say: '바다에 떠 있는 검은 기뢰를 피해서 가요.' },
        { label: '월미도 앞', hold: 5, holdLabel: '밀물을 기다리는 중', holdSay: '밀물이 차오를 때까지 이 자리에서 기다려요!',
          talk: [{ who: 'officer', text: '물이 찼다! 먼저 인천 앞바다의 월미도를 차지했다.' }, { who: 'officer', text: '바다에 빠진 대원들을 구해서 인천 항구로 들어가자!' }] },
        { label: '인천 상륙!', needPickups: true, needSay: '아직 바다에 남은 대원이 있어요! 먼저 구해요.',
          talk: [{ who: 'soldier', text: '인천에 상륙했다! 이제 서울로 가자!' }] },
      ],
      pickups: [{ label: '대원', say: '바다에 빠진 대원을 구했어요!' }, { label: '대원', say: '대원을 구했어요!' }, { label: '대원', say: '마지막 대원까지 구했어요!' }],
      bump: '부딪혔어요! 앞 지점에서 다시 가요.',
      fail: '시간 안에 인천에 닿지 못했어요. 기뢰와 적의 배를 피해 다시 가 봐요.',
      done: [{ who: 'narr', text: '1950년 9월 15일 인천 상륙 작전이 성공했고, 9월 28일 서울을 되찾았어요.', src: ['S57'] }],
    },
    // 전쟁의 흐름: 이름표를 차례대로 맞히기 대신 지도 위 이정표를 따라 걸으며 본다(선생님 의견, 근대 2장과 같은 방식)
    flow: {
      type: 'drive', src: ['S57'], title: '땅 위 지도에서 전쟁의 흐름을 따라 걸어요', counter: '지난 이정표', showAll: true,
      howto: '바닥 지도 위에 차례대로 선 이정표를 따라 걸어가요. 이정표에 닿으면 그곳 사람이 무슨 일이 있었는지 들려줘요.',
      intro: [{ who: 'guide', text: '지도 위를 걸으며 전쟁이 어떻게 흘러갔는지 되짚어 보자. 그곳에 있던 사람들이 이야기를 들려줄 거야.' }],
      route: [
        { label: '1 북한군의 남침', look: 'rokSoldier', post: true, talk: [{ who: 'soldier', text: '1950년 6월 25일 새벽, 북한군이 38도선을 넘어 쳐내려왔어.', src: ['S57'] }] },
        { label: '2 서울을 빼앗김', look: 'citizen', post: true, talk: [{ who: 'soldier', text: '전쟁 3일 만에 서울을 빼앗기고 말았어.', src: ['S57'] }] },
        { label: '3 낙동강 방어선', look: 'rokSoldier', post: true, talk: [{ who: 'officer', text: '낙동강을 마지막 방어선으로 삼아 끝까지 지켜 냈다.', src: ['S57'] }] },
        { label: '4 인천 상륙 작전', look: 'unSoldier', post: true, talk: [{ who: 'unSoldier', text: '1950년 9월 15일, 인천에 상륙했지!', src: ['S57'] }] },
        { label: '5 서울을 되찾음', look: 'citizen', post: true, talk: [{ who: 'officer', text: '9월 28일, 드디어 서울을 되찾았다!', src: ['S57'] }] },
      ],
      fail: '빛나는 이정표를 차례대로 따라 걸어가요.',
    },
  },
  result: [{ who: 'narr', text: '국군과 유엔군은 서울을 되찾은 뒤 북쪽으로 나아갔어요.', src: ['S51', 'S57'] }],
  quizzes: [
    { kind: 'quiz', year: 1950, question: '6·25 전쟁이 일어난 날은?', options: ['1945년 8월 15일', '1950년 6월 25일', '1953년 7월 27일'], answer: 1, explain: '1950년 6월 25일 새벽 북한군이 남침했어요.', src: ['S57'] },
    { kind: 'quiz', year: 1950, question: '1950년 9월 15일 국군과 유엔군이 펼친 작전은?', options: ['인천 상륙 작전', '서울 진공 작전', '학익진'], answer: 0, explain: '인천 상륙 작전으로 9월 28일 서울을 되찾았어요.', src: ['S57'] },
  ],
};
