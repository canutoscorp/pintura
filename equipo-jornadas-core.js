(()=>{
 const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const period=(value,start=3)=>{const d=new Date(value+'T12:00:00');if(Number.isNaN(+d)||!Number.isInteger(+start)||+start<0||+start>6)throw Error('Revisa el periodo.');d.setDate(d.getDate()-((d.getDay()-Number(start)+7)%7));const days=Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(x.getDate()+i);return iso(x);});return{start:days[0],end:days[6],days};};
 const clock24=(hour,minute,period)=>{if(!Number.isInteger(+hour)||+hour<1||+hour>12||!/^\d{2}$/.test(String(minute))||+minute>59||!['AM','PM'].includes(period))throw Error('Revisa el horario.');return String(+hour%12+(period==='PM'?12:0)).padStart(2,'0')+':'+minute;};
 const clock12=value=>{if(!value)return 'Sin detalle';const [h,m]=String(value).split(':');return (+h%12||12)+':'+m+' '+(+h<12?'a. m.':'p. m.');};
 const duration=n=>Math.floor(n/60)+' h '+n%60+' min';
 const minutes=d=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.entry)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.exit))throw Error('Revisa entrada y salida.');const m=s=>+s.slice(0,2)*60+ +s.slice(3,5),span=m(d.exit)-m(d.entry)+(d.overnight?1440:0),lunch=Number(d.lunch);if(!Number.isInteger(lunch)||lunch<0||span<=0||span>1440||span<lunch)throw Error('Revisa el lonche o marca salida al día siguiente.');return span-lunch;};
 window.LozanoWorkCore={iso,period,clock24,clock12,duration,minutes};
})();
