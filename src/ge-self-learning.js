(function(){
const KEY="nchu-ge-self-learning-v1";
const methods=[
 {id:"micro",title:"通識微型課程",tag:"時數累積",cap:3,desc:"每門約 6–8 小時，累積滿 18 小時才認列 1 學分，最多 3 學分。",how:"依微型課程公告報名／參與；先記錄實際完成時數，最後仍以通識中心認列為準。"},
 {id:"practice",title:"實作專題",tag:"事前申請・成果報告",cap:2,desc:"原則上個人申請；若內容確實需要合作，可以小組申請。要事先申請，完成後繳成果報告，最多 2 學分。",how:"先提出申請，依核准內容執行；完成後繳交成果報告。"},
 {id:"online",title:"興通識 online",tag:"認可線上課程",cap:4,desc:"必須是通識中心認可的線上課程，不是任意看網路影片都能換學分，最多 4 學分。",how:"先確認課程是否在通識中心認可範圍，再記錄課程名稱與核定學分。"},
 {id:"cross",title:"跨域自主學習",tag:"講座點數",cap:2,desc:"每一學分都至少要包含一場惠蓀講座的點數，最多 2 學分。",how:"累積活動點數時，另外確認每一學分至少包含一場惠蓀講座點數。"},
 {id:"life",title:"生活實踐",tag:"證明・審查",cap:2,desc:"不是單純參加任何活動就能換學分，必須符合規定並經通識中心審查，最多 2 學分。",how:"整理符合規定的生活實踐內容與證明，送通識中心審查。"}
];
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let state={};
try{state=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){state={}}
const defaults={micro:{hours:0,approved:0,note:""},practice:{application:"未申請",mode:"個人",report:false,approved:0,note:""},online:{recognized:false,approved:0,courses:""},cross:{huisun:0,approved:0,note:""},life:{review:"未送審",evidence:false,approved:0,note:""}};
function get(id){return {...defaults[id],...(state[id]||{})}}
function save(id,patch){state[id]={...get(id),...patch};localStorage.setItem(KEY,JSON.stringify(state));renderSummary();renderCardStatus(id)}
function n(v,max){return Math.max(0,Math.min(max,Number(v)||0))}
function estimateHours(hours){return Math.min(3,Math.floor(n(hours,100000)/18))}
function totalApproved(){return methods.reduce((sum,m)=>sum+n(get(m.id).approved,m.cap),0)}
function renderSummary(){
 const host=$("geSelfLearningSummary");if(!host)return;
 host.innerHTML='<div class="ge-self-stat"><b>'+totalApproved()+'</b><span>已自行登錄核定學分</span></div><div class="ge-self-stat"><b>5</b><span>自主學習類型</span></div><p>這是個人紀錄加總，不代表學校已正式認列；請以通識中心核定及成績登錄為準。</p>';
}
function renderCardStatus(id){
 const el=document.querySelector('[data-ge-method="'+id+'"]');if(!el)return;
 const m=methods.find(x=>x.id===id),s=get(id);
 const approved=n(s.approved,m.cap);
 const badge=el.querySelector(".ge-self-approved");if(badge)badge.textContent="已登錄核定 "+approved+" / "+m.cap+" 學分";
}
function render(){
 const host=$("geSelfLearningCards");if(!host)return;
 host.innerHTML=methods.map(m=>{
  const s=get(m.id);
  let controls="";
  if(m.id==="micro")controls='<div class="ge-self-fields"><label>已完成時數（小時）<input type="number" min="0" step="1" data-ge-field="hours" value="'+n(s.hours,100000)+'"></label><div class="ge-self-calc"><b>'+estimateHours(s.hours)+' 學分</b><span>依 18 小時換算的時數估算，上限 3；不代表正式核定</span></div><label>通識中心核定學分<input type="number" min="0" max="3" step="1" data-ge-field="approved" value="'+n(s.approved,3)+'"></label><label class="wide">課程／參與紀錄<textarea data-ge-field="note" rows="2" placeholder="可記錄課程名稱、日期及時數">'+esc(s.note)+'</textarea></label></div>';
  if(m.id==="practice")controls='<div class="ge-self-fields"><label>申請方式<select data-ge-field="mode"><option '+(s.mode==="個人"?"selected":"")+' value="個人">個人</option><option '+(s.mode==="小組"?"selected":"")+' value="小組">小組（內容確實需要合作時）</option></select></label><label>申請進度<select data-ge-field="application">'+["未申請","已事前申請","審查通過","未通過"].map(x=>'<option '+(s.application===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label><label class="ge-self-check"><input type="checkbox" data-ge-field="report" '+(s.report?"checked":"")+'> 已完成並繳交成果報告</label><label>通識中心核定學分<input type="number" min="0" max="2" step="1" data-ge-field="approved" value="'+n(s.approved,2)+'"></label><label class="wide">專題名稱／申請紀錄<textarea data-ge-field="note" rows="2" placeholder="記錄申請內容、核准日期或成果">'+esc(s.note)+'</textarea></label></div>';
  if(m.id==="online")controls='<div class="ge-self-fields"><label class="ge-self-check"><input type="checkbox" data-ge-field="recognized" '+(s.recognized?"checked":"")+'> 已確認為通識中心認可課程</label><label>通識中心核定學分<input type="number" min="0" max="4" step="1" data-ge-field="approved" value="'+n(s.approved,4)+'"></label><label class="wide">認可線上課程名稱／修課紀錄<textarea data-ge-field="courses" rows="3" placeholder="逐項記錄課程名稱">'+esc(s.courses)+'</textarea></label></div>';
  if(m.id==="cross")controls='<div class="ge-self-fields"><label>惠蓀講座點數／場次紀錄數<input type="number" min="0" step="1" data-ge-field="huisun" value="'+n(s.huisun,100000)+'"></label><label>通識中心核定學分<input type="number" min="0" max="2" step="1" data-ge-field="approved" value="'+n(s.approved,2)+'"></label><div class="ge-self-calc wide"><b>'+(n(s.huisun,100000)>=n(s.approved,2)?"目前紀錄數符合已登錄學分數":"講座紀錄數尚不足")+'</b><span>每 1 學分至少需包含 1 場惠蓀講座點數；最多 2 學分。仍以正式點數與核定結果為準。</span></div><label class="wide">活動／點數紀錄<textarea data-ge-field="note" rows="2" placeholder="記錄講座名稱、日期及其他活動">'+esc(s.note)+'</textarea></label></div>';
  if(m.id==="life")controls='<div class="ge-self-fields"><label>審查進度<select data-ge-field="review">'+["未送審","審查中","通過","未通過"].map(x=>'<option '+(s.review===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label><label class="ge-self-check"><input type="checkbox" data-ge-field="evidence" '+(s.evidence?"checked":"")+'> 已整理並提交相關證明</label><label>通識中心核定學分<input type="number" min="0" max="2" step="1" data-ge-field="approved" value="'+n(s.approved,2)+'"></label><label class="wide">生活實踐內容／證明紀錄<textarea data-ge-field="note" rows="2" placeholder="記錄實踐項目、期間及證明">'+esc(s.note)+'</textarea></label></div>';
  return '<details class="ge-self-card" data-ge-method="'+m.id+'"><summary><span class="ge-self-title"><b>'+m.title+'</b><small>'+m.tag+'</small></span><span class="ge-self-approved">已登錄核定 '+n(s.approved,m.cap)+' / '+m.cap+' 學分</span></summary><div class="ge-self-content"><p>'+m.desc+'</p><div class="ge-self-how"><b>取得方式</b>'+m.how+'</div>'+controls+'</div></details>';
 }).join("");
 host.querySelectorAll("[data-ge-field]").forEach(input=>{
  const handler=()=>{
   const card=input.closest("[data-ge-method]"),id=card.dataset.geMethod,field=input.dataset.geField;
   const value=input.type==="checkbox"?input.checked:input.type==="number"?n(input.value,field==="approved"?methods.find(m=>m.id===id).cap:100000):input.value;
   save(id,{[field]:value});
   if(field==="hours"||field==="approved"||field==="huisun")render();
  };
  input.addEventListener("change",handler);
 });
 renderSummary();
}
function reset(){if(!confirm("確定清除此裝置上的五種通識自主學習紀錄？"))return;state={};localStorage.removeItem(KEY);render()}
document.addEventListener("DOMContentLoaded",()=>{
 if(!$("geSelfLearningCards"))return;
 render();
 const resetButton=$("geSelfLearningReset");if(resetButton)resetButton.addEventListener("click",reset);
});
})();