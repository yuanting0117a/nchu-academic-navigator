(function(){
const $=id=>document.getElementById(id),KEY="nchu-course-catalog-v1";
let courses=[];try{courses=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){}
let mode="plan",selectedId=null,loadedFile=null;
const aliases={
 courseNo:["選課號碼","選課代號","課程編號","課號","Class Number","Course Number","Class No."],
 courseName:["科目名稱","課程名稱","Course Name","Course"],
 credits:["學分","學分數","Credit","Credits"],
 dept:["開課單位","開課系所","開課單位名稱","選課系所","Offered Dept.","Department"],
 type:["必選修","必選別","必修選修","Required/Elective","Required/ Elective"],
 pre:["先修課程","先修科目","Pre-course","Prerequisite"],
 yearType:["學年／學期","學年/學期","全/半年","Yearly/Semester"],
 schedule:["上課時間","※上課時間","Class Time"],
 classroom:["教室","上課教室","Classroom"],
 teacher:["授課教師","上課教師","上課教師姓名","Instructor"],
 language:["授課語言","Teaching Language"],
 capacity:["名額","開課人數","Available Seat"],
 otherCapacity:["外系名額","外系人數","Available Seat for other Dept."],
 remaining:["剩餘名額","可加選餘額","Remaining Seat"],
 remarks:["備註","說明","Remarks"]
};
function norm(v){return String(v??"").replace(/\s+/g,"").toLowerCase()}
function matchesHeader(header,opts){const h=norm(header);return opts.some(o=>h===o||h.startsWith(o+"(")||h.startsWith(o+"（")||h.includes(o)&&o.length>=3)}
function pick(row,headers,key){const opts=aliases[key].map(norm);for(let i=0;i<headers.length;i++)if(matchesHeader(headers[i],opts))return row[i]??"";return ""}
function parseCSV(text){const out=[];let row=[],cell="",q=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&q&&text[i+1]==='"'){cell+='"';i++}else if(c==='"'){q=!q}else if(c===","&&!q){row.push(cell);cell=""}else if((c==="\n"||c==="\r")&&!q){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(x=>String(x).trim()))out.push(row);row=[];cell=""}else cell+=c}row.push(cell);if(row.some(x=>String(x).trim()))out.push(row);return out}
function normalize(rows,term,category){if(!rows.length)return[];let hidx=rows.findIndex(r=>r.some(c=>matchesHeader(c,aliases.courseNo.map(norm)))&&r.some(c=>matchesHeader(c,aliases.courseName.map(norm))));if(hidx<0)hidx=0;const headers=rows[hidx].map(x=>String(x??"").trim());return rows.slice(hidx+1).map(r=>{const o={};for(const k of Object.keys(aliases))o[k]=pick(r,headers,k);o.courseNo=String(o.courseNo).trim();o.courseName=String(o.courseName).trim();o.credits=Number(String(o.credits).replace(/[^0-9.\-]/g,""))||0;o.term=term;o.category=category;o.sourceStatus="pending";o.mappingStatus="mapping_pending";o.importedAt=new Date().toISOString();o.id=[term,category,o.courseNo,o.dept,o.courseName,o.schedule,o.teacher].join("|");return o}).filter(x=>x.courseName&&x.courseNo&&!matchesHeader(x.courseNo,aliases.courseNo.map(norm))&&!matchesHeader(x.courseName,aliases.courseName.map(norm)))}
function save(){localStorage.setItem(KEY,JSON.stringify(courses));render()}
function render(){const terms=[...new Set(courses.map(c=>c.term))].sort();const depts=[...new Set(courses.map(c=>c.dept).filter(Boolean))].sort();const oldD=$("deptFilter").value,oldT=$("termFilter").value;$("deptFilter").innerHTML='<option value="">全部開課單位</option>'+depts.map(x=>'<option>'+esc(x)+'</option>').join("");$("termFilter").innerHTML='<option value="">全部學期</option>'+terms.map(x=>'<option value="'+x+'">'+x+'</option>').join("");$("deptFilter").value=oldD;$("termFilter").value=oldT;
$("courseCount").textContent=courses.length;$("dataStatus").textContent=courses.length?"已匯入 · 本機保存":"尚未匯入";$("dataStatus").classList.toggle("ready",courses.length>0);$("exportJson").disabled=!courses.length;$("clearData").disabled=!courses.length;
const q=norm($("search").value),dept=$("deptFilter").value,credit=$("creditFilter").value,term=$("termFilter").value;
const filtered=courses.filter(c=>(!q||norm([c.courseNo,c.courseName,c.dept,c.teacher,c.remarks].join(" ")).includes(q))&&(!dept||c.dept===dept)&&(!credit||c.credits===Number(credit))&&(!term||c.term===term));
$("showing").textContent="顯示 "+filtered.length+" / "+courses.length+" 筆";
if(mode==="plan"){const names={"ee-required":"電機系專業必修","ee-elective":"電機系專業選修","general":"通識學分","cross":"跨系／跨域修課","minor":"輔系／學分學程","double":"雙主修"};$("planNotice").textContent="目前選擇："+names[$("plan").value]+"。課程清單顯示已匯入的相關候選資料；由於尚未建立並核實課號級採計對照，所有課程仍標示待核實，不會自動計入學分。";}
if(!filtered.length){$("courseRows").innerHTML='<tr><td colspan="4" class="empty">'+(courses.length?"沒有符合條件的課程。":"尚未匯入課程。請先匯入官方匯出檔。")+'</td></tr>';return}
$("courseRows").innerHTML=filtered.map(c=>'<tr data-id="'+esc(c.id)+'" class="'+(selectedId===c.id?"selected-row":"")+'"><td><div class="course-title">'+esc(c.courseName)+'</div><div class="course-sub">課號 '+esc(c.courseNo)+' · '+esc(c.type||"類別待核")+' · '+esc(c.schedule||"時間未提供")+'</div></td><td>'+esc(c.dept||"未提供")+'<div class="course-sub">'+esc(c.term)+' · '+esc(c.category)+'</div></td><td>'+esc(c.credits)+' 學分</td><td><span class="tag pending">採計待核實</span></td></tr>').join("");
$("courseRows").querySelectorAll("tr[data-id]").forEach(tr=>tr.onclick=()=>{selectedId=tr.dataset.id;const c=courses.find(x=>x.id===selectedId);$("selectedCourse").textContent=c.courseName+"（"+c.courseNo+"）｜"+c.dept+"｜"+c.credits+" 學分";$("planResults").innerHTML=["電機系專業必修","電機系專業選修","通識學分","跨系／跨域修課","輔系／學分學程","雙主修"].map(n=>"<div class=\"plan-result-row\"><b>"+n+"</b><span class=\"tag pending\">待核實</span></div>").join("")+"<p class=\"muted small\">尚未找到這門課對應上述方案的正式課號級依據，因此目前不計入任何方案學分。</p>";if(mode==="course")render()});
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("file").onchange=e=>{loadedFile=e.target.files[0]||null;$("importBtn").disabled=!loadedFile;$("importMessage").textContent=loadedFile?"已選擇："+loadedFile.name+"。確認學期及分類後即可匯入。":"尚未選擇檔案。"};
$("importBtn").onclick=async()=>{if(!loadedFile)return;try{let added=[];if(/\.csv$/i.test(loadedFile.name)){const rows=parseCSV(await loadedFile.text());added=normalize(rows,$("term").value,$("category").value)}else{if(!window.XLSX)throw new Error("Excel 解析程式載入失敗；請將檔案另存為 CSV 再匯入。");const buf=await loadedFile.arrayBuffer(),wb=XLSX.read(buf,{type:"array"});added=wb.SheetNames.flatMap(name=>normalize(XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:""}),$("term").value,$("category").value))}if(!added.length)throw new Error("找不到課號與課程名稱欄位。請確認使用官方課程查詢匯出檔。");const map=new Map(courses.map(c=>[c.id,c]));added.forEach(c=>map.set(c.id,c));courses=[...map.values()];save();$("importMessage").textContent="成功匯入 "+added.length+" 筆；目前本機累計 "+courses.length+" 筆。相同班別會更新，不同班別會分開保留。"}catch(err){$("importMessage").textContent="匯入失敗："+err.message}};
$("exportJson").onclick=()=>download(JSON.stringify({schemaVersion:1,source:"NCHU official course query export",exportedAt:new Date().toISOString(),courses},null,2),"nchu-courses.json","application/json");
$("clearData").onclick=()=>{if(confirm("確定清除此裝置匯入的全部課程資料？")){courses=[];selectedId=null;save();$("importMessage").textContent="已清除本機課程資料。"}};
function download(content,name,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([content],{type}));a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
$("plan").addEventListener("change",render);\n["search","deptFilter","creditFilter","termFilter"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",render));
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));$("planMode").classList.toggle("hidden",mode!=="plan");$("courseMode").classList.toggle("hidden",mode!=="course");render()});
render();
})();