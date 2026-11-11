/* =========================================================
 * Would you like some ___? · How's the food? 데이터
 * - 음식 10가지 (Would you like some ___?)
 * - 맛 표현 10가지 (How's the food? It's ___.)
 * - 권하기 대화 : 초급 / 중급 / 고급 각 10개 (음식-맛 짝)
 *     A: Would you like some curry?   B: Yes, please.
 *     A: How's the food?              B: It's spicy.
 * - 대답 : Yes, please. (승낙) · No, thanks. (거절)
 * - 이미지 : images/foods/<id>.png · images/tastes/<id>.png  (Canva에서 만든 그림)
 *            파일이 없으면 이모지 타일로 자동 대체
 * - 단어 뜻 사전
 * - 내 식탁 세트(3개) 는 app.js 에서 localStorage 에 저장
 * ========================================================= */

/* ===== 음식 10가지 ===== */
const FOODS = [
  { id: "curry",         en: "curry",         ko: "카레",         emoji: "🍛", taste: "spicy" },
  { id: "cake",          en: "cake",          ko: "케이크",       emoji: "🍰", taste: "sweet" },
  { id: "french-fries",  en: "French fries",  ko: "감자튀김",     emoji: "🍟", taste: "salty" },
  { id: "lemonade",      en: "lemonade",      ko: "레모네이드",   emoji: "🍋", taste: "sour" },
  { id: "green-tea",     en: "green tea",     ko: "녹차",         emoji: "🍵", taste: "bitter" },
  { id: "bulgogi",       en: "bulgogi",       ko: "불고기",       emoji: "🥩", taste: "delicious" },
  { id: "soup",          en: "soup",          ko: "수프",         emoji: "🍲", taste: "hot" },
  { id: "ice-cream",     en: "ice cream",     ko: "아이스크림",   emoji: "🍨", taste: "cold" },
  { id: "fried-chicken", en: "fried chicken", ko: "프라이드치킨", emoji: "🍗", taste: "crunchy" },
  { id: "pizza",         en: "pizza",         ko: "피자",         emoji: "🍕", taste: "yummy" },
];

/* ===== 맛 표현 10가지 (It's ___.) ===== */
const TASTES = [
  { id: "spicy",     en: "spicy",     ko: "매워",           emoji: "🌶️" },
  { id: "sweet",     en: "sweet",     ko: "달아",           emoji: "🍬" },
  { id: "salty",     en: "salty",     ko: "짜",             emoji: "🧂" },
  { id: "sour",      en: "sour",      ko: "셔",             emoji: "😣" },
  { id: "bitter",    en: "bitter",    ko: "써",             emoji: "😖" },
  { id: "delicious", en: "delicious", ko: "맛있어",         emoji: "😋" },
  { id: "hot",       en: "hot",       ko: "뜨거워",         emoji: "🔥" },
  { id: "cold",      en: "cold",      ko: "차가워",         emoji: "🧊" },
  { id: "crunchy",   en: "crunchy",   ko: "바삭바삭해",     emoji: "🥨" },
  { id: "yummy",     en: "yummy",     ko: "아주 맛있어",    emoji: "🤤" },
];

/* ===== 이미지 경로 (Canva에서 만든 PNG를 이 이름으로 저장) ===== */
const IMAGE_DIR = { food: "images/foods/", taste: "images/tastes/" };
const IMAGE_EXT = ".png";

/* Canva에서 그림을 만들 때 쓴 문구 (README 참고) */
const CANVA_PROMPTS = {
  curry:           "cute cartoon bowl of Japanese curry rice with steam, red chili pepper, kids illustration, bright colors, white background",
  cake:            "cute cartoon slice of strawberry cream cake, sparkles, kids illustration, bright colors, white background",
  "french-fries":  "cute cartoon French fries in a red box with salt sprinkles, kids illustration, white background",
  lemonade:        "cute cartoon glass of lemonade with lemon slices and ice, kids illustration, white background",
  "green-tea":     "cute cartoon cup of green tea with tea leaves and steam, kids illustration, white background",
  bulgogi:         "cute cartoon Korean bulgogi beef on a plate with sesame, kids illustration, white background",
  soup:            "cute cartoon hot bowl of soup with lots of steam, kids illustration, white background",
  "ice-cream":     "cute cartoon ice cream cone with three colorful scoops, kids illustration, white background",
  "fried-chicken": "cute cartoon crispy fried chicken drumsticks in a basket, kids illustration, white background",
  pizza:           "cute cartoon pepperoni pizza with stretchy cheese, kids illustration, white background",
  spicy:           "cartoon child eating spicy food with fire coming out of mouth, red face, funny, kids illustration",
  sweet:           "cartoon happy child tasting sweet candy with hearts, kids illustration",
  salty:           "cartoon child tasting very salty food, salt shaker, funny face, kids illustration",
  sour:            "cartoon child tasting a sour lemon, squinting puckered face, kids illustration",
  bitter:          "cartoon child tasting bitter medicine, grimacing face, kids illustration",
  delicious:       "cartoon child eating delicious food with big smile and thumbs up, kids illustration",
  hot:             "cartoon child blowing on very hot steaming soup, kids illustration",
  cold:            "cartoon child shivering while eating ice cream, ice cubes, kids illustration",
  crunchy:         "cartoon child biting crunchy snack with crunch sound effect, kids illustration",
  yummy:           "cartoon child rubbing tummy saying yummy, sparkling eyes, kids illustration",
};

/* ===== 권하기 대화 (난이도별) =====
 * lines: [A 권하기, B 대답, A 맛 묻기, B 맛 말하기] */
const findFood  = id => FOODS.find(f => f.id === id) || null;
const findTaste = id => TASTES.find(t => t.id === id) || null;

function basicLines(food, taste) {
  return [
    { who: "A", en: `Would you like some ${food.en}?`, ko: `${food.ko} 좀 먹을래?` },
    { who: "B", en: "Yes, please.",                   ko: "응, 줘." },
    { who: "A", en: "How's the food?",                ko: "음식 맛이 어때?" },
    { who: "B", en: `It's ${taste.en}.`,               ko: `${taste.ko}.` },
  ];
}

/* 고급: 음식마다 맛 + 한마디 더 */
const ADVANCED_TAIL = {
  curry:           { en: "It's spicy, but I love it.",        ko: "매운데 정말 좋아." },
  cake:            { en: "It's sweet. Can I have some more?", ko: "달아. 더 먹어도 돼?" },
  "french-fries":  { en: "It's salty. I need some water.",    ko: "짜. 물이 좀 필요해." },
  lemonade:        { en: "It's sour. I can't open my eyes!",  ko: "셔. 눈을 못 뜨겠어!" },
  "green-tea":     { en: "It's bitter. I don't like it.",     ko: "써. 나는 별로야." },
  bulgogi:         { en: "It's delicious. You're a great cook!", ko: "맛있어. 너 요리 정말 잘한다!" },
  soup:            { en: "It's hot. Be careful!",             ko: "뜨거워. 조심해!" },
  "ice-cream":     { en: "It's cold. My teeth hurt!",         ko: "차가워. 이가 시려!" },
  "fried-chicken": { en: "It's crunchy. It's my favorite.",   ko: "바삭바삭해. 내가 제일 좋아하는 거야." },
  pizza:           { en: "It's yummy. Let's eat more!",       ko: "아주 맛있어. 더 먹자!" },
};

function dialogueFor(level, food) {
  const taste = findTaste(food.taste);
  const lines = basicLines(food, taste);
  if (level === "intermediate") {
    lines[1] = { who: "B", en: "Yes, please. Thank you.",       ko: "응, 줘. 고마워." };
    lines[2] = { who: "A", en: "Here you are. How's the food?", ko: "여기 있어. 음식 맛이 어때?" };
    lines[3] = { who: "B", en: `It's really ${taste.en}.`,       ko: `정말 ${taste.ko}.` };
  } else if (level === "advanced") {
    lines[1] = { who: "B", en: "Yes, please. Thank you.",       ko: "응, 줘. 고마워." };
    lines[2] = { who: "A", en: "Here you are. How's the food?", ko: "여기 있어. 음식 맛이 어때?" };
    lines[3] = Object.assign({ who: "B" }, ADVANCED_TAIL[food.id]);
  }
  return lines;
}

/* ===== 대답 (Yes / No) ===== */
const ANSWER_EXPRESSIONS = [
  { en: "Yes, please.", ko: "응, 줘. (네, 주세요.)",   emoji: "🙆", type: "yes" },
  { en: "No, thanks.",  ko: "아니, 괜찮아. (고마워.)", emoji: "🙅", type: "no" },
];

/* ===== 단어 뜻 사전 ===== */
function wordKey(w) {
  return w.toLowerCase().replace(/^[^a-z0-9']+/, "").replace(/[^a-z0-9']+$/, "");
}

const WORD_MEANINGS = {
  "would": "~하겠니? (공손하게 물을 때)",
  "you": "너, 너희",
  "like": "좋아하다 (would like: 원하다)",
  "some": "조금, 약간의",
  "yes": "응, 네",
  "please": "제발, ~해 주세요",
  "no": "아니",
  "thanks": "고마워",
  "thank": "고마워하다 (thank you: 고마워)",
  "how's": "~은 어때? (how is)",
  "how": "어떻게, 어때",
  "the": "그 (특정한 것)",
  "food": "음식",
  "it's": "그것은 ~이야 (it is)",
  "it": "그것",
  "is": "~이다",
  "here": "여기",
  "are": "~이다 (here you are: 여기 있어)",
  "really": "정말",
  "curry": "카레",
  "cake": "케이크",
  "french": "프랑스의 (French fries: 감자튀김)",
  "fries": "감자튀김 (French fries)",
  "lemonade": "레모네이드",
  "green": "초록색의 (green tea: 녹차)",
  "tea": "차 (green tea: 녹차)",
  "bulgogi": "불고기",
  "soup": "수프, 국",
  "ice": "얼음 (ice cream: 아이스크림)",
  "cream": "크림 (ice cream: 아이스크림)",
  "fried": "튀긴",
  "chicken": "닭고기, 치킨",
  "pizza": "피자",
  "spicy": "매운",
  "sweet": "단, 달콤한",
  "salty": "짠",
  "sour": "신, 시큼한",
  "bitter": "쓴",
  "delicious": "맛있는",
  "hot": "뜨거운; 매운",
  "cold": "차가운",
  "crunchy": "바삭바삭한",
  "yummy": "아주 맛있는 (아이들 말)",
  "but": "하지만, 그런데",
  "i": "나는",
  "love": "아주 좋아하다",
  "can": "~할 수 있다",
  "can't": "~할 수 없다",
  "have": "먹다, 가지다",
  "more": "더",
  "need": "필요하다",
  "water": "물",
  "open": "뜨다, 열다",
  "my": "나의",
  "eyes": "눈 (두 눈)",
  "don't": "~하지 않다 (do not)",
  "you're": "너는 ~이야 (you are)",
  "a": "하나의",
  "great": "훌륭한",
  "cook": "요리사; 요리하다",
  "be": "~이 되다 (be careful: 조심해)",
  "careful": "조심하는",
  "teeth": "이, 치아 (여러 개)",
  "hurt": "아프다",
  "favorite": "가장 좋아하는 것",
  "let's": "~하자 (let us)",
  "eat": "먹다",
};
