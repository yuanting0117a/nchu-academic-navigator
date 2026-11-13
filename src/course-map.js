(function(){
const $=id=>document.getElementById(id);
const DATA_URL="data/course-map/ee-undergraduate-114.json";
let data=null,pathwayData=null,selectedPlan=null,selectedCourse=null,filter="all",query="",admissionYear="114",imported=[],myCourses=[],showOnlyMyCourses=false,departmentFilter="";
try{myCourses=JSON.parse(localStorage.getItem("nchu-my-courses-v1")||"[]")}catch(e){myCourses=[]}
const myCourseSet=()=>new Set(myCourses);
function toggleMyCourse(id){myCourses=myCourses.includes(id)?myCourses.filter(x=>x!==id):[...myCourses,id];localStorage.setItem("nchu-my-courses-v1",JSON.stringify(myCourses));render();}
function clearMyCourses(){myCourses=[];localStorage.setItem("nchu-my-courses-v1","[]");showOnlyMyCourses=false;render();}
function renderMyCourseSummary(){const courses=allCourses().filter(c=>myCourses.includes(c.id));const credits=courses.reduce((n,c)=>n+(Number.isFinite(Number(c.credits))?Number(c.credits):0),0);const unknown=courses.filter(c=>c.credits===null||c.credits===undefined||c.credits==="").length;$("myCourseCount").textContent=courses.length+" 門";$("myCourseCredits").textContent=credits+" 學分"+(unknown?"（另有 "+unknown+" 門學分待確認）":"");$("showMyCourses").classList.toggle("active",showOnlyMyCourses);$("showMyCourses").textContent=showOnlyMyCourses?"顯示全部課程":"只看我的修課";$("clearMyCourses").disabled=!myCourses.length;}
try{imported=JSON.parse(localStorage.getItem("nchu-course-map-imports-v1")||"[]")}catch(e){}
function allCourses(){return (data?.courses||[]).concat(imported)}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sourceByTitle=title=>(data.sources||[]).find(s=>s.title===title);
function eligibilityLabel(c){if(c.group==="當期開課（官方匯入）"){const dept=c.dept||c.department||"";if(dept.includes("電機"))return "本系當期開課 · 依班級／選課階段確認";if(c.eligibilityStatus==="has-external-quota")return "外系名額 "+c.externalSeats+" · 仍須核對餘額與選課限制";if(c.eligibilityStatus==="no-external-quota")return "未配置外系名額 · 不保證可加選";return "外系／全校課程 · 外系名額未提供，資格待查";}return c.eligibility||"依開課單位及當期選課限制確認";}
function statusLabel(s){return s==="verified"?"規則已核實":s==="verified-partial"?"部分核實":"待確認"}
function effectiveStatus(s){return admissionYear==="115"?"pending":s}
function courseStatus(c){return admissionYear==="115"?"115適用性待確認":c.status==="verified"?"規則已核實":c.group==="當期開課（官方匯入）"?"採計待核實":"細項待確認"}
function planById(id){return data.requirements.find(p=>p.id===id)}
function setSelection(type,id){
 if(type==="plan"){selectedPlan=selectedPlan===id?null:id;selectedCourse=null}
 else{selectedCourse=selectedCourse===id?null:id;selectedPlan=null}
 render();
}
function renderPlans(){
 const host=$("planTiles");
 host.innerHTML=data.requirements.map(p=>{
  const related=selectedCourse&&allCourses().find(c=>c.id===selectedCourse)?.plans.includes(p.id);
  const active=selectedPlan===p.id;
  const status=effectiveStatus(p.status);
  return '<button class="plan-tile '+(active?"active ":"")+(related?"related":"")+'" data-plan="'+esc(p.id)+'"><div class="plan-top"><span class="plan-name">'+esc(p.name)+'</span><span class="plan-credits">'+(p.credits===undefined?"":p.credits+" 學分")+'</span></div><div class="plan-desc">'+esc(p.description)+'</div><div style="margin-top:8px"><span class="status '+(status==="verified"?"ok":"pending")+'">'+(admissionYear==="115"?"115適用性待確認":statusLabel(p.status))+'</span></div></button>'
 }).join("");
 host.querySelectorAll("[data-plan]").forEach(b=>b.addEventListener("click",()=>setSelection("plan",b.dataset.plan)));
}
function courseVisible(c){
 const q=query.trim().toLowerCase();
 const text=(c.name+" "+c.group+" "+(c.source||"")+" "+(c.courseNo||"")+" "+(c.dept||"")+" "+(c.teacher||"")+" "+(c.aliases||[]).join(" ")+" "+(c.categoryLabel||"")+" "+(c.requiredType||"")+" "+(c.section||"")).toLowerCase();
 const typeOk=filter==="all"||(filter==="required"&&c.group==="專業必修")||(filter==="program"&&c.group.includes("學程"))||(filter==="lab"&&c.group==="專業實驗")||(filter==="project"&&c.group.includes("畢業專題"))||(filter==="external"&&c.group==="當期開課（官方匯入）"&&!(c.dept||"").includes("電機"));
 return typeOk&&(!q||text.includes(q));
}
function renderCourses(){
 const host=$("courseGroups");
 const courses=allCourses();
 const deptSelect=$("departmentFilter");
 const departments=[...new Set(courses.filter(c=>c.group==="當期開課（官方匯入）"&&c.category!=="general").map(c=>c.dept||"開課單位待確認"))].sort((a,b)=>a.localeCompare(b,"zh-Hant"));
 if(deptSelect){
  const current=departmentFilter;
  deptSelect.innerHTML='<option value="">所有開課系所</option>'+departments.map(d=>'<option value="'+esc(d)+'">'+esc(d)+'</option>').join("");
  deptSelect.value=departments.includes(current)?current:"";
  departmentFilter=deptSelect.value;
 }
 const visible=courses.filter(c=>{
  const nonGeneral=c.group!=="當期開課（官方匯入）"||c.category!=="general";
  const dept=(c.dept||"開課單位待確認");
  const deptOk=!departmentFilter||(c.group==="當期開課（官方匯入）"&&c.category!=="general"&&dept===departmentFilter);
  return nonGeneral&&deptOk&&courseVisible(c)&&(!showOnlyMyCourses||myCourses.includes(c.id));
 });
 $("courseCount").textContent=visible.length+" / "+courses.length+" 項（排除通識匯入）";
 renderMyCourseSummary();
 if(!visible.length){host.innerHTML='<div class="empty-state">目前沒有符合條件的課程。若尚未匯入官方系所課程資料，請先從下方匯入各系所課程 Excel／CSV。</div>';return}
 const groupKey=c=>c.group==="當期開課（官方匯入）"&&c.category!=="general"?"開課系所｜"+(c.dept||"開課單位待確認"):c.group;
 const groups=[...new Set(visible.map(groupKey))].sort((a,b)=>{
  const importedA=a.startsWith("開課系所｜"), importedB=b.startsWith("開課系所｜");
  if(importedA&&importedB)return a.localeCompare(b,"zh-Hant");
  if(importedA)return 1;if(importedB)return -1;return a.localeCompare(b,"zh-Hant");
 });
 host.innerHTML=groups.map(g=>{
  const items=visible.filter(c=>groupKey(c)===g);if(!items.length)return "";
  return '<section class="course-group"><div class="group-head"><h3>'+esc(g)+'</h3><small>'+items.length+' 項</small></div><div class="course-tiles">'+items.map(c=>{
   const selected=selectedCourse===c.id;
   const mine=myCourses.includes(c.id);
   const related=selectedPlan&&c.plans.includes(selectedPlan);
   const dim=selectedPlan&&!related;
   return '<div class="course-card '+(mine?"in-my-courses":"")+'"><button class="course-tile '+(selected?"active ":"")+(related?"lit ":"")+(dim?"dim":"")+(mine?" mine ":"")+'" data-course="'+esc(c.id)+'"><span class="course-name">'+esc(c.name)+'</span><span class="course-eligibility">'+esc(eligibilityLabel(c))+'</span><span class="course-meta"><small>'+(c.credits===null?"學分依開課資料":c.credits+" 學分")+'</small><span class="tiny-status">'+(c.categoryLabel?esc(c.categoryLabel)+" · ":"")+(admissionYear==="115"?"年度待確認":c.status==="verified"?"已核實":c.group==="當期開課（官方匯入）"?"採計待核":"細項待核")+'</span></span></button><button type="button" class="course-add '+(mine?"added":"")+'" data-toggle-course="'+esc(c.id)+'" aria-pressed="'+mine+'">'+(mine?"✓ 已加入我的修課":"＋ 加入修課規劃")+'</button></div>'
  }).join("")+'</div></section>'
 }).join("");
 host.querySelectorAll("[data-course]").forEach(b=>b.addEventListener("click",()=>setSelection("course",b.dataset.course)));
 host.querySelectorAll("[data-toggle-course]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();toggleMyCourse(b.dataset.toggleCourse)}));
}
function renderDetail(){
 const host=$("detailBody");
 if(selectedCourse){
  const c=allCourses().find(x=>x.id===selectedCourse);if(!c)return;
  const related=c.plans.map(planById).filter(Boolean);
  const official=c.group==="當期開課（官方匯入）"?data.sources[3]:c.group.includes("畢業專題")?data.sources[6]:(c.group==="專業必修"?data.sources[0]:data.sources[2]);
  const meta=[c.courseNo?"課號 "+c.courseNo:"",c.dept?"開課單位 "+c.dept:"",c.term?"學期 "+c.term:"",c.categoryLabel?"分類 "+c.categoryLabel:"",c.requiredType?"必選別 "+c.requiredType:"",c.section?"班別 "+c.section:"",c.room?"教室 "+c.room:"",c.teacher?"教師 "+c.teacher:""].filter(Boolean).join(" · ");
  
const pending=c.group==="當期開課（官方匯入）"||c.status!=="verified";
  const eligibility=eligibilityLabel(c);
  const isProject=c.group.includes("畢業專題");
  const guidance=isProject?data.projectGuidelines:((c.group==="專業必修"||c.group.includes("學程")||c.group==="專業實驗")?data.courseSelectionRules:null);
  const guidanceSource=isProject?data.sources.find(x=>x.type==="official-project-guideline"):data.sources.find(x=>x.type==="official-course-selection-policy");
  const announcement= isProject?data.projectGuidelines.currentAnnouncement:null;
  const announcementSource=data.sources.find(x=>x.type==="official-project-term-announcement");
  const announcementHtml=announcement?'<div class="project-announcement"><b>'+esc(announcement.term)+' 專題(一)申請公告時程</b><p>公告日期：'+esc(announcement.published)+'<br>申請截止：'+esc(announcement.applicationDeadline)+'<br>核定結果公告：'+esc(announcement.resultAnnouncementDeadline)+'<br>網路初選：'+esc(announcement.courseSelectionWindow)+'</p><small>'+esc(announcement.note)+'</small><div class="detail-links"><a href="'+esc(announcementSource.url)+'" target="_blank" rel="noopener">查看該學期公告 ↗</a></div></div>':"";
  const guidanceHtml=guidance?'<section class="rule-section"><h4>下一步／選課注意</h4><ul class="guidance-list">'+(isProject?guidance.requirements:guidance.rules).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><p class="rule-note warning">'+esc(guidance.nextStep)+'</p>'+announcementHtml+'<div class="detail-links"><a href="'+esc(guidanceSource.url)+'" target="_blank" rel="noopener">查看官方規定全文 ↗</a></div></section>':"";
  host.innerHTML='<div><div class="detail-kicker">SELECTED COURSE</div><h3>'+esc(c.name)+'</h3><span class="status '+(admissionYear==="115"||pending?"pending":"ok")+'">'+esc(courseStatus(c))+'</span><div class="detail-stats"><div class="detail-stat"><small>類別</small><b>'+esc(c.group)+'</b></div><div class="detail-stat"><small>學分</small><b>'+(c.credits===null?"依實際開課資料":c.credits+" 學分")+'</b></div></div><p>'+esc(c.source||"官方課程規劃")+(meta?"；"+esc(meta):"")+(related.length?"。方案連結僅表示規則或課程規劃關聯，不代表自動認列。":"。尚無已核實的畢業採計對照，不會自動計入學分。")+'</p>'+(c.recommendedPeriod?'<div class="course-period"><b>建議修課學期：</b>'+esc(c.recommendedPeriod)+'</div>':"")+(c.creditNote?'<div class="course-credit-note">'+esc(c.creditNote)+'</div>':"")+guidanceHtml+'</div><div><b style="font-size:11px">關聯方案／課程規定</b><div class="related-list">'+(related.length?related.map(p=>'<div class="related-row"><span>'+esc(p.name)+'</span><span class="status pending">'+(admissionYear==="115"?"年度待確認":statusLabel(p.status))+'</span></div>').join(""):'<p class="notice">尚無已核實的方案對照。請勿將這門課自動計入畢業學分。</p>')+'</div><div class="detail-links"><a href="'+esc(official.url)+'" target="_blank" rel="noopener">查看對應官方依據 ↗</a><a href="'+esc(data.sources[3].url)+'" target="_blank" rel="noopener">查詢當學期實際開課 ↗</a></div></div>';
 }else if(selectedPlan){
  const p=planById(selectedPlan);if(!p)return;
  const items=allCourses().filter(c=>c.plans.includes(p.id));
  const planSource=p.id==="ee-minor"?data.sources[4]:p.id==="ee-double"?data.sources[5]:p.id==="ee-cross"?data.sources[0]:p.id==="project"?data.sources[0]:data.sources[0];
  const program=data.programRules?.programs?.find(x=>x.id===p.id);
  let extra="";
  if(program){
   const chips=program.coreCourses.map(n=>'<span class="rule-chip">'+esc(n)+'</span>').join("");
   const labs=program.relatedLabs.map(n=>'<span class="rule-chip lab">'+esc(n)+'</span>').join("");
   const electives=program.otherCourses.map(n=>'<span class="rule-chip optional">'+esc(n)+'</span>').join("");
   const crossPrograms=data.programRules.programs.filter(x=>x.id!==program.id);
   const crossCore=crossPrograms.map(x=>'<div class="cross-program-group"><b>'+esc(x.name)+' · 任選1門</b><div class="rule-chips">'+x.coreCourses.map(n=>'<span class="rule-chip optional">'+esc(n)+'</span>').join("")+'</div></div>').join("");
   const crossLabs=crossPrograms.map(x=>'<div class="cross-program-group"><b>'+esc(x.name)+'</b><div class="rule-chips">'+x.relatedLabs.map(n=>'<span class="rule-chip lab">'+esc(n)+'</span>').join("")+'</div></div>').join("");
   extra='<section class="rule-section"><h4>核心課程要求</h4><p class="rule-note"><b>'+esc(program.coreChoiceLabel)+'</b> · '+program.coreRequiredCount+' / '+program.coreCourses.length+' 門</p><div class="rule-chips">'+chips+'</div><h4>相關實驗</h4><div class="rule-chips">'+labs+'</div><h4>系網另列專業課程</h4><div class="rule-chips">'+electives+'</div><p class="rule-note">核心課程以114學年度畢業條件明細表為準；其他課程是系網學程介紹列出的課程，不等於全部都是核心課程。</p></section><section class="rule-section"><h4>其他四個學程：各選1門核心課程</h4><p class="rule-note">'+esc(data.programRules.crossProgramRequirement)+'</p>'+crossCore+'<h4>另一個學程的實驗</h4>'+crossLabs+'<p class="rule-note">'+esc(data.programRules.labRequirement)+'</p><p class="rule-note warning">'+esc(data.programRules.interpretation)+'</p></section>';
  }
  const ge=p.id==="general"?'<section class="rule-section"><h4>通識28學分結構（114學年度起入學）</h4><div class="ge-credit-summary"><div><b>28</b><small>總學分</small></div><div><b>3+</b><small>核心素養</small></div><div><b>10</b><small>電機系語文</small></div><div><b>10+</b><small>領域素養</small></div></div><p class="rule-note">校級語文素養最低8學分；電機系畢業條件要求本國語文4＋外國語文6，共10學分。核心、語文、領域最低額度合計23，仍須再補至少5學分至28。</p>'+data.generalEducation.map(g=>'<details class="ge-category" open><summary><b>'+esc(g.name)+'</b><span>'+g.credits+' 學分 · 至少 '+g.minimum+'</span></summary><p>'+esc(g.detail)+'</p>'+(g.subcategories&&g.subcategories.length?'<div class="ge-subcategories">'+g.subcategories.map(x=>'<div class="ge-subcategory"><b>'+esc(x.name)+'</b><span>'+(x.credits===null?"學分依課程":x.credits+" 學分")+'</span><small>'+esc(x.requiredFor||"")+'</small>'+(x.counting?'<small>'+esc(x.counting)+'</small>':"")+(x.groups?'<small>學群：'+esc(x.groups.join("、"))+'</small>':"")+'</div>').join("")+'</div>':"")+'</details>').join("")+'<h4>通識修課規則</h4><ul class="guidance-list">'+data.generalEducationRules.domainRules.concat(data.generalEducationRules.notes).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><div class="detail-links">'+data.generalEducationRules.sources.map((u,i)=>'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+["通識修習須知","通識課程分類實施要點","通識課綱總覽"][i]+' ↗</a>').join("")+'</div></section>':"";
  const total=p.id==="graduation-total"?'<section class="rule-section"><h4>目前可直接核對的學分</h4><div class="credit-equation"><span>系必修 55</span><span>＋ 系選修 27</span><span>＋ 通識 28</span><b>＝ 110 / 128</b></div><div class="credit-gap"><strong>18 學分差額待確認</strong><p>'+esc(data.creditStructure.note)+'</p></div></section>':"";
  const projectPlanExtra=p.id==="project"?'<section class="rule-section"><h4>專題實作流程</h4><ul class="guidance-list">'+data.projectGuidelines.requirements.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><p class="rule-note warning">'+esc(data.projectGuidelines.nextStep)+'</p><div class="project-announcement"><b>'+esc(data.projectGuidelines.currentAnnouncement.term)+' 專題(一)公告時程</b><p>申請截止：'+esc(data.projectGuidelines.currentAnnouncement.applicationDeadline)+'<br>核定結果公告：'+esc(data.projectGuidelines.currentAnnouncement.resultAnnouncementDeadline)+'<br>網路初選：'+esc(data.projectGuidelines.currentAnnouncement.courseSelectionWindow)+'</p><small>'+esc(data.projectGuidelines.currentAnnouncement.note)+'</small><div class="detail-links"><a href="'+esc(data.projectGuidelines.currentAnnouncement.source)+'" target="_blank" rel="noopener">查看當期專題公告 ↗</a></div></div></section>':"";
  const selectionPlanExtra=(p.id==="ee-required"||p.id==="ee-elective")?'<section class="rule-section"><h4>選課與抵認注意事項</h4><ul class="guidance-list">'+data.courseSelectionRules.rules.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><p class="rule-note warning">'+esc(data.courseSelectionRules.nextStep)+'</p><div class="detail-links"><a href="'+esc(data.sources.find(x=>x.type==="official-course-selection-policy").url)+'" target="_blank" rel="noopener">查看官方選課／重修規定 ↗</a></div></section>':"";
  const note=p.id==="ee-minor"?'<div class="notice">輔系明確要求本系專業必修至少55學分；若與原主修必修重疊，須以本系選修補足。這裡不把一般專業選修直接判定為可認列。</div>':p.id==="ee-double"?'<div class="notice">雙主修依核准修讀年度的畢業條件，需完成本系全部專業必修、專業選修及畢業專題。下列課程僅供候選查詢，專業選修認列仍須依系上審核。</div>':p.id==="ee-cross"?'<div class="notice">跨域課程與主修、雙主修、輔系或其他跨域專長重複時，須由開課系／學院指定相關選修補足；目前尚未取得完整模組課程表。</div>':"";
  host.innerHTML='<div><div class="detail-kicker">SELECTED PLAN</div><h3>'+esc(p.name)+'</h3><span class="status '+(admissionYear==="115"||p.status!=="verified"?"pending":"ok")+'">'+(admissionYear==="115"?"115適用性待確認":statusLabel(p.status))+'</span><div class="detail-stats"><div class="detail-stat"><small>規定學分</small><b>'+(p.credits===undefined?"依規定":p.credits+" 學分")+'</b></div><div class="detail-stat"><small>關聯項目</small><b>'+items.length+' 項</b></div></div><p>'+esc(p.description)+'</p>'+note+total+ge+extra+projectPlanExtra+selectionPlanExtra+'</div><div><b style="font-size:11px">關聯課程與規定項目</b><div class="related-list">'+(items.length?items.map(c=>'<div class="related-row"><span>'+esc(c.name)+'</span><span class="status pending">'+(admissionYear==="115"?"年度待確認":c.status==="verified"?"規則已核實":"候選／細項待核")+'</span></div>').join(""):'<p class="notice">尚未整理可直接連結的課程清單。這不代表沒有課程，請以官方規定及當期開課資料為準。</p>')+'</div><div class="detail-links"><a href="'+esc(planSource.url)+'" target="_blank" rel="noopener">查看方案官方依據 ↗</a><a href="'+esc(data.sources[1].url)+'" target="_blank" rel="noopener">查看系上課程規劃 ↗</a><a href="'+esc(data.sources[2].url)+'" target="_blank" rel="noopener">查看五大學程課程介紹 ↗</a></div></div>';
 }else{
  host.innerHTML='<div class="detail-empty">點選左側任一學分方案，相關課程就會亮起。<br>也可以直接點選中央任一課程，反向查看它連結到哪些方案。<br><br>右側會顯示學分、核心課程選擇規則、跨學程要求、適用年度與官方來源。</div>';
 }
}

function renderPathways(){
 const host=$("pathwayGroups");if(!host||!pathwayData)return;
 host.innerHTML=pathwayData.categories.map(cat=>'<section class="pathway-category"><h3>'+esc(cat.name)+'</h3><div class="pathway-grid">'+cat.items.map(item=>'<details class="pathway-card"><summary><b>'+esc(item.name)+'</b><small>'+esc(item.award)+'</small></summary><div class="pathway-content"><p>'+esc(item.eligibility)+'</p><ul>'+item.requirements.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><span class="pathway-status">'+esc(item.status)+'</span></div></details>').join("")+'</div></section>').join("");
}
function render(){
 renderPlans();renderCourses();renderDetail();renderMyCourseSummary();renderPathways();
 $("yearNotice").textContent=admissionYear==="114"?"目前以114學年度起入學版本判讀。":"電機系目前可核實的明細表為114學年度起版本；115入學適用性尚待系辦確認，因此不會自動判定符合。";
}
$("searchCourse").addEventListener("input",e=>{query=e.target.value;renderCourses()});
const departmentFilterControl=$("departmentFilter");if(departmentFilterControl)departmentFilterControl.addEventListener("change",e=>{departmentFilter=e.target.value;renderCourses()});
$("showMyCourses").addEventListener("click",()=>{showOnlyMyCourses=!showOnlyMyCourses;renderCourses()});
$("clearMyCourses").addEventListener("click",clearMyCourses);
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderCourses()}));
$("admissionYear").addEventListener("change",e=>{admissionYear=e.target.value;render()});
window.addEventListener("nchu-import-courses",e=>{imported=e.detail||[];localStorage.setItem("nchu-course-map-imports-v1",JSON.stringify(imported));selectedPlan=null;selectedCourse=null;render();$("importStatus").textContent="本機已保存 "+imported.length+" 筆官方匯入課程；採計關係待核實。";$("dataLoadStatus").textContent="資料載入成功 · "+data.courses.length+" 個規劃項目 · 已匯入 "+imported.length+" 筆";});
Promise.all([fetch(DATA_URL).then(r=>{if(!r.ok)throw new Error("課程資料讀取失敗（"+r.status+"）");return r.json()}),fetch("data/academic-pathways-115.json").then(r=>{if(!r.ok)throw new Error("學位路徑資料讀取失敗（"+r.status+"）");return r.json()})]).then(([d,p])=>{data=d;pathwayData=p;render();$("dataLoadStatus").textContent="資料載入成功 · "+d.courses.length+" 個規劃項目"+(imported.length?" · 已匯入 "+imported.length+" 筆":"");$("importStatus").textContent=imported.length?"本機已保存 "+imported.length+" 筆官方匯入課程。":"尚未匯入當期課程。";$("dataLoadStatus").className="meta-pill"}).catch(err=>{$("courseGroups").innerHTML='<div class="empty-state">課程資料載入失敗：'+esc(err.message)+'。請重新整理頁面。</div>'; $("dataLoadStatus").textContent="資料載入失敗"});
})();