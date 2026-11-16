/* CyberQuest: Human Firewall – social engineering. All organisations, people and messages are fictional. */
module.exports=H=>{
  const mail=(from,s,b,a)=>({from,s,b,a});
  const link=t=>`<a href="#" onclick="return false">${t}</a>`;
  return {
    id:'social',name:'Human Firewall',subtitle:'Social engineering edition',icon:'🎣',accent:'#ff6fb5',minutes:90,
    viewSourceFlag:'CTF{social_engineering_starts_with_people}',
    blurb:'Phishing, smishing, psychological tricks, tailgating, phone scams and how people stop them.',
    lead:'A 90-minute deep dive into social engineering: the art of hacking people instead of computers. Spot the scams, understand the psychology behind them, and practise handling live phone calls under pressure.',
    rulesExtra:['No special tools needed. This quest is about <b>noticing, thinking and responding</b>. Read every detail, and ask yourself what the sender really wants you to do.','Some challenges are role-plays: you play the person on the receiving end. You can restart them as often as you like.'],
    pacing:[['0–10 min','Warm-up: view source, then the phishing email sorter.'],['10–40 min','Messages and the psychology: smishing, the six red flags, and the five levers of influence.'],['40–75 min','In person and on the phone: doors, USB sticks, bins, MFA bombing, and two live call scenarios.'],['75–90 min','Defence: match every attack to its counter-measure. Use hints on anything left.']],
    tips:['The real attacker never announces themselves. Look for what the message <b>wants you to do</b>, not just how it looks.','Words in flags are lowercase, joined with underscores.'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      messages:{name:'Phishing & Smishing',icon:'📧',blurb:'Messages that bite'},
      psych:{name:'The Psychology',icon:'🧠',blurb:'Why it works'},
      person:{name:'In Person',icon:'🚪',blurb:'Doors, USB sticks and bins'},
      calls:{name:'Phone Calls',icon:'☎️',blurb:'Keep your head under pressure'},
      defence:{name:'Defence',icon:'🛡️',blurb:'Be the human firewall'}
    },
    challenges:[
      {id:'se_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{social_engineering_starts_with_people}',
       body:`<p>Even social engineers start by looking at what is in front of them. Right-click this page and choose <b>"View Page Source"</b> (or press <code>Ctrl+U</code>). Near the top of the HTML there is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'se_phish',cat:'intro',title:'Spot the Phish',pts:175,diff:2,flag:'CTF{stop_think_report}',widget:'phish',
       body:`<p>Six emails landed in a college inbox. Some are real, some are phishing. Classify every one. Check the sender address character by character, the urgency, the greeting, and what each email actually asks you to do.</p>`,
       wd:{mails:[
         mail('Halcyon Bank Security &lt;alerts@halcyon-bank-secure.example&gt;','⚠ Unusual sign-in. Verify within 1 hour or your account will be locked','Dear customer, we noticed a sign-in from a new device. '+link('Verify your identity now')+' or access to your account will be suspended.','P'),
         mail('College IT Service Desk &lt;it-helpdesk@halcyon-college.example&gt;','Planned maintenance: Saturday 02:00 to 04:00','Hi all, student email will be unavailable for two hours this Saturday while we install updates. No action is needed. See the status page on the intranet for details. IT Service Desk','L'),
         mail('ParcelDash &lt;tracking@parcel-dlvr.example&gt;','You missed a delivery. Pay £1.99 to rearrange','We could not deliver your parcel. '+link('Pay the redelivery fee now')+' (card details required) or it will be returned to the sender.','P'),
         mail('Mr J. Patel &lt;j.patel@halcyon-college.example&gt;','Timetable change for Tuesday','Hi all, group B moves to room 14 on Tuesday. You can see the full timetable on the student page you normally use. Mr Patel','L'),
         mail('StreamingPlus Billing &lt;billing@streamingplus-accounts.example&gt;','Payment failed','Dear Customer, your last payment could not be taken. '+link('Update your payment details')+' to keep your subscription.','P'),
         mail('College Library &lt;library@halcyon-college.example&gt;','Your reserved book is ready to collect','Hello, the book you reserved is ready at the library desk until Friday. Bring your student card. No need to reply.','L')]},
       hints:['Compare each sender domain with the real organisation. Look for extra words, swapped letters or a different ending.','Phishing: the bank alert, the parcel fee, and the streaming billing email (note the generic &ldquo;Dear Customer&rdquo; and the look-alike sender domain).']},

      {id:'se_smish',cat:'messages',title:'Text Message Trap',pts:125,diff:2,flag:'CTF{texts_can_phish_too}',widget:'phish',
       body:`<p><b>Smishing</b> is phishing by SMS. It works because people trust their phones and read texts quickly. Decide which of these four messages are scams.</p>`,
       wd:{noun:'text message',mails:[
         mail('+44 7700 900441 (shown as &ldquo;HMRC&rdquo;)','','You are owed a tax refund of £312. Claim within 24 hours: '+link('hmrc-refund.example/claim'),'P'),
         mail('Halcyon Dental (a number saved in your phone)','','Reminder: your appointment is tomorrow at 10:30. Reply YES to confirm or ring reception if you need to change it.','L'),
         mail('Unknown number','','Hi mum, I dropped my phone in the sink so this is my new number. Can you transfer £250 to this account for me? I will pay you back, promise x','P'),
         mail('Your bank','','A payment of £24.99 to StreamingPlus was made on your card. If this was not you, call the number on the back of your card.','L')]},
       hints:['A genuine message rarely asks you to click, pay or rush. Ask what each one wants you to do.','The two scams ask you for a click or money. The genuine messages send you to a number you already trust (reception or your own card).']},
      {id:'se_flags',cat:'messages',title:'Six Red Flags',pts:125,diff:2,flag:'CTF{six_red_flags}',widget:'classify',
       body:`<p>Scam messages share the same warning signs. Match each snippet to the red flag it shows. Each flag is used exactly once.</p>`,
       wd:{options:['Urgency','Fake authority','Too good to be true','Request for secrecy','Unusual payment method','Mismatched sender'],win:'you can name every red flag',retry:'Each red flag is used once. Start with the ones that are clearest.',items:[
         {t:'&ldquo;You must act within 30 minutes or your account will be closed.&rdquo;',a:0},
         {t:'&ldquo;This is the Principal. I need this done now. Do not question me.&rdquo;',a:1},
         {t:'&ldquo;You have won a £500 voucher for completing this two-minute survey!&rdquo;',a:2},
         {t:'&ldquo;Please keep this between us for now.&rdquo;',a:3},
         {t:'&ldquo;Buy five gift cards and send me the codes.&rdquo;',a:4},
         {t:'From: <code>it-support@halcyon-college.example.help-desk-verify.net</code>',a:5}]},
       hints:['The sender line is the odd one out. It is about the address, not the words.','Gift cards and codes are a payment method nobody can trace or reverse. Real organisations do not ask for them.']},
      {id:'se_cialdini',cat:'psych',title:'Levers of Influence',pts:150,diff:2,flag:'CTF{influence_is_a_weapon}',widget:'classify',
       body:`<p>Psychologist Robert Cialdini described the principles that make people say yes. Social engineers use them on purpose. Match each line to the principle it is exploiting.</p><ul class="rules"><li><b>Authority</b>: we obey people who seem important.</li><li><b>Urgency</b>: we act quickly when time is short.</li><li><b>Reciprocity</b>: we feel we owe someone who did us a favour.</li><li><b>Social proof</b>: we copy what everyone else is doing.</li><li><b>Liking</b>: we say yes to people we like or who are like us.</li></ul>`,
       wd:{options:['Authority','Urgency','Reciprocity','Social proof','Liking'],win:'you can see the levers',retry:'Each principle is used exactly once.',items:[
         {t:'&ldquo;The Principal needs this now. You do not want to be the one who let her down.&rdquo;',a:0},
         {t:'&ldquo;Only three hours left to respond, or your mailbox will be deleted.&rdquo;',a:1},
         {t:'&ldquo;I carried your boxes upstairs. Could you do me one tiny favour with your login?&rdquo;',a:2},
         {t:'&ldquo;Everyone else in your department has already updated their details. You are the last.&rdquo;',a:3},
         {t:'&ldquo;No way, you support Sunderland too? Small world! By the way, what is the Wi-Fi password?&rdquo;',a:4}]},
       hints:['Reciprocity is about repaying a favour. Social proof is about what <i>other people</i> have done.','Liking uses a shared interest to lower your guard.']},
      {id:'se_life',cat:'psych',title:'Anatomy of an Attack',pts:100,diff:1,flag:'CTF{plan_then_pounce}',widget:'order',
       body:`<p>Social engineering attacks are rarely spur-of-the-moment. A typical attack follows a lifecycle. Put the stages in the order an attacker would do them.</p>`,
       wd:{items:['<b>Research</b> the target using public information (OSINT)','<b>Build a pretext</b>: invent a believable story and identity','<b>Make contact</b> and build trust with the target','<b>Make the request</b> and exploit the access or information gained','<b>Disappear</b> and cover their tracks'],retry:'Think about what an attacker has to know before they can pick up the phone.'},
       hints:['You cannot invent a convincing story until you know who you are talking to.','Trust has to be built before the request, and covering tracks comes at the end.']},

      {id:'se_door',cat:'person',title:'Door Dilemma',pts:125,diff:2,flag:'CTF{no_badge_no_entry}',widget:'classify',
       body:`<p><b>Tailgating</b> means following someone through a secure door without using your own badge. It works because people are polite. Decide the best response to each situation.</p>`,
       wd:{options:['Politely challenge or escort to reception','Report to security','Hold the door open'],win:'you know how to handle a door',retry:'Politeness is good. Letting strangers in is not.',items:[
         {t:'A smiling person with arms full of boxes asks you to hold the secure door. No badge in sight.',a:0},
         {t:'Someone in a hi-vis jacket says they are &ldquo;from the lift company&rdquo; and just need to get to the server room.',a:0},
         {t:'A person wearing a <i>Visitor</i> badge is wandering alone near the server room.',a:1},
         {t:'A colleague you know well has forgotten their badge.',a:0},
         {t:'You and a coworker both tap your own badges and the door opens for each of you.',a:2}]},
       hints:['Someone who has used their own badge is not tailgating. Someone who has not should be taken to reception to get a temporary one, however nice they are.','A visitor on their own near sensitive areas is a security matter, not just a politeness matter.']},
      {id:'se_usb',cat:'person',title:'Found in the Car Park',pts:100,diff:1,flag:'CTF{dont_plug_it_in}',widget:'classify',
       body:`<p>You find a USB stick in the car park labelled <i>"Payroll 2026"</i>. Attackers deliberately leave devices like this, hoping curiosity beats caution. Decide whether each reaction is a good idea.</p>`,
       wd:{options:['Good idea','Bad idea'],win:'curiosity did not win',retry:'Think about what could be on the stick, and which computer you would be trusting.',items:[
         {t:'Plug it into your work computer to find out who it belongs to',a:1},
         {t:'Hand it to IT or security without plugging it in',a:0},
         {t:'Take it home and try it on your own laptop',a:1},
         {t:'Tell IT where you found it and when',a:0}]},
       hints:['A stick can run programs the moment it is plugged in, on any computer.','The safe route is to put it in the hands of people who can examine it safely, and to let them know where it came from.']},
      {id:'se_bin',cat:'person',title:'Bin Diving',pts:100,diff:1,flag:'CTF{shred_it_all}',widget:'classify',
       body:`<p>Attackers sometimes search rubbish bins ("dumpster diving") for information. Decide what should be shredded and what is safe to bin or recycle.</p>`,
       wd:{options:['Shred it','Safe to bin or recycle'],win:'nothing useful left in the bin',retry:'Ask whether it names people, passwords, customers or internal systems.',items:[
         {t:'A printed staff phone list with names and job titles',a:0},
         {t:'A sticky note with the Wi-Fi password',a:0},
         {t:'A takeaway menu',a:1},
         {t:'A draft invoice with a customer&rsquo;s name and address',a:0},
         {t:'An empty coffee cup',a:1},
         {t:'A visitor sign-in sheet',a:0}]},
       hints:['Names, contact details and passwords are the raw material for a convincing pretext.','Menus and coffee cups tell an attacker nothing about your organisation.']},

      {id:'se_mfa',cat:'calls',title:'Notification Storm',pts:100,diff:2,flag:'CTF{deny_and_report}',widget:'classify',
       body:`<p>At 2 a.m. your phone buzzes with <b>twelve</b> multi-factor authentication approval requests you did not start. Then a text arrives: <i>"IT here, please approve the next prompt so we can stop the alerts."</i> This is <b>MFA fatigue</b>: the attacker already has your password and is hoping you give in. How should you react?</p>`,
       wd:{options:['Right response','Wrong response'],win:'you did not give in',retry:'The attacker needs just one approval. What denies them it?',items:[
         {t:'Approve one prompt so they stop',a:1},
         {t:'Deny every prompt and report it to IT straight away',a:0},
         {t:'Change your password afterwards, from a device you trust',a:0},
         {t:'Read out the code to a caller who says they are from IT',a:1},
         {t:'Ignore it, it is probably a glitch',a:1}]},
       hints:['The prompts only appear because someone has your password. Approving even one gives them the account.','Real IT will never ask you to approve a prompt or read out a code.']},
      {id:'se_call',cat:'calls',title:'The Helpdesk Call',pts:200,diff:3,flag:'CTF{verify_before_you_reset}',widget:'branch',
       body:`<p>You are a junior technician on the IT helpdesk. The phone rings. Choose your responses. You can start again as often as you like. Find the way to handle the call safely.</p>`,
       wd:{start:'a',nodes:{
         a:{text:'<b>Caller:</b> &ldquo;Hi, it&rsquo;s Mark from the Executive Office. Mr Davies, our CFO, is locked out of his laptop just before the board meeting. Can you reset his password to <i>Welcome2026</i> and read it back to me? He&rsquo;ll be furious if this isn&rsquo;t done in two minutes. And please don&rsquo;t log it as a ticket.&rdquo;',choices:[
           {t:'Do it quickly: a senior person is waiting',to:'lose1'},
           {t:'&ldquo;Sorry, I need to verify you first. I&rsquo;ll call you back on the number in the staff directory.&rdquo;',to:'b'},
           {t:'Read out a hint for his current password so he can remember it',to:'lose2'}]},
         b:{text:'<b>Caller:</b> &ldquo;There&rsquo;s no time for that! If Mr Davies hears you refused, there will be consequences. Just reset it!&rdquo;',choices:[
           {t:'Give in just this once, since he sounds stressed',to:'lose1'},
           {t:'Hold firm: &ldquo;I understand it&rsquo;s urgent. I&rsquo;ll call you straight back on the directory number, and Mr Davies can use the self-service reset or come to the desk. I&rsquo;ll log this either way.&rdquo;',to:'win'}]},
         lose1:{end:'lose',text:'You reset the password and read it out. &ldquo;Mark&rdquo; was an attacker who had found the CFO&rsquo;s name on the company website. Within an hour, the CFO&rsquo;s mailbox was being used to send fake payment requests to suppliers.'},
         lose2:{end:'lose',text:'The hint gave the attacker a big head start. Combined with details from social media, they guessed the password within minutes.'},
         win:{end:'win',text:'You politely refused, called the real directory number, and nobody had called from the Executive Office. You logged the call and reported the attempt. The attack failed, and the pressure tactics (authority, urgency, secrecy) all failed with it.'}}},
       hints:['The caller uses authority (the CFO), urgency (two minutes) and secrecy (no ticket) all at once. Each is a red flag.','The safe path is always to verify through a channel <i>you</i> choose, such as the number in the staff directory, never one the caller gives you.']},
      {id:'se_vish',cat:'calls',title:'Hang Up, Call Back',pts:150,diff:2,flag:'CTF{hang_up_call_back}',widget:'branch',
       body:`<p>Now you are the customer. Your phone rings with a number that looks like your bank. Choose how to respond.</p>`,
       wd:{start:'a',nodes:{
         a:{text:'<b>Caller:</b> &ldquo;This is the fraud team at Halcyon Bank. We have spotted suspicious payments on your account. To cancel them, we have just sent a six-digit code to your phone. Please read it out to me now.&rdquo;',choices:[
           {t:'Read out the code: they are protecting me',to:'lose1'},
           {t:'&ldquo;Can you prove who you are?&rdquo;',to:'b'},
           {t:'Hang up, then ring the number on the back of your bank card',to:'win'}]},
         b:{text:'<b>Caller:</b> &ldquo;Of course. You are Alex Morgan, your account ends in 4821, and you live in Sunderland. Now, please read out that code quickly before the money leaves.&rdquo;',choices:[
           {t:'That proves it. Read out the code',to:'lose1'},
           {t:'Information like that is easy to find or buy. Hang up and call the number on the back of your card',to:'win'}]},
         lose1:{end:'lose',text:'That code was the one-time passcode for a payment the attacker was making right then. Banks never ask you to read out a code that they have sent you.'},
         win:{end:'win',text:'Correct. You ended the call and rang the number you already trusted. Your real bank had no record of the call. Remember: a caller ID can be faked, and a caller who rushes you is a warning sign.'}}},
       hints:['A caller who knows your name and address has not proved anything: that information is easy to find.','The safe move is to end the call yourself and ring a number you already know is genuine.']},

      {id:'se_fix',cat:'defence',title:'Build the Human Firewall',pts:150,diff:2,flag:'CTF{people_are_the_best_defence}',widget:'classify',
       body:`<p>Technology helps, but people are the last line of defence. Match each attack to the counter-measure that stops it.</p>`,
       wd:{options:['Report it and do not click anything','Verify using a number you already know','Challenge politely and follow the badge policy','Hand it to IT unopened','Deny the prompts, report it, then change your password','Shred anything sensitive'],win:'you are the human firewall',retry:'Each counter-measure is used exactly once.',items:[
         {t:'A phishing email arrives asking you to &ldquo;verify&rdquo; your login',a:0},
         {t:'A phone call from &ldquo;IT&rdquo; asks you to reset a password',a:1},
         {t:'A stranger without a badge follows you through the door',a:2},
         {t:'A USB stick turns up in the car park',a:3},
         {t:'Your phone fills up with login approval requests at night',a:4},
         {t:'An attacker goes through the office rubbish',a:5}]},
       hints:['Match the ones about <i>physical objects</i> first: the USB stick and the rubbish.','&ldquo;Verify using a number you already know&rdquo; fits any call where someone asks you to do something sensitive.']}
    ]
  };
};
