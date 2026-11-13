// 規則引擎：未知或未核實規則不得視為符合。
// 學分一律以「原始修課紀錄」與「目標系所採認結果」分開保存，避免重複加總。
window.NCHU_RULES={
  summary(courses){
    const sum=status=>courses.filter(c=>c.status===status).reduce((n,c)=>n+Number(c.credits||0),0);
    return {completed:sum("completed"),inProgress:sum("inProgress"),planned:sum("planned")};
  },
  evaluate(rule,courses,context={}){
    if(!rule||rule.verified!==true||!rule.logic) return {status:"verify",label:"待人工確認"};
    const logic=rule.logic;
    const credits=Number(context.credits ?? this.summary(courses).completed);
    if(logic.type==="minimumCredits"){
      const s=this.summary(courses);
      return {status:s.completed>=logic.value?"met":s.completed+s.inProgress>=logic.value?"pending":"unmet",completed:s.completed,required:logic.value};
    }
    if(logic.type==="maximumCredits"){
      return {status:credits<=logic.value?"met":"unmet",current:credits,maximum:logic.value,excess:Math.max(0,credits-logic.value)};
    }
    if(logic.type==="creditRange"){
      const min=Number(logic.minimum||0),max=Number(logic.maximum);
      return {status:credits<min?"unmet":credits>max?"unmet":"met",current:credits,minimum:min,maximum:max};
    }
    if(logic.type==="creditCap"){
      const key=logic.category;
      const current=Number(context.categoryCredits?.[key]||0);
      return {status:current<=Number(logic.maximum)?"met":"unmet",category:key,current,maximum:Number(logic.maximum),excess:Math.max(0,current-Number(logic.maximum))};
    }
    return {status:"verify",label:"待人工確認"};
  },
  convertCredits(record,conversion){
    // 轉換／抵免必須由核實過的對照規則提供，不以課名相似度自行換算。
    if(!record||!conversion||conversion.verified!==true) return {status:"verify",label:"待人工確認"};
    const source=Number(record.credits);
    const ratio=Number(conversion.ratio);
    if(!Number.isFinite(source)||source<0||!Number.isFinite(ratio)||ratio<0) return {status:"verify",label:"資料格式待確認"};
    const converted=conversion.fixedCredits!=null?Number(conversion.fixedCredits):source*ratio;
    if(!Number.isFinite(converted)||converted<0) return {status:"verify",label:"換算結果待確認"};
    const cap=conversion.maximumCredits==null?converted:Math.min(converted,Number(conversion.maximumCredits));
    return {status:"calculated",sourceCredits:source,convertedCredits:cap,conversionType:conversion.type||"equivalency",sourceCourse:record.courseId||record.name||null,targetCourse:conversion.targetCourse||null,source:conversion.source||null};
  },
  compareCourse(record,mapping){
    // mapping 應由目標系所官方課程表／抵免審查結果建立。
    if(!mapping||mapping.verified!==true) return {status:"verify",label:"待人工確認"};
    return {status:"mapped",targetCategory:mapping.targetCategory||"未指定",targetCourse:mapping.targetCourse||null,acceptedCredits:Number(mapping.acceptedCredits??record.credits??0),doubleCountAllowed:mapping.doubleCountAllowed===true,source:mapping.source||null};
  }
};
