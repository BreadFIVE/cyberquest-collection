/* CyberQuest: SOC Analyst – the defender's view. All companies, logs, IP addresses and incidents are fictional (IPs are from the reserved documentation ranges). */
module.exports=H=>{
  const P2=n=>String(n).padStart(2,'0'),clock=s=>`${P2(Math.floor(s/3600)%24)}:${P2(Math.floor(s/60)%60)}:${P2(s%60)}`;
  /* ---------- auth.log: a brute-force run that finally gets in ---------- */
  const ATT='203.0.113.50';
  const lines=[];let pid=2100;
  const add=(s,m)=>lines.push([s,`Mar  2 ${clock(s)} srv01 sshd[${pid++}]: ${m}`]);
  const normal=[[8*3600+2*60+11,'alice','10.0.0.21'],[8*3600+41*60+3,'bob','10.0.0.34'],[9*3600+15*60+40,'alice','10.0.0.21'],[11*3600+2*60+9,'carol','10.0.0.57'],[13*3600+30*60+22,'bob','10.0.0.34']];
  normal.forEach(([s,u,ip],i)=>add(s,`Accepted publickey for ${u} from ${ip} port ${41000+i*13} ssh2`));
  add(60*60+5*60,'Failed password for bob from 10.0.0.34 port 40111 ssh2');   // one typo, no big deal
  const users=['root','admin','test','oracle','ubuntu','postgres','svc_backup','root','admin','deploy','test','svc_backup','root','svc_backup','admin','guest','root','svc_backup','svc_backup','svc_backup'];
  let t=2*3600+10*60+8;
  users.forEach((u,i)=>{add(t,`Failed password for ${u} from ${ATT} port ${52000+i*17} ssh2`);t+=3+(i*7)%5});
  const inAt=t;add(inAt,`Accepted password for svc_backup from ${ATT} port 52412 ssh2`);
  add(inAt+22,`sudo:  svc_backup : TTY=pts/1 ; PWD=/home/svc_backup ; USER=root ; COMMAND=/usr/bin/crontab -e`);
  add(inAt+70,`pam_unix(sshd:session): session closed for user svc_backup`);
  lines.sort((a,b)=>a[0]-b[0]);
  const authLines=lines.map(x=>x[1]);
  const acc=authLines.filter(l=>l.includes('Accepted')&&l.includes(ATT));
  if(acc.length!==1)throw new Error('blueteam: expected exactly one attacker login');
  const inTime=clock(inAt);

  /* ---------- web access log: a scanner and a SQL-injection attempt hide in normal traffic ---------- */
  const web=[];let ws=9*3600;
  const wl=(ip,method,path,code,size)=>{ws+=1+(web.length*5)%7;web.push(`${ip} - - [02/Mar/2026:${clock(ws)} +0000] "${method} ${path} HTTP/1.1" ${code} ${size}`)};
  const SCAN='198.51.100.9',SQLI='192.0.2.88';
  const normalIps=['10.0.0.21','10.0.0.34','203.0.113.17','203.0.113.121','198.51.100.200','192.0.2.15'];
  const pages=[['/',200,5120],['/products',200,8321],['/about',200,2210],['/contact',200,1984],['/css/site.css',200,3411],['/images/logo.png',200,9120]];
  const probes=['/admin','/backup.zip','/wp-login.php','/.env','/phpmyadmin','/config.bak','/old','/test','/db.sql','/secret','/login.php','/server-status','/.git/config','/uploads','/private'];
  for(let i=0;i<46;i++){
    const ip=normalIps[i%normalIps.length],pg=pages[(i*3+1)%pages.length];wl(ip,'GET',pg[0],pg[1],pg[2]);
    if(i%3===0&&i<45){const p=probes[(i/3)%probes.length];wl(SCAN,'GET',p,404,196);wl(SCAN,'GET',probes[(i/3+5)%probes.length],404,196)}
    if(i===18)wl('10.0.0.21','GET','/missing-image.png',404,196);
    if(i===30)wl(normalIps[2],'GET','/favicon.ico',404,196);
  }
  wl(SQLI,'GET',"/products?id=7",200,6200);
  wl(SQLI,'GET',"/products?id=7'",500,310);
  wl(SQLI,'GET',"/products?id=7'%20UNION%20SELECT%20username,password%20FROM%20users--",500,310);
  wl(SQLI,'GET',"/products?id=7'%20OR%20'1'='1",200,18433);
  for(let i=0;i<6;i++)wl(normalIps[i],'GET',pages[i][0],pages[i][1],pages[i][2]);
  const c404={};web.forEach(l=>{if(/" 404 /.test(l)){const ip=l.split(' ')[0];c404[ip]=(c404[ip]||0)+1}});
  const topScan=Object.entries(c404).sort((a,b)=>b[1]-a[1]);
  if(topScan[0][0]!==SCAN||topScan[0][1]<=topScan[1][1]*3)throw new Error('blueteam: scanner not clearly the top 404 source');
  const unionIps=new Set(web.filter(l=>/UNION%20SELECT/i.test(l)).map(l=>l.split(' ')[0]));
  if(unionIps.size!==1||!unionIps.has(SQLI))throw new Error('blueteam: UNION source not unique');

  return {
    id:'blueteam',name:'SOC Analyst',subtitle:'Blue team edition',icon:'🛡️',accent:'#7c9cff',minutes:90,
    viewSourceFlag:'CTF{blue_team_starts_with_view_source}',
    blurb:'Defend the network: triage alerts, read real-style logs, respond to incidents and harden systems.',
    lead:'Hackers get the headlines, but defenders get the jobs. Spend 90 minutes as a junior analyst in a Security Operations Centre (SOC): sort real alerts from false alarms, dig through server logs for an attacker, and decide what to do when an incident lands on your desk.',
    rulesExtra:['The <b>log challenges</b> give you a searchable log viewer. Use the filter box: try words like <code>Failed</code>, <code>Accepted</code> or <code>404</code>, and tick <b>regex</b> for patterns.','All the companies, systems and addresses are <b>fictional</b>.'],
    pacing:[['0–10 min','Warm-up, then the CIA triad: what defenders are protecting.'],['10–35 min','Alert triage: real threat or false alarm, and what to look at first.'],['35–65 min','Log analysis: find the attacker in the authentication log and the web server log.'],['65–85 min','Incident response: the standard process, then three decisions under pressure.'],['85–90 min','Hardening and the attacker\'s journey, to see where defences fit.']],
    tips:['In the log viewer, start broad (<code>Failed</code>) then narrow (add an IP address). Each filter shows a line count.','When you find an IP address, search for it. Everything that address did is then in one place.','Defenders think in <b>timelines</b>: what happened first, and what came next?'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      triage:{name:'Alert Triage',icon:'🚨',blurb:'Real threat or false alarm?'},
      logs:{name:'Log Analysis',icon:'📜',blurb:'Find the attacker in the evidence'},
      ir:{name:'Incident Response',icon:'🚒',blurb:'What to do when it happens'},
      defend:{name:'Detect & Harden',icon:'🧱',blurb:'Make attacks harder and louder'},
      threat:{name:'Know the Enemy',icon:'🎭',blurb:'How attacks unfold'}
    },
    challenges:[
      {id:'bt_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{blue_team_starts_with_view_source}',
       body:`<p>Right-click this page and choose <b>"View Page Source"</b> (or press <code>Ctrl+U</code>). Near the top of the HTML there is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'bt_cia',cat:'intro',title:'What Are We Protecting?',pts:100,diff:1,flag:'CTF{cia_is_the_goal}',widget:'classify',
       body:`<p>Security has three goals, called the <b>CIA triad</b>: <b>Confidentiality</b> (only the right people can see it), <b>Integrity</b> (it has not been secretly changed) and <b>Availability</b> (it is there when needed). Each incident below breaks one of them. Which?</p>`,
       wd:{options:['Confidentiality','Integrity','Availability'],win:'you know what is at stake',retry:'Was something seen, changed or made unavailable?',items:[
         {t:'Customer records are copied and posted online',a:0},{t:'An attacker quietly changes grades in the school database',a:1},{t:'Ransomware locks every file on the file server',a:2},{t:'An employee reads a colleague&rsquo;s private emails',a:0},{t:'A signed contract is edited after it was approved',a:1},{t:'A flood of traffic takes the website offline for hours',a:2}]},
       hints:['Leaked or snooped data is confidentiality. Altered data is integrity. Locked or offline data is availability.','Each of the three is used twice.']},

      {id:'bt_alerts',cat:'triage',title:'Real or False Alarm?',pts:150,diff:2,flag:'CTF{investigate_before_you_panic}',widget:'classify',
       body:`<p>A SOC sees hundreds of alerts a day. Most are <b>false alarms</b> (harmless things that looked suspicious). Analysts decide which are <b>real threats</b> by asking <i>who, what, when and does this fit normal behaviour?</i> Judge each alert.</p>`,
       wd:{options:['Real threat','False alarm'],win:'a good triage call',retry:'Look for things that do not fit: unusual place, time, volume or destination.',items:[
         {t:'A UK-based employee logs in from the UK at 09:02 with the correct password',a:1},{t:'50 failed logins in one minute from a foreign address, then one success',a:0},{t:'Antivirus flags the company&rsquo;s own approved backup tool',a:1},{t:'A finance laptop is contacting a server known to control malware',a:0},{t:'The IT team runs a port scan at 03:00 inside a scheduled, approved maintenance window',a:1},{t:'A staff member receives an email from a lookalike domain with an <code>.exe</code> attached',a:0}]},
       hints:['Ask whether there is a normal explanation (approved work, known tool, usual location).','Lots of failures then a success, malware servers and lookalike domains are all classic warning signs.']},
      {id:'bt_priority',cat:'triage',title:'What First?',pts:150,diff:2,flag:'CTF{impact_and_urgency_decide}',widget:'order',
       body:`<p>Five alerts arrive at once. Put them in the order you would handle them: most urgent and most damaging <b>first</b>.</p>`,
       wd:{items:['Ransomware is encrypting files on the main file server <i>right now</i>','The admin account logged in from two countries within ten minutes','Several failed logins on one workstation','An out-of-date program is flagged on a test machine','A user visited a blocked social media site'],retry:'Ask: is damage happening now, and how bad could it get?'},
       hints:['Damage in progress beats damage that might happen.','A privileged account that looks hijacked is much more serious than one user\'s failed logins.']},
      {id:'bt_hdr',cat:'triage',title:'Read the Email Header',pts:150,diff:2,flag:'CTF{halcyonbank-support.example}',loose:true,
       body:`<p>A customer reports an email that appears to come from their bank. The <b>From</b> line is easy to fake, but other headers are harder to hide. Here are the headers:</p><pre class="code">From: "Halcyon Bank Support" &lt;support@halcyonbank.example&gt;
To: customer@mail.example
Subject: Urgent: your account will be closed
Return-Path: &lt;bounce@halcyonbank-support.example&gt;
Received: from mail.halcyonbank-support.example (203.0.113.200)
Authentication-Results: spf=fail; dkim=none; dmarc=fail
Reply-To: help@halcyonbank-support.example</pre><p>The real bank's domain is <code>halcyonbank.example</code>. The email actually came from a <b>different, lookalike domain</b> shown in the <code>Return-Path</code> line. The flag is <code>CTF{lookalike-domain}</code>.</p>`,
       hints:['Compare the domain after the <code>@</code> in <code>From</code> with the one in <code>Return-Path</code>.','The lookalike adds a word to the real name. SPF and DMARC failures confirm the email was not sent by the real bank.']},

      {id:'bt_auth',cat:'logs',title:'Who Got In?',pts:175,diff:3,flag:'CTF{svc_backup}',widget:'logs',
       body:`<p>The server <code>srv01</code> had an alert for a very large number of failed SSH logins. Below is its <b>authentication log</b>. Use the filter box: try <code>Failed</code> to see the attack, then <code>Accepted</code> to see who logged in.</p><p>Normal staff log in from <code>10.0.0.x</code> addresses. One <b>successful</b> login came from the attacker's address, after the failed attempts. Which <b>username</b> did the attacker get into? The flag is <code>CTF{username}</code>.</p>`,
       wd:{lines:authLines,placeholder:'Filter the log… (try Failed, then Accepted)'},
       hints:['Search for <code>Failed</code> and note the IP address that keeps appearing. Then search for that IP address.','One line for that IP says <code>Accepted password</code>. The username comes after <code>for</code>.']},
      {id:'bt_when',cat:'logs',title:'Time of Compromise',pts:175,diff:3,flag:'CTF{'+inTime+'}',widget:'logs',
       body:`<p>Same log, new question. Incident reports need an exact <b>timeline</b>. At what time did the attacker's successful login happen? The flag is <code>CTF{HH:MM:SS}</code>, copied from the log line.</p><p>Hint for your investigation: after the login, what did the attacker do next? Search the log for <code>sudo</code> too.</p>`,
       wd:{lines:authLines,placeholder:'Filter the log…'},
       hints:['Search for the attacker\'s IP address and the word <code>Accepted</code> together, for example with regex on: <code>Accepted.*203</code>.','The time is the 3rd column of the line: after the date <code>Mar  2</code>.']},
      {id:'bt_scan',cat:'logs',title:'The Scanner',pts:175,diff:3,flag:'CTF{'+SCAN+'}',widget:'logs',
       body:`<p>Now the <b>web server access log</b>. Each line shows the visitor's IP address, the page they asked for and the <b>status code</b> (200 = found, 404 = not found, 500 = server error).</p><p>Someone is <b>probing the site for hidden pages</b>, so they ask for lots of things that do not exist. Filter for <code>404</code>. Which IP address generates by far the most 404 errors? The flag is <code>CTF{ip-address}</code>.</p>`,
       wd:{lines:web,placeholder:'Filter the log… (try 404)'},
       hints:['Search for <code>" 404 </code> (with the quote and spaces) so you do not match other numbers.','Most 404s come from one address, asking for names like /admin and /backup.zip. A normal visitor only gets one or two.']},
      {id:'bt_sqli',cat:'logs',title:'Spot the Injection',pts:200,diff:3,flag:'CTF{'+SQLI+'}',widget:'logs',
       body:`<p>Same web log. A different visitor is trying to attack the database behind the products page with <b>SQL injection</b>. In a log you can recognise it by odd characters in the address: an apostrophe (<code>'</code> or <code>%27</code>), words such as <code>UNION SELECT</code> and <code>OR '1'='1</code>. Spaces appear as <code>%20</code>.</p><p>Which IP address sent a request containing <code>UNION%20SELECT</code>? The flag is <code>CTF{ip-address}</code>.</p>`,
       wd:{lines:web,placeholder:'Filter the log… (try UNION)'},
       hints:['Search for <code>UNION</code>.','Notice the 500 status codes: the server errored as the attacker experimented. Then search for that IP to see everything it did.']},

      {id:'bt_ir',cat:'ir',title:'The Incident Response Lifecycle',pts:150,diff:2,flag:'CTF{prepare_detect_contain_eradicate_recover_learn}',widget:'order',
       body:`<p>Professionals follow a standard <b>incident response</b> process, so nobody has to improvise in a crisis. Put the six stages in order.</p>`,
       wd:{items:['<b>Prepare</b>: plans, tools and training before anything happens','<b>Detect and analyse</b>: spot the incident and work out what it is','<b>Contain</b>: stop it spreading','<b>Eradicate</b>: remove the cause (malware, bad accounts)','<b>Recover</b>: restore systems and check they are clean','<b>Learn</b>: review what happened and improve'],retry:'You cannot clean up something you have not stopped yet.'},
       hints:['Preparation happens before the incident. Lessons learned come last.','Containment (stopping the spread) comes before eradication (removing the cause).']},
      {id:'bt_contain',cat:'ir',title:'Ransom Note',pts:200,diff:3,flag:'CTF{isolate_then_report}',widget:'branch',
       body:`<p>It is your first week in the SOC. Make the calls, and aim for the response a good analyst would give. (There are several ways to go wrong. You can start again.)</p>`,
       wd:{start:'a',nodes:{
         a:{text:'<b>09:40.</b> A colleague phones you. Their PC is showing a message: <i>"Your files are encrypted. Pay to get them back."</i> What do you tell them to do first?',choices:[
           {t:'Pay quickly so everyone can get back to work',to:'l1'},{t:'Unplug the network cable (or turn off Wi-Fi) but leave the PC switched on',to:'b'},{t:'Delete the message and carry on working',to:'l2'},{t:'Restart the PC to see if it goes away',to:'l3'}]},
         b:{text:'Good: <b>isolating</b> the machine stops the infection reaching shared drives and other PCs. Next?',choices:[
           {t:'Report it to the incident manager with the time and what the user did',to:'c'},{t:'Wait until the end of the day in case it is nothing',to:'l4'}]},
         c:{text:'The security team traces it to a phishing attachment. The user\'s files can be restored from last night\'s <b>offline backup</b>. What is the best plan?',choices:[
           {t:'Wipe and rebuild the PC, then restore the files from the clean backup',to:'w'},{t:'Restore the files and plug it straight back in without rebuilding',to:'l5'},{t:'Download a free decryption tool from a random website',to:'l6'}]},
         w:{end:'win',text:'The infection is contained, reported, removed and recovered from, and no criminals were paid. The team will now add a lesson to the training: <i>never open unexpected attachments</i>.'},
         l1:{end:'lose',text:'Paying funds criminals, does not guarantee you get your files back, and marks you as a target who pays.'},
         l2:{end:'lose',text:'The ransomware keeps working in the background and spreads across the network.'},
         l3:{end:'lose',text:'Restarting can finish off the encryption and destroy evidence the team needs.'},
         l4:{end:'lose',text:'Every hour of delay lets the infection spread to more machines.'},
         l5:{end:'lose',text:'The malware is still on the machine and encrypts everything again.'},
         l6:{end:'lose',text:'Random "decryptors" are often more malware.'}}},
       hints:['The first goal is to stop it spreading, without destroying evidence.','Then tell the right people quickly. Finally, remove the cause, not just the symptom.']},
      {id:'bt_phishresp',cat:'ir',title:'I Clicked It',pts:175,diff:2,flag:'CTF{report_early_report_often}',widget:'branch',
       body:`<p>A user enters their password on a fake login page, then realises it was a phishing email. They come to you in a panic. Handle it well.</p>`,
       wd:{start:'a',nodes:{
         a:{text:'The user says: "I think I just gave my password to a fake website. What do I do?"',choices:[
           {t:'"It is probably fine. Wait and see."',to:'l1'},{t:'"Change your password from a trusted device (and anywhere else you reuse it), and I will log this."',to:'b'},{t:'"Delete the email so nobody finds out."',to:'l2'}]},
         b:{text:'The password is changed and the incident is logged. As an analyst, what else do you check?',choices:[
           {t:'Review recent logins on the account, sign out any active sessions, and make sure MFA is switched on',to:'w'},{t:'Close the ticket: the password is changed so we are done',to:'l3'}]},
         w:{end:'win',text:'You found no suspicious logins, ended any open sessions and added MFA. The user is thanked for reporting quickly: <i>fast reporting is what limits the damage</i>.'},
         l1:{end:'lose',text:'Waiting gives the attacker time to use the password. Minutes matter.'},
         l2:{end:'lose',text:'Hiding it means the real attack is never investigated, and other staff got the same email.'},
         l3:{end:'lose',text:'The attacker may already have signed in and set up forwarding or a hidden session. Changing the password alone does not end that.'}}},
       hints:['The user did the right thing by speaking up. The password must be changed straight away.','Think about what the attacker may already have done with the password before it was changed.']},

      {id:'bt_ioc',cat:'defend',title:'Indicators of Compromise',pts:150,diff:2,flag:'CTF{spot_the_indicators}',widget:'classify',
       body:`<p>An <b>indicator of compromise</b> (IoC) is a clue that a system may have been breached. Which of these should make an analyst look closer?</p>`,
       wd:{options:['Suspicious','Normal'],win:'trained eyes',retry:'Does it match how the business normally works?',items:[
         {t:'A new admin account created at 03:00 on a Sunday',a:0},{t:'A staff member logs in at 09:00 on a Monday',a:1},{t:'Gigabytes uploaded to an unknown server overnight',a:0},{t:'The scheduled nightly backup runs at 01:00',a:1},{t:'Antivirus is suddenly switched off on several PCs',a:0},{t:'A user changes their desktop wallpaper',a:1}]},
       hints:['Unusual accounts, unusual times and unusual data movements are suspicious.','Things that happen on a schedule and for a reason are usually normal.']},
      {id:'bt_controls',cat:'defend',title:'Layers of Defence',pts:150,diff:2,flag:'CTF{layers_of_defence}',widget:'classify',
       body:`<p>No single defence is enough, so organisations use <b>layers</b>. Security controls come in three kinds: <b>preventive</b> (stop it happening), <b>detective</b> (spot it happening) and <b>corrective</b> (fix things afterwards). Sort these.</p>`,
       wd:{options:['Preventive','Detective','Corrective'],win:'defence in depth',retry:'Stop it, spot it, or fix it?',items:[
         {t:'A firewall that blocks unwanted traffic',a:0},{t:'An alert when 50 logins fail in a minute',a:1},{t:'Restoring from a clean backup after ransomware',a:2},{t:'Multi-factor authentication on every account',a:0},{t:'CCTV in the server room',a:1},{t:'Installing a patch after a flaw is found',a:2}]},
       hints:['Alerts and cameras watch and report: they are detective.','Backups and fixes come after the event: corrective. Patching <i>before</i> an attack is preventive, but here the patch follows a discovered flaw.']},
      {id:'bt_passpol',cat:'defend',title:'Password Policy',pts:125,diff:2,flag:'CTF{good_passwords_good_policy}',widget:'classify',
       body:`<p>You are asked to review a company&rsquo;s password and login rules. Which are good practice and which are bad?</p>`,
       wd:{options:['Good practice','Bad practice'],win:'a sensible policy',retry:'Think about what helps an attacker.',items:[
         {t:'Block passwords that are on a list of commonly used ones',a:0},{t:'Allow unlimited login attempts',a:1},{t:'Offer multi-factor authentication',a:0},{t:'Store users&rsquo; passwords as plain text',a:1},{t:'Temporarily lock an account after repeated failed attempts',a:0},{t:'Email users their password if they forget it',a:1}]},
       hints:['Anything that lets attackers guess forever, or that exposes passwords in readable form, is bad.','Properly stored passwords are hashed, so even the company cannot read them.']},

      {id:'bt_chain',cat:'threat',title:'The Attacker\'s Journey',pts:175,diff:3,flag:'CTF{kill_chain_links}',widget:'classify',
       body:`<p>Attacks happen in stages, often called the <b>cyber kill chain</b>. Knowing the stages shows defenders where to break the chain. Match each action to its stage.</p>`,
       wd:{options:['Reconnaissance','Delivery','Installation','Command and control','Actions on objectives'],win:'break any link and the attack fails',retry:'Follow the story in order: research, deliver, install, control, achieve the goal.',items:[
         {t:'The attacker studies the company\'s staff on social media',a:0},{t:'A phishing email with a malicious attachment is sent',a:1},{t:'The malware sets itself up so it survives a reboot',a:2},{t:'The malware contacts the attacker&rsquo;s server for instructions',a:3},{t:'Customer data is copied out of the network',a:4}]},
       hints:['Reconnaissance is research and happens first. Stealing the data is the goal and happens last.','Delivery gets the malware to the victim. Installation puts it in place. Command and control is how the attacker talks to it.']}
    ]
  };
};
