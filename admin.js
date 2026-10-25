'use strict';
(()=>{
const cfg=window.LOZANO_CONFIG,$=id=>document.getElementById(id);
let session=null,colonies=[],stores=[],editing=null,editingStore=null,currentView='coloniesView';
const msg=(text,error=false)=>{$('message').textContent=text;$('message').classList.toggle('error',error);};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function fetchTimed(url,options){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);try{return await fetch(url,{...options,signal:controller.signal,cache:'no-store'});}finally{clearTimeout(timeout);}}
function forget(){session=null;sessionStorage.removeItem('lozano_admin_session');$('dashboard').hidden=true;$('loginPanel').hidden=false;if($('colonyDialog').open)$('colonyDialog').close();if($('storeDialog').open)$('storeDialog').close();$('stores').textContent='';$('colonies').textContent='';$('users').textContent='';$('history').textContent='';}
async function api(action,data={}){
 if(!session&&action!=='login')throw Error('Inicia sesión.');
 const headers={'Content-Type':'application/json',apikey:cfg.publishableKey};
 if(session?.owner)headers.Authorization='Bearer '+session.token;
 const response=await fetchTimed(cfg.url+'/functions/v1/'+cfg.adminFunction,{method:'POST',headers,body:JSON.stringify({action,data,owner:!!session?.owner,token:session?.owner?null:session?.token})});
 const result=await response.json().catch(()=>({error:'El servidor no devolvió una respuesta válida.'}));
 if(result.expired)forget();
 if(!response.ok||result.error)throw Error(result.error||'No se pudo completar la operación.');return result;
}
async function task(fn,errorTarget){
 document.querySelectorAll('button').forEach(b=>b.disabled=true);
 try{await fn();}catch(e){const text=e.name==='AbortError'?'La conexión tardó demasiado. Intenta nuevamente.':(e.message||'No se pudo conectar.');if(errorTarget)errorTarget.textContent=text;else msg(text,true);}
 finally{document.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
function remember(){sessionStorage.setItem('lozano_admin_session',JSON.stringify(session));}
function showView(id){currentView=id;for(const v of ['coloniesView','storesView','usersView','historyView'])$(v).hidden=v!==id;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===id));}
async function load(){
 const data=await api('list');colonies=data.colonies||[];stores=data.stores||[];session.owner=!!data.owner;remember();
 $('identity').textContent='Sesión: '+data.display_name;document.querySelectorAll('.ownerOnly').forEach(e=>e.hidden=!session.owner);
 $('loginPanel').hidden=true;$('dashboard').hidden=false;
 $('storeSelect').innerHTML='<option value="">TIENDA NO ASIGNADA</option>'+stores.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
 render();renderStores();if(!session.owner&&!['coloniesView','storesView'].includes(currentView))showView('coloniesView');
}
function render(){
 const search=$('search').value.trim().toLocaleLowerCase('es'),inactive=$('includeInactive').checked;
 const list=colonies.filter(c=>(inactive||c.active)&&c.name.toLocaleLowerCase('es').includes(search));
 $('count').textContent=`${list.length} colonias visibles · ${colonies.filter(c=>c.active).length} activas`;
 $('colonies').innerHTML=list.length?list.map(c=>`<article class="row ${c.active?'':'inactive'}"><div><h3>${esc(c.name)}${c.active?'':'<span class="badge">Desactivada</span>'}</h3><p>${esc(stores.find(s=>s.id===c.store_id)?.name||'TIENDA NO ASIGNADA')}</p><p>${esc(c.notes||'Sin observaciones')}</p></div><div class="tabs"><button data-edit="${c.id}">Editar</button><button data-active="${c.id}" class="${c.active?'danger':''}">${c.active?'Desactivar':'Reactivar'}</button></div></article>`).join(''):'<p class="panel">No hay colonias que coincidan.</p>';
}
function openColony(c){
 editing=c?{...c}:null;const form=$('colonyForm');form.reset();$('formError').textContent='';$('formTitle').textContent=c?'Editar '+c.name:'Agregar colonia';
 if(c){for(const name of ['name','location_url','notes','map_url','store_id'])form.elements[name].value=c[name]??'';form.elements.access_codes.value=c.access_codes.join('\n');}
 $('colonyDialog').showModal();form.elements.name.focus();
}
function renderStores(){
 const search=$('storeSearch').value.trim().toLocaleLowerCase('es');
 const list=stores.filter(s=>s.name.toLocaleLowerCase('es').includes(search));
 $('storeCount').textContent=`${list.length} tiendas`;
 $('stores').innerHTML=list.length?list.map(s=>{const count=colonies.filter(c=>c.store_id===s.id&&c.active).length;return `<article class="row"><div><h3>${esc(s.name)}</h3><p>${count} ${count===1?'colonia activa asignada':'colonias activas asignadas'}</p><a class="store-map" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Ver ubicación en Google Maps ↗</a></div><button data-edit-store="${s.id}">Editar tienda</button></article>`;}).join(''):'<p class="panel">No hay tiendas que coincidan.</p>';
}
function openStore(store){editingStore=store?{...store}:null;const form=$('storeForm');form.reset();$('storeError').textContent='';$('storeFormTitle').textContent=store?'Editar tienda':'Agregar tienda Sherwin-Williams';if(store){form.elements.name.value=store.name;form.elements.url.value=store.url;}$('storeDialog').showModal();form.elements.name.focus();}
$('storeSearch').oninput=renderStores;
$('newStore').onclick=()=>openStore(null);
$('closeStore').onclick=$('cancelStore').onclick=()=>$('storeDialog').close();
$('stores').onclick=e=>{const button=e.target.closest('[data-edit-store]');if(button)openStore(stores.find(s=>s.id===Number(button.dataset.editStore)));};
$('storeForm').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));if(editingStore){data.id=editingStore.id;data.updated_at=editingStore.updated_at;}$('storeError').textContent='';task(async()=>{await api('save_store',data);$('storeDialog').close();await load();msg('Tienda guardada. Ya puedes asignarla a las colonias.');},$('storeError'));};
$('editorMode').onclick=()=>{$('pinLogin').hidden=false;$('ownerLogin').hidden=true;$('editorMode').classList.add('selected');$('ownerMode').classList.remove('selected');};
$('ownerMode').onclick=()=>{$('pinLogin').hidden=true;$('ownerLogin').hidden=false;$('ownerMode').classList.add('selected');$('editorMode').classList.remove('selected');};
$('pinLogin').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form));task(async()=>{const login=await api('login',data);session={token:login.token,owner:false};form.elements.pin.value='';remember();await load();msg('Sesión iniciada.');});};
$('ownerLogin').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form));task(async()=>{const r=await fetchTimed(cfg.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();form.elements.password.value='';if(!r.ok)throw Error('Correo o contraseña incorrectos, o cuenta pendiente de confirmar.');session={token:result.access_token,owner:true};remember();try{await load();}catch(err){forget();throw err;}msg('Acceso principal iniciado.');});};
$('logout').onclick=()=>task(async()=>{try{if(session?.owner)await fetchTimed(cfg.url+'/auth/v1/logout',{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+session.token}});else await api('logout');}finally{forget();msg('Sesión cerrada.');}});
$('refresh').onclick=()=>task(async()=>{await load();msg('Lista actualizada.');});
$('search').oninput=render;$('includeInactive').onchange=render;$('newColony').onclick=()=>openColony(null);
$('closeDialog').onclick=$('cancelDialog').onclick=()=>$('colonyDialog').close();
$('colonies').onclick=e=>{const edit=e.target.closest('[data-edit]'),toggle=e.target.closest('[data-active]');if(edit)openColony(colonies.find(c=>c.id===edit.dataset.edit));if(toggle){const c=colonies.find(x=>x.id===toggle.dataset.active);if(confirm(`${c.active?'Desactivar':'Reactivar'} la colonia ${c.name}?`))task(async()=>{await api('set_active',{id:c.id,updated_at:c.updated_at,active:!c.active});await load();msg('Estado de la colonia actualizado.');});}};
$('colonyForm').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form));data.access_codes=data.access_codes.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);data.store_id=data.store_id?Number(data.store_id):null;if(editing){data.id=editing.id;data.updated_at=editing.updated_at;}$('formError').textContent='';task(async()=>{await api('save_colony',data);$('colonyDialog').close();await load();msg('Colonia guardada. La página pública la mostrará al actualizar.');},$('formError'));};
async function users(){const data=await api('users');$('users').innerHTML=data.users.map(u=>`<article class="row"><div><h3>${esc(u.display_name)}</h3><p>Usuario: ${esc(u.username)} · ${u.active?'Activo':'Desactivado'}</p></div><button data-user-id="${u.id}" data-active="${!u.active}" class="${u.active?'danger':''}">${u.active?'Desactivar acceso':'Reactivar acceso'}</button></article>`).join('')||'<p class="panel">Aún no has creado usuarios.</p>';}
$('userForm').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form));task(async()=>{await api('save_user',data);form.reset();await users();msg('Usuario guardado. Comunícale su PIN de forma privada.');});};
$('users').onclick=e=>{const b=e.target.closest('[data-user-id]');if(b&&confirm('¿Cambiar el acceso de esta persona? Sus sesiones actuales se cerrarán.'))task(async()=>{await api('user_active',{id:b.dataset.userId,active:b.dataset.active==='true'});await users();msg('Acceso actualizado.');});};
async function history(){const data=await api('audit');$('history').innerHTML=data.audit.map(a=>`<article class="row"><div><h3>${esc(a.name||a.table_name)}</h3><p>${esc(a.actor_username||'Importación / cuenta principal')} · ${esc(a.action)} · ${esc(new Date(a.changed_at).toLocaleString('es-MX'))}</p></div></article>`).join('')||'<p class="panel">Todavía no hay cambios registrados.</p>';}
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>task(async()=>{if(b.dataset.view==='usersView')await users();if(b.dataset.view==='historyView')await history();showView(b.dataset.view);}));
$('export').onclick=()=>task(async()=>{await load();const backup={version:1,exported_at:new Date().toISOString(),colonies,stores};const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lozano-respaldo-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);msg('Respaldo exportado. Incluye colonias activas y desactivadas.');});
try{const saved=JSON.parse(sessionStorage.getItem('lozano_admin_session')||'null');if(saved?.token){session=saved;task(async()=>{await load();msg('Sesión recuperada.');});}}catch{forget();}
})();
