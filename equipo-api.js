/* Adaptador único: para migrar proveedor, se sustituye esta capa y se conserva la interfaz. */
(()=>{
 const cfg=window.LP_STAGE_CONFIG;
 const endpoint=cfg.url+'/functions/v1/'+cfg.functionName;
 let pinToken=null,rootJWT=null;
 async function request(action,data={}){
  let response;try{response=await fetch(endpoint,{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json',...(rootJWT?{Authorization:'Bearer '+rootJWT}:{})},body:JSON.stringify({action,data,token:pinToken,root:!!rootJWT})});}catch{throw new Error('No se pudo conectar. Comprueba tu conexión y que la función de prueba esté desplegada.');}
  let result;try{result=await response.json();}catch{throw new Error('El servidor no respondió correctamente. Revisa el despliegue de prueba.');}
  if(!response.ok||result.error){const error=new Error(result.error||'No se pudo completar la operación.');error.expired=!!result.expired;throw error;}return result;
 }
 window.TeamRepository={
  async login(username,pin){this.clear();const result=await request('login',{username,pin});pinToken=result.token;return result;},
  async rootLogin(email,password){this.clear();let response;try{response=await fetch(cfg.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});}catch{throw new Error('No se pudo conectar con Supabase.');}const result=await response.json();if(!response.ok||!result.access_token)throw new Error('No se pudo iniciar sesión con ese correo y contraseña.');rootJWT=result.access_token;try{return await request('me');}catch(error){this.clear();throw error;}},
  async setup(data){const result=await request('setup',data);pinToken=result.token;return result;},
  me:()=>request('me'),users:()=>request('users'),saveUser:data=>request('save_user',data),setActive:data=>request('set_active',data),resetPin:data=>request('reset_pin',data),audit:before=>request('audit',{before}),export:()=>request('export'),
  async logout(){try{if(rootJWT){await fetch(cfg.url+'/auth/v1/logout',{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+rootJWT}});}else if(pinToken)await request('logout');}finally{this.clear();}},
  work:(action,data={})=>request(action,data),
  pay:(action,data={})=>request(action,data),
  bill:(action,data={})=>request(action,data),
  house:(action,data={})=>request(action,data),
  clear(){pinToken=null;rootJWT=null;}
 };
})();
