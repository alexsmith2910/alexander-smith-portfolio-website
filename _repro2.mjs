import { chromium } from 'playwright';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR:', e.message));
await p.goto('http://localhost:3000/',{waitUntil:'domcontentloaded'});
await sleep(5000);
const pe=async(l)=>{const v=await p.evaluate(()=>{const e=document.querySelector('[data-menu]');return e?getComputedStyle(e).pointerEvents:'?';});console.log(l,'overlay pe =',v);};
const btn='button[aria-label="Menu"]';

console.log('--- scenario: click reopen DURING the close ---');
await p.click(btn); await sleep(1800); await pe('opened    ');
await p.click(btn); await sleep(500);            // close, then mid-close...
await pe('mid-close ');
await p.click(btn); await sleep(500);            // click again during close
await p.click(btn);                              // and again
await sleep(3500);                               // let everything settle
await pe('settled   ');
await p.click(btn); await sleep(1600);           // try to OPEN now
await pe('try-open  ');

console.log('--- scenario: rapid open/close x3 ---');
for(let i=0;i<3;i++){ await p.click(btn); await sleep(700); await p.click(btn); await sleep(700); }
await sleep(3000); await pe('after rapid');
await p.click(btn); await sleep(1600); await pe('final open');
await b.close();console.log('done');
