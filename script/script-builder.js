import {$,$$,escLua,sanitizeId,luaId,download,downloadBytes,makeStoreZip,copyText,toast,uid,encodeProject,readJsonFile,html} from '../assets/common.js';

const state={xmlName:'',images:[],selected:null,scripts:{},imageFiles:new Map(),version:1};
const els={xml:$('#xmlFile'),search:$('#imageSearch'),list:$('#imageList'),count:$('#imageCount'),preview:$('#previewBox'),folder:$('#imageFolder'),title:$('#workspaceTitle'),sub:$('#workspaceSub'),rules:$('#ruleList'),details:$('#imageDetails'),lua:$('#luaPreview'),badge:$('#assignedBadge'),addC:$('#addConditional'),addN:$('#addCounter'),addR:$('#addRetry'),copy:$('#copyLua'),dl:$('#downloadLua')};

const conditionDefs={
  current:{label:'현재 리스트 이미지가 인식되어 이 스크립트가 실행됨 (기본)',fields:[]},
  found:{label:'다른 이미지를 1회 확인해서 찾았을 때',fields:[['image','대상 이미지','image'],['accuracy','최소 정확도(선택)','number']]},
  notfound:{label:'다른 이미지를 1회 확인해서 찾지 못했을 때',fields:[['image','대상 이미지','image'],['accuracy','최소 정확도(선택)','number']]},
  enabled:{label:'이미지가 활성 상태일 때',fields:[['image','대상 이미지','image']]},
  disabled:{label:'이미지가 비활성 상태일 때',fields:[['image','대상 이미지','image']]},
  multi:{label:'여러 이미지 조건이 맞을 때',fields:[['expression','조건식 (&=AND, |=OR)','text']]},
  variable:{label:'변수 값을 비교할 때',fields:[['varName','변수 이름','text'],['operator','비교','operator'],['value','비교 값','text']]},
  pixel:{label:'픽셀 RGB가 같을 때',fields:[['x','X','number'],['y','Y','number'],['r','R','number'],['g','G','number'],['b','B','number']]},
  cursorArea:{label:'커서가 영역 안에 있을 때',fields:[['x1','X1','number'],['y1','Y1','number'],['x2','X2','number'],['y2','Y2','number']]},
  stopped:{label:'ImageMax가 Stop 상태일 때',fields:[]},
  paused:{label:'ImageMax가 Pause 상태일 때',fields:[]}
};
const actionDefs={
  currentClick:{label:'현재 인식 이미지 클릭 (재검색 없음)',fields:[]},
  click:{label:'다른 이미지 검색 후 클릭',fields:[['image','대상 이미지','image'],['offsetX','X 오프셋','number'],['offsetY','Y 오프셋','number']]},
  forceClick:{label:'저장 위치 강제 클릭',fields:[['image','대상 이미지','image']]},
  enable:{label:'이미지 활성/비활성',fields:[['image','대상 이미지','image'],['enabled','상태','boolean']]},
  goto:{label:'다음 인식 순서 이동',fields:[['image','이동할 이미지','image']]},
  key:{label:'키보드 입력',fields:[['text','ImageMax 키 입력 문자열','text'],['speed','속도','speed'],['type','입력 방식','inputType']]},
  mouse:{label:'좌표 클릭',fields:[['x','X','number'],['y','Y','number'],['randX','랜덤 X','number'],['randY','랜덤 Y','number']]},
  drag:{label:'마우스 드래그',fields:[['x1','시작 X','number'],['y1','시작 Y','number'],['x2','종료 X','number'],['y2','종료 Y','number'],['press1','시작 누름(초)','number'],['press2','종료 누름(초)','number']]},
  sleep:{label:'딜레이',fields:[['ms','밀리초','number']]},
  openScript:{label:'다른 ImageMax 스크립트 열기',fields:[['name','스크립트 이름','text']]},
  stop:{label:'ImageMax 중지',fields:[]},
  sound:{label:'사운드 재생',fields:[['file','WAV 파일명','text'],['sec','알람 초','number']]},
  screenshot:{label:'스크린샷 저장',fields:[['file','파일명','text']]},
  print:{label:'로그 출력',fields:[['text','메시지','text']]},
  passAct:{label:'다음 N개 액션 건너뛰기',fields:[['count','개수','number']]},
  passAll:{label:'이후 모든 액션 건너뛰기',fields:[]},
  fail:{label:'인식 실패 액션으로 이동',fields:[]}
};

function decodeXml(buffer){
  const bytes=new Uint8Array(buffer.slice(0,160));let head='';for(const b of bytes) head+=String.fromCharCode(b);
  const m=head.match(/encoding=["']([^"']+)/i);const enc=(m?.[1]||'utf-8').toLowerCase();
  const candidates=enc.includes('euc')||enc.includes('949')||enc.includes('5601')?['euc-kr','windows-949','utf-8']:['utf-8','euc-kr'];
  for(const c of candidates){try{return {text:new TextDecoder(c).decode(buffer),encoding:c}}catch{}}
  return {text:new TextDecoder().decode(buffer),encoding:'utf-8'};
}
function parseTuple(v=''){return v.replace(/[()]/g,'').split(',').map(x=>Number(x.trim())||0)}
function parseXml(text){
  const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror')) throw new Error('XML 파싱 오류');
  const nodes=[...doc.querySelectorAll('GENERAL > *')].filter(n=>/^Image_\d+$/.test(n.tagName));
  return nodes.map((n,index)=>{
    const q=s=>n.querySelector(`:scope > ${s}`);const trg=q('Trg');const actions=[...n.children].filter(c=>/^Act_\d+$/.test(c.tagName)).map(a=>({name:a.querySelector(':scope > Name')?.textContent||'',enabled:a.querySelector(':scope > Enable')?.textContent!=='0',param:a.querySelector(':scope > Param')?.textContent||'',luaFile:a.querySelector(':scope > Attr')?.getAttribute('LuaFile')||'',luaText:a.querySelector(':scope > Attr')?.getAttribute('Text')||''}));
    return {index:index+1,name:q('Name')?.textContent||`Image_${index+1}`,rect:parseTuple(q('Rect')?.textContent),roi:parseTuple(q('ROI')?.textContent),enabled:q('Enable')?.textContent!=='0',group:Number(q('Group')?.textContent)||0,accuracy:Number(trg?.getAttribute('Acc'))||80,actions};
  });
}

els.xml.addEventListener('change',async()=>{const f=els.xml.files[0];if(!f)return;try{const buf=await f.arrayBuffer();const {text,encoding}=decodeXml(buf);state.images=parseXml(text);state.xmlName=f.name;state.scripts={};state.selected=null;els.search.disabled=false;renderImages();renderSelection();persist();toast(`${state.images.length}개 이미지 로드 · ${encoding}`)}catch(e){alert(`XML을 읽지 못했습니다: ${e.message}`)}});
els.search.addEventListener('input',renderImages);
els.folder.addEventListener('change',()=>{state.imageFiles.clear();for(const f of els.folder.files){const base=f.name.replace(/\.[^.]+$/,'');state.imageFiles.set(base,f)}renderPreview()});

function renderImages(){const q=els.search.value.trim().toLowerCase();const list=state.images.filter(i=>i.name.toLowerCase().includes(q));els.count.textContent=String(list.length);els.list.innerHTML=list.map(i=>`<div class="image-item ${state.selected===i.name?'active':''}" data-name="${html(i.name)}"><div><div class="image-name">${html(i.name)}</div><div class="image-meta">ROI ${i.roi.join(', ')} · Acc ${i.accuracy}% · Group ${i.group}</div></div><span class="badge ${i.enabled?'ok':''}">${i.enabled?'ON':'OFF'}</span></div>`).join('')||'<div class="hint">일치하는 이미지가 없습니다.</div>';$$('.image-item',els.list).forEach(x=>x.onclick=()=>selectImage(x.dataset.name));}
function selectImage(name){state.selected=name;if(!state.scripts[name]) state.scripts[name]=[];renderImages();renderSelection();persist();}
function selectedImage(){return state.images.find(i=>i.name===state.selected)}
function renderSelection(){const img=selectedImage();const active=!!img;els.addC.disabled=els.addN.disabled=els.addR.disabled=els.copy.disabled=els.dl.disabled=!active;els.title.textContent=active?img.name:'이미지를 먼저 선택하세요';els.sub.textContent=active?`Image_${img.index} · ROI (${img.roi.join(', ')}) · 정확도 ${img.accuracy}%`:'선택한 ImageMax 이미지에 부여할 Lua를 블록으로 구성합니다.';els.badge.textContent=active?`${(state.scripts[img.name]||[]).length} 블록`:'미선택';renderPreview();renderDetails();renderRules();renderLua();}
function renderPreview(){const img=selectedImage();if(!img){els.preview.innerHTML='선택 이미지 정보가 여기에 표시됩니다.';return}const f=state.imageFiles.get(img.name);if(f){const url=URL.createObjectURL(f);els.preview.innerHTML=`<img src="${url}" alt="${html(img.name)}" style="max-width:100%;max-height:100%;object-fit:contain">`;return}els.preview.innerHTML=`<div><b>${html(img.name)}</b><div class="hint" style="margin-top:6px">Rect (${img.rect.join(', ')})<br>ROI (${img.roi.join(', ')})</div></div>`;}
function renderDetails(){const img=selectedImage();if(!img){els.details.innerHTML='<div class="hint">이미지를 선택하면 ROI, 정확도, 활성상태와 기존 액션 순서를 확인할 수 있습니다.</div>';return}const stack=img.actions.map((a,i)=>`<div class="existing"><div class="name">Act_${i+1} · ${html(a.name||'액션')} ${a.enabled?'':'(비활성)'}</div>${a.luaFile?`<div class="hint">LuaFile: ${html(a.luaFile)}</div><pre>${html(a.luaText||a.param)}</pre>`:`<div class="hint">${html(a.param||'')}</div>`}</div>`).join('');els.details.innerHTML=`<dl class="kv"><dt>이미지</dt><dd>${html(img.name)}</dd><dt>Rect</dt><dd>(${img.rect.join(', ')})</dd><dt>ROI</dt><dd>(${img.roi.join(', ')})</dd><dt>정확도</dt><dd>${img.accuracy}%</dd><dt>상태</dt><dd>${img.enabled?'활성':'비활성'}</dd><dt>그룹</dt><dd>${img.group}</dd><dt>전체 액션</dt><dd>${img.actions.length}개</dd></dl><div style="margin-top:12px;padding:9px 10px;border-radius:8px;background:#f8fafc;font-size:11px;line-height:1.5"><b>실행 컨텍스트</b><br>아래 Act_1 → Act_${img.actions.length||0} 순서가 ImageMax 기본 액션 스택입니다. 웹에서 만든 Lua는 이 스택의 <b>스크립트 입력</b> 한 칸에 들어가는 1회 실행 코드입니다.</div>${stack?`<div class="section-label" style="margin-top:14px">현재 ImageMax 액션 스택</div>${stack}`:'<div class="hint" style="margin-top:12px">현재 등록된 액션이 없습니다.</div>'}`;}

function imageOptions(value=''){return `<option value="">-- 이미지 선택 --</option>${state.images.map(i=>`<option ${i.name===value?'selected':''} value="${html(i.name)}">${html(i.name)}</option>`).join('')}`}
function fieldHtml(field,value,scope){const [key,label,type]=field;let control='';if(type==='image')control=`<select class="select" data-k="${key}">${imageOptions(value)}</select>`;else if(type==='operator')control=`<select class="select" data-k="${key}">${['==','~=','>','>=','<','<='].map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select>`;else if(type==='boolean')control=`<select class="select" data-k="${key}"><option value="true" ${value!=='false'?'selected':''}>활성(true)</option><option value="false" ${value==='false'?'selected':''}>비활성(false)</option></select>`;else if(type==='speed')control=`<select class="select" data-k="${key}">${['FASTEST','FASTER','NORMAL','SLOWER','SLOWEST'].map(x=>`<option ${x===(value||'FASTER')?'selected':''}>${x}</option>`).join('')}</select>`;else if(type==='inputType')control=`<select class="select" data-k="${key}"><option ${value!=='MESSAGE'?'selected':''}>MKEVENT</option><option ${value==='MESSAGE'?'selected':''}>MESSAGE</option></select>`;else control=`<input class="input" data-k="${key}" type="${type==='number'?'number':'text'}" value="${html(value??'')}">`;return `<div class="field"><label>${label}</label>${control}</div>`}
function actionCard(action,ri,branch,ai){const def=actionDefs[action.type]||actionDefs.click;return `<div class="existing action-card" data-ri="${ri}" data-branch="${branch}" data-ai="${ai}"><div class="row"><select class="select action-type grow" style="padding:7px 8px">${Object.entries(actionDefs).map(([k,v])=>`<option value="${k}" ${k===action.type?'selected':''}>${v.label}</option>`).join('')}</select><button class="btn danger small remove-action">삭제</button></div><div class="rule-grid" style="margin-top:8px">${def.fields.map(f=>fieldHtml(f,action.params?.[f[0]],'action')).join('')}</div></div>`}
function conditionalHtml(r,ri){const def=conditionDefs[r.condition.type]||conditionDefs.found;return `<div class="rule" data-ri="${ri}"><div class="rule-head"><span class="rule-title">조건 블록 ${ri+1}</span><div class="rule-actions"><button class="btn small move-up">↑</button><button class="btn small move-down">↓</button><button class="btn danger small remove-rule">삭제</button></div></div><div class="rule-body"><div class="field"><label>조건</label><select class="select cond-type">${Object.entries(conditionDefs).map(([k,v])=>`<option value="${k}" ${k===r.condition.type?'selected':''}>${v.label}</option>`).join('')}</select></div><div class="rule-grid cond-fields">${def.fields.map(f=>fieldHtml(f,r.condition.params?.[f[0]],'condition')).join('')}</div><div class="divider"></div><div class="row"><b style="font-size:12px">조건이 맞으면 실행</b><button class="btn small add-action" data-branch="then">+ 행동 추가</button></div><div class="stack action-list" data-branch="then" style="margin-top:8px">${r.then.map((a,i)=>actionCard(a,ri,'then',i)).join('')||'<div class="hint">행동이 없습니다.</div>'}</div><div class="row" style="margin-top:12px"><b style="font-size:12px">조건이 아니면 실행 (선택)</b><button class="btn small add-action" data-branch="else">+ 행동 추가</button></div><div class="stack action-list" data-branch="else" style="margin-top:8px">${r.else.map((a,i)=>actionCard(a,ri,'else',i)).join('')||'<div class="hint">행동이 없습니다.</div>'}</div></div></div>`}
function counterHtml(r,ri){return `<div class="rule" data-ri="${ri}"><div class="rule-head"><span class="rule-title">현재 이미지 N회 인식 블록 ${ri+1}</span><div class="rule-actions"><button class="btn small move-up">↑</button><button class="btn small move-down">↓</button><button class="btn danger small remove-rule">삭제</button></div></div><div class="rule-body"><p class="hint">이 스크립트 액션이 호출될 때마다 1회로 계산합니다. ImageMax 리스트 순회는 막지 않습니다.</p><div class="rule-grid">${fieldHtml(['varName','카운터 변수','text'],r.varName)}${fieldHtml(['threshold','N회 이상','number'],r.threshold)}</div><div class="row"><b style="font-size:12px">N회 도달 후 실행</b><button class="btn small add-action" data-branch="actions">+ 행동 추가</button></div><div class="stack action-list" data-branch="actions" style="margin-top:8px">${r.actions.map((a,i)=>actionCard(a,ri,'actions',i)).join('')}</div></div></div>`}
function retryHtml(r,ri){return `<div class="rule" data-ri="${ri}"><div class="rule-head"><span class="rule-title">순회 재확인 상태 블록 ${ri+1}</span><div class="rule-actions"><button class="btn small move-up">↑</button><button class="btn small move-down">↓</button><button class="btn danger small remove-rule">삭제</button></div></div><div class="rule-body"><p class="hint">한 번 호출될 때 ImageSearch를 딱 1회만 수행합니다. 실패해도 루프/대기를 돌지 않고 ImageMax로 즉시 반환합니다.</p><div class="rule-grid">${fieldHtml(['image','1회 확인할 다른 이미지','image'],r.image)}${fieldHtml(['varName','재확인 카운터 변수','text'],r.varName)}${fieldHtml(['attempts','최대 순회 횟수','number'],r.attempts)}</div><div class="row"><b style="font-size:12px">이번 순회에서 찾았을 때</b><button class="btn small add-action" data-branch="foundActions">+ 행동 추가</button></div><div class="stack action-list" data-branch="foundActions" style="margin-top:8px">${r.foundActions.map((a,i)=>actionCard(a,ri,'foundActions',i)).join('')}</div><div class="row" style="margin-top:12px"><b style="font-size:12px">이번 순회에서 못 찾았을 때</b><button class="btn small add-action" data-branch="missActions">+ 행동 추가</button></div><div class="stack action-list" data-branch="missActions" style="margin-top:8px">${r.missActions.map((a,i)=>actionCard(a,ri,'missActions',i)).join('')}</div><div class="row" style="margin-top:12px"><b style="font-size:12px">최대 횟수 도달 시</b><button class="btn small add-action" data-branch="exhaustedActions">+ 행동 추가</button></div><div class="stack action-list" data-branch="exhaustedActions" style="margin-top:8px">${(r.exhaustedActions||[]).map((a,i)=>actionCard(a,ri,'exhaustedActions',i)).join('')||'<div class="hint">선택 사항</div>'}</div></div></div>`}
function renderRules(){const img=selectedImage();if(!img){els.rules.innerHTML='<div class="empty"><div><b>XML → 이미지 선택 → 블록 추가</b><p class="hint">Lua 문법을 입력할 필요가 없습니다.</p></div></div>';return}const rules=state.scripts[img.name]||[];els.rules.innerHTML=rules.length?rules.map((r,i)=>r.kind==='counter'?counterHtml(r,i):r.kind==='retry'?retryHtml(r,i):conditionalHtml(r,i)).join(''):'<div class="empty"><div><b>아직 블록이 없습니다.</b><p class="hint">위의 “조건 블록”, “N회 인식”, “순회 재확인” 또는 오른쪽 빠른 시작을 이용하세요.</p></div></div>';bindRuleEvents();}
function syncRuleFromDom(ruleEl){const ri=Number(ruleEl.dataset.ri);const r=state.scripts[state.selected][ri];if(!r)return;const readFields=(root)=>Object.fromEntries($$('[data-k]',root).map(x=>[x.dataset.k,x.value]));if(r.kind==='conditional'){r.condition.type=$('.cond-type',ruleEl).value;r.condition.params=readFields($('.cond-fields',ruleEl));}else{const top=[...ruleEl.querySelectorAll(':scope > .rule-body > .rule-grid [data-k]')];for(const x of top){const v=x.value;if(x.dataset.k==='resetOnMiss')r.resetOnMiss=v==='true';else if(['threshold','attempts'].includes(x.dataset.k))r[x.dataset.k]=Number(v)||0;else r[x.dataset.k]=v;}}
  $$('.action-card',ruleEl).forEach(card=>{const branch=card.dataset.branch,ai=Number(card.dataset.ai),a=r[branch][ai];if(!a)return;a.type=$('.action-type',card).value;a.params=readFields(card)});persist();renderLua();renderSelectionMetaOnly();}
function bindRuleEvents(){$$('.rule',els.rules).forEach(ruleEl=>{ruleEl.addEventListener('change',e=>{const ri=Number(ruleEl.dataset.ri),r=state.scripts[state.selected][ri];if(e.target.classList.contains('cond-type')){syncRuleFromDom(ruleEl);r.condition.params={image:state.selected};renderRules();renderLua();return}if(e.target.classList.contains('action-type')){syncRuleFromDom(ruleEl);const c=e.target.closest('.action-card'),a=r[c.dataset.branch][Number(c.dataset.ai)];a.params={image:state.selected,speed:'FASTER',type:'MKEVENT'};renderRules();renderLua();return}syncRuleFromDom(ruleEl)});$('.remove-rule',ruleEl).onclick=()=>{state.scripts[state.selected].splice(Number(ruleEl.dataset.ri),1);renderSelection();persist()};$('.move-up',ruleEl).onclick=()=>moveRule(Number(ruleEl.dataset.ri),-1);$('.move-down',ruleEl).onclick=()=>moveRule(Number(ruleEl.dataset.ri),1);$$('.add-action',ruleEl).forEach(b=>b.onclick=()=>{syncRuleFromDom(ruleEl);const r=state.scripts[state.selected][Number(ruleEl.dataset.ri)],branch=b.dataset.branch;r[branch].push({type:'currentClick',params:{}});renderRules();renderLua();persist()});$$('.remove-action',ruleEl).forEach(b=>b.onclick=()=>{const c=b.closest('.action-card'),r=state.scripts[state.selected][Number(c.dataset.ri)];r[c.dataset.branch].splice(Number(c.dataset.ai),1);renderRules();renderLua();persist()})})}
function moveRule(i,d){const a=state.scripts[state.selected],j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];renderRules();renderLua();persist()}
function renderSelectionMetaOnly(){const img=selectedImage();if(img)els.badge.textContent=`${state.scripts[img.name].length} 블록`;}

function defaultAction(){return {type:'currentClick',params:{}}}
els.addC.onclick=()=>{state.scripts[state.selected].push({kind:'conditional',condition:{type:'current',params:{}},then:[defaultAction()],else:[]});renderSelection();persist()};
els.addN.onclick=()=>{state.scripts[state.selected].push({kind:'counter',varName:`image_count_${selectedImage()?.index||1}`,threshold:3,actions:[defaultAction()]});renderSelection();persist()};
els.addR.onclick=()=>{const other=state.images.find(i=>i.name!==state.selected)?.name||'';state.scripts[state.selected].push({kind:'retry',image:other,varName:`recheck_count_${selectedImage()?.index||1}`,attempts:5,foundActions:[defaultAction()],missActions:[],exhaustedActions:[]});renderSelection();persist()};
$$('.recipe').forEach(b=>b.onclick=()=>{if(!state.selected){toast('먼저 XML에서 이미지를 선택하세요.');return}const r=b.dataset.recipe;if(r==='click')state.scripts[state.selected].push({kind:'conditional',condition:{type:'current',params:{}},then:[{type:'currentClick',params:{}}],else:[]});if(r==='key')state.scripts[state.selected].push({kind:'conditional',condition:{type:'current',params:{}},then:[{type:'key',params:{text:'<Space>',speed:'FASTER',type:'MKEVENT'}}],else:[]});if(r==='count')state.scripts[state.selected].push({kind:'counter',varName:`image_count_${selectedImage()?.index||1}`,threshold:3,actions:[{type:'currentClick',params:{}}]});if(r==='retry'){const other=state.images.find(i=>i.name!==state.selected)?.name||'';state.scripts[state.selected].push({kind:'retry',image:other,varName:`recheck_count_${selectedImage()?.index||1}`,attempts:5,foundActions:[{type:'print',params:{text:'대상 이미지 발견'}}],missActions:[],exhaustedActions:[{type:'print',params:{text:'최대 순회 횟수 도달'}}]})}renderSelection();persist()});

function num(v,d=0){const n=Number(v);return Number.isFinite(n)?n:d}
function compileAction(a,indent=''){const p=a.params||{},line=s=>indent+s;switch(a.type){case'currentClick':return line('ImageClick()');case'click':{const x=num(p.offsetX),y=num(p.offsetY);return x||y?line(`ImageClick(${escLua(p.image)}, ${x}, ${y}, 5, 5, 0.5)`):line(`ImageClick(${escLua(p.image)})`)}case'forceClick':return line(`ImageClickForce(${escLua(p.image)})`);case'enable':return line(`EnableImage(${p.enabled!=='false'?'true':'false'}, ${escLua(p.image)})`);case'goto':return line(`GotoImage(${escLua(p.image)})`);case'key':return line(`Keybd(${escLua(p.text||'<Space>')}, ${p.speed||'FASTER'}, ${p.type||'MKEVENT'})`);case'mouse':return line(`Mouse(LBUTTON, CLICK, ${num(p.x)}, ${num(p.y)}, 0, 0, ${num(p.randX,5)}, ${num(p.randY,5)}, 0.5, 1, NORMAL, MKEVENT)`);case'drag':return line(`MouseDrag(LBUTTON, ${num(p.x1)}, ${num(p.y1)}, ${num(p.press1,.5)}, ${num(p.x2)}, ${num(p.y2)}, ${num(p.press2,.5)})`);case'sleep':return line(`Sleep(${num(p.ms,500)})`);case'openScript':return line(`OpenScript(${escLua(p.name)})`);case'stop':return line('Stop()');case'sound':return line(`PlaySound(${escLua(p.file||'alarm.wav')}, ${num(p.sec,3)})`);case'screenshot':return line(`SaveScreenshot(${escLua(p.file||'screenshot.png')})`);case'print':return line(`print(${escLua(p.text||'로그')})`);case'passAct':return line(`PassAct(${num(p.count,1)})`);case'passAll':return line('PassAllAct()');case'fail':return line('GotoFailAct()');default:return line('-- 지원되지 않는 행동')}}
function compileCondition(c){const p=c.params||{};switch(c.type){case'current':return 'true';case'found':return p.accuracy?`ImageSearch(${escLua(p.image)}, ${num(p.accuracy)}, GetImageROI(${escLua(p.image)})) == 1`:`ImageSearch(${escLua(p.image)}) == 1`;case'notfound':return p.accuracy?`ImageSearch(${escLua(p.image)}, ${num(p.accuracy)}, GetImageROI(${escLua(p.image)})) == 0`:`ImageSearch(${escLua(p.image)}) == 0`;case'enabled':return `IsEnableImage(${escLua(p.image)}) == true`;case'disabled':return `IsEnableImage(${escLua(p.image)}) == false`;case'multi':return `MultiImage(${escLua(p.expression)}) == 1`;case'variable':{const value=/^-?\d+(\.\d+)?$/.test(p.value||'')?p.value:escLua(p.value);return `${luaId(p.varName||'value')} ${p.operator||'=='} ${value}`}case'pixel':return `select(1, GetPixelRGB(${num(p.x)}, ${num(p.y)})) == ${num(p.r)} and select(2, GetPixelRGB(${num(p.x)}, ${num(p.y)})) == ${num(p.g)} and select(3, GetPixelRGB(${num(p.x)}, ${num(p.y)})) == ${num(p.b)}`;case'cursorArea':return `(function() local x,y=GetCursorPos(); return x>=${num(p.x1)} and x<=${num(p.x2)} and y>=${num(p.y1)} and y<=${num(p.y2)} end)()`;case'stopped':return 'IsStop() == 1';case'paused':return 'IsPause() == 1';default:return 'true'}}
function compileRule(r){
  if(r.kind==='counter'){
    const v=luaId(r.varName||'image_count');
    return `${v} = ${v} or 0
${v} = ${v} + 1
if ${v} >= ${Math.max(1,num(r.threshold,3))} then
${r.actions.map(a=>compileAction(a,'  ')).join('\n')||'  -- 실행할 행동 없음'}
  ${v} = 0
end`;
  }
  if(r.kind==='retry'){
    const img=r.image||'',v=luaId(r.varName||'recheck_count'),attempts=Math.max(1,num(r.attempts,5));
    const found=(r.foundActions||[]).map(a=>compileAction(a,'  ')).join('\n')||'  -- 발견 후 행동 없음';
    const miss=(r.missActions||[]).map(a=>compileAction(a,'  ')).join('\n');
    const exhausted=(r.exhaustedActions||[]).map(a=>compileAction(a,'    ')).join('\n')||'    -- 최대 횟수 도달 후 행동 없음';
    return `${v} = ${v} or 0
local ret = ImageSearch(${escLua(img)})
if ret == 1 then
${found}
  ${v} = 0
else
  ${v} = ${v} + 1${miss?'\n'+miss:''}
  if ${v} >= ${attempts} then
${exhausted}
    ${v} = 0
  end
end`;
  }
  if(r.condition?.type==='current') return (r.then||[]).map(a=>compileAction(a)).join('\n')||'-- 실행할 행동 없음';
  const cond=compileCondition(r.condition),t=(r.then||[]).map(a=>compileAction(a,'  ')).join('\n')||'  -- 실행할 행동 없음',e=r.else?.length?`\nelse\n${r.else.map(a=>compileAction(a,'  ')).join('\n')}`:'';
  return `if ${cond} then\n${t}${e}\nend`;
}
function generatedLua(){if(!state.selected)return '-- 이미지를 선택하세요.';const rules=state.scripts[state.selected]||[];return `-- This is IM's script file. Do not remove this comment line.
-- ImageMax Web Tools · 1회 실행 액션 스크립트
-- XML: ${state.xmlName||'-'}
-- Assigned image: ${state.selected}
-- 실행 모델: ImageMax 리스트가 순회를 담당하며, 이 파일은 액션 호출 1회 후 즉시 반환됩니다.

${rules.map(compileRule).join('\n\n')||'-- 블록을 추가하면 코드가 생성됩니다.'}
`}
function hasBlockingLoop(code){return /\bwhile\s+true\b|\brepeat\b|\bfor\s+[A-Za-z_]\w*\s*=/.test(code)}
function safeLua(){const code=generatedLua();if(hasBlockingLoop(code))throw new Error('ImageMax 리스트 순회를 막을 수 있는 반복문이 감지되었습니다. 생성이 중단되었습니다.');return code}
function renderLua(){try{els.lua.textContent=safeLua()}catch(e){els.lua.textContent='-- 오류: '+e.message}}
els.copy.onclick=()=>{try{copyText(safeLua())}catch(e){alert(e.message)}};els.dl.onclick=()=>{try{download(`${sanitizeId(state.selected)}_web.lua`,'\ufeff'+safeLua())}catch(e){alert(e.message)}};

function normalizeRules(){for(const [name,rules] of Object.entries(state.scripts||{})){for(const r of rules||[]){if(r.kind==='conditional'&&r.condition?.type==='found'&&r.condition?.params?.image===name){r.condition={type:'current',params:{}};for(const a of r.then||[])if(a.type==='click'&&a.params?.image===name){a.type='currentClick';a.params={}}}if(r.kind==='counter'){delete r.image;delete r.resetOnMiss}if(r.kind==='retry'){r.varName=r.varName||`recheck_${sanitizeId(name)}`;delete r.interval;r.missActions=(r.missActions||[]).filter(a=>a.type!=='sleep');r.exhaustedActions=r.exhaustedActions||[]}}}}
function persist(){try{localStorage.setItem('imagemaxScriptProject',encodeProject({format:'imagemax-web-script',version:1,xmlName:state.xmlName,images:state.images,scripts:state.scripts,selected:state.selected}))}catch{}}
$('#saveProject').onclick=()=>download(`${sanitizeId(state.xmlName.replace(/\.xml$/i,'')||'imagemax')}.imxweb.json`,encodeProject({format:'imagemax-web-script',version:1,xmlName:state.xmlName,images:state.images,scripts:state.scripts,selected:state.selected}),'application/json');
$('#loadProject').addEventListener('change',async e=>{try{const p=await readJsonFile(e.target.files[0]);if(p.format!=='imagemax-web-script')throw new Error('ImageMax Script Builder 프로젝트가 아닙니다.');Object.assign(state,{xmlName:p.xmlName||'',images:p.images||[],scripts:p.scripts||{},selected:p.selected||null});normalizeRules();els.search.disabled=!state.images.length;renderImages();renderSelection();persist();toast('프로젝트를 불러왔습니다.')}catch(err){alert(err.message)}});

$('#exportAll').onclick=()=>{const entries=Object.entries(state.scripts).filter(([,r])=>r?.length);if(!entries.length){toast('저장할 스크립트 블록이 없습니다.');return}const prev=state.selected;const files=[];const manifest={format:'imagemax-script-bundle',executionModel:'single-action-per-list-visit',xmlName:state.xmlName,generatedAt:new Date().toISOString(),assignments:[]};for(const [name] of entries){state.selected=name;const code='\ufeff'+safeLua();const file=`${sanitizeId(name)}_web.lua`;files.push({name:`lua/${file}`,data:code});manifest.assignments.push({image:name,file})}state.selected=prev;files.push({name:'manifest.json',data:JSON.stringify(manifest,null,2)});files.push({name:'README.txt',data:'ImageMax Web Tools export\n각 lua 파일은 manifest.json의 image 항목에 대응합니다.\n원본 XML은 수정하지 않습니다.\n각 Lua는 ImageMax 리스트의 스크립트 입력 액션에서 1회 실행 후 반환되는 코드입니다.\n무한/자체 반복 루프는 생성하지 않습니다.'});downloadBytes(`${sanitizeId(state.xmlName.replace(/\.xml$/i,'')||'imagemax')}_scripts.zip`,makeStoreZip(files),'application/zip');toast(`${entries.length}개 스크립트를 ZIP으로 만들었습니다.`)};
$('#newProject').onclick=()=>{if(!confirm('현재 작업을 초기화할까요?'))return;Object.assign(state,{xmlName:'',images:[],selected:null,scripts:{},imageFiles:new Map()});els.xml.value='';els.search.value='';els.search.disabled=true;renderImages();renderSelection();persist()};

try{const p=JSON.parse(localStorage.getItem('imagemaxScriptProject')||'null');if(p?.format==='imagemax-web-script'){Object.assign(state,{xmlName:p.xmlName||'',images:p.images||[],scripts:p.scripts||{},selected:p.selected||null});normalizeRules();els.search.disabled=!state.images.length;renderImages();renderSelection()}}catch{}
