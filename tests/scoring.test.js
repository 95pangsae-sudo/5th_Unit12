/* 채점 함수 단위 테스트 : node tests/scoring.test.js */
const S = require("../app.js");
const T = "I'm going to fly a kite.";
let fail = 0;
function check(name, got, lo, hi) {
  const ok = got >= lo && got <= hi;
  if (!ok) fail++;
  console.log(`${ok ? "✅" : "❌"} ${name}: ${got} (기대 ${lo}~${hi})`);
}
const sc = (t, h) => S.score(t, h).score;
check("정확", sc(T, "I'm going to fly a kite"), 100, 100);
check("줄임말 안 쓴 말 (I am)", sc(T, "I am going to fly a kite"), 100, 100);
check("fly a cat", sc(T, "I'm going to fly a cat"), 71, 75);
check("fly a kite 만", sc(T, "fly a kite"), 53, 57);
check("순서 뒤섞임", sc(T, "kite a fly to going I'm"), 12, 16);
check("동음어 two", sc(T, "I'm going two fly a kite"), 100, 100);
check("gonna", sc(T, "I'm gonna fly a kite"), 100, 100);
check("후보 중 최고", S.score(T, ["I'm going to fly a cat", "I'm going to fly a kite"]).score, 100, 100);
check("PC 한 글자씩", sc("I'm going to go to a PC room.", "I'm going to go to a p c room"), 100, 100);
check("K-pop", sc("I'm going to go to a karaoke room to sing K-pop songs.", "I'm going to go to a karaoke room to sing k pop songs"), 100, 100);
check("지명 Jeju", sc("I'm going to go to Jeju Island.", "I'm going to go to Jeju Island"), 100, 100);
check("uncle's", sc("I'm going to dig sweet potatoes on my uncle's farm.", "I'm going to dig sweet potatoes on my uncles farm"), 100, 100);
check("덧붙인 말 감점(최대 10%)", sc(T, "um um I'm going to fly a kite yes yes yes yes"), 90, 90);
check("빈 말", S.score(T, ["", "  "]) === null ? 0 : 1, 0, 0);
check("kite≠cat 소리", S.wordSim("kite", "cat"), 0, 0);
check("th/s 소리 비슷", S.wordSim("think", "sink"), 0.7, 0.7);
check("r/l·v/b 소리 비슷", S.wordSim("river", "libel"), 0.7, 0.7);
check("1글자 차이", S.wordSim("kite", "kit"), 0.85, 0.85);
const r = S.score(T, "I'm going to fly a cat");
console.log("칩:", r.words.map(w => w.display + ":" + w.status).join(" "));
if (r.words.length !== 6 || r.words[0].display !== "I'm") { fail++; console.log("❌ I'm 한 칩"); }
console.log(fail ? `\n${fail}개 실패` : "\n모두 통과");
process.exit(fail ? 1 : 0);
