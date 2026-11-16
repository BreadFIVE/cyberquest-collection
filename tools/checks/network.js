const S=require('./_shared');
module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  const C=Object.fromEntries(q.challenges.map(c=>[c.id,c]));const flag=id=>[].concat(C[id].flag)[0];
  for(const c of q.challenges.filter(c=>c.widget==='classify')){const e=await S.classify(page,c);ok(c.id+' classify'+(e?' → '+e:''),!e)}
  for(const c of q.challenges.filter(c=>c.widget==='order')){const e=await S.order(page,c);ok(c.id+' order'+(e?' → '+e:''),!e)}
  /* the puzzles must be solvable: every classify uses each option at least once (otherwise it is guessable) and the keyed answers are recomputed independently */
  for(const c of q.challenges.filter(c=>c.widget==='classify')){const used=new Set(c.wd.items.map(i=>i.a));ok(c.id+' uses every option',used.size===c.wd.options.length)}
  const ip2n=s=>s.split('.').reduce((a,x)=>a*256+ +x,0);
  ok('binary flag is the decimal of the shown octets',flag('nw_binary')==='CTF{'+C.nw_binary.body.match(/[01]{8}(\.[01]{8}){3}/)[0].split('.').map(b=>parseInt(b,2)).join('.')+'}');
  const priv=ip=>{const n=ip2n(ip);return (n>=ip2n('10.0.0.0')&&n<=ip2n('10.255.255.255'))||(n>=ip2n('172.16.0.0')&&n<=ip2n('172.31.255.255'))||(n>=ip2n('192.168.0.0')&&n<=ip2n('192.168.255.255'))};
  for(const it of C.nw_private.wd.items){const ip=it.t.match(/\d+\.\d+\.\d+\.\d+/)[0];ok('private classification of '+ip,(priv(ip)?0:1)===it.a)}
  await page.evaluate(()=>closeModal());
  await page.click('#tabs button[data-tab=lab]');
  const run=async line=>{const before=(await page.textContent('#tout')).length;await page.fill('#tinp',line);await page.press('#tinp','Enter');return (await page.textContent('#tout')).slice(before)};
  const has=(o,s)=>o.includes(s);let o;
  o=await run('cat network_notes.txt');ok('notes readable',has(o,'192.168.1.50'));
  o=await run('ip a');const mine=(o.match(/eth0[\s\S]*?inet (\d+\.\d+\.\d+\.\d+)\//)||[])[1];ok('ip a → address matches flag','CTF{'+mine+'}'===flag('nw_ip'));
  o=await run('ifconfig');ok('ifconfig also works',has(o,mine));
  // ping every device in the notes: exactly one fails
  const notes=await run('cat network_notes.txt');const devs=[...new Set((notes.match(/\d+\.\d+\.\d+\.\d+/g)||[]).filter(x=>x!=='192.168.1.0'))];
  const down=[];for(const d of devs){const r=await run('ping '+d);if(/100% packet loss/.test(r))down.push(d)}
  ok('exactly one device is down and it is the flag ('+down+')',down.length===1&&'CTF{'+down[0]+'}'===flag('nw_ping'));
  o=await run('ping -c 4 8.8.8.8');ok('ping with -c still resolves the target',has(o,'0% packet loss'));
  o=await run('ping 10.9.9.9');ok('unknown target gives an error',has(o,'unreachable'));
  o=await run('nslookup intranet.halcyon.test');const addr=[...o.matchAll(/Address:\s+(\d+\.\d+\.\d+\.\d+)(?!#)/g)].map(m=>m[1]);ok('nslookup answer is the flag','CTF{'+addr[addr.length-1]+'}'===flag('nw_dns'));
  o=await run('nslookup nothing.example');ok('NXDOMAIN for unknown name',has(o,'NXDOMAIN'));
  // traceroute: first hop whose time is >10x the previous
  o=await run('traceroute 203.0.113.80');const hops=[...o.matchAll(/^\s*(\d+)\s+.*?(\d+\.\d+) ms/gm)].map(m=>[+m[1],+m[2]]);
  let jump=null;for(let i=1;i<hops.length;i++)if(hops[i][1]>hops[i-1][1]*10){jump=hops[i][0];break}
  ok('traceroute jump hop → flag',jump!==null&&'CTF{'+jump+'}'===flag('nw_trace'));
  // arp: another IP sharing the gateway's MAC
  o=await run('arp -a');const rows=[...o.matchAll(/\((\d+\.\d+\.\d+\.\d+)\) at ([0-9a-f:]{17})/g)].map(m=>[m[1],m[2]]);
  const gw=rows.find(r=>r[0]==='192.168.1.1')[1];const dup=rows.filter(r=>r[1]===gw&&r[0]!=='192.168.1.1').map(r=>r[0]);
  ok('arp: exactly one imposter → flag',dup.length===1&&'CTF{'+dup[0]+'}'===flag('nw_arp'));
  o=await run('netstat -an');const listen=[...o.matchAll(/:(\d+)\s+0\.0\.0\.0:\*\s+LISTEN/g)].map(m=>+m[1]).filter(p=>![22,80,443].includes(p));
  ok('netstat: exactly one odd listener → flag',listen.length===1&&'CTF{'+listen[0]+'}'===flag('nw_netstat'));
  o=await run('rm network_notes.txt');ok('the notes file is protected from rm',has(o,'Permission denied'));
  o=await run('nmap 192.168.1.1');ok('no scanning tools here',has(o,'command not found'));
  return bad;
};
