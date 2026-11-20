/* ========== Lab: trace generator (Nachbau gen_trace) ========== */
const MAXOPS=8e6;
function genTrace(alg,init,N,seed,countOnly){
  N=Math.max(1,Math.floor(N));const rng=makeRng((seed*2654435761)>>>0||1);
  const T=alg==='MER'?2*N:N;const a=new Array(T).fill(0);
  if(init==='ASC')for(let i=0;i<N;i++)a[i]=i+1;
  else if(init==='DES')for(let i=0;i<N;i++)a[i]=N-i;
  else{const p=shuffle(range(N).map(i=>i+1),rng);for(let i=0;i<N;i++)a[i]=p[i];}
  const ops=countOnly?null:[];let nr=0,nw=0,nc=0;
  const guard=()=>{if(nr+nw+nc>MAXOPS)throw new Error('TOOBIG');};
  const Rd=i=>{nr++;if(ops)ops.push(i*2);if((nr&65535)===0)guard();return a[i];};
  const Wr=(i,v)=>{nw++;if(ops)ops.push(i*2+1);a[i]=v;};
  const C=()=>{nc++;if(ops)ops.push(-1);};
  switch(alg){
    case 'BUB':for(let i=0;i<N-1;i++){let sw=false;for(let j=0;j<N-1-i;j++){const x=Rd(j),y=Rd(j+1);C();if(x>y){Wr(j,y);Wr(j+1,x);sw=true;}}if(!sw)break;}break;
    case 'INS':for(let i=1;i<N;i++){const key=Rd(i);let j=i-1;while(j>=0){const x=Rd(j);C();if(x>key){Wr(j+1,x);j--;}else break;}Wr(j+1,key);}break;
    case 'SEL':for(let i=0;i<N-1;i++){let m=i,mv=Rd(i);for(let j=i+1;j<N;j++){const x=Rd(j);C();if(x<mv){m=j;mv=x;}}if(m!==i){const t=Rd(i);Wr(i,mv);Wr(m,t);}}break;
    case 'HEA':{const sift=(st,end)=>{let root=st;while(2*root+1<=end){let ch=2*root+1;let cv=Rd(ch);if(ch+1<=end){const c2=Rd(ch+1);C();if(cv<c2){ch++;cv=c2;}}const rv=Rd(root);C();if(rv<cv){Wr(root,cv);Wr(ch,rv);root=ch;}else return;}};
      for(let s=Math.floor((N-2)/2);s>=0;s--)sift(s,N-1);
      for(let end=N-1;end>0;end--){const t=Rd(end),r0=Rd(0);Wr(end,r0);Wr(0,t);sift(0,end-1);}break;}
    case 'COM':{let gap=N,sw=true;while(gap>1||sw){gap=Math.max(1,Math.floor(gap/1.3));sw=false;for(let i=0;i+gap<N;i++){const x=Rd(i),y=Rd(i+gap);C();if(x>y){Wr(i,y);Wr(i+gap,x);sw=true;}}}break;}
    case 'MER':{const off=[0,N];
      for(let i=0;i<N;i++)Wr(N+i,Rd(i));
      const merge=(src,lo,mid,hi,dst)=>{let i=lo,j=mid;for(let k=lo;k<hi;k++){let take;
          if(i<mid&&j<hi){const x=Rd(off[src]+i),y=Rd(off[src]+j);C();take=x<=y?0:1;Wr(off[dst]+k,take?y:x);if(take)j++;else i++;}
          else if(i<mid){Wr(off[dst]+k,Rd(off[src]+i));i++;}else{Wr(off[dst]+k,Rd(off[src]+j));j++;}}};
      const split=(B,lo,hi,A)=>{if(hi-lo<2)return;const mid=(lo+hi)>>1;split(A,lo,mid,B);split(A,mid,hi,B);merge(B,lo,mid,hi,A);};
      split(1,0,N,0);break;}
    case 'QUI':case 'QRP':{const st=[[0,N-1]];
      while(st.length){const [lo,hi]=st.pop();if(lo>=hi)continue;
        if(alg==='QRP'){const r=lo+Math.floor(rng()*(hi-lo+1));if(r!==lo){const x=Rd(lo),y=Rd(r);Wr(lo,y);Wr(r,x);}}
        const p=Rd(lo);let i=lo;
        for(let j=lo+1;j<=hi;j++){const x=Rd(j);C();if(x<p){i++;if(i!==j){const y=Rd(i);Wr(i,x);Wr(j,y);}}}
        if(i!==lo){const y=Rd(i);Wr(lo,y);Wr(i,p);}
        st.push([i+1,hi]);st.push([lo,i-1]);}
      break;}
  }
  let sorted=true;for(let i=0;i+1<N;i++)if(a[i]>a[i+1]){sorted=false;break;}
  return {T,ops,nr,nw,nc,sorted};
}
function traceText(tr,limit=900){
  const parts=['T'+tr.T];let k=0;
  for(const c of tr.ops){if(k++>=limit){parts.push(`… (+${tr.ops.length-limit} weitere)`);break;}parts.push(c<0?'C':(c&1?'W':'R')+(c>>1));}
  parts.push(tr.sorted?'S':'O');return parts.join(' ');
}
function gtGo(){
  const alg=$('#gt-alg').value,init=$('#gt-init').value,N=+$('#gt-n').value,seed=+$('#gt-seed').value;
  try{const tr=genTrace(alg,init,N,seed);
    $('#gt-out').textContent=`$ ./gen_trace ${alg} ${init} ${N}\n`+traceText(tr)+(tr.sorted?'   Sorted ;-)':'   Out of order')+`\n\n# ${tr.nr} reads · ${tr.nw} writes · ${tr.nc} compares · T = ${tr.T}`;
  }catch(e){$('#gt-out').textContent='Trace too large (> 8M ops). Use a smaller N.';}
}
$('#gt-go').addEventListener('click',gtGo);gtGo();
$('#gt-table').addEventListener('click',()=>{
  $('#gt-tabout').innerHTML='<p class="muted">Berechne …</p>';
  setTimeout(()=>{const algs=['BUB','INS','SEL','HEA','COM','MER','QUI','QRP'],inits=['ASC','DES','RAN'];
    let h='<table class="t compact"><tr><th>ALG</th>'+inits.map(i=>`<th class="num">${i}</th>`).join('')+'</tr>';
    algs.forEach(a=>{h+=`<tr><td><b>${a}</b></td>`+inits.map(i=>{const tr=genTrace(a,i,1000,7,true);return `<td class="num">${(tr.nr+tr.nw).toExponential(1)}</td>`;}).join('')+'</tr>';});
    h+='</table><p class="muted">Speicherzugriffe R+W für N = 1000 (Nachbau). Muster wie im Lab: SEL immer ~N², QUI bei ASC/DES ~N², BUB/INS bei ASC trivial.</p>';
    $('#gt-tabout').innerHTML=h;},30);
});

/* ========== Lab: paging simulator ========== */
class PagingSim{
  constructor(c){
    Object.assign(this,c);this.numpags=Math.max(1,Math.ceil(this.T/this.pagsz));const P=this.numpags,F=this.numframes;this.n=this.ops.length;
    this.present=new Uint8Array(P);this.frame=new Int32Array(P).fill(-1);this.modified=new Uint8Array(P);this.referenced=new Uint8Array(P);this.timestamp=new Float64Array(P);
    this.fpage=new Int32Array(F).fill(-1);this.fnext=new Int32Array(F);for(let f=0;f<F;f++)this.fnext[f]=(f+1)%F;
    this.listfree=F-1;this.listoccupied=-1;this.clock=0;this.reads=0;this.writes=0;this.pf=0;this.dumps=0;this.illegal=0;this.pos=0;this.log=[];this.last=null;
    this.rng=makeRng(c.seed||4242);
    if(this.algo==='optimal'){this.nextIdx=new Int32Array(this.n);const last=new Int32Array(P).fill(this.n);
      for(let i=this.n-1;i>=0;i--){const pg=Math.floor((this.ops[i]>>1)/this.pagsz);if(pg<P){this.nextIdx[i]=last[pg];last[pg]=i;}else this.nextIdx[i]=this.n;}
      this.pageNext=new Float64Array(P).fill(this.n);}
  }
  msg(s){if(this.detailed)this.log.push({i:this.pos,s});}
  step(){if(this.pos>=this.n)return false;const c=this.ops[this.pos];this.mmu(c>>1,(c&1)?'W':'R');this.pos++;return true;}
  mmu(v,op){
    const page=Math.floor(v/this.pagsz),off=v%this.pagsz;
    if(page<0||page>=this.numpags){this.illegal++;this.msg(`\t${op} ${v}: ILLEGAL → ~0U`);this.last={op,v,page,off,illegal:true};return;}
    let fault=false;if(!this.present[page]){fault=true;this.handlePF(v);}
    const fr=this.frame[page];this.reference(page,op);
    this.msg(`\t${op} ${v}==P${page}(M${fr})+${off}`);
    this.last={op,v,page,off,frame:fr,fault,phys:fr*this.pagsz+off};
  }
  reference(page,op){
    if(op==='R')this.reads++;else{this.writes++;this.modified[page]=1;}
    if(this.algo==='lru'){this.timestamp[page]=this.clock;this.clock++;if(this.clock>=4294967296){this.clock=0;this.msg('WARNING: clock overflow!');}}
    if(this.algo==='fifo2ch')this.referenced[page]=1;
    if(this.algo==='optimal')this.pageNext[page]=this.nextIdx[this.pos];
  }
  handlePF(v){
    this.pf++;const page=Math.floor(v/this.pagsz);this.msg(`@ PAGE FAULT in P${page}!`);
    if(this.listfree!==-1){const last=this.listfree,fr=this.fnext[last];if(fr===last)this.listfree=-1;else this.fnext[last]=this.fnext[fr];this.occupy(fr,page);}
    else{const victim=this.choose();this.replace(victim,page);}
  }
  occupy(fr,page){
    this.msg(`@ Hosting P${page} in F${fr}`);this.present[page]=1;this.frame[page]=fr;this.modified[page]=0;this.fpage[fr]=page;
    if(this.algo==='fifo'||this.algo==='fifo2ch'){if(this.listoccupied===-1)this.fnext[fr]=fr;else{this.fnext[fr]=this.fnext[this.listoccupied];this.fnext[this.listoccupied]=fr;}this.listoccupied=fr;}
  }
  choose(){
    const F=this.numframes;let v=0;
    switch(this.algo){
      case 'random':v=Math.floor(this.rng()*F);this.msg(`@ Choosing (at random) P${this.fpage[v]} of F${v} for replacing it`);break;
      case 'lru':{let mn=this.timestamp[this.fpage[0]];for(let f=1;f<F;f++){const t=this.timestamp[this.fpage[f]];if(t<mn){mn=t;v=f;}}this.msg(`@ Choosing (at LRU) P${this.fpage[v]} of F${v} for replacing it`);break;}
      case 'fifo':v=this.fnext[this.listoccupied];this.listoccupied=v;this.msg(`@ Choosing (FIFO) P${this.fpage[v]} of F${v} for replacing it`);break;
      case 'fifo2ch':v=this.fnext[this.listoccupied];
        while(this.referenced[this.fpage[v]]){this.referenced[this.fpage[v]]=0;this.msg(`@ P${this.fpage[v]} in F${v}: R=1 → 2nd chance (R=0, ans Ende)`);this.listoccupied=v;v=this.fnext[v];}
        this.listoccupied=v;this.msg(`@ Choosing (FIFO 2nd chance) P${this.fpage[v]} of F${v} for replacing it`);break;
      case 'optimal':{let best=-1;for(let f=0;f<F;f++){const nx=this.pageNext[this.fpage[f]];if(nx>best){best=nx;v=f;}}
        this.msg(best>=this.n?`@ Choosing P${this.fpage[v]} (won't be used anymore) of F${v} for replacing it`:`@ Choosing P${this.fpage[v]} (will take ${best-this.pos} operations to be used again) of F${v} for replacing it`);break;}
    }
    return v;
  }
  replace(victim,page){
    const old=this.fpage[victim];
    if(this.modified[old]){this.dumps++;this.msg(`@ Writing modified P${old} back (to disc) to replace it`);}
    this.present[old]=0;this.msg(`@ Replacing victim P${old} with P${page} in F${victim}`);
    this.present[page]=1;this.frame[page]=victim;this.modified[page]=0;this.fpage[victim]=page;this.referenced[page]=0;
  }
  listNodes(head){if(head===-1)return [];const out=[];const first=this.fnext[head];let f=first,g=0;do{out.push(f);f=this.fnext[f];g++;}while(f!==first&&g<=this.numframes);return out;}
  run(){const d=this.detailed;this.detailed=false;while(this.pos<this.n){const c=this.ops[this.pos];this.mmu(c>>1,(c&1)?'W':'R');this.pos++;}this.detailed=d;}
}
const ALGNAME={random:'Random',lru:'LRU',fifo:'FIFO',fifo2ch:'FIFO 2nd',optimal:'Optimal'};
const T1=[['16 3 HEA DES 100',280,282,283,285,171],['16 8 HEA DES 1000',3101,2436,2877,2642,1360],['16 32 HEA DES 10000',15614,10802,13427,11211,8792],
  ['16 3 MER DES 100',158,104,119,118,83],['16 8 MER DES 1000',1111,905,907,898,722],['16 32 MER DES 10000',10190,9549,9458,9530,8146]];
const SM={DETAIL_MAX:4000};
function smBuildTrace(){
  if($('#sm-custom').checked){
    const toks=$('#sm-trace').value.trim().split(/\s+/);let T=0;const ops=[];
    toks.forEach(t=>{const m=/^([TRW])(\d+)$/i.exec(t);if(!m)return;const k=m[1].toUpperCase(),n=+m[2];if(k==='T')T=n;else ops.push(n*2+(k==='W'?1:0));});
    if(!T)T=ops.reduce((a,c)=>Math.max(a,(c>>1)+1),1);
    return {T,ops,label:'eigene Trace'};
  }
  const alg=$('#sm-salg').value,init=$('#sm-init').value,N=+$('#sm-n').value;
  const tr=genTrace(alg,init,N,7);return {T:tr.T,ops:tr.ops.filter(c=>c>=0),label:`${alg} ${init} ${N}`};
}
function smLoad(){
  try{SM.trace=smBuildTrace();}catch(e){$('#sm-report').textContent='Trace too large (> 8M ops). Use a smaller N.';return;}
  SM.cfg={pagsz:Math.max(1,+$('#sm-ps').value),numframes:Math.max(1,+$('#sm-fr').value),algo:$('#sm-alg').value,T:SM.trace.T,ops:Int32Array.from(SM.trace.ops),seed:4242};
  SM.cfg.detailed=SM.trace.ops.length<=SM.DETAIL_MAX;
  SM.sim=new PagingSim(SM.cfg);$('#sm-cmpout').innerHTML='';
  if(!SM.cfg.detailed){SM.sim.run();}
  smRender();
}
function smGoto(k){SM.sim=new PagingSim(SM.cfg);for(let i=0;i<k;i++)SM.sim.step();smRender();}
function chainHTML(s,head,occ){
  if(head===-1)return '<i class="muted">leer (−1)</i>';
  const all=s.listNodes(head);const nodes=all.slice(0,24);const more=all.length>24?`<span class="arrowtxt">… +${all.length-24} → F${head}</span>`:'';
  return nodes.map((f,i)=>{const first=i===0,last=f===head;const extra=occ?`: P${s.fpage[f]}${s.algo==='fifo2ch'?` R${s.referenced[s.fpage[f]]}`:''}`:'';
    return `<span class="node${first?' first':''}${last?' last':''}">${first||last?`<span class="badge">${first&&last?'first = last':first?'first':'last ← '+(occ?'listoccupied':'listfree')}</span>`:''}F${f}${extra}</span>`;}).join('<span class="arrowtxt">→</span>')+more+`<span class="arrowtxt">↩ F${nodes[0]}</span>`;
}
function smRender(){
  const s=SM.sim,c=SM.cfg;if(!s)return;
  const cmd=`./sim_pag_${c.algo} ${c.pagsz} ${c.numframes} ${SM.trace.label}${c.detailed?' D':''}`;
  $('#sm-pos').textContent=`Referenz ${s.pos} / ${s.n}`;
  $('#sm-kv').innerHTML=`<div><b>${s.reads}</b><span>Reads</span></div><div><b>${s.writes}</b><span>Writes</span></div><div><b>${s.pf}</b><span>Page faults</span></div><div><b>${s.dumps}</b><span>Page dumps to disc</span></div><div><b>${s.numpags}</b><span>Seiten (T=${c.T}, pagsz=${c.pagsz})</span></div><div><b>${s.illegal}</b><span>Illegal refs</span></div>`;
  ['#sm-back','#sm-step','#sm-pf'].forEach(x=>$(x).disabled=!c.detailed);
  if(!c.detailed){
    $('#sm-cur').innerHTML=`Trace hat ${s.n} Referenzen → nur Report-Modus (Schrittmodus bis ${SM.DETAIL_MAX}).`;$('#sm-log').textContent=`$ ${cmd}\n(no detailed mode: > ${SM.DETAIL_MAX} refs)`;
  }else{
    const L=s.last;
    $('#sm-cur').innerHTML=!L?'Noch keine Referenz verarbeitet. „Schritt ▶“ drücken.':L.illegal?badT(`${L.op} ${L.v}: illegale Adresse (Seite ${L.page} ≥ numpags) → return ~0U`):
      `<b>${L.op} ${L.v}</b> → page = ${L.v} / ${c.pagsz} = <b>P${L.page}</b>, offset = ${L.off} → <b>F${L.frame}</b> → physisch ${L.frame}·${c.pagsz}+${L.off} = <b>${L.phys}</b> · ${L.fault?badT('PAGE FAULT'):okT('Treffer')}`;
    const lines=s.log.slice(-500);
    $('#sm-log').innerHTML=esc(`$ ${cmd}\n`)+lines.map(l=>`<span class="${l.i===s.pos-1?'cur':''}">${esc(l.s)}</span>`).join('\n');
    const lg=$('#sm-log');lg.scrollTop=lg.scrollHeight;
  }
  $('#sm-lfree').innerHTML=chainHTML(s,s.listfree,false);
  const fifoish=c.algo==='fifo'||c.algo==='fifo2ch';
  $('#sm-locc-wrap').innerHTML=`<b class="mono">listoccupied</b>`+(fifoish?`<div class="chain">${chainHTML(s,s.listoccupied,true)}</div>`:`<p class="muted">nur bei FIFO / FIFO 2nd chance</p>`);
  const freeSet=new Set(s.listNodes(s.listfree)),occSet=new Set(fifoish?s.listNodes(s.listoccupied):[]);
  const curF=s.last&&!s.last.illegal?s.last.frame:-1,curP=s.last&&!s.last.illegal?s.last.page:-1;
  let fh='<table class="t compact"><tr><th>frame</th><th>page</th><th>next</th>';
  if(c.algo==='fifo2ch')fh+='<th>R</th>';if(c.algo==='lru')fh+='<th>timestamp</th>';fh+='<th>modified</th></tr>';
  for(let f=0;f<c.numframes&&f<64;f++){const pg=s.fpage[f];const inL=freeSet.has(f)||occSet.has(f);
    fh+=`<tr class="${f===curF?'hl':''}"><td>F${f}</td><td>${pg<0?'<i class="muted">frei</i>':'P'+pg}</td><td>${inL?'F'+s.fnext[f]:'–'}</td>`;
    if(c.algo==='fifo2ch')fh+=`<td>${pg<0?'':s.referenced[pg]}</td>`;if(c.algo==='lru')fh+=`<td class="num">${pg<0?'':s.timestamp[pg]}</td>`;
    fh+=`<td>${pg<0?'':s.modified[pg]?'<b>M=1</b>':'0'}</td></tr>`;}
  if(c.numframes>64)fh+=`<tr><td colspan="6" class="muted">… ${c.numframes-64} weitere</td></tr>`;
  $('#sm-frt').innerHTML=fh+'</table>';
  if(s.numpags<=512){
    let ph='<table class="t compact"><tr><th>page</th><th>present</th><th>frame</th><th>modified</th>';
    if(c.algo==='fifo2ch')ph+='<th>referenced</th>';if(c.algo==='lru')ph+='<th>timestamp</th><th>clock − ts</th>';if(c.algo==='optimal')ph+='<th>nächste Nutzung</th>';ph+='</tr>';
    for(let p=0;p<s.numpags;p++){const pr=s.present[p];
      ph+=`<tr class="${p===curP?'hl':''}"><td>P${p}</td><td>${pr?'✓ 1':'– 0'}</td><td>${pr?'F'+s.frame[p]:''}</td><td>${pr?(s.modified[p]?'<b>1</b>':'0'):''}</td>`;
      if(c.algo==='fifo2ch')ph+=`<td>${pr?s.referenced[p]:''}</td>`;
      if(c.algo==='lru')ph+=`<td class="num">${pr?s.timestamp[p]:''}</td><td class="num">${pr?s.clock-s.timestamp[p]:''}</td>`;
      if(c.algo==='optimal')ph+=`<td>${pr?(s.pageNext[p]>=s.n?'nie':'in '+(s.pageNext[p]-s.pos+1)):''}</td>`;
      ph+='</tr>';}
    $('#sm-pgt').innerHTML=ph+'</table>';
  }else $('#sm-pgt').innerHTML=`<p class="muted">${s.numpags} Seiten – Tabelle ausgeblendet.</p>`;
  let rep=`GENERAL REPORT  (${cmd})\n  Read references ........ ${s.reads}\n  Write references ....... ${s.writes}\n  Page faults ............ ${s.pf}\n  Page dumps to disc ..... ${s.dumps}\n  Illegal references ..... ${s.illegal}\n`;
  rep+='REPLACEMENT REPORT\n';
  if(c.algo==='lru'){const ts=[];for(let f=0;f<c.numframes;f++)if(s.fpage[f]>=0)ts.push(s.timestamp[s.fpage[f]]);rep+=`  clock = ${s.clock} · min timestamp = ${ts.length?Math.min(...ts):'-'} · max timestamp = ${ts.length?Math.max(...ts):'-'}\n`;}
  else if(fifoish){rep+=`  occupied frames (first → last): ${s.listNodes(s.listoccupied).map(f=>`F${f}(P${s.fpage[f]}${c.algo==='fifo2ch'?',R'+s.referenced[s.fpage[f]]:''})`).join(' ')||'-'}\n`;}
  else if(c.algo==='random')rep+='  victim = myrandom(numframes)\n';else rep+='  victim = page whose next use is farthest away\n';
  if(s.pos===s.n&&c.algo==='random'&&SM.trace.label==='HEA DES 4'&&c.pagsz===1&&c.numframes===3)rep+='\nLab expected (original gen_trace): 20 R · 17 W · 7 PF · 2 dumps';
  $('#sm-report').textContent=rep;
}
function smCompare(){
  if(!SM.cfg)smLoad();const c=SM.cfg;const algs=['random','lru','fifo','fifo2ch','optimal'];
  const res=algs.map(a=>{const s=new PagingSim({...c,algo:a,detailed:false});s.run();return {a,pf:s.pf,d:s.dumps};});
  const min=Math.min(...res.map(r=>r.pf));
  const key=`${c.pagsz} ${c.numframes} ${SM.trace.label}`;const t1=T1.find(r=>r[0]===key);
  let h=`<h4>Vergleich auf derselben Trace (${esc(key)})</h4>`+hbars(res.map(r=>({label:ALGNAME[r.a],v:r.pf,text:`${r.pf} PF`,best:r.pf===min})));
  h+='<table class="t compact"><tr><th>Algorithmus</th><th class="num">Page faults</th><th class="num">Page dumps</th>'+(t1?'<th class="num">Table 1 (Original)</th>':'')+'</tr>'+res.map((r,i)=>`<tr><td>${ALGNAME[r.a]}</td><td class="num">${r.pf}</td><td class="num">${r.d}</td>${t1?`<td class="num">${t1[i+1]}</td>`:''}</tr>`).join('')+'</table>';
  if(t1)h+='<p class="muted">Abweichungen kommen vom nachgebauten gen_trace; die Reihenfolge der Algorithmen ist die Aussage.</p>';
  $('#sm-cmpout').innerHTML=h;
}
$('#sm-load').addEventListener('click',smLoad);
$('#sm-step').addEventListener('click',()=>{if(SM.sim&&SM.cfg.detailed){SM.sim.step();smRender();}});
$('#sm-back').addEventListener('click',()=>{if(SM.sim&&SM.sim.pos>0)smGoto(SM.sim.pos-1);});
$('#sm-pf').addEventListener('click',()=>{const s=SM.sim;if(!s)return;const p0=s.pf;while(s.pos<s.n){s.step();if(s.pf>p0)break;}smRender();});
$('#sm-run').addEventListener('click',()=>{if(!SM.sim)return;if(SM.cfg.detailed){while(SM.sim.step());}else SM.sim.run();smRender();});
$('#sm-cmp').addEventListener('click',smCompare);
$('#sm-custom').addEventListener('change',()=>{$('#sm-trace').style.display=$('#sm-custom').checked?'block':'none';if($('#sm-custom').checked&&!$('#sm-trace').value)$('#sm-trace').value='T8 R0 W4 R1 W5 R2 W6 R3 W7 R4 R5 W0 R6 R7 W1';});
$$('[data-sm]').forEach(b=>b.addEventListener('click',()=>{const [a,ps,fr,al,ini,n]=b.dataset.sm.split(',');$('#sm-alg').value=a;$('#sm-ps').value=ps;$('#sm-fr').value=fr;$('#sm-salg').value=al;$('#sm-init').value=ini;$('#sm-n').value=n;$('#sm-custom').checked=false;$('#sm-trace').style.display='none';smLoad();if(+n>=100)smCompare();}));
smLoad();

/* ========== L5 Code-Lückentext ========== */
const CODE=[
  {title:'sim_mmu (Hardware)',code:`unsigned sim_mmu (ssystem *S, unsigned virtual_addr, char op)
{
    unsigned physical_addr;
    int page, frame, offset;

    page   = virtual_addr {{a1}} S->pagsz;
    offset = virtual_addr {{a2}} S->pagsz;

    if (page < 0 || page {{a3}} S->numpags) {
        S->numillegalrefs++;
        return {{a4}};
    }
    if ({{a5}})
        handle_page_fault (S, virtual_addr);

    frame = S->pgt[page].{{a6}};
    physical_addr = {{a7}};
    reference_page (S, page, op);
    return physical_addr;
}`,ans:{a1:['/'],a2:['%'],a3:['>='],a4:['~0U','~0u','~0'],a5:['!S->pgt[page].present','S->pgt[page].present==0'],a6:['frame'],a7:['frame*S->pagsz+offset','S->pagsz*frame+offset','offset+frame*S->pagsz','offset+S->pagsz*frame']}},
  {title:'reference_page (Hardware) · LRU + 2nd chance',code:`void reference_page (ssystem *S, int page, char op)
{
    if (op == 'R') S->numrefsread++;
    else {
        S->numrefswrite++;
        S->pgt[page].{{b1}} = 1;
    }
    S->pgt[page].timestamp = {{b2}};      // LRU
    S->clock++;
    if (S->clock == {{b3}})               // Überlauf erkannt
        printf ("WARNING: clock overflow\\n");
    S->pgt[page].{{b4}} = 1;              // FIFO 2nd chance
}`,ans:{b1:['modified'],b2:['S->clock'],b3:['0'],b4:['referenced']}},
  {title:'handle_page_fault (OS)',code:`void handle_page_fault (ssystem *S, unsigned virtual_addr)
{
    int page, victim, frame, last;
    S->{{c1}}++;
    page = virtual_addr / S->pagsz;

    if (S->listfree != {{c2}}) {
        last  = S->listfree;
        frame = S->frt[last].{{c3}};
        if (frame == {{c4}})
            S->listfree = -1;
        else
            S->frt[last].next = {{c5}};
        occupy_free_frame (S, frame, page);
    } else {
        victim = {{c6}} (S);
        replace_page (S, victim, page);
    }
}`,ans:{c1:['numpagefaults'],c2:['-1'],c3:['next'],c4:['last'],c5:['S->frt[frame].next'],c6:['choose_page_to_be_replaced']}},
  {title:'occupy_free_frame (OS) · FIFO-Version',code:`void occupy_free_frame (ssystem *S, int frame, int page)
{
    S->pgt[page].present  = {{d1}};
    S->pgt[page].frame    = frame;
    S->pgt[page].modified = {{d2}};
    S->frt[frame].page    = {{d3}};

    if (S->listoccupied == -1)
        S->frt[frame].next = {{d4}};
    else {
        S->frt[frame].next = {{d5}};
        S->frt[S->listoccupied].next = frame;
    }
    S->listoccupied = {{d6}};
}`,ans:{d1:['1'],d2:['0'],d3:['page'],d4:['frame'],d5:['S->frt[S->listoccupied].next'],d6:['frame']}},
  {title:'choose_page_to_be_replaced · LRU',code:`int choose_page_to_be_replaced (ssystem *S)
{
    int f, victim = 0;
    unsigned min = S->pgt[S->frt[0].page].{{g1}};
    for (f = 1; f < S->numframes; f++)
        if (S->pgt[S->frt[f].page].timestamp {{g2}} min) {
            min = S->pgt[S->frt[f].page].timestamp;
            victim = {{g3}};
        }
    return victim;
}`,ans:{g1:['timestamp'],g2:['<'],g3:['f']}},
  {title:'choose_page_to_be_replaced · FIFO',code:`int choose_page_to_be_replaced (ssystem *S)
{
    int victim = S->frt[{{e1}}].next;    // erstes
    S->listoccupied = {{e2}};             // Ring dreht sich
    return victim;
}`,ans:{e1:['S->listoccupied'],e2:['victim']}},
  {title:'choose_page_to_be_replaced · FIFO 2nd chance',code:`int choose_page_to_be_replaced (ssystem *S)
{
    int victim = S->frt[S->listoccupied].next;
    while (S->pgt[S->frt[victim].page].{{f1}}) {
        S->pgt[S->frt[victim].page].referenced = {{f2}};
        S->listoccupied = victim;
        victim = S->frt[victim].{{f3}};
    }
    S->listoccupied = {{f4}};
    return victim;
}`,ans:{f1:['referenced','referenced==1','referenced!=0'],f2:['0'],f3:['next'],f4:['victim']}}
];
function codeRender(){
  const wrap=$('#code-blocks');
  wrap.innerHTML=CODE.map((b,bi)=>{
    const parts=b.code.split(/\{\{(\w+)\}\}/);let html='';
    parts.forEach((p,i)=>{if(i%2===0){html+=esc(p).replace(/(\/\/[^\n]*)/g,'<span class="c">$1</span>');}
      else{const len=Math.max(...b.ans[p].map(a=>a.length))+1;html+=`<input class="blank" data-b="${bi}" data-k="${p}" size="${len}" aria-label="Lücke ${p}" autocomplete="off" spellcheck="false"><span class="blankmark" data-m="${bi}-${p}"></span>`;}});
    return `<div class="widget"><header><span class="tag">Lückentext</span>${esc(b.title)}</header><div class="body"><pre class="code">${html}</pre><div class="btnrow"><button class="btn primary" type="button" data-chk="${bi}">Prüfen</button><button class="btn" type="button" data-sol="${bi}">Lösung einsetzen</button><button class="btn" type="button" data-clr="${bi}">Leeren</button><span class="mono" data-res="${bi}"></span></div></div></div>`;}).join('');
  const norm=s=>s.replace(/\s+/g,'').replace(/;$/,'');
  const check=bi=>{let ok=0,tot=0;$$(`input.blank[data-b="${bi}"]`).forEach(inp=>{tot++;const good=CODE[bi].ans[inp.dataset.k].map(norm).includes(norm(inp.value));inp.classList.toggle('right',good);inp.classList.toggle('wrong',!good);$(`[data-m="${bi}-${inp.dataset.k}"]`).textContent=good?'✓':'✗';if(good)ok++;});$(`[data-res="${bi}"]`).innerHTML=ok===tot?okT(`${ok}/${tot} richtig`):`<b>${ok}/${tot} richtig</b>`;};
  $$('[data-chk]').forEach(b=>b.addEventListener('click',()=>check(+b.dataset.chk)));
  $$('[data-sol]').forEach(b=>b.addEventListener('click',()=>{const bi=+b.dataset.sol;$$(`input.blank[data-b="${bi}"]`).forEach(inp=>inp.value=CODE[bi].ans[inp.dataset.k][0]);check(bi);}));
  $$('[data-clr]').forEach(b=>b.addEventListener('click',()=>{const bi=+b.dataset.clr;$$(`input.blank[data-b="${bi}"]`).forEach(inp=>{inp.value='';inp.classList.remove('right','wrong');$(`[data-m="${bi}-${inp.dataset.k}"]`).textContent='';});$(`[data-res="${bi}"]`).textContent='';}));
}
codeRender();

/* ========== L6 calculate_ws ========== */
function wsSeries(alg,init,N,epp,opi){
  const tr=genTrace(alg,init,N,7);const pts=[];let set=new Set(),cnt=0,k=0,refs=0;
  for(const c of tr.ops){if(c<0)continue;refs++;set.add(Math.floor((c>>1)/epp));cnt++;if(cnt===opi){k++;pts.push([k,set.size]);set=new Set();cnt=0;}}
  if(cnt>0){k++;pts.push([k,set.size]);}
  return {pts,refs,pages:Math.ceil(tr.T/epp)};
}
function cwGo(){
  const epp=Math.max(1,+$('#cw-epp').value),opi=Math.max(10,+$('#cw-opi').value),N=+$('#cw-n').value;
  const cfgs=[[$('#cw-a').value,$('#cw-ia').value]];if($('#cw-b').value)cfgs.push([$('#cw-b').value,$('#cw-ib').value]);
  $('#cw-chart').innerHTML='<p class="muted">Berechne …</p>';
  setTimeout(()=>{
    try{
      const res=cfgs.map(([a,i])=>({name:`${a} ${i}`,...wsSeries(a,i,N,epp,opi)}));
      lineChart($('#cw-chart'),{series:res.map(r=>({name:r.name,pts:r.pts})),integerX:true,xLabel:`Intervall (je ${opi} Zugriffe)`,yLabel:'verschiedene Seiten',legend:true,aria:'Working-Set-Verlauf',yMax:niceMax(Math.max(...res.map(r=>r.pages)))});
      $('#cw-text').innerHTML=res.map(r=>{const ys=r.pts.map(p=>p[1]);const avg=ys.reduce((a,b)=>a+b,0)/ys.length;return `<b>${r.name}</b>: ${r.refs.toLocaleString('de-DE')} Zugriffe = ${r.pts.length} Intervalle · max WS ${Math.max(...ys)} von ${r.pages} Seiten · Ø ${avg.toFixed(1)}`;}).join('<br>')+
        '<br><span class="muted">BUB durchläuft pro Pass den ganzen unsortierten Teil → großes WS, schrumpft mit jedem Pass und braucht mehr Intervalle. INS arbeitet nur am Ende des sortierten Teils → braucht insgesamt weniger Zugriffe.</span>';
    }catch(e){$('#cw-chart').innerHTML=badT('Trace zu groß, N verkleinern');}
  },30);
}
$('#cw-go').addEventListener('click',cwGo);
$$('[data-cw]').forEach(b=>b.addEventListener('click',()=>{const [e,o,n,a,ia,bb,ib]=b.dataset.cw.split(',');$('#cw-epp').value=e;$('#cw-opi').value=o;$('#cw-n').value=n;$('#cw-a').value=a;$('#cw-ia').value=ia;$('#cw-b').value=bb;$('#cw-ib').value=ib;cwGo();}));
cwGo();

/* ========== L7 Table 1 ========== */
(function(){
  const hd=['Random','LRU','FIFO','FIFO2nd','Optimal'];
  let h='<table class="t"><tr><th>pagesize frames ALG INIT N</th>'+hd.map(x=>`<th class="num">${x}</th>`).join('')+'</tr>';
  T1.forEach(r=>{const v=r.slice(1),mx=Math.max(...v),mn=Math.min(...v);
    h+=`<tr><td class="mono">${r[0]}</td>`+v.map(x=>`<td><span class="cellbar${x===mn?' best':''}">${x.toLocaleString('de-DE')}<i style="width:${Math.round(x/mx*70)}px"></i></span></td>`).join('')+'</tr>';});
  $('#t1').innerHTML=h+'</table>';
})();

/* ========== Trainer: Rechenaufgaben ========== */
const numIn=v=>{const n=parseNum(String(v));return n;};
const EXS=[
  {t:'Paging-Übersetzung',gen(){
    const ps=pick([256,512,1024,2048,4096]),off=log2i(ps),vb=16,pb=15,nf=2**(pb-off);
    const fr=shuffle(range(nf));const pmt=range(8).map(p=>UR()<0.8?fr[p]:null);
    let p=ri(0,7);const d=ri(0,ps-1);const va=p*ps+d;const f=pmt[p];const pa=f===null?null:f*ps+d;
    return {q:`<p>Virtuelle Adressen ${vb} bit, physisch ${pb} bit, page size <b>${ps} B</b>. VA = <b class="mono">${hex(va,4)}</b>.</p><table class="t compact"><tr><th>p</th>${range(8).map(i=>`<th>${i}</th>`).join('')}</tr><tr><td>frame</td>${pmt.map(x=>`<td>${x===null?'– (P=0)':x}</td>`).join('')}</tr></table>`,
      fields:[{l:'page p (dez)',ok:v=>numIn(v)===p},{l:'offset d (dez/hex)',ok:v=>numIn(v)===d},{l:'PA (hex) oder PF',ok:v=>pa===null?/^p(f|age ?fault)$/i.test(v.trim()):numIn(v)===pa}],
      sol:`offset = log₂(${ps}) = ${off} bit → p = ⌊${va} / ${ps}⌋ = <b>${p}</b>, d = ${va} mod ${ps} = <b>${d}</b> (${hex(d)}). ${pa===null?`PMT[${p}] present = 0 → <b>PF</b>.`:`PMT[${p}] = ${f} → PA = ${f}·${ps} + ${d} = <b>${pa} = ${hex(pa,4)}</b>`}`};}},
  {t:'Adressformat (multilevel)',gen(){
    const va=pick([32,36,39,40,42,44,48]),ps=pick([1024,4096,8192,16384]),es=pick([4,8]);const off=log2i(ps),idx=log2i(ps/es),lv=Math.ceil((va-off)/idx),top=va-off-(lv-1)*idx;
    return {q:`<p>${va}-bit virtuelle Adressen, page size <b>${fmtBytes(ps)}</b>, Eintrag <b>${es} B</b>, jede Tabelle passt in eine page.</p>`,
      fields:[{l:'offset bits',ok:v=>+v===off},{l:'index bits pro Tabelle',ok:v=>+v===idx},{l:'Ebenen',ok:v=>+v===lv},{l:'Bits oberste Ebene',ok:v=>+v===top}],
      sol:`offset = log₂(${ps}) = <b>${off}</b> · Einträge = ${ps}/${es} = ${ps/es} → <b>${idx}</b> bit · Ebenen = ⌈(${va}−${off})/${idx}⌉ = <b>${lv}</b> · oberste Ebene = ${va-off} − ${lv-1}·${idx} = <b>${top}</b> bit → Format ${[top,...Array(lv-1).fill(idx),off].join(' | ')}`};}},
  {t:'Replacement von Hand',gen(){
    let refs;do{refs=[];while(refs.length<12){const v=ri(1,5);if(refs[refs.length-1]!==v)refs.push(v);}}while(new Set(refs).size<4);
    const F=pick([3,4]),alg=pick(['FIFO','LRU','OPT']);const res=simRep(refs,F,alg,false);
    return {q:`<p>Reference string <b class="mono">${refs.join(' ')}</b>, <b>${F} frames</b> (anfangs leer), Algorithmus <b>${alg}</b>.</p>`,
      fields:[{l:'Anzahl Page Faults',ok:v=>+v===res.faults}],
      sol:`<div class="tablewrap">${repTableHTML(refs,F,alg,res)}</div><p><b>${res.faults} Page Faults</b></p>`};}},
  {t:'EAT mit TLB',gen(){
    const h=pick([0.8,0.9,0.95,0.98]),e=pick([10,20]),m=pick([50,100,200]),n=pick([1,2,4]);const eat=h*(e+m)+(1-h)*(e+(n+1)*m);
    return {q:`<p>Hit-Rate <b>${h*100} %</b>, TLB-Zugriff <b>${e} ns</b>, Speicherzugriff <b>${m} ns</b>, <b>${n}</b>-stufige Seitentabelle.</p>`,
      fields:[{l:'EAT in ns',ok:v=>Math.abs(parseFloat(String(v).replace(',','.'))-eat)<0.51}],
      sol:`EAT = ${h}·(${e}+${m}) + ${(1-h).toFixed(2)}·(${e}+${n+1}·${m}) = ${+(h*(e+m)).toFixed(2)} + ${+((1-h)*(e+(n+1)*m)).toFixed(2)} = <b>${+eat.toFixed(2)} ns</b>`};}},
  {t:'Segmentation',gen(){
    const st=range(4).map(()=>({b:ri(10,90)*100,l:ri(2,20)*50}));const s=ri(0,3);const inside=UR()<0.7;const d=inside?ri(0,st[s].l-1):st[s].l+ri(0,300);
    return {q:`<p>Adresse (s, d) = <b>(${s}, ${d})</b>.</p><table class="t compact"><tr><th>s</th><th>base</th><th>limit</th></tr>${st.map((e,i)=>`<tr><td>${i}</td><td>${e.b}</td><td>${e.l}</td></tr>`).join('')}</table>`,
      fields:[{l:'PA (dez) oder trap',ok:v=>inside?numIn(v)===st[s].b+d:/^(trap|segfault|segmentation fault|fault)$/i.test(v.trim())}],
      sol:inside?`d = ${d} &lt; limit ${st[s].l} ✓ → PA = ${st[s].b} + ${d} = <b>${st[s].b+d}</b>`:`d = ${d} ≥ limit ${st[s].l} → <b>trap</b> (segmentation fault)`};}},
  {t:'x86-64 canonical',gen(){
    const lo=(BigInt(ri(0,0xFFFFFF))<<24n)|BigInt(ri(0,0xFFFFFF));const b47=(lo>>47n)&1n;const canon=UR()<0.5;
    let top=b47?0xFFFFn:0n;if(!canon){top=BigInt(ri(1,0xFFFE));if(top===0xFFFFn||top===0n)top=0x1234n;}
    const v=(top<<48n)|lo;const pml4=Number((v>>39n)&0x1FFn);
    return {q:`<p>Adresse <b class="mono">${hexB(v,16)}</b></p>`,
      fields:[{l:'canonical? (ja/nein)',ok:x=>(/^j/i.test(x.trim()))===canon&&/^(j|n)/i.test(x.trim())},{l:'PML4-Index (dez)',ok:x=>numIn(x)===pml4}],
      sol:`Bit 47 = ${b47}, Bits 63–48 = ${hexB(top,4)} → <b>${canon?'canonical':'non-canonical'}</b>. PML4 = Bits 47–39 = <b>${pml4}</b>.`};}},
  {t:'Working Set',gen(){
    const refs=range(12).map(()=>ri(1,6));const D=pick([3,4,5]);const ws=[...new Set(refs.slice(12-D))].sort((a,b)=>a-b);
    return {q:`<p>Referenzen t = 1…12: <b class="mono">${refs.join(' ')}</b>. Fenster Δ = <b>${D}</b>. Bestimme WS(12, ${D}).</p>`,
      fields:[{l:'WS (z. B. 1,3,5)',ok:v=>{const a=[...new Set(v.split(/[\s,;{}]+/).filter(Boolean).map(Number))].sort((x,y)=>x-y);return a.join(',')===ws.join(',');}},{l:'|WS|',ok:v=>+v===ws.length}],
      sol:`Letzte ${D} Referenzen: <span class="mono">${refs.slice(12-D).join(' ')}</span> → WS = {<b>${ws.join(', ')}</b>}, |WS| = <b>${ws.length}</b>`};}},
  {t:'Buddy system',gen(){
    const req=ri(5,500);let b=32;while(b<req)b*=2;
    return {q:`<p>Buddy system mit 1024 KiB, Mindestblock 32 KiB. Anfrage: <b>${req} KiB</b>.</p>`,
      fields:[{l:'Blockgröße (KiB)',ok:v=>+v===b},{l:'internal fragmentation (KiB)',ok:v=>+v===b-req}],
      sol:`Aufrunden auf 2ᵏ: <b>${b} KiB</b>, Verschnitt ${b} − ${req} = <b>${b-req} KiB</b>. Splits: <span class="mono">${(()=>{const o=[];let s=1024;while(s>b){o.push(`${s}→${s/2}+${s/2}`);s/=2;}return o.join(', ')||'–';})()}</span>`};}}
];
function exRender(i){
  const def=EXS[i],x=def.gen(),card=$(`#ex-${i}`);
  card.innerHTML=`<header><span>${esc(def.t)}</span><button class="btn small" type="button" data-new="${i}">Neue Aufgabe</button></header><div class="body">${x.q}<div class="fields">${x.fields.map((f,k)=>`<label class="field">${esc(f.l)}<input class="w-m" data-f="${k}" autocomplete="off"></label>`).join('')}</div><div class="btnrow"><button class="btn primary" type="button" data-check>Prüfen</button><button class="btn" type="button" data-show>Lösung</button></div><div class="verdict" aria-live="polite"></div><div class="sol">${x.sol}</div></div>`;
  card.classList.remove('showsol');
  $('[data-new]',card).addEventListener('click',()=>exRender(i));
  $('[data-show]',card).addEventListener('click',()=>card.classList.toggle('showsol'));
  $('[data-check]',card).addEventListener('click',()=>{let ok=0;x.fields.forEach((f,k)=>{const inp=$(`[data-f="${k}"]`,card);const g=f.ok(inp.value);if(g)ok++;inp.style.borderStyle=g?'solid':'dashed';inp.style.borderWidth='2px';inp.style.borderColor=g?'var(--ok)':'var(--bad)';});
    $('.verdict',card).innerHTML=ok===x.fields.length?okT('alles richtig'):badT(`${ok}/${x.fields.length} richtig`)+' – Lösung ansehen?';});
}
$('#ex-grid').innerHTML=EXS.map((_,i)=>`<div class="ex" id="ex-${i}"></div>`).join('');EXS.forEach((_,i)=>exRender(i));

/* ========== Trainer: Quiz ========== */
const QUIZ=[
  ['Welche Fragmentierung verursacht Paging?',['internal','external','beide','keine'],'Letzte Seite eines Prozesses ist im Schnitt halb leer. External tritt bei Segmentation/MVT auf.'],
  ['Physical address bei Segmentation =',['base + offset','frame ‖ offset','base ‖ offset','limit + offset'],'Segmentation addiert; Paging konkateniert.'],
  ['Welcher Algorithmus kann Belady\'s anomaly zeigen?',['FIFO','LRU','OPT','alle drei'],'LRU und OPT sind stack algorithms – mehr Frames nie mehr PFs.'],
  ['Wie viele Index-Bits hat ein Pentium-Selector?',['13','14','16','10'],'16 bit = 13 index + 1 TI + 2 RPL.'],
  ['x86-64-Adresse ist canonical, wenn …',['Bits 63–48 = Bit 47','Bits 63–48 = 0','Bit 63 = 0','nur 32 bit genutzt'],'Sign-extension von Bit 47; sonst fault.'],
  ['ASLR mitigiert …',['Stack buffer overflow','Format string','beide vollständig','keines von beiden'],'Format string arbeitet relativ zum Stack und braucht keine festen Adressen.'],
  ['Wer verdrängt TLB-Einträge auf x86?',['Hardware (page-table walker)','OS-Scheduler','Compiler','Page-Fault-Handler'],'Das OS invalidiert nur (context switch, INVLPG). Software-managed TLB: MIPS.'],
  ['Placement policy bei Paging?',['irrelevant','best-fit','first-fit','worst-fit'],'Jeder freie Frame ist gleich gut.'],
  ['Nachteil von global replacement?',['Thrashing','mehr overhead','schlechte MM-Nutzung','Belady\'s anomaly'],'Global: bessere Nutzung, aber Thrashing. Local: deterministischer, mehr overhead.'],
  ['Welchen replacement scope nutzt Windows (laut Folien)?',['local','global','keinen','abwechselnd'],'VMS und Windows local; Unix/Linux global.'],
  ['Free space management in Linux?',['Buddy system','Bitmap','Linked lists','Paging'],'Linked lists = Windows, Buddy = Linux/Unix.'],
  ['PFF: PF-Rate über dem upper threshold →',['Prozess bekommt mehr frames','frames werden weggenommen','Prozess wird beendet','nichts'],'Unter lower threshold werden frames weggenommen.'],
  ['Was ist KEINE Lösung gegen Thrashing?',['Degree of multiprogramming erhöhen','Multiprogramming reduzieren','local replacement','working set model'],'Mehr Prozesse verschärfen das Problem.'],
  ['Lab: welche Funktion ist Hardware?',['reference_page','handle_page_fault','occupy_free_frame','choose_page_to_be_replaced'],'HW = sim_mmu + reference_page.'],
  ['Lab: listfree zeigt auf …',['das letzte Element (erstes = frt[last].next)','das erste Element','NULL, wenn voll','den zuletzt ersetzten Frame'],'Zeiger aufs letzte gibt O(1) auf erstes und Ende. Leer = −1.'],
  ['Lab: Rückgabe von sim_mmu bei illegaler Adresse?',['~0U (alle Bits 1)','0','die Seitennummer','handle_page_fault wird aufgerufen'],'Außerdem numillegalrefs++.'],
  ['Lab: wann wird beim Ersetzen auf Disk geschrieben?',['wenn modified = 1','immer','wenn referenced = 1','bei jedem Write sofort'],'Nur dirty Seiten → „Page dumps to disc“.'],
  ['Lab: choose_page_to_be_replaced bei FIFO?',['victim = frt[listoccupied].next; listoccupied = victim','victim = listoccupied','kleinster timestamp','myrandom(numframes)'],'Erstes nehmen, Ring weiterdrehen.'],
  ['W2K: Frame nicht mehr im WS, Daten noch da, PMT zeigt drauf',['Standby','Free','Transition','Zeroed'],'Kann per soft fault billig zurückgeholt werden.'],
  ['Linux page aging: Start und Zugriff',['age 3, +3 bis max 20','age 0, +1 bis max 8','age 20, −3 pro Zugriff','age 1, ×2'],'kswapd senkt unbenutzte Seiten um 1.'],
  ['Mach 3.0: active pages queue enthält …',['das working set','freie frames','nicht referenzierte Seiten','nur modifizierte Seiten'],'Inactive = Buffer unbenutzter Seiten; pageout daemon schiebt active → inactive.'],
  ['Pager für heap und stack?',['anonymous / swap pager','file pager','device pager','buddy pager'],'Kein Dateiabbild → swap area.'],
  ['Reference string 1 1 2 2 2 3 zählt als …',['1 2 3','1 1 2 2 2 3','1 2 2 3','3 3 3'],'Direkt aufeinanderfolgende Zugriffe auf dieselbe Seite = eine Referenz.'],
  ['Problem von NFU und Lösung?',['alte Vielnutzer bleiben → aging','Belady → FIFO','Überlauf → 64-bit counter','zu viele PFs → global clock'],'Aging: counter >> 1, R ins MSB.'],
  ['Register für die Segment Table im RAM?',['STBPR','PTBPR','CR3','TLB'],'PTBPR = Page Table Base Pointer Register.'],
  ['Simulationsergebnis zu Gap-Allocation?',['first ≈ best, beide besser als worst','worst-fit am besten','best-fit am schlechtesten','alle gleich'],'Worst-fit verbraucht große Lücken am schnellsten.'],
  ['FIFO 2nd chance degeneriert zu FIFO, wenn …',['alle R-Bits = 1','alle R-Bits = 0','alle frames frei','nie'],'Alle bekommen eine 2. Chance, dann wieder die älteste.'],
  ['Dynamic relocation braucht …',['eine MMU','nur den Linker','nur den Compiler','nichts'],'Übersetzung zur Laufzeit in Hardware.'],
  ['Zwei-stufiges Paging IA-32, 3 Seiten in 3 getrennten Bereichen: Tabellenspeicher?',['16 KiB','8 KiB','4 MiB','12 KiB'],'4 KiB Directory + 3 · 4 KiB second-level tables.'],
  ['W2K working set Größe (laut Folien)?',['50–345 pages','8–16 pages','1000–4000 pages','fest 128 pages'],'Variable assignment, local scope.']
];
const QZ={a:0,c:0};
function quizRender(){
  QZ.a=0;QZ.c=0;$('#quiz-score').textContent='0 / 0';
  const qs=shuffle(QUIZ.map((q,i)=>i));
  $('#quiz').innerHTML=qs.map((qi,n)=>{const [q,opts,why]=QUIZ[qi];const order=shuffle(opts.map((o,k)=>k));
    return `<div class="mcq" data-q="${qi}"><div class="q">${n+1}. ${esc(q)}</div><div class="opts">${order.map(k=>`<button class="opt" type="button" data-k="${k}">${esc(opts[k])}</button>`).join('')}</div><div class="why">${esc(why)}</div></div>`;}).join('');
  $$('#quiz .mcq').forEach(m=>{$$('.opt',m).forEach(b=>b.addEventListener('click',()=>{if(m.classList.contains('done'))return;m.classList.add('done');const right=b.dataset.k==='0';QZ.a++;if(right)QZ.c++;
    b.classList.add(right?'correct':'wrong');if(!right)$('.opt[data-k="0"]',m).classList.add('correct');$('#quiz-score').textContent=`${QZ.c} / ${QZ.a}`;}));});
}
$('#quiz-reset').addEventListener('click',quizRender);quizRender();
