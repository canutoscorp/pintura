(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dateParts=at=>{const values=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return {year:+values.year,month:+values.month,day:+values.day,key:values.year+'-'+values.month+'-'+values.day};};
 const nthSunday=(year,month,n)=>1+(7-new Date(Date.UTC(year,month-1,1)).getUTCDay())%7+7*(n-1);
 function events(at=new Date()){
  const p=dateParts(at),rows=[
   [1,1,'new-year','🎆','¡Feliz Año Nuevo!','Gracias por formar parte de Lozano Painting. Que este año traiga salud, trabajo y buenos momentos para ti y tu familia.'],
   [3,8,'women','🌷','Día Internacional de la Mujer','Reconocemos el talento y la contribución de las mujeres. Sigamos construyendo un equipo con respeto, igualdad y oportunidades.'],
   [4,30,'children','🎈','¡Feliz Día de la Niña y del Niño!','Que nunca falten alegría, cariño y oportunidades para las niñas y los niños de nuestras familias.'],
   [5,1,'painters','🖌️','¡Feliz Día del Pintor!','Gracias por el cuidado, el esfuerzo y el talento con el que transforman cada casa. ¡Un reconocimiento a todo nuestro equipo!'],
   [5,10,'mothers','💐','¡Feliz Día de las Madres!','Con cariño y agradecimiento para todas las mamás y sus familias. Que disfruten un día muy especial.'],
   [6,nthSunday(p.year,6,3),'fathers','👨‍👧','¡Feliz Día del Padre!','Un abrazo y nuestro reconocimiento a todos los papás por su esfuerzo y dedicación a sus familias.'],
   [7,1,'engineers','🏗️','¡Feliz Día del Ingeniero!','Reconocemos a quienes aportan conocimientos, soluciones y dedicación para construir mejores espacios.'],
   [7,4,'usa','🇺🇸','¡Feliz 4 de julio!','Les deseamos un buen Día de la Independencia de Estados Unidos junto a sus familias.'],
   [9,16,'mexico','🇲🇽','¡Viva México!','Celebramos nuestras raíces y les deseamos un feliz Día de la Independencia de México.'],
   [11,19,'men','🤝','Día Internacional del Hombre','Reconocemos su esfuerzo y el valor de cuidar su salud, sus familias y el respeto dentro de nuestro equipo.'],
   [12,25,'christmas','🎄','¡Feliz Navidad!','Gracias por todo lo compartido este año. Les deseamos paz, salud y una Navidad llena de cariño junto a sus seres queridos.'],
   [12,28,'innocents','😄','Día de los Santos Inocentes','Que hoy no falten el buen humor, la convivencia y las sonrisas. ¡Un saludo para todo el equipo!']
  ];
  const firstMonday=1+(8-new Date(Date.UTC(p.year,8,1)).getUTCDay())%7;
  const thanksgiving=1+(11-new Date(Date.UTC(p.year,10,1)).getUTCDay())%7+21;
  rows.push([9,firstMonday,'labor','🛠️','¡Feliz Labor Day!','Gracias por el trabajo y la dedicación que cada uno aporta a Lozano Painting.']);
  rows.push([11,thanksgiving,'thanksgiving','🍂','¡Feliz Día de Acción de Gracias!','Hoy agradecemos contar con ustedes. Les deseamos un día lleno de unión y buenos momentos con sus familias.']);
  rows.push([3,nthSunday(p.year,3,2),'clock-forward','🕒','Cambio de horario en Alabama','Hoy se adelanta una hora: a las 2:00 a. m. el reloj pasa a las 3:00 a. m. Revisa tus horarios.']);
  rows.push([11,nthSunday(p.year,11,1),'clock-back','🕒','Cambio de horario en Alabama','Hoy se atrasa una hora: a las 2:00 a. m. el reloj vuelve a la 1:00 a. m. Revisa tus horarios.']);
  return rows.filter(r=>r[0]===p.month&&r[1]===p.day).map(r=>({id:r[2],icon:r[3],title:r[4],body:r[5],date:p.key}));
 }
 const memory=new Set();let signature='Lozano Painting',rendered='',collapseTimer=null;
 const remember=key=>{memory.add(key);try{localStorage.setItem(key,'1');}catch{}};
 const remembered=key=>{try{return memory.has(key)||localStorage.getItem(key)==='1';}catch{return memory.has(key)}};
 function render(){const box=document.getElementById('connectedHolidayNotice');if(!box)return;const list=events(),key=list.map(e=>e.date+':'+e.id).join('|'),identity=key+'|'+signature;if(identity===rendered)return;rendered=identity;clearTimeout(collapseTimer);if(!list.length){box.replaceChildren();return;}const closeKey='lozano-calendar-closed-v1:'+key;if(remembered(closeKey)){box.replaceChildren();return;}const seenKey='lozano-calendar-seen-v1:'+key,first=!remembered(seenKey);remember(seenKey);
  box.innerHTML='<details class="holiday-card" '+(first?'open':'')+'><summary>'+list.map(e=>'<span class="holiday-icon '+(first?'holiday-wave':'')+'" aria-hidden="true">'+e.icon+'</span> '+esc(e.title)).join(' · ')+'</summary><button type="button" id="holidayClose" class="holiday-close" aria-label="Cerrar aviso del día">×</button>'+list.map(e=>'<p>'+esc(e.body)+'</p>').join('')+'<small>— '+esc(signature)+'</small></details>';
  document.getElementById('holidayClose').onclick=()=>{clearTimeout(collapseTimer);remember(closeKey);box.replaceChildren();};const details=box.querySelector('details');if(first){collapseTimer=setTimeout(()=>{if(details?.isConnected)details.open=false;},8000);details?.addEventListener('toggle',()=>{if(!details.open)clearTimeout(collapseTimer);});}
 }
 window.LozanoCalendar={events,dateParts,update(data={}){signature=data.owner_signature||'Lozano Painting';render();}};
 setInterval(()=>{if(!document.hidden)render();},60000);
})();
