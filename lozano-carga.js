(()=>{
 const splash=document.getElementById('splash');if(!splash)return;
 const version='lp-rodillo-v1',today=new Date().toDateString(),key='lozano-splash-v1';let shown=false,finished=false,readyTimer=null;
 try{shown=localStorage.getItem(key)===version+':'+today;}catch{}
 const start=Date.now(),reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function birthday(){try{window.actualizarCelebracionesCumple?.();}catch{}}
 function remove(){splash.remove();birthday();}
 function finish(){if(finished)return;finished=true;clearTimeout(readyTimer);try{localStorage.setItem(key,version+':'+today);}catch{}splash.classList.add('is-ready');setTimeout(remove,reduced?0:320);}
 function ready(){if(shown){finish();return;}const remaining=Math.max(0,(reduced?0:1250)-(Date.now()-start));readyTimer=setTimeout(finish,remaining);}
 // Repeticiones en el mismo día no fuerzan otra espera. No espera consultas de Supabase.
 if(shown)finish();else if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
 // Una imagen o recurso externo que falle no deja bloqueada la pantalla.
 setTimeout(finish,4500);
})();
