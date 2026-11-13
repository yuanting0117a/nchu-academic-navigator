(function(){
const $=id=>document.getElementById(id), storeKey="nchu-navigator-machine-v1";
const defaults={year:"115",current:"電機工程學系",target:"資訊工程學系",goal:"transfer"};
let saved={};try{saved=JSON.parse(localStorage.getItem(storeKey)||"{}")}catch(e){}
const state={...defaults,...saved,step:0};
const steps=[
 {title:"先確認目前學籍",question:"你現在是中興大學哪個學制、哪個系所？",hint:"這是判定起點，不代表最後一定要從這個系畢業。",options:[
  {value:"電機工程學系",label:"電機工程學系",sub:"電機資訊學院・學士班",tag:"目前起點"},
  {value:"資訊工程學系",label:"資訊工程學系",sub:"電機資訊學院・學士班"},
  {value:"其他系所",label:"其他系所",sub:"其他學院或系所"}
 ]},
 {title:"選擇入學年度",question:"你是哪一學年度入學？",hint:"畢業條件會依入學年度不同而改變。",options:["112","113","114","115","116"].map(y=>({value:y,label:y+" 學年度",sub:y==="115"?"目前常見的新生適用年度":"載入該年度規則版本"}))},
 {title:"選擇目標系所",question:"你想往哪個系所規劃？",hint:"可以選擇目前系所，也可以比較其他系所。",options:[
  {value:"電機工程學系",label:"電機工程學系",sub:"電機資訊學院"},
  {value:"資訊工程學系",label:"資訊工程學系",sub:"電機資訊學院"},
  {value:"尚未決定",label:"我還沒決定",sub:"先看跨系修課與申請差異"}
 ]},
 {title:"選擇你的目標",question:"你希望達成哪一種結果？",hint:"這一步很重要：修到別系課程，不等於取得別系學位。",options:[
  {value:"transfer",label:"正式轉系",sub:"希望未來以目標系所作為畢業系所",tag:"學籍改變"},
  {value:"double",label:"雙主修",sub:"保留原系學籍，另外完成目標系要求",tag:"雙學位路徑"},
  {value:"minor",label:"輔系／跨域專長",sub:"保留原系學籍，完成另一領域要求"},
  {value:"courses",label:"只想跨系修課",sub:"想知道哪些課可能被承認"}
 ]}
];
function persist(){const copy={...state};delete copy.step;localStorage.setItem(storeKey,JSON.stringify(copy))}
function render(){
 const s=steps[state.step];$("stepTitle").textContent=s.title;$("stepCount").textContent=String(state.step+1).padStart(2,"0")+" / 04";$("progressBar").style.width=((state.step+1)/4*100)+"%";
 $("question").innerHTML='<h3>'+s.question+'</h3><p>'+s.hint+'</p>';
 const key=["current","year","target","goal"][state.step],value=state[key];
 $("keypad").innerHTML=s.options.map((o,i)=>'<button class="key '+(value===o.value?"selected":"")+'" data-value="'+o.value+'"><span class="key-number">'+(i+1).toString().padStart(2,"0")+'</span><span class="key-copy"><b>'+o.label+'</b><small>'+o.sub+'</small></span><span class="key-check">'+(value===o.value?"✓":"＋")+'</span></button>').join("");
 $("keypad").querySelectorAll("[data-value]").forEach(b=>b.onclick=()=>{state[key]=b.dataset.value;persist();render()});
 $("back").disabled=state.step===0;$("next").disabled=!value;$("next").textContent=state.step===3?"開始判定 →":"下一步 →";
 $("result").classList.add("hidden");
}
function statusCard(status,title,body){return '<div class="status-card '+status+'"><span class="status-dot"></span><div><b>'+title+'</b><p>'+body+'</p></div></div>'}
function makeResult(){
 const target=state.target,year=Number(state.year),goal=state.goal;
 let html='<div class="result-head"><span class="eyebrow">YOUR CHECK RESULT</span><h2>初步判定完成</h2><p>'+state.year+'學年度入學・目前：'+state.current+'・目標：'+target+'</p></div>';
 if(target==="資訊工程學系"&&year===115){
  html+='<div class="numbers"><div><b>128</b><small>畢業總學分</small></div><div><b>55</b><small>系專業必修</small></div><div><b>30</b><small>系專業選修</small></div><div><b>28</b><small>通識學分</small></div></div>';
  html+=statusCard("ok","目標系所規則已核實","資工系115學年度起入學版本已建檔。");
  html+=statusCard("warn","跨系課程不能直接當成系必修","資工系必修原則上須由資工系開課；因特殊理由須事先申請並獲同意。");
  html+=statusCard("warn","正式轉系資格尚未判定","還需要你的修課成績、年級、轉系申請年度及當年度名額／審查規定。");
 }else if(target==="電機工程學系"&&year===114){
  html+='<div class="numbers"><div><b>128</b><small>畢業總學分</small></div><div><b>55</b><small>系專業必修</small></div><div><b>27</b><small>系專業選修</small></div><div><b>28</b><small>通識學分</small></div></div>';
  html+=statusCard("ok","目標系所規則已建檔","目前可查到的電機系正式資料為114學年度起入學版本。");
  html+=statusCard("warn","你的入學年度需再確認","若不是114學年度入學，不能直接套用這份畢業條件。");
 }else{
  html+=statusCard("warn","目前沒有可直接套用的完整版本","系統不會拿其他年度或其他系所的規定代替。這個目標需要補齊官方資料後才能判定。");
 }
 if(goal==="courses") html+=statusCard("info","跨系修課規劃","可先比對課名與學分，但是否能列入目標系畢業學分，仍由目標系所正式認定。");
 if(goal==="transfer") html+=statusCard("info","正式轉系路徑","需另外核對轉系申請資格、名額、成績門檻、申請期限與核准結果。修課本身不會自動轉換學籍。");
 if(goal==="double") html+=statusCard("info","雙主修路徑","需檢查雙主修申請資格及目標系雙主修課程表，不能只用一般畢業條件代替。");
 if(goal==="minor") html+=statusCard("info","輔系／跨域專長路徑","需使用該制度專屬的申請與修課規定，不能視為取得目標系學位。");
 html+='<div class="result-actions"><button id="restart" class="secondary">重新判定</button><a href="https://github.com/yuanting0117a/nchu-academic-navigator/tree/main/data/departments" target="_blank" rel="noopener">查看原始規則資料 ↗</a></div>';
 $("result").innerHTML=html;$("result").classList.remove("hidden");$("result").scrollIntoView({behavior:"smooth",block:"start"});
 $("restart").onclick=()=>{state.step=0;render();window.scrollTo({top:0,behavior:"smooth"})};
}
$("back").onclick=()=>{if(state.step>0){state.step--;render()}};
$("next").onclick=()=>{if(state.step<3){state.step++;render()}else makeResult()};
$("export").onclick=()=>{const data={currentStudent:{year:state.year,department:state.current},targetDepartment:state.target,goal:state.goal,exportedAt:new Date().toISOString()};const a=document.createElement("a"),u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.href=u;a.download="nchu-academic-check.json";a.click();URL.revokeObjectURL(u)};
render();
})();