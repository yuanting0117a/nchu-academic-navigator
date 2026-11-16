const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("src/ge-self-learning.js", "utf8");
const rules = fs.readFileSync("data/school-wide-rules.md", "utf8");
const hosts = {
  geSelfLearningSummary: { innerHTML: "" },
  geSelfLearningCards: { innerHTML: "", querySelectorAll: () => [] }
};
const listeners = {};
const context = {
  document: {
    getElementById: id => hosts[id] || null,
    addEventListener: (type, callback) => { listeners[type] = callback; }
  },
  localStorage: { getItem: () => "{}", setItem: () => {}, removeItem: () => {} },
  confirm: () => true
};

vm.runInNewContext(source, context);
assert.strictEqual(typeof listeners.DOMContentLoaded, "function", "self-learning UI should register DOMContentLoaded");
listeners.DOMContentLoaded();
const html = hosts.geSelfLearningCards.innerHTML;
assert(html.includes("一般通識微型課程") && html.includes("募課通識微型課程"), "both official micro-course types should be shown");
assert(html.includes("每學期最多選修3門") && html.includes("不得重複選修"), "semester cap and no-repeat rule should be shown");
assert(html.includes("每門課以6小時為原則") && html.includes("18小時") && html.includes("最多採計3學分"), "current hours-to-credit rule should be shown");
assert(html.includes("至少15人連署") && html.includes("通識中心課程委員會審查通過"), "student-proposed course approval conditions should be shown");
assert(html.includes("https://oaa.nchu.edu.tw/upfile/file/c9c2d0722771698fbd6938c60769ddaecf81b6b0.pdf"), "official revised guideline link should be present");
assert(rules.includes("115.06.09修訂版") && rules.includes("每學期最多選修3門") && rules.includes("每滿18小時"), "school-wide rule record should include the verified current policy");
console.log("General-education micro-course rule test passed: current policy, eligibility, credit conversion, and official source link.");
