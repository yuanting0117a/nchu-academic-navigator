// 規則示範資料；正式資料必須附官方來源及核實資訊。
window.NCHU_DATA={colleges:[
{id:"agri",name:"農業暨自然資源學院",departments:[]},{id:"science",name:"理學院",departments:[]},{id:"eng",name:"工學院",departments:[]},{id:"life",name:"生命科學院",departments:[]},{id:"manage",name:"管理學院",departments:[]},{id:"law",name:"法政學院",departments:[]},{id:"ee",name:"電機資訊學院",departments:["電機工程學系","資訊工程學系"]},{id:"liberal",name:"文學院",departments:[]},{id:"vet",name:"獸醫學院",departments:[]},{id:"innovation",name:"創新產業暨國際學院",departments:[]}],
requirements:["最低畢業總學分","系必修課程","系選修課程","通識教育課程","英文／外語門檻","服務學習及校級門檻"],
nodes:[
{id:"start",type:"start",title:"建立個人學籍",sub:"入學年度・學制・系所",desc:"先確認入學年度、學制與系所。畢業條件可能因入學年度而變動。"},
{id:"rules",title:"載入適用系所規定",sub:"官方規章版本",desc:"依學籍條件選擇規則版本。每條規則都應附官方來源、適用年度與核實日期。"},
{id:"courses",title:"整理修課紀錄",sub:"已修畢・修課中・預計修習",desc:"課程資料與必修、選修、通識及學分要求比對。修課中與預計修習不會直接視為已完成。"},
{id:"decision",type:"decision",title:"畢業條件是否全部符合？",sub:"學分・必修・校級門檻",desc:"只有有足夠官方規則與修課資料支持的條件，才能判定已符合。缺資料時標記待人工確認。"},
{id:"missing",title:"列出缺少條件與建議課程",sub:"下一步行動",desc:"列出尚缺學分、必修、門檻及補足方式，並指出資訊來源。"},
{id:"path",type:"decision",title:"是否規劃跨域修讀？",sub:"輔系・雙主修・學分學程",desc:"跨域路徑分別檢查申請資格、時間、名額、審查、核准及修課要求。"},
{id:"apply",title:"檢查資格與申請流程",sub:"資格・文件・期限・審查",desc:"達到修課條件不等於取得資格。申請、審查與正式核准必須分開記錄。"},
{id:"done",type:"end",title:"完成學業規劃",sub:"持續更新與再次檢查",desc:"每學期更新修課紀錄，規章更新時重新檢查受影響條件。"}]};