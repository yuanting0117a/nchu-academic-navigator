(function(){
"use strict";
const KEY="nchu-graduation-audit-v1", $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const criteria=[
{id:"ge-domain-total",name:"通識｜人文＋社會＋自然合計",target:6,scope:"ge-aggregate",note:"三個領域各至少1門，三領域合計至少6學分。"},
{id:"required",name:"電機系專業必修",target:55,scope:"course",note:"依適用年度必修課程核對；跨系開課課程仍須正式對照。"},
{id:"elective",name:"電機系專業選修",target:27,scope:"course",note:"外系課程是否採計，依系上規定與核准結果。"},
{id:"ge-core",name:"通識｜核心素養",target:3,scope:"ge",note:"至少3學分；電機系免修的資訊素養課不採計。"},
{id:"ge-language",name:"通識｜語文素養",target:10,scope:"ge",note:"本國語文4＋外國語文6，共10學分。"},
{id:"ge-humanities",name:"通識｜人文領域",target:1,unit:"course",scope:"ge",note:"至少1門；與社會、自然領域合計至少6學分。"},
{id:"ge-social",name:"通識｜社會領域",target:1,unit:"course",scope:"ge",note:"至少1門；與人文、自然領域合計至少6學分。"},
{id:"ge-natural",name:"通識｜自然領域",target:1,unit:"course",scope:"ge",note:"至少1門；工程科技最多採計1門。"},
{id:"ge-integrated",name:"通識｜統合領域",target:4,scope:"ge",note:"至少4學分；依通識中心及系所認定。"},
{id:"ge-extra",name:"通識｜總額補足",target:5,scope:"ge",note:"核心3＋語文10＋領域10合計23，至少再補5學分至28。"},
{id:"ge-exempt",name:"資訊素養：程式設計與AI應用",target:0,scope:"exempt",note:"電機系依畢業條件免修；即使修習也不得採計通識畢業學分。"},
{id:"project",name:"畢業專題（一）（二）",target:4,scope:"project",note:"兩科各2學分；獨立檢查，不重複加進系必修／選修。"},
{id:"pe",name:"體育必修",target:2,scope:"pe",note:"必修2學分，不計入128畢業總學分。"}
];
let allocations={};try{allocations=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
function allCourses(){let imp=[],ids=[];try{imp=JSON.parse(localStorage.getItem("nchu-course-map-imports-v1")||"[]")}catch(e){}try{ids=JSON.parse(localStorage.getItem("nchu-my-courses-v1")||"[]")}catch(e){}let base=window.nchuCourseMapData?.courses||[];return base.concat(imp).filter(c=>ids.includes(c.id))}
function assigned(){return Object.values(allocations).flat().map(x=>x.courseId)}
function amount(id){return (allocations[id]||[]).filter(x=>x.state==="done").reduce((n,a)=>n+(Number(allCourses().find(c=>c.id===a.courseId)?.credits)||0),0)}
function count(id,state){return (allocations[id]||[]).filter(a=>!state||a.state===state).length}
function geAmount(){return criteria.filter(c=>c.scope==="ge").reduce((n,c)=>n+amount(c.id),0)}
function totalAmount(){return amount("required")+amount("elective")+geAmount()}
function domainTotal(){return amount("ge-humanities")+amount("ge-social")+amount("ge-natural")}
function domainReady(){return ["ge-humanities","ge-social","ge-natural"].every(id=>count(id,"done")>0)&&domainTotal()>=6}
function progress(c){if(c.id==="total")return {value:totalAmount(),target:128,done:totalAmount()>=128};if(c.id==="ge-total")return {value:geAmount(),target:28,done:geAmount()>=28};if(c.id==="ge-domain-total")return {value:domainTotal(),target:6,done:domainReady()};if(c.scope==="exempt")return {value:0,target:0,done:false};if(c.id==="project")return {value:amount(c.id),target:4,done:amount(c.id)>=4&&count(c.id,"done")>=2};if(c.unit==="course"){let n=count(c.id,"done");return {value:n,target:1,done:n>0}}let v=amount(c.id);return {value:v,target:c.target,done:v>=c.target}}
function hasFuture(c){if(c.id==="total")return Object.values(allocations).flat().some(x=>x.state==="planned");if(c.id==="ge-total")return criteria.filter(x=>x.scope==="ge").some(x=>count(x.id,"planned")>0);if(c.id==="ge-domain-total")return ["ge-humanities","ge-social","ge-natural"].some(id=>count(id,"planned")>0);return count(c.id,"planned")>0}
function state(c,p){if(c.scope==="exempt")return "gray";return p.done?"green":hasFuture(c)?"both":"red"}
function render(){
 const host=$("graduationAudit");if(!host)return;
 const list=allCourses(),items=[{id:"total",name:"畢業總學分",target:128,scope:"total",note:"至少128學分，不含體育；已明列的系必修55、系選修27、通識28合計110，另有18學分分類待系辦確認。"},{id:"ge-total",name:"通識總額",target:28,scope:"total",note:"通識至少28學分；由下方通識分類配置加總，不重複配置。"},...criteria];
 const eligible=items.filter(c=>!["total","ge-total","ge-exempt"].includes(c.id));
 const satisfied=eligible.filter(c=>progress(c).done).length,pct=Math.round(satisfied/eligible.length*100);
 host.innerHTML='<div class="audit-top"><div><span class="eyebrow">GRADUATION REQUIREMENT CHECK</span><h2>畢業條件總覽</h2><p>全部條件同時展開。綠燈＝目前符合；紅燈＝尚未符合；黃燈＝已安排未來課程，可與紅燈並存。未來安排不會增加符合率。</p></div><div class="audit-percent"><strong>'+pct+'%</strong><span>條件符合率</span><div class="audit-progress"><i style="width:'+pct+'%"></i></div><small>'+satisfied+' / '+eligible.length+' 項條件符合</small></div></div><div class="audit-legend"><span><i class="lamp green"></i>已符合</span><span><i class="lamp red"></i>尚未符合</span><span><i class="lamp gray"></i>不適用／不列入</span><span><i class="lamp yellow"></i>未來安排</span></div><div class="audit-grid">'+items.map(c=>{
 const p=progress(c),st=state(c,p),future=hasFuture(c),lights=st==="both"?'<i class="lamp red"></i><i class="lamp yellow"></i>':st==="green"?'<i class="lamp green"></i>':st==="gray"?'<i class="lamp gray"></i>':'<i class="lamp red"></i>';
 const shown=st==="gray"?"免修":(c.unit==="course"?"要求：至少1門":"要求：至少"+p.target+"學分");
 const rows=(allocations[c.id]||[]).map(a=>{let x=list.find(y=>y.id===a.courseId);return x?'<div class="audit-assigned"><span>'+esc(x.name)+'<small>'+(x.credits??"?")+'學分 · '+(a.state==="done"?"已修畢":"未來安排")+'</small></span><button type="button" data-remove="'+c.id+'" data-id="'+esc(a.courseId)+'">移除</button></div>':""}).join("");
 const opts=list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' · '+(x.credits??"?")+'學分 · '+esc(x.dept||x.group||"")+'</option>').join("");
 const aggregate=c.scope==="total"||c.id==="ge-total"||c.id==="ge-domain-total"||c.scope==="exempt";
 return '<article class="audit-card '+(p.done?"is-done":"")+'"><div class="audit-card-head"><div><h3>'+esc(c.name)+'</h3><small>'+esc(c.note)+'</small></div><div class="audit-lights">'+lights+'</div></div><div class="audit-meter"><b>'+shown+'</b><span>'+(st==="gray"?"免修／不採計":p.done?"已符合":future?"尚未符合 · 已安排":"尚未符合")+'</span></div><div class="audit-assigned-list">'+(rows||'<small class="audit-empty">'+(aggregate?"由下方分類自動彙總":"尚未配置課程")+'</small>')+'</div>'+(aggregate?'':'<div class="audit-add-row"><select data-choice="'+c.id+'"><option value="">從「我的修課」選擇課程</option>'+opts+'</select><button type="button" data-add-done="'+c.id+'">加入已修</button><button type="button" data-add-plan="'+c.id+'">安排未來</button></div>')+'</article>';
 }).join("")+'</div><p class="audit-footnote">從「我的修課」清單配置課程，並手動標記已修或未來安排。每門課只可配置一次，避免重複計算；通識總額與畢業總學分自動彙總。未知學分不估算。這是個人規劃工具，正式採計仍以學校及系所認定為準。</p>';
 host.querySelectorAll("[data-add-done],[data-add-plan]").forEach(b=>b.addEventListener("click",()=>{let id=b.dataset.addDone||b.dataset.addPlan,sel=host.querySelector('[data-choice="'+id+'"]'),courseId=sel?.value;if(!courseId)return;if(assigned().includes(courseId)){alert("這門課已配置到其他條件，避免重複採計。");return}allocations[id]=allocations[id]||[];allocations[id].push({courseId,state:b.dataset.addDone?"done":"planned"});save()}));
 host.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{allocations[b.dataset.remove]=(allocations[b.dataset.remove]||[]).filter(a=>a.courseId!==b.dataset.id);save()}));
}
function save(){localStorage.setItem(KEY,JSON.stringify(allocations));render()}
window.addEventListener("nchu-import-courses",render);
document.addEventListener("click",e=>{if(e.target?.id==="showMyCourses"||e.target?.id==="clearMyCourses"||e.target?.hasAttribute("data-toggle-course")||e.target?.hasAttribute("data-ge-toggle-course"))setTimeout(render,0)});
fetch("data/course-map/ee-undergraduate-114.json").then(r=>r.json()).then(d=>{window.nchuCourseMapData=d;render()}).catch(()=>{let h=$("graduationAudit");if(h)h.textContent="畢業條件資料載入失敗，請重新整理。"});
})();