/* =========================================================
 * Would you like some ___? · How's the food? · 듣고 따라 말하기 웹 앱
 * - 음성 출력: Web Speech API (SpeechSynthesis)
 * - 단어 클릭: 단어 발음 + 뜻 풍선(popup)
 * - 이미지: Canva에서 만든 그림(images/foods, images/tastes) · 없으면 이모지 타일
 * - 내 식탁 만들기: 세트 3개(음식 + 맛) + 친구 대답(Yes, please. / No, thanks.)
 * - 세트 연습: 세트별 대화를 줄마다 말하기 + 역할극(A/B) 채점
 * - 따라 말하기 채점: Web Speech API (SpeechRecognition)
 * ========================================================= */

/* ---------- 음성 합성 (TTS) ---------- */
const synth = window.speechSynthesis;
let enVoice = null;
let speakRate = 0.85;

function pickVoice() {
  const voices = synth.getVoices();
  enVoice =
    voices.find(v => /en[-_]US/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
    null;
  const status = document.querySelector(".toolbar #voice-status");
  if (status) {
    status.textContent = enVoice ? `음성: ${enVoice.name}` : "영어 음성을 찾는 중...";
  }
}
pickVoice();
if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;

function speak(text, rate, onStart, onEnd) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate || speakRate;
  u.pitch = 1.05;
  if (enVoice) u.voice = enVoice;
  if (onStart) u.onstart = onStart;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

/* ---------- 단어 뜻 풍선(popup) ---------- */
const popup = document.createElement("div");
popup.className = "word-popup hidden";
popup.innerHTML = `
  <div class="wp-word"></div>
  <div class="wp-meaning"></div>
  <button class="wp-listen">단어 다시 듣기</button>`;
document.body.appendChild(popup);

popup.querySelector(".wp-listen").addEventListener("click", e => {
  e.stopPropagation();
  if (popup.dataset.word) speak(popup.dataset.word, 0.8);
});

function showWordPopup(wordEl, rawWord) {
  const key = wordKey(rawWord);
  const plain = rawWord.replace(/[.,!?]+$/, "");
  const meaning = WORD_MEANINGS[key] || WORD_MEANINGS[plain] || "(뜻 정보 없음)";
  popup.dataset.word = key || rawWord;
  popup.querySelector(".wp-word").textContent = rawWord.replace(/[.,!?]+$/, "");
  popup.querySelector(".wp-meaning").textContent = meaning;

  popup.classList.remove("hidden");
  const r = wordEl.getBoundingClientRect();
  const pw = popup.offsetWidth;
  let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  let top = r.bottom + 8 + window.scrollY;
  popup.style.left = left + "px";
  popup.style.top = top + "px";

  speak(key || rawWord, 0.8);
}

function hidePopup() { popup.classList.add("hidden"); }
document.addEventListener("click", e => {
  if (!popup.contains(e.target) && !e.target.classList.contains("word")) hidePopup();
});

/* ---------- 클릭 가능한 단어로 문장 만들기 ---------- */
function buildWords(sentence) {
  const frag = document.createDocumentFragment();
  sentence.split(/\s+/).forEach((w, i) => {
    if (i > 0) frag.appendChild(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = w;
    span.addEventListener("click", e => {
      e.stopPropagation();
      showWordPopup(span, w);
    });
    frag.appendChild(span);
  });
  return frag;
}


/* ---------- Canva 이미지 (없으면 이모지 타일) ---------- */
function makeVisual(kind, id, emoji, alt, cls) {
  const em = document.createElement("div");
  em.className = cls || "emoji";
  em.textContent = emoji;
  if (!id) return em;
  const img = document.createElement("img");
  img.className = "photo";
  img.loading = "lazy";
  img.alt = alt || id;
  img.src = IMAGE_DIR[kind] + id + IMAGE_EXT;
  img.addEventListener("error", () => img.replaceWith(em));
  return img;
}

/* ---------- 카드 만들기 (한 문장) ---------- */
function makeCard(item, opts) {
  opts = opts || {};
  const div = document.createElement("div");
  div.className = "card" + (opts.tone != null ? " tone-" + opts.tone : "");

  function speakSentence() {
    speak(item.en, null,
      () => div.classList.add("speaking"),
      () => div.classList.remove("speaking"));
  }

  const top = document.createElement("div");
  top.className = "card-top";
  const tag = document.createElement("span");
  tag.className = "card-tag";
  if (opts.index != null) tag.textContent = "CARD " + opts.index;
  const listenAll = document.createElement("button");
  listenAll.className = "listen-all";
  listenAll.textContent = "듣기 ▶";
  listenAll.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  top.append(tag, listenAll);

  const visual = makeVisual(opts.kind, opts.imgId, item.emoji, item.en);

  const box = document.createElement("div");
  box.className = "sentence-box";
  const txt = document.createElement("div");
  txt.className = "sentence-text";
  const en = document.createElement("div");
  en.className = "en";
  en.appendChild(buildWords(item.en));
  const ko = document.createElement("div");
  ko.className = "ko";
  ko.textContent = item.ko;
  txt.append(en, ko);
  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn";
  speakBtn.setAttribute("aria-label", "문장 듣기");
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  box.append(txt, speakBtn);

  div.append(top, visual, box);
  return div;
}

/* ---------- 대화 카드 (A/B 4줄) ---------- */
function makeDialogueCard(food, lines, idx) {
  const div = document.createElement("div");
  div.className = "card dlg-card tone-" + (idx % 6);

  const top = document.createElement("div");
  top.className = "card-top";
  const tag = document.createElement("span");
  tag.className = "card-tag";
  tag.textContent = `CARD ${idx + 1} · ${food.emoji} ${food.en}`;
  const listenAll = document.createElement("button");
  listenAll.className = "listen-all";
  listenAll.textContent = "대화 듣기 ▶";
  listenAll.addEventListener("click", e => {
    e.stopPropagation();
    speak(lines.map(l => l.en).join(" "), null,
      () => div.classList.add("speaking"),
      () => div.classList.remove("speaking"));
  });
  top.append(tag, listenAll);

  const visual = makeVisual("food", food.id, food.emoji, food.en);

  const box = document.createElement("div");
  box.className = "dlg-lines";
  lines.forEach(l => {
    const row = document.createElement("div");
    row.className = "dlg-line who-" + l.who.toLowerCase();
    const who = document.createElement("span");
    who.className = "dlg-who";
    who.textContent = l.who;
    const txt = document.createElement("div");
    txt.className = "dlg-text";
    const en = document.createElement("div"); en.className = "en"; en.appendChild(buildWords(l.en));
    const ko = document.createElement("div"); ko.className = "ko"; ko.textContent = l.ko;
    txt.append(en, ko);
    const btn = document.createElement("button");
    btn.className = "speak-btn small";
    btn.setAttribute("aria-label", "이 줄 듣기");
    btn.textContent = "🔊";
    btn.addEventListener("click", e => { e.stopPropagation(); speak(l.en); });
    row.append(who, txt, btn);
    box.appendChild(row);
  });

  div.append(top, visual, box);
  return div;
}

/* ---------- 난이도(초급/중급/고급) ---------- */
let currentLevel = "beginner";

function renderSuggestions() {
  const grid = document.getElementById("suggestion-grid");
  grid.innerHTML = "";
  FOODS.forEach((food, i) => grid.appendChild(makeDialogueCard(food, dialogueFor(currentLevel, food), i)));
}

document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentLevel = btn.dataset.level;
    synth.cancel();
    hidePopup();
    renderSuggestions();
  });
});

/* ---------- 대답 카드 · 맛 카드 ---------- */
function renderAnswerGrid() {
  const grid = document.getElementById("answer-grid");
  grid.innerHTML = "";
  ANSWER_EXPRESSIONS.forEach((a, i) => grid.appendChild(makeCard(a, { tone: i === 0 ? 2 : 5 })));
}
function renderTasteGrid() {
  const grid = document.getElementById("taste-grid");
  grid.innerHTML = "";
  TASTES.forEach((t, i) => grid.appendChild(
    makeCard({ en: `It's ${t.en}.`, ko: `${t.ko}.`, emoji: t.emoji },
      { tone: i % 6, index: i + 1, kind: "taste", imgId: t.id })));
}

function makeChip(text, cls, isOn, onClick) {
  const c = document.createElement("button");
  c.className = "chip " + cls + (isOn ? " on" : "");
  c.textContent = text;
  c.addEventListener("click", onClick);
  return c;
}

/* ---------- 빈칸 채우기 공통 ---------- */
let lastFillSpoken = "";
function fillActions(wrap, en) {
  wrap.innerHTML = "";
  if (!en) return;
  const listenBtn = document.createElement("button");
  listenBtn.className = "btn primary";
  listenBtn.textContent = "🔊 문장 듣기";
  listenBtn.addEventListener("click", () => speak(en));
  wrap.append(listenBtn);
  if (en !== lastFillSpoken) { lastFillSpoken = en; speak(en); }
}
function fillBlank(el, en) {
  el.classList.toggle("filled", !!en);
  if (en) { el.innerHTML = ""; el.appendChild(buildWords(en)); }
  else el.textContent = "________";
}

/* 권하기: Would you like some ___? → Yes, please. */
let fillFood = null;
function renderOfferFill() {
  const row = document.getElementById("offer-chips");
  row.innerHTML = "";
  FOODS.forEach(f => row.appendChild(makeChip(`${f.emoji} ${f.en}`, "act", fillFood === f, () => {
    fillFood = f; renderOfferFill();
  })));
  fillBlank(document.getElementById("offer-blank"), fillFood && fillFood.en);
  document.getElementById("offer-ko").textContent = `${fillFood ? fillFood.ko : "________"} 좀 먹을래?`;
  fillActions(document.getElementById("offer-actions"),
    fillFood && `Would you like some ${fillFood.en}? Yes, please.`);
}

/* 맛 말하기: How's the food? It's ___. */
let fillTaste = null;
function renderTasteFill() {
  const row = document.getElementById("taste-chips");
  row.innerHTML = "";
  TASTES.forEach(t => row.appendChild(makeChip(`${t.emoji} ${t.en}`, "with", fillTaste === t, () => {
    fillTaste = t; renderTasteFill();
  })));
  fillBlank(document.getElementById("taste-blank"), fillTaste && fillTaste.en);
  document.getElementById("taste-ko").textContent = `${fillTaste ? fillTaste.ko : "________"}.`;
  fillActions(document.getElementById("taste-actions"),
    fillTaste && `How's the food? It's ${fillTaste.en}.`);
}

/* ===========================================================
 * 🎒 내 식탁 만들기 (세트 3개: 음식 1 + 맛 1)
 * =========================================================== */
const SET_COUNT = 3;
let mySets = [];        // [{ food, taste }] (id 로 저장)
let setMode = "accept"; // 친구 대답: Yes, please.("accept") / No, thanks.("refuse")
let curSet = 0;
let stats = {};

try {
  const saved = JSON.parse(localStorage.getItem("food_sets") || "null");
  if (saved && Array.isArray(saved.sets)) {
    mySets = saved.sets.slice(0, SET_COUNT);
    if (saved.mode === "refuse" || saved.mode === "accept") setMode = saved.mode;
  }
} catch (e) {}
while (mySets.length < SET_COUNT) mySets.push({ food: null, taste: null });
try { stats = JSON.parse(localStorage.getItem("food_stats") || "{}") || {}; } catch (e) {}

function persist() {
  try {
    localStorage.setItem("food_sets", JSON.stringify({ sets: mySets, mode: setMode }));
    localStorage.setItem("food_stats", JSON.stringify(stats));
  } catch (e) {}
}
function setComplete(s) { return !!(findFood(s.food) && findTaste(s.taste)); }
function completeCount() { return mySets.filter(setComplete).length; }

/* 세트 → 대화 줄 (Yes / No 버전) */
function setLines(s, mode) {
  const f = findFood(s.food), t = findTaste(s.taste);
  if (mode === "refuse") {
    return [
      { who: "A", en: `Would you like some ${f.en}?`, ko: `${f.ko} 좀 먹을래?` },
      { who: "B", en: "No, thanks.", ko: "아니, 괜찮아." },
    ];
  }
  return basicLines(f, t);
}

function setBlank(id, en) { fillBlank(document.getElementById(id), en); }

function updateSetBadge() {
  const c = document.getElementById("set-count");
  if (c) c.textContent = `${completeCount()}/${SET_COUNT}`;
  document.querySelectorAll("#set-tabs .set-tab").forEach((b, i) => {
    b.classList.toggle("active", i === curSet);
    b.classList.toggle("done", setComplete(mySets[i]));
    const f = findFood(mySets[i].food);
    b.textContent = `음식 ${i + 1} ${f ? f.emoji : ""}${setComplete(mySets[i]) ? " ✓" : ""}`;
  });
}

function renderBuilder() {
  const s = mySets[curSet];
  const foodRow = document.getElementById("build-food");
  const tasteRow = document.getElementById("build-taste");
  foodRow.innerHTML = ""; tasteRow.innerHTML = "";
  const usedElsewhere = new Set(mySets.filter((x, i) => i !== curSet).map(x => x.food).filter(Boolean));
  FOODS.forEach(f => {
    const chip = makeChip(`${f.emoji} ${f.en}`, "act", s.food === f.id, () => {
      s.food = f.id; persist(); renderBuilder(); updateSetPreview(true);
    });
    if (usedElsewhere.has(f.id)) { chip.classList.add("used"); chip.title = "다른 세트에서 이미 골랐어요"; }
    foodRow.appendChild(chip);
  });
  TASTES.forEach(t => {
    tasteRow.appendChild(makeChip(`${t.emoji} ${t.en}`, "with", s.taste === t.id, () => {
      s.taste = t.id; persist(); renderBuilder(); updateSetPreview(true);
    }));
  });
  updateSetBadge();
}

let lastSetSpoken = "";
function setPlayable(s) { return setMode === "refuse" ? !!findFood(s.food) : setComplete(s); }

function updateSetPreview(autoSpeak) {
  const s = mySets[curSet];
  const f = findFood(s.food), t = findTaste(s.taste);
  const refusing = setMode === "refuse";
  setBlank("set-food", f && f.en);
  document.getElementById("set-food-ko").textContent = `${f ? f.ko : "________"} 좀 먹을래?`;

  document.getElementById("set-mode-accept").classList.toggle("active", !refusing);
  document.getElementById("set-mode-refuse").classList.toggle("active", refusing);
  const al = document.getElementById("set-answer-line");
  al.innerHTML = ""; al.appendChild(buildWords(refusing ? "No, thanks." : "Yes, please."));
  document.getElementById("set-answer-ko").textContent = refusing ? "아니, 괜찮아." : "응, 줘.";
  document.getElementById("set-answer-row").classList.toggle("refusing", refusing);

  setBlank("set-taste", t && t.en);
  document.getElementById("set-taste-ko").textContent = `${t ? t.ko : "________"}.`;
  document.getElementById("set-ask-row").classList.toggle("dimmed", refusing);
  document.getElementById("set-taste-row").classList.toggle("dimmed", refusing);

  const status = document.getElementById("set-status");
  const complete = setComplete(s);
  status.className = "dlg-status" + (complete ? " ok" : "");
  if (!f) status.textContent = `음식 ${curSet + 1} · 1️⃣ 친구에게 권할 음식을 골라보세요 👇`;
  else if (refusing) status.textContent = `🙅 친구가 No, thanks. 라고 하면 맛은 묻지 않아요. 🙆 Yes, please. 를 누르면 맛까지 이어져요.`;
  else if (!t) status.textContent = `음식 ${curSet + 1} · 2️⃣ ${f.en} 의 맛을 골라요 👇`;
  else status.textContent = `✅ 음식 ${curSet + 1} 완성! ${completeCount() < SET_COUNT ? "다음 음식도 골라 보세요." : "세 음식 모두 완성! 📝 공책에 적고 🎤 연습으로 가요."}`;
  renderSheetSummary();
  const listen = document.getElementById("set-listen");
  listen.textContent = refusing ? "🔊 대화 듣기 (No)" : "🔊 대화 듣기 (Yes)";
  listen.disabled = !setPlayable(s);
  updateSetBadge();
  if (setPlayable(s) && autoSpeak) {
    const en = setLines(s, setMode).map(l => l.en).join(" ");
    if (en !== lastSetSpoken) { lastSetSpoken = en; speak(en); }
  } else if (!setPlayable(s)) lastSetSpoken = "";
}

document.querySelectorAll("#set-mode .cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setMode = btn.dataset.mode;
    synth.cancel(); lastSetSpoken = "";
    persist(); renderBuilder(); updateSetPreview();
  });
});
document.querySelectorAll("#set-tabs .set-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    curSet = +btn.dataset.set; synth.cancel(); lastSetSpoken = "";
    renderBuilder(); updateSetPreview();
  });
});
document.getElementById("set-speak-offer").addEventListener("click", () => {
  const f = findFood(mySets[curSet].food); if (f) speak(`Would you like some ${f.en}?`);
});
document.getElementById("set-speak-answer").addEventListener("click", () => {
  speak(setMode === "refuse" ? "No, thanks." : "Yes, please.");
});
document.getElementById("set-speak-ask").addEventListener("click", () => speak("How's the food?"));
document.getElementById("set-speak-taste").addEventListener("click", () => {
  const t = findTaste(mySets[curSet].taste); if (t) speak(`It's ${t.en}.`);
});
document.getElementById("set-listen").addEventListener("click", () => {
  const s = mySets[curSet];
  if (setPlayable(s)) speak(setLines(s, setMode).map(l => l.en).join(" "));
});
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
document.getElementById("set-random").addEventListener("click", () => {
  const s = mySets[curSet];
  const used = new Set(mySets.filter((x, i) => i !== curSet).map(x => x.food));
  const pool = FOODS.filter(f => !used.has(f.id));
  const f = pick(pool.length ? pool : FOODS);
  s.food = f.id;
  s.taste = f.taste;   // 그 음식에 어울리는 맛
  persist(); renderBuilder(); updateSetPreview(true);
});
document.getElementById("set-clear").addEventListener("click", () => {
  mySets[curSet] = { food: null, taste: null };
  synth.cancel(); persist(); renderBuilder(); updateSetPreview();
});

/* ---- 음성 인식 (정확도 측정) ---- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const srSupported = !!SR;
let rec = srSupported ? new SR() : null;
if (rec) { rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 5; }
let recBusy = false;

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z\s']/g, "").replace(/\s+/g, " ").trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function wordsClose(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= 1;
}
const STOPWORDS = new Set(["a", "an", "the", "to", "of", "on", "in", "at", "for", "but", "i", "i'm", "i'll", "some", "it's", "its", "it", "is"]);
function scoreMatch(target, heard) {
  const t = normalize(target).split(" ").filter(Boolean);
  const h = normalize(heard).split(" ").filter(Boolean);
  let content = t.filter(w => !STOPWORDS.has(w));
  if (!content.length) content = t;
  let hit = 0;
  content.forEach(w => { if (h.some(x => wordsClose(x, w))) hit++; });
  let score = hit / content.length;
  if (score >= 0.5) score = Math.min(1, score + 0.12);
  return score;
}
function practiceAttempt(target, cb) {
  if (!rec || recBusy) { cb.onend && cb.onend(); return; }
  recBusy = true;
  let score = 0, heard = "", errCode = null;
  rec.onresult = e => {
    const alts = e.results[0];
    for (let i = 0; i < alts.length; i++) {
      const s = scoreMatch(target, alts[i].transcript);
      if (s > score) { score = s; heard = alts[i].transcript; }
    }
  };
  rec.onerror = ev => { errCode = ev.error; };
  rec.onend = () => {
    recBusy = false;
    if (errCode && score === 0) cb.onerror && cb.onerror(errCode);
    else cb.onresult && cb.onresult(Math.round(score * 100), heard);
    cb.onend && cb.onend();
  };
  try { rec.start(); } catch (e) { recBusy = false; cb.onend && cb.onend(); }
}

/* ---- 말한 뒤 콜백 (음성이 없어도 넘어가도록 안전장치) ---- */
function speakThen(text, cb) {
  let done = false;
  const finish = () => { if (!done) { done = true; cb(); } };
  const timer = setTimeout(finish, Math.min(9000, 1500 + text.length * 90));
  speak(text, null, null, () => { clearTimeout(timer); finish(); });
}

function statsText(en, last) {
  const s = stats[en] || { attempts: 0, best: 0 };
  return `정확도 <b class="acc">${last != null ? last + "%" : "--"}</b>` +
    ` · 최고 <b class="best">${s.best ? s.best + "%" : "--"}</b>` +
    ` · <b>${s.attempts}</b>회`;
}
function recordScore(en, score) {
  const s = stats[en] || { attempts: 0, best: 0 };
  s.attempts++; s.best = Math.max(s.best, score); stats[en] = s; persist();
}
function feedbackHtml(score, heard) {
  const h = `<span class="heard">내 발음: ${heard || "(못 들었어요)"}</span>`;
  if (score >= 75) return ["good", `⭐ 훌륭해요! ${score}% ${h}`];
  if (score >= 45) return ["good", `👍 좋아요! 한 번 더! ${score}% ${h}`];
  return ["bad", `🔁 다시 또박또박! ${score}% ${h}`];
}

/* 한 문장 연습 줄: [🔊] 문장/뜻 [🎙️ 말하기] 점수 → 피드백 */
function makeSpeakRow(en, ko, who) {
  const row = document.createElement("div");
  row.className = "prow" + (who ? " who-" + who.toLowerCase() : "");

  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn small";
  speakBtn.setAttribute("aria-label", "듣기");
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", () => speak(en));

  const txt = document.createElement("div");
  txt.className = "prow-text";
  if (who) { const w = document.createElement("span"); w.className = "prow-who"; w.textContent = who; txt.appendChild(w); }
  const enEl = document.createElement("div"); enEl.className = "en"; enEl.appendChild(buildWords(en));
  const koEl = document.createElement("div"); koEl.className = "ko"; koEl.textContent = ko;
  txt.append(enEl, koEl);

  const mic = document.createElement("button");
  mic.className = "mic-btn";
  mic.innerHTML = '<span class="mic-ico">🎙️</span><span class="mic-txt">말하기</span>';
  const score = document.createElement("div");
  score.className = "pstats";
  score.innerHTML = statsText(en, null);
  const fb = document.createElement("div");
  fb.className = "mic-feedback";

  if (!srSupported) { mic.disabled = true; mic.title = "이 브라우저는 음성 인식을 지원하지 않아요 (Chrome 권장)"; }

  function attempt(after) {
    if (recBusy || !srSupported) { after && after(); return; }
    mic.classList.add("recording");
    row.classList.add("active");
    fb.className = "mic-feedback"; fb.textContent = "🔴 듣고 있어요... 또박또박 말해보세요!";
    practiceAttempt(en, {
      onresult: (s, heard) => {
        recordScore(en, s);
        score.innerHTML = statsText(en, s);
        const [cls, html] = feedbackHtml(s, heard);
        fb.className = "mic-feedback " + cls; fb.innerHTML = html;
      },
      onerror: err => {
        fb.className = "mic-feedback bad";
        fb.textContent = err === "not-allowed" ? "마이크 권한을 허용해 주세요." : "다시 시도해 주세요.";
      },
      onend: () => { mic.classList.remove("recording"); row.classList.remove("active"); after && after(); }
    });
  }
  mic.addEventListener("click", () => attempt());

  const main = document.createElement("div");
  main.className = "prow-main";
  main.append(speakBtn, txt, mic, score);
  row.append(main, fb);
  row._attempt = attempt;
  row._who = who;
  row._en = en;
  return row;
}


/* ===========================================================
 * 📝 공책에 적기
 * =========================================================== */
function sheetRow(label, en, ko) {
  const row = document.createElement("div");
  row.className = "sheet-row" + (en ? "" : " empty");
  const lab = document.createElement("div"); lab.className = "sheet-label"; lab.textContent = label;
  const val = document.createElement("div"); val.className = "sheet-val";
  if (en) {
    const e = document.createElement("div"); e.className = "en"; e.appendChild(buildWords(en));
    const k = document.createElement("div"); k.className = "ko"; k.textContent = ko;
    val.append(e, k);
  } else val.textContent = "아직 고르지 않았어요";
  const btn = document.createElement("button");
  btn.className = "speak-btn small"; btn.textContent = "🔊"; btn.disabled = !en;
  btn.addEventListener("click", () => en && speak(en));
  row.append(lab, val, btn);
  return row;
}
function renderSheetSummary() {
  const box = document.getElementById("sheet-summary");
  if (!box) return;
  box.innerHTML = "";
  mySets.forEach((s, i) => {
    const f = findFood(s.food), t = findTaste(s.taste);
    box.appendChild(sheetRow(`권하기 ${i + 1}`, f && `Would you like some ${f.en}?`, f && `${f.ko} 좀 먹을래?`));
    box.appendChild(sheetRow(`대답 ${i + 1}`, f && "Yes, please.", f && "응, 줘."));
    box.appendChild(sheetRow(`맛 묻기 ${i + 1}`, f && "How's the food?", f && "음식 맛이 어때?"));
    box.appendChild(sheetRow(`맛 말하기 ${i + 1}`, t && `It's ${t.en}.`, t && `${t.ko}.`));
  });
}

/* ===========================================================
 * 👫 짝 활동 카드
 * =========================================================== */
function renderPairCards() {
  const box = document.getElementById("pair-cards");
  box.innerHTML = "";
  const done = mySets.map((s, i) => [s, i]).filter(([s]) => setComplete(s));
  if (!done.length) {
    const p = document.createElement("p"); p.className = "practice-empty";
    p.innerHTML = "아직 만든 식탁이 없어요! <b>🎒 내 식탁 만들기</b>에서 먼저 만들어요.";
    box.appendChild(p); return;
  }
  done.forEach(([s, i]) => {
    const f = findFood(s.food), t = findTaste(s.taste);
    const card = document.createElement("div");
    card.className = "pair-card tone-" + (i % 6);
    const head = document.createElement("div"); head.className = "pair-head";
    head.innerHTML = `<span class="card-tag tag-combo">음식 ${i + 1}</span>`;
    head.appendChild(makeVisual("food", f.id, f.emoji, f.en, "pair-emoji"));
    const offer = document.createElement("div"); offer.className = "pair-line me";
    offer.innerHTML = `<div class="pair-who">🙋 나</div>`;
    const o = document.createElement("div"); o.className = "pair-en"; o.appendChild(buildWords(`Would you like some ${f.en}?`));
    offer.appendChild(o);
    const ans = document.createElement("div"); ans.className = "pair-line friend";
    ans.innerHTML = `<div class="pair-who">🙆 친구</div>
      <div class="pair-choice"><span class="pair-ok">🙆 Yes, please.</span><span class="pair-no">🙅 No, thanks.</span></div>`;
    const ask = document.createElement("div"); ask.className = "pair-line me";
    ask.innerHTML = `<div class="pair-who">🙋 나 (Yes, please. 라고 했을 때)</div>`;
    const a = document.createElement("div"); a.className = "pair-en"; a.appendChild(buildWords("How's the food?"));
    ask.appendChild(a);
    const taste = document.createElement("div"); taste.className = "pair-line friend";
    taste.innerHTML = `<div class="pair-who">🙆 친구 (It's ___.) · 내 예시: <b>It's ${t.en}.</b></div>`;
    const choices = document.createElement("div"); choices.className = "pair-tastes";
    TASTES.forEach(x => {
      const c = document.createElement("button");
      c.className = "chip with" + (x.id === t.id ? " on" : "");
      c.textContent = `${x.emoji} ${x.en}`;
      c.addEventListener("click", () => {
        choices.querySelectorAll(".chip").forEach(el => el.classList.remove("picked"));
        c.classList.add("picked"); speak(`It's ${x.en}.`);
      });
      choices.appendChild(c);
    });
    taste.appendChild(choices);
    const tools = document.createElement("div"); tools.className = "ptools";
    const b1 = document.createElement("button"); b1.className = "btn small primary"; b1.textContent = "🔊 권하기 듣기";
    b1.addEventListener("click", () => speak(`Would you like some ${f.en}?`));
    const b2 = document.createElement("button"); b2.className = "btn small"; b2.textContent = "🔊 대화 전체 듣기";
    b2.addEventListener("click", () => speak(setLines(s, "accept").map(l => l.en).join(" ")));
    tools.append(b1, b2);
    card.append(head, offer, ans, ask, taste, tools);
    box.appendChild(card);
  });
  const note = document.createElement("p"); note.className = "hint pair-note";
  note.innerHTML = `💬 친구가 말한 맛을 눌러 표시해 보세요. 내가 고른 맛과 같나요?`;
  box.appendChild(note);
}

/* ===========================================================
 * 🎤 컴퓨터와 미리 연습하기 (세트별 대화: 줄마다 말하기 + 역할극)
 * =========================================================== */
function makeSetCard(s, idx) {
  const card = document.createElement("div");
  card.className = "pcard pcard-dialog";
  const f = findFood(s.food);

  const top = document.createElement("div");
  top.className = "card-top";
  const left = document.createElement("div"); left.className = "ptag-left";
  const tag = document.createElement("span"); tag.className = "card-tag tag-combo"; tag.textContent = `🎒 음식 ${idx + 1}`;
  const title = document.createElement("span"); title.className = "pset-title"; title.textContent = `${f.emoji} ${f.en}`;
  left.append(tag, title);
  const modeWrap = document.createElement("div"); modeWrap.className = "mode-switch";
  const mAcc = document.createElement("button"); mAcc.className = "cat-btn active"; mAcc.textContent = "🙆 Yes, please.";
  const mRef = document.createElement("button"); mRef.className = "cat-btn"; mRef.textContent = "🙅 No, thanks.";
  modeWrap.append(mAcc, mRef);
  top.append(left, modeWrap);
  card.appendChild(top);

  const body = document.createElement("div");
  const tools = document.createElement("div"); tools.className = "ptools";
  const roleNote = document.createElement("div"); roleNote.className = "role-note";
  card.append(body, tools, roleNote);

  let mode = "accept";
  let rows = [];
  let playing = false;

  function render() {
    mAcc.classList.toggle("active", mode === "accept");
    mRef.classList.toggle("active", mode === "refuse");
    body.innerHTML = "";
    rows = setLines(s, mode).map(l => makeSpeakRow(l.en, l.ko, l.who));
    rows.forEach(r => body.appendChild(r));
    tools.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.className = "btn small"; allBtn.textContent = "🔊 전체 듣기";
    allBtn.addEventListener("click", () => speak(rows.map(r => r._en).join(" ")));
    const roleA = document.createElement("button");
    roleA.className = "btn small primary"; roleA.textContent = "🎭 내가 A (권하기)";
    const roleB = document.createElement("button");
    roleB.className = "btn small primary"; roleB.textContent = "🎭 내가 B (대답하기)";
    roleA.addEventListener("click", () => rolePlay("A", [roleA, roleB]));
    roleB.addEventListener("click", () => rolePlay("B", [roleA, roleB]));
    tools.append(allBtn, roleA, roleB);
    roleNote.textContent = "";
  }

  function rolePlay(me, btns) {
    if (playing || recBusy) return;
    if (!srSupported) { roleNote.textContent = "이 브라우저는 음성 인식을 지원하지 않아요 (Chrome 권장)"; return; }
    playing = true; btns.forEach(b => b.disabled = true);
    let i = 0;
    const step = () => {
      rows.forEach(r => r.classList.remove("turn"));
      if (i >= rows.length) {
        playing = false; btns.forEach(b => b.disabled = false);
        roleNote.textContent = "🎉 역할극 끝! 잘했어요. 다른 역할이나 No, thanks. 버전도 해 볼까요?";
        return;
      }
      const r = rows[i]; i++;
      r.classList.add("turn");
      if (r._who === me) {
        roleNote.textContent = `🎙️ 내 차례! "${r._en}" 라고 말해보세요.`;
        r._attempt(() => setTimeout(step, 500));
      } else {
        roleNote.textContent = `👂 컴퓨터(${r._who})가 말해요. 잘 들어보세요.`;
        speakThen(r._en, () => setTimeout(step, 400));
      }
    };
    step();
  }

  mAcc.addEventListener("click", () => { if (!playing) { mode = "accept"; render(); } });
  mRef.addEventListener("click", () => { if (!playing) { mode = "refuse"; render(); } });
  render();
  return card;
}

function renderPractice() {
  renderPairCards();
  const empty = document.getElementById("practice-empty");
  const list = document.getElementById("practice-list");
  list.innerHTML = "";
  const done = mySets.map((s, i) => [s, i]).filter(([s]) => setComplete(s));
  if (!done.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";
  done.forEach(([s, i]) => list.appendChild(makeSetCard(s, i)));
  if (done.length < SET_COUNT) {
    const note = document.createElement("p");
    note.className = "practice-empty";
    note.innerHTML = `아직 <b>${SET_COUNT - done.length}개</b> 음식이 비어 있어요. <b>🎒 내 식탁 만들기</b>에서 마저 만들어 보세요.`;
    list.appendChild(note);
  }
}

/* ---------- 초기 렌더 ---------- */
renderSuggestions();
renderAnswerGrid();
renderOfferFill();
renderTasteGrid();
renderTasteFill();
renderBuilder();
updateSetPreview();
renderSheetSummary();

/* ---------- 탭 전환 ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    synth.cancel();
    hidePopup();
    if (btn.dataset.tab === "practice") renderPractice();
    if (btn.dataset.tab === "build") { lastSetSpoken = ""; renderBuilder(); updateSetPreview(); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ---------- 속도 조절 ---------- */
document.getElementById("rate").addEventListener("input", e => {
  speakRate = parseFloat(e.target.value);
});
