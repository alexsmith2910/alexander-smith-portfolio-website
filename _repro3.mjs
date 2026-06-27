import { chromium } from 'playwright';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
await p.goto('http://localhost:3000/',{waitUntil:'domcontentloaded'}); await sleep(5000);
const btn='button[aria-label="Menu"]';
await p.click(btn); await sleep(2000);                 // open fully
await p.click(btn); await sleep(2500);                 // close fully
await p.click(btn); await sleep(1000);                 // REOPEN
await p.screenshot({path:'_shots/reopen.png'});        // does the plasma render?
// also report whether the canvas has non-zero drawing buffer + reveal value
const info=await p.evaluate(()=>{
  const c=document.querySelector('[data-menu-plasma]');
  return { canvasW:c?.width, canvasH:c?.height, canvasOpacity:c?getComputedStyle(c).opacity:'?' };
});
console.log('reopen canvas:', JSON.stringify(info));
await b.close();console.log('done');
