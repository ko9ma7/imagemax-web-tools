import fs from 'node:fs';
import path from 'node:path';
import {validateTemplatePack} from '../script/template-library.js';

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
function assert(cond,msg){if(!cond)throw new Error(msg)}
validateTemplatePack(pack,{maxTemplates:20,maxPackBytes:60000});

const root=process.cwd(),communityDir=path.join(root,'community'),templateDir=path.join(communityDir,'templates');fs.mkdirSync(templateDir,{recursive:true});
const indexPath=path.join(communityDir,'index.json');let index={format:'imagemax-community-index',version:1,updatedAt:null,templates:[]};if(fs.existsSync(indexPath))index=JSON.parse(fs.readFileSync(indexPath,'utf8'));
for(const t of pack.templates){const file=path.join(templateDir,`${t.id}.json`);assert(!fs.existsSync(file),`템플릿 id '${t.id}'가 이미 존재합니다. 업데이트는 관리자에게 별도로 요청하세요.`)}
const now=new Date().toISOString();
for(const t of pack.templates){const clean={...t,community:{author,issue:number,submittedAt:now}};const out={format:'imagemax-template-pack',version:1,name:t.title,description:t.desc||'',author,exportedAt:now,templates:[clean]};const rel=`community/templates/${t.id}.json`;fs.writeFileSync(path.join(root,rel),JSON.stringify(out,null,2)+'\n');index.templates.unshift({id:t.id,title:t.title,desc:t.desc||'',category:t.category||'custom',tag:t.tag||'공유',author,path:rel,submittedAt:now,issue:number})}
index.updatedAt=now;fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
const packs={};for(const meta of index.templates){const file=path.join(root,meta.path||`community/templates/${meta.id}.json`);if(fs.existsSync(file))packs[meta.id]=JSON.parse(fs.readFileSync(file,'utf8'))}
const offlineJson=JSON.stringify({index,packs},null,2).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
fs.writeFileSync(path.join(communityDir,'index.js'),`window.IMAGEMAX_COMMUNITY_DATA=${offlineJson};\n`);
console.log(`${pack.templates.length}개 템플릿 검증 및 커뮤니티 파일 생성 완료.`);
