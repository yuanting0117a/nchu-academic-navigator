const fs = require("fs");
const assert = require("assert");
const file = "data/course-map/ee-undergraduate-114.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const ids = new Set();
const plans = new Set(data.requirements.map(x => x.id));
for (const course of data.courses) {
  assert(course.id && !ids.has(course.id), "duplicate or missing course id: " + course.id);
  ids.add(course.id);
  for (const plan of (course.plans || [])) assert(plans.has(plan), "unknown plan " + plan + " in " + course.id);
  assert(course.name && course.group && course.status, "incomplete course record: " + course.id);
}
const required = data.courses.filter(x => x.group === "專業必修");
assert.strictEqual(required.length, 20, "EE professional required courses should be 20");
assert.strictEqual(required.reduce((n, x) => n + (x.credits || 0), 0), 55, "EE professional required credits should sum to 55");
assert.strictEqual(data.generalEducation.reduce((n, x) => n + x.credits, 0), 28, "GE categories should total 28");
assert.strictEqual(data.creditStructure.total, 128, "graduation total should be 128");
assert.strictEqual(data.creditStructure.unclassifiedDifference, 18, "unclassified graduation-credit difference should remain explicit");
assert.strictEqual(data.programRules.programs.length, 5, "five EE programs required");
for (const program of data.programRules.programs) {
  assert(program.coreRequiredCount > 0 && program.coreRequiredCount <= program.coreCourses.length, "invalid core selection count: " + program.id);
  for (const name of [...program.coreCourses, ...program.relatedLabs]) {
    const course = data.courses.find(c => c.name === name);
    assert(course, "missing program core/lab course: " + program.id + " / " + name);
    assert(course.plans.includes(program.id), "course not linked to its own program: " + program.id + " / " + name);
    for (const other of data.programRules.programs) assert(course.plans.includes(other.id), "cross-program option missing: " + other.id + " / " + name);
  }
}
assert(!data.courses.some(x => x.id.startsWith("project-option-")), "unverified generated project options must not return");
assert(data.sources.every(x => x.title && /^https:\/\//.test(x.url)), "each source needs an official URL");
console.log("Course map validation passed: " + data.courses.length + " courses, " + data.requirements.length + " plans, 5 program rules.");
