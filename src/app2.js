/* ========== 2.2 Page fault animation ========== */
const PF={i:1,steps:[
  {b:['cpu','mmu','pmt','os'],a:'1',t:'<b>1 · Referenz & Trap</b> – Prozess greift auf eine Seite zu. Die MMU liest den PMT-Eintrag: <b>presence bit = 0</b> → Hardware löst einen <b>TRAP</b> ans OS aus.'},
  {b:['os'],a:'',t:'<b>2 · Gültigkeit prüfen</b> – OS prüft, ob die Adresse zum Prozess gehört. Nein → Prozess beenden (segfault). Ja → Seite muss nachgeladen werden.'},
  {b:['os','ram','disk'],a:'3',t:'<b>3 · Frame finden</b> – freien Frame suchen. Keiner frei → <b>replacement algorithm</b> wählt ein victim. Ist es <b>dirty (M = 1)</b> → <b>page out</b> auf Disk.'},
  {b:['disk','ram'],a:'4',t:'<b>4 · Page in</b> – gewünschte Seite von Disk in den Frame laden. Der Prozess ist <b>blocked</b>, die CPU führt andere Prozesse aus.'},
  {b:['os','pmt'],a:'5',t:'<b>5 · PMT aktualisieren</b> – frame eintragen, <b>presence = 1</b>; beim victim presence = 0.'},
  {b:['cpu'],a:'6',t:'<b>6 · Neustart</b> – die unterbrochene Instruktion wird <b>neu gestartet</b> (HW muss das unterstützen). Diesmal Treffer.'}]};
function pfRender(){
  const s=PF.steps[PF.i-1];
  $$('#pf-fig [data-b]').forEach(g=>g.classList.toggle('on',s.b.includes(g.dataset.b)));
  $$('#pf-fig path[data-a]').forEach(p=>{const on=p.dataset.a===s.a;p.classList.toggle('on',on);p.setAttribute('marker-end',on?'url(#ahon)':'url(#ah)');});
  $$('#pf-fig text[data-a]').forEach(t=>t.classList.toggle('on',t.dataset.a===s.a));
  $('#pf-text').innerHTML=s.t;$('#pf-count').textContent=`Schritt ${PF.i} / 6`;
  $('#pf-prev').disabled=PF.i===1;$('#pf-next').disabled=PF.i===6;
}
$('#pf-next').addEventListener('click',()=>{if(PF.i<6){PF.i++;pfRender();}});
$('#pf-prev').addEventListener('click',()=>{if(PF.i>1){PF.i--;pfRender();}});
pfRender();

/* EAT with PF */
function eatpf(){
  const m=+$('#eatpf-m').value,T=+$('#eatpf-t').value*1e6,x=+$('#eatpf-x').value;
  let ps=$('#eatpf-p').value.trim(),p;
  if(/^1\s*\/\s*\d+$/.test(ps))p=1/+ps.split('/')[1];else p=parseFloat(ps.replace(',','.'));
  if(!(p>=0&&p<=1)){$('#eatpf-out').innerHTML=badT('p zwischen 0 und 1 (z. B. 0.001 oder 1/1000)');return;}
  const eat=(1-p)*m+p*T,maxp=(m*x/100)/(T-m);
  $('#eatpf-out').innerHTML=`<div class="formula">EAT = (1−p)·m + p·t_PF = ${(1-p).toPrecision(4)}·${m} + ${p}·${T.toLocaleString('de-DE')} = <b>${fmtNum(eat)} ns</b></div>
  <p>→ <b>${(eat/m).toFixed(1)}×</b> langsamer als ohne PFs.</p>
  <p>Für max. ${x} % Verlangsamung: p ≤ ${m}·${x/100} / (${T.toLocaleString('de-DE')} − ${m}) = <b>${maxp.toExponential(2)}</b> → höchstens 1 PF pro <b>${Math.round(1/maxp).toLocaleString('de-DE')}</b> Zugriffe.</p>`;
}
['#eatpf-m','#eatpf-t','#eatpf-p','#eatpf-x'].forEach(s=>$(s).addEventListener('input',eatpf));eatpf();

/* ========== 2.4 Thrashing ========== */
const thU=d=>100*(1-Math.exp(-d/2.4))/(1+Math.exp((d-13)/1.3));
function thRender(){
  const d=+$('#th-d').value;$('#th-v').textContent=d;
  const pts=range(24).map(i=>[i+1,+thU(i+1).toFixed(1)]);const peak=pts.reduce((a,c)=>c[1]>a[1]?c:a);
  lineChart($('#th-chart'),{series:[{name:'CPU-Auslastung',pts}],area:true,integerX:true,yMax:100,xLabel:'degree of multiprogramming (Prozesse im Speicher)',yLabel:'CPU-Auslastung %',vline:{x:d,label:`${d} → ${thU(d).toFixed(0)} %`},aria:'Thrashing-Kurve',h:260});
  let t;
  if(d<peak[0]-3)t='<b>Unterausgelastet</b>: mehr Prozesse → CPU hat mehr zu tun, Auslastung steigt.';
  else if(d<=peak[0]+1)t=`<b>Optimum</b> (~${peak[0]} Prozesse): jeder Prozess hat genug frames für sein working set.`;
  else t=`${badT('Thrashing')}: Summe der working sets &gt; frames. Prozesse warten nur noch auf Paging, die Auslastung bricht ein. Lösung: <b>Multiprogramming reduzieren</b>, local replacement, WS/PFF.`;
  $('#th-text').innerHTML=t;
}
$('#th-d').addEventListener('input',thRender);thRender();

/* Working set */
function wsRender(){
  const refs=$('#ws-refs').value.trim().split(/[\s,;]+/).filter(Boolean);
  const D=Math.max(1,+$('#ws-delta').value),sl=$('#ws-t');sl.max=Math.max(1,refs.length);
  if(+sl.value>refs.length)sl.value=refs.length;const t=+sl.value;$('#ws-tv').textContent=t;
  if(!refs.length){$('#ws-out').innerHTML=badT('Referenzfolge eingeben');return;}
  const wsAt=k=>new Set(refs.slice(Math.max(0,k-D),k));
  let h='<div class="tablewrap"><table class="rep"><tr><th class="rowh">t</th>'+refs.map((_,i)=>`<th>${i+1}</th>`).join('')+'</tr>';
  h+='<tr><th class="rowh">Referenz</th>'+refs.map((r,i)=>`<td class="${i>=t-D&&i<t?'win':''}${i===t-1?' tcur':''}">${esc(r)}</td>`).join('')+'</tr>';
  h+='<tr><th class="rowh">|WS(t)|</th>'+refs.map((_,i)=>`<td class="small${i===t-1?' tcur':''}">${wsAt(i+1).size}</td>`).join('')+'</tr></table></div>';
  const ws=[...wsAt(t)].sort((a,b)=>a-b||String(a).localeCompare(String(b)));
  h+=`<p>Fenster = die letzten Δ = ${D} Referenzen bis t = ${t} (markiert). <span class="result">WS(${t}, ${D}) = {${ws.join(', ')}}</span> · |WS| = <b>${ws.length}</b></p>`;
  $('#ws-out').innerHTML=h;
}
['#ws-refs','#ws-delta','#ws-t'].forEach(s=>$(s).addEventListener('input',wsRender));
$('#ws-slide').addEventListener('click',()=>{$('#ws-refs').value='1 2 1 5 7 7 7 5 1';$('#ws-delta').value=5;$('#ws-t').max=9;$('#ws-t').value=9;wsRender();});
wsRender();

/* PFF */
function pffRender(){
  const r=+$('#pff-r').value,lo=20,up=70;$('#pff-v').textContent=r+' PFs / 1000 Ref.';
  const v=r>up?badT('über upper threshold → Prozess bekommt mehr frames'):r<lo?'<b>unter lower threshold → frames werden weggenommen</b> (gehen an andere Prozesse)':okT('zwischen den Schwellen → frames bleiben');
  $('#pff-out').innerHTML=`<div class="pffbar"><div class="z z1" style="width:${lo}%">&lt; lower</div><div class="z z2" style="width:${up-lo}%">ok</div><div class="z z3" style="width:${100-up}%">&gt; upper</div><div class="pffmark" style="left:${r}%">▼ ${r}</div></div><p>${v}</p>`;
}
$('#pff-r').addEventListener('input',pffRender);pffRender();

/* ========== 2.5 Buddy ========== */
const BD={total:1024,min:32,
  demo:[['a','A',70],['a','B',35],['a','C',80],['f','A'],['a','D',60],['f','B'],['f','D'],['f','C']],
  reset(){this.blocks=[{start:0,size:1024,free:true}];this.di=0;this.msg='1024 KiB, ein freier Block.';this.render();},
  nextName(){const used=new Set(this.blocks.filter(b=>!b.free).map(b=>b.name));for(let c=65;c<91;c++){const n=String.fromCharCode(c);if(!used.has(n))return n;}return '?';},
  alloc(req,name){
    if(!(req>=1&&req<=1024)){this.msg=badT('Anfrage 1–1024 KiB');this.render();return;}
    let need=this.min;while(need<req)need*=2;
    let c=this.blocks.filter(b=>b.free&&b.size>=need).sort((a,b)=>a.size-b.size||a.start-b.start)[0];
    name=name||this.nextName();
    if(!c){this.msg=badT(`${name} = ${req} KiB: kein freier Block ≥ ${need} KiB`);this.render();return;}
    const log=[];
    while(c.size>need){const h=c.size/2,i=this.blocks.indexOf(c),a={start:c.start,size:h,free:true},b={start:c.start+h,size:h,free:true};this.blocks.splice(i,1,a,b);log.push(`teile ${h*2} → ${h} + ${h}`);c=a;}
    c.free=false;c.name=name;c.req=req;
    this.msg=`${okT(`${name} = ${req} KiB → Block ${need} KiB @ ${c.start}`)}${log.length?' · '+log.map(x=>`<span>${x}</span>`).join(', '):''} · internal fragmentation <b>${need-req} KiB</b>`;this.render();},
  free(name){
    let b=this.blocks.find(x=>!x.free&&x.name===name);if(!b)return;b.free=true;delete b.name;const log=[];
    for(;;){const bs=b.start^b.size;const bud=this.blocks.find(x=>x.start===bs&&x.size===b.size&&x.free);
      if(!bud||b.size>=this.total)break;
      const ns={start:Math.min(b.start,bud.start),size:b.size*2,free:true};
      const i=Math.min(this.blocks.indexOf(b),this.blocks.indexOf(bud));this.blocks=this.blocks.filter(x=>x!==b&&x!==bud);this.blocks.splice(i,0,ns);
      log.push(`Buddy @${bud.start} frei → verschmelze zu ${ns.size} @${ns.start}`);b=ns;}
    this.msg=`<b>${name} freigegeben.</b> ${log.length?log.map(x=>`<span>${x}</span>`).join(' · '):'Buddy belegt → kein Verschmelzen.'}`;this.render();},
  render(){
    $('#bd-bar').innerHTML='<div class="membar">'+this.blocks.map(b=>`<div class="blk ${b.free?'hole':'new'}" style="flex:${b.size}" title="@${b.start}, ${b.size} KiB">${b.free?`<span>${b.size}</span><span>frei</span>`:`<b>${b.name}</b><span>${b.req}→${b.size}</span>`}</div>`).join('')+'</div>';
    const used=this.blocks.filter(b=>!b.free);
    $('#bd-free').innerHTML=used.length?used.map(b=>`<button class="btn small" type="button" data-bdf="${b.name}">${b.name} freigeben</button>`).join(''):'<span class="muted">Keine belegten Blöcke.</span>';
    $$('[data-bdf]').forEach(x=>x.addEventListener('click',()=>this.free(x.dataset.bdf)));
    $('#bd-log').innerHTML=this.msg;
    const d=this.demo[this.di];$('#bd-demo').textContent=d?`Beispiel: ${d[0]==='a'?`${d[1]} = ${d[2]} KiB anfordern`:`${d[1]} freigeben`} ▶`:'Beispiel fertig';$('#bd-demo').disabled=!d;}
};
$('#bd-alloc').addEventListener('click',()=>BD.alloc(+$('#bd-size').value));
$('#bd-reset').addEventListener('click',()=>BD.reset());
$('#bd-demo').addEventListener('click',()=>{if(BD.di===0&&BD.blocks.length>1){const d=BD.di;BD.reset();BD.di=d;}const d=BD.demo[BD.di++];if(!d)return;if(d[0]==='a')BD.alloc(d[2],d[1]);else BD.free(d[1]);});
BD.reset();

/* ========== 2.6 Replacement simulator ========== */
function parseRefs(str,dedup){let a=String(str).trim().split(/[\s,;]+/).filter(Boolean).map(Number).filter(n=>!isNaN(n));if(dedup)a=a.filter((v,i)=>i===0||v!==a[i-1]);return a;}
function simRep(refs,F,alg,r1){
  const slots=Array(F).fill(null),Rb=Array(F).fill(0),loadT=Array(F).fill(-1),useT=Array(F).fill(-1);let queue=[];const steps=[];let faults=0;
  refs.forEach((p,t)=>{
    const idx=slots.indexOf(p);const st={ref:p,hit:idx>=0,loaded:-1,victim:null,expl:''};
    if(idx>=0){useT[idx]=t;if(alg==='SC')Rb[idx]=1;st.expl=`t${t+1}: Treffer, ${p} liegt in Frame ${idx+1}.`+(alg==='SC'?` R-Bit von ${p} ← 1.`:alg==='LRU'?` ${p} ist jetzt zuletzt benutzt.`:'');}
    else{faults++;let slot=slots.indexOf(null);
      if(slot>=0)st.expl=`t${t+1}: <b>PF</b>, ${p} fehlt, freier Frame ${slot+1}.`;
      else{
        if(alg==='FIFO'){slot=queue[0];st.expl=`t${t+1}: <b>PF</b>. FIFO: älteste <i>geladene</i> Seite ist ${slots[slot]} (geladen t${loadT[slot]+1}) → raus.`;}
        else if(alg==='LRU'){slot=0;for(let s=1;s<F;s++)if(useT[s]<useT[slot])slot=s;st.expl=`t${t+1}: <b>PF</b>. LRU: ${slots[slot]} am längsten nicht benutzt (zuletzt t${useT[slot]+1}) → raus.`;}
        else if(alg==='OPT'){const nx=slots.map(q=>{for(let k=t+1;k<refs.length;k++)if(refs[k]===q)return k;return Infinity;});
          let best=0;for(let s=1;s<F;s++){if(nx[s]>nx[best]||(nx[s]===nx[best]&&loadT[s]<loadT[best]))best=s;}slot=best;
          st.expl=`t${t+1}: <b>PF</b>. OPT, nächste Nutzung: <span class="mono">${slots.map((q,s)=>`${q}→${nx[s]===Infinity?'∞':'t'+(nx[s]+1)}`).join(', ')}</span> → ${slots[slot]} raus (am spätesten/nie).`;}
        else{const given=[];while(Rb[queue[0]]===1){const s=queue.shift();Rb[s]=0;queue.push(s);given.push(slots[s]);}slot=queue[0];
          st.expl=`t${t+1}: <b>PF</b>. 2nd chance: ${given.length?`R=1 bei <span class="mono">${given.join(', ')}</span> → R←0, ans Ende. `:''}Erste mit R=0: ${slots[slot]} → raus.`;}
        st.victim=slots[slot];}
      queue=queue.filter(s=>s!==slot);queue.push(slot);slots[slot]=p;loadT[slot]=t;useT[slot]=t;Rb[slot]=(alg==='SC'&&r1)?1:0;st.loaded=slot;}
    st.frames=slots.slice();st.r=Rb.slice();
    st.order=alg==='LRU'?range(F).filter(s=>slots[s]!==null).sort((a,b)=>useT[a]-useT[b]).map(s=>String(slots[s])):alg==='OPT'?[]:queue.map(s=>alg==='SC'?`${slots[s]}${sup(Rb[s])}`:String(slots[s]));
    steps.push(st);});
  return {steps,faults};
}
function repTableHTML(refs,F,alg,res,upto){
  const n=refs.length;upto=upto??n;
  let h='<table class="rep"><tr><th class="rowh">t</th>'+refs.map((_,i)=>`<th class="${i===upto-1?'cur':''}">${i+1}</th>`).join('')+'</tr>';
  h+='<tr><th class="rowh">Referenz</th>'+refs.map((r,i)=>`<td class="${i===upto-1?'cur':''}"><b>${r}</b></td>`).join('')+'</tr>';
  for(let f=0;f<F;f++){h+=`<tr><th class="rowh">Frame ${f+1}</th>`;
    res.steps.forEach((s,i)=>{if(i>=upto){h+='<td class="hide"></td>';return;}const v=s.frames[f];const cls=[s.loaded===f?'new':'',i===upto-1?'cur':''].join(' ');
      h+=`<td class="${cls}">${v===null?'':v}${alg==='SC'&&v!==null?`<sup>${s.r[f]}</sup>`:''}</td>`;});h+='</tr>';}
  h+='<tr class="pfrow"><th class="rowh">PF</th>'+res.steps.map((s,i)=>i>=upto?'<td class="hide"></td>':`<td class="${s.hit?'':'x'}${i===upto-1?' cur':''}">${s.hit?'·':'✗'}</td>`).join('')+'</tr>';
  if(alg!=='OPT')h+=`<tr><th class="rowh">${alg==='LRU'?'LRU → MRU':'Queue alt → neu'}</th>`+res.steps.map((s,i)=>i>=upto?'<td class="hide"></td>':`<td class="small">${s.order.join(' ')}</td>`).join('')+'</tr>';
  return h+'</table>';
}
const RP={pos:0};
function rpCompute(){
  RP.refs=parseRefs($('#rp-refs').value,$('#rp-dedup').checked);RP.F=Math.max(1,Math.min(10,+$('#rp-f').value));RP.alg=$('#rp-alg').value;
  RP.res=simRep(RP.refs,RP.F,RP.alg,$('#rp-r1').checked);RP.pos=RP.refs.length;rpRender();rpChart();
}
function rpRender(){
  const n=RP.refs.length;if(!n){$('#rp-table').innerHTML=badT('Reference string eingeben');return;}
  $('#rp-table').innerHTML=repTableHTML(RP.refs,RP.F,RP.alg,RP.res,RP.pos);
  $('#rp-pos').textContent=`Spalte ${RP.pos} / ${n}`;
  $('#rp-explain').innerHTML=RP.pos?RP.res.steps[RP.pos-1].expl:'Start: alle Frames leer. „Schritt ▶“ füllt die nächste Spalte.';
  const pf=RP.res.steps.slice(0,RP.pos).filter(s=>!s.hit).length;
  $('#rp-sum').innerHTML=`<span class="result">Page Faults bis hier: ${pf}${RP.pos===n?` von ${n} Referenzen (${(pf/n*100).toFixed(0)} %)`:''}</span>`;
}
function rpChart(){
  const refs=RP.refs;if(!refs.length){$('#rp-chart').innerHTML='';return;}
  const distinct=new Set(refs).size,maxF=Math.max(2,Math.min(10,distinct+1));
  const algs=[['FIFO','FIFO'],['LRU','LRU'],['OPT','OPT'],['SC','2nd chance']];
  const series=algs.map(([a,n])=>({name:n,pts:range(maxF).map(i=>[i+1,simRep(refs,i+1,a,$('#rp-r1').checked).faults])}));
  lineChart($('#rp-chart'),{series,integerX:true,xLabel:'Anzahl Frames',yLabel:'Page Faults',aria:'Page Faults je Frame-Anzahl',h:250,yMax:niceMax(refs.length)});
  const fifo=series[0].pts;const bel=[];for(let i=0;i+1<fifo.length;i++)if(fifo[i+1][1]>fifo[i][1])bel.push(`${fifo[i][0]} → ${fifo[i+1][0]} frames: ${fifo[i][1]} → ${fifo[i+1][1]} PFs`);
  $('#rp-chart').insertAdjacentHTML('beforeend',bel.length?`<p>${badT("Belady's anomaly bei FIFO")}: ${bel.map(x=>`<span>${x}</span>`).join('; ')}</p>`:'<p class="muted">Keine Belady-Anomalie in diesem String.</p>');
}
['#rp-refs','#rp-f','#rp-alg','#rp-dedup','#rp-r1'].forEach(s=>$(s).addEventListener('change',rpCompute));
$('#rp-refs').addEventListener('input',rpCompute);
$('#rp-next').addEventListener('click',()=>{if(RP.pos<RP.refs.length){RP.pos++;rpRender();}});
$('#rp-prev').addEventListener('click',()=>{if(RP.pos>0){RP.pos--;rpRender();}});
$('#rp-first').addEventListener('click',()=>{RP.pos=0;rpRender();});
$('#rp-all').addEventListener('click',()=>{RP.pos=RP.refs.length;rpRender();});
$('#rp-belady').addEventListener('click',()=>{$('#rp-refs').value='1 2 3 4 1 2 5 1 2 3 4 5';$('#rp-f').value=3;$('#rp-alg').value='FIFO';rpCompute();});
$('#rp-rand').addEventListener('click',()=>{let a=[];while(a.length<14){const v=ri(1,6);if(a[a.length-1]!==v)a.push(v);}$('#rp-refs').value=a.join(' ');rpCompute();});
rpCompute();

/* ========== 2.7 NFU / Aging ========== */
const AG={names:['A','B','C','D','E','F'],demo:[[1,0,1,0,1,1],[1,1,0,0,1,0],[1,1,0,1,0,1],[1,0,0,0,1,0],[0,1,1,0,0,0]],
  reset(){this.c=Array(6).fill(0);this.nfu=Array(6).fill(0);this.r=Array(6).fill(0);this.hist=[];this.di=0;this.render();},
  tick(){const rb=this.r.slice();this.c=this.c.map((v,i)=>(v>>1)|(rb[i]<<7));this.nfu=this.nfu.map((v,i)=>v+rb[i]);this.hist.push({r:rb,c:this.c.slice()});this.r=Array(6).fill(0);this.render();},
  render(){
    $('#ag-rbits').innerHTML=this.names.map((n,i)=>`<button class="rbtn" type="button" aria-pressed="${this.r[i]?'true':'false'}" data-ag="${i}">${n}: R=${this.r[i]}</button>`).join('');
    $$('[data-ag]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.ag;this.r[i]^=1;this.render();}));
    const minA=Math.min(...this.c),minN=Math.min(...this.nfu);const va=this.c.indexOf(minA),vn=this.nfu.indexOf(minN);
    let h='<table class="t compact"><tr><th>Tick</th>'+this.names.map(n=>`<th>${n}</th>`).join('')+'</tr>';
    this.hist.forEach((x,k)=>{h+=`<tr class="${k===this.hist.length-1?'hl':''}"><td>${k} (R: ${x.r.join('')})</td>`+x.c.map(v=>`<td class="mono">${binStr(v,8)}</td>`).join('')+'</tr>';});
    if(!this.hist.length)h+=`<tr><td colspan="7" class="muted">noch kein Tick – alle counter 00000000</td></tr>`;
    h+='<tr><td><b>Aging dez</b></td>'+this.c.map((v,i)=>`<td class="num">${i===va?`<b><u>${v} ← Opfer</u></b>`:v}</td>`).join('')+'</tr>';
    h+='<tr><td><b>NFU counter</b></td>'+this.nfu.map((v,i)=>`<td class="num">${i===vn?`<b><u>${v} ← Opfer</u></b>`:v}</td>`).join('')+'</tr></table>';
    $('#ag-table').innerHTML=h;
    $('#ag-text').innerHTML=this.hist.length?`Aging wählt <b>${this.names[va]}</b>, NFU wählt <b>${this.names[vn]}</b>. ${va!==vn?'Unterschiedlich: Aging gewichtet <b>neue</b> Zugriffe stärker (MSB), NFU zählt nur die Summe.':'Hier gleiche Wahl.'} Pro Tick: counter &gt;&gt; 1, R ins MSB, dann alle R ← 0.`:'R-Bits setzen und „Clock-Tick“ drücken.';
    const d=this.demo[this.di];$('#ag-demo').textContent=d?`Tanenbaum-Beispiel Tick ${this.di} (R=${d.join('')}) ▶`:'Beispiel fertig';$('#ag-demo').disabled=!d;}
};
$('#ag-tick').addEventListener('click',()=>AG.tick());
$('#ag-reset').addEventListener('click',()=>AG.reset());
$('#ag-demo').addEventListener('click',()=>{if(AG.di===0&&AG.hist.length){AG.reset();}const d=AG.demo[AG.di++];if(!d)return;AG.r=d.slice();AG.tick();});
AG.reset();

/* Linux aging */
const LA={reset(){this.age=Array(5).fill(3);this.r=Array(5).fill(0);this.hist=[];this.render();},
  run(){const log=this.age.map((a,i)=>this.r[i]?Math.min(20,a+3):Math.max(0,a-1));this.hist.push({r:this.r.slice(),age:log});this.age=log;this.r=Array(5).fill(0);this.render();},
  render(){
    $('#la-pages').innerHTML=range(5).map(i=>`<button class="rbtn" type="button" aria-pressed="${this.r[i]?'true':'false'}" data-la="${i}">P${i}: ${this.r[i]?'zugegriffen':'nicht benutzt'}</button>`).join('');
    $$('[data-la]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.la;this.r[i]^=1;this.render();}));
    const mn=Math.min(...this.age),v=this.age.indexOf(mn);
    let h='<table class="t compact"><tr><th>Lauf</th>'+range(5).map(i=>`<th>P${i}</th>`).join('')+'</tr><tr><td>Start</td>'+range(5).map(()=>'<td class="num">3</td>').join('')+'</tr>';
    this.hist.forEach((x,k)=>{h+=`<tr class="${k===this.hist.length-1?'hl':''}"><td>kswapd ${k+1}</td>`+x.age.map((a,i)=>`<td class="num">${a} ${x.r[i]?'(+3)':'(−1)'}</td>`).join('')+'</tr>';});
    h+='<tr><td><b>Opfer</b></td>'+this.age.map((a,i)=>`<td class="num">${i===v?'<b><u>← P'+i+'</u></b>':''}</td>`).join('')+'</tr></table>';
    $('#la-table').innerHTML=h;}
};
$('#la-run').addEventListener('click',()=>LA.run());$('#la-reset').addEventListener('click',()=>LA.reset());LA.reset();
