// 편 복습 퀴즈(D-21, 2026-10-28 선생님): 편의 6장을 다 마치면 결과 카드 전에 장마다 한 문제씩, 모두 6문제.
// 장 끝 퀴즈와 겹치지 않게 그 장 대사·해설에 이미 출처가 달린 사실로만 만든다(chapter: 그 문제의 장 id).
export const REVIEW = {
  1: [
    { kind: 'quiz', chapter: 'ch1', question: '서희가 소손녕에게 고려가 거란과 교류하지 못한 까닭으로 든 것은?', options: ['송나라가 길을 막고 있어서', '여진이 길을 막고 있어서', '바다가 너무 멀어서'], answer: 1, explain: '서희는 여진을 몰아내고 그 땅을 되찾으면 거란과 교류할 수 있다고 했어요.', src: ['S17'] },
    { kind: 'quiz', chapter: 'ch2', question: '거란의 2차 침입 때 임금(현종)이 피란한 곳은?', options: ['나주', '강화도', '의주'], answer: 0, explain: '현종은 남쪽 나주까지 피란했어요.', src: ['S14'] },
    { kind: 'quiz', chapter: 'ch3', question: '강감찬이 쌓자고 한, 개경 둘레의 성은?', options: ['처인성', '용장성', '나성'], answer: 2, explain: '강감찬은 개경 둘레에 성(나성)을 쌓자고 했어요.', src: ['S20'] },
    { kind: 'quiz', chapter: 'ch4', question: '몽골이 1231년 고려에 쳐들어올 때 핑계로 삼은 일은?', options: ['몽골 사신 저고여가 죽은 일', '고려가 대장경을 만든 일', '삼별초가 진도로 간 일'], answer: 0, explain: '몽골은 사신 저고여가 죽은 일을 고려 탓으로 돌렸어요. 누가 죽였는지는 밝혀지지 않았어요.', src: ['S22', 'S10'] },
    { kind: 'quiz', chapter: 'ch5', question: '1236년부터 1251년까지 만든 팔만대장경판은 모두 몇 판일까요?', options: ['8,000판', '81,258판', '1,236판'], answer: 1, explain: '16년 동안 만든 경판은 81,258판이에요.', src: ['S7', 'S9'] },
    { kind: 'quiz', chapter: 'ch6', question: '김통정이 제주에서 흙으로 성을 쌓고 맞선 곳은?', options: ['용장성', '남한산성', '항파두리'], answer: 2, explain: '김통정은 제주 항파두리에 흙으로 성을 쌓고 맞섰어요.', src: ['S13'] },
  ],
  2: [
    { kind: 'quiz', chapter: 'j1', question: '이성계가 요동 정벌에 반대하며 든 네 가지 까닭을 무엇이라고 할까요?', options: ['4불가론', '탕평책', '척화'], answer: 0, explain: '이성계가 든 네 가지 까닭을 4불가론이라고 해요.', src: ['S23'] },
    { kind: 'quiz', chapter: 'j3', question: '물시계 자격루는 시간을 어떻게 알렸나요?', options: ['나무 인형이 스스로 종과 북을 쳐서', '사람이 시간마다 북을 쳐서', '그림자의 길이로'], answer: 0, explain: '시간이 되면 나무 인형이 스스로 종과 북을 쳐서 시간을 알렸어요.', src: ['S31', 'S32'] },
    { kind: 'quiz', chapter: 'j2', question: '훈민정음 모음의 바탕이 된 세 글자는 무엇을 본떴나요?', options: ['해, 달, 별', '하늘, 땅, 사람', '산, 강, 바다'], answer: 1, explain: '모음은 하늘(ㆍ), 땅(ㅡ), 사람(ㅣ)을 본뜬 세 글자를 바탕으로 만들었어요.', src: ['S27'] },
    { kind: 'quiz', chapter: 'j4', question: '덮개 위에 칼과 송곳을 꽂고 앞에 용머리를 단 배는?', options: ['판옥선', '나룻배', '거북선'], answer: 2, explain: '거북선은 판옥선 위를 덮개로 덮고 칼과 송곳을 꽂은 배예요.', src: ['S36'] },
    { kind: 'quiz', chapter: 'j5', question: '청과 화의하지 말고 끝까지 싸우자는 생각을 무엇이라고 할까요?', options: ['주화', '척화', '탕평'], answer: 1, explain: '화의에 반대하는 생각을 척화, 화의를 하자는 생각을 주화라고 해요.', src: ['S38'] },
    { kind: 'quiz', chapter: 'j6', question: '정조가 아버지 사도세자의 무덤 가까이에 쌓게 한 성은?', options: ['수원 화성', '남한산성', '한양 도성'], answer: 0, explain: '정조는 사도세자의 무덤을 수원으로 옮기고 그 가까이에 화성을 쌓게 했어요.', src: ['S39'] },
  ],
  3: [
    { kind: 'quiz', chapter: 'k1', question: '흥선 대원군이 고쳐 지은 궁궐은?', options: ['경운궁', '경복궁', '창덕궁'], answer: 1, explain: '흥선 대원군은 경복궁을 고쳐 지었어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'k2', question: '갑신정변이 일어난 날 잔치가 열린, 우리나라 최초로 우편 업무를 맡은 관청은?', options: ['우정총국', '집현전', '환구단'], answer: 0, explain: '우정총국은 우리나라 최초로 우편 업무를 맡은 관청이에요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'k3', question: '동학 농민군이 전라도 고을마다 두어 스스로 개혁을 펼친 곳은?', options: ['우정총국', '성균관', '집강소'], answer: 2, explain: '농민군은 고을마다 집강소를 두어 스스로 개혁을 펼쳤어요.', src: ['S64'] },
    { kind: 'quiz', chapter: 'k4', question: '독립 협회가 자주독립의 의지를 보여 주려고 세운 것은?', options: ['독립문', '탕평비', '환구단'], answer: 0, explain: '독립 협회는 독립문을 세워 자주독립의 의지를 보여 주었어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'k5', question: '전등과 가로등이 생기면서 달라진 생활 모습은?', options: ['전차가 없어졌다', '밤에도 다닐 수 있게 되었다', '신문이 없어졌다'], answer: 1, explain: '전등과 가로등이 생겨서 밤에도 다닐 수 있게 되었어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'k6', question: '고종 황제가 을사늑약이 부당하다는 것을 알리려고 특사를 보낸 곳은?', options: ['하얼빈', '상하이', '헤이그 국제회의'], answer: 2, explain: '고종 황제는 헤이그 국제회의에 특사 세 명을 보냈어요.', src: ['S51'] },
  ],
  4: [
    { kind: 'quiz', chapter: 'i1', question: '일제가 벌여 많은 농민이 땅을 빼앗긴 사업은?', options: ['토지 조사 사업', '산미 증식 계획', '애국 계몽 운동'], answer: 0, explain: '일제가 토지 조사 사업을 벌여서 많은 농민이 땅을 빼앗겼어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'i2', question: '천안에서 만세 시위를 이끌다가 일제에 체포된 사람은?', options: ['김구', '유관순', '홍범도'], answer: 1, explain: '유관순은 천안에서 만세 시위를 이끌다가 일제에 체포되었어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'i3', question: '임시 정부가 "독립하면 돈을 갚겠다"고 약속하며 발행한 증서는?', options: ['독립신문', '태극기', '독립 공채'], answer: 2, explain: '임시 정부는 독립 공채를 발행했어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'i4', question: '청산리 대첩에서 홍범도와 함께 독립군을 이끈 사람은?', options: ['김좌진', '윤봉길', '서재필'], answer: 0, explain: '김좌진과 홍범도가 이끄는 독립군 부대가 청산리에서 큰 승리를 거두었어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'i5', question: '1926년 순종의 장례식에 맞춰 일어난 만세 운동은?', options: ['3·1 운동', '6·10 만세 운동', '광주 학생 항일 운동'], answer: 1, explain: '1926년 순종의 장례식에 맞춰 학생들을 중심으로 6·10 만세 운동이 일어났어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'i6', question: '상하이 훙커우 공원에서 의거를 일으킨 한인 애국단 단원은?', options: ['안중근', '전봉준', '윤봉길'], answer: 2, explain: '윤봉길은 1932년 상하이 훙커우 공원에서 의거를 일으켰어요.', src: ['S51', 'S55'] },
  ],
  5: [
    { kind: 'quiz', chapter: 'h1', question: '광복 뒤 사람들이 되찾게 된 것은?', options: ['우리 성과 이름, 우리말과 우리글', '조선 총독부', '일본식 이름'], answer: 0, explain: '일본식 이름 대신 우리 성과 이름을 되찾고, 우리말과 우리글을 마음껏 쓰게 되었어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'h2', question: '제헌 헌법에 적힌 대한민국의 모습은?', options: ['왕이 다스리는 나라', '민주 공화국', '신탁 통치를 받는 나라'], answer: 1, explain: '제헌 헌법은 "대한민국은 민주 공화국이다"라고 했어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'h3', question: '6·25 전쟁 때 국군과 유엔군이 마지막 방어선으로 삼아 지켜 낸 곳은?', options: ['압록강', '한강', '낙동강'], answer: 2, explain: '국군과 유엔군은 낙동강을 마지막 방어선으로 삼아 끝까지 지켜 냈어요.', src: ['S57'] },
    { kind: 'quiz', chapter: 'h4', question: '1953년 7월 정전 협정을 맺은 곳은?', options: ['판문점', '부산', '인천'], answer: 0, explain: '1953년 7월 판문점에서 정전 협정이 맺어졌어요.', src: ['S51'] },
    { kind: 'quiz', chapter: 'h5', question: '전쟁으로 헤어진 가족을 찾으려고 1983년 138일 동안 이어진 것은?', options: ['올림픽', '텔레비전 생방송', '총선거'], answer: 1, explain: '1983년 텔레비전 생방송이 138일 동안 이어졌고, 1만여 명이 다시 만났어요.', src: ['S62'] },
    { kind: 'quiz', chapter: 'h6', question: '1970년 7월 서울과 부산을 이어 개통된 길은?', options: ['전차 길', '경인선 철도', '경부고속도로'], answer: 2, explain: '경부고속도로는 서울과 부산을 잇는 고속도로로 1970년 7월에 개통되었어요.', src: ['S60'] },
  ],
};
