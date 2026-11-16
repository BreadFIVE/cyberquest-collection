/* =====================================================================
   COMMON WIDGETS – reusable interactive challenge components.
   A challenge opts in with  widget:'name'  and configures it with  wd:{...}
   Widgets that "reveal" a flag use dec(c.id), so the flag is never stored in plain text.
   ===================================================================== */

/* classify: pick the right option for every item (also used for "match each X to its Y")
   wd:{prompt, options:['Legal','Illegal'], items:[{t:'text', a:0}], win:'message'}            */
WIDGETS.classify=(el,c)=>{
  const w=c.wd;
  el.innerHTML=(w.prompt?`<p class="lead" style="margin-top:14px">${w.prompt}</p>`:'')+
    w.items.map((it,i)=>`<div class="pickrow" data-i="${i}"><div>${it.t}</div><select><option value="">Choose…</option>${w.options.map((o,j)=>`<option value="${j}">${o}</option>`).join('')}</select></div>`).join('')+
    `<p style="margin-top:12px"><button class="btn sm" id="clGo">Check answers</button></p><div class="res" id="clR"></div>`;
  $('#clGo',el).onclick=()=>{
    const R=$('#clR',el),rows=$$('.pickrow',el);
    if(rows.some(r=>$('select',r).value==='')){R.className='res bad';R.textContent='Answer every row first.';return}
    let ok=0;
    rows.forEach((r,i)=>{const good=+$('select',r).value===w.items[i].a;if(good)ok++;r.classList.toggle('ok',good);r.classList.toggle('no',!good)});
    if(ok===rows.length){R.className='res ok';R.innerHTML=ok+'/'+ok+' – '+(w.win||'all correct')+'. Flag: <b>'+esc(dec(c.id))+'</b>'}
    else{R.className='res bad';R.textContent=ok+'/'+rows.length+' correct – the red rows are wrong. '+(w.retry||'Think again.')}
  };
};

/* order: put the steps in the right order (wd:{prompt, items:['first','second',...]} given in CORRECT order) */
WIDGETS.order=(el,c)=>{
  const w=c.wd,n=w.items.length;
  let seed=cyrb53(c.id)%2147483647||7;const rnd=()=>(seed=seed*48271%2147483647)/2147483647;
  let idx=[...Array(n).keys()];
  do{for(let i=n-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]]}}while(idx.every((v,i)=>v===i)||idx[0]===0);
  const draw=()=>{
    $('#ordL',el).innerHTML=idx.map((v,p)=>`<li><span>${w.items[v]}</span><button data-p="${p}" data-d="-1" aria-label="Move up">▲</button><button data-p="${p}" data-d="1" aria-label="Move down">▼</button></li>`).join('');
  };
  el.innerHTML=(w.prompt?`<p class="lead" style="margin-top:14px">${w.prompt}</p>`:'')+`<ol class="ordl" id="ordL"></ol><p><button class="btn sm" id="ordGo">Check order</button></p><div class="res" id="ordR"></div>`;
  draw();
  $('#ordL',el).onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    const p=+b.dataset.p,q=p+ +b.dataset.d;if(q<0||q>=n)return;
    [idx[p],idx[q]]=[idx[q],idx[p]];draw();
  };
  $('#ordGo',el).onclick=()=>{
    const R=$('#ordR',el),ok=idx.filter((v,p)=>v===p).length;
    if(ok===n){R.className='res ok';R.innerHTML='Perfect order. Flag: <b>'+esc(dec(c.id))+'</b>'}
    else{R.className='res bad';R.textContent=ok+' of '+n+' are in the right place. '+(w.retry||'Keep shuffling.')}
  };
};

/* logs: searchable log viewer with a live match counter (wd:{lines:[...], hint:'…'}) */
WIDGETS.logs=(el,c)=>{
  const w=c.wd;
  el.innerHTML=`<div class="sbar"><input type="text" id="lgQ" placeholder="${esc(w.placeholder||'Filter lines… (e.g. FAILED)')}" autocomplete="off" spellcheck="false"><label style="color:var(--dim);font-size:13px"><input type="checkbox" id="lgRe"> regex</label><label style="color:var(--dim);font-size:13px"><input type="checkbox" id="lgI" checked> ignore case</label><span id="lgN"></span></div><div class="logv" id="lgV"></div>`;
  const draw=()=>{
    const q=$('#lgQ',el).value,re=$('#lgRe',el).checked,ic=$('#lgI',el).checked;let test=()=>true,rx=null;
    if(q){try{rx=new RegExp(re?q:q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),ic?'gi':'g');test=l=>{rx.lastIndex=0;return rx.test(l)}}catch(e){$('#lgN',el).textContent='bad regex';return}}
    const rows=w.lines.filter(test);
    $('#lgV',el).innerHTML=rows.map(l=>{const s=esc(l);if(!rx)return s;rx.lastIndex=0;return esc(l).replace(new RegExp(re?q:q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),ic?'gi':'g'),m=>'<mark>'+m+'</mark>')}).join('\n')||'(no matching lines)';
    $('#lgN',el).textContent=rows.length+' / '+w.lines.length+' lines';
  };
  ['input','change'].forEach(ev=>el.addEventListener(ev,draw));draw();
};

/* ---- carried over from the original CyberQuest ---- */

/* SQL injection login simulator (fake app, fake DB) */
WIDGETS.sqli=(el,c)=>{
  const w=c.wd||{};
  el.innerHTML=`<div class="loginbox"><b>${w.title||'🏦 NovaBank Staff Portal'}</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated)</span>
    <label>Username</label><input type="text" id="sqU" autocomplete="off" spellcheck="false">
    <label>Password</label><input type="text" id="sqP" autocomplete="off" spellcheck="false">
    <p style="margin:12px 0 0"><button class="btn sm" id="sqGo">Log in</button></p>
    <div class="q" id="sqQ"></div><div class="res" id="sqR"></div></div>`;
  const run=()=>{
    const u=$('#sqU').value,p=$('#sqP').value;
    $('#sqQ').textContent="SELECT * FROM users WHERE username='"+u+"' AND password='"+p+"';";
    const R=$('#sqR');
    const taut=/'\s*or\s+(['"]?)(\w+)\1\s*=\s*(['"]?)\2\3?/i;
    const bypass=/^\s*admin\s*'\s*(--|#|\/\*)/i.test(u)||taut.test(u)||taut.test(p);
    if(bypass){R.className='res ok';R.innerHTML='✔ Query returned a row. Logged in as <b>admin</b>.<br>Secret: <b>'+esc(dec(c.id))+'</b><br><span style="color:var(--dim)">The fix: parameterised queries, never string concatenation.</span>'}
    else if((u+p).includes("'")){R.className='res bad';R.textContent="ERROR 1064 (42000): You have an error in your SQL syntax; check the manual near '"+(u+p).split("'").slice(1).join("'")+"' – the database just told you it's injectable!"}
    else{R.className='res bad';R.textContent='✘ Invalid username or password.'}
  };
  $('#sqGo').onclick=run;
  ['sqU','sqP'].forEach(i=>$('#'+i).addEventListener('keydown',e=>{if(e.key==='Enter')run()}));
};

/* Cookie tampering */
WIDGETS.cookie=(el,c)=>{
  const orig=btoa(JSON.stringify({user:'guest',role:'user'}));
  el.innerHTML=`<div class="loginbox"><b>🖥 NovaCorp Intranet</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated)</span>
    <p style="margin:8px 0;color:var(--dim);font-size:14px">You're logged in as <b>guest</b>. The browser sends this on every request:</p>
    <label>Cookie</label><textarea id="ckV" rows="2" spellcheck="false">session=${orig}</textarea>
    <p style="margin:12px 0 0"><button class="btn sm" id="ckGo">GET /admin</button> <button class="btn sec sm" id="ckReset">Reset</button></p>
    <div class="res" id="ckR"></div></div>`;
  $('#ckReset').onclick=()=>{$('#ckV').value='session='+orig;$('#ckR').textContent=''};
  $('#ckGo').onclick=()=>{
    const R=$('#ckR');
    try{
      const m=$('#ckV').value.trim().match(/^session=(.+)$/);if(!m)throw 0;
      const o=JSON.parse(atob(m[1].trim()));
      if(o&&o.role==='admin'){R.className='res ok';R.innerHTML='HTTP/1.1 200 OK<br>Welcome to the admin panel, '+esc(o.user||'?')+'.<br>Flag: <b>'+esc(dec(c.id))+'</b>'}
      else{R.className='res bad';R.textContent='HTTP/1.1 403 Forbidden – hello '+(o.user||'?')+', your role is "'+(o.role||'?')+'". Admins only.'}
    }catch(e){R.className='res bad';R.textContent='HTTP/1.1 400 Bad Request – session cookie could not be parsed.'}
  };
};

/* Phish or legit?  wd:{mails:[{from,s,b,a:'P'|'L'}]} */
WIDGETS.phish=(el,c)=>{
  const mails=c.wd.mails,ans={},noun=c.wd.noun||'email';
  el.innerHTML='<p class="lead" style="margin-top:14px">Classify each '+noun+', then submit your verdicts.</p>'+mails.map((m,i)=>`<div class="email"><div class="from">${c.wd.noun?'':'From: '}${m.from}</div><div class="subj">${m.s}</div><div>${m.b}</div><div class="btns"><button data-i="${i}" data-v="P">🎣 Phishing</button><button data-i="${i}" data-v="L">✅ Legit</button></div></div>`).join('')+'<p><button class="btn sm" id="phGo">Submit verdicts</button></p><div class="res" id="phR"></div>';
  el.onclick=e=>{
    const b=e.target.closest('.btns button');if(!b)return;
    ans[b.dataset.i]=b.dataset.v;
    $$('button',b.parentNode).forEach(x=>x.className=x.dataset.v===ans[b.dataset.i]?(x.dataset.v==='P'?'sel-p':'sel-l'):'');
  };
  $('#phGo',el).onclick=()=>{
    const R=$('#phR',el);
    if(Object.keys(ans).length<mails.length){R.className='res bad';R.textContent='Answer all '+mails.length+' first.';return}
    const ok=mails.filter((m,i)=>ans[i]===m.a).length;
    if(ok===mails.length){R.className='res ok';R.innerHTML=ok+'/'+ok+' – sharp eyes! Flag: <b>'+esc(dec(c.id))+'</b>'}
    else{R.className='res bad';R.textContent=ok+'/'+mails.length+' correct. Re-read the sender addresses, the urgency and what each email wants you to do.'}
  };
};

/* branch: a choose-your-response scenario. Reaching an ending with end:'win' reveals the flag.
   wd:{start:'a', nodes:{ a:{text:'…', choices:[{t:'…', to:'b'}]}, b:{end:'win'|'lose', text:'…'} }} */
WIDGETS.branch=(el,c)=>{
  const w=c.wd;let cur=w.start;
  const draw=()=>{
    const n=w.nodes[cur];
    if(n.end){
      const win=n.end==='win';
      el.innerHTML=`<div class="loginbox"><p>${n.text}</p><p class="res ${win?'ok':'bad'}">${win?'✔ Well handled. Flag: <b>'+esc(dec(c.id))+'</b>':'✘ The attack succeeded.'}</p><p><button class="btn sec sm" id="brR">↺ Start again</button></p></div>`;
      $('#brR',el).onclick=()=>{cur=w.start;draw()};return;
    }
    el.innerHTML=`<div class="loginbox"><p>${n.text}</p>`+n.choices.map((ch,i)=>`<p><button class="btn sec sm" data-i="${i}" style="text-align:left;white-space:normal;height:auto">${ch.t}</button></p>`).join('')+'</div>';
    $$('button[data-i]',el).forEach(b=>b.onclick=()=>{cur=n.choices[+b.dataset.i].to;draw()});
  };
  draw();
};
