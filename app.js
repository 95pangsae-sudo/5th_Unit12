/* =========================================================
 * What are you going to do? · 앱 로직
 *  1) 발음 채점 (Node 에서도 테스트할 수 있게 DOM 없이 작성)
 *  2) 음성 합성 · 단어 뜻 풍선
 *  3) 활동 카드 탭 (초급 · 중급)
 *  4) 연습하기 탭 (나의 계획표 · 말하기 도구)
 * ========================================================= */

/* =========================================================
 * 1) 발음 채점
 * ========================================================= */
const Scoring = (() => {
  const CONTRACTIONS = {
    "i'm": "i am", "i'll": "i will", "i've": "i have", "i'd": "i would",
    "you're": "you are", "you'll": "you will", "we're": "we are", "we'll": "we will",
    "they're": "they are", "they'll": "they will", "he's": "he is", "she's": "she is",
    "it's": "it is", "that's": "that is", "what's": "what is", "there's": "there is",
    "let's": "let us", "don't": "do not", "doesn't": "does not", "didn't": "did not",
    "can't": "can not", "cannot": "can not", "won't": "will not", "isn't": "is not",
    "aren't": "are not", "wasn't": "was not", "gonna": "going to", "wanna": "want to",
    "im": "i am",
  };
  /* 동음어 → 한 단어로 통일 (목표 문장·들린 말 모두 같은 규칙) */
  const HOMOPHONES = {
    too: "to", two: "to", "2": "to", four: "for", "4": "for", fore: "for",
    eye: "i", sea: "see", right: "write", buy: "by", bye: "by", knew: "new",
    hare: "hair", there: "their", meat: "meet", dear: "deer", won: "one", "1": "one",
    son: "sun", tale: "tail", whole: "hole", flour: "flower", wood: "would",
    cafe: "cafe", café: "cafe", ok: "okay",
  };
  /* 작은 단어 (가중치 0.3) */
  const SMALL = new Set(["a", "an", "the", "to", "my", "i", "am", "at", "in", "on", "for",
    "with", "and", "of", "by", "is", "are", "some", "me", "it", "your"]);

  const W_CORE = 1, W_SMALL = 0.3, W_PROPER = 0.6;

  function stripAccents(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  /* 한 단어(표시용) → 정규화된 토큰들 */
  function wordTokens(word) {
    let w = stripAccents(String(word).toLowerCase()).replace(/[’‘`]/g, "'");
    w = w.replace(/-/g, "").replace(/[^a-z0-9' ]/g, "").trim();
    if (!w) return [];
    const exp = CONTRACTIONS[w] || w;
    return exp.split(/\s+/).map(t => t.replace(/'/g, "")).filter(Boolean);
  }
  function canon(t) { return HOMOPHONES[t] || t; }

  /* 목표 문장 → [{display, tokens:[{t, w}]}] */
  function targetWords(sentence) {
    const words = sentence.trim().split(/\s+/);
    return words.map((disp, i) => {
      const clean = disp.replace(/[^A-Za-z0-9'’-]/g, "");
      const proper = i > 0 && /^[A-Z][a-z]/.test(clean) && !/^I(['’]|$)/.test(clean);
      const toks = wordTokens(clean).map(raw => ({
        t: canon(raw),
        w: proper ? W_PROPER : (SMALL.has(raw) ? W_SMALL : W_CORE),
      }));
      return { display: disp, tokens: toks };
    }).filter(x => x.tokens.length);
  }

  /* 들린 말 → 토큰 (한 글자씩 들린 말 붙이기 포함) */
  function heardTokens(text, targetSet) {
    let raw = stripAccents(String(text || "").toLowerCase()).replace(/[’‘`]/g, "'")
      .replace(/-/g, "").replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
    // 한 글자씩 들린 말 붙이기: "p c" → "pc" (a, i 는 낱말이라 제외)
    const joined = [];
    for (let k = 0; k < raw.length; k++) {
      const t = raw[k];
      const single = /^[a-z]$/.test(t) && t !== "a" && t !== "i";
      const last = joined[joined.length - 1];
      if (single && last && last.single) { last.t += t; continue; }
      joined.push({ t, single });
    }
    // "k pop" → "kpop" 처럼 한 글자 + 다음 말이 목표 단어가 되면 붙이기
    const out = [];
    for (let k = 0; k < joined.length; k++) {
      const cur = joined[k];
      const next = joined[k + 1];
      if (cur.single && next && targetSet && targetSet.has(cur.t + next.t)) {
        out.push(cur.t + next.t); k++; continue;
      }
      out.push(cur.t);
    }
    const toks = [];
    out.forEach(t => wordTokens(t).forEach(x => toks.push(canon(x))));
    return toks;
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  /* 소리 열쇠: 자음만 통일 (모음은 그대로 → kite ≠ cat) */
  function soundKey(w) {
    return w.replace(/ph/g, "f").replace(/th/g, "s").replace(/ck/g, "k").replace(/q/g, "k")
      .replace(/x/g, "ks").replace(/c/g, "k").replace(/z/g, "s").replace(/r/g, "l")
      .replace(/f/g, "p").replace(/v/g, "b").replace(/(.)\1+/g, "$1");
  }

  /* 단어 점수 */
  function wordSim(a, b) {
    if (a === b) return 1;
    const minLen = Math.min(a.length, b.length);
    if (minLen >= 3 && lev(a, b) === 1) return 0.85;
    const ka = soundKey(a), kb = soundKey(b);
    if (ka === kb) return 0.7;
    if (minLen >= 3 && lev(ka, kb) === 1) return 0.5;
    if (minLen >= 6 && lev(a, b) <= 2) return 0.5;
    return 0;
  }

  /* 한 후보 채점: 단어 순서대로 동적 계획법 정렬 */
  function scoreOne(target, heardText) {
    const tw = targetWords(target);
    const T = [];
    tw.forEach((wd, wi) => wd.tokens.forEach(tok => T.push({ ...tok, wi })));
    const targetSet = new Set(T.map(x => x.t));
    const H = heardTokens(heardText, targetSet);
    const n = T.length, m = H.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    const sims = Array.from({ length: n }, (_, i) => H.map(h => wordSim(T[i].t, h)));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        let best = Math.max(dp[i - 1][j], dp[i][j - 1]);
        const s = sims[i - 1][j - 1];
        if (s > 0) best = Math.max(best, dp[i - 1][j - 1] + T[i - 1].w * s);
        dp[i][j] = best;
      }
    }
    // 되짚기
    const tokSim = new Array(n).fill(0);
    let matched = 0, i = n, j = m;
    const EPS = 1e-9;
    while (i > 0 && j > 0) {
      const s = sims[i - 1][j - 1];
      if (s > 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + T[i - 1].w * s)) < EPS) {
        tokSim[i - 1] = s; matched++; i--; j--;
      } else if (Math.abs(dp[i][j] - dp[i - 1][j]) < EPS) i--;
      else j--;
    }
    const total = T.reduce((a, x) => a + x.w, 0) || 1;
    const raw = dp[n][m] / total;
    const extras = m - matched;
    const penalty = Math.min(0.10, 0.03 * extras);
    const score = Math.max(0, Math.min(100, Math.round((raw - penalty) * 100)));
    const words = tw.map((wd, wi) => {
      const idx = T.map((x, k) => (x.wi === wi ? k : -1)).filter(k => k >= 0);
      const s = idx.reduce((a, k) => a + tokSim[k], 0) / idx.length;
      return { display: wd.display, sim: s, status: s >= 0.999 ? "ok" : s > 0 ? "near" : "miss",
        small: idx.every(k => T[k].w === W_SMALL) };
    });
    return { score, raw, extras, heard: heardText, words };
  }

  /* 후보 여러 개(최대 5) 중 최고 점수 */
  function score(target, candidates) {
    const list = (Array.isArray(candidates) ? candidates : [candidates]).filter(c => c && c.trim()).slice(0, 5);
    if (!list.length) return null;
    return list.map(c => scoreOne(target, c)).reduce((a, b) => (b.score > a.score ? b : a));
  }

  return { score, scoreOne, wordSim, soundKey, heardTokens, targetWords };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Scoring;

/* =========================================================
 * 2~4) 화면 (브라우저에서만)
 * ========================================================= */
if (typeof document !== "undefined") (function () {
  const LS_PLANS = "u9-plans-v1", LS_STATS = "u9-stats-v1";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ACT = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]));
  const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  const Q = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

  function load(key, def) { try { return JSON.parse(localStorage.getItem(key)) || def; } catch (e) { return def; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* 저장 불가 */ } }

  const state = {
    tab: "basic",
    q: "q1",
    filter: { basic: "all", mid: "all" },
    plans: load(LS_PLANS, {}),   // { q1: {id, level} }
    stats: load(LS_STATS, {}),   // { sentence: {count, best, sum, last} }
    records: {},                 // { q1: blobURL } (새로고침하면 사라짐)
    lastResult: {},              // { q1: 결과 }
  };
  // 저장된 계획 검증
  Object.keys(state.plans).forEach(k => { if (!Q[k] || !ACT[state.plans[k]?.id]) delete state.plans[k]; });

  /* ----- 문장 만들기 ----- */
  const qSentence = q => `What are you going to do ${Q[q].en}?`;
  const qKo = q => `${Q[q].koAt} 뭐 할 거야?`;
  const aPhrase = (act, level) => (level === "mid" ? act.mid.en : act.en);
  const aSentence = (act, level) => `I'm going to ${aPhrase(act, level)}.`;
  const aKo = (act, level) => `나는 ${level === "mid" ? act.mid.ko : act.ko} 거야.`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* =======================================================
   * 음성 합성
   * ======================================================= */
  const synth = window.speechSynthesis;
  let enVoice = null;
  function pickVoice() {
    if (!synth) return;
    const vs = synth.getVoices();
    enVoice = vs.find(v => /en[-_]US/i.test(v.lang) && /Google|Samantha|Microsoft/i.test(v.name))
      || vs.find(v => /en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
  function speak(texts, opts = {}) {
    if (!synth) return;
    synth.cancel();
    const list = Array.isArray(texts) ? texts : [texts];
    list.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "en-US"; if (enVoice) u.voice = enVoice;
      u.rate = opts.rate || 0.85;
      if (i === list.length - 1 && opts.onend) u.onend = opts.onend;
      synth.speak(u);
    });
  }

  /* =======================================================
   * 단어 뜻 풍선
   * ======================================================= */
  function wordKey(w) { return w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'-]/g, "").replace(/^'+|'+$/g, ""); }
  function clickable(sentence) {
    return sentence.split(/\s+/).map(w => {
      const k = wordKey(w);
      return DICT[k] ? `<span class="w" data-w="${esc(k)}" tabindex="0" role="button">${esc(w)}</span>` : esc(w);
    }).join(" ");
  }
  const pop = $("#word-pop");
  function showWord(el) {
    const k = el.dataset.w;
    pop.innerHTML = `<b class="en">${esc(el.textContent.replace(/[.,?!]/g, ""))}</b> <span>${esc(DICT[k])}</span> <span class="pop-say">🔊</span>`;
    pop.hidden = false;
    const r = el.getBoundingClientRect();
    const pw = pop.offsetWidth;
    let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
    left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + document.documentElement.clientWidth - pw - 8));
    pop.style.left = left + "px";
    pop.style.top = (r.top + window.scrollY - pop.offsetHeight - 10) + "px";
    speak(el.textContent.replace(/[.,?!]/g, ""), { rate: 0.8 });
  }
  document.addEventListener("click", e => {
    const w = e.target.closest(".w");
    if (w) { e.stopPropagation(); showWord(w); return; }
    if (!e.target.closest("#word-pop")) pop.hidden = true;
  });
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("w")) { e.preventDefault(); showWord(e.target); }
    if (e.key === "Escape") pop.hidden = true;
  });

  /* =======================================================
   * 그림 (없으면 이모지 타일)
   * ======================================================= */
  function picHTML(act, cls = "pic") {
    return `<div class="${cls}" data-cat="${act.cat}"><img src="${IMAGE_DIR}${act.id}${IMAGE_EXT}" alt="${esc(act.en)}" loading="lazy"
      onerror="this.parentNode.classList.add('fallback');this.remove()"><span class="emoji-tile" aria-hidden="true">${act.emoji}</span></div>`;
  }

  /* =======================================================
   * 탭
   * ======================================================= */
  function showTab(tab) {
    state.tab = tab;
    $$(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    $$(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + tab));
    pop.hidden = true;
    if (tab === "practice") renderPractice(); else renderCardTab(tab);
    window.scrollTo({ top: 0 });
  }
  $$(".tab-btn").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

  /* =======================================================
   * 활동 카드 탭 (초급 · 중급 공통)
   * ======================================================= */
  function buildCardTab(level) {
    const sec = $("#tab-" + level);
    const lvKo = level === "mid" ? "중급" : "초급";
    sec.innerHTML = `
      <div class="section-block">
        <h2>1️⃣ 질문을 골라요 <span class="count">${lvKo}</span></h2>
        <div class="q-buttons"></div>
        <div class="dialogue">
          <div class="bubble-row friend">
            <div class="who">🙋<small>친구</small></div>
            <div class="bubble">
              <div class="b-en en q-line"></div>
              <div class="b-ko qk-line"></div>
            </div>
            <button class="say q-say" title="질문 듣기">🔊</button>
          </div>
          <div class="bubble-row me">
            <button class="say a-say" title="대답 듣기">🔊</button>
            <div class="bubble">
              <div class="b-en en a-line"></div>
              <div class="b-ko a-ko"></div>
            </div>
            <div class="who">🙆<small>나</small></div>
          </div>
          <div class="dlg-actions">
            <button class="btn dlg-play">🔊 대화 듣기</button>
            <button class="btn dlg-next">다음 질문 ▶</button>
            <button class="btn primary dlg-go">🎤 연습하기로 가기</button>
          </div>
          <p class="status" aria-live="polite"></p>
        </div>
      </div>
      <div class="section-block">
        <h2>2️⃣ 할 일 고르기 <span class="count">${ACTIVITIES.length}개</span></h2>
        <p class="hint">${level === "mid"
          ? "<b>중급</b>은 누구와 · 어디서 · 무엇을 하러를 붙인 조금 긴 문장이에요."
          : "<b>초급</b>은 <b class='en'>I'm going to ___.</b> 짧은 문장이에요."} 단어를 누르면 뜻과 발음이 나와요. 카드 아래 버튼을 누르면 지금 질문의 대답이 돼요.</p>
        <div class="filters"></div>
        <div class="card-grid"></div>
      </div>`;
    sec.querySelector(".q-buttons").addEventListener("click", e => {
      const b = e.target.closest(".q-btn"); if (!b) return;
      state.q = b.dataset.q; renderCardTab(level);
      speak(qSentence(state.q));
    });
    sec.querySelector(".filters").addEventListener("click", e => {
      const b = e.target.closest(".f-btn"); if (!b) return;
      state.filter[level] = b.dataset.f; renderCardTab(level);
    });
    sec.querySelector(".q-say").addEventListener("click", () => speak(qSentence(state.q)));
    sec.querySelector(".a-say").addEventListener("click", () => {
      const p = state.plans[state.q];
      speak(p ? aSentence(ACT[p.id], p.level) : "I'm going to ...");
    });
    sec.querySelector(".dlg-play").addEventListener("click", () => speakDialogue(state.q));
    sec.querySelector(".dlg-next").addEventListener("click", () => {
      const i = QUESTIONS.findIndex(q => q.id === state.q);
      state.q = QUESTIONS[(i + 1) % QUESTIONS.length].id;
      renderCardTab(level); speak(qSentence(state.q));
    });
    sec.querySelector(".dlg-go").addEventListener("click", () => showTab("practice"));
    sec.querySelector(".card-grid").addEventListener("click", e => {
      const say = e.target.closest(".card-say");
      if (say) { const a = ACT[say.closest(".card").dataset.id]; speak(aSentence(a, level)); return; }
      const pick = e.target.closest(".pick-btn");
      if (pick) choose(pick.closest(".card").dataset.id, level);
    });
  }

  function speakDialogue(q) {
    const p = state.plans[q];
    speak(p ? [qSentence(q), aSentence(ACT[p.id], p.level)] : [qSentence(q)]);
  }

  function choose(id, level) {
    const q = state.q, cur = state.plans[q];
    let added = false;
    if (cur && cur.id === id && cur.level === level) delete state.plans[q];
    else { state.plans[q] = { id, level }; added = true; }
    save(LS_PLANS, state.plans);
    delete state.lastResult[q];
    renderCardTab(level); updateBadge();
    if (added) speakDialogue(q);
  }

  function renderCardTab(level) {
    const sec = $("#tab-" + level);
    if (!sec.firstElementChild) buildCardTab(level);
    const q = state.q, plan = state.plans[q];
    /* 질문 버튼 */
    sec.querySelector(".q-buttons").innerHTML = QUESTIONS.map((qq, i) => {
      const p = state.plans[qq.id];
      return `<button class="q-btn${qq.id === q ? " active" : ""}${p ? " done" : ""}" data-q="${qq.id}">
        <span class="q-no">Q${i + 1}</span>
        <span class="q-emoji">${qq.emoji}</span>
        <span class="q-ko">${qq.ko}</span>
        <span class="q-en en">${qq.en}</span>
        ${p ? `<span class="q-check">✓ ${ACT[p.id].emoji}</span>` : ""}
      </button>`;
    }).join("");
    /* 말풍선 */
    sec.querySelector(".q-line").innerHTML = clickable(qSentence(q));
    sec.querySelector(".qk-line").textContent = qKo(q);
    if (plan) {
      const a = ACT[plan.id], phrase = aPhrase(a, plan.level);
      sec.querySelector(".a-line").innerHTML = `${clickable("I'm going to")} <span class="filled">${clickable(phrase)}</span>.`;
      sec.querySelector(".a-ko").textContent = aKo(a, plan.level);
    } else {
      sec.querySelector(".a-line").innerHTML = `${clickable("I'm going to")} <span class="blank">______</span>.`;
      sec.querySelector(".a-ko").textContent = "나는 ______ 거야.";
    }
    const n = Object.keys(state.plans).length;
    sec.querySelector(".status").innerHTML = plan
      ? `✅ <b>${Q[q].ko}</b> 계획: ${ACT[plan.id].emoji} ${esc(ACT[plan.id].ko)} — 연습하기에 담겼어요 (${n}/5)${plan.level !== level ? ` · ${plan.level === "mid" ? "중급" : "초급"} 문장` : ""}`
      : `👇 아래 카드에서 <b>${Q[q].koAt}</b> 할 일을 골라 빈칸을 채워 보세요. (${n}/5)`;
    /* 필터 */
    const f = state.filter[level];
    const fl = [["all", "전체"], ["book", "📘 교과서 표현"], ...CATEGORIES.map(c => [c.id, `${c.emoji} ${c.ko}`]), ["rec", `⭐ ${Q[q].ko}에 어울리는 것만`]];
    sec.querySelector(".filters").innerHTML = fl.map(([k, t]) =>
      `<button class="f-btn${f === k ? " active" : ""}" data-f="${k}">${t}</button>`).join("");
    /* 카드 */
    const list = ACTIVITIES.filter(a => f === "all" || (f === "book" ? a.book : f === "rec" ? a.when.includes(q) : a.cat === f));
    sec.querySelector(".card-grid").innerHTML = list.map(a => {
      const chosen = plan && plan.id === a.id && plan.level === level;
      const other = QUESTIONS.filter(qq => qq.id !== q && state.plans[qq.id]?.id === a.id).map(qq => qq.ko);
      return `<article class="card cat-${a.cat}${chosen ? " chosen" : ""}" data-id="${a.id}">
        <div class="tags">
          <span class="tag cat">${CAT[a.cat].emoji} ${CAT[a.cat].ko}</span>
          ${a.book ? `<span class="tag book">📘 교과서</span>` : ""}
          ${a.when.includes(q) ? `<span class="tag rec">⭐ 추천</span>` : ""}
        </div>
        ${picHTML(a)}
        <div class="sentence en">${clickable(aSentence(a, level))}</div>
        <div class="ko">${esc(aKo(a, level))}</div>
        <div class="card-mid">
          <button class="say card-say" title="문장 듣기">🔊</button>
          ${other.length ? `<span class="other">📌 ${other.join(", ")} 계획</span>` : ""}
        </div>
        <button class="pick-btn${chosen ? " on" : ""}" title="${chosen ? "다시 누르면 계획에서 빠져요" : "지금 질문의 대답으로 골라요"}">${chosen ? `✔️ 골랐어요 (빼기)` : `✅ ${Q[q].koAt} 할래요`}</button>
      </article>`;
    }).join("") || `<p class="hint">이 질문에 맞는 카드가 없어요.</p>`;
  }

  function updateBadge() {
    $("#plan-count").textContent = `${Object.keys(state.plans).length}/5`;
  }

  /* =======================================================
   * 연습하기
   * ======================================================= */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const supportMsg = SR ? "" : canRecord
    ? "⚠️ 이 브라우저는 음성 인식이 안 돼서 4초 녹음만 할 수 있어요. 채점하려면 Chrome을 써 주세요."
    : "⚠️ 이 브라우저는 음성 인식·녹음을 지원하지 않아요. Chrome 권장.";

  function planSentence(q) { const p = state.plans[q]; return p ? aSentence(ACT[p.id], p.level) : null; }

  function renderSummary() {
    const recs = Object.values(state.stats);
    const count = recs.reduce((a, r) => a + r.count, 0);
    const sum = recs.reduce((a, r) => a + r.sum, 0);
    $("#sum-count").textContent = count;
    $("#sum-avg").textContent = count ? Math.round(sum / count) + "%" : "-";
    const done = QUESTIONS.filter(q => { const s = planSentence(q.id); return s && state.stats[s]?.count; }).length;
    $("#sum-done").textContent = `${done}/5`;
    $("#mic-support").textContent = supportMsg;
  }

  function statLine(sentence, q) {
    const st = state.stats[sentence];
    if (!st || !st.count) return "아직 연습 기록이 없어요";
    const now = state.lastResult[q] && state.lastResult[q].score != null ? `이번 ${state.lastResult[q].score}% · ` : "";
    return `${now}평균 ${Math.round(st.sum / st.count)}% · 최고 ${st.best}% · ${st.count}회`;
  }

  function resultHTML(r) {
    if (!r) return "";
    if (r.none) return `<div class="result none">🤔 잘 안 들렸어요. 마이크 가까이에서 다시 말해 보세요.</div>`;
    if (r.recordOnly) return `<div class="result none">🎧 녹음했어요. <b>▶ 내 목소리</b>로 들어 보세요.</div>`;
    const icon = r.score >= 85 ? "⭐" : r.score >= 60 ? "👍" : "🔁";
    const msg = r.score >= 85 ? "아주 잘했어요!" : r.score >= 60 ? "잘했어요! 조금만 더!" : "다시 한번 말해 봐요.";
    const chips = r.words.map(w => `<span class="chip ${w.status}">${esc(w.display.replace(/[.,?!]/g, ""))}</span>`).join("");
    const missed = r.words.filter(w => w.status !== "ok");
    const core = missed.filter(w => !w.small);
    const retry = (core.length ? core : missed).map(w => w.display.replace(/[.,?!]/g, ""));
    return `<div class="result">
      <div class="score-line"><span class="score-icon">${icon}</span> <b class="score">${r.score}%</b> ${msg}</div>
      <div class="chips en">${chips}</div>
      <div class="legend">🟩 맞음 · 🟨 비슷함 · 🟥 놓침</div>
      ${retry.length ? `<div class="retry">🔁 다시 들어 볼 단어: ${retry.map(w => `<button class="btn tiny say-word" data-word="${esc(w)}">🔊 ${esc(w)}</button>`).join(" ")}</div>` : ""}
      <div class="heard">컴퓨터가 들은 말: <span class="en">“${esc(r.heard)}”</span></div>
    </div>`;
  }

  function renderPractice() {
    renderSummary();
    $("#plan-list").innerHTML = QUESTIONS.map((qq, i) => {
      const p = state.plans[qq.id];
      const head = `<div class="when"><span class="q-no">Q${i + 1}</span><span class="q-emoji">${qq.emoji}</span>
        <span class="when-ko">${qq.ko}</span><span class="when-en en">${qq.en}</span></div>`;
      if (!p) {
        return `<div class="plan-row empty" data-q="${qq.id}">${head}
          <div class="plan-body">
            <div class="pl-q en">Q. ${clickable(qSentence(qq.id))}</div>
            <div class="pl-a en">A. I'm going to <span class="blank">______</span>.</div>
            <button class="btn tiny go-pick no-print" data-q="${qq.id}">🎨 활동 카드에서 골라요</button>
          </div></div>`;
      }
      const a = ACT[p.id], sent = aSentence(a, p.level);
      return `<div class="plan-row" data-q="${qq.id}">${head}
        <div class="plan-body">
          <div class="pl-q en">Q. ${clickable(qSentence(qq.id))}</div>
          <div class="pl-a en">A. ${clickable(sent)}</div>
          <div class="pl-ko">${esc(qKo(qq.id))} — ${esc(aKo(a, p.level))} <span class="lv">${p.level === "mid" ? "중급" : "초급"}</span></div>
          <div class="speak-tools no-print">
            <button class="btn mic" data-q="${qq.id}" ${!SR && !canRecord ? "disabled" : ""}>🎙️ 말하기</button>
            <button class="btn play-rec" data-q="${qq.id}" ${state.records[qq.id] ? "" : "disabled"}>▶ 내 목소리</button>
            <span class="stat-line">${!SR && !canRecord ? "Chrome 권장" : esc(statLine(sent, qq.id))}</span>
          </div>
          <div class="live no-print" hidden></div>
          <div class="result-box no-print">${resultHTML(state.lastResult[qq.id])}</div>
        </div>
        <div class="plan-side">
          ${picHTML(a, "thumb")}
          <div class="side-btns no-print">
            <button class="say pl-say" data-q="${qq.id}" title="듣기">🔊</button>
            <button class="say remove" data-q="${qq.id}" title="빼기">✕</button>
          </div>
        </div></div>`;
    }).join("");
    updateBadge();
  }

  $("#plan-list").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const q = b.dataset.q;
    if (b.classList.contains("go-pick")) { state.q = q; showTab("basic"); }
    else if (b.classList.contains("pl-say")) speakDialogue(q);
    else if (b.classList.contains("remove")) {
      delete state.plans[q]; delete state.lastResult[q]; save(LS_PLANS, state.plans); renderPractice();
    }
    else if (b.classList.contains("mic")) startSpeaking(q, b);
    else if (b.classList.contains("play-rec")) { if (state.records[q]) new Audio(state.records[q]).play().catch(() => {}); }
    else if (b.classList.contains("say-word")) speak(b.dataset.word, { rate: 0.75 });
  });

  $("#btn-clear").addEventListener("click", () => {
    if (!confirm("연습 기록(횟수·점수)을 모두 지울까요? 계획표는 그대로 남아요.")) return;
    state.stats = {}; state.lastResult = {}; save(LS_STATS, state.stats); renderPractice();
  });
  $("#btn-play-all").addEventListener("click", () => {
    const lines = [];
    QUESTIONS.forEach(qq => { const s = planSentence(qq.id); if (s) lines.push(qSentence(qq.id), s); });
    speak(lines.length ? lines : ["Choose your plans first."]);
  });
  $("#btn-print").addEventListener("click", () => { pop.hidden = true; window.print(); });

  /* ----- 말하기 (음성 인식 + 녹음 동시) ----- */
  let active = null;
  function startSpeaking(q, btn) {
    if (active) { active.stop(); return; }
    const sentence = planSentence(q); if (!sentence) return;
    if (synth) synth.cancel();
    const row = btn.closest(".plan-row");
    const live = row.querySelector(".live");
    const finals = [];
    let rec = null, recorder = null, stream = null, timer = null, ended = false, recDone = !SR;
    const chunks = [];

    btn.classList.add("rec"); btn.textContent = "⏹️ 그만";
    live.hidden = false; live.innerHTML = "👂 들리는 말: <span class='en'>…</span>";

    function finish() {
      if (ended) return; ended = true;
      clearTimeout(timer);
      try { rec && rec.stop(); } catch (e) {}
      if (recorder && recorder.state !== "inactive") recorder.stop(); else cleanupStream();
      active = null;
      let result;
      if (!SR) result = { recordOnly: true };
      else {
        result = Scoring.score(sentence, finals);
        if (!result) result = { none: true };
        else {
          const st = state.stats[sentence] || { count: 0, best: 0, sum: 0 };
          st.count++; st.sum += result.score; st.best = Math.max(st.best, result.score); st.last = result.score;
          state.stats[sentence] = st; save(LS_STATS, state.stats);
        }
      }
      state.lastResult[q] = result;
      setTimeout(renderPractice, recorder ? 250 : 0);
    }
    function cleanupStream() { if (stream) stream.getTracks().forEach(t => t.stop()); }

    active = { stop: finish };

    if (SR) {
      rec = new SR();
      rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = false;
      rec.onresult = ev => {
        let interim = "";
        for (let k = 0; k < ev.results.length; k++) {
          const res = ev.results[k];
          if (res.isFinal) {
            for (let a = 0; a < res.length && finals.length < 5; a++) {
              const t = res[a].transcript.trim(); if (t && !finals.includes(t)) finals.push(t);
            }
          } else interim += res[0].transcript;
        }
        live.innerHTML = `👂 들리는 말: <span class="en">${esc(interim || finals[0] || "…")}</span>`;
      };
      rec.onerror = ev => {
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
          live.textContent = "🚫 마이크 권한이 없어요. 주소창의 🔒에서 마이크를 허용해 주세요.";
        }
      };
      rec.onend = () => { recDone = true; finish(); };
      try { rec.start(); } catch (e) { recDone = true; }
      timer = setTimeout(finish, 9000);
    }

    if (canRecord) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
        stream = s;
        if (ended) { cleanupStream(); return; }
        recorder = new MediaRecorder(s);
        recorder.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
        recorder.onstop = () => {
          cleanupStream();
          if (chunks.length) {
            if (state.records[q]) URL.revokeObjectURL(state.records[q]);
            state.records[q] = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
            renderPractice();
          }
        };
        recorder.start();
        if (!SR) timer = setTimeout(finish, 4000);
      }).catch(() => {
        if (!SR) { live.textContent = "🚫 마이크를 쓸 수 없어요. 마이크 권한을 허용해 주세요."; ended = true; active = null;
          btn.classList.remove("rec"); btn.textContent = "🎙️ 말하기"; }
      });
    }
  }

  /* =======================================================
   * 시작
   * ======================================================= */
  // 헤더 단풍잎
  const leaves = $(".leaves");
  const LEAF = ["🍁", "🍂", "🍁", "🍂", "🍁", "🌰", "🍁", "🍂", "🍁", "🍂", "🍁", "🍂"];
  leaves.innerHTML = LEAF.map((l, i) =>
    `<span style="left:${(i * 8.3 + 2).toFixed(1)}%;animation-delay:${(i * 0.9) % 7}s;animation-duration:${7 + (i % 4)}s;font-size:${18 + (i % 3) * 6}px">${l}</span>`).join("");

  renderCardTab("basic");
  updateBadge();

  // 테스트용
  window.__app = { state, Scoring, renderPractice, showTab };
})();
