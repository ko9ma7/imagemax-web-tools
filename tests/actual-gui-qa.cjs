const path=require('node:path');
const {chromium}=require('playwright');

async function main(){
  const preScript=process.argv[2],url=process.argv[3]||'http://127.0.0.1:48721/gui/?actual=r5';
  if(!preScript)throw new Error('PreScript.lua 경로가 필요합니다.');
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1551,height:911},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url,{waitUntil:'networkidle'});await page.locator('#importPreScript').setInputFiles(preScript);await page.waitForTimeout(700);
    const luaStats=lua=>{const names=[...lua.matchAll(/^\s*(?:local\s+)?function\s+([A-Za-z_]\w*)\s*\(/gm)].map(match=>match[1]),counts=Object.groupBy(names,name=>name);return {headerCount:(lua.match(/-- This is IM's script file\. Do not remove this comment line\./g)||[]).length,duplicateFunctions:Object.entries(counts).filter(([,items])=>items.length>1).map(([name])=>name),layoutMarkers:(lua.match(/-- ===== GUI Layout =====/g)||[]).length}};
    const initialLua=await page.locator('#guiLuaPreview').textContent(),initialLuaStats=luaStats(initialLua);
    await page.locator('#importPreScript').setInputFiles({name:'GeneratedPreScript.lua',mimeType:'text/plain',buffer:Buffer.from(initialLua,'utf8')});await page.waitForTimeout(700);
    const roundTripLua=await page.locator('#guiLuaPreview').textContent(),roundTripLuaStats=luaStats(roundTripLua);
    const measure=()=>page.locator('#canvas').evaluate(canvas=>{
      const root=canvas.getBoundingClientRect(),nodes=[...canvas.querySelectorAll('.ctrl')];
      const positions=Object.fromEntries(nodes.map(node=>{const rect=node.getBoundingClientRect();return [node.dataset.id,[Math.round(rect.left-root.left),Math.round(rect.top-root.top),Math.round(rect.width),Math.round(rect.height)]]}));
      const firstGroup=nodes.find(node=>node.classList.contains('group'));
      const groupRect=firstGroup?.getBoundingClientRect();
      return {
        surface:[Math.round(root.width),Math.round(root.height)],positions,
        firstGroup:groupRect?[Math.round(groupRect.left-root.left),Math.round(groupRect.top-root.top),Math.round(groupRect.width),Math.round(groupRect.height)]:null,
        total:nodes.length,checks:nodes.filter(n=>n.classList.contains('check')).length,combos:nodes.filter(n=>n.classList.contains('combo')).length,edits:nodes.filter(n=>n.classList.contains('edit')).length,
        duplicateChecks:nodes.filter(n=>n.classList.contains('check')&&n.querySelectorAll('.native-check').length!==1).length,
        duplicateArrows:nodes.filter(n=>n.classList.contains('combo')&&n.querySelectorAll('.combo-arrow').length!==1).length,
        pseudoDuplicates:nodes.filter(n=>(['check','radio'].some(type=>n.classList.contains(type))&&getComputedStyle(n,'::before').content!=='none')||(n.classList.contains('combo')&&getComputedStyle(n,'::after').content!=='none')).length,
        nonBlankCombos:nodes.filter(n=>n.classList.contains('combo')&&n.querySelector('select')?.value!=='-1').length
      };
    });
    const edit=await measure();
    const bounds=await page.locator('#runtimeWindow').boundingBox(),meta=await page.locator('#canvasMeta').textContent();
    await page.screenshot({path:path.join(__dirname,'gui-actual-edit-full-r5.png'),fullPage:true});await page.locator('#runtimeWindow').screenshot({path:path.join(__dirname,'gui-actual-client-r5.png')});
    await page.locator('#toggleGuiTest').click();await page.waitForTimeout(120);const test=await measure();
    await page.locator('#canvas .ctrl.check input').first().click();
    await page.locator('#canvas .ctrl.combo select').first().selectOption('0');
    const testLog=await page.locator('#guiTestLog').textContent();
    await page.screenshot({path:path.join(__dirname,'gui-actual-test-r5.png'),fullPage:true});
    const checks={
      surface:edit.surface[0]===382&&edit.surface[1]===346,
      calibratedGroup:JSON.stringify(edit.firstGroup)===JSON.stringify([10,17,111,314]),
      stableGeometry:JSON.stringify(edit.positions)===JSON.stringify(test.positions),
      singleGlyphs:edit.duplicateChecks===0&&edit.duplicateArrows===0&&edit.pseudoDuplicates===0&&test.duplicateChecks===0&&test.duplicateArrows===0&&test.pseudoDuplicates===0,
      initialCombosBlank:edit.nonBlankCombos===0,
      initialLuaSingleHeader:initialLuaStats.headerCount===1&&initialLuaStats.layoutMarkers===1,
      roundTripLuaClean:roundTripLuaStats.headerCount===1&&roundTripLuaStats.layoutMarkers===1&&roundTripLuaStats.duplicateFunctions.length===0&&edit.total===52,
      interactionLog:testLog.includes('값')&&testLog.includes('콜백'),
      noErrors:errors.length===0
    };
    const result={pass:Object.values(checks).every(Boolean),checks,meta,bounds,lua:{initial:initialLuaStats,roundTrip:roundTripLuaStats},edit:{...edit,positions:undefined},test:{...test,positions:undefined},testLog,errors};
    console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
  }finally{await browser.close()}
}

main().catch(error=>{console.error(error);process.exitCode=1});
