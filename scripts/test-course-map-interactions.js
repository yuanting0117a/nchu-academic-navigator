const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const data = JSON.parse(fs.readFileSync("data/course-map/ee-undergraduate-114.json", "utf8"));

class MockElement {
  constructor(id = "") {
    this.id = id;
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.dataset = {};
    this.listeners = {};
    this.className = "";
    this.classes = new Set();
    this.classList = {
      add: name => this.classes.add(name),
      remove: name => this.classes.delete(name),
      contains: name => this.classes.has(name),
      toggle: (name, force) => {
        const on = force === undefined ? !this.classes.has(name) : !!force;
        if (on) this.classes.add(name); else this.classes.delete(name);
        return on;
      }
    };
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  dispatch(type, event = {}) {
    for (const fn of this.listeners[type] || []) fn({ target: this, ...event });
  }
  click() { this.dispatch("click"); }
  querySelectorAll(selector) {
    const attr = selector === "[data-plan]" ? "plan" : selector === "[data-course]" ? "course" : null;
    if (!attr) return [];
    const re = new RegExp('data-' + attr + '="([^"]+)"', "g");
    return [...this.innerHTML.matchAll(re)].map(match => {
      const el = new MockElement();
      el.dataset[attr] = match[1];
      return el;
    });
  }
}
const ids = ["searchCourse","planTiles","courseGroups","courseCount","detailBody","yearNotice","dataLoadStatus","admissionYear","importStatus"];
const elements = Object.fromEntries(ids.map(id => [id, new MockElement(id)]));
elements.admissionYear.value = "114";
const filters = ["all","required","program","lab","project"].map(value => {
  const el = new MockElement();
  el.dataset.filter = value;
  return el;
});
const document = {
  getElementById: id => elements[id] || null,
  querySelectorAll: selector => selector === "[data-filter]" ? filters : []
};
const windowListeners = {};
const window = {
  addEventListener: (type, fn) => (windowListeners[type] ||= []).push(fn),
  dispatchEvent: event => (windowListeners[event.type] || []).forEach(fn => fn(event))
};
const context = {
  document, window, localStorage: { getItem: () => "[]", setItem: () => {} },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
  fetch: async () => ({ ok: true, json: async () => data }),
  console, Set, Map, Promise
};
vm.runInNewContext(fs.readFileSync("src/course-map.js", "utf8"), context);
const tick = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  await tick();
  assert(elements.dataLoadStatus.textContent.includes("資料載入成功"), "data should load");
  assert(elements.planTiles.querySelectorAll("[data-plan]").length === data.requirements.length, "all plan tiles should render");
  assert(elements.courseGroups.querySelectorAll("[data-course]").length === data.courses.length, "all course tiles should render");
  assert(elements.courseCount.textContent === "69 / 69 項", "initial course count should be complete");

  const requiredPlan = elements.planTiles.querySelectorAll("[data-plan]").find(x => x.dataset.plan === "ee-required");
  requiredPlan.click();
  assert(elements.detailBody.innerHTML.includes("電機系專業必修"), "plan detail should render");
  assert(elements.courseGroups.innerHTML.includes('class="course-tile lit'), "selecting a plan should highlight related courses");
  assert(elements.courseGroups.innerHTML.includes('class="course-tile dim'), "unrelated courses should be dimmed");

  const calculus = elements.courseGroups.querySelectorAll("[data-course]").find(x => x.dataset.course === "req-0");
  calculus.click();
  assert(elements.detailBody.innerHTML.includes("微積分(一)"), "course detail should render");
  assert(elements.planTiles.innerHTML.includes('class="plan-tile related"'), "selecting a course should highlight related plans");

  elements.searchCourse.value = "微積分(一)";
  elements.searchCourse.dispatch("input");
  assert(elements.courseCount.textContent === "1 / 69 項", "course search should filter the tile list");

  filters.find(x => x.dataset.filter === "required").click();
  assert(elements.courseCount.textContent === "1 / 20 項", "category filter should combine with search");
  elements.searchCourse.value = "";
  elements.searchCourse.dispatch("input");
  assert(elements.courseCount.textContent === "20 / 69 項", "required filter should show 20 courses");

  elements.admissionYear.value = "115";
  elements.admissionYear.dispatch("change");
  assert(elements.yearNotice.textContent.includes("115入學適用性尚待系辦確認"), "115 year should show applicability warning");
  assert(elements.planTiles.innerHTML.includes("115適用性待確認"), "115 year status should be visible");

  console.log("Course-map interaction smoke test passed: load, plan → courses, course → plans, search, filters, and admission-year warning.");
})().catch(error => { console.error(error); process.exitCode = 1; });
