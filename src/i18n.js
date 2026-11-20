/* ========== i18n (DE / EN / PL) + Sidebar ========== */
(function(){
  const NUMRE=/0x[0-9A-Fa-f]+|\d+(?:[.,]\d+)*/g;
  const SKIP='pre.code,.log,.report,script,style,textarea';
  const ORIG=new WeakMap();let lang='de';
  const origTitle=document.title;
  function tr(s){
    if(lang==='de'||!s)return s;
    const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);const core=m[2].replace(/\s+/g,' ');if(!core)return s;
    const nums=[];const key=core.replace(NUMRE,x=>{nums.push(x);return '§';});
    const e=I18N_DICT[key];if(!e)return s;let t=e[lang==='en'?0:1];if(t==null||t==='')return s;
    let k=0;t=t.replace(/§/g,()=>nums[k++]??'');return (/^[.,;:)]/.test(t)?'':m[1])+t+m[3];
  }
  function walk(n){
    if(n.nodeType===3){const p=n.parentElement;if(!p||p.closest(SKIP))return;let o=ORIG.get(n);if(o===undefined){o=n.data;ORIG.set(n,o);}const v=tr(o);if(n.data!==v)n.data=v;return;}
    if(n.nodeType!==1||n.matches(SKIP))return;
    for(const a of ['aria-label','title','placeholder']){if(n.hasAttribute(a)){const k='data-o-'+a;if(!n.hasAttribute(k))n.setAttribute(k,n.getAttribute(a));const v=tr(n.getAttribute(k));if(n.getAttribute(a)!==v)n.setAttribute(a,v);}}
    for(const c of n.childNodes)walk(c);
  }
  const obs=new MutationObserver(ms=>{if(lang!=='de')for(const m of ms)for(const n of m.addedNodes)walk(n);obs.takeRecords();});
  function setLang(l,save){
    lang=l;document.documentElement.lang=l;
    const LB={de:['⚠ Falle: ','➕ Merke: ','✓ richtig · '],en:['⚠ Pitfall: ','➕ Remember: ','✓ correct · '],pl:['⚠ Pułapka: ','➕ Zapamiętaj: ','✓ dobrze · ']}[l];
    const rs=document.documentElement.style;rs.setProperty('--lbl-trap',JSON.stringify(LB[0]));rs.setProperty('--lbl-tip',JSON.stringify(LB[1]));rs.setProperty('--lbl-ok',JSON.stringify(LB[2]));walk(document.body);document.title=tr(origTitle);
    document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l?'true':'false'));
    if(save){try{localStorage.setItem('aos-lang',l);}catch(e){}}
  }
  window.aosLang=()=>lang;
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang,true)));
  obs.observe(document.body,{childList:true,subtree:true});
  let saved=null;try{saved=localStorage.getItem('aos-lang');}catch(e){}
  if(saved==='en'||saved==='pl')setLang(saved,false);
  // Sidebar ein-/ausklappen
  const tg=document.getElementById('navToggle');
  function setNav(collapsed,save){document.body.classList.toggle('nav-collapsed',collapsed);tg.setAttribute('aria-expanded',collapsed?'false':'true');tg.textContent=collapsed?'☰ Inhalt einblenden':'☰ Inhalt ausblenden';if(save){try{localStorage.setItem('aos-nav',collapsed?'1':'0');}catch(e){}}}
  tg.addEventListener('click',()=>setNav(!document.body.classList.contains('nav-collapsed'),true));
  let nv=null;try{nv=localStorage.getItem('aos-nav');}catch(e){}
  if(nv==='1')setNav(true,false);
})();
