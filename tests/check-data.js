/* 데이터 점검 : node tests/check-data.js  (단어 뜻 누락 · 그림 누락 · 교과서 표현) */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = {};
new Function("ctx", fs.readFileSync(path.join(root, "data.js"), "utf8") +
  ";Object.assign(ctx,{QUESTIONS,CATEGORIES,ACTIVITIES,DICT,IMAGE_DIR,IMAGE_EXT})")(ctx);
const { QUESTIONS, CATEGORIES, ACTIVITIES, DICT, IMAGE_DIR, IMAGE_EXT } = ctx;
let fail = 0;
const sentences = [];
QUESTIONS.forEach(q => sentences.push(`What are you going to do ${q.en}?`));
ACTIVITIES.forEach(a => { sentences.push(`I'm going to ${a.en}.`, `I'm going to ${a.mid.en}.`); });
const key = w => w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'-]/g, "").replace(/^'+|'+$/g, "");
const missing = new Set();
sentences.forEach(s => s.split(/\s+/).forEach(w => { const k = key(w); if (k && !DICT[k]) missing.add(k); }));
console.log(`문장 ${sentences.length}개 · 단어 뜻 누락 ${missing.size}개`, [...missing].join(", "));
if (missing.size) fail++;
const ids = ACTIVITIES.map(a => a.id);
if (new Set(ids).size !== ids.length) { console.log("❌ id 중복"); fail++; }
const noImg = ids.filter(id => !fs.existsSync(path.join(root, IMAGE_DIR + id + IMAGE_EXT)));
console.log(`활동 ${ids.length}개 · 그림 누락 ${noImg.length}개`, noImg.join(", "));
if (noImg.length) fail++;
CATEGORIES.forEach(c => {
  const list = ACTIVITIES.filter(a => a.cat === c.id);
  const firstNonBook = list.findIndex(a => !a.book);
  const lateBook = list.findIndex((a, i) => a.book && i > firstNonBook && firstNonBook >= 0);
  console.log(`${c.emoji} ${c.ko}: ${list.length}개 (교과서 ${list.filter(a => a.book).length})`);
  if (list.length !== 12 || lateBook >= 0) { console.log("  ❌ 개수 또는 교과서 순서"); fail++; }
});
const BOOK = ["stay home", "watch a baseball game", "go camping", "clean my room", "study math", "visit my grandparents"];
BOOK.forEach(b => { const a = ACTIVITIES.find(x => x.en === b); if (!a || !a.book) { console.log("❌ 교과서 표현 없음:", b); fail++; } });
ACTIVITIES.forEach(a => a.when.forEach(q => { if (!QUESTIONS.find(x => x.id === q)) { console.log("❌ when", a.id, q); fail++; } }));
console.log(fail ? "❌ 실패" : "✅ 모두 통과");
process.exit(fail ? 1 : 0);
