(function(){
const $=id=>document.getElementById(id);
const DATA_URL="data/course-map/ee-undergraduate-114.json";
let data=null,selectedPlan=null,selectedCourse=null,filter="all",query="",admissionYear="114",imported=[];
try{imported=JSON.parse(localStorage.getItem("nchu-course-map-imports-v1")||"[]")}catch(e){}
function allCourses(){return (data?.courses||[]).concat(imported)}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sourceByTitle=title=>(data.sources||[]).find(s=>s.title===title);
function statusLabel(s){return s==="verified"?"規則已核實":s==="verified-partial"?"部分核實":"待確認"}
function effectiveStatus(s){return admissionYear==="115"?"pending":s}
function courseStatus(c){return admissionYear==="115"?"115適用性待確認":c.status==="verified"?"規則已核實":"細項待確認"}
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
 const text=(c.name+" "+c.group+" "+(c.source||"")+" "+(c.courseNo||"")+" "+(c.dept||"")+" "+(c.teacher||"")).toLowerCase();
 const typeOk=filter==="all"||(filter==="required"&&c.group==="專業必修")||(filter==="program"&&c.group.includes("學程"))||(filter==="lab"&&c.group==="專業實驗")||(filter==="project"&&c.group==="畢業專題");
 return typeOk&&(!q||text.includes(q));
}
function renderCourses(){
 const host=$("courseGroups");
 const courses=allCourses();
 const groups=[...new Set(courses.map(c=>c.group))];
 const visible=courses.filter(courseVisible);
 $("courseCount").textContent=visible.length+" / "+courses.length+" 項";
 if(!visible.length){host.innerHTML='<div class="empty-state">找不到符合條件的課程或規定項目。</div>';return}
 host.innerHTML=groups.map(g=>{
  const items=visible.filter(c=>c.group===g);if(!items.length)return "";
  return '<section class="course-group"><div class="group-head"><h3>'+esc(g)+'</h3><small>'+items.length+' 項</small></div><div class="course-tiles">'+items.map(c=>{
   const selected=selectedCourse===c.id;
   const related=selectedPlan&&c.plans.includes(selectedPlan);
   const dim=selectedPlan&&!related;
   return '<button class="course-tile '+(selected?"active ":"")+(related?"lit ":"")+(dim?"dim":"")+'" data-course="'+esc(c.id)+'"><span class="course-name">'+esc(c.name)+'</span><span class="course-meta"><small>'+(c.credits===null?"學分依開課資料":c.credits+" 學分")+'</small><span class="tiny-status">'+(admissionYear==="115"?"年度待確認":c.status==="verified"?"已核實":"細項待核")+'</span></span></button>'
  }).join("")+'</div></section>'
 }).join("");
 host.querySelectorAll("[data-course]").forEach(b=>b.addEventListener("click",()=>setSelection("course",b.dataset.course)));
}
function renderDetail(){
 const host=$("detailBody");
 if(selectedCourse){
  const c=allCourses().find(x=>x.id===selectedCourse);if(!c)return;
  const related=c.plans.map(planById).filter(Boolean);
  const official=c.source==="114學年度畢業條件明細表"?sourceByTitle(data.sources[0].title):sourceByTitle(data.sources[1].title);
  host.innerHTML='<div><div class="detail-kicker">SELECTED COURSE</div><h3>'+esc(c.name)+'</h3><span class="status '+(admissionYear==="115"?"pending":c.status==="verified"?"ok":"pending")+'">'+esc(courseStatus(c))+'</span><div class="detail-stats"><div class="detail-stat"><small>類別</small><b>'+esc(c.group)+'</b></div><div class="detail-stat"><small>學分</small><b>'+(c.credits===null?"依實際開課資料":c.credits+" 學分")+'</b></div></div><p>'+esc(c.source||"官方課程規劃")+'。目前顯示的是課程規劃／畢業規定層級，不代表本學期確實開課或保證可選。</p></div><div><b style="font-size:11px">關聯方案</b><div class="related-list">'+related.map(p=>'<div class="related-row"><span>'+esc(p.name)+'</span><span class="status pending">'+(admissionYear==="115"?"待確認":statusLabel(p.status))+'</span></div>').join("")+'</div><div class="detail-links"><a href="'+esc(official?.url||data.sources[0].url)+'" target="_blank" rel="noopener">查看官方依據 ↗</a><a href="'+esc(data.sources[3].url)+'" target="_blank" rel="noopener">查詢當學期實際開課 ↗</a></div></div>';
 }else if(selectedPlan){
  const p=planById(selectedPlan),items=data.courses.filter(c=>c.plans.includes(p.id));
  host.innerHTML='<div><div class="detail-kicker">SELECTED PLAN</div><h3>'+esc(p.name)+'</h3><span class="status '+(admissionYear==="115"?"pending":p.status==="verified"?"ok":"pending")+'">'+(admissionYear==="115"?"115適用性待確認":statusLabel(p.status))+'</span><div class="detail-stats"><div class="detail-stat"><small>規定學分</small><b>'+(p.credits===undefined?"依規定":p.credits+" 學分")+'</b></div><div class="detail-stat"><small>關聯項目</small><b>'+items.length+' 項</b></div></div><p>'+esc(p.description)+'</p></div><div><b style="font-size:11px">亮起的相關課程</b><div class="related-list">'+items.map(c=>'<div class="related-row"><span>'+esc(c.name)+'</span><span class="status '+(c.status==="verified"?"ok":"pending")+'">'+(admissionYear==="115"?"待確認":c.status==="verified"?"已核實":"細項待核")+'</span></div>').join("")+'</div><div class="detail-links"><a href="'+esc(data.sources[0].url)+'" target="_blank" rel="noopener">查看114學年度畢業條件明細表 ↗</a><a href="'+esc(data.sources[1].url)+'" target="_blank" rel="noopener">查看系上課程規劃 ↗</a></div></div>';
 }else{
  host.innerHTML='<div class="detail-empty">點選左側任一學分方案，相關課程就會亮起。<br>也可以直接點選中央任一課程，反向查看它連結到哪些方案。<br><br>這裡會顯示學分、規定、適用年度與官方來源。</div>';
 }
}
function render(){
 renderPlans();renderCourses();renderDetail();
 $("yearNotice").textContent=admissionYear==="114"?"目前以114學年度起入學版本判讀。":"電機系目前可核實的明細表為114學年度起版本；115入學適用性尚待系辦確認，因此不會自動判定符合。";
}
$("searchCourse").addEventListener("input",e=>{query=e.target.value;renderCourses()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderCourses()}));
$("admissionYear").addEventListener("change",e=>{admissionYear=e.target.value;render()});
window.addEventListener("nchu-import-courses",e=>{imported=e.detail||[];localStorage.setItem("nchu-course-map-imports-v1",JSON.stringify(imported));selectedPlan=null;selectedCourse=null;render();$("importStatus").textContent="本機已保存 "+imported.length+" 筆官方匯入課程；採計關係待核實。";$("dataLoadStatus").textContent="資料載入成功 · "+data.courses.length+" 個規劃項目 · 已匯入 "+imported.length+" 筆";});
fetch(DATA_URL).then(r=>{if(!r.ok)throw new Error("資料檔讀取失敗（"+r.status+"）");return r.json()}).then(d=>{data=d;render();$("dataLoadStatus").textContent="資料載入成功 · "+d.courses.length+" 個規劃項目"+(imported.length?" · 已匯入 "+imported.length+" 筆":"");$("importStatus").textContent=imported.length?"本機已保存 "+imported.length+" 筆官方匯入課程。":"尚未匯入當期課程。";$("dataLoadStatus").className="meta-pill"}).catch(err=>{$("courseGroups").innerHTML='<div class="empty-state">課程資料載入失敗：'+esc(err.message)+'。請重新整理頁面。</div>'; $("dataLoadStatus").textContent="資料載入失敗"});
})();