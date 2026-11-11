/* 브라우저 테스트 : node tests/e2e.js  (python3 -m http.server 8123 실행 후) */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:8123/index.html";
const OUT = process.env.OUT || __dirname + "/shots";
const fs = require("fs"); fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
const ok = (c, m) => { console.log((c ? "✅ " : "❌ ") + m); if (!c) fail++; };

/* 가짜 음성 인식 : window.__fakeSay = ["후보1", "후보2", ...] */
const FAKE_SR = () => {
  window.__spoken = [];
  window.speechSynthesis.speak = u => { window.__spoken.push(u.text); };
  class FakeSR {
    start() {
      const alts = window.__fakeSay || ["I'm going to fly a kite"];
      setTimeout(() => this.onresult && this.onresult({ results: [Object.assign([{ transcript: alts[0].split(" ").slice(0, 2).join(" ") }], { isFinal: false })] }), 200);
      setTimeout(() => {
        const res = Object.assign(alts.map(t => ({ transcript: t, confidence: 0.9 })), { isFinal: true });
        this.onresult && this.onresult({ results: [res] });
      }, 900);
      setTimeout(() => this.onend && this.onend(), 1400);
    }
    stop() {}
    abort() {}
  }
  window.SpeechRecognition = FakeSR;
  window.webkitSpeechRecognition = FakeSR;
};

(async () => {
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, permissions: ["microphone"] });
  await ctx.addInitScript(FAKE_SR);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("dialog", d => d.accept());
  await page.goto(BASE);
  await page.waitForSelector("#tab-basic .card");

  // 카드 · 필터
  ok(await page.locator("#tab-basic .card").count() === 60, "초급 카드 60개");
  await page.click("#tab-basic .f-btn[data-f=book]");
  ok(await page.locator("#tab-basic .card").count() === 6, "📘 교과서 필터 6개");
  await page.click("#tab-basic .f-btn[data-f=places]");
  ok(await page.locator("#tab-basic .card").count() === 12, "장소 필터 12개");
  await page.click("#tab-basic .f-btn[data-f=rec]");
  const recN = await page.locator("#tab-basic .card").count();
  ok(recN > 0 && recN === await page.locator("#tab-basic .card .tag.rec").count(), `⭐ 추천 필터 (${recN}개, 모두 추천)`);
  await page.click("#tab-basic .f-btn[data-f=all]");

  // 단어 뜻 풍선
  await page.locator("#tab-basic .card[data-id=fly-kite] .sentence .w", { hasText: "kite" }).click();
  ok(await page.isVisible("#word-pop") && (await page.textContent("#word-pop")).includes("연"), "단어 뜻 풍선 (kite → 연)");

  // 카드 선택 → 말풍선 · 배지 · 읽어 주기
  await page.evaluate(() => (window.__spoken = []));
  await page.click("#tab-basic .card[data-id=fly-kite] .pick-btn");
  ok((await page.textContent("#tab-basic .a-line")).includes("fly a kite"), "말풍선 빈칸 채워짐");
  ok((await page.textContent("#plan-count")) === "1/5", "탭 배지 1/5");
  const spoken = await page.evaluate(() => window.__spoken);
  ok(spoken[0] === "What are you going to do this afternoon?" && spoken[1] === "I'm going to fly a kite.", "질문+대답 읽어 주기");
  ok((await page.textContent("#tab-basic .q-btn[data-q=q1]")).includes("✓"), "Q1 버튼 ✓ 표시");
  await page.screenshot({ path: OUT + "/desktop-basic.png" });

  // 같은 질문에 다른 카드 → 바뀜
  await page.click("#tab-basic .card[data-id=stay-home] .pick-btn");
  ok((await page.textContent("#tab-basic .a-line")).includes("stay home") && (await page.textContent("#plan-count")) === "1/5", "다른 카드 → 계획 바뀜");
  // 다시 누르면 빠짐
  await page.click("#tab-basic .card[data-id=stay-home] .pick-btn");
  ok((await page.textContent("#plan-count")) === "0/5", "다시 누르면 빠짐");
  await page.click("#tab-basic .card[data-id=fly-kite] .pick-btn");

  // 다음 질문 → 중급 탭에서 고르기 (공유)
  await page.click("#tab-basic .dlg-next");
  ok(await page.locator("#tab-basic .q-btn.active[data-q=q2]").count() === 1, "다음 질문 ▶ → Q2");
  await page.click(".tab-btn[data-tab=mid]");
  ok(await page.isVisible("#tab-mid .card"), "중급 탭 전환");
  ok(await page.locator("#tab-mid .q-btn.active[data-q=q2]").count() === 1, "질문 선택이 중급에도 공유");
  await page.click("#tab-mid .card[data-id=watch-baseball] .pick-btn");
  ok((await page.textContent("#tab-mid .a-line")).includes("with my dad at the stadium"), "중급 문장으로 대답");
  ok((await page.textContent("#plan-count")) === "2/5", "배지 2/5 (초급+중급 공유)");
  await page.click("#tab-mid .q-btn[data-q=q1]");
  ok((await page.textContent("#tab-mid .a-line")).includes("fly a kite") && (await page.textContent("#tab-mid .q-btn[data-q=q1]")).includes("✓"), "초급에서 고른 Q1 계획이 중급 탭에도 보임");
  await page.screenshot({ path: OUT + "/desktop-mid.png" });

  // 연습하기
  await page.click("#tab-mid .dlg-go");
  ok(await page.isVisible("#tab-practice"), "🎤 연습하기로 가기");
  ok(await page.locator(".plan-row:not(.empty)").count() === 2, "계획표 2줄");
  ok(await page.locator(".plan-row.empty").count() === 3, "빈 줄 3개");
  ok((await page.textContent(".plan-row[data-q=q1] .pl-a")).includes("I'm going to fly a kite."), "Q1 대답 문장");
  ok(await page.locator(".plan-row[data-q=q1] .thumb img").count() === 1, "썸네일");

  // 말하기 (가짜 인식 + 가짜 마이크)
  await page.evaluate(() => (window.__fakeSay = ["I'm going to fly a cat", "I'm going to fly a kite"]));
  await page.click(".plan-row[data-q=q1] .mic");
  await page.waitForSelector(".plan-row[data-q=q1] .live:not([hidden])");
  await page.waitForSelector(".plan-row[data-q=q1] .score", { timeout: 5000 });
  ok((await page.textContent(".plan-row[data-q=q1] .score")) === "100%", "후보 5개 중 최고 점수 (100%)");
  await page.waitForSelector(".plan-row[data-q=q1] .play-rec:not([disabled])", { timeout: 5000 });
  ok(true, "녹음 → ▶ 내 목소리 활성화");
  const played = await page.evaluate(async () => {
    const url = window.__app.state.records.q1;
    const a = new Audio(url); await a.play(); return !!url && !a.paused || a.ended;
  }).catch(e => String(e));
  ok(played === true, "녹음 재생됨 " + (played === true ? "" : played));
  await page.evaluate(() => (window.__fakeSay = ["I'm going to fly a cat"]));
  await page.click(".plan-row[data-q=q1] .mic");
  await page.waitForFunction(() => document.querySelector(".plan-row[data-q=q1] .score")?.textContent === "73%", null, { timeout: 5000 });
  ok(true, "fly a cat → 73%");
  const stat = await page.textContent(".plan-row[data-q=q1] .stat-line");
  ok(stat.includes("이번 73%") && stat.includes("평균 87%") && stat.includes("최고 100%") && stat.includes("2회"), "이번·평균·최고·횟수: " + stat);
  ok(await page.locator(".plan-row[data-q=q1] .chip.miss").count() === 1, "🟥 놓친 단어 칩 (kite)");
  ok((await page.textContent(".plan-row[data-q=q1] .retry")).includes("kite"), "🔁 다시 들어 볼 단어: kite");
  ok((await page.textContent(".plan-row[data-q=q1] .heard")).includes("fly a cat"), "컴퓨터가 들은 말");
  ok((await page.textContent("#sum-count")) === "2" && (await page.textContent("#sum-avg")) === "87%" && (await page.textContent("#sum-done")) === "1/5", "요약: 2회 · 87% · 1/5");
  await page.reload();
  await page.click(".tab-btn[data-tab=practice]");
  ok((await page.textContent("#sum-count")) === "2" && (await page.textContent("#plan-count")) === "2/5", "새로고침 후 기록·계획 유지 (localStorage)");
  await page.screenshot({ path: OUT + "/desktop-practice.png", fullPage: true });

  // 인쇄 : 버튼 → print 호출 · 인쇄 화면엔 계획표만
  await page.evaluate(() => { window.__printed = 0; window.print = () => window.__printed++; });
  await page.click("#btn-print");
  ok(await page.evaluate(() => window.__printed) === 1, "🖨️ 인쇄 버튼");
  await page.emulateMedia({ media: "print" });
  ok(!(await page.isVisible(".tabs")) && !(await page.isVisible(".summary-block")) && !(await page.isVisible(".mic")) && await page.isVisible(".plan-list"), "인쇄 화면: 계획표만 (버튼·마이크 숨김)");
  await page.pdf({ path: OUT + "/print.pdf" }).catch(() => {});
  await page.emulateMedia({ media: "screen" });

  // 기록 지우기 · ✕ 빼기
  await page.click("#btn-clear");
  ok((await page.textContent("#sum-count")) === "0" && (await page.textContent("#sum-avg")) === "-", "🧹 기록 지우기");
  await page.click(".plan-row[data-q=q2] .remove");
  ok((await page.textContent("#plan-count")) === "1/5" && await page.locator(".plan-row.empty").count() === 4, "✕ 빼기");
  await page.click(".plan-row[data-q=q2] .go-pick");
  ok(await page.locator("#tab-basic.active .q-btn.active[data-q=q2]").count() === 1, "빈 줄 → 활동 카드에서 골라요 (Q2 선택됨)");

  // 그림 로드 확인
  const broken = await page.evaluate(() => [...document.querySelectorAll("#tab-basic .pic.fallback")].map(p => p.closest(".card").dataset.id));
  console.log("   이모지 대체된 카드:", broken.length ? broken.join(", ") : "없음");

  // 테스트 환경에서 외부 글꼴(CDN) 접속이 막혀 생기는 오류는 제외
  const real = errors.filter(e => !/ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/.test(e));
  ok(real.length === 0, "콘솔 오류 0 " + real.slice(0, 5).join(" | "));

  // 휴대폰 390px
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await m.addInitScript(FAKE_SR);
  const mp = await m.newPage();
  await mp.goto(BASE);
  await mp.waitForSelector("#tab-basic .card");
  await mp.click("#tab-basic .card[data-id=pc-room] .pick-btn");
  const sw = async () => mp.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  let [w1, c1] = await sw(); ok(w1 <= c1, `휴대폰 초급: 가로 스크롤 없음 (${w1}/${c1})`);
  const tabH = await mp.evaluate(() => [...document.querySelectorAll(".tab-btn")].map(b => b.getBoundingClientRect().height));
  ok(tabH.every(h => h < 44), "휴대폰 탭 한 줄 " + tabH.join(","));
  ok((await mp.textContent(".tab-btn[data-tab=basic]")).trim().startsWith("초급 카드") || await mp.isVisible(".tab-btn[data-tab=basic] .short"), "짧은 탭 이름");
  await mp.screenshot({ path: OUT + "/mobile-basic.png" });
  await mp.click(".tab-btn[data-tab=mid]");
  [w1, c1] = await sw(); ok(w1 <= c1, `휴대폰 중급: 가로 스크롤 없음 (${w1}/${c1})`);
  await mp.screenshot({ path: OUT + "/mobile-mid.png" });
  await mp.click(".tab-btn[data-tab=practice]");
  await mp.click(".plan-row[data-q=q1] .mic");
  await mp.waitForSelector(".plan-row[data-q=q1] .score", { timeout: 5000 }).catch(() => {});
  [w1, c1] = await sw(); ok(w1 <= c1, `휴대폰 연습하기: 가로 스크롤 없음 (${w1}/${c1})`);
  await mp.screenshot({ path: OUT + "/mobile-practice.png", fullPage: true });

  // 음성 인식 없는 브라우저 → 4초 녹음만
  const nc = await browser.newContext({ viewport: { width: 1200, height: 900 }, permissions: ["microphone"] });
  await nc.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined }); });
  const np = await nc.newPage();
  await np.goto(BASE);
  await np.click("#tab-basic .card[data-id=fly-kite] .pick-btn");
  await np.click(".tab-btn[data-tab=practice]");
  ok((await np.textContent("#mic-support")).includes("4초"), "인식 없음 → 녹음만 안내");
  await np.click(".plan-row[data-q=q1] .mic");
  await np.waitForSelector(".plan-row[data-q=q1] .play-rec:not([disabled])", { timeout: 8000 }).then(() => ok(true, "4초 녹음 후 ▶ 내 목소리")).catch(() => ok(false, "4초 녹음"));

  await browser.close();
  console.log(fail ? `\n❌ ${fail}개 실패` : "\n✅ 모두 통과");
  process.exit(fail ? 1 : 0);
})();
