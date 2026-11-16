const S=require('./_shared');
module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  const C=Object.fromEntries(q.challenges.map(c=>[c.id,c]));const flag=id=>[].concat(C[id].flag)[0];
  const txt=sel=>page.textContent(sel);
  // generic widgets
  for(const c of q.challenges.filter(c=>c.widget==='classify')){const e=await S.classify(page,c);ok(c.id+' classify'+(e?' → '+e:''),!e)}
  // shop: hidden field edited the way DevTools would
  await S.open(page,'wb_shop');
  await page.click('#shBuy');ok('shop: unchanged price gives no flag',!(await txt('#shR')).includes('Flag:'));
  await page.evaluate(()=>{document.querySelector('#shPrice').value='abc'});await page.click('#shBuy');ok('shop: junk price → 400',(await txt('#shR')).includes('400'));
  await page.evaluate(()=>{document.querySelector('#shPrice').value='99.99'});await page.click('#shBuy');ok('shop: higher price gives no flag',!(await txt('#shR')).includes('Flag:'));
  await page.evaluate(()=>{document.querySelector('#shPrice').value='1.00'});await page.click('#shBuy');ok('shop: cheaper price reveals flag',(await txt('#shR')).includes(flag('wb_shop')));
  // cookie: decode → edit → re-encode, using the toolkit functions the player would use
  await S.open(page,'wb_cookie');
  const cur=(await page.inputValue('#ckV')).replace('session=','');
  const forged=await page.evaluate(v=>{const t=n=>TOOLS.find(x=>x[0]===n)[1];const j=t('Base64 →')(v);return t('→ Base64')(j.replace('"user"','"user"').replace('"role":"user"','"role":"admin"'))},cur);
  await page.fill('#ckV','session='+forged);await page.click('#ckGo');ok('cookie: forged admin cookie reveals flag',(await txt('#ckR')).includes(flag('wb_cookie')));
  await page.fill('#ckV','session='+cur);await page.click('#ckGo');ok('cookie: original is 403',(await txt('#ckR')).includes('403'));
  await page.fill('#ckV','garbage');await page.click('#ckGo');ok('cookie: garbage is 400',(await txt('#ckR')).includes('400'));
  // sqli login
  await S.open(page,'wb_sqli');await page.fill('#sqU','alice');await page.fill('#sqP','pw');await page.click('#sqGo');ok('sqli: normal login fails',(await txt('#sqR')).includes('Invalid'));
  await page.fill('#sqU',"admin' -- ");await page.click('#sqGo');ok("sqli: admin' -- works",(await txt('#sqR')).includes(flag('wb_sqli')));
  await page.fill('#sqU','x');await page.fill('#sqP',"' OR '1'='1");await page.click('#sqGo');ok('sqli: tautology works',(await txt('#sqR')).includes(flag('wb_sqli')));
  await page.fill('#sqU',"it's");await page.fill('#sqP','p');await page.click('#sqGo');ok('sqli: stray apostrophe shows SQL error',(await txt('#sqR')).includes('SQL syntax'));
  // union search: each stage behaves as the challenge text promises
  await S.open(page,'wb_union');const search=async v=>{await page.fill('#ssQ',v);await page.click('#ssGo');return txt('#ssR')};
  let r=await search('mug');ok('search: plain term finds only the mug',r.includes('Halcyon Mug')&&!r.includes('STAFF ONLY'));
  r=await search("' OR 1=1 --");ok('search: OR 1=1 exposes hidden product but not the flag',r.includes('STAFF ONLY')&&!r.includes(flag('wb_union')));
  r=await search("' UNION SELECT username, password FROM users --");ok('search: UNION reveals users table and flag',r.includes('kate')&&r.includes(flag('wb_union')));
  r=await search("' union select username,password from users#");ok('search: union is case/space tolerant',r.includes(flag('wb_union')));
  r=await search("' UNION SELECT name FROM users --");ok('search: wrong column count is an error, not a free flag',!r.includes(flag('wb_union')));
  // xss: only ever detects; nothing may be inserted as live HTML
  await S.open(page,'wb_xss');const xss=async(v,fix)=>{await page.fill('#xsQ',v);if(fix)await page.check('#xsFix');else await page.uncheck('#xsFix');await page.click('#xsGo');return txt('#xsR')};
  r=await xss('hello');ok('xss: plain text, no flag',!r.includes(flag('wb_xss')));
  r=await xss('<script>alert(1)</script>');ok('xss: script tag detected',r.includes(flag('wb_xss')));
  r=await xss('<img src=x onerror=alert(1)>');ok('xss: img onerror detected',r.includes(flag('wb_xss')));
  r=await xss('<script>alert(1)</script>',true);ok('xss: fix ticked → no flag, explains encoding',!r.includes(flag('wb_xss'))&&r.includes('encoding'));
  const live=await page.evaluate(()=>({scripts:document.querySelectorAll('#widget script').length,imgs:document.querySelectorAll('#widget img').length,html:document.querySelector('#xsH').innerHTML.includes('<script')}));
  ok('xss: user input is never inserted as live HTML',live.scripts===0&&live.imgs===0&&!live.html);
  // idor
  await S.open(page,'wb_idor');const inv=async id=>{await page.fill('#idId',String(id));await page.click('#idGo');return txt('#idR')};
  r=await inv(1042);ok('idor: own invoice has no flag',r.includes('1042')&&!r.includes(flag('wb_idor')));
  r=await inv(1030);ok('idor: neighbour invoice shown as someone else\'s',r.includes('somebody else')&&!r.includes(flag('wb_idor')));
  r=await inv(1037);ok('idor: invoice 1037 reveals flag',r.includes(flag('wb_idor')));
  r=await inv(9999);ok('idor: unknown id is 404',r.includes('404'));
  r=await inv('abc');ok('idor: junk id is 404',r.includes('404'));
  await page.evaluate(()=>closeModal());
  return bad;
};
