/* Forensics-specific widgets */

/* lsb: an image with text hidden in the least-significant bit of the red channel.
   The flag text is rebuilt from ENC at runtime and drawn into the bits, so it never appears in the page source. */
WIDGETS.lsb=(el,c)=>{
  const W=480,Hh=52,txt=dec(c.id);
  el.innerHTML=`<p class="lead" style="margin-top:14px">${c.wd.legend}</p>
    <canvas class="lsb" id="lsbC" width="${W}" height="${Hh}"></canvas>
    <div class="row" id="lsbB"><button class="btn sm" data-m="orig">Original image</button><button class="btn sec sm" data-m="0">Bit 0 of RED</button><button class="btn sec sm" data-m="1">Bit 0 of GREEN</button><button class="btn sec sm" data-m="2">Bit 0 of BLUE</button></div>
    <div class="res" id="lsbR" style="color:var(--dim)">Showing the original image.</div>`;
  const off=document.createElement('canvas');off.width=W;off.height=Hh;const o=off.getContext('2d');
  o.fillStyle='#000';o.fillRect(0,0,W,Hh);o.fillStyle='#fff';o.font='bold 24px monospace';o.textBaseline='middle';o.fillText(txt,10,Hh/2+1);
  const mask=o.getImageData(0,0,W,Hh).data;
  let seed=1234567;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
  const px=new Uint8ClampedArray(W*Hh*4);
  for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){
    const i=(y*W+x)*4,n=()=>Math.floor(rnd()*6);
    let r=120+90*Math.sin(x/41+y/13)+n(),g=110+80*Math.sin(x/29-y/17+1)+n(),b=140+90*Math.cos(x/53+y/9)+n();
    r=Math.max(0,Math.min(255,Math.round(r)));g=Math.max(0,Math.min(255,Math.round(g)));b=Math.max(0,Math.min(255,Math.round(b)));
    px[i]=(r&~1)|(mask[i]>127?1:0);          // the secret lives here
    px[i+1]=(g&~1)|(rnd()<.5?1:0);            // green and blue LSBs are just noise
    px[i+2]=(b&~1)|(rnd()<.5?1:0);
    px[i+3]=255;
  }
  const ctx=$('#lsbC',el).getContext('2d');
  const show=m=>{
    const img=ctx.createImageData(W,Hh);
    for(let i=0;i<W*Hh*4;i+=4){
      if(m==='orig'){img.data[i]=px[i];img.data[i+1]=px[i+1];img.data[i+2]=px[i+2]}
      else{const v=(px[i+ +m]&1)?255:0;img.data[i]=img.data[i+1]=img.data[i+2]=v}
      img.data[i+3]=255;
    }
    ctx.putImageData(img,0,0);
    $('#lsbR',el).textContent=m==='orig'?'Showing the original image.':'Showing only the least-significant bit of one colour channel (white = 1, black = 0).';
    $$('#lsbB button',el).forEach(b=>b.className='btn sm'+(b.dataset.m===String(m)?'':' sec'));
  };
  $('#lsbB',el).onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.m)};
  show('orig');
};
