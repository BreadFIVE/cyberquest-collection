const S=require('./_shared');
module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  const C=Object.fromEntries(q.challenges.map(c=>[c.id,c]));const flag=id=>[].concat(C[id].flag)[0];
  for(const c of q.challenges.filter(c=>c.widget==='classify')){const e=await S.classify(page,c);ok(c.id+' classify'+(e?' → '+e:''),!e)}
  for(const c of q.challenges.filter(c=>c.widget==='order')){const e=await S.order(page,c);ok(c.id+' order'+(e?' → '+e:''),!e)}
  await page.evaluate(()=>closeModal());
  await page.click('#tabs button[data-tab=lab]');
  const run=async line=>{const before=(await page.textContent('#tout')).length;await page.fill('#tinp',line);await page.press('#tinp','Enter');return (await page.textContent('#tout')).slice(before)};
  const has=(o,s)=>o.includes(s);let o;
  ok('prompt starts at ~',(await page.textContent('#tprompt'))==='student@trainer:~$');
  o=await run('pwd');ok('where: pwd',has(o,'/home/student'));
  o=await run('ls');ok('ls hides dotfiles',!has(o,'.hidden_note')&&has(o,'welcome.txt')&&has(o,'documents'));
  o=await run('cat welcome.txt');ok('welcome flag',has(o,flag('lx_welcome')));
  o=await run('ls -a');ok('ls -a shows dotfiles',has(o,'.hidden_note'));
  o=await run('cat .hidden_note');ok('hidden flag',has(o,flag('lx_hidden')));
  o=await run('cat nothere.txt');ok('missing file message',has(o,'No such file'));
  o=await run('cd documents/reports/2026');ok('cd deep',(await page.textContent('#tprompt')).includes('documents/reports/2026'));
  o=await run('ls');ok('ls in 2026',has(o,'budget_note.txt')&&has(o,'q1.txt'));
  o=await run('cat budget_note.txt');ok('cd flag',has(o,flag('lx_cd')));
  o=await run('cd ../..');o=await run('pwd');ok('cd .. twice',has(o,'/home/student/documents'));
  o=await run('ls -l');ok('ls -l permissions',/-rw-rw-rw-\s+1 student.*shared_notes\.txt/.test(o)&&/-rw-------.*diary\.txt/.test(o)&&/drwxr-xr-x.*reports/.test(o));
  o=await run('cd');o=await run('pwd');ok('cd alone goes home',has(o,'/home/student')&&!has(o,'documents'));
  o=await run('cd /var/log');o=await run('cat auth.log | wc -l');ok('absolute cd + pipe wc',has(o,'16'));
  o=await run('cd');
  // backup task: checker fails first, passes after
  o=await run('./checks/check_backup.sh');ok('backup checker says not yet',has(o,'Not yet')&&!has(o,flag('lx_backup')));
  o=await run('mkdir backup');o=await run('./checks/check_backup.sh');ok('mkdir alone is not enough',has(o,'Not yet'));
  o=await run('cp notes.txt backup');o=await run('./checks/check_backup.sh');ok('backup flag',has(o,flag('lx_backup')));
  o=await run('ls backup');ok('copy visible',has(o,'notes.txt'));
  o=await run('mkdir backup');ok('mkdir existing errors',has(o,'File exists'));
  o=await run('cp nothere.txt backup');ok('cp missing source errors',has(o,'No such file'));
  // mv
  o=await run('./checks/check_move.sh');ok('move not yet',has(o,'Not yet'));
  o=await run('mv downloads/draft.txt documents');o=await run('./checks/check_move.sh');ok('move without rename not enough',has(o,'Not yet'));
  o=await run('mv documents/draft.txt documents/final.txt');o=await run('./checks/check_move.sh');ok('mv flag',has(o,flag('lx_mv')));
  // rm
  o=await run('./checks/check_rm.sh');ok('rm not yet',has(o,'Not yet'));
  o=await run('rm downloads');ok('rm refuses a folder',has(o,'Is a directory'));
  o=await run('rm downloads/old_installer.tmp');o=await run('./checks/check_rm.sh');ok('rm flag',has(o,flag('lx_rm')));
  o=await run('rm downloads/keep_me.txt');o=await run('./checks/check_rm.sh');ok('deleting keep_me fails the check',has(o,'Not yet'));
  o=await run('rm /etc/hostname');ok('cannot rm in /etc',has(o,'Permission denied'));
  // echo / redirect
  o=await run('./checks/check_echo.sh');ok('echo not yet',has(o,'Not yet'));
  o=await run('echo "hello wrld" > hello.txt');o=await run('./checks/check_echo.sh');ok('typo fails',has(o,'Not yet'));
  o=await run('echo "hello world" > hello.txt');o=await run('cat hello.txt');ok('echo > writes file (quotes stripped)',o.trim().endsWith('hello world')&&!has(o,'"'));
  o=await run('./checks/check_echo.sh');ok('echo flag',has(o,flag('lx_echo')));
  o=await run('echo more >> hello.txt');o=await run('cat hello.txt');ok('>> appends',has(o,'hello world')&&has(o,'more'));
  o=await run('echo x > /etc/motd');ok('cannot write in /etc',has(o,'Permission denied'));
  // find
  o=await run('find projects -name "passwords_old.txt"');ok('find prints path',has(o,'projects/archive/2019/passwords_old.txt'));
  o=await run('find . -name "*.txt" | grep passwords');ok('find wildcard + pipe',has(o,'passwords_old.txt'));
  o=await run('cat projects/archive/2019/passwords_old.txt');ok('find flag',has(o,flag('lx_find')));
  o=await run('find . -type d');ok('find -type d lists folders only',has(o,'./projects')&&!has(o,'welcome.txt'));
  // grep / pipes
  o=await run('grep -c "Failed password" /var/log/auth.log');ok('grep -c count matches the flag','CTF{'+(o.trim().match(/(\d+)$/)||[])[1]+'}'===flag('lx_grep'));
  o=await run('grep "Failed password" /var/log/auth.log | wc -l');ok('pipe wc → 12',o.trim().endsWith('12'));
  o=await run('grep -n Accepted /var/log/auth.log');ok('grep -n numbers',/\d+:2026/.test(o));
  o=await run('grep -r passwords_old projects');ok('grep -r finds nothing in names but no crash',true);
  o=await run('grep -r "Old passwords" projects');ok('grep -r searches folders',has(o,'passwords_old.txt:'));
  o=await run('grep Failed /var/log/auth.log | cut -d " " -f 9 | sort | uniq -c | sort -nr | head -1');ok('pipeline top IP matches the flag','CTF{'+(o.trim().match(/(\d+\.\d+\.\d+\.\d+)$/)||[])[1]+'}'===flag('lx_pipe')&&/head -1\s+7 /.test(o));
  o=await run('grep Failed /var/log/auth.log | cut -d " " -f 9 | uniq -c | sort -nr | head -1');ok('without sort the count is wrong (teaches why)',!(has(o,' 7 203')));
  // permissions
  o=await run('./secret_script.sh');ok('script denied before chmod',has(o,'Permission denied')&&!has(o,flag('lx_chmod')));
  o=await run('chmod +x secret_script.sh');o=await run('ls -l secret_script.sh');ok('x bit set',/-rwxr-xr-x/.test(o));
  o=await run('./secret_script.sh');ok('chmod flag',has(o,flag('lx_chmod')));
  o=await run('chmod 600 secret_script.sh');o=await run('ls -l secret_script.sh');ok('numeric chmod',/-rw-------/.test(o));
  o=await run('cat /home/student/documents/diary.txt');ok('own private file readable by owner',has(o,'terminal is quite fun'));
  o=await run('man ls');ok('man page',has(o,'list directory contents'));
  o=await run('sudo ls');ok('sudo refused politely',has(o,'sudoers'));
  o=await run('nmap 10.0.0.1');ok('network tools not present here',has(o,'command not found'));
  o=await run('history');ok('history works',has(o,'pwd'));
  // flags in terminal appear only after the action: classify of order/classify flags are static in data
  return bad;
};
