const path=require('node:path');
const {chromium}=require('playwright');

async function main(){
  const url=process.argv[2]||'http://127.0.0.1:48721/tests/browser-smoke.html?run=playwright';
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1551,height:911}}),errors=[],dialogs=[],messages=[];
    page.on('pageerror',error=>errors.push(error.stack||error.message));
    page.on('console',message=>{if(message.type()==='error')messages.push(message.text())});
    page.on('dialog',async dialog=>{dialogs.push(`${dialog.type()}: ${dialog.message()}`);await dialog.dismiss()});
    await page.goto(url,{waitUntil:'domcontentloaded'});
    try{await page.waitForFunction(()=>document.title.startsWith('PASS:')||document.title.startsWith('FAIL:'),null,{timeout:30000})}catch(error){console.error(JSON.stringify({errors,dialogs,messages,result:await page.locator('#result').textContent(),frameUrl:page.frames()[1]?.url()},null,2));throw error}
    const result=JSON.parse(await page.locator('#result').textContent());
    await page.screenshot({path:path.join(__dirname,'browser-smoke-final.png')});
    console.log(JSON.stringify({pass:result.pass,checks:result.checks.length,failed:result.checks.filter(check=>!check.pass).map(check=>check.name),errors,dialogs,messages},null,2));
    if(!result.pass||errors.length||dialogs.length||messages.length)process.exitCode=1;
  }finally{await browser.close()}
}

main().catch(error=>{console.error(error);process.exitCode=1});
