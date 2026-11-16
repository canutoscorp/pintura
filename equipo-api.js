/* Acceso compartido por módulos. Solo se conserva el token temporal en esta pestaña. */
(()=>{
 const cfg=window.LP_STAGE_CONFIG,endpoint=cfg.url+'/functions/v1/'+cfg.functionName,sessionKey='lozano_session_v1:'+cfg.url+':'+cfg.functionName;
 let pinToken=null,rootJWT=null,authVersion=0;
 function removeSaved(){try{window.sessionStorage.removeItem(sessionKey);}catch{}}
 function clear(){authVersion++;pinToken=null;rootJWT=null;removeSaved();}
 function save(kind,token,seconds){if(typeof token!=='string'||!token)return;try{window.sessionStorage.setItem(sessionKey,JSON.stringify({version:1,kind,token,expiresAt:Date.now()+seconds*1000}));}catch{}}
 function saved(){try{const raw=window.sessionStorage.getItem(sessionKey);if(!raw)return null;const s=JSON.parse(raw);if(s.version!==1||!['pin','root'].includes(s.kind)||typeof s.token!=='string'||!s.token||s.token.length>16384||!Number.isFinite(s.expiresAt)||s.expiresAt<=Date.now()){removeSaved();return null;}return s;}catch{removeSaved();return null;}}
 async function request(action,data={},anonymous=false){
  let response;try{response=await fetch(endpoint,{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json',...(rootJWT&&!anonymous?{Authorization:'Bearer '+rootJWT}:{})},body:JSON.stringify({action,data,token:anonymous?null:pinToken,root:!anonymous&&!!rootJWT})});}catch{throw new Error('No se pudo conectar. Comprueba tu conexión y que la función de prueba esté desplegada.');}
  let result;try{result=await response.json();}catch{throw new Error('El servidor no respondió correctamente. Revisa el despliegue de prueba.');}
  if(!response.ok||result.error){const error=new Error(result.error||'No se pudo completar la operación.');error.expired=!!result.expired||response.status===401;error.status=response.status;throw error;}return result;
 }
 window.TeamRepository={
  async login(username,pin){this.clear();const version=authVersion,result=await request('login',{username,pin});if(version!==authVersion)throw Error('El acceso cambió. Vuelve a intentarlo.');pinToken=result.token;save('pin',pinToken,result.setup_required?15*60:8*60*60);return result;},
  async rootLogin(email,password){this.clear();const version=authVersion;let response;try{response=await fetch(cfg.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});}catch{throw new Error('No se pudo conectar con Supabase.');}const result=await response.json();if(!response.ok||!result.access_token)throw new Error('No se pudo iniciar sesión con ese correo y contraseña.');if(version!==authVersion)throw Error('El acceso cambió. Vuelve a intentarlo.');rootJWT=result.access_token;try{const verified=await request('me');if(version!==authVersion)throw Error('El acceso cambió. Vuelve a intentarlo.');save('root',rootJWT,Math.min(Math.max(Number(result.expires_in)||3600,60),8*60*60));return verified;}catch(error){if(version===authVersion)this.clear();throw error;}},
  async setup(data){const version=authVersion,result=await request('setup',data);if(version!==authVersion)throw Error('El acceso cambió. Vuelve a intentarlo.');pinToken=result.token;save('pin',pinToken,8*60*60);return result;},
  async restore(){const s=saved();if(!s)return null;const version=authVersion;pinToken=s.kind==='pin'?s.token:null;rootJWT=s.kind==='root'?s.token:null;try{const result=await request('me');return version===authVersion?result:null;}catch(error){if(version!==authVersion)return null;if(error.expired||error.status===403){clear();return null;}pinToken=null;rootJWT=null;throw error;}},
  me:()=>request('me'),users:()=>request('users'),saveUser:data=>request('save_user',data),setActive:data=>request('set_active',data),resetPin:data=>request('reset_pin',data),audit:before=>request('audit',{before}),export:()=>request('export'),
  async logout(){try{if(rootJWT){await fetch(cfg.url+'/auth/v1/logout',{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+rootJWT}});}else if(pinToken)await request('logout');}finally{this.clear();}},
  work:(action,data={})=>request(action,data),pay:(action,data={})=>request(action,data),bill:(action,data={})=>request(action,data),house:(action,data={})=>request(action,data),site:(action,data={})=>request(action,data),sitePublic:data=>request('site_public',data,true),clear
 };
})();
