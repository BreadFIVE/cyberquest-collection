/* CyberQuest: Network Navigator – networking fundamentals. Every address, device and command here is fictional and simulated in the page.
   For real practice afterwards, point students to TryHackMe's "Network Fundamentals" path or Cisco Packet Tracer (free for learners). */
module.exports=H=>{
  const dec=b=>parseInt(b,2);
  const BIN='11000000.10101000.00000001.00001010';
  const ipFromBin=BIN.split('.').map(dec).join('.');
  if(ipFromBin!=='192.168.1.10')throw new Error('network quest: binary puzzle changed');
  const netOf=(ip,len)=>{const p=ip.split('.').map(Number);let m=len,o=[];for(const x of p){const k=Math.min(8,Math.max(0,m));o.push(x&(256-(1<<(8-k))));m-=8}return o.join('.')};
  const SUBNET_NET=netOf('192.168.10.77',26);if(SUBNET_NET!=='192.168.10.64')throw new Error('network quest: subnet puzzle changed');
  const pingOk=(ip,ms)=>`PING ${ip} (${ip}) 56(84) bytes of data.\n`+[1,2,3,4].map(i=>`64 bytes from ${ip}: icmp_seq=${i} ttl=64 time=${(ms+i*0.3).toFixed(1)} ms`).join('\n')+`\n\n--- ${ip} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`;
  const pingBad=ip=>`PING ${ip} (${ip}) 56(84) bytes of data.\n`+[1,2,3,4].map(i=>`From 192.168.1.25 icmp_seq=${i} Destination Host Unreachable`).join('\n')+`\n\n--- ${ip} ping statistics ---\n4 packets transmitted, 0 received, +4 errors, 100% packet loss`;
  const ipA=`1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    link/ether 3c:52:82:aa:10:25 brd ff:ff:ff:ff:ff:ff\n    inet 192.168.1.25/24 brd 192.168.1.255 scope global eth0`;
  const ns=(n,ip)=>`Server:   192.168.1.1\nAddress:  192.168.1.1#53\n\nNon-authoritative answer:\nName:     ${n}\nAddress:  ${ip}`;
  const dnsBy={'intranet.halcyon.test':ns('intranet.halcyon.test','10.20.0.15'),'mail.halcyon.test':ns('mail.halcyon.test','10.20.0.25'),'www.halcyon.test':ns('www.halcyon.test','203.0.113.80')};
  const trace=`traceroute to 203.0.113.80 (203.0.113.80), 30 hops max
 1  gateway (192.168.1.1)  1.1 ms  0.9 ms  1.0 ms
 2  10.255.0.1  8.2 ms  8.0 ms  8.4 ms
 3  isp-edge.example.net (198.51.100.1)  11.9 ms  12.2 ms  11.7 ms
 4  isp-core.example.net (198.51.100.9)  13.1 ms  12.8 ms  13.4 ms
 5  peering-x.example.net (198.51.100.77)  412.6 ms  398.3 ms  405.9 ms
 6  203.0.113.1  414.0 ms  409.2 ms  411.8 ms
 7  203.0.113.80  415.3 ms  410.7 ms  413.1 ms`;
  const arp=`? (192.168.1.1) at aa:bb:cc:00:11:22 [ether] on eth0\n? (192.168.1.40) at 3c:52:82:11:2a:40 [ether] on eth0\n? (192.168.1.50) at 3c:52:82:7e:50:50 [ether] on eth0\n? (192.168.1.60) at 3c:52:82:7e:60:60 [ether] on eth0\n? (192.168.1.77) at aa:bb:cc:00:11:22 [ether] on eth0`;
  const netstat=`Active Internet connections (servers and established)
Proto Local Address          Foreign Address        State
tcp   0.0.0.0:22             0.0.0.0:*              LISTEN
tcp   0.0.0.0:80             0.0.0.0:*              LISTEN
tcp   0.0.0.0:443            0.0.0.0:*              LISTEN
tcp   0.0.0.0:4444           0.0.0.0:*              LISTEN
tcp   192.168.1.25:51022     142.250.180.14:443     ESTABLISHED
tcp   192.168.1.25:51030     151.101.1.69:443       ESTABLISHED`;

  const lab={
    tab:'Network Lab',bar:'student@office-pc',
    intro:'A simulated computer on a small office network. The addresses and devices are <b>made up</b>: nothing here touches a real network. Read <code>network_notes.txt</code> first, then type <code>help</code> to see the diagnostic commands you can run.',
    data:{local:{
      plain:true,protect:['/home/student/network_notes.txt'],name:'office-pc',home:'/home/student',user:'student',
      tree:{'/':['home'],'/home':['student'],'/home/student':['network_notes.txt'],
        '/home/student/network_notes.txt':`OFFICE NETWORK NOTES
Network:   192.168.1.0/24
gateway    192.168.1.1    (router, also the DNS server)
laptop     192.168.1.40
printer    192.168.1.50
nas        192.168.1.60   (file storage)
internet   8.8.8.8        (a public DNS server, handy for testing)
web        www.halcyon.test   (our public website)
intranet   intranet.halcyon.test`},
      welcome:'You are on office-pc. Read network_notes.txt, then try: ip a, ping, nslookup, traceroute, arp -a, netstat. Type "help" for the list.\n',
      help:`Network diagnostic commands (simulated):
  ip a  (or ifconfig)        show this computer's addresses
  ping <host or ip>          is that device reachable?
  nslookup <name>            turn a name into an IP address (DNS)
  traceroute <ip>            show each hop on the way to a destination
  arp -a                     which MAC address belongs to which IP on this network
  netstat -an                open ports and current connections
  cat network_notes.txt  ls  clear`,
      cmds:{
        ip:{by:{a:ipA,addr:ipA,address:ipA},default:'Usage: ip a'},ifconfig:ipA,
        ping:{by:{'192.168.1.1':pingOk('192.168.1.1',0.6),'192.168.1.40':pingOk('192.168.1.40',1.2),'192.168.1.50':pingBad('192.168.1.50'),'192.168.1.60':pingOk('192.168.1.60',1.4),'8.8.8.8':pingOk('8.8.8.8',14.2),'127.0.0.1':pingOk('127.0.0.1',0.04),'www.halcyon.test':pingOk('203.0.113.80',22.6)},default:'ping: connect: Network is unreachable (check the address)'},
        nslookup:{by:dnsBy,default:"** server can't find that name: NXDOMAIN  (try the names in network_notes.txt)"},dig:{by:dnsBy,default:"status: NXDOMAIN (no such name)"},
        traceroute:{by:{'203.0.113.80':trace,'www.halcyon.test':trace},default:'traceroute: unknown destination. Try the web server address from network_notes.txt.'},
        arp:arp,netstat:netstat,ss:netstat
      }
    }}
  };

  return {
    id:'network',name:'Network Navigator',subtitle:'Networking fundamentals edition',icon:'📡',accent:'#3dd6d0',minutes:90,
    viewSourceFlag:'CTF{network_starts_with_view_source}',
    blurb:'IP addresses, subnets, ports, protocols, the layers of the internet, and a simulated lab of real diagnostic tools.',
    lead:'A 90-minute tour of how computers talk to each other: addresses, devices, ports, protocols and the layers they sit on. Then use ping, nslookup, traceroute and friends on a simulated office network to find what is wrong.',
    rulesExtra:['The <b>Network Lab</b> tab is a simulated computer on a pretend office network. It runs only the commands listed under <code>help</code>.','The <b>Toolkit</b> tab has a binary and decimal converter that helps with the number puzzles.'],
    pacing:[['0–10 min','Warm-up, then ports and devices.'],['10–40 min','Addresses and numbers: binary, private ranges, MAC vs IP, subnets.'],['40–60 min','Protocols and models: TCP vs UDP, the handshake and the layers.'],['60–85 min','The Network Lab: use real diagnostic tools to solve four faults.'],['85–90 min','Topologies, wireless security and firewall rules.']],
    tips:['For subnet maths, write the block sizes down: 128, 64, 32, 16, 8, 4, 2, 1.','In the lab, work like an engineer: gather evidence with one command, then decide what to try next.'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      addr:{name:'Addresses & Numbers',icon:'🔢',blurb:'IP, MAC and subnets'},
      proto:{name:'Protocols & Ports',icon:'📬',blurb:'The rules computers follow'},
      layers:{name:'Models & Layers',icon:'🥞',blurb:'How data travels'},
      tools:{name:'Network Detective',icon:'🕵️',blurb:'Diagnose the office network'},
      hw:{name:'Devices & Design',icon:'🖧',blurb:'Kit and layouts'},
      sec:{name:'Defence',icon:'🛡️',blurb:'Keep the network safe'}
    },
    lab,
    challenges:[
      {id:'nw_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{network_starts_with_view_source}',
       body:`<p>Right-click this page and choose <b>"View Page Source"</b> (or press <code>Ctrl+U</code>). Near the top of the HTML there is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'nw_ports',cat:'intro',title:'Doors on the Computer',pts:100,diff:1,flag:'CTF{ports_are_doors}',widget:'classify',
       body:`<p>An IP address finds the right <i>computer</i>. A <b>port number</b> finds the right <i>service</i> on it, like a door number on a building. Services have well-known ports. Match each port to its service.</p>`,
       wd:{options:['HTTP (web)','HTTPS (secure web)','SSH (secure remote login)','SMTP (sending email)','DNS (name lookups)','FTP (file transfer)'],win:'you know your doors',retry:'Each service is used exactly once.',items:[
         {t:'Port <code>80</code>',a:0},{t:'Port <code>443</code>',a:1},{t:'Port <code>22</code>',a:2},{t:'Port <code>25</code>',a:3},{t:'Port <code>53</code>',a:4},{t:'Port <code>21</code>',a:5}]},
       hints:['The "S" in HTTPS means secure, and it uses 443. Plain HTTP is 80.','SSH is 22, FTP is 21, DNS is 53, SMTP is 25.']},
      {id:'nw_devices',cat:'hw',title:'Right Tool, Right Job',pts:100,diff:1,flag:'CTF{right_tool_right_job}',widget:'classify',
       body:`<p>Match each piece of network equipment or service to its job.</p>`,
       wd:{options:['Passes traffic between different networks, using IP addresses','Connects devices inside one network, using MAC addresses','Allows or blocks traffic using rules','Turns names like www.example.com into IP addresses','Hands out IP addresses automatically'],win:'good engineers know their kit',retry:'Each job is used exactly once.',items:[
         {t:'Router',a:0},{t:'Switch',a:1},{t:'Firewall',a:2},{t:'DNS server',a:3},{t:'DHCP server',a:4}]},
       hints:['A switch works inside one network. A router joins networks together.','DNS handles names. DHCP handles addresses.']},

      {id:'nw_binary',cat:'addr',title:'Binary Address',pts:125,diff:2,flag:'CTF{'+ipFromBin+'}',
       body:`<p>Computers store an IPv4 address as 32 bits, shown in four groups of 8 (called <b>octets</b>). Here is one in binary:</p><pre class="code">${BIN}</pre><p>Convert each octet to decimal and join them with dots. Place values for 8 bits are <code>128 64 32 16 8 4 2 1</code>. The flag is <code>CTF{a.b.c.d}</code>.</p>`,
       hints:['Add up the place values wherever there is a 1. For <code>11000000</code> that is 128 + 64.','The first octet is 192. The Toolkit has a binary converter if you want to check your sums.']},
      {id:'nw_private',cat:'addr',title:'Private or Public?',pts:100,diff:2,flag:'CTF{private_means_not_routable}',widget:'classify',
       body:`<p>Some address ranges are reserved for <b>private</b> use inside homes and offices. They are not routed across the internet. The private ranges are <code>10.0.0.0&ndash;10.255.255.255</code>, <code>172.16.0.0&ndash;172.31.255.255</code> and <code>192.168.0.0&ndash;192.168.255.255</code>. Everything else is public. Classify each address.</p>`,
       wd:{options:['Private','Public'],win:'you know the ranges',retry:'Check the second number for 172 and 192.',items:[
         {t:'<code>10.4.5.6</code>',a:0},{t:'<code>172.16.20.1</code>',a:0},{t:'<code>172.32.0.1</code>',a:1},{t:'<code>192.168.0.254</code>',a:0},{t:'<code>8.8.8.8</code>',a:1},{t:'<code>192.169.1.1</code>',a:1}]},
       hints:['Only 172.16 to 172.31 is private in the 172 range. 172.32 is outside it.','192.168.x.x is private. 192.169.x.x is not.']},
      {id:'nw_mac',cat:'addr',title:'MAC or IP?',pts:100,diff:2,flag:'CTF{macs_stay_ips_move}',widget:'classify',
       body:`<p>Every network card has a <b>MAC address</b>. Every device on a network also has an <b>IP address</b>. They do different jobs. Classify each statement.</p>`,
       wd:{options:['MAC address','IP address'],win:'two addresses, two jobs',retry:'Think: which one is built in, and which one is given out by the network?',items:[
         {t:'Set by the manufacturer of the network card',a:0},{t:'Changes when you join a different Wi-Fi network',a:1},{t:'Looks like <code>3c:52:82:aa:10:25</code>',a:0},{t:'Used by routers to send data between networks',a:1},{t:'Used by a switch to deliver a frame inside one network',a:0},{t:'Comes in IPv4 and IPv6 versions',a:1}]},
       hints:['MAC addresses are 48 bits written in hex. They are fixed to the hardware (though they can be changed in software).','IP addresses depend on which network you are on.']},
      {id:'nw_subnet',cat:'addr',title:'Which Network?',pts:175,diff:3,flag:'CTF{'+SUBNET_NET+'}',
       body:`<p>A <b>subnet mask</b> says which part of an address is the network and which part is the device. <code>/26</code> means the first 26 bits are the network. That leaves 6 bits for devices, so networks come in blocks of 2<sup>6</sup> = <b>64</b> addresses in the last octet: 0&ndash;63, 64&ndash;127, 128&ndash;191, 192&ndash;255.</p><p>A device has the address <code>192.168.10.77/26</code>. What is its <b>network address</b> (the first address of its block)? The flag is <code>CTF{a.b.c.d}</code>.</p>`,
       hints:['Which block of 64 does 77 fall in?','The blocks start at 0, 64, 128 and 192. 77 is between 64 and 127.']},

      {id:'nw_tcpudp',cat:'proto',title:'Reliable or Fast?',pts:125,diff:2,flag:'CTF{reliable_or_fast}',widget:'classify',
       body:`<p><b>TCP</b> checks that every piece arrives, in order, and re-sends anything lost. It is reliable but has more overhead. <b>UDP</b> just sends and hopes. It is faster and lighter. Which does each job suit better?</p>`,
       wd:{options:['TCP','UDP'],win:'you can pick the right protocol',retry:'Ask: does every single byte matter, or is speed more important?',items:[
         {t:'Downloading a file where every byte must arrive',a:0},{t:'A live video call, where a late packet is useless',a:1},{t:'Loading a web page',a:0},{t:'Sending player positions in an online game',a:1},{t:'Sending an email',a:0},{t:'A quick DNS lookup',a:1}]},
       hints:['Live and time-sensitive usually means UDP. Complete and correct usually means TCP.','DNS questions are tiny and can simply be asked again, so UDP is fine.']},
      {id:'nw_handshake',cat:'proto',title:'The Three-Way Handshake',pts:125,diff:2,flag:'CTF{three_way_handshake}',widget:'order',
       body:`<p>Before TCP sends any data, the two computers agree to talk with a <b>three-way handshake</b>. Put the steps in order.</p>`,
       wd:{items:['Client sends <b>SYN</b>: "Can we talk?"','Server replies <b>SYN-ACK</b>: "Yes. Can you hear me?"','Client sends <b>ACK</b>: "Yes, I can hear you."','The real data starts to flow'],retry:'SYN, then SYN-ACK, then ACK.'},
       hints:['It starts with SYN (synchronise).','The server answers with two things in one: SYN and ACK.']},
      {id:'nw_layers',cat:'layers',title:'Down the Stack',pts:150,diff:2,flag:'CTF{four_layers_down}',widget:'order',
       body:`<p>When you load a web page, your request travels <b>down</b> the four layers of the TCP/IP model on your computer. Each layer adds its own information. Put the layers in the order the data passes through them, starting at the top.</p>`,
       wd:{items:['<b>Application</b>: the web browser creates the HTTP request','<b>Transport</b>: TCP splits it into segments and adds port numbers','<b>Internet</b>: IP wraps each segment in a packet with IP addresses','<b>Network access</b>: the data becomes frames with MAC addresses, then signals on the wire'],retry:'The browser is at the top. The cable is at the bottom.'},
       hints:['Start with what the user sees (the application) and finish with the physical link.','Ports belong to transport. IP addresses belong to the internet layer.']},
      {id:'nw_osi',cat:'layers',title:'The OSI Layers',pts:150,diff:3,flag:'CTF{please_do_not_throw_sausage_pizza_away}',widget:'classify',
       body:`<p>The 7-layer <b>OSI model</b> is another way to describe networks. Match five of its layers to what they deal with. (A memory trick, from layer 1 up: <i>Please Do Not Throw Sausage Pizza Away</i>: Physical, Data link, Network, Transport, Session, Presentation, Application.)</p>`,
       wd:{options:['Cables, Wi-Fi signals and voltages','MAC addresses and switches','IP addresses and routers','TCP, UDP and port numbers','HTTP, DNS and email protocols'],win:'layers sorted',retry:'Work upwards: cables first, applications last.',items:[
         {t:'Layer 1: Physical',a:0},{t:'Layer 2: Data link',a:1},{t:'Layer 3: Network',a:2},{t:'Layer 4: Transport',a:3},{t:'Layer 7: Application',a:4}]},
       hints:['Layer 2 is where MAC addresses and switches live. Layer 3 is IP and routers.','Layer 4 is the one with ports.']},

      {id:'nw_ip',cat:'tools',title:'What Is My Address?',pts:100,diff:1,flag:'CTF{192.168.1.25}',
       body:`<p>Open the <b>Network Lab</b>. The first job in any fault-finding is to check the computer's own network settings. Run:</p><pre class="code">ip a</pre><p>Find the <code>inet</code> line for <code>eth0</code>. The flag is <code>CTF{ip-address}</code> (the address only, without the <code>/24</code>).</p>`,
       hints:['Ignore the <code>lo</code> (loopback) interface. Look under <code>eth0</code>.','The line reads <code>inet 192.168.1.25/24 ...</code>.']},
      {id:'nw_ping',cat:'tools',title:'Who Is Not Answering?',pts:150,diff:2,flag:'CTF{192.168.1.50}',
       body:`<p>Staff say they cannot print, or reach the file store, or the internet. Use <code>ping</code> to test each device listed in <code>network_notes.txt</code> (<code>cat network_notes.txt</code>):</p><pre class="code">ping 192.168.1.1</pre><p><code>ping</code> sends a small test message and waits for a reply. Test the gateway, the laptop, the printer, the NAS and the internet address. <b>Exactly one</b> does not answer. The flag is <code>CTF{ip-address-of-that-device}</code>.</p>`,
       hints:['Look for "Destination Host Unreachable" and "100% packet loss".','Work through the list in the notes file one device at a time.']},
      {id:'nw_dns',cat:'tools',title:'Name to Number',pts:125,diff:2,flag:'CTF{10.20.0.15}',
       body:`<p>People use names. Computers use numbers. <b>DNS</b> translates between them. Use <code>nslookup</code> to find the IP address of the company intranet:</p><pre class="code">nslookup intranet.halcyon.test</pre><p>The flag is <code>CTF{ip-address}</code>.</p>`,
       hints:['The answer is on the line starting <code>Address:</code> after <code>Name:</code>. The first "Address" belongs to the DNS server itself.','The intranet server is a private address starting with 10.']},
      {id:'nw_trace',cat:'tools',title:'Where Is It Slow?',pts:175,diff:3,flag:'CTF{5}',
       body:`<p>The public website <code>www.halcyon.test</code> is painfully slow. <code>traceroute</code> lists every router (<b>hop</b>) between you and the destination, with the time each took:</p><pre class="code">traceroute 203.0.113.80</pre><p>Find the hop where the delay suddenly jumps and stays high. That is where the problem starts. The flag is <code>CTF{hop-number}</code>.</p>`,
       hints:['Times should creep up gently. Look for the first big jump, from around 13 ms to hundreds.','Read the number at the start of that line.']},
      {id:'nw_arp',cat:'tools',title:'Two Faces',pts:175,diff:3,flag:'CTF{192.168.1.77}',
       body:`<p>The <b>ARP table</b> records which MAC address belongs to which IP address on your network. Every device should have its <b>own</b> MAC. Run:</p><pre class="code">arp -a</pre><p>One device, not the gateway, is claiming the <b>same MAC address as the gateway</b> (<code>192.168.1.1</code>). That is a classic sign of <i>ARP spoofing</i>: someone pretending to be the router so they can read other people's traffic. The flag is <code>CTF{ip-address-of-the-imposter}</code>.</p>`,
       hints:['Find the gateway row and note its MAC address (the part like <code>aa:bb:cc:...</code>).','Look for another IP in the list with an identical MAC.']},
      {id:'nw_netstat',cat:'tools',title:'Unexpected Listener',pts:175,diff:3,flag:'CTF{4444}',
       body:`<p>This office machine should only be running a web server (ports 80 and 443) and remote login (SSH, 22). <code>netstat</code> shows the ports it is listening on and its current connections:</p><pre class="code">netstat -an</pre><p>One <b>LISTEN</b>ing port does not belong. An unexpected open port can mean unwanted software is waiting for connections. The flag is <code>CTF{port-number}</code>.</p>`,
       hints:['Ignore the lines marked ESTABLISHED. You want lines marked LISTEN.','Three of the four listening ports are normal services you already know.']},

      {id:'nw_topology',cat:'hw',title:'Network Shapes',pts:100,diff:1,flag:'CTF{star_is_the_standard}',widget:'classify',
       body:`<p>The way devices are connected is the <b>topology</b>. Match each description to its shape.</p>`,
       wd:{options:['Star','Bus','Ring','Mesh'],win:'you know your shapes',retry:'Each shape is used once.',items:[
         {t:'Every device connects to one central switch',a:0},{t:'All devices share one backbone cable',a:1},{t:'Each device connects to two neighbours, forming a loop',a:2},{t:'Devices connect directly to many other devices, so there are many routes',a:3}]},
       hints:['Most modern offices use a star, with a switch in the middle.','A mesh is the most resilient because there are many routes.']},
      {id:'nw_wifi',cat:'sec',title:'Wi-Fi Security',pts:125,diff:2,flag:'CTF{wep_is_dead}',widget:'classify',
       body:`<p>Not all Wi-Fi protection is equal. Rate each setup.</p>`,
       wd:{options:['Strong','Weak','Dangerous'],win:'you would make a good network admin',retry:'WEP is very old. Hiding a name is not security.',items:[
         {t:'WPA3 with a long, unique password',a:0},{t:'WPA2 with a short, common password',a:1},{t:'WEP (an old standard)',a:2},{t:'An open network with no password',a:2},{t:'Hiding the network name as the only protection',a:2}]},
       hints:['WEP can be broken in minutes. It should never be used.','A hidden network name still shows up to anyone who looks. It does not encrypt anything.']},
      {id:'nw_firewall',cat:'sec',title:'Follow the Rules',pts:175,diff:3,flag:'CTF{default_deny}',widget:'classify',
       body:`<p>A firewall checks each packet against its rules <b>from the top down</b> and uses the first rule that matches. This firewall protects the office network <code>192.168.1.0/24</code>. The web server is <code>192.168.1.10</code>.</p><pre class="code">1  ALLOW  TCP  from anywhere      to 192.168.1.10  port 80
2  ALLOW  TCP  from anywhere      to 192.168.1.10  port 443
3  ALLOW  TCP  from 192.168.1.0/24 to anywhere      port 22
4  DENY   everything else</pre><p>Decide what happens to each packet.</p>`,
       wd:{options:['Allowed','Blocked'],win:'a final DENY rule means "default deny"',retry:'Go down the rules in order. If nothing matches, rule 4 applies.',items:[
         {t:'From the internet to <code>192.168.1.10</code> port 443',a:0},{t:'From the internet to <code>192.168.1.10</code> port 22',a:1},{t:'From <code>192.168.1.40</code> to a server on the internet, port 22',a:0},{t:'From the internet to <code>192.168.1.10</code> port 23 (telnet)',a:1},{t:'From the internet to <code>192.168.1.10</code> port 80',a:0},{t:'From the internet to <code>192.168.1.20</code> port 443',a:1}]},
       hints:['Rules 1 and 2 only allow ports 80 and 443 to the web server <code>192.168.1.10</code>, not to other machines.','Rule 3 only applies to traffic that starts inside the office network.']}
    ]
  };
};
