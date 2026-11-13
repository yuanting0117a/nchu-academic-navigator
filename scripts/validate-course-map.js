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
  assert(course.courseUnit && course.eligibility, "course unit / eligibility missing: " + course.id);
}
const required = data.courses.filter(x => x.group === "專業必修");
assert.strictEqual(required.length, 20, "EE professional required courses should be 20");
assert.strictEqual(required.reduce((n, x) => n + (x.credits || 0), 0), 55, "EE professional required credits should sum to 55");
const electricalLabs = data.courses.filter(x => /^電工實驗/.test(x.name));
assert.strictEqual(electricalLabs.length, 3, "electrical labs must remain three separate courses");
assert(electricalLabs.every(x => x.credits === 1), "each electrical lab should remain one credit");
assert.strictEqual(data.generalEducation.reduce((n, x) => n + x.credits, 0), 28, "GE categories should total 28");
assert(data.generalEducationRules.humanitiesGroups.length === 5 && data.generalEducationRules.socialGroups.length === 5 && data.generalEducationRules.naturalGroups.length === 5, "GE academic groups should be complete");
assert(data.generalEducation.find(x=>x.name==="語文素養").subcategories.length === 5, "language courses should be separated");
assert(data.courses.filter(x=>x.group==="專業必修").every(x=>x.recommendedPeriod), "all required courses need recommended periods");
assert(!data.pathwayRules.categories.flatMap(x=>x.items).some(x=>x.id==="transfer"), "transfer pathway should be deferred");
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
assert(data.pathwayRules.categories.length >= 3, "degree and study pathways missing");
assert(data.pathwayRules.categories.flatMap(x=>x.items).length >= 10, "pathway coverage incomplete");
const externalPathways = JSON.parse(fs.readFileSync("data/academic-pathways-115.json", "utf8"));
assert(externalPathways.categories.flatMap(x=>x.items).length >= 10, "separate pathway data file missing or incomplete");
assert(data.courseSelectionRules.rules.length >= 4, "course selection policy details missing");
assert(data.projectGuidelines.requirements.length >= 4, "project guideline details missing");
assert(data.projectGuidelines.currentAnnouncement && data.projectGuidelines.currentAnnouncement.source, "current project announcement missing");
assert(data.sources.some(x => x.type === "official-course-selection-policy"), "course selection policy source missing");
assert(data.sources.some(x => x.type === "official-project-guideline"), "project guideline source missing");
console.log("Course map validation passed: " + data.courses.length + " courses, " + data.requirements.length + " plans, 5 program rules.");
