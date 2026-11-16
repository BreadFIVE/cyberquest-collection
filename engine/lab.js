/* =====================================================================
   PENTEST LAB – a small, scripted, entirely fictional terminal.
   Nothing here touches a network: every command just prints text defined in the quest's `lab` data.
   ===================================================================== */
const LAB=CONFIG.lab;
const T={ctx:null,stack:[],mode:null,pending:null,hist:[],hi:0,cap:null};
const dl=(...a)=>a;

function mkLocal(){
  const L=LAB.local;
  if(L.tree){const home=L.home||'/home/student';
    const fs={};for(const [k,v] of Object.entries(L.tree))fs[k]=Array.isArray(v)?v.slice():(v&&typeof v==='object'?{...v}:v);
    return {kind:'local',user:L.user||'student',name:L.name||'kali',home,cwd:L.start||home,root:false,fs,host:null};}
  const fs={'/home/student':Object.keys(L.files)};
  for(const [n,v] of Object.entries(L.files))fs['/home/student/'+n]=v;
  return {kind:'local',user:'student',name:'kali',home:'/home/student',cwd:'/home/student',root:false,fs,host:null};
}
function mkRemote(ip,user){
  const h=LAB.hosts[ip],u=h.users[user];
  return {kind:'remote',ip,host:h,user,name:h.name,home:u.home,cwd:u.home,root:false,fs:h.fs};
}
const promptStr=()=>{
  if(T.pending)return T.pending.label;
  if(T.mode==='ftp')return 'ftp>';
  const c=T.ctx;return `${c.user}@${c.name}:${c.cwd===c.home?'~':c.cwd}${c.root?'#':'$'}`;
};
function tp(text,cls){
  if(T.cap){T.cap.push(String(text));return}
  const d=document.createElement('div');if(cls)d.className=cls;d.textContent=text;$('#tout').appendChild(d);$('#tout').scrollTop=1e9;
}
function setPrompt(){$('#tprompt').textContent=promptStr();$('#tinp').type=(T.pending&&T.pending.secret)?'password':'text'}

function initLab(){
  if(initLab.done)return;initLab.done=true;
  T.ctx=mkLocal();
  tp('CyberQuest Lab — simulated environment. Nothing here touches a real network.','sys');
  tp(LAB.local.welcome||'Read scope.txt first. Type "help" for commands.\n','dim');setPrompt();
  const inp=$('#tinp');
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      const v=inp.value;inp.value='';
      if(T.pending){tp(T.pending.label+(T.pending.secret?' ':' '+v),'cmd');const p=T.pending;T.pending=null;p.cb(v);setPrompt();return}
      tp(promptStr()+' '+v,'cmd');
      if(v.trim()){T.hist.push(v);T.hi=T.hist.length;try{runLine(v.trim())}catch(err){tp('error: '+err.message,'err')}}
      setPrompt();
    }else if(e.key==='ArrowUp'){if(T.hi>0){T.hi--;inp.value=T.hist[T.hi];e.preventDefault()}}
    else if(e.key==='ArrowDown'){if(T.hi<T.hist.length-1){T.hi++;inp.value=T.hist[T.hi]}else{T.hi=T.hist.length;inp.value=''}e.preventDefault()}
  });
  $('#tout').onclick=()=>inp.focus();
}

/* ---- line handling, with simple pipes into grep/head/tail/wc ---- */
function runLine(line){
  if(T.mode==='ftp')return ftpCmd(line);
  const rd=line.match(/^(.*?)\s*(>>?)\s*([^\s>|]+)\s*$/);
  if(rd&&!/\|/.test(rd[1])&&rd[1]&&T.ctx.kind==='local'&&LAB.local.tree){
    T.cap=[];try{runLine(rd[1])}finally{}
    const text=T.cap.join('\n');T.cap=null;return writeFile(rd[3],text,rd[2]==='>>');
  }
  const parts=line.split('|').map(s=>s.trim());
  if(parts.length===1)return runCmd(parts[0]);
  T.cap=[];try{runCmd(parts[0])}finally{}
  let text=T.cap.join('\n');T.cap=null;
  for(const p of parts.slice(1))text=filterCmd(p,text);
  if(text!=='')tp(text);
}
function filterCmd(p,text){
  const tok=p.split(/\s+/),c=tok[0],lines=text.split('\n');
  if(c==='grep'){
    const flags=tok.filter(t=>t.startsWith('-')),pat=tok.slice(1).filter(t=>!t.startsWith('-')).join(' ').replace(/^["']|["']$/g,'');
    const ic=flags.some(f=>f.includes('i')),cnt=flags.some(f=>f.includes('c')),inv=flags.some(f=>f.includes('v')),num=flags.some(f=>/^-[a-z]*n/.test(f));
    const rx=new RegExp(pat.replace(/[.+?^${}()[\]\\]/g,'\\$&'),ic?'i':'');
    const out=lines.map((l,i)=>[i+1,l]).filter(([i,l])=>rx.test(l)!==inv).map(([i,l])=>num?i+':'+l:l);return cnt?String(out.length):out.join('\n');
  }
  const nArg=()=>{const k=tok.indexOf('-n');if(k>=0&&/^\d+$/.test(tok[k+1]||''))return +tok[k+1];const t=tok.find(t=>/^-\d+$/.test(t));return t?+t.slice(1):10};
  if(c==='head'){return lines.slice(0,nArg()).join('\n')}
  if(c==='tail'){return lines.slice(-nArg()).join('\n')}
  if(c==='cut'){const dm=p.match(/-d\s*(?:'(.*?)'|"(.*?)"|(\S+))/),fm=p.match(/-f\s*(\d+)/);if(!dm||!fm)return 'Usage: cut -d <delimiter> -f <field number>';const d=dm[1]??dm[2]??dm[3],f=+fm[1]-1;return lines.map(l=>l.split(d)[f]??'').join('\n')}
  if(c==='wc'){return tok.includes('-l')?String(lines.filter(Boolean).length):`${lines.length} ${text.split(/\s+/).filter(Boolean).length} ${text.length}`}
  if(c==='sort'){const fl=tok.filter(t=>/^-[a-z]+$/.test(t)).join(''),r=fl.includes('r'),o=lines.slice().sort(fl.includes('n')?(x,y)=>(parseFloat(x)||0)-(parseFloat(y)||0)||(x<y?-1:x>y?1:0):undefined);return (r?o.reverse():o).join('\n')}
  if(c==='uniq'){const o=[];lines.forEach(l=>{if(o.length&&o[o.length-1][0]===l)o[o.length-1][1]++;else o.push([l,1])});return o.map(([l,n])=>tok.includes('-c')?String(n).padStart(4)+' '+l:l).join('\n')}
  return c+': not available in this simulation';
}
function runCmd(line){
  const tok=line.split(/\s+/),cmd=tok[0];
  if(cmd==='clear'){$('#tout').innerHTML='';return}
  if(cmd==='help')return tp(helpText(),'dim');
  if(T.ctx.kind==='local'&&LAB.local.cmds&&dataCmd(line,tok,cmd))return;
  if(T.ctx.kind==='local'&&!LAB.local.plain&&localOnly(line,tok,cmd))return;
  if(T.ctx.kind==='remote'&&remoteOnly(line,tok,cmd))return;
  shared(line,tok,cmd);
}
function helpText(){
  if(T.ctx.kind==='local'&&LAB.local.help)return LAB.local.help;
  return T.ctx.kind==='local'?`Commands on your machine:
  nmap [-sn | -p- | -sV] <ip or range>   find hosts / open ports / versions
  nc <ip> <port>          connect to a port (netcat)
  curl <url>              fetch a web page (add -u user:pass for a login)
  dirb <url>              check for common web paths
  ftp <ip>                file transfer (once connected: ls, get <file>, quit)
  ssh <user>@<ip>         remote login
  ls [-l] / cat / grep / head / cd / pwd   look at files (you can use | pipes)
  clear`:`Commands on the target (simulated shell):
  ls [-l] [dir]   cat <file>   cd <dir>   pwd   whoami   id
  grep <text> <file>   (or: cat <file> | grep <text>)
  sudo -l                 list what you may run with sudo
  sudo <command>          run something as root (if you are allowed)
  exit                    log out`;
}

/* ---- commands that exist on both machines ---- */
const resolvePath=(p,c)=>{
  if(!p||p==='~')return c.home;
  if(p[0]==='~')p=c.home+p.slice(1);
  if(p[0]!=='/')p=c.cwd+'/'+p;
  const parts=[];for(const s of p.split('/')){if(!s||s==='.')continue;if(s==='..')parts.pop();else parts.push(s)}
  return '/'+parts.join('/');
};
const rootOnly=(c,p)=>!c.root&&c.kind==='remote'&&(c.host.rootOnly||[]).some(r=>p===r||p.startsWith(r+'/'));
const entry=(c,p)=>c.fs[p];
const content=e=>typeof e==='function'?e():(e&&typeof e==='object'&&!Array.isArray(e)?e.c:e);
function metaLine(c,dir,name){
  const p=(dir==='/'?'':dir)+'/'+name,e=entry(c,p),isDir=Array.isArray(e);
  const m=(e&&e.m)||(isDir?'drwxr-xr-x':'-rw-r--r--'),o=(e&&e.o)||(c.kind==='local'?'student':c.user);
  const sz=isDir?'4096':String((content(e)||'').length);
  return `${m} 1 ${o.padEnd(8)} ${o.padEnd(8)} ${sz.padStart(5)} Mar  2 11:40 ${name}`;
}
const canRead=(c,e)=>{if(c.root||!e||typeof e!=='object'||Array.isArray(e)||!e.m)return true;const o=e.o||c.user;return o===c.user?e.m[1]==='r':e.m[7]==='r'};
const canWrite=(c,e)=>{if(c.root||!e||typeof e!=='object'||Array.isArray(e)||!e.m)return true;const o=e.o||c.user;return o===c.user?e.m[2]==='w':e.m[8]==='w'};
const canExec=(c,e)=>{if(!e||typeof e!=='object'||Array.isArray(e)||!e.m)return false;const o=e.o||c.user;return o===c.user?e.m[3]==='x':e.m[9]==='x'};
const readOnlyPath=(c,p)=>!c.root&&(rootOnly(c,p)||(c.kind==='local'&&(LAB.local.readonly||[]).some(r=>p===r||p.startsWith(r+'/'))));
const dirOf=p=>p.slice(0,p.lastIndexOf('/'))||'/',baseOf=p=>p.slice(p.lastIndexOf('/')+1);
const setEntry=(c,p,v)=>{const d=dirOf(p),n=baseOf(p);c.fs[p]=v;if(!c.fs[d].includes(n))c.fs[d].push(n)};
const delEntry=(c,p)=>{const d=dirOf(p),n=baseOf(p);delete c.fs[p];const a=c.fs[d];if(a)a.splice(a.indexOf(n),1);for(const k of Object.keys(c.fs))if(k.startsWith(p+'/'))delete c.fs[k]};
function writeFile(file,text,append){
  const c=T.ctx,p=resolvePath(file,c),d=dirOf(p),e=entry(c,p);
  if(!Array.isArray(entry(c,d)))return tp('bash: '+file+': No such file or directory','err');
  if(Array.isArray(e))return tp('bash: '+file+': Is a directory','err');
  if(readOnlyPath(c,p)||!canWrite(c,e))return tp('bash: '+file+': Permission denied','err');
  const old=e===undefined?'':content(e),nt=append&&old?old.replace(/\n$/,'')+'\n'+text:text;
  setEntry(c,p,e&&typeof e==='object'?{...e,c:nt}:nt);
}
const globRx=g=>new RegExp('^'+g.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$');
const modeStr=(n,dir)=>(dir?'d':'-')+[...n].map(d=>'rwx'.split('').map((ch,i)=>(+d&(4>>i))?ch:'-').join('')).join('');
function dataCmd(line,tok,cmd){
  const v=LAB.local.cmds[cmd];if(v===undefined)return false;
  const args=tok.slice(1),full=args.join(' '),nf=args.filter(a=>!a.startsWith('-')),first=v.by&&nf.find(a=>v.by[a]!==undefined);
  let out=typeof v==='string'?v:(v.by&&(v.by[full]!==undefined?v.by[full]:(first!==undefined?v.by[first]:undefined)));
  if(out===undefined&&typeof v==='object')out=v.default;
  tp(out===undefined?'(no output in this simulation)':out);return true;
}
function condOk(c,w){return (w||[]).every(x=>x.exists?entry(c,x.exists)!==undefined:x.missing?entry(c,x.missing)===undefined:x.mode?((entry(c,x.mode[0])||{}).m||'').slice(1)===x.mode[1]:x.has?String(content(entry(c,x.has[0]))||'').includes(x.has[1]):true)}
function execFile(cmd){
  const c=T.ctx,p=resolvePath(cmd,c),e=entry(c,p);
  if(e===undefined||Array.isArray(e))return tp('bash: '+cmd+': No such file or directory','err');
  if(!canExec(c,e))return tp('bash: '+cmd+': Permission denied','err');
  const r=e.run;if(r===undefined)return tp('(it runs, but prints nothing)','dim');
  if(typeof r==='string')return tp(r);
  tp(condOk(c,r.when)?r.yes:r.no);
}
function shared(line,tok,cmd){
  const c=T.ctx,args=tok.slice(1),paths=args.filter(a=>!a.startsWith('-')),flags=args.filter(a=>a.startsWith('-')).join('');
  const last=paths[paths.length-1];
  const text=a=>{const p=resolvePath(a,c),e=entry(c,p);
    if(e===undefined||Array.isArray(e)){tp(cmd+': '+a+': No such file or directory','err');return null}
    if(readOnlyPath(c,p)&&rootOnly(c,p)||!canRead(c,e)){tp(cmd+': '+a+': Permission denied','err');return null}
    return content(e)};
  switch(cmd){
    case 'whoami':return tp(c.root?'root':c.user);
    case 'pwd':return tp(c.cwd);
    case 'echo':return tp(args.join(' ').replace(/^(["'])(.*)\1$/,'$2'));
    case 'id':return tp(c.root?'uid=0(root) gid=0(root) groups=0(root)':`uid=1001(${c.user}) gid=1001(${c.user}) groups=1001(${c.user})`);
    case 'hostname':return tp(c.name);
    case 'date':return tp(LAB.local.date||'Mon Mar  2 11:40:02 UTC 2026');
    case 'uname':return tp(/-a/.test(flags)?`Linux ${c.name} 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux`:'Linux');
    case 'history':return tp(T.hist.map((h,i)=>String(i+1).padStart(4)+'  '+h).join('\n'));
    case 'man':{const m=LAB.local&&LAB.local.man;return tp(m&&m[args[0]]?m[args[0]]:(args[0]?'No manual entry for '+args[0]:'What manual page do you want?'),m&&m[args[0]]?'':'err')}
    case 'cd':{
      const p=resolvePath(paths[0],c);
      if(p==='/'){c.cwd='/';return}
      if(!Array.isArray(entry(c,p)))return tp('bash: cd: '+(paths[0]||'')+': No such file or directory','err');
      if(rootOnly(c,p))return tp('bash: cd: '+p+': Permission denied','err');
      c.cwd=p;return}
    case 'ls':{
      const p=paths[0]?resolvePath(paths[0],c):c.cwd,e=entry(c,p),long=/l/.test(flags.replace(/-/g,'')),all=/a/.test(flags.replace(/-/g,''));
      if(p==='/'&&c.kind==='remote')return tp((c.host.rootDirs||['bin','etc','home','opt','root','var']).join('  '));
      if(e===undefined)return tp('ls: cannot access \''+(paths[0]||'')+'\': No such file or directory','err');
      if(rootOnly(c,p))return tp('ls: cannot open directory \''+p+'\': Permission denied','err');
      if(!Array.isArray(e))return tp(long?metaLine(c,dirOf(p),baseOf(p)):paths[0]);
      const names=(all?['.','..',...e]:e.filter(n=>n[0]!=='.')).filter(n=>n!=='.'&&n!=='..'||all);
      return tp(long?names.map(n=>n==='.'||n==='..'?`drwxr-xr-x 1 ${c.user.padEnd(8)} ${c.user.padEnd(8)}  4096 Mar  2 11:40 ${n}`:metaLine(c,p,n)).join('\n'):names.join('  '))}
    case 'cat':{
      if(!paths.length)return tp('cat: missing file','err');
      for(const a of paths){
        const p=resolvePath(a,c),e=entry(c,p);
        if(e===undefined||Array.isArray(e))tp('cat: '+a+': '+(Array.isArray(e)?'Is a directory':'No such file or directory'),'err');
        else if(rootOnly(c,p)||(e&&e.rootOnly&&!c.root)||!canRead(c,e))tp('cat: '+a+': Permission denied','err');
        else tp(content(e));
      }return}
    case 'head':case 'tail':{
      if(!last)return tp(cmd+': missing file','err');const t=text(last);if(t===null)return;
      return tp(filterCmd(cmd+' '+args.slice(0,args.lastIndexOf(last)).join(' '),t))}
    case 'wc':case 'sort':case 'uniq':case 'cut':{
      if(!last)return tp(cmd+': missing file','err');const t=text(last);if(t===null)return;
      const o=filterCmd(cmd+' '+args.slice(0,args.lastIndexOf(last)).join(' '),t);return tp(cmd==='wc'&&/-l/.test(flags)?o+' '+last:o)}
    case 'grep':{
      const rest=paths;if(rest.length<2)return tp('Usage: grep [-i] [-c] [-n] [-r] <text> <file>   (or: cat <file> | grep <text>)','err');
      const file=rest[rest.length-1],p=resolvePath(file,c),e=entry(c,p),pre=args.slice(0,args.lastIndexOf(file)).join(' ');
      if(e===undefined)return tp('grep: '+file+': No such file or directory','err');
      if(rootOnly(c,p)||!canRead(c,e))return tp('grep: '+file+': Permission denied','err');
      if(Array.isArray(e)){
        if(!/r/i.test(flags.replace(/-/g,'').replace(/[inc]/g,'')))return tp('grep: '+file+': Is a directory','err');
        const out=[];Object.keys(c.fs).filter(k=>k.startsWith((p==='/'?'':p)+'/')&&!Array.isArray(c.fs[k])).sort().forEach(k=>{
          if(rootOnly(c,k)||!canRead(c,c.fs[k]))return;const o=filterCmd('grep '+pre.replace(/(^|\s)(-\w*r\w*)/,(m,sp,f)=>sp+f.replace('r','')).replace(/(^|\s)-(?=\s|$)/g,' '),content(c.fs[k]));
          if(o!=='')o.split('\n').forEach(l=>out.push(k+':'+l))});
        return out.length&&tp(out.join('\n'))}
      const out=filterCmd('grep '+pre,content(e));return out!==''&&tp(out)}
    case 'find':{
      if(args.includes('-exec'))return tp('(find -exec is not available in this simulation)','dim');
      const ni=args.indexOf('-name'),ti=args.indexOf('-type'),pat=ni>=0?(args[ni+1]||'').replace(/^["']|["']$/g,''):null,ty=ti>=0?args[ti+1]:null;
      const start=args[0]&&!args[0].startsWith('-')?args[0]:'.',base=resolvePath(start,c);
      if(entry(c,base)===undefined)return tp("find: '"+start+"': No such file or directory",'err');
      const shown=start.replace(/\/$/,'')||'/',rx=pat&&globRx(pat),out=[];
      Object.keys(c.fs).filter(k=>k===base||k.startsWith((base==='/'?'':base)+'/')).sort().forEach(k=>{
        if(rootOnly(c,k))return;const isD=Array.isArray(c.fs[k]);
        if(ty==='f'&&isD||ty==='d'&&!isD)return;if(rx&&!rx.test(baseOf(k)))return;
        out.push(shown+(k===base?'':(base==='/'?'':'')+k.slice(base==='/'?0:base.length)))});
      return out.length&&tp(out.join('\n'))}
    case 'mkdir':{
      if(!paths.length)return tp('mkdir: missing operand','err');
      for(const a of paths){const p=resolvePath(a,c);
        if(entry(c,p)!==undefined){if(!/p/.test(flags))tp("mkdir: cannot create directory '"+a+"': File exists",'err');continue}
        if(readOnlyPath(c,p)||(entry(c,dirOf(p))===undefined&&!/p/.test(flags))){tp("mkdir: cannot create directory '"+a+"': "+(entry(c,dirOf(p))===undefined?'No such file or directory':'Permission denied'),'err');continue}
        const parts=p.split('/').filter(Boolean);let cur='';for(const s of parts){cur+='/'+s;if(entry(c,cur)===undefined)setEntry(c,cur,[])}}
      return}
    case 'touch':{
      if(!paths.length)return tp('touch: missing file operand','err');
      for(const a of paths){const p=resolvePath(a,c);if(entry(c,p)!==undefined)continue;
        if(entry(c,dirOf(p))===undefined)tp("touch: cannot touch '"+a+"': No such file or directory",'err');
        else if(readOnlyPath(c,p))tp("touch: cannot touch '"+a+"': Permission denied",'err');else setEntry(c,p,'')}
      return}
    case 'rm':{
      if(!paths.length)return tp('rm: missing operand','err');
      for(const a of paths){const p=resolvePath(a,c),e=entry(c,p);
        if(e===undefined){if(!/f/.test(flags))tp("rm: cannot remove '"+a+"': No such file or directory",'err');continue}
        if(readOnlyPath(c,p)||(LAB.local&&c.kind==='local'&&(LAB.local.protect||[]).includes(p))){tp("rm: cannot remove '"+a+"': Permission denied",'err');continue}
        if(Array.isArray(e)&&!/r/i.test(flags)){tp("rm: cannot remove '"+a+"': Is a directory",'err');continue}
        delEntry(c,p)}
      return}
    case 'cp':case 'mv':{
      if(paths.length<2)return tp(cmd+': missing destination file operand after \''+(paths[0]||'')+'\'','err');
      const dst=paths[paths.length-1],srcs=paths.slice(0,-1);
      for(const a of srcs){
        const sp=resolvePath(a,c),se=entry(c,sp);
        if(se===undefined){tp(cmd+": cannot stat '"+a+"': No such file or directory",'err');continue}
        if(Array.isArray(se)){tp(cmd==='cp'?"cp: -r not specified; omitting directory '"+a+"'":'mv: moving directories is not supported in this simulation','err');continue}
        if(!canRead(c,se)||readOnlyPath(c,sp)&&cmd==='mv'){tp(cmd+": cannot open '"+a+"' for reading: Permission denied",'err');continue}
        let dp=resolvePath(dst,c);if(Array.isArray(entry(c,dp)))dp=(dp==='/'?'':dp)+'/'+baseOf(sp);
        if(entry(c,dirOf(dp))===undefined){tp(cmd+": cannot create regular file '"+dst+"': No such file or directory",'err');continue}
        if(readOnlyPath(c,dp)){tp(cmd+": cannot create regular file '"+dst+"': Permission denied",'err');continue}
        setEntry(c,dp,se&&typeof se==='object'?{...se}:se);if(cmd==='mv')delEntry(c,sp)}
      return}
    case 'chmod':{
      if(paths.length<2)return tp('chmod: missing operand','err');
      const mode=paths[0];
      for(const a of paths.slice(1)){const p=resolvePath(a,c),e=entry(c,p);
        if(e===undefined){tp("chmod: cannot access '"+a+"': No such file or directory",'err');continue}
        const isD=Array.isArray(e),cur=(!isD&&e&&e.m)||(isD?'drwxr-xr-x':'-rw-r--r--');
        if(!c.root&&((!isD&&e&&e.o)||c.user)!==c.user){tp("chmod: changing permissions of '"+a+"': Operation not permitted",'err');continue}
        let nm;
        if(/^[0-7]{3}$/.test(mode))nm=modeStr(mode,isD);
        else{const m=mode.match(/^([ugoa]*)([-+=])([rwx]+)$/);if(!m){tp("chmod: invalid mode: '"+mode+"'",'err');return}
          const who=m[1]===''||m[1]==='a'?'ugo':m[1];const ch=cur.split('');
          for(const w of who)for(const r of m[3]){const idx={u:1,g:4,o:7}[w]+'rwx'.indexOf(r);ch[idx]=m[2]==='-'?'-':r}
          nm=ch.join('')}
        if(isD)c.fs[p]=Object.assign(e,{m:nm});else setEntry(c,p,{...(typeof e==='object'?e:{c:e}),m:nm})}
      return}
    case 'exit':case 'logout':
      if(c.kind==='local')return tp('There is nowhere to go. Close the tab if you really want to leave. 😉','dim');
      if(c.root){c.root=false;return tp('(back to '+c.user+')','dim')}
      T.ctx=T.stack.pop();tp('Connection to '+c.ip+' closed.','dim');return;
    case 'sudo':if(c.kind==='local')return tp(c.user+' is not in the sudoers file. This incident will be reported. (Just kidding. Nothing is reported. Nothing here is real.)','err');
    default:
      if(/^\.?\.?\//.test(cmd)&&c.kind==='local'&&LAB.local.tree)return execFile(cmd);
      tp(cmd+': command not found (type "help")','err');
  }
}

/* ---- your machine ---- */
function scopeWarn(ip){const h=LAB.hosts[ip];if(h&&h.outOfScope)tp('⚠ '+ip+' ('+h.name+') is NOT on your scope list. In a real test you must stop here and ask the client. (Output shown for training only.)','err')}
const ipOf=a=>(a.match(/\b\d+\.\d+\.\d+\.\d+(?:\/\d+)?\b/)||[])[0];
function localOnly(line,tok,cmd){
  const args=tok.slice(1);
  switch(cmd){
    case 'nmap':{
      const tgt=ipOf(args.join(' '));
      if(!tgt){tp('Usage: nmap [-sn | -p- | -sV] <ip or range>','err');return true}
      if(tgt.includes('/')){
        if(tgt!==LAB.range){tp('Note: only the training range '+LAB.range+' exists here. Stick to what scope.txt allows.','err');return true}
        if(!args.includes('-sn')){tp('That would scan a whole range. Try a ping sweep first: nmap -sn '+LAB.range,'err');return true}
        const ups=Object.entries(LAB.hosts);
        tp('Starting Nmap 7.94 ( https://nmap.org )\n'+ups.map(([ip,h],i)=>`Nmap scan report for ${h.name} (${ip})\nHost is up (0.00${2+i}s latency).`).join('\n')+`\nNmap done: 256 IP addresses (${ups.length} hosts up) scanned in 2.31 seconds`);return true}
      const h=LAB.hosts[tgt];scopeWarn(tgt);
      if(!h){tp('Note: Host seems down. Is '+tgt+' in scope? Check scope.txt.','err');return true}
      const full=args.includes('-p-'),sv=args.includes('-sV');
      const ports=Object.entries(h.ports).filter(([p,d])=>full||!d.hidden).sort((a,b)=>a[0]-b[0]);
      tp(`Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${h.name} (${tgt})
Host is up (0.0021s latency).
${full?'All 65535 ports scanned.':'Not shown: 996 closed tcp ports (default scan covers the 1000 most common ports only)'}
PORT      STATE SERVICE${sv?'  VERSION':''}
${ports.map(([p,d])=>(p+'/tcp').padEnd(10)+'open  '+d.svc.padEnd(8)+(sv?' '+d.ver:'')).join('\n')}

Nmap done: 1 IP address (1 host up) scanned in ${full?'14.02':'1.84'} seconds`);return true}
    case 'nc':{
      scopeWarn(args[0]);const h=LAB.hosts[args[0]];if(!h){tp('nc: connect to '+(args[0]||'?')+' failed (No route to host)','err');return true}
      const d=h.ports[args[1]];
      if(d&&d.banner)tp(d.banner);else if(d)tp('(connected – nothing sent. Try the proper client instead.)','dim');
      else tp('nc: connect to '+args[0]+' port '+args[1]+' (tcp) failed: Connection refused','err');
      return true}
    case 'curl':{
      const ui0=args.indexOf('-u'),credTok=ui0>=0?args[ui0+1]:null;
      const url=args.find(a=>!a.startsWith('-')&&a!==credTok);
      const m=(url||'').replace(/^https?:\/\//,'').match(/^([^\/]+)(\/.*)?$/);
      if(!m){tp('curl: try \'curl http://<ip>/\'','err');return true}
      scopeWarn(m&&m[1]);const h=LAB.hosts[m[1]];if(!h||!h.web){tp('curl: (6) Could not resolve host / connect: '+m[1],'err');return true}
      let path=(m[2]||'/').split('?')[0];if(path.length>1)path=path.replace(/\/+$/,'');
      const ui=args.indexOf('-u'),creds=ui>=0?args[ui+1]:null,gate=h.auth&&h.auth[path];
      if(gate&&creds!==gate.user+':'+gate.pass){tp('HTTP/1.1 401 Unauthorized\nWWW-Authenticate: Basic realm="'+gate.realm+'"\n(this page wants a username and password – use -u user:pass)');return true}
      const r=h.web[path];tp(r!==undefined?(typeof r==='function'?r():r):'<html><head><title>404 Not Found</title></head><body><h1>Not Found</h1></body></html>');return true}
    case 'dirb':{
      const ip=ipOf(args.join(' ')),h=LAB.hosts[ip];
      if(!h||!h.dirs){tp('Usage: dirb http://<ip>/','err');return true}
      tp(`-----------------\nDIRB v2.22\nURL_BASE: http://${ip}/\nWORDLIST_FILES: common.txt\n-----------------\n${h.dirs.join('\n')}\n-----------------\nDOWNLOADED: 4612 - FOUND: ${h.dirs.length}`);return true}
    case 'ftp':{
      const ip=args[0],h=LAB.hosts[ip];
      if(!h||!h.ftp){tp('ftp: connect: '+(h?'Connection refused':'No route to host'),'err');return true}
      tp('Connected to '+ip+'.\n220 '+h.ftp.banner);
      T.pending={label:'Name ('+ip+':student):',cb:u=>{
        if(/^(anonymous|ftp)$/i.test(u)&&h.ftp.anon){T.pending={label:'Password:',secret:true,cb:()=>{tp('230 Login successful.\nRemote system type is UNIX. Type "ls" to list, "get <file>" to download, "quit" to leave.');T.mode='ftp';T.ftp=h;setPrompt()}}}
        else{T.pending={label:'Password:',secret:true,cb:()=>tp('530 Login incorrect.','err')}}
      }};return true}
    case 'ssh':{
      const m=(args[0]||'').match(/^(\w+)@(.+)$/);
      if(!m){tp('Usage: ssh user@<ip>','err');return true}
      const h=LAB.hosts[m[2]];if(!h||!h.users){tp('ssh: connect to host '+m[2]+' port 22: '+(h?'Connection refused':'No route to host'),'err');return true}
      T.pending={label:m[1]+'@'+m[2]+"'s password:",secret:true,cb:pw=>{
        const u=h.users[m[1]];
        if(u&&u.pw===pw){T.stack.push(T.ctx);T.ctx=mkRemote(m[2],m[1]);tp(h.motd||'Welcome. Type "help" for the commands available in this simulated shell.','sys')}
        else tp('Permission denied, please try again.','err');
      }};return true}
  }
  return false;
}
function ftpCmd(line){
  const tok=line.split(/\s+/),h=T.ftp,files=h.ftp.files;
  switch(tok[0]){
    case 'ls':case 'dir':tp('227 Entering Passive Mode.\n'+Object.keys(files).map(n=>'-rw-r--r--   1 ftp   ftp   '+String(files[n].length).padStart(5)+' Mar  2 09:15 '+n).join('\n')+'\n226 Directory send OK.');break;
    case 'get':{const f=tok[1];if(!files[f]){tp('550 Failed to open file.','err');break}
      const L=T.stack.length?T.stack[0]:T.ctx;const loc=(T.ctx.kind==='local'?T.ctx:L);
      loc.fs['/home/student/'+f]=files[f];if(!loc.fs['/home/student'].includes(f))loc.fs['/home/student'].push(f);
      tp('226 Transfer complete. Saved to your home folder – read it with: cat '+f);break}
    case 'quit':case 'bye':case 'exit':T.mode=null;T.ftp=null;tp('221 Goodbye.');break;
    default:tp('?Invalid command. Try: ls, get <file>, quit','err');
  }
}

/* ---- on a target ---- */
function sudoRules(c){return (c.host.users[c.user].sudo)||[]}
function remoteOnly(line,tok,cmd){
  const c=T.ctx;
  if(cmd!=='sudo')return false;
  const rules=sudoRules(c);
  if(/^sudo\s+-l$/.test(line)){
    tp(rules.length?`Matching Defaults entries for ${c.user} on ${c.name}:\n    env_reset, mail_badpass\n\nUser ${c.user} may run the following commands on ${c.name}:\n${rules.map(r=>'    (root) NOPASSWD: '+r).join('\n')}`:`Sorry, user ${c.user} may not run sudo on ${c.name}.`);return true}
  const bin=tok[1],rule=rules.find(r=>r===bin||r.endsWith('/'+bin));
  if(!rule){tp(`Sorry, user ${c.user} is not allowed to execute '${tok.slice(1).join(' ')}' as root on ${c.name}.`,'err');return true}
  if(/find$/.test(rule)){
    const m=line.match(/-exec\s+(.+?)\s*(?:\{\}\s*)?(?:\\;|';'|";"|;|\+)\s*(?:-quit)?\s*$/);
    if(!m){tp('(find: try running a command on each file it finds: -exec <command> \\; )','dim');return true}
    const inner=m[1].replace(/\{\}/g,'').trim();
    if(/^(\/bin\/)?(sh|bash)$/.test(inner)){c.root=true;tp('(find ran a shell as root)','sys');return true}
    const was=c.root;c.root=true;try{runCmd(inner)}finally{c.root=was}return true}
  tp('(this simulation does not run that program)','dim');return true;
}
