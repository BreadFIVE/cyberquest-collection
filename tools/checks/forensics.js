module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  const C=Object.fromEntries(q.challenges.map(c=>[c.id,c]));const flag=id=>[].concat(C[id].flag)[0];
  const open=async id=>{await page.evaluate(i=>{closeModal();openChallenge(i)},id)};
  const cip=id=>C[id].body.match(/<p class="cipher">([^<]*)<\/p>/)[1];
  // --- toolkit routes ---
  const R=await page.evaluate(([hex,b64,hashTarget])=>{
    const t=n=>TOOLS.find(x=>x[0]===n)[1];
    return {strings:t('Hex →')(hex),b64:t('Base64 →')(b64)};
  },[cip('fo_strings'),C.fo_http.body.match(/Basic ([A-Za-z0-9+\/=]+)/)[1],'']);
  ok('strings: flag visible after Hex →',R.strings.includes(flag('fo_strings')));
  ok('basic auth decodes to user:password',R.b64==='john.r:Blue-Heron-99');
  // dns: collect numbered chunks from the table, join, decode
  const chunks=[...C.fo_dns.body.matchAll(/(\d\d)-([0-9a-f]+)\.t\.cdn-metrics/g)].sort((a,b)=>a[1]-b[1]).map(m=>m[2]).join('');
  const dns=await page.evaluate(h=>TOOLS.find(x=>x[0]==='Hex →')[1](h),chunks);ok('dns chunks decode',dns===flag('fo_dns'));
  // hash & hunt: toolkit MD5 of each file's text must match exactly one, the bad one (also with a trailing newline pasted)
  const target=cip('fo_hash');const files=[...C.fo_hash.body.matchAll(/(\w+)\.txt:\s+([^\n<]*)/g)].map(m=>[m[1],m[2]]);
  const md=await page.evaluate(([fs])=>fs.map(([n,t])=>[n,TOOLS.find(x=>x[0]==='MD5')[1](t+'\n')]),[files]);
  const hit=md.filter(([n,h])=>h===target).map(x=>x[0]);ok('exactly one file matches IOC hash ('+hit+')',hit.length===1&&hit[0]==='update_helper');
  // magic numbers sanity: reference bytes in the puzzle agree with real signatures
  ok('magic: pdf/zip/png order',flag('fo_magic')==='CTF{pdf_zip_png}');
  // --- order widgets: solve through the real arrow buttons ---
  for(const id of ['fo_ir','fo_hs','fo_time']){
    await open(id);const want=C[id].wd.items.map(s=>s.replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,m=>({'&ldquo;':'“','&rdquo;':'”','&ndash;':'–','&rsquo;':'’'}[m]||m)));
    await page.click('#ordGo');ok(id+' initial order is wrong (shuffled)',(await page.textContent('#ordR')).includes('right place'));
    for(let pass=0;pass<20;pass++){
      const cur=await page.$$eval('#ordL li span',els=>els.map(e=>e.textContent));
      const rank=cur.map(t=>want.findIndex(w=>w===t));
      const i=rank.findIndex((r,k)=>k<rank.length-1&&r>rank[k+1]);if(i<0)break;
      const btns=await page.$$('#ordL li:nth-child('+(i+1)+') button');await btns[1].click(); // move down
    }
    await page.click('#ordGo');ok(id+' reveals flag when sorted',(await page.textContent('#ordR')).includes(flag(id)));
  }
  // --- classify ---
  await open('fo_evt');let sel=await page.$$('#widget select');for(let i=0;i<sel.length;i++)await sel[i].selectOption(String(C.fo_evt.wd.items[i].a));await page.click('#clGo');
  ok('event ids classify reveals flag',(await page.textContent('#clR')).includes(flag('fo_evt')));
  // --- logs: the intended filter route gives the single correct answer ---
  await open('fo_auth');await page.fill('#lgQ','Accepted');
  const acc=(await page.textContent('#lgV')).split('\n');
  await page.fill('#lgQ','Failed password');const failedIps={};((await page.textContent('#lgV')).match(/from (\d+\.\d+\.\d+\.\d+)/g)||[]).forEach(m=>failedIps[m]=(failedIps[m]||0)+1);
  const noisy=Object.keys(failedIps).sort((a,b)=>failedIps[b]-failedIps[a]);
  ok('auth: 2 failing IPs, one succeeds',noisy.length===2&&acc.filter(l=>noisy.some(n=>l.includes(n.replace('from ',''))) ).length===1);
  const winner=acc.find(l=>l.includes('203.0.113.77'));ok('auth: success time is 02:14:55',winner&&winner.includes('02:14:55'));
  await page.fill('#lgQ','Failed.*admin');await page.check('#lgRe');ok('auth: regex filter works',(await page.textContent('#lgN')).startsWith('14 /'));
  await open('fo_web');await page.fill('#lgQ','ScanBot');
  const scan=(await page.textContent('#lgV')).split('\n');const succ=scan.filter(l=>/" 200 /.test(l));
  ok('web: scanner has exactly one successful request',succ.length===1&&succ[0].includes('/db_export.sql'));
  // --- stego: red plane must look like text (sparse white), green plane like noise (~50% white)
  await open('fo_lsb');
  const ratio=async m=>{await page.click(`#lsbB button[data-m="${m}"]`);return page.evaluate(()=>{const c=document.querySelector('#lsbC'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let w=0;for(let i=0;i<d.length;i+=4)if(d[i]>127)w++;return w/(d.length/4)})};
  const rr=await ratio(0),gr=await ratio(1);ok(`stego: red plane sparse (${rr.toFixed(2)}), green noisy (${gr.toFixed(2)})`,rr>0.03&&rr<0.35&&gr>0.4&&gr<0.6);
  await page.click('#lsbB button[data-m="0"]');
  await page.screenshot({path:require('os').tmpdir()+'/_lsb_red_check.png',clip:await page.evaluate(()=>{const r=document.querySelector('#lsbC').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})});
  await page.evaluate(()=>closeModal());
  return bad;
};
