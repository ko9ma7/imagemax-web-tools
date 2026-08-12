import {$,$$,escLua,sanitizeId,luaId,download,downloadBytes,makeStoreZip,copyText,toast,encodeProject,readJsonFile,html} from '../assets/common.js';
import {buildBuiltinTemplates,CATEGORY_LABELS,makeTemplatePack,validateTemplatePack,TEMPLATE_FORMAT} from './template-library.js';

const SHARE_REPO='ko9ma7/imagemax-web-tools';
const state={
  xmlName:'',images:[],selected:null,scripts:{},imageFiles:new Map(),imageFolderStats:null,previewUrl:null,
  customTemplates:[],communityTemplates:[],templateMode:'featured',favorites:new Set(),favoriteOnly:false,version:6
};
const els={
  xml:$('#xmlFile'),search:$('#imageSearch'),list:$('#imageList'),count:$('#imageCount'),preview:$('#previewBox'),
  folder:$('#imageFolder'),folderStatus:$('#folderStatus'),title:$('#workspaceTitle'),sub:$('#workspaceSub'),rules:$('#ruleList'),
  details:$('#imageDetails'),lua:$('#luaPreview'),badge:$('#assignedBadge'),copy:$('#copyLua'),dl:$('#downloadLua'),
  recipeList:$('#recipeList'),recipeSearch:$('#recipeSearch'),recipeCategory:$('#recipeCategory'),templateCount:$('#templateCount'),
  flow:$('#flowPreview'),saveTemplate:$('#saveAsTemplate'),importTemplate:$('#importTemplate'),exportTemplates:$('#exportTemplates'),
  shareUpload:$('#shareTemplateUpload'),templateFile:$('#templateFile'),shareFile:$('#shareFile'),communityStatus:$('#communityStatus'),
  favoriteOnly:$('#favoriteOnly'),templateModal:$('#templateSaveModal'),templateModalClose:$('#templateModalClose'),templateModalCancel:$('#templateModalCancel'),templateModalSave:$('#templateModalSave'),templateName:$('#templateName'),templateCategory:$('#templateCategory'),templateAuthor:$('#templateAuthor'),templateTag:$('#templateTag'),templateDesc:$('#templateDesc'),templateRuleSummary:$('#templateRuleSummary')
};

const conditionDefs={
  current:{label:'현재 이미지 액션이 실행되었을 때 (재검색 없음)',fields:[]},
  found:{label:'다른 이미지를 이번 순회에서 1회 찾아서 발견했을 때',fields:[['image','확인할 이미지','image'],['accuracy','정확도(선택)','number']]},
  notfound:{label:'다른 이미지를 이번 순회에서 1회 찾아서 없을 때',fields:[['image','확인할 이미지','image'],['accuracy','정확도(선택)','number']]},
  enabled:{label:'이미지가 활성 상태일 때',fields:[['image','대상 이미지','image']]},
  disabled:{label:'이미지가 비활성 상태일 때',fields:[['image','대상 이미지','image']]},
  variable:{label:'GUI/전역 변수 값을 비교할 때',fields:[['varName','변수 이름','text'],['operator','비교','operator'],['value','비교 값','text']]},
  multi:{label:'MultiImage 조건식이 맞을 때',fields:[['expression','조건식 (&=AND, |=OR)','text']]},
  pixel:{label:'픽셀 RGB가 같을 때',fields:[['x','X','number'],['y','Y','number'],['r','R','number'],['g','G','number'],['b','B','number']]},
  clipboard:{label:'클립보드 내용 비교',fields:[['operator','비교','operator'],['value','문자열','text']]},
  ini:{label:'INI 값 비교',fields:[['app','섹션(app)','text'],['key','키','text'],['file','INI 파일명','text'],['operator','비교','operator'],['value','비교 값','text']]},
  windowFound:{label:'특정 윈도우가 있을 때',fields:[['className','클래스명(선택)','text'],['windowName','창 이름(선택)','text']]},
  windowNotFound:{label:'특정 윈도우가 없을 때',fields:[['className','클래스명(선택)','text'],['windowName','창 이름(선택)','text']]},
  targetWidth:{label:'대상 창 너비 비교',fields:[['operator','비교','operator'],['value','너비','number']]},
  targetHeight:{label:'대상 창 높이 비교',fields:[['operator','비교','operator'],['value','높이','number']]},
  stopped:{label:'ImageMax가 Stop 상태일 때',fields:[]},
  paused:{label:'ImageMax가 Pause 상태일 때',fields:[]}
};
const actionDefs={
  currentClick:{label:'현재 인식 이미지 클릭 (재검색 없음)',fields:[]},
  click:{label:'다른 이미지 검색 후 클릭',fields:[['image','대상 이미지','image'],['offsetX','X 오프셋','number'],['offsetY','Y 오프셋','number']]},
  forceClick:{label:'등록 위치 강제 클릭',fields:[['image','대상 이미지','image']]},
  enable:{label:'이미지 활성/비활성',fields:[['image','대상 이미지','image'],['enabled','상태','boolean']]},
  goto:{label:'인식 순서 이동',fields:[['image','이동할 이미지','image']]},
  key:{label:'키보드 입력',fields:[['text','ImageMax 키 문자열','text'],['speed','속도','speed'],['type','입력 방식','inputType']]},
  mouse:{label:'좌표 클릭',fields:[['x','X','number'],['y','Y','number'],['randX','랜덤 X','number'],['randY','랜덤 Y','number']]},
  drag:{label:'마우스 드래그',fields:[['x1','시작 X','number'],['y1','시작 Y','number'],['x2','종료 X','number'],['y2','종료 Y','number'],['press1','시작 누름(초)','number'],['press2','종료 누름(초)','number']]},
  setVar:{label:'변수 값 지정',fields:[['varName','변수 이름','text'],['value','값','text']]},
  addVar:{label:'변수 값 더하기',fields:[['varName','변수 이름','text'],['amount','더할 값','number']]},
  subVar:{label:'변수 값 빼기',fields:[['varName','변수 이름','text'],['amount','뺄 값','number']]},
  toggleVar:{label:'0/1 변수 토글',fields:[['varName','변수 이름','text']]},
  clipboardSet:{label:'클립보드 텍스트 저장',fields:[['text','텍스트','text'],['unicode','유니코드','boolean']]},
  sleep:{label:'짧은 딜레이',fields:[['ms','밀리초','number']]},
  openScript:{label:'다른 ImageMax 스크립트 열기',fields:[['name','스크립트 이름','text']]},
  stop:{label:'ImageMax 중지',fields:[]},
  sound:{label:'사운드 재생',fields:[['file','WAV 파일명','text'],['sec','재생/대기 초','number']]},
  screenshot:{label:'스크린샷 저장',fields:[]},
  screenshotNamed:{label:'파일명 지정 스크린샷',fields:[['filename','파일명','text']]},
  print:{label:'로그 출력',fields:[['text','메시지','text']]},
  printVar:{label:'변수값 로그 출력',fields:[['label','표시 이름','text'],['varName','변수 이름','text']]},
  telegram:{label:'텔레그램 텍스트 전송',fields:[['token','Token/변수','text'],['chatId','Chat ID/변수','text'],['text','메시지','text']]},
  telegramShot:{label:'스크린샷 → 텔레그램',fields:[['token','Token/변수','text'],['chatId','Chat ID/변수','text'],['text','메시지','text']]},
  discord:{label:'디스코드 텍스트 전송',fields:[['url','Webhook URL/변수','text'],['name','봇 이름','text'],['text','메시지','text']]},
  discordShot:{label:'스크린샷 → 디스코드',fields:[['url','Webhook URL/변수','text'],['name','봇 이름','text'],['text','메시지','text']]},
  kakao:{label:'카카오톡 전송',fields:[['room','채팅방 이름','text'],['text','메시지','text'],['screenshot','스크린샷','boolean']]},
  passAct:{label:'다음 N개 액션 건너뛰기',fields:[['count','개수','number']]},
  passAll:{label:'현재 이미지의 이후 액션 모두 건너뛰기',fields:[]},
  fail:{label:'인식 실패 액션으로 이동',fields:[]}
};

function act(type,params={}){return {type,params}}
function conditional(type,then=[],els=[],params={}){return {kind:'conditional',condition:{type,params},then,else:els}}
function selectedImage(){return state.images.find(i=>i.name===state.selected)}
function firstOther(){return state.images.find(i=>i.name!==state.selected&&!i.name.toLowerCase().endsWith('.grp'))?.name||state.images.find(i=>i.name!==state.selected)?.name||''}
function defaultCandidates(){return state.images.filter(i=>i.name!==state.selected&&!i.name.toLowerCase().endsWith('.grp')).slice(0,4).map(i=>i.name)}
const builtinTemplates=buildBuiltinTemplates({act,conditional,selectedImage,firstOther,defaultCandidates});

function clone(v){return typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v))}
function customRecipe(t){return {...t,category:t.category||'custom',tag:t.tag||'내 템플릿',builtin:false,make:()=>clone(t.rules)}}
function allCustomRecipes(){return state.customTemplates.map(customRecipe)}

function decodeXml(buffer){
  const bytes=new Uint8Array(buffer.slice(0,180));let head='';for(const b of bytes)head+=String.fromCharCode(b);
  const m=head.match(/encoding=["']([^"']+)/i);const declared=(m?.[1]||'utf-8').toLowerCase();
  const candidates=declared.includes('euc')||declared.includes('949')||declared.includes('5601')?['euc-kr','utf-8']:['utf-8','euc-kr'];
  for(const enc of candidates){try{return {text:new TextDecoder(enc,{fatal:true}).decode(buffer),encoding:enc==='euc-kr'?'CP949 / EUC-KR':'UTF-8'}}catch{}}
  return {text:new TextDecoder('euc-kr').decode(buffer),encoding:'CP949 / EUC-KR'};
}
function parseTuple(v=''){return v.replace(/[()]/g,'').split(',').map(x=>Number(x.trim())||0)}
function parseXml(text){
  const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error('XML 파싱 오류');
  const nodes=[...doc.querySelectorAll('GENERAL > *')].filter(n=>/^Image_\d+$/.test(n.tagName));
  return nodes.map((n,index)=>{const q=s=>n.querySelector(`:scope > ${s}`),trg=q('Trg');const actions=[...n.children].filter(c=>/^Act_\d+$/.test(c.tagName)).map(a=>({name:a.querySelector(':scope > Name')?.textContent||'',enabled:a.querySelector(':scope > Enable')?.textContent!=='0',param:a.querySelector(':scope > Param')?.textContent||'',luaFile:a.querySelector(':scope > Attr')?.getAttribute('LuaFile')||'',luaText:a.querySelector(':scope > Attr')?.getAttribute('Text')||''}));return {index:index+1,name:q('Name')?.textContent||`Image_${index+1}`,rect:parseTuple(q('Rect')?.textContent),roi:parseTuple(q('ROI')?.textContent),enabled:q('Enable')?.textContent!=='0',group:Number(q('Group')?.textContent)||0,accuracy:Number(trg?.getAttribute('Acc'))||80,actions}});
}
function normalizeKey(name=''){return String(name).normalize('NFC').trim().replace(/\.[^.\\/]+$/,'').toLowerCase()}
function isImageFile(file){return /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name)||String(file.type).startsWith('image/')}
function findImageFile(name){return state.imageFiles.get(normalizeKey(name))||null}
function rebuildFolderIndex(files){
  state.imageFiles.clear();let usable=0,duplicates=0;
  for(const f of files){if(!isImageFile(f))continue;usable++;const key=normalizeKey(f.name);if(state.imageFiles.has(key)){duplicates++;continue}state.imageFiles.set(key,f)}
  const previewable=state.images.filter(i=>!i.name.toLowerCase().endsWith('.grp'));const matched=previewable.filter(i=>findImageFile(i.name)).length;
  state.imageFolderStats={totalFiles:files.length,usable,matched,target:previewable.length,duplicates};renderFolderStatus();renderImages();renderPreview();
}
function renderFolderStatus(){const s=state.imageFolderStats;if(!s){els.folderStatus.textContent='아직 폴더를 연결하지 않았습니다.';return}els.folderStatus.innerHTML=`<b>${s.matched}/${s.target}</b>개 XML 이미지 연결 · 이미지 파일 ${s.usable}개${s.target-s.matched>0?` · <span class="warn-text">미연결 ${s.target-s.matched}개</span>`:''}${s.duplicates?` · <span class="warn-text">중복 이름 ${s.duplicates}개</span>`:''}`}

els.xml.addEventListener('change',async()=>{const f=els.xml.files[0];if(!f)return;try{const buf=await f.arrayBuffer();const {text,encoding}=decodeXml(buf);state.images=parseXml(text);state.xmlName=f.name;state.scripts={};state.selected=null;els.search.disabled=false;if(els.folder.files?.length)rebuildFolderIndex([...els.folder.files]);renderAll();persist();toast(`${state.images.length}개 이미지 로드 · ${encoding}`)}catch(e){alert(`XML을 읽지 못했습니다: ${e.message}`)}});
els.search.addEventListener('input',renderImages);
els.folder.addEventListener('change',()=>rebuildFolderIndex([...els.folder.files]));
els.recipeSearch.addEventListener('input',renderTemplates);els.recipeCategory.addEventListener('change',renderTemplates);
$$('[data-template-mode]').forEach(b=>b.onclick=()=>{state.templateMode=b.dataset.templateMode;$$('[data-template-mode]').forEach(x=>x.classList.toggle('active',x===b));renderTemplates()});
els.favoriteOnly.onclick=()=>{state.favoriteOnly=!state.favoriteOnly;els.favoriteOnly.classList.toggle('active',state.favoriteOnly);els.favoriteOnly.textContent=state.favoriteOnly?'★':'☆';els.favoriteOnly.title=state.favoriteOnly?'즐겨찾기만 표시 중':'별표한 템플릿만 보기';renderTemplates();persistPreferences()};
function persistPreferences(){try{localStorage.setItem('imagemaxTemplateFavorites',JSON.stringify([...state.favorites]));localStorage.setItem('imagemaxTemplateFavoriteOnly',state.favoriteOnly?'1':'0')}catch{}}
function toggleFavorite(id){if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);persistPreferences();renderTemplates()}

function renderImages(){
  const q=els.search.value.trim().toLowerCase(),list=state.images.filter(i=>i.name.toLowerCase().includes(q));els.count.textContent=String(list.length);
  els.list.innerHTML=list.map(i=>{const file=findImageFile(i.name),isGroup=i.name.toLowerCase().endsWith('.grp');return `<button class="image-item ${state.selected===i.name?'active':''}" data-name="${html(i.name)}"><div><div class="image-name">${html(i.name)}</div><div class="image-meta">Image_${i.index} · Acc ${i.accuracy}% · Group ${i.group}</div></div><div class="image-badges">${file?'<span class="badge ok">미리보기</span>':isGroup?'<span class="badge">GROUP</span>':''}<span class="badge ${i.enabled?'ok':''}">${i.enabled?'ON':'OFF'}</span></div></button>`}).join('')||'<div class="hint">일치하는 이미지가 없습니다.</div>';
  $$('.image-item',els.list).forEach(x=>x.onclick=()=>selectImage(x.dataset.name));
}
function selectImage(name){state.selected=name;if(!state.scripts[name])state.scripts[name]=[];renderAll();persist()}
function renderAll(){renderImages();renderSelection();renderTemplates()}
function renderSelection(){
  const img=selectedImage(),active=!!img;els.copy.disabled=els.dl.disabled=els.saveTemplate.disabled=!active;
  els.title.textContent=active?img.name:'이미지를 먼저 선택하세요';
  els.sub.textContent=active?`Image_${img.index} · ROI (${img.roi.join(', ')}) · 정확도 ${img.accuracy}% · 현재 액션에 들어갈 1회 실행 Lua`:'XML 이미지 하나를 선택하면 해당 ImageMax 액션에 넣을 스크립트를 만듭니다.';
  els.badge.textContent=active?`${(state.scripts[img.name]||[]).length} 블록`:'미선택';renderPreview();renderDetails();renderRules();renderLua();renderFlow();
}
function renderPreview(){
  if(state.previewUrl){URL.revokeObjectURL(state.previewUrl);state.previewUrl=null}const img=selectedImage();
  if(!img){els.preview.innerHTML='<span>IMG</span>';els.preview.title='이미지를 선택하세요.';return}
  els.preview.title=img.name;
  if(img.name.toLowerCase().endsWith('.grp')){els.preview.innerHTML='<span>GRP</span>';return}
  const f=findImageFile(img.name);if(f){state.previewUrl=URL.createObjectURL(f);els.preview.innerHTML=`<img src="${state.previewUrl}" alt="${html(img.name)}">`;return}
  els.preview.innerHTML='<span>NO IMG</span>';
}
function renderDetails(){
  const img=selectedImage();if(!img){els.details.innerHTML='<div class="hint">이미지를 선택하면 ROI, 정확도, 활성상태와 기존 액션을 확인할 수 있습니다.</div>';return}
  const stack=img.actions.map((a,i)=>`<details class="existing"><summary><b>Act_${i+1} · ${html(a.name||'액션')}</b>${a.enabled?'':' · 비활성'}</summary>${a.luaFile?`<div class="hint" style="margin-top:6px">LuaFile: ${html(a.luaFile)}</div><pre>${html(a.luaText||a.param)}</pre>`:`<div class="hint" style="margin-top:6px">${html(a.param||'')}</div>`}</details>`).join('');
  els.details.innerHTML=`<dl class="kv compact-kv"><dt>Rect</dt><dd>(${img.rect.join(', ')})</dd><dt>ROI</dt><dd>(${img.roi.join(', ')})</dd><dt>정확도</dt><dd>${img.accuracy}%</dd><dt>상태</dt><dd>${img.enabled?'활성':'비활성'}</dd><dt>그룹</dt><dd>${img.group}</dd><dt>액션</dt><dd>${img.actions.length}개</dd></dl>${stack?`<div class="section-label" style="margin-top:12px">기존 Action List</div>${stack}`:'<div class="hint" style="margin-top:10px">등록된 액션이 없습니다.</div>'}`;
}

function currentTemplateList(){
  if(state.templateMode==='featured')return builtinTemplates.filter(t=>t.featured);
  if(state.templateMode==='mine')return allCustomRecipes();
  if(state.templateMode==='community')return state.communityTemplates;
  return builtinTemplates;
}
function renderTemplates(){
  const q=els.recipeSearch.value.trim().toLowerCase(),cat=els.recipeCategory.value;let list=currentTemplateList();
  list=list.filter(t=>(cat==='all'||t.category===cat)&&(!state.favoriteOnly||state.favorites.has(t.id))&&`${t.title} ${t.desc||''} ${t.tag||''}`.toLowerCase().includes(q));
  if(els.templateCount)els.templateCount.textContent=`${list.length}개`;
  if(state.templateMode==='community'&&!state.communityTemplates.length){els.recipeList.innerHTML='<div class="template-empty"><b>아직 등록된 공유 템플릿이 없습니다.</b><span>내 템플릿을 만든 뒤 “공유 신청”으로 첫 템플릿을 제출할 수 있습니다.</span></div>';return}
  els.recipeList.innerHTML=list.map(t=>`<article class="recipe-card compact-recipe"><div class="recipe-card-top"><span class="recipe-tag">${html(t.tag||'템플릿')}</span><span class="recipe-cat">${html(CATEGORY_LABELS[t.category]||t.category||'기타')}</span></div><h3>${html(t.title)}</h3><p>${html(t.desc||'')}</p><div class="template-card-actions"><button class="btn small ${state.selected?'primary':''}" data-apply-template="${html(t.id)}" ${state.selected?'':'disabled'}>${state.selected?'적용':'이미지 선택'}</button>${!t.builtin&&state.templateMode==='mine'?`<button class="btn small" data-export-template="${html(t.id)}">내보내기</button><button class="btn small soft" data-share-template="${html(t.id)}">공유 신청</button><button class="btn danger small" data-delete-template="${html(t.id)}">삭제</button>`:''}${state.templateMode==='community'?`<button class="btn small" data-download-community="${html(t.id)}">JSON</button>`:''}<button class="template-star ${state.favorites.has(t.id)?'active':''}" data-fav-template="${html(t.id)}" title="즐겨찾기" type="button">${state.favorites.has(t.id)?'★':'☆'}</button></div></article>`).join('')||'<div class="template-empty"><b>일치하는 템플릿이 없습니다.</b><span>검색어나 카테고리를 바꿔보세요.</span></div>';
  $$('[data-apply-template]',els.recipeList).forEach(b=>b.onclick=()=>applyTemplate(b.dataset.applyTemplate));
  $$('[data-export-template]',els.recipeList).forEach(b=>b.onclick=()=>exportOneTemplate(b.dataset.exportTemplate));
  $$('[data-share-template]',els.recipeList).forEach(b=>b.onclick=()=>shareCustomTemplate(b.dataset.shareTemplate));
  $$('[data-delete-template]',els.recipeList).forEach(b=>b.onclick=()=>deleteCustomTemplate(b.dataset.deleteTemplate));
  $$('[data-download-community]',els.recipeList).forEach(b=>b.onclick=()=>downloadCommunityTemplate(b.dataset.downloadCommunity));
  $$('[data-fav-template]',els.recipeList).forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.favTemplate));
}
function applyTemplate(id){
  if(!state.selected)return toast('왼쪽에서 ImageMax 이미지를 먼저 선택하세요.');
  if(state.templateMode==='community')return applyCommunityTemplate(id);
  const t=(state.templateMode==='mine'?allCustomRecipes():builtinTemplates).find(x=>x.id===id);if(!t)return;
  const made=t.make();const rules=Array.isArray(made)?made:[made];state.scripts[state.selected].push(...clone(rules));renderSelection();activateWorkPane('blocks');persist();toast(`'${t.title}' 템플릿을 추가했습니다.`);
}

function imageOptions(value=''){return `<option value="">-- 이미지 선택 --</option>${state.images.map(i=>`<option ${i.name===value?'selected':''} value="${html(i.name)}">${html(i.name)}</option>`).join('')}`}
function fieldHtml(field,value){
  const [key,label,type]=field;let control='';
  if(type==='image')control=`<select class="select" data-k="${key}">${imageOptions(value)}</select>`;
  else if(type==='operator')control=`<select class="select" data-k="${key}">${['==','~=','>','>=','<','<='].map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select>`;
  else if(type==='boolean')control=`<select class="select" data-k="${key}"><option value="true" ${String(value)!=='false'?'selected':''}>true</option><option value="false" ${String(value)==='false'?'selected':''}>false</option></select>`;
  else if(type==='speed')control=`<select class="select" data-k="${key}">${['FASTEST','FASTER','NORMAL','SLOWER','SLOWEST'].map(x=>`<option ${x===(value||'FASTER')?'selected':''}>${x}</option>`).join('')}</select>`;
  else if(type==='inputType')control=`<select class="select" data-k="${key}"><option ${value!=='MESSAGE'?'selected':''}>MKEVENT</option><option ${value==='MESSAGE'?'selected':''}>MESSAGE</option></select>`;
  else control=`<input class="input" data-k="${key}" type="${type==='number'?'number':'text'}" value="${html(value??'')}">`;
  return `<div class="field"><label>${label}</label>${control}</div>`;
}
function actionCard(a,ri,branch,ai){const def=actionDefs[a.type]||actionDefs.currentClick;return `<div class="action-card" data-branch="${branch}" data-ai="${ai}"><div class="row"><select class="select action-type grow">${Object.entries(actionDefs).map(([k,v])=>`<option value="${k}" ${k===a.type?'selected':''}>${v.label}</option>`).join('')}</select><button class="btn danger small remove-action" type="button">삭제</button></div>${def.fields.length?`<div class="rule-grid action-fields">${def.fields.map(f=>fieldHtml(f,a.params?.[f[0]])).join('')}</div>`:''}</div>`}
function ruleShell(title,desc,body,ri){return `<details class="rule" data-ri="${ri}" ${ri===(state.scripts[state.selected]?.length||1)-1?'open':''}><summary class="rule-head"><div><span class="rule-title">${html(title)}</span><span class="rule-desc">${html(desc)}</span></div><div class="rule-actions"><button class="btn small move-up" type="button">↑</button><button class="btn small move-down" type="button">↓</button><button class="btn danger small remove-rule" type="button">삭제</button></div></summary><div class="rule-body">${body}</div></details>`}
function conditionalHtml(r,ri){const def=conditionDefs[r.condition.type]||conditionDefs.current;const body=`<div class="field"><label>조건</label><select class="select cond-type">${Object.entries(conditionDefs).map(([k,v])=>`<option value="${k}" ${k===r.condition.type?'selected':''}>${v.label}</option>`).join('')}</select></div><div class="rule-grid cond-fields">${def.fields.map(f=>fieldHtml(f,r.condition.params?.[f[0]])).join('')}</div><div class="branch"><div class="branch-head"><b>조건이 맞으면</b><button class="btn small add-action" data-branch="then" type="button">+ 행동</button></div><div class="action-list">${(r.then||[]).map((a,i)=>actionCard(a,ri,'then',i)).join('')||'<div class="hint">행동 없음</div>'}</div></div><div class="branch optional"><div class="branch-head"><b>아니면 (선택)</b><button class="btn small add-action" data-branch="else" type="button">+ 행동</button></div><div class="action-list">${(r.else||[]).map((a,i)=>actionCard(a,ri,'else',i)).join('')||'<div class="hint">행동 없음</div>'}</div></div>`;return ruleShell(`조건 블록 ${ri+1}`,def.label,body,ri)}
function counterHtml(r,ri){const body=`<div class="rule-grid">${fieldHtml(['varName','카운터 변수','text'],r.varName)}${fieldHtml(['threshold','N회 이상','number'],r.threshold)}</div><div class="branch"><div class="branch-head"><b>N회 도달 후</b><button class="btn small add-action" data-branch="actions" type="button">+ 행동</button></div><div class="action-list">${(r.actions||[]).map((a,i)=>actionCard(a,ri,'actions',i)).join('')}</div></div>`;return ruleShell(`N회 호출 상태 ${ri+1}`,'호출 1회 = 카운트 1회. 반복문 없이 ImageMax 순회 사이에 상태를 유지합니다.',body,ri)}
function retryHtml(r,ri){const body=`<div class="rule-grid">${fieldHtml(['image','1회 확인할 이미지','image'],r.image)}${fieldHtml(['varName','재확인 변수','text'],r.varName)}${fieldHtml(['attempts','최대 순회 횟수','number'],r.attempts)}</div><div class="branch"><div class="branch-head"><b>찾았을 때</b><button class="btn small add-action" data-branch="foundActions" type="button">+ 행동</button></div><div class="action-list">${(r.foundActions||[]).map((a,i)=>actionCard(a,ri,'foundActions',i)).join('')}</div></div><div class="branch optional"><div class="branch-head"><b>최대 횟수 도달</b><button class="btn small add-action" data-branch="exhaustedActions" type="button">+ 행동</button></div><div class="action-list">${(r.exhaustedActions||[]).map((a,i)=>actionCard(a,ri,'exhaustedActions',i)).join('')||'<div class="hint">행동 없음</div>'}</div></div>`;return ruleShell(`순회 재확인 ${ri+1}`,'한 호출에서 ImageSearch는 1회만 실행하고 즉시 반환합니다.',body,ri)}
function elapsedHtml(r,ri){const body=`<div class="rule-grid">${fieldHtml(['varName','시간 변수','text'],r.varName)}${fieldHtml(['seconds','경과 초','number'],r.seconds)}</div><div class="branch"><div class="branch-head"><b>시간 도달 후</b><button class="btn small add-action" data-branch="actions" type="button">+ 행동</button></div><div class="action-list">${(r.actions||[]).map((a,i)=>actionCard(a,ri,'actions',i)).join('')}</div></div>`;return ruleShell(`비차단 경과시간 ${ri+1}`,'Sleep로 기다리지 않고 호출 사이의 os.clock() 경과를 비교합니다.',body,ri)}
function onceHtml(r,ri){const body=`<div class="rule-grid">${fieldHtml(['varName','1회 실행 플래그','text'],r.varName)}</div><div class="branch"><div class="branch-head"><b>최초 1회</b><button class="btn small add-action" data-branch="actions" type="button">+ 행동</button></div><div class="action-list">${(r.actions||[]).map((a,i)=>actionCard(a,ri,'actions',i)).join('')}</div></div>`;return ruleShell(`1회 실행 ${ri+1}`,'플래그가 0일 때만 실행하고 실행 후 1로 바꿉니다.',body,ri)}
function cooldownHtml(r,ri){const body=`<div class="rule-grid">${fieldHtml(['varName','쿨타임 변수','text'],r.varName)}${fieldHtml(['seconds','쿨타임 초','number'],r.seconds)}</div><div class="branch"><div class="branch-head"><b>쿨타임이 끝났을 때</b><button class="btn small add-action" data-branch="actions" type="button">+ 행동</button></div><div class="action-list">${(r.actions||[]).map((a,i)=>actionCard(a,ri,'actions',i)).join('')}</div></div>`;return ruleShell(`쿨타임 ${ri+1}`,'마지막 실행 시각 이후 지정 초가 지나야 다시 실행합니다.',body,ri)}
function multiImageSelect(images=[]){return `<div class="field"><label>후보 이미지 (Ctrl/Shift로 여러 개 선택 · 최대 20개)</label><select class="select multi-images" multiple size="6">${state.images.filter(i=>!i.name.toLowerCase().endsWith('.grp')).map(i=>`<option value="${html(i.name)}" ${images.includes(i.name)?'selected':''}>${html(i.name)}</option>`).join('')}</select></div>`}
function randomHtml(r,ri){return ruleShell(`여러 이미지 중 랜덤 클릭 ${ri+1}`,'후보를 각각 1회 검색하고 발견된 결과 중 하나만 클릭합니다.',multiImageSelect(r.images),ri)}
function bestHtml(r,ri){return ruleShell(`최고 정확도 후보 선택 ${ri+1}`,'후보별 ImageSearch를 1회 수행하고 가장 높은 정확도 하나를 클릭합니다.',`${multiImageSelect(r.images)}${fieldHtml(['minAccuracy','최소 정확도','number'],r.minAccuracy)}`,ri)}
function renderRules(){const img=selectedImage();if(!img){els.rules.innerHTML='<div class="empty"><div><b>XML → 이미지 선택 → 템플릿 선택</b><p class="hint">Lua 문법을 입력할 필요가 없습니다.</p></div></div>';return}const rules=state.scripts[img.name]||[];els.rules.innerHTML=rules.length?rules.map((r,i)=>r.kind==='counter'?counterHtml(r,i):r.kind==='retry'?retryHtml(r,i):r.kind==='elapsed'?elapsedHtml(r,i):r.kind==='once'?onceHtml(r,i):r.kind==='cooldown'?cooldownHtml(r,i):r.kind==='randomFound'?randomHtml(r,i):r.kind==='bestMatch'?bestHtml(r,i):conditionalHtml(r,i)).join(''):'<div class="empty"><div><b>아직 스크립트 블록이 없습니다.</b><p class="hint">위 템플릿을 선택하면 설정 가능한 블록이 추가됩니다.</p></div></div>';bindRuleEvents()}
function readActionCard(card,a){a.type=$('.action-type',card).value;const def=actionDefs[a.type]||actionDefs.currentClick;a.params=Object.fromEntries(def.fields.map(f=>[f[0],$(`[data-k="${f[0]}"]`,card)?.value??'']))}
function syncRule(ruleEl){
  const r=state.scripts[state.selected][Number(ruleEl.dataset.ri)];if(!r)return;
  if(r.kind==='conditional'){r.condition.type=$('.cond-type',ruleEl).value;const def=conditionDefs[r.condition.type]||conditionDefs.current;r.condition.params=Object.fromEntries(def.fields.map(f=>[f[0],$(`[data-k="${f[0]}"]`,$('.cond-fields',ruleEl))?.value??'']))}
  else if(r.kind==='counter'){r.varName=$('[data-k="varName"]',ruleEl).value;r.threshold=Number($('[data-k="threshold"]',ruleEl).value)||1}
  else if(r.kind==='retry'){r.image=$('[data-k="image"]',ruleEl).value;r.varName=$('[data-k="varName"]',ruleEl).value;r.attempts=Number($('[data-k="attempts"]',ruleEl).value)||1}
  else if(r.kind==='elapsed'||r.kind==='cooldown'){r.varName=$('[data-k="varName"]',ruleEl).value;r.seconds=Number($('[data-k="seconds"]',ruleEl).value)||0}
  else if(r.kind==='once'){r.varName=$('[data-k="varName"]',ruleEl).value}
  else if(r.kind==='randomFound'||r.kind==='bestMatch'){r.images=[...$('.multi-images',ruleEl).selectedOptions].map(o=>o.value).slice(0,20);if(r.kind==='bestMatch')r.minAccuracy=Number($('[data-k="minAccuracy"]',ruleEl).value)||0}
  $$('.action-card',ruleEl).forEach(card=>{const branch=card.dataset.branch,ai=Number(card.dataset.ai);if(r[branch]?.[ai])readActionCard(card,r[branch][ai])});persist();renderLua();renderFlow();renderBadge();
}
function defaultActionParams(type){if(['click','enable','goto','forceClick'].includes(type))return {image:firstOther()};if(type==='key')return {text:'<Space>',speed:'FASTER',type:'MKEVENT'};if(type==='setVar')return {varName:'result_bool',value:'1'};return {}}
function bindRuleEvents(){
  $$('.rule',els.rules).forEach(ruleEl=>{
    ruleEl.addEventListener('change',e=>{const r=state.scripts[state.selected][Number(ruleEl.dataset.ri)];if(e.target.classList.contains('cond-type')){r.condition.type=e.target.value;const def=conditionDefs[r.condition.type]||conditionDefs.current;r.condition.params=Object.fromEntries(def.fields.map(f=>[f[0],f[2]==='image'?firstOther():'']));renderRules();renderLua();renderFlow();persist();return}if(e.target.classList.contains('action-type')){const card=e.target.closest('.action-card'),a=r[card.dataset.branch][Number(card.dataset.ai)];a.type=e.target.value;a.params=defaultActionParams(a.type);renderRules();renderLua();renderFlow();persist();return}syncRule(ruleEl)});
    $$('.rule-actions button',ruleEl).forEach(b=>b.addEventListener('click',e=>e.stopPropagation()));
    $('.remove-rule',ruleEl).onclick=e=>{e.preventDefault();state.scripts[state.selected].splice(Number(ruleEl.dataset.ri),1);renderSelection();persist()};
    $('.move-up',ruleEl).onclick=e=>{e.preventDefault();moveRule(Number(ruleEl.dataset.ri),-1)};$('.move-down',ruleEl).onclick=e=>{e.preventDefault();moveRule(Number(ruleEl.dataset.ri),1)};
    $$('.add-action',ruleEl).forEach(b=>b.onclick=e=>{e.preventDefault();syncRule(ruleEl);const r=state.scripts[state.selected][Number(ruleEl.dataset.ri)],branch=b.dataset.branch;r[branch].push(act('currentClick'));renderRules();renderLua();renderFlow();persist()});
    $$('.remove-action',ruleEl).forEach(b=>b.onclick=e=>{e.preventDefault();const card=b.closest('.action-card'),r=state.scripts[state.selected][Number(ruleEl.dataset.ri)];r[card.dataset.branch].splice(Number(card.dataset.ai),1);renderRules();renderLua();renderFlow();persist()});
  });
}
function moveRule(i,d){const a=state.scripts[state.selected],j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];renderRules();renderLua();renderFlow();persist()}
function renderBadge(){const img=selectedImage();if(img)els.badge.textContent=`${state.scripts[img.name]?.length||0} 블록`}

function num(v,d=0){const n=Number(v);return Number.isFinite(n)?n:d}
function luaLiteral(v=''){const s=String(v).trim();if(/^[-+]?\d+(?:\.\d+)?$/.test(s)||s==='true'||s==='false'||s==='nil')return s;return escLua(s)}
function luaValueOrString(v=''){const s=String(v).trim();return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s)?s:escLua(s)}
function compileAction(a,indent=''){
  const p=a.params||{},line=s=>indent+s;
  switch(a.type){
    case'currentClick':return line('ImageClick()');
    case'click':{const x=num(p.offsetX),y=num(p.offsetY);return x||y?line(`ImageClick(${escLua(p.image)}, ${x}, ${y}, 5, 5, 0.5)`):line(`ImageClick(${escLua(p.image)})`)}
    case'forceClick':return line(`ImageClickForce(${escLua(p.image)})`);
    case'enable':return line(`EnableImage(${String(p.enabled)!=='false'?'true':'false'}, ${escLua(p.image)})`);
    case'goto':return line(`GotoImage(${escLua(p.image)})`);
    case'key':return line(`Keybd(${escLua(p.text||'<Space>')}, ${p.speed||'FASTER'}, ${p.type||'MKEVENT'})`);
    case'mouse':return line(`Mouse(LBUTTON, CLICK, ${num(p.x)}, ${num(p.y)}, 0, 0, ${num(p.randX,5)}, ${num(p.randY,5)}, 0.5, 1, NORMAL, MKEVENT)`);
    case'drag':return line(`MouseDrag(LBUTTON, ${num(p.x1)}, ${num(p.y1)}, ${num(p.press1,.5)}, ${num(p.x2)}, ${num(p.y2)}, ${num(p.press2,.5)})`);
    case'setVar':return line(`${luaId(p.varName||'value')} = ${luaLiteral(p.value)}`);
    case'addVar':{const v=luaId(p.varName||'count');return line(`${v} = (${v} or 0) + ${num(p.amount,1)}`)}
    case'subVar':{const v=luaId(p.varName||'count');return line(`${v} = (${v} or 0) - ${num(p.amount,1)}`)}
    case'toggleVar':{const v=luaId(p.varName||'toggle');return line(`${v} = (${v} == 1) and 0 or 1`)}
    case'clipboardSet':return line(`SetClipboardData(${escLua(p.text||'')}, ${String(p.unicode)!=='false'?'true':'false'})`);
    case'sleep':return line(`Sleep(${Math.max(0,num(p.ms,500))})`);
    case'openScript':return line(`OpenScript(${escLua(p.name)})`);
    case'stop':return line('Stop()');
    case'sound':return line(`PlaySound(${escLua(p.file||'alarm.wav')}, ${num(p.sec,3)})`);
    case'screenshot':return line('SaveScreenshot()');
    case'screenshotNamed':return line(`SaveScreenshot(${escLua(p.filename||'result.png')})`);
    case'print':return line(`print(${escLua(p.text||'로그')})`);
    case'printVar':{const v=luaId(p.varName||'value');return line(`print(${escLua((p.label||v)+': ')}..tostring(${v}))`)}
    case'telegram':return line(`SendTelegram(${luaValueOrString(p.token)}, ${luaValueOrString(p.chatId)}, ${escLua(p.text||'')}, '')`);
    case'telegramShot':return `${line('local _im_share_path = SaveScreenshot()')}\n${line(`SendTelegram(${luaValueOrString(p.token)}, ${luaValueOrString(p.chatId)}, ${escLua(p.text||'')}, _im_share_path)`)}`;
    case'discord':return line(`SendDiscord(${luaValueOrString(p.url)}, ${escLua(p.name||'ImageMax')}, ${escLua(p.text||'')}, '')`);
    case'discordShot':return `${line('local _im_share_path = SaveScreenshot()')}\n${line(`SendDiscord(${luaValueOrString(p.url)}, ${escLua(p.name||'ImageMax')}, ${escLua(p.text||'')}, _im_share_path)`)}`;
    case'kakao':return line(`SendKakaoTalk(${escLua(p.room||'')}, ${escLua(p.text||'')}, ${String(p.screenshot)==='true'?'true':'false'})`);
    case'passAct':return line(`PassAct(${Math.max(1,num(p.count,1))})`);
    case'passAll':return line('PassAllAct()');
    case'fail':return line('GotoFailAct()');
    default:return line('-- 지원되지 않는 행동');
  }
}
function compileCondition(c){
  const p=c.params||{},op=['==','~=','>','>=','<','<='].includes(p.operator)?p.operator:'==';
  switch(c.type){
    case'current':return 'true';
    case'found':return p.accuracy?`ImageSearch(${escLua(p.image)}, ${num(p.accuracy)}, GetImageROI(${escLua(p.image)})) == 1`:`ImageSearch(${escLua(p.image)}) == 1`;
    case'notfound':return p.accuracy?`ImageSearch(${escLua(p.image)}, ${num(p.accuracy)}, GetImageROI(${escLua(p.image)})) == 0`:`ImageSearch(${escLua(p.image)}) == 0`;
    case'enabled':return `IsEnableImage(${escLua(p.image)}) == true`;
    case'disabled':return `IsEnableImage(${escLua(p.image)}) == false`;
    case'variable':return `${luaId(p.varName||'value')} ${op} ${luaLiteral(p.value)}`;
    case'multi':return `MultiImage(${escLua(p.expression)}) == 1`;
    case'pixel':return `(function() local r,g,b=GetPixelRGB(${num(p.x)}, ${num(p.y)}); return r==${num(p.r)} and g==${num(p.g)} and b==${num(p.b)} end)()`;
    case'clipboard':return `GetClipboardData() ${op} ${escLua(p.value||'')}`;
    case'ini':return `IniGetValue(${escLua(p.app||'')}, ${escLua(p.key||'')}, ${escLua(p.file||'default.ini')}) ${op} ${escLua(p.value||'')}`;
    case'windowFound':return `FindWindow(${escLua(p.className||'')}, ${escLua(p.windowName||'')}) ~= 0`;
    case'windowNotFound':return `FindWindow(${escLua(p.className||'')}, ${escLua(p.windowName||'')}) == 0`;
    case'targetWidth':return `(function() local x,y,w,h=GetTargetWindowPos(); return w ${op} ${num(p.value)} end)()`;
    case'targetHeight':return `(function() local x,y,w,h=GetTargetWindowPos(); return h ${op} ${num(p.value)} end)()`;
    case'stopped':return 'IsStop() == 1';case'paused':return 'IsPause() == 1';default:return 'true';
  }
}
function compileRule(r){
  if(r.kind==='counter'){const v=luaId(r.varName||'image_count');return `${v} = ${v} or 0\n${v} = ${v} + 1\nif ${v} >= ${Math.max(1,num(r.threshold,3))} then\n${(r.actions||[]).map(a=>compileAction(a,'    ')).join('\n')||'    -- 실행할 행동 없음'}\n    ${v} = 0\nend`}
  if(r.kind==='retry'){const img=r.image||'',v=luaId(r.varName||'recheck_count'),attempts=Math.max(1,num(r.attempts,5));return `${v} = ${v} or 0\nlocal ret = ImageSearch(${escLua(img)})\nif ret == 1 then\n${(r.foundActions||[]).map(a=>compileAction(a,'    ')).join('\n')||'    -- 발견 후 행동 없음'}\n    ${v} = 0\nelse\n    ${v} = ${v} + 1\n    if ${v} >= ${attempts} then\n${(r.exhaustedActions||[]).map(a=>compileAction(a,'        ')).join('\n')||'        -- 최대 횟수 도달'}\n        ${v} = 0\n    end\nend`}
  if(r.kind==='elapsed'){const v=luaId(r.varName||'elapsed_timer'),sec=Math.max(0,num(r.seconds,60));return `${v} = ${v} or os.clock()\nif os.clock() - ${v} >= ${sec} then\n${(r.actions||[]).map(a=>compileAction(a,'    ')).join('\n')||'    -- 실행할 행동 없음'}\n    ${v} = os.clock()\nend`}
  if(r.kind==='once'){const v=luaId(r.varName||'once_done');return `${v} = ${v} or 0\nif ${v} == 0 then\n${(r.actions||[]).map(a=>compileAction(a,'    ')).join('\n')||'    -- 실행할 행동 없음'}\n    ${v} = 1\nend`}
  if(r.kind==='cooldown'){const v=luaId(r.varName||'cooldown_time'),sec=Math.max(0,num(r.seconds,10));return `local _im_now = os.clock()\n${v} = ${v} or 0\nif _im_now - ${v} >= ${sec} then\n${(r.actions||[]).map(a=>compileAction(a,'    ')).join('\n')||'    -- 실행할 행동 없음'}\n    ${v} = _im_now\nend`}
  if(r.kind==='randomFound'){const names=(r.images||[]).slice(0,20);return `local _im_candidates = {${names.map(escLua).join(', ')}}\nlocal _im_found = {}\nfor _, _im_name in ipairs(_im_candidates) do\n    local ret, acc, ix, iy = ImageSearch(_im_name)\n    if ret == 1 then table.insert(_im_found, {name=_im_name, x=ix, y=iy}) end\nend\nif #_im_found > 0 then\n    local _im_pick = _im_found[math.random(#_im_found)]\n    Mouse(LBUTTON, CLICK, _im_pick.x, _im_pick.y)\nend`}
  if(r.kind==='bestMatch'){const names=(r.images||[]).slice(0,20),min=Math.max(0,num(r.minAccuracy,80));return `local _im_candidates = {${names.map(escLua).join(', ')}}\nlocal _im_best_acc, _im_best_name, _im_best_x, _im_best_y = ${min-1}, nil, nil, nil\nfor _, _im_name in ipairs(_im_candidates) do\n    local ret, acc, ix, iy = ImageSearch(_im_name)\n    if ret == 1 and acc >= ${min} and acc > _im_best_acc then\n        _im_best_acc, _im_best_name, _im_best_x, _im_best_y = acc, _im_name, ix, iy\n    end\nend\nif _im_best_name then\n    Mouse(LBUTTON, CLICK, _im_best_x, _im_best_y)\nend`}
  if(r.condition?.type==='current')return (r.then||[]).map(a=>compileAction(a)).join('\n')||'-- 실행할 행동 없음';
  const cond=compileCondition(r.condition),t=(r.then||[]).map(a=>compileAction(a,'    ')).join('\n')||'    -- 실행할 행동 없음',e=r.else?.length?`\nelse\n${r.else.map(a=>compileAction(a,'    ')).join('\n')}`:'';return `if ${cond} then\n${t}${e}\nend`;
}
function generatedLua(){if(!state.selected)return '-- 이미지를 선택하세요.';const rules=state.scripts[state.selected]||[];return `-- This is IM's script file. Do not remove this comment line.\n-- ImageMax Web Tools V6 · 1회 실행 액션 스크립트\n-- XML: ${state.xmlName||'-'}\n-- Assigned image: ${state.selected}\n-- 반복/순회 제어권은 ImageMax에 있습니다. 이 파일은 호출 1회 후 즉시 반환됩니다.\n\n${rules.map(compileRule).join('\n\n')||'-- 템플릿을 선택하면 코드가 생성됩니다.'}\n`}
function hasBlockingLoop(code){return /\bwhile\s+true\b|\brepeat\b/.test(code)}
function safeLua(){const code=generatedLua();if(hasBlockingLoop(code))throw new Error('ImageMax 리스트 순회를 막는 무한/반복 대기 구조가 감지되었습니다.');return code}
function renderLua(){try{els.lua.textContent=safeLua()}catch(e){els.lua.textContent='-- 오류: '+e.message}}
els.copy.onclick=()=>{try{copyText(safeLua())}catch(e){alert(e.message)}};els.dl.onclick=()=>{try{download(`${sanitizeId(state.selected)}_web.lua`,'\ufeff'+safeLua())}catch(e){alert(e.message)}};

function actionSummary(a){const p=a.params||{};return ({currentClick:'현재 이미지 클릭',click:`${p.image||'다른 이미지'} 클릭`,enable:`${p.image||'이미지'} ${String(p.enabled)!=='false'?'활성':'비활성'}`,goto:`${p.image||'이미지'}로 순서 이동`,key:`키 ${p.text||''} 입력`,setVar:`${p.varName||'변수'} = ${p.value??''}`,addVar:`${p.varName||'변수'} + ${p.amount||1}`,passAll:'이후 액션 모두 건너뛰기',passAct:`다음 ${p.count||1}개 액션 건너뛰기`,fail:'실패 액션으로 이동',screenshot:'스크린샷 저장',stop:'ImageMax 중지'})[a.type]||actionDefs[a.type]?.label||a.type}
function ruleSummary(r){if(r.kind==='counter')return `호출 횟수 ${r.threshold||3}회 도달 → ${(r.actions||[]).map(actionSummary).join(' → ')}`;if(r.kind==='retry')return `${r.image||'다른 이미지'}를 순회당 1회 확인 (최대 ${r.attempts||5}회)`;if(r.kind==='elapsed')return `${r.seconds||0}초 경과 → ${(r.actions||[]).map(actionSummary).join(' → ')}`;if(r.kind==='once')return `최초 1회만 → ${(r.actions||[]).map(actionSummary).join(' → ')}`;if(r.kind==='cooldown')return `${r.seconds||0}초 쿨타임 → ${(r.actions||[]).map(actionSummary).join(' → ')}`;if(r.kind==='randomFound')return `후보 ${r.images?.length||0}개 검색 → 발견 후보 중 랜덤 1개 클릭`;if(r.kind==='bestMatch')return `후보 ${r.images?.length||0}개 검색 → 최고 정확도 1개 클릭`;return `${conditionDefs[r.condition?.type]?.label||'조건'} → ${(r.then||[]).map(actionSummary).join(' → ')||'행동 없음'}`}
function renderFlow(){const rules=state.selected?(state.scripts[state.selected]||[]):[];els.flow.innerHTML=rules.length?`<ol>${rules.map((r,i)=>`<li><span class="flow-num">${i+1}</span><div><b>${html(ruleSummary(r))}</b><small>실행 후 즉시 ImageMax 리스트 제어권으로 반환</small></div></li>`).join('')}</ol>`:'<div class="hint">템플릿을 적용하면 사람이 읽을 수 있는 실행 흐름이 여기에 표시됩니다.</div>'}

function normalizeRules(){for(const rules of Object.values(state.scripts||{}))for(const r of rules||[]){if(r.kind==='retry'){r.foundActions=r.foundActions||[];r.exhaustedActions=r.exhaustedActions||[]}if(['elapsed','counter','once','cooldown'].includes(r.kind))r.actions=r.actions||[]}}
function persist(){try{localStorage.setItem('imagemaxScriptProject',encodeProject({format:'imagemax-web-script',version:6,xmlName:state.xmlName,images:state.images,scripts:state.scripts,selected:state.selected}));localStorage.setItem('imagemaxCustomTemplates',JSON.stringify(state.customTemplates))}catch{}}

function safeTemplateForStore(t){return {id:t.id,title:t.title,desc:t.desc||'',category:CATEGORY_LABELS[t.category]?t.category:'custom',tag:t.tag||'내 템플릿',author:t.author||'',rules:clone(t.rules),createdAt:t.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}}
function openTemplateSaveModal(){
  if(!state.selected)return toast('이미지를 먼저 선택하세요.');const rules=state.scripts[state.selected]||[];if(!rules.length)return toast('먼저 템플릿/블록을 하나 이상 적용하세요.');
  els.templateName.value=`${state.selected} 사용자 템플릿`;els.templateCategory.value='custom';els.templateAuthor.value=localStorage.getItem('imagemaxTemplateAuthor')||'';els.templateTag.value='';els.templateDesc.value=`${state.selected} 이미지에서 자주 사용하는 ImageMax 액션 구성`;els.templateRuleSummary.textContent=`${rules.length}개 블록 · ${rules.reduce((n,r)=>n+(r.then?.length||r.actions?.length||r.foundActions?.length||0),0)}개 주요 행동`;els.templateModal.classList.add('open');els.templateModal.setAttribute('aria-hidden','false');setTimeout(()=>els.templateName.focus(),0)
}
function closeTemplateSaveModal(){els.templateModal.classList.remove('open');els.templateModal.setAttribute('aria-hidden','true')}
function saveCurrentAsTemplate(){
  if(!state.selected)return;const rules=state.scripts[state.selected]||[];const title=els.templateName.value.trim();if(!title)return toast('템플릿 이름을 입력하세요.');const author=els.templateAuthor.value.trim();if(author)localStorage.setItem('imagemaxTemplateAuthor',author);
  const t=safeTemplateForStore({id:`custom_${Date.now().toString(36)}`,title,desc:els.templateDesc.value.trim(),category:els.templateCategory.value,tag:els.templateTag.value.trim()||'내 템플릿',author,rules});state.customTemplates.unshift(t);state.templateMode='mine';$$('[data-template-mode]').forEach(x=>x.classList.toggle('active',x.dataset.templateMode==='mine'));persist();renderTemplates();closeTemplateSaveModal();toast('내 템플릿으로 저장했습니다. 내보내기/공유가 가능합니다.')
}
els.saveTemplate.onclick=openTemplateSaveModal;els.templateModalSave.onclick=saveCurrentAsTemplate;els.templateModalClose.onclick=els.templateModalCancel.onclick=closeTemplateSaveModal;els.templateModal.onclick=e=>{if(e.target===els.templateModal)closeTemplateSaveModal()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&els.templateModal.classList.contains('open'))closeTemplateSaveModal()});
function exportOneTemplate(id){const t=state.customTemplates.find(x=>x.id===id);if(!t)return;download(`${sanitizeId(t.title)}.imxtpl.json`,JSON.stringify(makeTemplatePack([t],{name:t.title,author:t.author||''}),null,2),'application/json')}
function exportAllTemplates(){if(!state.customTemplates.length)return toast('내 템플릿이 없습니다.');download('imagemax-my-templates.imxtplpack.json',JSON.stringify(makeTemplatePack(state.customTemplates,{name:'My ImageMax Templates',author:state.customTemplates.find(t=>t.author)?.author||''}),null,2),'application/json')}
els.exportTemplates.onclick=exportAllTemplates;
function deleteCustomTemplate(id){const t=state.customTemplates.find(x=>x.id===id);if(!t||!confirm(`'${t.title}' 템플릿을 삭제할까요?`))return;state.customTemplates=state.customTemplates.filter(x=>x.id!==id);persist();renderTemplates()}
async function importTemplateFile(file){const p=validateTemplatePack(await readJsonFile(file));let added=0;for(const raw of p.templates){const t=safeTemplateForStore(raw);const idx=state.customTemplates.findIndex(x=>x.id===t.id);if(idx>=0)state.customTemplates[idx]=t;else state.customTemplates.unshift(t);added++}persist();state.templateMode='mine';$$('[data-template-mode]').forEach(x=>x.classList.toggle('active',x.dataset.templateMode==='mine'));renderTemplates();toast(`${added}개 템플릿을 가져왔습니다.`)}
els.templateFile.addEventListener('change',async e=>{try{if(e.target.files[0])await importTemplateFile(e.target.files[0])}catch(err){alert(err.message)}e.target.value=''});
els.importTemplate.onclick=()=>els.templateFile.click();

function buildSubmissionBody(pack){const json=JSON.stringify(pack,null,2);return `<!-- IMAGEMAX_TEMPLATE_SUBMISSION -->\nImageMax Web Tools에서 제출한 공유 템플릿입니다.\n\n<!-- IMAGEMAX_TEMPLATE_JSON_START -->\n\`\`\`json\n${json}\n\`\`\`\n<!-- IMAGEMAX_TEMPLATE_JSON_END -->\n`}
async function submitPack(pack){validateTemplatePack(pack);if(pack.templates.length>20)throw new Error('공유 신청은 한 번에 최대 20개 템플릿까지 가능합니다. 팩을 나누어 제출하세요.');const endpoint=window.IMAGEMAX_SHARE_ENDPOINT||'';if(endpoint){const res=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(pack)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`공유 API 오류 ${res.status}`);toast('공유 제출이 접수되었습니다.');if(data.url)window.open(data.url,'_blank','noopener');return}
  const body=buildSubmissionBody(pack);if(body.length>50000)throw new Error('GitHub Issue 제출 방식의 안전 크기를 넘었습니다. 템플릿을 나눠 제출하거나 서버리스 직접 제출을 설정하세요.');
  const title=`[Template] ${pack.templates[0]?.title||pack.name||'ImageMax template'}`;const encodedBody=encodeURIComponent(body);
  if(encodedBody.length<=6000){const url=`https://github.com/${SHARE_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodedBody}`;window.open(url,'_blank','noopener');toast('GitHub 제출 화면을 열었습니다. Issue를 등록하면 Action이 검증합니다.');return}
  await copyText(body);const url=`https://github.com/${SHARE_REPO}/issues/new?title=${encodeURIComponent(title)}`;window.open(url,'_blank','noopener');alert('템플릿 데이터가 길어 URL에 안전하게 넣기 어려워 Issue 본문을 클립보드에 복사했습니다. 열린 GitHub Issue의 본문에 붙여넣고 등록하세요. 완전한 원클릭 제출은 optional-worker를 설정하면 사용할 수 있습니다.');
}
function shareCustomTemplate(id){const t=state.customTemplates.find(x=>x.id===id);if(!t)return;submitPack(makeTemplatePack([t],{name:t.title,author:t.author||''})).catch(e=>alert(e.message))}
els.shareUpload.onclick=()=>els.shareFile.click();
els.shareFile.addEventListener('change',async e=>{try{if(!e.target.files[0])return;const p=validateTemplatePack(await readJsonFile(e.target.files[0]));await submitPack(p)}catch(err){alert(err.message)}e.target.value=''});

async function loadCommunityIndex(){try{const r=await fetch('../community/index.json',{cache:'no-store'});if(!r.ok)throw new Error();const data=await r.json();state.communityTemplates=(data.templates||[]).map(x=>({...x,builtin:false,community:true}));if(els.communityStatus)els.communityStatus.textContent=`공유 템플릿 ${state.communityTemplates.length}개`;renderTemplates()}catch{if(els.communityStatus)els.communityStatus.textContent='공유 목록을 불러오지 못했습니다.'}}
async function fetchCommunityPack(meta){const path=meta.path||`community/templates/${meta.id}.json`;const r=await fetch(`../${path.replace(/^\.\//,'')}`,{cache:'no-store'});if(!r.ok)throw new Error('공유 템플릿 파일을 읽지 못했습니다.');return validateTemplatePack(await r.json())}
async function applyCommunityTemplate(id){try{const meta=state.communityTemplates.find(x=>x.id===id);if(!meta)return;const pack=await fetchCommunityPack(meta),t=pack.templates.find(x=>x.id===id)||pack.templates[0];state.scripts[state.selected].push(...clone(t.rules));renderSelection();persist();toast(`'${t.title}' 공유 템플릿을 적용했습니다.`)}catch(e){alert(e.message)}}
async function downloadCommunityTemplate(id){try{const meta=state.communityTemplates.find(x=>x.id===id);const pack=await fetchCommunityPack(meta);download(`${sanitizeId(meta.title||id)}.imxtpl.json`,JSON.stringify(pack,null,2),'application/json')}catch(e){alert(e.message)}}


function activateWorkPane(name){
  $$('[data-work-pane]').forEach(b=>b.classList.toggle('active',b.dataset.workPane===name));
  $$('[data-work-pane-panel]').forEach(p=>p.classList.toggle('active',p.dataset.workPanePanel===name));
}
$$('[data-work-pane]').forEach(b=>b.addEventListener('click',()=>activateWorkPane(b.dataset.workPane)));
const scriptGrid=$('#scriptGrid'),focusBtn=$('#toggleFocus');
if(focusBtn&&scriptGrid){focusBtn.onclick=()=>{const on=scriptGrid.classList.toggle('code-focus');focusBtn.textContent=on?'전체 화면':'코드 집중';focusBtn.classList.toggle('primary',on)}}

$('#saveProject').onclick=()=>download(`${sanitizeId(state.xmlName.replace(/\.xml$/i,'')||'imagemax')}.imxweb.json`,encodeProject({format:'imagemax-web-script',version:6,xmlName:state.xmlName,images:state.images,scripts:state.scripts,selected:state.selected}),'application/json');
$('#loadProject').addEventListener('change',async e=>{try{const p=await readJsonFile(e.target.files[0]);if(p.format!=='imagemax-web-script')throw new Error('ImageMax Script Builder 프로젝트가 아닙니다.');Object.assign(state,{xmlName:p.xmlName||'',images:p.images||[],scripts:p.scripts||{},selected:p.selected||null});normalizeRules();els.search.disabled=!state.images.length;renderAll();persist();toast('프로젝트를 불러왔습니다.')}catch(err){alert(err.message)}e.target.value=''});
$('#exportAll').onclick=()=>{const entries=Object.entries(state.scripts).filter(([,r])=>r?.length);if(!entries.length)return toast('저장할 스크립트 블록이 없습니다.');const prev=state.selected,files=[],manifest={format:'imagemax-script-bundle',executionModel:'single-action-per-list-visit',xmlName:state.xmlName,generatedAt:new Date().toISOString(),assignments:[]};for(const [name] of entries){state.selected=name;const file=`${sanitizeId(name)}_web.lua`;files.push({name:`lua/${file}`,data:'\ufeff'+safeLua()});manifest.assignments.push({image:name,file})}state.selected=prev;files.push({name:'manifest.json',data:JSON.stringify(manifest,null,2)});files.push({name:'README.txt',data:'ImageMax Web Tools V6 export\n각 Lua는 ImageMax의 스크립트 입력 액션 한 칸에서 1회 실행 후 반환됩니다.\n무한 루프는 생성하지 않습니다.\n원본 XML은 수정하지 않습니다.'});downloadBytes(`${sanitizeId(state.xmlName.replace(/\.xml$/i,'')||'imagemax')}_scripts.zip`,makeStoreZip(files),'application/zip');toast(`${entries.length}개 Lua를 ZIP으로 만들었습니다.`)};
$('#newProject').onclick=()=>{if(!confirm('현재 작업을 초기화할까요? 내 템플릿은 유지됩니다.'))return;if(state.previewUrl)URL.revokeObjectURL(state.previewUrl);Object.assign(state,{xmlName:'',images:[],selected:null,scripts:{},imageFiles:new Map(),imageFolderStats:null,previewUrl:null});els.xml.value='';els.folder.value='';els.search.value='';els.search.disabled=true;renderFolderStatus();renderAll();persist()};

try{
  const p=JSON.parse(localStorage.getItem('imagemaxScriptProject')||'null');
  if(p?.format==='imagemax-web-script'){Object.assign(state,{xmlName:p.xmlName||'',images:p.images||[],scripts:p.scripts||{},selected:p.selected||null});normalizeRules();els.search.disabled=!state.images.length}
  state.customTemplates=JSON.parse(localStorage.getItem('imagemaxCustomTemplates')||'[]')||[];
  state.favorites=new Set(JSON.parse(localStorage.getItem('imagemaxTemplateFavorites')||'[]')||[]);state.favoriteOnly=localStorage.getItem('imagemaxTemplateFavoriteOnly')==='1';els.favoriteOnly.classList.toggle('active',state.favoriteOnly);els.favoriteOnly.textContent=state.favoriteOnly?'★':'☆';els.favoriteOnly.title=state.favoriteOnly?'즐겨찾기만 표시 중':'별표한 템플릿만 보기';
  const pendingRaw=localStorage.getItem('imagemaxPendingTemplateImport');
  if(pendingRaw){
    const pending=validateTemplatePack(JSON.parse(pendingRaw));
    for(const raw of pending.templates){const t=safeTemplateForStore(raw);const idx=state.customTemplates.findIndex(x=>x.id===t.id);if(idx>=0)state.customTemplates[idx]=t;else state.customTemplates.unshift(t)}
    localStorage.removeItem('imagemaxPendingTemplateImport');state.templateMode='mine';
    $$('[data-template-mode]').forEach(x=>x.classList.toggle('active',x.dataset.templateMode==='mine'));
    toast(`${pending.templates.length}개 공유 템플릿을 내 템플릿으로 가져왔습니다.`);
  }
}catch{state.customTemplates=[]}
renderFolderStatus();renderAll();loadCommunityIndex();
