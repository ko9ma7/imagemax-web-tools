import fs from 'node:fs';
import path from 'node:path';

const eventPath=process.env.GITHUB_EVENT_PATH;
if(!eventPath)throw new Error('GITHUB_EVENT_PATH가 없습니다.');
const event=JSON.parse(fs.readFileSync(eventPath,'utf8'));
const body=String(event.issue?.body||'');
const number=Number(event.issue?.number||0);
const author=String(event.issue?.user?.login||'unknown');
if(!body.includes('<!-- IMAGEMAX_TEMPLATE_SUBMISSION -->')){
  console.log('ImageMax 템플릿 제출 이슈가 아니므로 종료합니다.');process.exit(0);
}
const m=body.match(/<!-- IMAGEMAX_TEMPLATE_JSON_START -->([\s\S]*?)<!-- IMAGEMAX_TEMPLATE_JSON_END -->/);
if(!m)throw new Error('템플릿 JSON 마커를 찾을 수 없습니다.');
let raw=m[1].trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
if(Buffer.byteLength(raw,'utf8')>60000)throw new Error('제출 JSON이 60KB를 초과합니다.');
const pack=JSON.parse(raw);

const allowedKinds=new Set(['conditional','counter','retry','elapsed','once','cooldown','randomFound','bestMatch']);
const allowedConditions=new Set(['current','found','notfound','enabled','disabled','variable','multi','pixel','clipboard','ini','windowFound','windowNotFound','targetWidth','targetHeight','stopped','paused']);
const allowedActions=new Set(['currentClick','click','forceClick','enable','goto','key','mouse','drag','setVar','addVar','subVar','toggleVar','clipboardSet','sleep','openScript','stop','sound','screenshot','screenshotNamed','print','printVar','telegram','telegramShot','discord','discordShot','kakao','passAct','passAll','fail']);
const allowedCategories=new Set(['basic','image','state','flow','input','utility','data','custom']);
function assert(cond,msg){if(!cond)throw new Error(msg)}
function safeString(v,max=500){assert(typeof v==='string',`문자열이 필요합니다.`);assert(v.length<=max,`문자열이 ${max}자를 초과합니다.`);return v}
function validateAction(a,where){assert(a&&typeof a==='object',`${where}: action 객체가 필요합니다.`);assert(allowedActions.has(a.type),`${where}: 허용되지 않은 action '${a.type}'`);if(a.params!=null){assert(a.params&&typeof a.params==='object'&&!Array.isArray(a.params),`${where}: params 형식 오류`);for(const [k,v] of Object.entries(a.params)){safeString(String(k),80);if(typeof v==='string')safeString(v,1500);else assert(['number','boolean'].includes(typeof v)||v==null,`${where}.${k}: 잘못된 값 형식`)}}}
function validateActions(arr,where){assert(Array.isArray(arr),`${where}: action 배열이 필요합니다.`);assert(arr.length<=30,`${where}: action은 최대 30개입니다.`);arr.forEach((a,i)=>validateAction(a,`${where}[${i}]`))}
function validateRule(r,where){assert(r&&typeof r==='object',`${where}: rule 객체가 필요합니다.`);assert(allowedKinds.has(r.kind),`${where}: 허용되지 않은 rule kind '${r.kind}'`);if(r.kind==='conditional'){assert(r.condition&&allowedConditions.has(r.condition.type),`${where}: 조건 타입 오류`);validateActions(r.then||[],`${where}.then`);validateActions(r.else||[],`${where}.else`)}else if(r.kind==='retry'){safeString(String(r.image||''),200);validateActions(r.foundActions||[],`${where}.foundActions`);validateActions(r.exhaustedActions||[],`${where}.exhaustedActions`)}else if(['counter','elapsed','once','cooldown'].includes(r.kind)){validateActions(r.actions||[],`${where}.actions`)}else if(['randomFound','bestMatch'].includes(r.kind)){assert(Array.isArray(r.images)&&r.images.length<=20,`${where}: 후보 이미지는 최대 20개입니다.`);r.images.forEach(x=>safeString(String(x),200))}}
function validateTemplate(t,i){assert(t&&typeof t==='object',`templates[${i}] 형식 오류`);assert(/^[a-z0-9][a-z0-9_-]{2,79}$/.test(String(t.id||'')),`${t.id||i}: id 형식 오류`);const title=safeString(String(t.title||''),100);assert(title.trim().length>0,`${t.id}: title이 비어 있습니다.`);safeString(String(t.desc||''),1000);safeString(String(t.tag||''),80);safeString(String(t.author||''),80);assert(allowedCategories.has(t.category||'custom'),`${t.id}: category 오류`);assert(Array.isArray(t.rules)&&t.rules.length>0&&t.rules.length<=30,`${t.id}: rules는 1~30개여야 합니다.`);t.rules.forEach((r,j)=>validateRule(r,`${t.id}.rules[${j}]`));assert(Buffer.byteLength(JSON.stringify(t),'utf8')<=30000,`${t.id}: 템플릿이 30KB를 초과합니다.`)}
assert(pack&&typeof pack==='object','pack 객체가 필요합니다.');assert(pack.format==='imagemax-template-pack','format 오류');assert(Number(pack.version)===1,'version 오류');safeString(String(pack.name||''),120);safeString(String(pack.description||''),1000);safeString(String(pack.author||''),80);assert(Array.isArray(pack.templates)&&pack.templates.length>=1&&pack.templates.length<=20,'한 제출에는 1~20개 템플릿이 필요합니다.');const ids=new Set();pack.templates.forEach((t,i)=>{validateTemplate(t,i);assert(!ids.has(t.id),`${t.id}: 제출 팩 안에서 id가 중복됩니다.`);ids.add(t.id)});

const root=process.cwd(),communityDir=path.join(root,'community'),templateDir=path.join(communityDir,'templates');fs.mkdirSync(templateDir,{recursive:true});
const indexPath=path.join(communityDir,'index.json');let index={format:'imagemax-community-index',version:1,updatedAt:null,templates:[]};if(fs.existsSync(indexPath))index=JSON.parse(fs.readFileSync(indexPath,'utf8'));
for(const t of pack.templates){const file=path.join(templateDir,`${t.id}.json`);assert(!fs.existsSync(file),`템플릿 id '${t.id}'가 이미 존재합니다. 업데이트는 관리자에게 별도로 요청하세요.`)}
const now=new Date().toISOString();
for(const t of pack.templates){const clean={...t,community:{author,issue:number,submittedAt:now}};const out={format:'imagemax-template-pack',version:1,name:t.title,description:t.desc||'',author,exportedAt:now,templates:[clean]};const rel=`community/templates/${t.id}.json`;fs.writeFileSync(path.join(root,rel),JSON.stringify(out,null,2)+'\n');index.templates.unshift({id:t.id,title:t.title,desc:t.desc||'',category:t.category||'custom',tag:t.tag||'공유',author,path:rel,submittedAt:now,issue:number})}
index.updatedAt=now;fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
console.log(`${pack.templates.length}개 템플릿 검증 및 커뮤니티 파일 생성 완료.`);
