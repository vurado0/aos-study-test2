"use strict";
/* ========== Utilities ========== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function makeRng(seed){let s=(seed>>>0)||123456789;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const UR=makeRng((Date.now()%1000003)+7);
const ri=(a,b,r=UR)=>a+Math.floor(r()*(b-a+1));
const pick=(arr,r=UR)=>arr[Math.floor(r()*arr.length)];
function shuffle(a,r=UR){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const range=n=>Array.from({length:n},(_,i)=>i);
const hex=(n,pad=0)=>'0x'+(Math.floor(n)).toString(16).toUpperCase().padStart(pad,'0');
const hexB=(n,pad=0)=>'0x'+n.toString(16).toUpperCase().padStart(pad,'0');
function parseNum(str){
  if(typeof str!=='string') return NaN;
  str=str.trim().toLowerCase().replace(/[_\s]/g,'');
  if(!str) return NaN;
  if(/^0x[0-9a-f]+$/.test(str)) return parseInt(str.slice(2),16);
  if(/^0b[01]+$/.test(str)) return parseInt(str.slice(2),2);
  if(/^\d+$/.test(str)) return parseInt(str,10);
  return NaN;
}
function parseHexStr(str){str=String(str).trim().toLowerCase().replace(/[_\s]/g,'');if(str.startsWith('0x'))str=str.slice(2);if(!/^[0-9a-f]+$/.test(str))return NaN;return parseInt(str,16);}
function fmtBytes(b){const u=['B','KiB','MiB','GiB','TiB','PiB','EiB','ZiB'];let i=0;while(b>=1024&&i<u.length-1){b/=1024;i++;}return (Number.isInteger(b)?b:+b.toFixed(2))+' '+u[i];}
function sup(n){const m={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};return String(n).split('').map(c=>m[c]||c).join('');}
const log2i=x=>Math.round(Math.log2(x));
function binStr(v,len){if(typeof v==='bigint')return v.toString(2).padStart(len,'0').slice(-len);return Math.floor(v).toString(2).padStart(len,'0').slice(-len);}
function bitBar(v,total,groups){
  const s=binStr(v,total);let pos=0,html='<div class="bitbar">';
  groups.forEach((g,i)=>{const b=s.slice(pos,pos+g.bits);pos+=g.bits;
    html+=`<div class="bitgrp g${g.g!==undefined?g.g:i%5}"><div class="bits">${[...b].map(c=>`<span>${c}</span>`).join('')}</div><div class="bitlbl"><b>${esc(g.name)}</b> · ${g.bits} bit${g.val!==undefined?' = '+esc(g.val):''}</div></div>`;});
  return html+'</div>';
}
function fieldBar(groups){return `<div class="tablewrap"><div class="fieldbar">${groups.map((g,i)=>`<div class="f${g.f!==undefined?g.f:i%5}" style="flex:${Math.max(g.bits,3)}"><b>${esc(g.name)}</b>${g.bits} bit</div>`).join('')}</div></div>`;}
const okT=t=>`<span class="ok">✓ ${t}</span>`;
const badT=t=>`<span class="bad">✗ ${t}</span>`;
function fmtNum(v){if(Math.abs(v)>=1e6)return +(v/1e6).toFixed(2)+'M';if(Math.abs(v)>=1e4)return +(v/1e3).toFixed(1)+'k';return +(+v).toFixed(2)+'';}
function niceStep(s){if(s<=0)return 1;const e=Math.pow(10,Math.floor(Math.log10(s)));const f=s/e;return (f<=1?1:f<=2?2:f<=5?5:10)*e;}
function niceTicks(a,b,n){const st=niceStep((b-a)/n);const out=[];for(let v=Math.ceil(a/st)*st;v<=b+1e-9;v+=st)out.push(+v.toFixed(10));return out;}
function niceMax(v){if(v<=0)return 1;const e=Math.pow(10,Math.floor(Math.log10(v)));const f=v/e;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e;}
const DASH=['','8 4','2 4','12 4 2 4','5 5'];
const SHAPES=['circle','square','triangle','diamond','cross'];
function markerSvg(shape,x,y,r,cls){
  switch(shape){
    case 'square':return `<rect class="${cls}" x="${x-r}" y="${y-r}" width="${2*r}" height="${2*r}"/>`;
    case 'triangle':return `<path class="${cls}" d="M${x} ${y-r*1.2}L${x+r*1.1} ${y+r*.9}L${x-r*1.1} ${y+r*.9}Z"/>`;
    case 'diamond':return `<path class="${cls}" d="M${x} ${y-r*1.3}L${x+r*1.2} ${y}L${x} ${y+r*1.3}L${x-r*1.2} ${y}Z"/>`;
    case 'cross':return `<path class="${cls}" style="fill:none;stroke-width:2.4" d="M${x-r} ${y-r}L${x+r} ${y+r}M${x+r} ${y-r}L${x-r} ${y+r}"/>`;
    default:return `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;
  }
}
function lineChart(el,o){
  const series=o.series, w=o.w||760, h=o.h||280, pad={l:54,r:18,t:14,b:44};
  const xs=series.flatMap(s=>s.pts.map(p=>p[0])), ys=series.flatMap(s=>s.pts.map(p=>p[1]));
  if(!xs.length){el.innerHTML='<p class="muted">Keine Daten.</p>';return;}
  let xMin=o.xMin??Math.min(...xs), xMax=o.xMax??Math.max(...xs); if(xMax===xMin)xMax=xMin+1;
  const yMin=o.yMin??0, yMax=o.yMax??niceMax(Math.max(...ys,1));
  const X=v=>pad.l+(v-xMin)/(xMax-xMin)*(w-pad.l-pad.r), Y=v=>h-pad.b-(v-yMin)/(yMax-yMin)*(h-pad.t-pad.b);
  let grid='',labels='';
  niceTicks(yMin,yMax,5).forEach(v=>{grid+=`<line x1="${pad.l}" x2="${w-pad.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;labels+=`<text x="${pad.l-6}" y="${Y(v)+4}" text-anchor="end">${fmtNum(v)}</text>`;});
  let xt;
  if(o.integerX){const st=Math.max(1,Math.ceil((xMax-xMin)/10));xt=[];for(let v=Math.ceil(xMin);v<=xMax;v+=st)xt.push(v);}else xt=niceTicks(xMin,xMax,6);
  xt.forEach(v=>{labels+=`<text x="${X(v)}" y="${h-pad.b+16}" text-anchor="middle">${o.xFmt?o.xFmt(v):fmtNum(v)}</text>`;});
  let body='';
  series.forEach((s,i)=>{
    const cls='s'+(s.c!==undefined?s.c:i);
    if(!s.pts.length)return;
    const d=s.pts.map((p,k)=>(k?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('');
    if(o.area&&i===0){body+=`<path class="area ${cls}" d="${d}L${X(s.pts[s.pts.length-1][0]).toFixed(1)} ${Y(yMin)}L${X(s.pts[0][0]).toFixed(1)} ${Y(yMin)}Z"/>`;}
    body+=`<path class="line ${cls}" d="${d}" stroke-dasharray="${DASH[i%5]}"/>`;
    const showM=s.pts.length<=60;
    s.pts.forEach((p,k)=>{const last=k===s.pts.length-1;if(showM||last)body+=markerSvg(SHAPES[i%5],X(p[0]),Y(p[1]),last?5:3.4,cls);});
  });
  if(o.vline){const vx=X(o.vline.x);body+=`<line x1="${vx}" x2="${vx}" y1="${pad.t}" y2="${h-pad.b}" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:4 3"/><text x="${vx+5}" y="${pad.t+12}" style="fill:var(--ink);font-weight:700">${esc(o.vline.label||'')}</text>`;}
  const axes=`<line class="axis" x1="${pad.l}" x2="${w-pad.r}" y1="${Y(yMin)}" y2="${Y(yMin)}"/><line class="axis" x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${h-pad.b}"/>`;
  const xl=o.xLabel?`<text x="${(pad.l+w-pad.r)/2}" y="${h-6}" text-anchor="middle">${esc(o.xLabel)}</text>`:'';
  const yl=o.yLabel?`<text transform="translate(13 ${(pad.t+h-pad.b)/2}) rotate(-90)" text-anchor="middle">${esc(o.yLabel)}</text>`:'';
  const legend=series.length>1||o.legend?`<div class="legend">${series.map((s,i)=>`<span><svg viewBox="0 0 40 14" class="chart"><path class="line s${s.c!==undefined?s.c:i}" d="M2 7H38" stroke-dasharray="${DASH[i%5]}" style="fill:none;stroke-width:2.2"/>${markerSvg(SHAPES[i%5],20,7,3.6,'s'+(s.c!==undefined?s.c:i))}</svg>${esc(s.name)}</span>`).join('')}</div>`:'';
  el.innerHTML=`<div class="tablewrap"><svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.aria||'Diagramm')}"><g class="grid">${grid}</g>${axes}${body}${labels}${xl}${yl}</svg></div>${legend}`;
}
function hbars(rows,unit=''){const max=Math.max(...rows.map(r=>r.v),1);return `<div class="hbars">${rows.map(r=>`<div class="row${r.best?' best':''}"><div class="lbl">${esc(r.label)}${r.best?' ★':''}</div><div><div class="bar" style="width:${Math.max(1,r.v/max*100)}%"></div></div><div class="val">${esc(r.text??r.v)}${unit}</div></div>`).join('')}</div>`;}

/* ========== Nav + Theme ========== */
(function nav(){
  const det=$('#navdetails'); if(window.innerWidth>=900) det.open=true;
  const links=$$('nav.side li a'); const map=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(l=>l.classList.remove('active'));const a=map.get(e.target.id);if(a)a.classList.add('active');}});},{rootMargin:'-10% 0px -80% 0px'});
    $$('section.topic, header.hero').forEach(s=>io.observe(s));
  }
  $('#themeBtn').addEventListener('click',()=>{const r=document.documentElement;const cur=r.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const nx=cur==='dark'?'light':'dark';r.setAttribute('data-theme',nx);try{localStorage.setItem('aos-theme',nx);}catch(e){}});
  try{const t=localStorage.getItem('aos-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}
})();

/* ========== 1.2 Internal fragmentation ========== */
function ifCalc(){const s=+$('#if-size').value,p=+$('#if-ps').value;if(!(s>0)){$('#if-out').innerHTML=badT('Größe > 0 eingeben');return;}
  const n=Math.ceil(s/p),waste=n*p-s;
  $('#if-out').innerHTML=`<div class="formula">⌈${s} / ${p}⌉ = <b>${n} pages</b> → ${n} · ${p} = ${n*p} Byte</div><p>Internal fragmentation: <b>${waste} Byte</b> (${(waste/p*100).toFixed(1)} % der letzten Seite leer)</p>`;}
['#if-size','#if-ps'].forEach(s=>$(s).addEventListener('input',ifCalc));ifCalc();

/* ========== 1.3 Gap allocation ========== */
const GAP={
  base:[['OS',180],['h',100],['A',90],['h',500],['B',120],['h',200],['C',70],['h',300],['D',110],['h',600],['E',60]],
  reqs:[212,417,112,426],
  reset(){this.blocks=this.base.map(([n,s])=>n==='h'?{type:'hole',size:s}:{type:'used',size:s,label:n});this.ri=0;this.pid=1;this.nf=0;this.chosen=-1;
    this.msg='Start: Lücken 100, 500, 200, 300, 600 K. Algorithmus wählen, dann „Nächste Anfrage“.';this.render();},
  alloc(size){
    const alg=$('#gap-alg').value;const holes=this.blocks.map((b,i)=>({b,i})).filter(o=>o.b.type==='hole');
    let pi=-1,checked=[];
    if(alg==='first'){for(const o of holes){checked.push(o.b.size);if(o.b.size>=size){pi=o.i;break;}}}
    else if(alg==='best'||alg==='worst'){checked=holes.map(o=>o.b.size);const fits=holes.filter(o=>o.b.size>=size);
      if(fits.length)pi=fits.reduce((a,c)=>(alg==='best'?c.b.size<a.b.size:c.b.size>a.b.size)?c:a).i;}
    else{const n=this.blocks.length;for(let k=0;k<n;k++){const i=(this.nf+k)%n,b=this.blocks[i];if(b.type==='hole'){checked.push(b.size);if(b.size>=size){pi=i;break;}}}}
    this.blocks.forEach(b=>{if(b.type==='new')b.type='used';});
    const label='P'+this.pid++;
    if(pi<0){this.chosen=-1;const free=holes.reduce((a,o)=>a+o.b.size,0);
      this.msg=`${badT(`${label} = ${size} K passt in keine Lücke → muss warten`)}. Frei insgesamt ${free} K (external fragmentation). Geprüft: <span class="mono">${checked.join(', ')||'–'}</span>`;this.render();return;}
    const hole=this.blocks[pi],rest=hole.size-size;const nb=[{type:'new',size,label}];if(rest>0)nb.push({type:'hole',size:rest});
    this.blocks.splice(pi,1,...nb);this.chosen=pi;this.nf=pi+1;
    const names={first:'First-fit: erste passende',best:'Best-fit: kleinste passende',worst:'Worst-fit: größte',next:'Next-fit: erste passende ab Zeiger'};
    this.msg=`${okT(`${label} = ${size} K → Lücke ${hole.size} K`)}, Rest ${rest} K. ${names[alg]} · geprüft: <span class="mono">${checked.join(', ')}</span>`;this.render();},
  render(){const total=this.blocks.reduce((a,b)=>a+b.size,0);
    let html='<div class="membar">'+this.blocks.map((b,i)=>`<div class="blk ${b.type}${i===this.chosen?' chosen':''}" style="flex:${b.size}" title="${b.size} K">${b.type==='hole'?`<span>${b.size}K</span><span>frei</span>`:`<b>${esc(b.label)}</b><span>${b.size}K</span>`}</div>`).join('')+'</div>';
    if($('#gap-alg').value==='next'){let off=0;for(let i=0;i<Math.min(this.nf,this.blocks.length);i++)off+=this.blocks[i].size;html+=`<div class="ptr" style="left:${Math.min(97,Math.max(3,off/total*100)).toFixed(2)}%">▼ next-fit</div>`;}
    $('#gap-bar').innerHTML=html;$('#gap-log').innerHTML=this.msg;
    const nx=this.reqs[this.ri];const b=$('#gap-next');b.textContent=nx!==undefined?`Nächste Anfrage (${nx} K)`:'Alle 4 Anfragen erledigt';b.disabled=nx===undefined;}
};
$('#gap-next').addEventListener('click',()=>{const s=GAP.reqs[GAP.ri++];if(s!==undefined)GAP.alloc(s);});
$('#gap-custom').addEventListener('click',()=>{const s=+$('#gap-size').value;if(s>0)GAP.alloc(s);});
$('#gap-reset').addEventListener('click',()=>GAP.reset());
$('#gap-alg').addEventListener('change',()=>GAP.reset());
GAP.reset();

/* ========== 1.5 Segmentation ========== */
const SEG={st:[{name:'Code',base:0x4000,limit:0x0800,rights:'R-X'},{name:'Data',base:0x6000,limit:0x1000,rights:'RW-'},{name:'Stack',base:0xA000,limit:0x0600,rights:'RW-'},{name:'libc (shared)',base:0x9000,limit:0x0400,rights:'R-X'}]};
function segTable(sel){
  $('#seg-table').innerHTML=`<table class="t compact"><tr><th>s</th><th>Segment</th><th>base</th><th>limit</th><th>Rechte</th></tr>${SEG.st.map((e,i)=>`<tr class="${i===sel?'hl':''}"><td>${i}</td><td>${esc(e.name)}</td><td><input class="w-s mono" data-seg="${i}" data-k="base" value="${hex(e.base,4)}" aria-label="base ${i}"></td><td><input class="w-s mono" data-seg="${i}" data-k="limit" value="${hex(e.limit,4)}" aria-label="limit ${i}"></td><td><input class="w-s mono" data-seg="${i}" data-k="rights" value="${e.rights}" aria-label="Rechte ${i}"></td></tr>`).join('')}</table>`;
  $$('#seg-table input').forEach(inp=>inp.addEventListener('change',()=>{const i=+inp.dataset.seg,k=inp.dataset.k;if(k==='rights')SEG.st[i].rights=inp.value.toUpperCase();else{const v=parseHexStr(inp.value);if(!isNaN(v))SEG.st[i][k]=v&0xFFFF;}segGo(false);}));
}
function segGo(fromVA){
  let s,d,va;
  if(fromVA){va=parseHexStr($('#seg-va').value);if(isNaN(va)||va>0xFFFF){$('#seg-steps').innerHTML=badT('Hex-Adresse 0x0000–0xFFFF eingeben');return;}s=va>>14;d=va&0x3FFF;$('#seg-s').value=s;$('#seg-d').value=hex(d,4);}
  else{s=+$('#seg-s').value;d=parseHexStr($('#seg-d').value);if(isNaN(d)){$('#seg-steps').innerHTML=badT('Offset als Hex eingeben');return;}
    if(d>0x3FFF){segTable(s);$('#seg-steps').innerHTML=badT('Offset passt nicht in 14 bit (max 0x3FFF)');return;}va=(s<<14)|d;$('#seg-va').value=hex(va,4);}
  const e=SEG.st[s],acc=$('#seg-acc').value;segTable(s);
  const inLimit=d<e.limit, rightOk=e.rights.includes(acc);
  const pa=e.base+d;
  let h=bitBar(va,16,[{name:'s',bits:2,val:s},{name:'d',bits:14,val:hex(d,4)}]);
  h+=`<ol class="steps"><li>Zerlegen: s = Bits 15–14 = <b>${s}</b>, d = Bits 13–0 = <b>${hex(d,4)}</b> (${d})</li>`;
  h+=`<li>ST[${s}] (${esc(e.name)}) → base = <b>${hex(e.base,4)}</b>, limit = <b>${hex(e.limit,4)}</b>, Rechte ${esc(e.rights)}</li>`;
  h+=`<li>Limit-Check: d &lt; limit ? ${hex(d,4)} &lt; ${hex(e.limit,4)} → ${inLimit?okT('ok'):badT('TRAP: segmentation fault')}</li>`;
  if(inLimit)h+=`<li>Rechte-Check: ${acc} in „${esc(e.rights)}“ → ${rightOk?okT('ok'):badT('TRAP: Schutzverletzung')}</li>`;
  if(inLimit&&rightOk)h+=`<li>PA = base + d = ${hex(e.base,4)} + ${hex(d,4)} = <span class="result">${hex(pa,4)}</span> (${pa})</li>`;
  h+='</ol>';$('#seg-steps').innerHTML=h;
  // phys bar
  const M=0x10000;let ph='<div class="physbar">';
  SEG.st.forEach((x,i)=>{const l=x.base/M*100,w=Math.max(.6,x.limit/M*100);ph+=`<div class="seg${i===s?' sel':''}" style="left:${l}%;width:${w}%" title="${esc(x.name)}">s${i}</div>`;});
  if(inLimit&&rightOk)ph+=`<div class="mark" style="left:${pa/M*100}%"><span>PA ${hex(pa,4)}</span></div>`;
  ph+=`<div class="ticks">${[0,0x4000,0x8000,0xC000].map(v=>`<span style="position:absolute;left:${v/M*100}%">${hex(v,4)}</span>`).join('')}<span style="position:absolute;right:0">0xFFFF</span></div></div>`;
  $('#seg-phys').innerHTML=ph;
}
$('#seg-go').addEventListener('click',()=>segGo(false));
$('#seg-va').addEventListener('change',()=>segGo(true));
['#seg-s','#seg-acc'].forEach(x=>$(x).addEventListener('change',()=>segGo(false)));
$('#seg-d').addEventListener('change',()=>segGo(false));
segGo(true);

/* ========== 1.6 Paging ========== */
const PG={pmt:[]};
function pgGen(forcePage){
  const vb=+$('#pg-va-bits').value,pb=+$('#pg-pa-bits').value,ps=+$('#pg-ps').value,off=log2i(ps);
  if(vb<=off||pb<=off){$('#pg-table').innerHTML=badT('Adressbits müssen größer als die Offset-Bits ('+off+') sein');PG.pmt=[];return;}
  const np=2**(vb-off),nf=2**(pb-off),show=Math.min(np,64);
  const fr=shuffle(range(Math.min(nf,4096)));
  PG.pmt=range(show).map(p=>(UR()<0.72||p===forcePage)?{v:1,f:fr[p%fr.length]}:{v:0,f:null});
  Object.assign(PG,{vb,pb,ps,off,np,nf,show});
  pgTable(-1);
}
function pgTable(hl){
  let h=`<table class="t compact"><tr><th>page p</th><th>present</th><th>frame f</th><th>f (hex)</th></tr>`;
  PG.pmt.forEach((e,p)=>{h+=`<tr class="${p===hl?'hl':''}" data-p="${p}" style="cursor:pointer"><td>${p}</td><td>${e.v?'✓ 1':'– 0'}</td><td>${e.v?e.f:'–'}</td><td class="mono">${e.v?hex(e.f):'–'}</td></tr>`;});
  h+='</table>';if(PG.np>PG.show)h+=`<p class="muted">Seiten ${PG.show}–${PG.np-1}: present = 0 (gekürzt)</p>`;
  h+=`<p class="muted">${PG.np} pages à ${PG.ps} B · ${PG.nf} frames</p>`;
  $('#pg-table').innerHTML=h;
  $$('#pg-table tr[data-p]').forEach(tr=>tr.addEventListener('click',()=>{const p=+tr.dataset.p;const old=parseNum($('#pg-va').value);const d=isNaN(old)?0:old%PG.ps;$('#pg-va').value=hex(p*PG.ps+d);pgGo();}));
}
function pgGo(){
  if(!PG.pmt.length)return;
  const va=parseNum($('#pg-va').value),{vb,pb,ps,off}=PG;
  if(isNaN(va)||va<0||va>=2**vb){$('#pg-steps').innerHTML=badT(`Adresse muss in 0 … ${hex(2**vb-1)} liegen (${vb} bit)`);return;}
  const p=Math.floor(va/ps),d=va%ps;pgTable(p<PG.show?p:-1);
  let h=bitBar(va,vb,[{name:'page p',bits:vb-off,val:p},{name:'offset d',bits:off,val:d}]);
  h+=`<ol class="steps"><li>offset bits = log₂(${ps}) = <b>${off}</b>, page bits = ${vb} − ${off} = <b>${vb-off}</b></li>`;
  h+=`<li>p = ⌊VA / page size⌋ = ⌊${va} / ${ps}⌋ = <b>${p}</b> · d = VA mod ${ps} = <b>${d}</b> (${hex(d)})</li>`;
  const e=p<PG.show?PG.pmt[p]:{v:0};
  if(!e.v){h+=`<li>PMT[${p}]: present = 0 → ${badT('PAGE FAULT / Trap ans OS')} (UD2: Seite nachladen)</li></ol>`;$('#pg-steps').innerHTML=h;return;}
  const pa=e.f*ps+d;
  h+=`<li>PMT[${p}] → frame f = <b>${e.f}</b></li><li>PA = f · page size + d = ${e.f} · ${ps} + ${d} = <span class="result">${pa} = ${hex(pa)}</span></li></ol>`;
  h+=bitBar(pa,pb,[{name:'frame f',bits:pb-off,val:e.f},{name:'offset d',bits:off,val:d,g:1}]);
  h+=`<p class="muted">Offset-Bits bleiben gleich, nur p wird durch f ersetzt (Konkatenation f ‖ d).</p>`;
  $('#pg-steps').innerHTML=h;
}
$('#pg-go').addEventListener('click',pgGo);$('#pg-va').addEventListener('change',pgGo);
$('#pg-new').addEventListener('click',()=>{const va=parseNum($('#pg-va').value);pgGen(Math.floor(va/+$('#pg-ps').value));pgGo();});
['#pg-va-bits','#pg-pa-bits','#pg-ps'].forEach(s=>$(s).addEventListener('change',()=>{const va=parseNum($('#pg-va').value);pgGen(Math.floor(va/+$('#pg-ps').value));pgGo();}));
pgGen(3);pgGo();

/* ========== 1.7 Multilevel format ========== */
function mfCalc(){
  const va=+$('#mf-va').value,ps=+$('#mf-ps').value,es=+$('#mf-es').value,pa=+$('#mf-pa').value,reg=Math.max(1,+$('#mf-reg').value);
  const off=log2i(ps),entries=ps/es,idx=log2i(entries),rest=va-off;
  if(rest<=0){$('#mf-out').innerHTML=badT('Virtual bits müssen größer als offset sein');return;}
  const levels=Math.ceil(rest/idx),top=rest-(levels-1)*idx;
  const nm=levels===4?['PML4','PDPT','PD','PT']:levels===2?['Directory','Table']:levels===3?['Global dir','Middle dir','Page table']:levels===1?['Page']:range(levels).map(i=>'Ebene '+(i+1));
  const groups=nm.map((n,i)=>({name:n,bits:i===0?top:idx}));groups.push({name:'offset',bits:off,f:4});
  const single=2**rest*es,topT=2**top*es;
  const min1=topT+(levels-1)*ps,minR=topT+reg*(levels-1)*ps;
  const frameBits=pa-off;
  let h=`<ol class="steps"><li>offset = log₂(${ps}) = <b>${off} bit</b></li>`;
  h+=`<li>Einträge pro Tabelle = page size / entry size = ${ps} / ${es} = <b>${entries}</b> → index = log₂(${entries}) = <b>${idx} bit</b></li>`;
  h+=`<li>Restbits = ${va} − ${off} = ${rest} → Ebenen = ⌈${rest} / ${idx}⌉ = <b>${levels}</b>${top<idx?` · oberste Ebene nur <b>${top} bit</b> (${2**top} Einträge, Tabelle nicht voll)`:''}</li>`;
  h+=`<li>Format: <span class="mono">${groups.map(g=>g.bits).join(' | ')}</span></li></ol>`;
  h+=fieldBar(groups);
  h+=`<div class="kv"><div><b>${fmtBytes(single)}</b><span>einstufige PMT = 2${sup(rest)} · ${es} B</span></div><div><b>${fmtBytes(min1)}</b><span>mehrstufig, 1 Region (alle Seiten in einem Bereich)</span></div><div><b>${fmtBytes(minR)}</b><span>mehrstufig, ${reg} getrennte Regionen</span></div><div><b>2${sup(frameBits>0?frameBits:0)}</b><span>frames (${pa} bit physisch) · frame-Nr. ${frameBits} bit ${frameBits<=es*8?'✓ passt in Eintrag':'✗ passt nicht in '+es*8+' bit'}</span></div></div>`;
  h+=`<p class="muted">Mehrstufig: oberste Tabelle ${fmtBytes(topT)} + je Region ${levels-1} Tabelle(n) à ${fmtBytes(ps)}.</p>`;
  $('#mf-out').innerHTML=h;
}
['#mf-va','#mf-ps','#mf-es','#mf-pa','#mf-reg'].forEach(s=>$(s).addEventListener('input',mfCalc));
$$('[data-mf]').forEach(b=>b.addEventListener('click',()=>{const [va,ps,es,pa,r]=b.dataset.mf.split(',');$('#mf-va').value=va;$('#mf-ps').value=ps;$('#mf-es').value=es;$('#mf-pa').value=pa;$('#mf-reg').value=r;mfCalc();}));
mfCalc();

/* ========== 1.8 TLB ========== */
function tlbCalc(){
  const h=+$('#tlb-h').value/100,e=+$('#tlb-e').value,m=+$('#tlb-m').value,n=Math.max(1,+$('#tlb-n').value);
  $('#tlb-hv').textContent=Math.round(h*100)+' %';
  const hit=e+m,miss=e+(n+1)*m,eat=h*hit+(1-h)*miss,no=(n+1)*m;
  $('#tlb-out').innerHTML=`<div class="formula">EAT = h·(ε+m) + (1−h)·(ε+${n+1}·m)<br>= ${h.toFixed(2)}·${hit} + ${(1-h).toFixed(2)}·${miss} = <b>${+eat.toFixed(2)} ns</b></div>`+
  hbars([{label:'nur Daten',v:m,text:m+' ns'},{label:'mit TLB',v:eat,text:(+eat.toFixed(1))+' ns',best:true},{label:'ohne TLB',v:no,text:no+' ns'}])+
  `<p class="muted">Overhead gegenüber m: ${((eat/m-1)*100).toFixed(1)} % · ohne TLB: ${((no/m-1)*100).toFixed(0)} %</p>`;
}
['#tlb-h','#tlb-e','#tlb-m','#tlb-n'].forEach(s=>$(s).addEventListener('input',tlbCalc));tlbCalc();

/* ========== 1.9 Pentium ========== */
const PT={gdt:[null,{name:'Code (flat)',base:0x00000000,limit:0xFFFFF,G:1},{name:'Data',base:0x10000000,limit:0x3FFFF,G:0},{name:'Kernel-Daten',base:0x00800000,limit:0x003FF,G:1}],
  ldt:[null,{name:'Proz.-Code',base:0x08048000,limit:0x0FFFF,G:0},{name:'Proz.-Stack',base:0xBF000000,limit:0x000FF,G:1}]};
const effLimit=d=>d.G?(d.limit+1)*4096-1:d.limit;
function ptTables(ti,idx){
  const row=(t,tn)=>t.map((d,i)=>i===0?`<tr><td>${tn}[0]</td><td colspan="4" class="muted">null descriptor</td></tr>`:`<tr class="${(tn==='LDT')===(ti===1)&&i===idx?'hl':''}"><td>${tn}[${i}]</td><td>${esc(d.name)}</td><td class="mono">${hex(d.base,8)}</td><td class="mono">${hex(d.limit,5)}</td><td>${d.G}</td></tr>`).join('');
  $('#pt-tables').innerHTML=`<table class="t compact"><tr><th>Eintrag</th><th>Name</th><th>base</th><th>limit</th><th>G</th></tr>${row(PT.gdt,'GDT')}${row(PT.ldt,'LDT')}</table>`;
}
function ptGo(){
  const sel=parseHexStr($('#pt-sel').value),off=parseHexStr($('#pt-off').value);
  if(isNaN(sel)||sel>0xFFFF||isNaN(off)||off>0xFFFFFFFF){$('#pt-steps').innerHTML=badT('Selector ≤ 0xFFFF und Offset ≤ 0xFFFFFFFF (hex) eingeben');return;}
  const idx=sel>>3,ti=(sel>>2)&1,rpl=sel&3;ptTables(ti,idx);
  const tbl=ti?PT.ldt:PT.gdt,d=tbl[idx];
  let h=bitBar(sel,16,[{name:'index',bits:13,val:idx},{name:'TI',bits:1,val:ti?'LDT':'GDT'},{name:'RPL',bits:2,val:rpl}]);
  h+=`<ol class="steps"><li>Selector ${hex(sel,4)} → index <b>${idx}</b>, TI = ${ti} (<b>${ti?'LDT':'GDT'}</b>), RPL = <b>${rpl}</b> (Ring ${rpl})</li>`;
  if(!d){h+=`<li>${badT(`${ti?'LDT':'GDT'}[${idx}] existiert nicht${idx===0?' (null descriptor)':''} → General Protection Fault`)}</li></ol>`;$('#pt-steps').innerHTML=h;return;}
  const el=effLimit(d),inl=off<=el;
  h+=`<li>Descriptor: base = <b>${hex(d.base,8)}</b>, limit = ${hex(d.limit,5)}, G = ${d.G} → effektives limit = ${d.G?`(${hex(d.limit,5)}+1)·4096−1 = `:''}<b>${hex(el,8)}</b></li>`;
  h+=`<li>offset ≤ limit? ${hex(off,8)} ≤ ${hex(el,8)} → ${inl?okT('ok'):badT('General Protection Fault')}</li>`;
  if(!inl){h+='</ol>';$('#pt-steps').innerHTML=h;return;}
  const lin=(d.base+off)%4294967296;
  h+=`<li>linear = base + offset = ${hex(d.base,8)} + ${hex(off,8)} = <span class="result">${hex(lin,8)}</span></li></ol>`;
  const dir=Math.floor(lin/4194304),tab=Math.floor(lin/4096)%1024,o=lin%4096;
  h+=bitBar(lin,32,[{name:'dir',bits:10,val:dir},{name:'table',bits:10,val:tab},{name:'offset',bits:12,val:hex(o,3),g:4}]);
  const fr=((Math.imul(dir+1,2654435761)^Math.imul(tab+7,40503))>>>0)&0xFFFFF;const phys=fr*4096+o;
  h+=`<ol class="steps" start="5"><li>Page directory[${dir}] → page table · page table[${tab}] → frame <b>${hex(fr,5)}</b> <span class="muted">(Beispielwert)</span></li><li>physical = frame ‖ offset = <span class="result">${hex(phys,8)}</span></li></ol>`;
  $('#pt-steps').innerHTML=h;
}
$('#pt-go').addEventListener('click',ptGo);['#pt-sel','#pt-off'].forEach(s=>$(s).addEventListener('change',ptGo));
$$('[data-pt]').forEach(b=>b.addEventListener('click',()=>{const [s,o]=b.dataset.pt.split(',');$('#pt-sel').value=s;$('#pt-off').value=o;ptGo();}));
ptGo();

/* ========== 1.10 x86-64 ========== */
function x64Go(){
  let s=$('#x64-va').value.trim().toLowerCase().replace(/[_\s]/g,'');if(s.startsWith('0x'))s=s.slice(2);
  if(!/^[0-9a-f]{1,16}$/.test(s)){$('#x64-out').innerHTML=badT('Bis zu 16 Hex-Ziffern eingeben');return;}
  const v=BigInt('0x'+s),b47=(v>>47n)&1n,top=v>>48n,canon=top===(b47?0xFFFFn:0n);
  const ps=$('#x64-ps').value;
  const f=(sh,mask)=>Number((v>>BigInt(sh))&BigInt(mask));
  const groups=[{name:'63–48 sign-ext',bits:16,val:hexB(top,4),g:3},{name:'PML4',bits:9,val:f(39,0x1FF)},{name:'PDPT',bits:9,val:f(30,0x1FF)}];
  if(ps==='4K')groups.push({name:'PD',bits:9,val:f(21,0x1FF)},{name:'PT',bits:9,val:f(12,0x1FF)},{name:'offset',bits:12,val:hex(f(0,0xFFF)),g:4});
  else if(ps==='2M')groups.push({name:'PD',bits:9,val:f(21,0x1FF)},{name:'offset 2 MiB',bits:21,val:hex(f(0,0x1FFFFF)),g:4});
  else groups.push({name:'offset 1 GiB',bits:30,val:hex(f(0,0x3FFFFFFF)),g:4});
  let h=bitBar(v,64,groups);
  const low=v&((1n<<48n)-1n),fixed=b47?(low|(0xFFFFn<<48n)):low;
  h+=`<ol class="steps"><li>Bit 47 = <b>${b47}</b> → Bits 63–48 müssen <b>${b47?'0xFFFF':'0x0000'}</b> sein, sind <b>${hexB(top,4)}</b></li>`;
  h+=`<li>${canon?okT(`canonical · ${b47?'obere Hälfte (Kernel)':'untere Hälfte (User)'}`):badT('non-canonical → General Protection Fault')}</li>`;
  if(!canon)h+=`<li>Canonical wäre: <span class="mono">${hexB(fixed,16)}</span></li>`;
  h+=`<li>Walk: ${ps==='4K'?'PML4 → PDPT → PD → PT (4 Zugriffe)':ps==='2M'?'PML4 → PDPT → PD (PS=1, Stopp)':'PML4 → PDPT (PS=1, Stopp)'}</li></ol>`;
  $('#x64-out').innerHTML=h;
}
$('#x64-go').addEventListener('click',x64Go);['#x64-va','#x64-ps'].forEach(s=>$(s).addEventListener('change',x64Go));
$$('[data-x64]').forEach(b=>b.addEventListener('click',()=>{$('#x64-va').value=b.dataset.x64;x64Go();}));
x64Go();

/* ========== 1.11 Buffer overflow ========== */
const BO={stack:0x7ffd3a2c1000n,ret:[0x96,0x11,0x40,0,0,0,0,0]};
function boRender(){
  const L=+$('#bo-len').value;$('#bo-lv').textContent=L;
  const cell=i=>{if(i<L)return `<span class="${i>=16?'over':'f'}">A</span>`;if(i===L)return `<span class="${i>=16?'over':'f'}">0</span>`;return '<span></span>';};
  const rows=[['Caller-Frame (args)',32,8],['return address',24,8],['saved RBP',16,8],['char buf[16]',0,16]];
  let h='<div class="stack"><div class="row"><div>hohe Adressen ↑</div><div class="muted">Stack wächst nach unten, strcpy schreibt nach oben</div></div>';
  rows.forEach(([n,s,c])=>{h+=`<div class="row"><div>${n}</div><div class="cells">${range(c).map(k=>cell(s+k)).join('')}</div></div>`;});
  h+=`<div class="row"><div>niedrige Adressen ↓</div><div class="mono">buf @ ${hexB(BO.stack-0x20n)}</div></div></div>`;
  $('#bo-stack').innerHTML=h;
  const ret=BO.ret.map((b,k)=>{const i=24+k;return i<L?0x41:i===L?0:b;});
  const retHex='0x'+ret.slice().reverse().map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
  let t=`<p>input = ${L} × 'A' + '\\0' → ${L+1} Byte geschrieben.</p>`;
  if(L<16)t+=`<p>${okT('passt in buf')}</p>`;
  else if(L<24)t+=`<p>${badT('saved RBP überschrieben')} – Frame-Pointer kaputt (off-by-one schon bei 16).</p>`;
  else t+=`<p>${badT('return address überschrieben')}: <b class="mono">${retHex}</b><br>Bei <code>ret</code> springt die CPU dorthin. Angreifer setzt hier eine <b>feste Zieladresse</b> ein.</p>`;
  t+=`<p><b>ASLR</b>: Stack-Basis diesmal <span class="mono">${hexB(BO.stack)}</span>. Bei jedem Start anders → eine feste Zieladresse trifft nicht mehr.</p>`;
  $('#bo-info').innerHTML=t;
}
$('#bo-len').addEventListener('input',boRender);
$('#bo-aslr').addEventListener('click',()=>{BO.stack=0x7ff000000000n+(BigInt(ri(0,0xFFFFFF))<<12n);boRender();});
boRender();
