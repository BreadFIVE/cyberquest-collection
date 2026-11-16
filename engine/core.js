/* ---------- helpers ---------- */
const A=s=>atob(s);
const dec=id=>atob(ENC[id]);              // flags that a widget reveals on success
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cyrb53(str,seed=0){let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0);}
/* "loose" flags ignore punctuation/spacing inside the answer: CTF{Angel of the North} == CTF{angel_of_the_north} */
const normFlag=(f,loose)=>{f=f.trim().toLowerCase();return loose?f.replace(/[^a-z0-9{}]/g,''):f};
const hashFlag=(f,loose)=>cyrb53(normFlag(f,loose)).toString(36);
const isMatch=(c,v)=>[].concat(c.h).includes(hashFlag(v,c.loose));
function toast(t,bad){const el=$('#toast');el.textContent=t;el.className='toast show'+(bad?' bad':'');clearTimeout(toast.t);toast.t=setTimeout(()=>el.className='toast',2600);}
const CATS=CONFIG.cats;

/* ---------- state ---------- */
const KEY='cq_state_'+CONFIG.id;
let S=null;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
S=S||{team:'',start:0,solved:{},hints:{},ended:false,extra:0};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const params=new URLSearchParams(location.search);
const baseMin=Math.max(1,parseInt(params.get('minutes'))||CONFIG.minutes||90);
const duration=()=>(baseMin*60+(S.extra||0))*1000;
const hintCost=(c,n)=>n<=0?0:(n===1?Math.round(c.pts*.1):Math.round(c.pts*.3));
const score=()=>Object.values(S.solved).reduce((a,b)=>a+b.pts,0);
const total=()=>DATA.reduce((a,c)=>a+c.pts,0);
const timeLeft=()=>S.start?Math.max(0,S.start+duration()-Date.now()):duration();
const over=()=>S.ended||(S.start&&timeLeft()<=0);
const fmt=ms=>{const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

/* ---------- boot ---------- */
function boot(){
  document.title='CyberQuest – '+CONFIG.name;
  if(!S.start){$('#welcome').classList.remove('hidden');$('#app').classList.add('hidden');return}
  $('#welcome').classList.add('hidden');$('#app').classList.remove('hidden');
  if(params.has('host'))$('#hostbox').classList.remove('hidden');
  $('#hTeam').textContent=S.team;
  renderBoard();updateHeader();tick();
  if(!boot.timer)boot.timer=setInterval(tick,1000);
  if(typeof initLab==='function')initLab();
  initTools();
}
$('#startbtn').onclick=()=>{
  const n=$('#teamname').value.trim();
  if(!n){$('#teamname').focus();toast('Pick a team name first',true);return}
  S.team=n;S.start=Date.now();S.solved={};S.hints={};S.ended=false;S.extra=0;save();boot();
};
$('#teamname').addEventListener('keydown',e=>{if(e.key==='Enter')$('#startbtn').click()});

function updateHeader(){
  $('#hScore').textContent=score();
  $('#hSolved').textContent=Object.keys(S.solved).length+'/'+DATA.length;
  $('#hBar').style.width=(Object.keys(S.solved).length/DATA.length*100)+'%';
}
function tick(){
  const left=timeLeft();
  $('#hTimer').textContent=S.ended?'DONE':fmt(left);
  const tb=$('#timerBox');tb.classList.toggle('warn',left<=15*60e3&&left>5*60e3);tb.classList.toggle('crit',left<=5*60e3&&!S.ended);
  if(!S.ended&&left<=0){S.ended=true;save();showReport(true)}
}

/* ---------- tabs ---------- */
$('#tabs').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  const names=$$('#tabs button').map(x=>x.dataset.tab);
  $$('#tabs button').forEach(x=>x.classList.toggle('on',x===b));
  names.forEach(t=>$('#tab-'+t).classList.toggle('hidden',t!==b.dataset.tab));
  if(b.dataset.tab==='lab')setTimeout(()=>$('#tinp')&&$('#tinp').focus(),50);
};

/* ---------- board ---------- */
function renderBoard(){
  let h='';
  for(const k of Object.keys(CATS)){
    const list=DATA.filter(c=>c.cat===k);if(!list.length)continue;
    const done=list.filter(c=>S.solved[c.id]).length;
    h+=`<div class="cat"><h2>${CATS[k].icon} ${CATS[k].name}</h2><small>${CATS[k].blurb} · ${done}/${list.length}</small></div><div class="grid">`;
    for(const c of list){
      const s=S.solved[c.id];
      h+=`<button class="ch ${s?'done':''}" data-id="${c.id}"><div class="t">${esc(c.title)}</div><div class="m"><span>${'★'.repeat(c.diff)}${'☆'.repeat(3-c.diff)}</span><span class="pts">${s?'+'+s.pts:c.pts} pts</span></div></button>`;
    }
    h+='</div>';
  }
  $('#tab-board').innerHTML=h;
  $$('.ch').forEach(b=>b.onclick=()=>openChallenge(b.dataset.id));
}

/* ---------- challenge modal ---------- */
function closeModal(){$('#modal').classList.add('hidden');document.body.style.overflow=''}
$('#modal').addEventListener('mousedown',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').classList.contains('hidden')&&!$('#mbox').dataset.report)closeModal()});

function openChallenge(id){
  const c=DATA.find(x=>x.id===id);if(!c)return;
  const solved=S.solved[id];
  const mb=$('#mbox');mb.dataset.report='';
  mb.innerHTML=`<button class="mclose" aria-label="Close">×</button>
    <div><span class="tag">${CATS[c.cat].icon} ${CATS[c.cat].name}</span><span class="tag pts">${c.pts} pts</span><span class="tag">${'★'.repeat(c.diff)}${'☆'.repeat(3-c.diff)}</span></div>
    <h2 style="margin-top:12px">${esc(c.title)}</h2>
    <div class="body">${c.body}</div>
    <div id="widget"></div>
    <div class="flagrow"><input type="text" id="flagIn" placeholder="CTF{...}" autocomplete="off" spellcheck="false" ${solved?'disabled':''}><button class="btn" id="flagGo" ${solved?'disabled':''}>Submit</button></div>
    <div class="msg ${solved?'ok':''}" id="flagMsg">${solved?'✓ Solved for '+solved.pts+' points':''}</div>
    <div class="hints" id="hintBox"></div>`;
  $('#modal').classList.remove('hidden');document.body.style.overflow='hidden';
  $('.mclose',mb).onclick=closeModal;
  renderHints(c);
  if(c.widget&&WIDGETS[c.widget])WIDGETS[c.widget]($('#widget'),c);
  const submit=()=>{
    if(over()){$('#flagMsg').className='msg bad';$('#flagMsg').textContent='Time is up – submissions are closed.';return}
    const v=$('#flagIn').value;if(!v.trim())return;
    if(isMatch(c,v)){
      const pts=Math.max(0,c.pts-hintCost(c,S.hints[id]||0));
      S.solved[id]={pts,t:Date.now()};save();renderBoard();updateHeader();
      $('#flagMsg').className='msg ok';$('#flagMsg').textContent='✓ Correct! +'+pts+' points';
      $('#flagIn').disabled=true;$('#flagGo').disabled=true;toast('🏴 Flag captured! +'+pts);
      if(Object.keys(S.solved).length===DATA.length)setTimeout(()=>showReport(false),1200);
    }else{
      $('#flagMsg').className='msg bad';$('#flagMsg').textContent='✗ Not quite. Check the format and spelling.';
    }
  };
  $('#flagGo').onclick=submit;
  $('#flagIn').addEventListener('keydown',e=>{if(e.key==='Enter')submit()});
  if(!solved)setTimeout(()=>$('#flagIn').focus(),30);
}
function renderHints(c){
  const used=S.hints[c.id]||0;const box=$('#hintBox');
  let h='';
  for(let i=0;i<used;i++)h+=`<div class="hint"><b>Hint ${i+1}:</b> ${c.hints[i]}</div>`;
  if(used<c.hints.length&&!S.solved[c.id]){
    const cost=hintCost(c,used+1);
    h+=`<button class="btn sec sm" id="hintBtn">💡 Reveal hint ${used+1} (−${cost} pts)</button>`;
  }
  box.innerHTML=h;
  const b=$('#hintBtn');
  if(b)b.onclick=()=>{S.hints[c.id]=(S.hints[c.id]||0)+1;save();renderHints(c)};
}

/* ---------- report ---------- */
function showReport(timeUp){
  const rows=DATA.filter(c=>S.solved[c.id]).map(c=>`<tr><td>${esc(c.title)}</td><td>${esc(CATS[c.cat].name)}</td><td>${S.solved[c.id].pts}</td></tr>`).join('');
  const missed=DATA.filter(c=>!S.solved[c.id]).length;
  const mb=$('#mbox');mb.dataset.report='1';
  mb.innerHTML=`<button class="mclose" aria-label="Close">×</button>
    <h2>${timeUp?'⏰ Time\'s up!':'📄 Mission report'}</h2>
    <p class="lead">${esc(CONFIG.name)} · Team <b>${esc(S.team)}</b> · <b style="color:var(--amber)">${score()}</b> / ${total()} points · ${Object.keys(S.solved).length}/${DATA.length} flags${missed?'':' · 🏆 PERFECT'}</p>
    <table class="sum"><tr><th>Challenge</th><th>Category</th><th>Points</th></tr>${rows||'<tr><td colspan="3">No flags yet – keep hunting!</td></tr>'}</table>
    <div class="row" style="margin-top:16px"><button class="btn" id="copyRep">📋 Copy summary</button><button class="btn sec" id="closeRep">Close</button></div>
    <p class="lead" style="font-size:13px">Show this screen to your host to log your score.</p>`;
  $('#modal').classList.remove('hidden');
  $('.mclose',mb).onclick=closeModal;$('#closeRep').onclick=closeModal;
  $('#copyRep').onclick=()=>{
    const t=`CyberQuest ${CONFIG.name} – Team ${S.team}: ${score()}/${total()} pts, ${Object.keys(S.solved).length}/${DATA.length} flags`;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Copied!'),()=>toast(t));
  };
}
$('#reportBtn').onclick=()=>showReport(false);
$('#finishBtn').onclick=()=>{if(confirm('Finish now? Your clock stops and submissions close.')){S.ended=true;S.endedAt=Date.now();save();tick();showReport(false)}};
$('#hostPlus').onclick=()=>{S.extra=(S.extra||0)+600;S.ended=false;save();tick();toast('+10 minutes')};
$('#hostReset').onclick=()=>{if(confirm('Wipe progress in this browser?')){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}};

const WIDGETS={};
