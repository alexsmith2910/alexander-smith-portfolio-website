import { chromium } from 'playwright';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
p.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE.ERROR:', m.text()); });
p.on('pageerror',e=>console.log('PAGEERROR:', e.message));
await p.goto('http://localhost:3000/',{waitUntil:'domcontentloaded'});
await sleep(5000);
const state=async(lbl)=>{
  const s=await p.evaluate(()=>{
    const el=document.querySelector('[data-menu]');
    const content=document.querySelector('[data-menu]>div:last-child');
    return { pe: el?getComputedStyle(el).pointerEvents:'?', clip: el?getComputedStyle(el).clipPath:'?',
             contentOpacity: content?getComputedStyle(content).opacity:'?' };
  });
  console.log(lbl, JSON.stringify(s));
};
await state('initial   ');
await p.click('button[aria-label="Menu"]'); await sleep(1800); await state('after open ');
await p.click('button[aria-label="Menu"]'); await sleep(2200); await state('after close');
await p.click('button[aria-label="Menu"]'); await sleep(1200); await state('after REOPEN');
await b.close();console.log('done');
