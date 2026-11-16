const S=require('./_shared');
module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  const C=Object.fromEntries(q.challenges.map(c=>[c.id,c]));const flag=id=>[].concat(C[id].flag)[0];
  for(const c of q.challenges.filter(c=>c.widget==='classify')){const e=await S.classify(page,c);ok(c.id+' classify'+(e?' → '+e:''),!e);ok(c.id+' uses every option',new Set(c.wd.items.map(i=>i.a)).size===c.wd.options.length)}
  for(const c of q.challenges.filter(c=>c.widget==='order')){const e=await S.order(page,c);ok(c.id+' order'+(e?' → '+e:''),!e)}
  for(const c of q.challenges.filter(c=>c.widget==='branch')){const e=await S.branch(page,c);ok(c.id+' branch'+(e?' → '+e:''),!e)}
  /* the log puzzles: recompute each answer from the raw lines, the way an analyst would, and compare with the stored flag */
  const auth=C.bt_auth.wd.lines,web=C.bt_scan.wd.lines;
  const fails={};auth.filter(l=>l.includes('Failed password')).forEach(l=>{const ip=l.match(/from (\S+)/)[1];fails[ip]=(fails[ip]||0)+1});
  const attacker=Object.entries(fails).sort((a,b)=>b[1]-a[1])[0][0];
  const hit=auth.filter(l=>l.includes('Accepted')&&l.includes(attacker));
  ok('exactly one successful attacker login',hit.length===1);
  ok('bt_auth flag = username of that login','CTF{'+hit[0].match(/for (\S+) from/)[1]+'}'===flag('bt_auth'));
  ok('bt_when flag = time of that login','CTF{'+hit[0].split(' ').filter(Boolean)[2]+'}'===flag('bt_when'));
  ok('the attacker is on a non-internal address',!attacker.startsWith('10.'));
  ok('staff logins are all internal',auth.filter(l=>l.includes('Accepted')&&!l.includes(attacker)).every(l=>/from 10\.0\.0\./.test(l)));
  const n404={};web.filter(l=>/" 404 /.test(l)).forEach(l=>{const ip=l.split(' ')[0];n404[ip]=(n404[ip]||0)+1});
  const sorted=Object.entries(n404).sort((a,b)=>b[1]-a[1]);
  ok('bt_scan flag = top 404 source (clear winner)','CTF{'+sorted[0][0]+'}'===flag('bt_scan')&&sorted[0][1]>sorted[1][1]*3);
  const un=[...new Set(web.filter(l=>/UNION%20SELECT/.test(l)).map(l=>l.split(' ')[0]))];
  ok('bt_sqli flag = only UNION source',un.length===1&&'CTF{'+un[0]+'}'===flag('bt_sqli'));
  ok('the SQLi source is not the scanner',un[0]!==sorted[0][0]);
  /* the log viewer itself works: filter, count, regex, bad regex */
  await S.open(page,'bt_auth');
  const total=auth.length;
  ok('viewer starts showing all lines',(await page.textContent('#lgN')).includes(total+' / '+total));
  await page.fill('#lgQ','Failed');const nF=auth.filter(l=>/failed/i.test(l)).length;
  ok('filter counts lines',(await page.textContent('#lgN')).startsWith(nF+' /'));
  await page.fill('#lgQ','Accepted.*'+attacker.split('.')[0]);await page.check('#lgRe');
  ok('regex filter finds the one login',(await page.textContent('#lgN')).startsWith('1 /'));
  await page.fill('#lgQ','(');ok('invalid regex is handled',(await page.textContent('#lgN')).includes('bad regex'));
  await page.evaluate(()=>closeModal());
  return bad;
};
