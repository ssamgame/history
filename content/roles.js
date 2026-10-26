// 장마다 학생이 맡는 역할: 이름, 하는 일, 생김새(look: LOOKS 이름 또는 생김새 묶음, 없으면 장의 player), 키(scale, 어른 1).
// 아이·소년 역할은 작게, 병사·청년은 어른 키로 그린다. 첫 해설 카드와 화면 위 정보에 "이번 장의 나"로 보인다.
import { LOOKS } from './characters.js';

const STERN = { eyes: 'stern', brows: 'stern', mouth: 'flat' };
export const CHILD = 0.8, YOUTH = 0.9;

export const ROLES = {
  // 고려편
  ch1: { name: '고려의 젊은 병사', does: '서희의 진영에서 거란과의 담판을 지켜봐요.', look: 'player', scale: 1 },
  ch2: { name: '흥화진을 지키는 병사', does: '양규 장군과 함께 성벽을 지켜요.', look: 'player', scale: 1 },
  ch3: { name: '강감찬 군의 병사', does: '삼교천에서 둑을 쌓고 거란군을 기다려요.', look: 'player', scale: 1 },
  ch4: { name: '처인성의 젊은 궁수', does: '김윤후와 함께 활을 들고 성을 지켜요.', look: { robe: 0x5d6b3e, hat: 'helmet', gear: 'bow', face: STERN }, scale: 1 },
  ch7: { name: '별무반 갈림길의 병사', does: '모여드는 마을 사람들을 알맞은 부대로 보내요.', look: 'player', scale: 1 },
  ch5: { name: '대장경 작업장의 어린 일꾼', does: '장인들을 도와 경판을 만들고, 삼별초의 배를 함께 저어요.', look: 'kid', scale: CHILD },
  ch6: { name: '삼별초의 젊은 병사', does: '배를 몰아 진도와 제주로 가며 싸워요.', look: 'sambyeolcho', scale: 1 },
  // 조선편
  j1: { name: '요동으로 가는 고려군 병사', does: '위화도 진영에서 장수들의 이야기를 들어요.', look: 'player', scale: 1 },
  j2: { name: '궁궐에서 심부름하는 아이', does: '훈민정음을 만드는 궁궐 안을 오가요.', scale: CHILD },
  j3: { name: '서운관 견습생', does: '시간과 비를 재는 기구를 살펴요.', scale: YOUTH },
  j4: { name: '이순신 함대의 젊은 수군', does: '한산도 앞바다에서 판옥선을 타고 싸워요.', scale: 1 },
  j5: { name: '남한산성을 지키는 병사', does: '눈보라 속에서 성을 지켜요.', scale: 1 },
  j6: { name: '화성을 쌓는 젊은 일꾼', does: '거중기로 돌을 들어 성을 쌓아요.', scale: 1 },
  // 근대편
  k1: { name: '강화도 바닷가 마을의 청년', does: '해안을 살피고 조약을 맺는 모습을 지켜봐요.', scale: 1 },
  k2: { name: '우정총국의 어린 심부름꾼', does: '갑신정변이 일어난 밤을 따라가요.', scale: YOUTH },
  k3: { name: '고부의 젊은 농민', does: '전봉준과 함께 농민군을 모아요.', scale: 1 },
  k4: { name: '독립신문을 돌리는 소년', does: '한성 거리에 신문을 배달해요.', look: { robe: 0x5d7a9a, hat: 'cap', trim: 0xe6dcc3, face: STERN }, scale: CHILD },
  k5: { name: '신식 학교에 다니는 학생', does: '한성 거리의 근대 문물을 살펴보고 전차도 몰아요.', scale: YOUTH },
  k6: { name: '애국 계몽 학교의 학생', does: '의병과 애국 계몽 운동을 돕고 특사를 찾아요.', scale: YOUTH },
  // 일제 강점기편
  i1: { name: '항구 마을의 청년', does: '헌병의 눈을 피해 우리 역사책을 전해요.', scale: 1 },
  i2: { name: '만세 시위에 나선 학생', does: '태극기를 나눠 주고 만세 행진을 이끌어요.', scale: YOUTH },
  i3: { name: '임시 정부의 젊은 연락원', does: '일본 경찰을 피해 비밀 편지를 전해요.', look: { robe: 0x3a3a44, outfit: 'suit', hat: 'short', trim: 0x3a3a44, face: STERN }, scale: 1 },
  i4: { name: '독립군 병사', does: '청산리 골짜기에서 일본군을 기다려요.', scale: 1 },
  i5: { name: '조선어 학회를 돕는 여학생', does: '「우리말 큰사전」 원고를 모아 학회로 가져가요.', scale: YOUTH },
  i6: { name: '한국광복군 대원', does: '충칭에서 나라 안으로 들어갈 훈련을 해요.', scale: 1 },
  // 현대편
  h1: { name: '광복을 맞은 서울의 학생', does: '광복 소식을 온 마을에 알려요.', look: 'student', scale: YOUTH },
  h2: { name: '처음 투표하는 청년', does: '5·10 총선거에서 한 표를 던져요(21세 이상).', look: 'citizen', scale: 1 },
  h3: { name: '국군 병사', does: '낙동강 방어선을 지키고 인천에 상륙해요.', scale: 1 },
  h4: { name: '피란길에 오른 소년', does: '헤어진 아이들을 찾아 남쪽으로 가요.', scale: CHILD },
  h5: { name: '피란민 마을의 아이', does: '우물물을 길어 이웃집에 날라요.', look: { robe: 0x8a7a64, hat: 'short', trim: 0x2b241c, face: STERN }, scale: CHILD },
  h6: { name: '서울에 사는 청년', does: '고속도로를 달리고, 민주주의를 지킨 거리를 걸어요.', scale: 1 },
};

// 그 장의 학생 생김새: 역할에 생김새가 있으면 그것, 없으면 장의 player, 그것도 없으면 기본 병사
export function roleLook(id, chapterPlayer) {
  const r = ROLES[id];
  const look = r && r.look;
  if (typeof look === 'string') return LOOKS[look];
  return look || chapterPlayer || LOOKS.player;
}
