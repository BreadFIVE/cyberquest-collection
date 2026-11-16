/* Web-security widgets. Everything here is a pretend site running inside the page.
   User input is ALWAYS escaped before it is displayed: the XSS demo only *detects* an injection, it never runs it. */

/* shop: a hidden form field holds the price. Students change it in DevTools, then press Buy. */
WIDGETS.shop=(el,c)=>{
  const w=c.wd;
  el.innerHTML=`<div class="loginbox"><b>🛒 Halcyon Merch Store</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated)</span>
    <p style="margin:10px 0 4px"><b>${esc(w.item)}</b></p>
    <form id="shF" onsubmit="return false"><input type="hidden" id="shPrice" name="price" value="${w.price}">
    <p style="margin:4px 0">Price: <b>£${w.price.toFixed(2)}</b></p><button class="btn sm" id="shBuy" type="button">Buy now</button></form>
    <div class="res" id="shR"></div></div>`;
  $('#shBuy',el).onclick=()=>{
    const R=$('#shR',el),sent=$('#shPrice',el).value,p=parseFloat(sent);
    if(!isFinite(p)||p<0){R.className='res bad';R.textContent='HTTP 400: price was not a valid number ("'+sent+'").';return}
    if(p<w.price){R.className='res ok';R.innerHTML=`Order placed for <b>£${p.toFixed(2)}</b> (real price £${w.price.toFixed(2)}). The server believed whatever price your browser sent.<br>Flag: <b>${esc(dec(c.id))}</b>`}
    else if(p>w.price){R.className='res bad';R.textContent='Order placed for £'+p.toFixed(2)+'. (You paid more than you needed to. The server still trusted the browser.)'}
    else{R.className='res';R.textContent='Order placed for £'+p.toFixed(2)+'. Thanks for shopping with us!'}
  };
};

/* sqlsearch: a product search built by pasting text into a query.  Shows the query so students can see what they changed. */
WIDGETS.sqlsearch=(el,c)=>{
  const products=[{n:'Halcyon Hoodie',p:'49.99',h:0},{n:'Halcyon Mug',p:'8.50',h:0},{n:'Branded Lanyard',p:'3.00',h:0},{n:'STAFF ONLY: admin console key',p:'(withheld)',h:1}];
  const users=[{u:'admin',p:dec(c.id)},{u:'kate',p:'cat123'},{u:'sam',p:'football9'}];
  el.innerHTML=`<div class="loginbox"><b>🔍 Merch Search</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated)</span>
    <div class="sbar"><input type="text" id="ssQ" placeholder="search products, e.g. mug" autocomplete="off" spellcheck="false"><button class="btn sm" id="ssGo">Search</button></div>
    <div class="q" id="ssQry"></div><div id="ssR"></div></div>`;
  const table=(head,rows)=>`<table class="exif"><tr>${head.map(h=>`<td><b>${h}</b></td>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>`;
  const run=()=>{
    const q=$('#ssQ',el).value;
    $('#ssQry',el).textContent="SELECT name, price FROM products WHERE hidden=0 AND name LIKE '%"+q+"%';";
    const R=$('#ssR',el);
    if(!q.includes("'")){
      const rows=products.filter(x=>!x.h&&x.n.toLowerCase().includes(q.toLowerCase())).map(x=>[x.n,'£'+x.p]);
      R.innerHTML=rows.length?table(['name','price'],rows):'<p class="res bad">No products found.</p>';return;
    }
    if(/'\s*union\s+select\s+username\s*,\s*password\s+from\s+users/i.test(q)){
      R.innerHTML='<p class="res ok">The database returned rows from a different table:</p>'+table(['name','price'],users.map(x=>[x.u,x.p]));return;
    }
    if(/'\s*or\s+(1\s*=\s*1|'1'\s*=\s*'1'|true)/i.test(q)){
      R.innerHTML='<p class="res ok">The condition was always true, so the <i>hidden=0</i> check no longer applied:</p>'+table(['name','price'],products.map(x=>[x.n,x.h?x.p:'£'+x.p]))+'<p class="lead" style="font-size:13px">There is a hidden product, but this page only shows names and prices. Can you make this query read from another table? The table is called <code>users</code> with columns <code>username</code> and <code>password</code>.</p>';return;
    }
    R.innerHTML='<p class="res bad">ERROR 1064 (42000): You have an error in your SQL syntax near &#39;'+esc(q.split("'").slice(1).join("'"))+'&#39;. The database just told you it is injectable.</p>';
  };
  $('#ssGo',el).onclick=run;$('#ssQ',el).addEventListener('keydown',e=>{if(e.key==='Enter')run()});
};

/* xss: a search page that echoes your input. We never insert it as HTML; we show what the page's HTML would contain and detect injection. */
WIDGETS.xss=(el,c)=>{
  el.innerHTML=`<div class="loginbox"><b>📰 Halcyon News: search</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated, safe sandbox)</span>
    <div class="sbar"><input type="text" id="xsQ" placeholder="search the news" autocomplete="off" spellcheck="false"><button class="btn sm" id="xsGo">Search</button></div>
    <label style="display:block;margin:6px 0;color:var(--dim);font-size:13px"><input type="checkbox" id="xsFix"> Apply the fix: <b>encode output</b> before putting it in the page</label>
    <div class="q" id="xsH"></div><div class="res" id="xsR"></div></div>`;
  const run=()=>{
    const q=$('#xsQ',el).value,fix=$('#xsFix',el).checked,R=$('#xsR',el);
    const enc=q.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    $('#xsH',el).textContent='<h2>Results for: '+(fix?enc:q)+'</h2>';
    const inj=!fix&&/<\s*script|<\s*img|<\s*svg|<\s*iframe|\bon\w+\s*=|javascript:/i.test(q);
    if(inj){R.className='res ok';R.innerHTML='⚠ Your text became part of the page&rsquo;s <b>HTML</b>, so a real browser would treat it as code and run it. This sandbox does not run it, but this is a successful injection.<br>Flag: <b>'+esc(dec(c.id))+'</b>'}
    else if(fix&&/[<>]/.test(q)){R.className='res bad';R.textContent='With output encoding, < and > become harmless text (&lt; and &gt;). The browser shows your input instead of running it. That is the fix.'}
    else{R.className='res';R.textContent=q?'No articles matched "'+q+'".':''}
  };
  $('#xsGo',el).onclick=run;$('#xsQ',el).addEventListener('keydown',e=>{if(e.key==='Enter')run()});
};

/* idor: an invoice page that trusts the id in the URL.  wd:{own:1042, flagId:1037, ids:[1030,...]} */
WIDGETS.idor=(el,c)=>{
  const w=c.wd,names=['A. Brown','C. Singh','D. Okoro','E. Walker','F. Hughes','G. Evans','H. Patel','I. Murray','J. Reid','K. Shaw','L. Doyle','M. Khan','N. Price','O. Wood','P. Bell','Q. Lowe'];
  el.innerHTML=`<div class="loginbox"><b>🧾 Halcyon Merch: My Invoice</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated)</span>
    <p style="margin:8px 0;color:var(--dim);font-size:14px">You are logged in as <b>customer #${w.own}</b>.</p>
    <div class="sbar"><span>https://merch.example/invoice?id=</span><input type="text" id="idId" value="${w.own}" style="max-width:110px" autocomplete="off"><button class="btn sm" id="idGo">Load</button></div>
    <div id="idR"></div></div>`;
  const run=()=>{
    const id=parseInt($('#idId',el).value,10),R=$('#idR',el);
    if(!w.ids.includes(id)){R.innerHTML='<p class="res bad">404: no invoice with that id.</p>';return}
    const who=id===w.own?'You':names[(id-w.ids[0])%names.length];
    R.innerHTML=`<div class="mock"><b>Invoice #${id}</b><br>Customer: ${esc(who)}<br>Items: 1 &times; Halcyon Hoodie<br>Total: £49.99${id===w.flagId?'<br><b>Customer note:</b> '+esc(dec(c.id)):''}</div>`+(id!==w.own?'<p class="res bad" style="font-size:13px">This is somebody else&rsquo;s invoice. The server never checked that it belongs to you.</p>':'');
  };
  $('#idGo',el).onclick=run;$('#idId',el).addEventListener('keydown',e=>{if(e.key==='Enter')run()});run();
};
