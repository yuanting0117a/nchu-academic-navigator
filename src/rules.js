// 未知規則不得視為符合；修課中與預計修習不得算入已完成學分。
window.NCHU_RULES={
summary(courses){const sum=status=>courses.filter(c=>c.status===status).reduce((n,c)=>n+Number(c.credits||0),0);return{completed:sum("completed"),inProgress:sum("inProgress"),planned:sum("planned")};},
evaluate(rule,courses){if(!rule||rule.verified!==true||!rule.logic)return{status:"verify",label:"待人工確認"};if(rule.logic.type==="minimumCredits"){const s=this.summary(courses);return{status:s.completed>=rule.logic.value?"met":s.completed+s.inProgress>=rule.logic.value?"pending":"unmet",completed:s.completed,required:rule.logic.value};}return{status:"verify",label:"待人工確認"};}
};