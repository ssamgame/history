// 등장인물 생김새: 3D 인물과 대화창 얼굴 그림이 함께 쓴다.
// face: eyes(round·kind·stern), brows(normal·stern·worried), mouth(smile·flat·open), beard(null·mustache·thin·thick·walrus·goatee·full),
//       beardColor, browColor, glasses(round), shape(long·round), age(old), blush
// outfit: suit(양복: 흰 셔츠와 넥타이)·armor(찰갑, armor 색)·danryeong(단령)·jangsam(장삼과 가사)·short(저고리와 바지, pants 색)·deel(거란·몽골 옷)·chima(저고리와 치마)·uniform(제복),
//   hairColor: 흰머리·희끗한 머리. hat buzz(아주 짧게 깎은 머리)·swept(뒤로 넘긴 머리)·kunfa(거란 곤발)·mongol(몽골 모자)·daenggi(땋은 머리와 댕기)
// skin: light·base·tan(그을린 얼굴)·old. face에 더: age('young'·'old'), sex('f'), stubble(수염 자국), brow('thick')
// role(D-55): general·soldier·farmer·merchant·scholar·official·monk·elder·child·woman·foreign(없으면 옷·모자로 정함, core/facebuild.js roleOf)
// face.build(D-55): 얼굴 짜임을 직접 정한다 { shape, eye, brow, nose, mouth, mood, scar, lines, cheekbone, mole, stubble } — 유형 이름은 core/facebuild.js.
//   정하지 않은 값은 역할에 어울리는 유형에서 고른다. eyes·brows·mouth(stern·flat)는 근엄한 기본 표정 표시로 그대로 둔다.
// 모든 인물은 근엄한 표정(가는 눈, 힘준 눈썹, 다문 입)으로 그린다.
export const LOOKS = {
  player: { named: true, robe: 0x2f6b5e, outfit: 'armor', armor: 0x5f5a52, hat: 'helmet', gear: 'spear', skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', age: 'young' } },
  soldier: { robe: 0x7a3b2e, outfit: 'armor', armor: 0x6e5a46, hat: 'helmet', gear: 'spear', skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', stubble: true } },
  archer: { robe: 0x5d6b3e, outfit: 'armor', armor: 0x7a6a50, hat: 'helmet', gear: 'bow', skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', stubble: true } },
  officer: { robe: 0x6a4c6e, outfit: 'danryeong', hat: 'official', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache', beardColor: '#8d877c' } },
  seohui: { named: true, robe: 0x2b4c7e, outfit: 'danryeong', hat: 'official', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee', brow: 'thick' , build: { shape: 'heart', eye: 'narrow', brow: 'angled', nose: 'long', mouth: 'thin', mood: 'calm' } } },
  sonn: { named: true, robe: 0x5b4a36, outfit: 'deel', hat: 'fur', gear: 'sword', trim: 0x9a7a52, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache', brow: 'thick' , build: { shape: 'wide', eye: 'upturned', brow: 'bushy', nose: 'broad', mouth: 'down', mood: 'fierce', cheekbone: true } } },
  yanggyu: { named: true, robe: 0x7a2a1e, outfit: 'armor', armor: 0x7e7a70, hat: 'general', gear: 'sword', trim: 0xd9a441, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'full', brow: 'thick' , build: { shape: 'square', eye: 'deep', brow: 'bushy', nose: 'high', mouth: 'firm', mood: 'fierce', scar: [1, 0.18], cheekbone: true } } },
  // 강감찬은 귀주 대첩 때 일흔이 넘은 나이여서 흰 수염으로 그린다
  gangamchan: { named: true, robe: 0x8a2f24, outfit: 'armor', armor: 0x9a8a62, hat: 'general', gear: 'sword', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'full', beardColor: '#e8e4dc', age: 'old', browColor: '#bdb7ad' , build: { shape: 'long', eye: 'droopy', brow: 'falling', nose: 'long', mouth: 'down', mood: 'gentle', lines: true } } },
  villager: { robe: 0xd8cfbf, outfit: 'short', pants: 0xcfc4ae, hat: 'topknot', skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat' , build: { shape: 'round', eye: 'small', brow: 'short', nose: 'broad', mouth: 'wide', mood: 'calm', lines: true } } },
  khitan: { robe: 0x6e5a44, outfit: 'deel', hat: 'kunfa', gear: 'spear', trim: 0x8a6a4a, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', stubble: true } },
  khitanBright: { robe: 0xa8834f, outfit: 'deel', hat: 'kunfa', trim: 0xb8452f, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  // 4~6장
  kimyunhu: { named: true, robe: 0x7d7a74, outfit: 'jangsam', hat: 'bald', trim: 0x9a6b3c, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', brow: 'thick' } },
  monk: { robe: 0x8a8780, outfit: 'jangsam', hat: 'bald', face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  minister: { robe: 0x55608a, outfit: 'danryeong', hat: 'official', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee' } },
  artisan: { role: 'merchant', robe: 0xc8b89a, outfit: 'short', pants: 0xb8a888, hat: 'topknot', trim: 0x6b4a32, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' , build: { shape: 'wide', eye: 'narrow', brow: 'arched', nose: 'button', mouth: 'full', mood: 'gentle' } } },
  baejungson: { named: true, robe: 0x2a3a5a, outfit: 'armor', armor: 0x5a5a5e, hat: 'general', gear: 'sword', trim: 0xb8452f, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache', brow: 'thick' } },
  kimtongjeong: { named: true, robe: 0x4a3a2a, outfit: 'armor', armor: 0x7a6a4a, hat: 'general', gear: 'sword', trim: 0xd9a441, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'full' } },
  sambyeolcho: { robe: 0x3a2f2a, outfit: 'armor', armor: 0x4e4a44, hat: 'helmet', gear: 'spear', trim: 0xb8452f, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', stubble: true } },
  mongol: { robe: 0x3e4a5c, outfit: 'deel', hat: 'mongol', trim: 0x8a6a42, skin: 'tan', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'thin' } },
  // 조선편. 임금·세자는 익선관, 양반·학자는 갓, 조선 군사는 전립
  yiseonggye: { outfit: 'armor', armor: 0x7a6a50, named: true, robe: 0x7a2a1e, hat: 'general', gear: 'bow', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'full' } },
  joseonSoldier: { outfit: 'jeonbok', sleeve: 0xb8452f, pants: 0xd8cfbf, robe: 0x3c4c6a, hat: 'jeollip', gear: 'spear', trim: 0xb8452f, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  sejong: { outfit: 'danryeong', royal: true, named: true, robe: 0xa3262a, hat: 'ikseon', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'full', shape: 'round' } },
  crownPrince: { outfit: 'danryeong', royal: true, named: true, robe: 0x2c4a7a, hat: 'ikseon', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  scholar: { outfit: 'dopo', cord: 0x8a2f24, robe: 0xc9d4d8, hat: 'gat', trim: 0x3a4a5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee' } },
  jangyeongsil: { outfit: 'dopo', cord: 0x3a3a3a, named: true, robe: 0x6a5a4a, hat: 'gat', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  commoner: { outfit: 'short', pants: 0xe0d6c0, robe: 0xd8cfbf, hat: 'topknot', trim: 0x6b4a32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache', beardColor: '#5a5048' } },
  kid: { robe: 0xe6dcc3, outfit: 'short', pants: 0xe0d6c0, hat: 'daenggi', trim: 0x7a4e32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', age: 'young' , build: { shape: 'round', eye: 'round', brow: 'thin', nose: 'button', mouth: 'small', mood: 'calm' } } },
  yisunsin: { outfit: 'armor', armor: 0x8a2f24, named: true, robe: 0x7a2a1e, hat: 'general', gear: 'sword', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'full', shape: 'long' } },
  navy: { outfit: 'jeonbok', sleeve: 0xb8452f, pants: 0xd8cfbf, robe: 0x2f4a5e, hat: 'jeollip', gear: 'spear', trim: 0xb8452f, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  injo: { outfit: 'danryeong', royal: true, named: true, robe: 0xa3262a, hat: 'ikseon', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  kimsangheon: { outfit: 'danryeong', badge: 0x1e2440, named: true, robe: 0x55608a, hat: 'official', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'full', beardColor: '#cfc9bd', age: 'old' } },
  choemyeonggil: { outfit: 'danryeong', badge: 0x1e2440, named: true, robe: 0x5d6b52, hat: 'official', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee' } },
  jobyeonggap: { outfit: 'danryeong', badge: 0x1e2440, named: true, robe: 0x6a4a6a, hat: 'official', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } }, // 고부 군수 조병갑
  qingSoldier: { outfit: 'deel', robe: 0x5a4632, hat: 'qing', gear: 'spear', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  jeongjo: { outfit: 'danryeong', royal: true, named: true, robe: 0xa3262a, hat: 'ikseon', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  jeongyakyong: { outfit: 'dopo', cord: 0x2f4a6b, named: true, robe: 0xc9d4d8, hat: 'gat', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee' } },
  joseonOfficial: { outfit: 'danryeong', badge: 0x1e2440, robe: 0x55608a, hat: 'official', face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  worker: { outfit: 'short', pants: 0xd8cfbf, robe: 0xc8b89a, hat: 'topknot', trim: 0x6b4a32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  // 근대·일제 강점기·현대편
  daewongun: { outfit: 'danryeong', badge: 0x1e2440, named: true, robe: 0x4f5f86, hat: 'official', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee', beardColor: '#cfc9bd', age: 'old', shape: 'long', browColor: '#8a847a' } },
  gojong: { outfit: 'danryeong', royal: true, named: true, robe: 0xc99a2e, hat: 'ikseon', trim: 0xa8392b, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee', shape: 'long' } },
  // 왕이던 때(1897년 황제가 되기 전)의 고종: 붉은 곤룡포 (역사책 아관 파천 쪽)
  gojongKing: { outfit: 'danryeong', royal: true, named: true, robe: 0xa3262a, hat: 'ikseon', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee', shape: 'long' } },
  kimokgyun: { outfit: 'dopo', cord: 0x2f4a6b, named: true, robe: 0xc9d4d8, hat: 'gat', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'thin', shape: 'round' } },
  jeonbongjun: { outfit: 'short', pants: 0xe6dcc3, named: true, robe: 0xe6dcc3, hat: 'topknot', trim: 0x8a2f24, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'goatee', shape: 'long' } },
  peasant: { outfit: 'short', pants: 0xe0d6c0, robe: 0xddd2bb, hat: 'topknot', trim: 0x7a4e32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  seojaepil: { named: true, robe: 0x2b2f36, outfit: 'suit', hat: 'short', trim: 0x2b2f36, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'thin' } },
  gentleman: { robe: 0x3a3530, outfit: 'suit', hat: 'fedora', trim: 0x3a3530, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  student: { outfit: 'uniform', role: 'youth', robe: 0x22262e, hat: 'cap', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', age: 'young' } },
  schoolgirl: { eras: { present: { outfit: 'dress', robe: 0xf2efe8, pants: 0x22304a } }, outfit: 'chima', pants: 0x22262e, robe: 0xe9e4da, hat: 'braid', trim: 0x2c3a5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  woman: { eras: { presentLate: { outfit: 'dress', robe: 0xe8dcc8, pants: 0x5a6a8a } }, outfit: 'chima', pants: 0x2f4a5e, robe: 0xb8768a, hat: 'bun', trim: 0x2f4a5e, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  uibyeong: { outfit: 'short', pants: 0xd8d0bc, robe: 0xd8d0bc, hat: 'topknot', gear: 'rifle', trim: 0x6b4a32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  // 안중근: 짧은 머리와 짙은 콧수염
  ahnjunggeun: { outfit: 'suit', named: true, robe: 0x2b2f36, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'thick' } },
  ahnchangho: { named: true, robe: 0x3a3a44, outfit: 'suit', hat: 'short', trim: 0x3a3a44, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache', shape: 'round' } },
  yugwansun: { outfit: 'chima', pants: 0x22262e, named: true, robe: 0xf2efe6, hat: 'braid', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', shape: 'round' } },
  // 김구: 널리 알려진 사진처럼 둥근 얼굴, 검은 동그란 안경, 아주 짧게 깎은 희끗한 머리, 짙은 두루마기
  kimgu: { outfit: 'dopo', cord: 0x2b2826, named: true, robe: 0x3a3836, hat: 'buzz', hairColor: '#8a8680', trim: 0x2b2826, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', glasses: 'round', shape: 'round', age: 'old', browColor: '#5a5650' } },
  // 이승만: 정부 수립 무렵(70대) 사진처럼 갸름한 얼굴, 뒤로 넘긴 흰머리, 양복에 넥타이
  syngmanrhee: { named: true, robe: 0x2b2f36, outfit: 'suit', hat: 'swept', hairColor: '#e4e0d8', trim: 0x2b2f36, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', shape: 'long', age: 'old', browColor: '#b8b2a8' } },
  // 홍범도: 나이 든 장군, 크게 처진 콧수염
  hongbeomdo: { outfit: 'uniform', pants: 0x3e4634, named: true, robe: 0x4e5840, hat: 'cap', gear: 'rifle', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'walrus', age: 'old', beardColor: '#3a3632' } },
  kimjwajin: { outfit: 'uniform', pants: 0x3e4634, named: true, robe: 0x4e5840, hat: 'cap', gear: 'sword', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'thick', shape: 'long' } },
  independenceArmy: { outfit: 'uniform', pants: 0x4a5040, robe: 0x5a6448, hat: 'cap', gear: 'rifle', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  gwangbokgun: { outfit: 'uniform', pants: 0x5a5a3e, robe: 0x6b6a4a, hat: 'cap', gear: 'rifle', trim: 0xa8392b, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  scholarModern: { robe: 0x4a4f5a, outfit: 'suit', hat: 'short', trim: 0x4a4f5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache', glasses: 'round' } },
  gendarme: { outfit: 'uniform', pants: 0x55603f, robe: 0x55603f, hat: 'cap', trim: 0xb8452f, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  // 1930년대 학교의 제복 입은 교사(칼은 차지 않음)
  teacherUniform: { outfit: 'uniform', robe: 0x2f3540, hat: 'cap', trim: 0xc9a040, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } },
  rokSoldier: { outfit: 'uniform', pants: 0x4e5840, robe: 0x5a6448, hat: 'steel', gear: 'rifle', trim: 0x3a3f2c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  unSoldier: { outfit: 'uniform', pants: 0x5a5a3e, robe: 0x6b6a4a, hat: 'steel', gear: 'rifle', trim: 0x3a3f2c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  citizen: { eras: { present: { outfit: 'shirt', robe: 0xe8e6e0, pants: 0x3a3f4a }, presentLate: { outfit: 'shirt', robe: 0x9ab0c8, pants: 0x4a4038 } }, outfit: 'short', pants: 0xd8cfbf, robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  grandma: { outfit: 'chima', pants: 0x5a4a3a, robe: 0xd8cfbf, hat: 'bun', hairColor: '#b8b2a8', trim: 0x6b4a32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', age: 'old' } },
  nkSoldier: { outfit: 'uniform', pants: 0x5a5a32, robe: 0x6b6a3a, hat: 'cap', gear: 'rifle', trim: 0x8a2f24, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  builder: { outfit: 'shirt', pants: 0x5a5040, robe: 0x8a7a5a, hat: 'steel', trim: 0x3a3f2c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  // 1950년대 아이: 상투 없이 짧게 깎은 머리, 무명 셔츠
  kidModern: { eras: { present: { outfit: 'shirt', robe: 0xd8d0c0, pants: 0x4a4a5a } }, outfit: 'short', pants: 0xbfb6a0, robe: 0xcfc6b0, hat: 'short', trim: 0x5a6a7a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
};

export const look = (id, extra = {}) => ({ ...LOOKS[id], ...extra });
