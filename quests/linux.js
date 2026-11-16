/* CyberQuest: Terminal Trainer – the Linux command line. Everything runs in a simulated shell inside the page: a made-up file system,
   nothing real is touched. For real practice afterwards, point students to TryHackMe's "Linux Fundamentals" rooms or OverTheWire "Bandit". */
module.exports=H=>{
  const F={welcome:'CTF{ls_and_cat_are_your_eyes}',hidden:'CTF{dotfiles_are_just_files}',cd:'CTF{cd_takes_you_places}',backup:'CTF{copies_keep_originals_safe}',
    mv:'CTF{mv_moves_and_renames}',rm:'CTF{rm_has_no_recycle_bin}',echo:'CTF{redirect_writes_files}',find:'CTF{find_finds_it_all}',chmod:'CTF{chmod_plus_x_unlocks_scripts}'};
  const HOME='/home/student';

  /* auth.log: 12 failed logins in total (7 + 3 + 2) mixed with normal activity */
  const log=[];let sec=0;
  const add=(m)=>{sec+=137+(log.length*53)%211;const t=new Date(Date.UTC(2026,2,2,0,0,0)+sec*1000).toISOString().replace('T',' ').slice(0,19);log.push(`${t} sshd ${m}`)};
  const seq=[['A',0],['ok',0],['A',0],['B',0],['A',0],['ok',1],['C',0],['A',0],['B',0],['A',0],['ok',0],['A',0],['C',0],['B',0],['ok',1],['A',0]];
  const ips={A:['root','203.0.113.9'],B:['admin','198.51.100.4'],C:['test','192.0.2.77']};let n=0;
  for(const [k,u] of seq){n++;if(k==='ok')add(`Accepted password for ${u?'deploy':'student'} from 10.0.0.5 port ${40100+n*7}`);else add(`Failed password for ${ips[k][0]} from ${ips[k][1]} port ${50000+n*11}`)}
  const failed=log.filter(l=>l.includes('Failed password')).length;
  const top=Object.values(ips).map(([u,ip])=>[ip,log.filter(l=>l.includes('Failed')&&l.includes(ip)).length]).sort((a,b)=>b[1]-a[1])[0][0];
  if(failed!==12||top!=='203.0.113.9')throw new Error('linux quest: log generator changed the answers ('+failed+', '+top+')');
  const authLog=log.join('\n');

  const chk=(when,yes,no)=>({c:'#!/bin/bash\n# (check script)',m:'-rwxr-xr-x',run:{when,yes,no}});
  const tree={
    '/':['bin','etc','home','tmp','var'],
    '/bin':['ls','cat','grep'],'/bin/ls':{c:'(binary file)',m:'-rwxr-xr-x',o:'root'},'/bin/cat':{c:'(binary file)',m:'-rwxr-xr-x',o:'root'},'/bin/grep':{c:'(binary file)',m:'-rwxr-xr-x',o:'root'},
    '/etc':['hostname','motd'],'/etc/hostname':{c:'trainer',o:'root'},'/etc/motd':{c:'Welcome to the training server. Everything here is pretend.',o:'root'},
    '/tmp':[],
    '/var':['log'],'/var/log':['auth.log'],'/var/log/auth.log':{c:authLog,m:'-rw-r--r--',o:'root'},
    '/home':['student'],
    [HOME]:['.bashrc','.hidden_note','checks','documents','downloads','notes.txt','projects','secret_script.sh','welcome.txt'],
    [HOME+'/.bashrc']:'# ~/.bashrc: settings for your shell (nothing to see here)\nalias ll="ls -l"',
    [HOME+'/.hidden_note']:`You found me! Files whose names start with a dot are hidden from a plain ls.\n${F.hidden}`,
    [HOME+'/welcome.txt']:`Welcome to the Terminal Trainer!\nYou just used ls to see this file and cat to read it.\n${F.welcome}`,
    [HOME+'/notes.txt']:'Things to remember:\n- the terminal is case-sensitive: Notes.txt and notes.txt are different files\n- Tab completes names, the Up arrow repeats old commands',
    [HOME+'/secret_script.sh']:{c:'#!/bin/bash\necho "Access granted."',m:'-rw-r--r--',run:`Access granted.\n${F.chmod}`},
    [HOME+'/checks']:['check_backup.sh','check_echo.sh','check_move.sh','check_rm.sh'],
    [HOME+'/checks/check_backup.sh']:chk([{exists:HOME+'/backup/notes.txt'},{exists:HOME+'/notes.txt'}],`✔ backup/notes.txt exists and the original is still there.\n${F.backup}`,'✘ Not yet. Make a folder called backup in your home folder and copy notes.txt into it.'),
    [HOME+'/checks/check_echo.sh']:chk([{has:[HOME+'/hello.txt','hello world']}],`✔ hello.txt contains your message.\n${F.echo}`,'✘ Not yet. hello.txt should exist in your home folder and contain: hello world'),
    [HOME+'/checks/check_move.sh']:chk([{exists:HOME+'/documents/final.txt'},{missing:HOME+'/downloads/draft.txt'}],`✔ draft.txt was moved into documents and renamed final.txt.\n${F.mv}`,'✘ Not yet. Move downloads/draft.txt into the documents folder AND rename it to final.txt.'),
    [HOME+'/checks/check_rm.sh']:chk([{missing:HOME+'/downloads/old_installer.tmp'},{exists:HOME+'/downloads/keep_me.txt'}],`✔ The junk file is gone and keep_me.txt is safe.\n${F.rm}`,'✘ Not yet. Delete downloads/old_installer.tmp, but leave keep_me.txt alone!'),
    [HOME+'/documents']:['cv.txt','diary.txt','reports','shared_notes.txt','todo.txt'],
    [HOME+'/documents/cv.txt']:'Alex Student - CV\nSkills: curiosity, patience, typing',
    [HOME+'/documents/todo.txt']:'1. revise networking\n2. practise the command line\n3. do not delete everything',
    [HOME+'/documents/diary.txt']:{c:'Dear diary, the terminal is quite fun actually.',m:'-rw-------'},
    [HOME+'/documents/shared_notes.txt']:{c:'Anyone can edit this file.',m:'-rw-rw-rw-'},
    [HOME+'/documents/reports']:['2025','2026'],
    [HOME+'/documents/reports/2025']:['summary.txt'],[HOME+'/documents/reports/2025/summary.txt']:'Wrong year. Look at the newer reports.',
    [HOME+'/documents/reports/2026']:['budget_note.txt','q1.txt'],
    [HOME+'/documents/reports/2026/q1.txt']:'Q1 summary: all targets met.',
    [HOME+'/documents/reports/2026/budget_note.txt']:`Budget note. You navigated here with cd and ls.\n${F.cd}`,
    [HOME+'/downloads']:['draft.txt','keep_me.txt','old_installer.tmp'],
    [HOME+'/downloads/draft.txt']:'My essay draft. It needs a better name.',
    [HOME+'/downloads/keep_me.txt']:'Important! Do not delete.',
    [HOME+'/downloads/old_installer.tmp']:'(temporary installer data, safe to delete)',
    [HOME+'/projects']:['archive','game','website'],
    [HOME+'/projects/game']:['README.md','main.py'],[HOME+'/projects/game/README.md']:'# My game\nA text adventure.',[HOME+'/projects/game/main.py']:'print("You are in a dark room.")',
    [HOME+'/projects/website']:['index.html'],[HOME+'/projects/website/index.html']:'<h1>My site</h1>',
    [HOME+'/projects/archive']:['2019'],[HOME+'/projects/archive/2019']:['notes.txt','passwords_old.txt'],
    [HOME+'/projects/archive/2019/notes.txt']:'Old project notes. Nothing useful.',
    [HOME+'/projects/archive/2019/passwords_old.txt']:`Old passwords file. (Never keep passwords in a plain text file!)\n${F.find}`
  };

  const man={
    ls:'LS - list directory contents\n  ls          list the files here\n  ls -l       long format: permissions, owner, size, date\n  ls -a       also show hidden files (names starting with a dot)\n  ls <folder> list a different folder',
    cd:'CD - change directory\n  cd <folder>   move into a folder\n  cd ..         go up one level\n  cd ~ (or just cd)  go home\n  cd /          go to the top of the file system',
    cat:'CAT - show the contents of a file\n  cat <file>',
    pwd:'PWD - print the working directory (where am I?)',
    grep:'GREP - search for text\n  grep <text> <file>      show lines that contain the text\n  grep -i ...             ignore upper/lower case\n  grep -c ...             count the matching lines\n  grep -n ...             show line numbers\n  grep -r <text> <folder> search every file in a folder',
    find:'FIND - search for files by name\n  find <folder> -name "<pattern>"\n  find . -name "*.txt"    (* matches anything)\n  find . -type d          only folders',
    mkdir:'MKDIR - make a directory\n  mkdir <name>',
    cp:'CP - copy a file\n  cp <file> <new name or folder>',
    mv:'MV - move or rename a file\n  mv <file> <folder>      move it\n  mv <old name> <new name> rename it',
    rm:'RM - remove a file. THERE IS NO RECYCLE BIN.\n  rm <file>\n  rm -r <folder>  remove a folder and everything in it',
    chmod:'CHMOD - change permissions\n  chmod +x <file>   allow it to be run as a program\n  chmod 644 <file>  r=4 w=2 x=1, in the order owner, group, others',
    echo:'ECHO - print text\n  echo hello           prints hello\n  echo hello > file    writes it into a file (replacing it)\n  echo more >> file    adds it to the end of a file',
    wc:'WC - count\n  wc -l <file>   count the lines',
    sort:'SORT - sort lines\n  sort <file>   sort A-Z\n  sort -n       sort by number   -r  reverse',
    uniq:'UNIQ - remove repeated neighbouring lines\n  uniq -c   also count them (sort first!)',
    cut:'CUT - pick a column out of each line\n  cut -d " " -f 2   split on spaces and show the 2nd piece'
  };

  const lab={
    tab:'Terminal',bar:'student@trainer',
    intro:'A simulated Linux terminal with a <b>made-up file system</b>. You cannot break anything: every command only changes this pretend computer, and it resets if you reload the page. Type <code>help</code> for the commands, or <code>man ls</code> to read the manual for one.',
    data:{local:{
      plain:true,tree,home:HOME,user:'student',name:'trainer',readonly:['/etc','/var','/bin'],protect:[HOME,HOME+'/checks'],man,
      welcome:'You are student@trainer. Try: pwd, then ls. Type "help" for commands, or "man <command>" for a manual page.\n',
      help:`Commands you can use:
  pwd  ls [-l] [-a]  cd  cat  head  tail  wc  sort  uniq  cut  grep [-i -c -n -r]  find
  mkdir  touch  cp  mv  rm  chmod  echo (with > and >>)  ./script
  man <command>   history   clear
  Pipes work too:  cat file | grep text | wc -l
  Tip: Up/Down arrows bring back old commands.`
    }}
  };

  return {
    id:'linux',name:'Terminal Trainer',subtitle:'Linux command line edition',icon:'🐧',accent:'#8dff7a',minutes:90,
    viewSourceFlag:'CTF{linux_starts_with_a_prompt}',
    blurb:'Move around, search, copy, move and lock down files in a safe, simulated Linux terminal.',
    lead:'A 90-minute introduction to the Linux command line, the skill behind servers, hacking tools and most of the internet. Everything happens in a pretend computer, so you can try, break and retry with no risk.',
    rulesExtra:['The <b>Terminal</b> tab is a simulated Linux computer. It only knows the commands listed under <code>help</code>, and nothing you do there can affect a real machine.','Stuck on a command? Type <code>man</code> followed by its name, for example <code>man find</code>.'],
    pacing:[['0–10 min','Warm-up, then learn the five core commands: pwd, ls, cd, cat, grep.'],['10–35 min','Getting around: hidden files, folders inside folders, absolute and relative paths.'],['35–65 min','Working with files: copy, move, delete and write files, then search for things with find and grep.'],['65–85 min','Pipes, then file permissions with chmod.'],['85–90 min','Good habits and a final check.']],
    tips:['Linux is <b>case-sensitive</b>: <code>Notes.txt</code> and <code>notes.txt</code> are different files.','Look before you act: <code>pwd</code> and <code>ls</code> are free, and a typo with <code>rm</code> is not.','Check scripts in the <code>checks</code> folder tell you whether you did a task correctly. Run them with <code>./checks/name.sh</code>.'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      nav:{name:'Getting Around',icon:'🧭',blurb:'Where am I, and what is here?'},
      files:{name:'Working With Files',icon:'📁',blurb:'Make, copy, move and delete'},
      search:{name:'Finding Things',icon:'🔍',blurb:'Search files and logs'},
      perms:{name:'Permissions',icon:'🔐',blurb:'Who can read, write and run?'},
      habits:{name:'Good Habits',icon:'🧠',blurb:'Think like an admin'}
    },
    lab,
    challenges:[
      {id:'lx_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{linux_starts_with_a_prompt}',
       body:`<p>Right-click this page and choose <b>"View Page Source"</b> (or press <code>Ctrl+U</code>). Near the top of the HTML there is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'lx_cmds',cat:'intro',title:'Five Commands',pts:75,diff:1,flag:'CTF{five_commands_down}',widget:'classify',
       body:`<p>Five commands do most of the everyday work in a terminal. Match each command to what it does. Open the <b>Terminal</b> tab and try them if you are unsure (or type <code>man ls</code>).</p>`,
       wd:{options:['Show where I am','List the files here','Change folder','Show what is inside a file','Search for text'],win:'those five will take you a long way',retry:'Each purpose is used exactly once.',items:[
         {t:'<code>pwd</code>',a:0},{t:'<code>ls</code>',a:1},{t:'<code>cd</code>',a:2},{t:'<code>cat</code>',a:3},{t:'<code>grep</code>',a:4}]},
       hints:['<code>pwd</code> stands for "print working directory".','<code>cat</code> prints a file. <code>grep</code> hunts for words.']},

      {id:'lx_where',cat:'nav',title:'Where Am I?',pts:75,diff:1,flag:'CTF{/home/student}',loose:true,
       body:`<p>Open the <b>Terminal</b> tab. When you open a terminal you start in your <b>home folder</b>. The command <code>pwd</code> (print working directory) shows the full path of the folder you are in.</p><p>Run it. The flag is <code>CTF{path}</code> using the path it prints.</p>`,
       hints:['Type <code>pwd</code> and press Enter.','The path starts with a <code>/</code>. Put it inside the braces exactly as printed.']},
      {id:'lx_welcome',cat:'nav',title:'List and Read',pts:75,diff:1,flag:F.welcome,
       body:`<p><code>ls</code> lists the files in the current folder. <code>cat &lt;file&gt;</code> prints what is inside one. There is a friendly file in your home folder called <code>welcome.txt</code>. Read it to find the flag.</p>`,
       hints:['Run <code>ls</code> first to see the file names.','<code>cat welcome.txt</code>']},
      {id:'lx_hidden',cat:'nav',title:'Hidden in Plain Sight',pts:100,diff:2,flag:F.hidden,
       body:`<p>In Linux, any file whose name starts with a dot (<code>.</code>) is <b>hidden</b>: a plain <code>ls</code> skips it. Settings files are usually hidden so they do not clutter your view, but they are not secret. There is a hidden note in your home folder.</p>`,
       hints:['The option <code>-a</code> means "all". Try <code>ls -a</code>.','The file is called <code>.hidden_note</code>. Read it with <code>cat .hidden_note</code>.']},
      {id:'lx_cd',cat:'nav',title:'Down the Rabbit Hole',pts:125,diff:2,flag:F.cd,
       body:`<p>A file called <code>budget_note.txt</code> is buried inside the <code>documents</code> folder, in the <b>2026</b> reports. Use <code>cd</code> to move into folders and <code>ls</code> to look around, then read it.</p><p>Useful: <code>cd ..</code> goes back up one level, and <code>cd</code> on its own takes you home.</p>`,
       hints:['Path: documents, then reports, then 2026. You can do it in one go: <code>cd documents/reports/2026</code>.','Once you are in the right folder, <code>ls</code> shows two files. Read <code>budget_note.txt</code> with <code>cat</code>.']},
      {id:'lx_paths',cat:'nav',title:'Absolute or Relative?',pts:100,diff:2,flag:'CTF{paths_are_addresses}',widget:'classify',
       body:`<p>An <b>absolute path</b> starts at the top of the file system with <code>/</code> and works from anywhere, like a full postal address. A <b>relative path</b> starts from where you are now, like "second door on the left". <code>..</code> means "the folder above".</p><p>Classify each path.</p>`,
       wd:{options:['Absolute','Relative'],win:'you can read an address',retry:'Does it start with a /?',items:[
         {t:'<code>/var/log/auth.log</code>',a:0},{t:'<code>documents/cv.txt</code>',a:1},{t:'<code>../projects</code>',a:1},{t:'<code>/home/student/notes.txt</code>',a:0},{t:'<code>./secret_script.sh</code>',a:1},{t:'<code>/</code>',a:0}]},
       hints:['An absolute path always begins with a forward slash.','<code>.</code> means "here" and <code>..</code> means "up one". Both are relative.']},

      {id:'lx_backup',cat:'files',title:'Make a Backup',pts:150,diff:2,flag:F.backup,
       body:`<p>Before changing something, make a copy. In your home folder:</p><pre class="code">mkdir backup
cp notes.txt backup</pre><p><code>mkdir</code> makes a folder. <code>cp &lt;file&gt; &lt;place&gt;</code> copies a file and leaves the original alone. When you are done, run the checker, which prints the flag only if you did it right:</p><pre class="code">./checks/check_backup.sh</pre>`,
       hints:['Make sure you are in your home folder first (<code>cd</code> on its own takes you there, <code>pwd</code> confirms it).','<code>mkdir backup</code>, then <code>cp notes.txt backup</code>, then <code>./checks/check_backup.sh</code>.']},
      {id:'lx_mv',cat:'files',title:'Move and Rename',pts:150,diff:2,flag:F.mv,
       body:`<p><code>mv</code> does two jobs: it <b>moves</b> a file to another folder, and it <b>renames</b> a file (renaming is just moving to a new name). Your task: take <code>downloads/draft.txt</code>, put it in the <code>documents</code> folder, and call it <code>final.txt</code>. Then run <code>./checks/check_move.sh</code>.</p>`,
       hints:['The pattern is <code>mv &lt;from&gt; &lt;to&gt;</code>. The "to" can include a new file name.','From your home folder: <code>mv downloads/draft.txt documents/final.txt</code>']},
      {id:'lx_rm',cat:'files',title:'No Recycle Bin',pts:125,diff:2,flag:F.rm,
       body:`<p><code>rm &lt;file&gt;</code> deletes a file <b>permanently</b>. There is no recycle bin and no undo, so read the name twice. Remove the junk file <code>downloads/old_installer.tmp</code> and leave <code>keep_me.txt</code> alone. Then run <code>./checks/check_rm.sh</code>.</p>`,
       hints:['Use <code>ls downloads</code> to see both files before you delete anything.','<code>rm downloads/old_installer.tmp</code>']},
      {id:'lx_echo',cat:'files',title:'Write a File',pts:150,diff:3,flag:F.echo,
       body:`<p><code>echo</code> prints text. Add <code>&gt;</code> and the text goes into a <b>file</b> instead (this replaces whatever was there). <code>&gt;&gt;</code> adds to the end instead.</p><pre class="code">echo "some text" &gt; filename</pre><p>Create a file called <code>hello.txt</code> in your home folder containing exactly <code>hello world</code>. Then run <code>./checks/check_echo.sh</code>.</p>`,
       hints:['Be in your home folder, then use <code>echo</code> with the words in quotes.','<code>echo "hello world" &gt; hello.txt</code>. Check it with <code>cat hello.txt</code>.']},

      {id:'lx_find',cat:'search',title:'Find It',pts:150,diff:2,flag:F.find,
       body:`<p>Somewhere under your <code>projects</code> folder is a file called <code>passwords_old.txt</code>. You could <code>cd</code> through every folder, or you could ask the computer:</p><pre class="code">find &lt;where to look&gt; -name "&lt;file name&gt;"</pre><p>Find the file, then <code>cat</code> it using the path <code>find</code> printed.</p>`,
       hints:['<code>find projects -name "passwords_old.txt"</code> (from your home folder). Use <code>*</code> as a wildcard, like <code>"*.txt"</code>.','Copy the path it prints and give it to <code>cat</code>.']},
      {id:'lx_grep',cat:'search',title:'Count the Failures',pts:175,diff:3,flag:'CTF{'+failed+'}',
       body:`<p>The file <code>/var/log/auth.log</code> records every login attempt on this server. Lines with <code>Failed password</code> are failed attempts. How many are there?</p><p>You can read the file with <code>cat</code>, but there is a faster way: <code>grep</code> finds matching lines, and <code>grep -c</code> counts them. You can also <b>pipe</b> (<code>|</code>) the output of one command into another, such as <code>... | wc -l</code> to count lines.</p><p>The flag is <code>CTF{number}</code>.</p>`,
       hints:['<code>grep -c "Failed password" /var/log/auth.log</code>','Or: <code>grep "Failed password" /var/log/auth.log | wc -l</code>. Both give the same number.']},
      {id:'lx_pipe',cat:'search',title:'Who Keeps Trying?',pts:225,diff:3,flag:'CTF{'+top+'}',
       body:`<p>Now find the attacker. Which IP address has the <b>most</b> failed logins in <code>/var/log/auth.log</code>? Build a <b>pipeline</b>, where each command passes its result to the next:</p><pre class="code">grep "Failed" /var/log/auth.log     only the failed lines
| cut -d " " -f 9                   keep the 9th space-separated piece (the IP)
| sort                              put equal IPs next to each other
| uniq -c                           count each run of equal lines
| sort -nr                          biggest number first
| head -1                           just the top one</pre><p>Type it as one line (no line breaks). The flag is <code>CTF{ip-address}</code>.</p>`,
       hints:['Try the pipeline one stage at a time, adding a <code>|</code> each time, so you can see what each command does.','<code>grep Failed /var/log/auth.log | cut -d " " -f 9 | sort | uniq -c | sort -nr | head -1</code>']},

      {id:'lx_permnum',cat:'perms',title:'Permission Numbers',pts:125,diff:3,flag:'CTF{644_means_rw_r_r}',widget:'classify',
       body:`<p>Each permission is a number: <b>read = 4</b>, <b>write = 2</b>, <b>execute = 1</b>. Add them up for each of three groups: the <b>owner</b>, the <b>group</b>, then <b>everyone else</b>. So <code>chmod 640 file</code> means owner 4+2 (read and write), group 4 (read), others 0 (nothing).</p><p>Match each description to the right number.</p>`,
       wd:{options:['600','644','755','777'],win:'you can do the sums',retry:'Work out each digit: 4 read, 2 write, 1 execute.',items:[
         {t:'Only the owner can read and write. Nobody else can do anything.',a:0},{t:'The owner can read and write. Everyone else can only read.',a:1},{t:'The owner can do everything. Everyone else can read and run it.',a:2},{t:'Absolutely everybody can read, write and run it (almost never a good idea).',a:3}]},
       hints:['6 = 4+2 (read and write). 7 = 4+2+1 (everything). 5 = 4+1 (read and run). 4 = read only.','There are three digits: owner, group, others.']},
      {id:'lx_lsl',cat:'perms',title:'Read the Permissions',pts:125,diff:2,flag:'CTF{shared_notes.txt}',loose:true,
       body:`<p><code>ls -l</code> shows a permission string at the start of each line, such as <code>-rw-r--r--</code>. After the first character (file or folder), read it in three groups of three: <b>owner</b>, <b>group</b>, <b>others</b>. A letter means allowed and a dash means not allowed (<code>r</code> read, <code>w</code> write, <code>x</code> execute).</p><p>In the <code>documents</code> folder, one file can be <b>changed by anyone</b> on the system. Which one? The flag is <code>CTF{file name}</code>.</p>`,
       hints:['Run <code>ls -l documents</code> and look for a <code>w</code> in the last group of three letters.','<code>-rw-rw-rw-</code> lets everybody write.']},
      {id:'lx_chmod',cat:'perms',title:'Make It Run',pts:175,diff:3,flag:F.chmod,
       body:`<p>There is a script in your home folder called <code>secret_script.sh</code>. Try to run it with <code>./secret_script.sh</code> (the <code>./</code> means "the one in this folder"). It refuses: the file is not <b>executable</b>. Check with <code>ls -l</code>: there is no <code>x</code>.</p><p>Add the execute permission with <code>chmod +x</code>, then run it again.</p>`,
       hints:['<code>chmod +x secret_script.sh</code>','Then <code>./secret_script.sh</code>. Check <code>ls -l</code> to see the <code>x</code> appear.']},

      {id:'lx_order',cat:'habits',title:'Look Before You Delete',pts:100,diff:2,flag:'CTF{look_before_you_delete}',widget:'order',
       body:`<p>Experienced admins are careful, because a terminal does exactly what it is told. Put these steps for <b>safely deleting a file</b> in the best order.</p>`,
       wd:{items:['<code>pwd</code>: check which folder you are in','<code>ls</code>: look at what is there and check the exact name','<code>cp file backup/</code>: copy it somewhere safe if it might matter','<code>rm file</code>: delete it','<code>ls</code>: confirm that it is gone and nothing else was'],retry:'Check first, act second, confirm last.'},
       hints:['Checking things (pwd, ls) comes before the dangerous command.','Confirming the result comes last.']}
    ]
  };
};
