# 🍁 What are you going to do? · 6학년 9단원 계획 묻고 답하기

천재(함) 초등 6학년 9단원 **What are you going to do?** 수업용 웹앱입니다.
설치할 것 없이 `index.html`만 열면(또는 GitHub Pages) 동작합니다. 가을 테마(주황 · 단풍 빨강 · 은행잎 노랑)로 꾸몄어요.

```
🙋 What are you going to do this afternoon?
🙆 I'm going to fly a kite.
```

## 화면 (탭 3개)

| 탭 | 내용 |
|----|------|
| 🎨 활동 카드 (초급) | `I'm going to fly a kite.` 같은 짧은 문장 카드 60장 |
| 🎨 활동 카드 (중급) | 누구와·어디서·무엇을 하러를 붙인 긴 문장 `I'm going to fly a kite on the hill.` |
| 🎤 연습하기 `2/5` | 나의 계획표 + 줄마다 말하기 채점 · 녹음 다시 듣기 · 인쇄 |

휴대폰에서는 탭 이름이 **초급 카드 / 중급 카드 / 연습하기**로 짧게 한 줄로 나옵니다. 탭 메뉴는 화면 위에 고정됩니다.

### 활동 카드 탭
1. **1️⃣ 질문을 골라요**: Q1~Q5 (오늘 오후 · 오늘 밤 · 내일 · 이번 주말 · 겨울방학). 계획을 고른 질문에는 ✓와 활동 이모지가 붙습니다.
2. **말풍선 대화**: 🙋 친구의 질문과 🙆 나의 대답(빈칸), 한국어 뜻, 줄마다 🔊, [🔊 대화 듣기] [다음 질문 ▶] [🎤 연습하기로 가기]
3. **2️⃣ 할 일 고르기**: 필터 [전체] [📘 교과서 표현] [종류 5개] [⭐ 지금 질문에 어울리는 것만]
4. **카드**: 종류 태그(📘 교과서, ⭐ 추천), Canva 그림, 문장(단어를 누르면 뜻 풍선과 발음), 한국어, 🔊,
   맨 아래 **✅ 오늘 오후에 할래요** 버튼. 누르면 지금 질문의 대답이 되어 말풍선 빈칸이 채워지고, 질문과 대답을 읽어 준 뒤 연습하기에 담깁니다.
   다시 누르면 빠지고, 다른 카드를 누르면 바뀝니다(질문 하나당 계획 1개).
- 초급·중급 어느 탭에서 골라도 같은 계획표(질문별 `{활동 id, level}`)에 저장됩니다. 브라우저 `localStorage`에 남아요.

### 연습하기 탭
- **연습 기록 요약**: 🎙️ 총 연습 n회 · 📊 평균 정확도 % · ✅ 연습한 문장 n/5 · [🧹 기록 지우기] [🔊 전체 듣기] [🖨️ 인쇄하기]
- **📅 나의 계획표 · My Plans**: 질문 5줄마다 언제(한국어+영어), Q 문장, A 문장, 한국어, 그림, 🔊, ✕(빼기). 비어 있는 줄은 `A. I'm going to ____.`와 [활동 카드에서 골라요]가 보입니다.
- **말하기 도구**: [🎙️ 말하기] [▶ 내 목소리] `이번 % · 평균 % · 최고 % · n회`
  - Web Speech API 음성 인식(en-US, 중간 결과 보기, 후보 5개, 9초 제한)과 MediaRecorder 녹음을 함께 실행합니다.
  - 말하는 동안 **👂 들리는 말**이 실시간으로 보이고, 끝나면 ▶ 내 목소리로 녹음을 들을 수 있습니다.
  - 기록(횟수·최고·점수 합계 → 평균)은 localStorage에 저장됩니다. 녹음은 새로고침하면 사라집니다.
  - 음성 인식이 없는 브라우저는 4초 녹음만 하고, 둘 다 없으면 버튼이 꺼지고 "Chrome 권장"이 나옵니다.
- **인쇄**: 계획표만 나옵니다. 버튼과 마이크 도구는 숨겨집니다.

## 활동 목록 (5종류 × 12개 = 60개)

📘 = 교과서 표현 (같은 종류 안에서 맨 앞)

| 종류 | 활동 (초급 문장의 ___) |
|------|------|
| 🏠 집·학교에서 | 📘 stay home · 📘 clean my room · 📘 study math · do my homework · read a book · play computer games · practice the piano · draw autumn leaves · watch a movie · write in my diary · go to bed early · practice a dance |
| ⚽ 운동·놀이 | 📘 watch a baseball game · play soccer · ride my bike · fly a kite · play badminton · go swimming · play basketball · jump rope · play dodgeball · go inline skating · practice taekwondo · go hiking |
| 📍 장소에 가기 | go to a PC room · go to a comic book cafe · go to a karaoke room(코인노래방) · go to the library · go to a bookstore · go to the shopping mall · go to a bakery · go to an escape room cafe · go to a trampoline park · go to a cat cafe · go to a hair salon · go to the dentist |
| 👨‍👩‍👧 가족과 함께 | 📘 visit my grandparents · pick apples · see the autumn leaves · gather chestnuts · dig sweet potatoes · make kimchi(김장) · cook dinner · bake cookies · go to the market · walk my dog · have a picnic · go to a fireworks festival |
| ✈️ 가족 여행 | 📘 go camping · go to Jeju Island · go to Gyeongju · go to Busan · go to Seoraksan · go to Jeonju · go to an amusement park · go to the aquarium · go to the zoo · go to a hot spring · take a train trip · travel to Vietnam |

가을 테마에 맞춰 눈사람·스키 같은 겨울 활동은 넣지 않았고, 사과 따기 · 단풍 구경 · 밤 줍기 · 고구마 캐기 · 김장 같은 가을 활동을 넣었습니다.
중급 문장, 한국어 뜻, 추천 질문(`when`)은 `data.js`에 있습니다.

## 발음 채점 방식

`app.js` 맨 위의 `Scoring` 모듈에 있습니다. DOM 없이 만들어서 Node에서도 테스트할 수 있습니다.

1. **정리하기**: 줄임말을 펼칩니다(I'm → i am, I'll → i will, gonna → going to …). 동음어를 하나로 맞춥니다(too/two → to, four → for, sea → see, buy → by …).
   한 글자씩 들린 말은 붙입니다("p c" → pc, "k pop" → kpop).
2. **정렬하기**: 목표 문장과 들린 말을 단어 **순서대로** 동적 계획법으로 맞춰 봅니다.
3. **단어 점수**: 같음 1 · 철자 1글자 차이 0.85 · 소리 비슷 0.7 · 비슷한 편 0.5 · 그 외 0
   - 소리 비슷: 자음만 통일합니다(r/l, f/p, ph/f, v/b, th/s, c/k, z/s …). 모음은 그대로 두어서 kite ≠ cat입니다.
4. **가중치**: 핵심 단어 1(going 포함) · 작은 단어(a, the, to, my, i, am, at, in …) 0.3 · 지명(대문자 고유명사: Jeju, Busan …) 0.6
5. **감점**: 덧붙인 말은 한 개에 3%, 최대 10%까지 깎습니다. 보너스 점수는 없습니다.
6. 인식 후보(최대 5개) 가운데 **가장 높은 점수**를 씁니다.
7. **결과 표시**: ⭐ 85% 이상 / 👍 60% 이상 / 🔁 그 아래. 단어 칩은 🟩 맞음 · 🟨 비슷함 · 🟥 놓침이고, I'm은 칩 하나로 보입니다. 다시 들어 볼 단어 🔊 버튼과 "컴퓨터가 들은 말"도 함께 보여 줍니다.

| `I'm going to fly a kite.` 에 대해 | 점수 |
|------|------|
| I'm going to fly a kite | 100 |
| I'm going to fly a cat | 73 |
| fly a kite | 55 |
| kite a fly to going I'm (순서 뒤섞임) | 14 |

## 🎨 그림 (Canva)

활동 60개의 그림은 모두 **Canva AI(generate-image)**로 같은 틀을 써서 만들었습니다.

```
Cute flat vector illustration for an elementary school English flashcard: [장면].
Warm autumn colors, simple clean shapes, white background, no text, no letters.   (LANDSCAPE_4_3)
```

- 활동별 [장면] 문장은 `data.js`의 `CANVA_SCENES`에 있습니다.
- Canva 미리보기 크기(약 200×150)로 저장돼 있어서 카드에서는 `object-fit: contain`, 흰 배경으로 보여 줍니다.
- **그림 바꾸는 법**: `images/<활동 id>.png`를 같은 이름의 PNG로 바꾸면 됩니다(예: `images/fly-kite.png`). 4:3 가로 그림을 권장합니다.
  파일이 없거나 불러오지 못하면 자동으로 이모지 타일이 나옵니다.
- 활동을 새로 넣을 때는 `ACTIVITIES`에 항목을 추가하고, 문장에 쓴 새 단어를 `DICT`에 넣고, `images/<id>.png`를 추가하세요. 그다음 `node tests/check-data.js`로 누락이 없는지 확인합니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 화면 구조(헤더 · 탭 3개) |
| `style.css` | 가을 테마 디자인, 휴대폰 화면, 인쇄 화면 |
| `data.js` | 질문 5개 · 종류 5개 · 활동 60개 · Canva 장면 문구 · 단어 뜻 사전 |
| `app.js` | 발음 채점(`Scoring`), 음성 합성, 뜻 풍선, 카드 탭, 연습하기(인식 + 녹음) |
| `images/` | 활동 그림 60장 (`<id>.png`) |
| `tests/scoring.test.js` | 채점 단위 테스트 (`node tests/scoring.test.js`) |
| `tests/check-data.js` | 단어 뜻 · 그림 누락과 교과서 표현 점검 (`node tests/check-data.js`) |
| `tests/e2e.js` | Playwright 브라우저 테스트 (`python3 -m http.server 8123` 실행 후 `node tests/e2e.js`) |

## 사용할 때

- **Chrome**을 권장합니다. 음성 인식은 Chrome·Edge에서 동작하고, 인터넷 연결이 필요합니다.
- 말하기를 쓰려면 **마이크 권한**을 허용해야 합니다. 주소창 🔒 → 마이크 → 허용.
  `file://`로 열었을 때 권한이 잘 안 되면 GitHub Pages(https)로 여세요.
