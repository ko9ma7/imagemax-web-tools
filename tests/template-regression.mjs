import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateTemplatePack} from '../script/template-library.js';
import worker from '../optional-worker/worker.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const template={id:'qa_template',title:'QA 템플릿',desc:'회귀 검사',category:'custom',tag:'QA',author:'tester',rules:[{kind:'conditional',condition:{type:'current',params:{}},then:[{type:'print',params:{text:'ok'}}],else:[]}]};
const pack={format:'imagemax-template-pack',version:1,name:'QA Pack',description:'',author:'tester',templates:[template]};
const checks=[];
const test=(name,fn)=>{fn();checks.push(name)};

test('shared validator accepts valid pack',()=>assert.equal(validateTemplatePack(structuredClone(pack)).templates.length,1));
test('shared validator rejects unsafe parameter types',()=>{const bad=structuredClone(pack);bad.templates[0].rules[0].then[0].params.text={nested:true};assert.throws(()=>validateTemplatePack(bad),/문자열·숫자·논리값/)});
test('share limit is enforced by shared validator',()=>{const many=structuredClone(pack);many.templates=Array.from({length:21},(_,i)=>({...structuredClone(template),id:`qa_template_${i}`}));assert.throws(()=>validateTemplatePack(many,{maxTemplates:20,maxPackBytes:60000}),/최대 20개/)});

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'imagemax-template-'));
try{
  const body=`<!-- IMAGEMAX_TEMPLATE_SUBMISSION -->\n<!-- IMAGEMAX_TEMPLATE_JSON_START -->\n\`\`\`json\n${JSON.stringify(pack)}\n\`\`\`\n<!-- IMAGEMAX_TEMPLATE_JSON_END -->`;
  const eventPath=path.join(temp,'event.json');fs.writeFileSync(eventPath,JSON.stringify({issue:{number:7,user:{login:'qa-user'},body}}));
  const result=spawnSync(process.execPath,[path.join(root,'scripts/process-template-submission.mjs')],{cwd:temp,env:{...process.env,GITHUB_EVENT_PATH:eventPath},encoding:'utf8'});
  test('submission processor exits cleanly',()=>assert.equal(result.status,0,result.stderr));
  const index=JSON.parse(fs.readFileSync(path.join(temp,'community/index.json'),'utf8'));
  test('submission processor writes validated index',()=>assert.equal(index.templates[0].id,'qa_template'));
  const offline=fs.readFileSync(path.join(temp,'community/index.js'),'utf8');
  test('submission processor writes offline pack data',()=>assert.match(offline,/IMAGEMAX_COMMUNITY_DATA[\s\S]*qa_template/));
}finally{fs.rmSync(temp,{recursive:true,force:true})}

const originalFetch=globalThis.fetch;
try{
  const denied=await worker.fetch(new Request('https://worker.example',{method:'POST',body:JSON.stringify({pack,turnstileToken:'token'}),headers:{'content-type':'application/json'}}),{ALLOWED_ORIGIN:'https://site.example'});
  test('worker rejects requests without Origin',()=>assert.equal(denied.status,403));
  const incomplete=await worker.fetch(new Request('https://worker.example',{method:'POST',body:JSON.stringify({pack,turnstileToken:'token'}),headers:{'content-type':'application/json',origin:'https://site.example'}}),{ALLOWED_ORIGIN:'https://site.example'});
  test('worker rejects missing security secrets',()=>assert.equal(incomplete.status,503));
  globalThis.fetch=async url=>String(url).includes('turnstile')?new Response(JSON.stringify({success:true}),{status:200,headers:{'content-type':'application/json'}}):new Response(JSON.stringify({html_url:'https://github.com/example/issues/1',number:1}),{status:201,headers:{'content-type':'application/json'}});
  const unsafe=structuredClone(pack);unsafe.templates[0].rules[0].then[0].params.text={nested:true};
  const rejected=await worker.fetch(new Request('https://worker.example',{method:'POST',body:JSON.stringify({pack:unsafe,turnstileToken:'token'}),headers:{'content-type':'application/json',origin:'https://site.example'}}),{ALLOWED_ORIGIN:'https://site.example',TURNSTILE_SECRET_KEY:'secret',GITHUB_TOKEN:'token',GITHUB_REPO:'example/repo'});
  test('worker uses the shared strict validator',()=>assert.equal(rejected.status,400));
  const accepted=await worker.fetch(new Request('https://worker.example',{method:'POST',body:JSON.stringify({pack,turnstileToken:'token'}),headers:{'content-type':'application/json',origin:'https://site.example'}}),{ALLOWED_ORIGIN:'https://site.example',TURNSTILE_SECRET_KEY:'secret',GITHUB_TOKEN:'token',GITHUB_REPO:'example/repo'});
  test('worker accepts verified submission',()=>assert.equal(accepted.status,201));
}finally{globalThis.fetch=originalFetch}

console.log(JSON.stringify({pass:true,checks},null,2));
