# Would you like some ___? · 음식 권하고 맛 말하기

영어 **음식 권하고 맛 말하기** 단원 학습용 웹앱입니다.
기존 *Can you come to the ___?* 웹앱과 같은 구성(5개 탭 · 단어 뜻 풍선 · 말하기 채점 · 역할극)에
이 단원의 주요 표현을 넣었습니다. (🍽️ 음식 테마 디자인)

## 주요 표현

| 역할 | 표현 |
|------|------|
| 권하기 | **Would you like some ___?** |
| 대답 | **Yes, please.** · (사양) No, thanks. |
| 맛 묻기 | **How's the food?** |
| 맛 말하기 | **It's ___.** |

```
A: Would you like some curry?   B: Yes, please.
A: How's the food?              B: It's spicy.
```

## 음식 10가지 · 맛 표현 10가지

| # | 음식 (Would you like some ___?) | 맛 (It's ___.) |
|---|------|------|
| 1 | 🍛 curry 카레 | 🌶️ spicy 매워 |
| 2 | 🍰 cake 케이크 | 🍬 sweet 달아 |
| 3 | 🍟 French fries 감자튀김 | 🧂 salty 짜 |
| 4 | 🍋 lemonade 레모네이드 | 😣 sour 셔 |
| 5 | 🍵 green tea 녹차 | 😖 bitter 써 |
| 6 | 🥩 bulgogi 불고기 | 😋 delicious 맛있어 |
| 7 | 🍲 soup 수프 | 🔥 hot 뜨거워 |
| 8 | 🍨 ice cream 아이스크림 | 🧊 cold 차가워 |
| 9 | 🍗 fried chicken 프라이드치킨 | 🥨 crunchy 바삭바삭해 |
| 10 | 🍕 pizza 피자 | 🤤 yummy 아주 맛있어 |

## 기능

- 🍽️ **음식 권하기** — 음식 10개 × 초급·중급·고급 대화 카드 **총 30개** (A/B 4줄 대화, 줄마다 듣기)
  - 초급: 기본 대화 · 중급: `Here you are.` / `It's really ___.` · 고급: 맛을 말한 뒤 한마디 더 (`It's spicy, but I love it.`)
- 💬 **대답하기** — `Yes, please.` / `No, thanks.` 카드 + `Would you like some ___?` 빈칸에 음식 골라 채우기
- 😋 **맛 말하기** — 맛 표현 10개 카드 + `How's the food? It's ___.` 빈칸 채우기
- 🎒 **내 식탁 만들기** — 친구에게 권할 **음식 3개**(음식 1 + 맛 1)를 골라 대화 완성 · 🎲 무작위 채우기 · 📝 공책에 적기 표 · 브라우저에 저장
- 🎤 **연습 · 짝 활동** — 👫 짝 활동 카드(친구가 말한 맛 표시) + 줄마다 🎙️ 말하기 정확도 측정 + 🎭 역할극(A 권하기 / B 대답하기, Yes·No 두 버전)
- 단어 클릭 시 **뜻 풍선 + 발음**, 말하기 **속도 조절** 슬라이더

브라우저 내장 **Web Speech API**(음성 합성·음성 인식)를 사용합니다. (Chrome 권장)

## 🎨 이미지 (Canva)

카드 그림 20장(음식 10 · 맛 10)은 **Canva AI 이미지 생성**으로 만들어 `images/foods/`, `images/tastes/` 에 넣었습니다.
같은 이름의 PNG로 바꾸면 그림이 교체되고, 파일이 없으면 이모지 타일로 대체됩니다.
파일 이름 목록은 [`images/README.md`](images/README.md), Canva 그림 문구는 `data.js`의 `CANVA_PROMPTS`에 있습니다.

## 사용 방법

`index.html`을 브라우저(크롬 권장)에서 열면 됩니다. 별도 설치가 필요 없습니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 화면 구조(탭·섹션) |
| `style.css`  | 디자인·음식 테마 |
| `data.js`    | 음식·맛·대화 문장, Canva 그림 문구, 단어 뜻 |
| `app.js`     | 음성·단어 풍선·대화 카드·식탁 만들기·연습(역할극) 채점 로직 |
| `images/`    | Canva 그림을 넣는 폴더 |
