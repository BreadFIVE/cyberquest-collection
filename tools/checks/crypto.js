/* Follows the intended solving route for each puzzle using the page's own toolkit code. */
module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  const C=Object.fromEntries(q.challenges.map(c=>[c.id,c]));
  const cip=id=>{const m=C[id].body.match(/<p class="cipher">([^<]*)<\/p>/);return m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')};
  const flag=id=>[].concat(C[id].flag)[0];
  const R=await page.evaluate(([c])=>{
    const o={};
    o.morse=TOOLS.find(t=>t[0]==='Morse →')[1](c.morse);
    o.caesar=caesar(c.caesar,15);
    o.atbash=atbash(c.atbash);
    o.vig=vig(c.vig,'turing',-1);
    o.rail=railDec(c.rail,3);
    o.freq=freqTable(c.freq).split('\n')[0];
    o.b64=TOOLS.find(t=>t[0]==='Base64 →')[1](c.b64);
    o.bin=TOOLS.find(t=>t[0]==='Binary →')[1](c.bin);
    const t=n=>TOOLS.find(x=>x[0]===n)[1];
    o.layers=caesar(t('Hex →')(t('Base64 →')(c.layers)),13);
    const bytes=parseHex(c.xor);let xr='';for(let k=0;k<256;k++){const s=String.fromCharCode(...bytes.map(x=>x^k));if(/^[\x20-\x7e\n]+$/.test(s))xr+='key '+k.toString(16).padStart(2,'0')+': '+s+'\n'}o.xor=xr;
    return o},[{morse:cip('cr_morse'),caesar:cip('cr_caesar'),atbash:cip('cr_atbash'),vig:cip('cr_vig'),rail:cip('cr_rail'),freq:cip('cr_freq'),b64:cip('cr_b64'),bin:cip('cr_bin'),layers:cip('cr_layers'),xor:cip('cr_xor')}]);
  ok('morse',R.morse==='DOTS AND DASHES');
  ok('caesar',R.caesar===flag('cr_caesar'));ok('atbash',R.atbash===flag('cr_atbash'));
  ok('vigenere',R.vig===flag('cr_vig'));ok('rail',R.rail===flag('cr_rail'));ok('freq table runs',/^Letters: \d+/.test(R.freq));
  ok('base64',R.b64===flag('cr_b64'));ok('binary',R.bin===flag('cr_bin'));ok('layers',R.layers===flag('cr_layers'));
  ok('xor brute-force lists the flag',R.xor.includes('key 5a: '+flag('cr_xor')));
  // hash cracker through the real UI
  const crack=async(id,alg,salt,pos,words)=>{
    const target=cip(id).split(' ').pop().trim();
    await page.click('#tabs button[data-tab=tools]');
    await page.fill('#tkIn',words);await page.fill('#hTarget',target);await page.selectOption('#hAlg',alg);
    await page.fill('#hSalt',salt);await page.selectOption('#hSaltPos',pos);await page.click('#hGo');
    return page.inputValue('#tkOut');
  };
  const w1=C.cr_crack.body.match(/<pre class="code">([\s\S]*?)<\/pre>/)[1],w2=C.cr_salt.body.match(/<pre class="code">([\s\S]*?)<\/pre>/)[1];
  const o1=await crack('cr_crack','md5','','pre',w1);ok('md5 crack UI',o1==='🎯 MATCH: '+flag('cr_crack').slice(4,-1));
  const o2=await crack('cr_salt','sha256','x9Q2','pre',w2);ok('salted sha256 crack UI',o2==='🎯 MATCH: '+flag('cr_salt').slice(4,-1));
  // RSA + DH using only the toolkit's number helper
  const nums=s=>(cip(s).match(/\d+/g)||[]).map(BigInt);
  const [n,e,c]=nums('cr_rsa').map(String);
  const R2=await page.evaluate(([n,e,cc])=>{const N=BigInt(n),E=BigInt(e),Cc=BigInt(cc);const f=factorise(N);const phi=(f[0]-1n)*(f[1]-1n);const d=modinv(E,phi);return {f:f.map(String),m:String(modpow(Cc,d,N))}},[n,e,c]);
  ok('rsa factorise+inverse+modpow',R2.m===flag('cr_rsa').slice(4,-1)&&R2.f.length===2);
  const [p,g,A,B,a]=nums('cr_dh').map(String);
  const R3=await page.evaluate(([p,B,a])=>String(modpow(BigInt(B),BigInt(a),BigInt(p))),[p,B,a]);
  ok('diffie-hellman',R3===flag('cr_dh').slice(4,-1));
  // classify widget rejects wrong answers, accepts right ones
  await page.click('#tabs button[data-tab=board]');await page.evaluate(()=>openChallenge('cr_class'));
  const sel=await page.$$('#widget select');
  for(const s of sel)await s.selectOption('0');await page.click('#clGo');
  ok('classify rejects wrong',(await page.textContent('#clR')).includes('correct'));
  const ans=C.cr_class.wd.items.map(i=>i.a);const sel2=await page.$$('#widget select');
  for(let i=0;i<sel2.length;i++)await sel2[i].selectOption(String(ans[i]));await page.click('#clGo');
  ok('classify reveals flag',(await page.textContent('#clR')).includes(flag('cr_class')));
  await page.evaluate(()=>closeModal());
  return bad;
};
