/* Borradores locales por cuenta. Nunca guarda credenciales ni envía datos por sí solo. */
(()=>{
 const states=new Set();let actor=null,toastTimer;
 const scope=()=> 'lozano-draft-v1:'+location.pathname+':'+(actor?.id||actor?.username||'root')+':';
 function visible(s){return s.form.isConnected&&!s.form.closest('[hidden]');}
 function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
 function remove(key){try{localStorage.removeItem(key);}catch{}}
 function fields(form,names){const data={};for(const name of names){const f=form.elements.namedItem(name);if(f)data[name]=f.type==='checkbox'?f.checked:f.value;}return data;}
 function fill(form,data){for(const [name,value] of Object.entries(data||{})){const f=form.elements.namedItem(name);if(!f||!['string','number','boolean'].includes(typeof value))continue;if(f.type==='checkbox')f.checked=!!value;else f.value=String(value);}}
 function success(message){let box=document.getElementById('lozanoSaved');if(!box){box=document.createElement('div');box.id='lozanoSaved';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box);}box.textContent='✓ '+message;box.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.hidden=true,6500);}
 async function attach(form,kind,capture,restore){if(!actor||!form||!form.isConnected)return null;for(const s of states)if(!s.form.isConnected)states.delete(s);const s={form,key:scope()+kind,dirty:false,restoring:false,version:0,capture};states.add(s);
  s.touch=()=>{if(s.restoring||!actor||!form.isConnected)return;s.dirty=true;s.version++;try{localStorage.setItem(s.key,JSON.stringify({version:1,savedAt:Date.now(),data:capture()}));}catch{const hint=form.querySelector('.draft-hint');if(hint)hint.textContent='No se pudo guardar el borrador en este navegador. Guarda antes de salir.';}};
  form.addEventListener('input',s.touch);form.addEventListener('change',s.touch);
  const hint=document.createElement('p');hint.className='muted draft-hint';hint.textContent='Borrador solo en este navegador. Para enviarlo al patrón, guarda la captura.';form.appendChild(hint);
  const saved=read(s.key);if(saved?.version===1&&saved.data&&Date.now()-saved.savedAt<30*86400000){if(confirm('Tienes una captura sin guardar en esta cuenta. ¿Quieres recuperarla?')){s.restoring=true;form.inert=true;try{await restore(saved.data);if(form.isConnected){s.dirty=true;hint.textContent='Borrador recuperado. Revisa los datos antes de guardar.';}}catch(error){hint.textContent='No se pudo recuperar el borrador: '+error.message;}finally{s.restoring=false;form.inert=false;}}else remove(s.key);}return s;
 }
 function ticket(form){const s=[...states].find(s=>s.form===form);return s?{s,version:s.version}:null;}
 function saved(t,message){if(t&&t.s.version===t.version){t.s.dirty=false;remove(t.s.key);}success(message);}
 function discard(form){for(const s of states)if(s.form===form){s.dirty=false;remove(s.key);}}
 function leave(){const dirty=[...states].filter(s=>visible(s)&&s.dirty);if(!dirty.length)return true;if(!confirm('Hay cambios sin guardar. ¿Salir de esta sección? El borrador quedará en este navegador.'))return false;dirty.forEach(s=>s.dirty=false);return true;}
 window.addEventListener('beforeunload',event=>{if([...states].some(s=>visible(s)&&s.dirty)){event.preventDefault();event.returnValue='';}});
 window.addEventListener('lozano-auth-ready',event=>{states.clear();actor=event.detail;});window.addEventListener('lozano-auth-closed',()=>{actor=null;states.clear();});
 // Intercepta antes del controlador de cierre de sesión; una sesión vencida se cierra siempre.
 document.addEventListener('click',event=>{if(event.target.closest('#logout,#connectedLogoutButton')&&!leave()){event.preventDefault();event.stopImmediatePropagation();}},true);
 window.LozanoDrafts={attach,fields,fill,ticket,saved,discard,leave,success};
})();
