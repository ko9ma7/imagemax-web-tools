export const TEMPLATE_FORMAT='imagemax-template-pack';
export const TEMPLATE_VERSION=1;
export const CATEGORY_LABELS={
  basic:'기본', image:'이미지 연계', state:'상태/횟수', flow:'액션 흐름', input:'입력/좌표', utility:'알림/기록', data:'데이터/환경', custom:'내 템플릿'
};

export function buildBuiltinTemplates(ctx){
  const {act,conditional,selectedImage,firstOther,defaultCandidates}=ctx;
  const self=()=>selectedImage()?.name||'';
  const countVar=s=>`${s}_${selectedImage()?.index||1}`;
  const tpl=(id,category,title,desc,tag,make,featured=false)=>({id,category,title,desc,tag,make,featured,builtin:true});
  const T=[];

  // 기본
  T.push(
    tpl('currentClick','basic','현재 이미지 → 클릭','현재 리스트 이미지가 이미 인식된 상태에서 다시 검색하지 않고 바로 클릭합니다.','가장 많이 사용',()=>conditional('current',[act('currentClick')]),true),
    tpl('currentClickDelay','basic','현재 이미지 → 클릭 후 짧은 대기','현재 이미지를 클릭한 뒤 지정한 밀리초만큼만 짧게 대기합니다.','클릭',()=>conditional('current',[act('currentClick'),act('sleep',{ms:300})]),true),
    tpl('currentKeySpace','basic','현재 이미지 → Space','현재 이미지가 인식되면 Space 키를 1회 입력합니다.','키 입력',()=>conditional('current',[act('key',{text:'<Space>',speed:'FASTER',type:'MKEVENT'})]),true),
    tpl('currentKeyEnter','basic','현재 이미지 → Enter','현재 이미지가 인식되면 Enter 키를 1회 입력합니다.','키 입력',()=>conditional('current',[act('key',{text:'<Enter>',speed:'FASTER',type:'MKEVENT'})])),
    tpl('currentKeyEsc','basic','현재 이미지 → ESC','현재 이미지가 인식되면 ESC 키를 1회 입력합니다.','키 입력',()=>conditional('current',[act('key',{text:'<Esc>',speed:'FASTER',type:'MKEVENT'})])),
    tpl('currentSetVar','basic','현재 이미지 → 변수 값 지정','현재 이미지 호출 시 전역 변수 값을 지정합니다.','상태 저장',()=>conditional('current',[act('setVar',{varName:'result_bool',value:'1'})]),true),
    tpl('currentAddVar','basic','현재 이미지 → 변수 +1','카운터나 진행 상태 변수에 1을 더합니다.','카운트',()=>conditional('current',[act('addVar',{varName:'result_count',amount:1})])),
    tpl('currentToggleVar','basic','현재 이미지 → 0/1 토글','전역 변수 값을 0과 1 사이에서 전환합니다.','상태',()=>conditional('current',[act('toggleVar',{varName:'toggle_value'})])),
    tpl('currentDisableSelf','basic','현재 이미지 → 자기 자신 비활성화','현재 이미지가 한 번 처리된 뒤 다시 인식되지 않도록 비활성화합니다.','1회 처리',()=>conditional('current',[act('enable',{image:self(),enabled:'false'})])),
    tpl('currentEnableOther','basic','현재 이미지 → 다른 이미지 활성화','현재 이미지가 인식되면 다음 단계에서 사용할 다른 이미지를 활성화합니다.','단계 전환',()=>conditional('current',[act('enable',{image:firstOther(),enabled:'true'})])),
    tpl('currentLog','basic','현재 이미지 → 로그 출력','현재 이미지 액션이 실행됐다는 메시지를 로그창에 남깁니다.','디버깅',()=>conditional('current',[act('print',{text:'현재 이미지 액션 실행'})])),
    tpl('currentScreenshot','basic','현재 이미지 → 스크린샷 저장','현재 대상 창 전체를 한 번 저장합니다.','기록',()=>conditional('current',[act('screenshot')]))
  );

  // 이미지 연계
  T.push(
    tpl('foundClick','image','다른 이미지 발견 → 그 이미지 클릭','선택한 다른 이미지를 이번 호출에서 한 번 검색하고 발견하면 클릭합니다.','이미지명만 변경',()=>conditional('found',[act('currentClick')],[],{image:firstOther(),accuracy:''}),true),
    tpl('foundKey','image','다른 이미지 발견 → 키 입력','다른 이미지를 한 번 확인하고 발견된 경우 키 입력을 실행합니다.','조건',()=>conditional('found',[act('key',{text:'<Enter>',speed:'FASTER',type:'MKEVENT'})],[],{image:firstOther(),accuracy:''})),
    tpl('foundSetVar','image','다른 이미지 발견 → 변수 지정','다른 이미지가 보이는 경우 결과/상태 변수를 변경합니다.','상태',()=>conditional('found',[act('setVar',{varName:'found_bool',value:'1'})],[],{image:firstOther(),accuracy:''})),
    tpl('foundEnable','image','다른 이미지 발견 → 이미지 활성화','확인 이미지가 발견되면 지정 이미지를 활성화합니다.','연계',()=>conditional('found',[act('enable',{image:self(),enabled:'true'})],[],{image:firstOther(),accuracy:''})),
    tpl('foundDisable','image','다른 이미지 발견 → 이미지 비활성화','확인 이미지가 발견되면 지정 이미지를 비활성화합니다.','연계',()=>conditional('found',[act('enable',{image:firstOther(),enabled:'false'})],[],{image:firstOther(),accuracy:''})),
    tpl('foundGoto','image','다른 이미지 발견 → 인식 순서 이동','다른 이미지가 발견되면 GotoImage로 다음 인식 위치를 바꿉니다.','분기',()=>conditional('found',[act('goto',{image:firstOther()})],[],{image:firstOther(),accuracy:''})),
    tpl('foundPassN','image','다른 이미지 발견 → 다음 N개 액션 건너뛰기','발견되면 PassAct로 현재 이미지의 뒤쪽 액션 일부를 건너뜁니다.','액션 흐름',()=>conditional('found',[act('passAct',{count:1})],[],{image:firstOther(),accuracy:''})),
    tpl('foundPassAll','image','다른 이미지 발견 → 이후 액션 모두 건너뛰기','발견되면 PassAllAct로 현재 이미지의 남은 액션을 실행하지 않습니다.','액션 흐름',()=>conditional('found',[act('passAll')],[],{image:firstOther(),accuracy:''})),
    tpl('notFoundFail','image','다른 이미지 없음 → 실패 액션','다른 이미지를 1회 확인하고 없으면 GotoFailAct로 이동합니다.','실패 처리',()=>conditional('notfound',[act('fail')],[],{image:firstOther(),accuracy:''}),true),
    tpl('notFoundGoto','image','다른 이미지 없음 → 지정 이미지로 이동','확인 이미지가 없을 때 다음 인식 순서를 지정 이미지로 변경합니다.','분기',()=>conditional('notfound',[act('goto',{image:firstOther()})],[],{image:firstOther(),accuracy:''})),
    tpl('notFoundSetVar','image','다른 이미지 없음 → 변수 지정','확인 이미지가 없을 때 실패/대기 상태 변수를 지정합니다.','상태',()=>conditional('notfound',[act('setVar',{varName:'not_found_bool',value:'1'})],[],{image:firstOther(),accuracy:''})),
    tpl('enabledBranch','image','이미지 활성 상태면 실행','특정 이미지가 현재 활성화되어 있는지 확인하고 행동합니다.','활성 상태',()=>conditional('enabled',[act('print',{text:'이미지 활성 상태'})],[],{image:firstOther()})),
    tpl('disabledBranch','image','이미지 비활성 상태면 실행','특정 이미지가 비활성 상태인지 확인하고 행동합니다.','활성 상태',()=>conditional('disabled',[act('enable',{image:firstOther(),enabled:'true'})],[],{image:firstOther()})),
    tpl('multiAnd','image','이미지 A + B 모두 만족','MultiImage의 AND 조건으로 여러 이미지 조합을 1회 확인합니다.','멀티 이미지',()=>{const a=defaultCandidates();return conditional('multi',[act('setVar',{varName:'multi_ok',value:'1'})],[],{expression:(a.slice(0,2).join('&')||'이미지A&이미지B')})}),
    tpl('multiOr','image','이미지 A / B 중 하나 만족','MultiImage의 OR 조건으로 후보 중 하나가 보이는지 확인합니다.','멀티 이미지',()=>{const a=defaultCandidates();return conditional('multi',[act('setVar',{varName:'multi_ok',value:'1'})],[],{expression:(a.slice(0,2).join('|')||'이미지A|이미지B')})}),
    tpl('randomFound','image','여러 이미지 중 발견된 것 하나 랜덤 클릭','선택한 이미지 목록을 각각 한 번 확인하고 발견된 후보 중 하나를 랜덤 클릭합니다.','여러 후보',()=>({kind:'randomFound',images:defaultCandidates(),maxImages:20})),
    tpl('bestMatch','image','여러 후보 중 정확도 가장 높은 이미지 클릭','같은 영역에서 후보들을 한 번씩 확인하고 가장 높은 정확도의 결과 하나를 클릭합니다.','정확도',()=>({kind:'bestMatch',images:defaultCandidates(),minAccuracy:80})),
    tpl('retryClick','image','다른 이미지 최대 N회 순회 재확인 후 클릭','한 호출당 ImageSearch 1회만 수행하고 못 찾으면 다음 ImageMax 순회에서 다시 확인합니다.','비차단',()=>({kind:'retry',image:firstOther(),varName:countVar('recheck_count'),attempts:5,foundActions:[act('currentClick')],missActions:[],exhaustedActions:[act('print',{text:'최대 재확인 횟수 도달'})]}),true)
  );

  // 상태 / 횟수 / 시간
  T.push(
    tpl('countClick','state','현재 이미지 N회 호출 후 클릭','스크립트가 호출될 때마다 카운트하고 N번째 호출에서만 현재 이미지를 클릭합니다.','N회',()=>({kind:'counter',varName:countVar('image_count'),threshold:3,actions:[act('currentClick')]}),true),
    tpl('countKey','state','현재 이미지 N회 호출 후 키 입력','N번째 호출에서만 지정 키를 입력하고 카운터를 초기화합니다.','N회',()=>({kind:'counter',varName:countVar('key_count'),threshold:3,actions:[act('key',{text:'<Enter>',speed:'FASTER',type:'MKEVENT'})]})),
    tpl('countSetVar','state','현재 이미지 N회 호출 후 변수 지정','N번째 호출에서 결과 변수를 변경합니다.','N회',()=>({kind:'counter',varName:countVar('result_count'),threshold:5,actions:[act('setVar',{varName:'result_bool',value:'1'})]})),
    tpl('countScreenshot','state','현재 이미지 N회 호출 후 스크린샷','N번째 호출에서만 스크린샷을 저장합니다.','N회',()=>({kind:'counter',varName:countVar('shot_count'),threshold:5,actions:[act('screenshot')]})),
    tpl('countPassAll','state','현재 이미지 N회 호출 후 남은 액션 패스','N번째 호출부터 현재 이미지의 뒤쪽 액션을 건너뜁니다.','N회',()=>({kind:'counter',varName:countVar('pass_count'),threshold:3,actions:[act('passAll')]})),
    tpl('elapsedClick','state','N초 경과 후 현재 이미지 클릭','첫 호출 시간을 기억하고 이후 순회에서 경과시간이 N초 이상일 때 클릭합니다.','비차단 시간',()=>({kind:'elapsed',varName:countVar('elapsed'),seconds:60,actions:[act('currentClick')],reset:true}),true),
    tpl('elapsedSetVar','state','N초 경과 후 변수 지정','Sleep으로 멈추지 않고 순회가 계속되는 동안 시간 조건을 확인합니다.','비차단 시간',()=>({kind:'elapsed',varName:countVar('elapsed_state'),seconds:30,actions:[act('setVar',{varName:'timeout_bool',value:'1'})],reset:true})),
    tpl('elapsedOpenScript','state','N초 경과 후 다른 스크립트 열기','일정 시간이 지나면 지정 ImageMax 스크립트로 전환합니다.','타임아웃',()=>({kind:'elapsed',varName:countVar('elapsed_script'),seconds:120,actions:[act('openScript',{name:'재실행'})],reset:true})),
    tpl('onceClick','state','현재 실행 구간에서 딱 1회만 클릭','전역 플래그를 이용하여 최초 한 번만 행동하고 이후 호출은 바로 반환합니다.','1회',()=>({kind:'once',varName:countVar('once_done'),actions:[act('currentClick')]})),
    tpl('onceSetVar','state','딱 1회만 변수 초기화','초기화가 중복 실행되지 않도록 최초 호출에서만 변수 값을 지정합니다.','초기화',()=>({kind:'once',varName:countVar('init_done'),actions:[act('setVar',{varName:'result_bool',value:'0'})]})),
    tpl('cooldownClick','state','클릭 후 N초 쿨타임','마지막 실행 시각을 기억하여 N초가 지나기 전에는 클릭하지 않습니다.','쿨타임',()=>({kind:'cooldown',varName:countVar('cooldown'),seconds:10,actions:[act('currentClick')]}),true),
    tpl('cooldownKey','state','키 입력 후 N초 쿨타임','지정 키 입력을 일정 시간 간격으로만 허용합니다.','쿨타임',()=>({kind:'cooldown',varName:countVar('key_cooldown'),seconds:5,actions:[act('key',{text:'<Enter>',speed:'FASTER',type:'MKEVENT'})]})),
    tpl('varEquals','state','변수 값이 같으면 실행','GUI 체크박스/콤보/전역 변수 값을 비교해 행동합니다.','GUI 연계',()=>conditional('variable',[act('setVar',{varName:'result_bool',value:'1'})],[],{varName:'check_option',operator:'==',value:'1'}),true),
    tpl('varNotEquals','state','변수 값이 다르면 실행','전역 변수의 값이 지정값과 다를 때 행동합니다.','변수 비교',()=>conditional('variable',[act('print',{text:'값이 다름'})],[],{varName:'check_option',operator:'~=',value:'1'})),
    tpl('varGreater','state','변수가 기준값 이상이면 실행','횟수·페이지·점수 같은 숫자형 변수를 비교합니다.','변수 비교',()=>conditional('variable',[act('setVar',{varName:'result_bool',value:'1'})],[],{varName:'result_count',operator:'>=',value:'10'})),
    tpl('varLess','state','변수가 기준값보다 작으면 실행','숫자형 상태값이 기준보다 작은 동안만 행동합니다.','변수 비교',()=>conditional('variable',[act('print',{text:'기준값 미만'})],[],{varName:'result_count',operator:'<',value:'10'})),
    tpl('retryFail','state','다른 이미지 N회 재확인 실패 → 실패 액션','다른 이미지를 순회당 1회 확인하고 최대 횟수에 도달하면 실패 액션으로 이동합니다.','재시도',()=>({kind:'retry',image:firstOther(),varName:countVar('retry_fail'),attempts:5,foundActions:[act('setVar',{varName:'retry_ok',value:'1'})],missActions:[],exhaustedActions:[act('fail')]})),
    tpl('retryGoto','state','다른 이미지 N회 재확인 실패 → 지정 이미지 이동','최대 재확인 횟수에 도달하면 GotoImage를 호출합니다.','재시도',()=>({kind:'retry',image:firstOther(),varName:countVar('retry_goto'),attempts:5,foundActions:[act('currentClick')],missActions:[],exhaustedActions:[act('goto',{image:firstOther()})]}))
  );

  // 흐름 제어
  T.push(
    tpl('currentPassAll','flow','현재 이미지 → 이후 액션 모두 건너뛰기','현재 이미지의 남은 액션을 실행하지 않고 다음 ImageMax 흐름으로 넘어갑니다.','PassAllAct',()=>conditional('current',[act('passAll')]),true),
    tpl('currentPassN','flow','현재 이미지 → 다음 N개 액션 건너뛰기','PassAct의 개수를 지정해 일부 액션만 건너뜁니다.','PassAct',()=>conditional('current',[act('passAct',{count:1})])),
    tpl('currentFail','flow','현재 이미지 → 실패 액션으로 이동','현재 액션 뒤의 인식 실패 액션으로 이동합니다.','GotoFailAct',()=>conditional('current',[act('fail')])),
    tpl('currentGoto','flow','현재 이미지 → 지정 이미지로 인식 순서 이동','GotoImage로 다음 인식 순서를 지정합니다.','GotoImage',()=>conditional('current',[act('goto',{image:firstOther()})])),
    tpl('currentOpenScript','flow','현재 이미지 → 다른 ImageMax 스크립트 열기','현재 프로젝트 흐름에서 다른 ImageMax 스크립트로 전환합니다.','OpenScript',()=>conditional('current',[act('openScript',{name:'재실행'})])),
    tpl('currentStop','flow','현재 이미지 → ImageMax Stop','현재 조건에서 자동화를 중지합니다.','Stop',()=>conditional('current',[act('stop')])),
    tpl('stopState','flow','ImageMax Stop 상태 확인','IsStop 상태를 확인하여 정리용 코드를 실행합니다.','상태 확인',()=>conditional('stopped',[act('print',{text:'Stop 상태'})])),
    tpl('pauseState','flow','ImageMax Pause 상태 확인','IsPause 상태에서 수행할 코드를 구성합니다.','상태 확인',()=>conditional('paused',[act('print',{text:'Pause 상태'})]))
  );

  // 입력 / 좌표
  T.push(
    tpl('coordClick','input','지정 좌표 클릭','대상 창 기준 X/Y 좌표를 클릭합니다.','마우스',()=>conditional('current',[act('mouse',{x:100,y:100,randX:0,randY:0})])),
    tpl('randomCoordClick','input','지정 좌표 주변 랜덤 클릭','중심 좌표에서 랜덤 X/Y 범위를 적용해 클릭합니다.','랜덤 클릭',()=>conditional('current',[act('mouse',{x:100,y:100,randX:5,randY:5})])),
    tpl('drag','input','지정 좌표 → 지정 좌표 드래그','두 좌표 사이를 MouseDrag로 드래그합니다.','드래그',()=>conditional('current',[act('drag',{x1:100,y1:100,x2:300,y2:300,press1:.5,press2:.5})])),
    tpl('keyCustom','input','사용자 키 문자열 1회 입력','ImageMax Keybd 형식의 문자열을 직접 지정합니다.','키보드',()=>conditional('current',[act('key',{text:'abc',speed:'FASTER',type:'MKEVENT'})])),
    tpl('keyCtrlV','input','Ctrl+V 붙여넣기','ImageMax Keybd 문자열로 Ctrl+V를 입력합니다.','키보드',()=>conditional('current',[act('key',{text:'<Ctrl_Press>v<Ctrl_Release>',speed:'FASTER',type:'MKEVENT'})])),
    tpl('clipboardSet','input','클립보드에 텍스트 저장','SetClipboardData를 사용해 텍스트를 클립보드에 넣습니다.','클립보드',()=>conditional('current',[act('clipboardSet',{text:'붙여넣을 텍스트',unicode:'true'})])),
    tpl('clipboardPaste','input','클립보드 저장 → Ctrl+V','텍스트를 클립보드에 저장한 뒤 Ctrl+V를 입력합니다.','붙여넣기',()=>conditional('current',[act('clipboardSet',{text:'붙여넣을 텍스트',unicode:'true'}),act('key',{text:'<Ctrl_Press>v<Ctrl_Release>',speed:'FASTER',type:'MKEVENT'})]))
  );

  // 알림 / 기록
  T.push(
    tpl('sound','utility','사운드 알림','WAV 파일을 지정 시간 동안 재생합니다.','알림',()=>conditional('current',[act('sound',{file:'alarm.wav',sec:3})])),
    tpl('telegramText','utility','텔레그램 텍스트 전송','Token/Chat ID/메시지를 지정해 텔레그램으로 전송합니다.','Telegram',()=>conditional('current',[act('telegram',{token:'token',chatId:'chat_id',text:'ImageMax 알림'})])),
    tpl('telegramScreenshot','utility','스크린샷 → 텔레그램 전송','현재 화면을 저장한 뒤 생성된 경로를 텔레그램으로 전송합니다.','Telegram',()=>conditional('current',[act('telegramShot',{token:'token',chatId:'chat_id',text:''})])),
    tpl('discordText','utility','디스코드 텍스트 전송','Webhook URL과 표시 이름을 지정해 디스코드로 전송합니다.','Discord',()=>conditional('current',[act('discord',{url:'https://discord.com/api/webhooks/...',name:'ImageMax',text:'ImageMax 알림'})])),
    tpl('discordScreenshot','utility','스크린샷 → 디스코드 전송','현재 화면을 저장하고 Discord webhook으로 전송합니다.','Discord',()=>conditional('current',[act('discordShot',{url:'https://discord.com/api/webhooks/...',name:'ImageMax',text:''})])),
    tpl('kakaoText','utility','카카오톡 텍스트 전송','열려 있는 카카오톡 채팅방 이름을 지정해 텍스트를 전송합니다.','KakaoTalk',()=>conditional('current',[act('kakao',{room:'채팅방 이름',text:'ImageMax 알림',screenshot:'false'})])),
    tpl('kakaoScreenshot','utility','카카오톡 스크린샷 전송','열려 있는 카카오톡 채팅방에 스크린샷 전송을 시도합니다.','KakaoTalk',()=>conditional('current',[act('kakao',{room:'채팅방 이름',text:'',screenshot:'true'})])),
    tpl('logWithVar','utility','변수값 포함 로그 출력','변수 이름과 현재 값을 연결해 로그로 확인합니다.','디버깅',()=>conditional('current',[act('printVar',{label:'result_count',varName:'result_count'})])),
    tpl('screenshotNamed','utility','파일명 지정 스크린샷','지정한 파일명으로 현재 화면을 저장합니다.','기록',()=>conditional('current',[act('screenshotNamed',{filename:'result.png'})]))
  );

  // 데이터 / 환경 조건
  T.push(
    tpl('clipboardEquals','data','클립보드 내용이 같으면 실행','현재 클립보드 문자열을 비교한 뒤 행동합니다.','클립보드',()=>conditional('clipboard',[act('setVar',{varName:'clipboard_ok',value:'1'})],[],{operator:'==',value:'확인 문자열'})),
    tpl('iniEquals','data','INI 설정값이 같으면 실행','IniGetValue로 설정파일 값을 읽어 조건에 사용합니다.','INI',()=>conditional('ini',[act('setVar',{varName:'ini_ok',value:'1'})],[],{app:'설정',key:'mode',file:'default.ini',operator:'==',value:'1'})),
    tpl('pixelRgb','data','픽셀 RGB가 같으면 실행','대상 창 기준 좌표의 RGB 값을 읽어 정확히 일치할 때 행동합니다.','픽셀',()=>conditional('pixel',[act('currentClick')],[],{x:100,y:100,r:255,g:255,b:255})),
    tpl('windowFound','data','특정 윈도우가 있으면 실행','FindWindow로 클래스명/창 이름을 확인합니다.','윈도우',()=>conditional('windowFound',[act('print',{text:'창 발견'})],[],{className:'',windowName:'창 이름'})),
    tpl('windowNotFound','data','특정 윈도우가 없으면 실행','FindWindow 결과가 없을 때 재실행 스크립트 등을 호출할 수 있습니다.','윈도우',()=>conditional('windowNotFound',[act('openScript',{name:'재실행'})],[],{className:'',windowName:'창 이름'})),
    tpl('targetWidth','data','대상 창 너비 조건','GetTargetWindowPos의 너비를 비교합니다.','창 크기',()=>conditional('targetWidth',[act('openScript',{name:'세로화면540x960'})],[],{operator:'<',value:'600'})),
    tpl('targetHeight','data','대상 창 높이 조건','GetTargetWindowPos의 높이를 비교합니다.','창 크기',()=>conditional('targetHeight',[act('print',{text:'창 높이 조건 만족'})],[],{operator:'>=',value:'720'}))
  );


  // V5 확장 실전 조합: 단일 액션이 아니라 실제 ImageMax 작업에서 자주 쓰는 묶음형 레시피
  T.push(
    // 기본 조합 +7
    tpl('currentClickDisable','basic','현재 이미지 → 클릭 → 자기 비활성화','클릭 후 현재 이미지를 비활성화하여 같은 단계가 다시 실행되는 것을 막습니다.','완료 처리',()=>conditional('current',[act('currentClick'),act('enable',{image:self(),enabled:'false'})])),
    tpl('currentClickGoto','basic','현재 이미지 → 클릭 → 다음 이미지로 이동','현재 이미지를 처리한 뒤 지정 이미지부터 인식 흐름을 이어갑니다.','다음 단계',()=>conditional('current',[act('currentClick'),act('goto',{image:firstOther()})])),
    tpl('currentClickPassAll','basic','현재 이미지 → 클릭 → 남은 액션 패스','클릭을 완료한 뒤 현재 이미지의 뒤쪽 액션을 모두 건너뜁니다.','완료 처리',()=>conditional('current',[act('currentClick'),act('passAll')])),
    tpl('currentSetVarGoto','basic','현재 이미지 → 상태 저장 → 다음 이미지 이동','진행 상태 변수를 먼저 기록한 뒤 GotoImage로 다음 단계로 이동합니다.','상태+이동',()=>conditional('current',[act('setVar',{varName:'step_done',value:'1'}),act('goto',{image:firstOther()})])),
    tpl('currentScreenshotLog','basic','현재 이미지 → 스크린샷 + 로그','현재 화면을 저장하고 로그도 함께 남겨 문제 상황 추적에 사용합니다.','기록',()=>conditional('current',[act('screenshot'),act('print',{text:'현재 이미지 처리 화면 저장'})])),
    tpl('currentResetVars','basic','현재 이미지 → 결과 변수 2개 초기화','새 구간 시작 전에 자주 쓰는 결과/횟수 변수를 0으로 초기화합니다.','초기화',()=>conditional('current',[act('setVar',{varName:'result_bool',value:'0'}),act('setVar',{varName:'result_count',value:'0'})])),
    tpl('currentHandoff','basic','현재 이미지 → 다음 이미지 활성화 + 자기 비활성화','단계 전환 시 다음 이미지를 켜고 현재 이미지는 끄는 대표적인 상태 전환 패턴입니다.','단계 전환',()=>conditional('current',[act('enable',{image:firstOther(),enabled:'true'}),act('enable',{image:self(),enabled:'false'})]),true),

    // 이미지 연계 +8
    tpl('foundClickDisableSelf','image','다른 이미지 발견 → 클릭 → 현재 이미지 비활성화','확인 대상이 보이면 그 이미지를 클릭하고 현재 리스트 이미지는 비활성화합니다.','연계 완료',()=>conditional('found',[act('currentClick'),act('enable',{image:self(),enabled:'false'})],[],{image:firstOther(),accuracy:''})),
    tpl('foundClickPassAll','image','다른 이미지 발견 → 클릭 → 남은 액션 패스','다른 이미지를 처리한 경우 현재 이미지의 나머지 액션을 실행하지 않습니다.','연계 완료',()=>conditional('found',[act('currentClick'),act('passAll')],[],{image:firstOther(),accuracy:''})),
    tpl('foundScreenshot','image','다른 이미지 발견 → 스크린샷','특정 화면이나 결과 이미지가 보였을 때 한 번만 현재 화면을 저장합니다.','결과 기록',()=>conditional('found',[act('screenshot')],[],{image:firstOther(),accuracy:''})),
    tpl('foundToggleVar','image','다른 이미지 발견 → 0/1 상태 토글','확인 이미지가 발견될 때마다 지정 상태 변수를 0/1로 바꿉니다.','상태',()=>conditional('found',[act('toggleVar',{varName:'found_toggle'})],[],{image:firstOther(),accuracy:''})),
    tpl('foundKeyPassAll','image','다른 이미지 발견 → 키 입력 → 남은 액션 패스','확인 이미지가 보이면 키 입력만 수행하고 현재 액션 흐름을 종료합니다.','키+흐름',()=>conditional('found',[act('key',{text:'<Enter>',speed:'FASTER',type:'MKEVENT'}),act('passAll')],[],{image:firstOther(),accuracy:''})),
    tpl('notFoundPassAll','image','다른 이미지 없음 → 남은 액션 패스','보조 이미지가 없을 때 현재 이미지의 뒤쪽 액션을 전부 건너뜁니다.','없음 처리',()=>conditional('notfound',[act('passAll')],[],{image:firstOther(),accuracy:''})),
    tpl('notFoundOpenScript','image','다른 이미지 없음 → 복구 스크립트 열기','필수 화면이 없으면 다른 ImageMax 스크립트로 전환해 복구 루트를 시작합니다.','복구',()=>conditional('notfound',[act('openScript',{name:'복구'})],[],{image:firstOther(),accuracy:''})),
    tpl('foundSetAndGoto','image','다른 이미지 발견 → 상태 저장 → 순서 이동','다른 이미지 확인 결과를 변수로 기록하고 지정 이미지부터 다음 인식을 시작합니다.','분기',()=>conditional('found',[act('setVar',{varName:'branch_result',value:'1'}),act('goto',{image:firstOther()})],[],{image:firstOther(),accuracy:''})),

    // 상태/횟수 +9
    tpl('countDisableSelf','state','현재 이미지 N회 호출 후 자기 비활성화','같은 이미지가 N번 처리된 뒤 해당 이미지를 더 이상 인식하지 않도록 끕니다.','N회 완료',()=>({kind:'counter',varName:countVar('disable_count'),threshold:3,actions:[act('enable',{image:self(),enabled:'false'})]})),
    tpl('countGoto','state','현재 이미지 N회 호출 후 지정 이미지 이동','N번째 호출에서만 GotoImage를 실행해 다음 단계로 전환합니다.','N회 분기',()=>({kind:'counter',varName:countVar('goto_count'),threshold:3,actions:[act('goto',{image:firstOther()})]})),
    tpl('countOpenScript','state','현재 이미지 N회 호출 후 다른 스크립트 열기','반복적으로 같은 상황이 발생할 때 N회째에 복구/재실행 스크립트로 전환합니다.','N회 복구',()=>({kind:'counter',varName:countVar('script_count'),threshold:5,actions:[act('openScript',{name:'재실행'})]})),
    tpl('elapsedScreenshot','state','N초 경과 후 스크린샷','대기 상태가 일정 시간 이상 유지될 때 현재 화면을 저장합니다.','타임아웃 기록',()=>({kind:'elapsed',varName:countVar('elapsed_shot'),seconds:60,actions:[act('screenshot')],reset:true})),
    tpl('elapsedFail','state','N초 경과 후 실패 액션','Sleep 없이 시간을 확인하다 제한시간을 넘으면 GotoFailAct를 호출합니다.','타임아웃',()=>({kind:'elapsed',varName:countVar('elapsed_fail'),seconds:60,actions:[act('fail')],reset:true})),
    tpl('elapsedPassAll','state','N초 경과 후 남은 액션 패스','지정 시간이 지난 상태에서는 현재 이미지의 나머지 액션을 건너뜁니다.','시간 분기',()=>({kind:'elapsed',varName:countVar('elapsed_pass'),seconds:30,actions:[act('passAll')],reset:true})),
    tpl('onceEnableOther','state','최초 1회만 다른 이미지 활성화','한 구간에서 처음 들어왔을 때만 다음 단계 이미지를 활성화합니다.','초기화',()=>({kind:'once',varName:countVar('once_enable'),actions:[act('enable',{image:firstOther(),enabled:'true'})]})),
    tpl('onceLog','state','최초 1회만 로그 출력','같은 이미지가 여러 번 호출돼도 첫 진입 메시지는 한 번만 출력합니다.','디버깅',()=>({kind:'once',varName:countVar('once_log'),actions:[act('print',{text:'이 구간에 처음 진입'})]})),
    tpl('cooldownScreenshot','state','스크린샷 저장 N초 쿨타임','같은 화면의 스크린샷이 과도하게 쌓이지 않도록 일정 간격으로만 저장합니다.','기록 제한',()=>({kind:'cooldown',varName:countVar('shot_cooldown'),seconds:30,actions:[act('screenshot')]})),

    // 액션 흐름 +5
    tpl('flowDisableGoto','flow','현재 이미지 비활성화 → 다음 이미지 이동','현재 단계 종료와 다음 단계 이동을 한 번에 처리합니다.','상태 전환',()=>conditional('current',[act('enable',{image:self(),enabled:'false'}),act('goto',{image:firstOther()})])),
    tpl('flowEnableGoto','flow','다른 이미지 활성화 → 그 이미지로 이동','다음 단계 이미지를 먼저 활성화한 다음 바로 해당 인식 위치로 이동합니다.','상태 전환',()=>conditional('current',[act('enable',{image:firstOther(),enabled:'true'}),act('goto',{image:firstOther()})])),
    tpl('flowSetGoto','flow','분기 변수 저장 → 지정 이미지 이동','어떤 루트를 선택했는지 변수로 남기고 다음 이미지로 인식 순서를 이동합니다.','분기',()=>conditional('current',[act('setVar',{varName:'route',value:'1'}),act('goto',{image:firstOther()})])),
    tpl('flowScreenshotStop','flow','스크린샷 저장 → ImageMax Stop','중대한 오류/완료 화면을 저장한 뒤 자동화를 즉시 중지합니다.','종료',()=>conditional('current',[act('screenshot'),act('stop')])),
    tpl('flowLogPassAll','flow','로그 출력 → 남은 액션 패스','현재 분기를 로그에 남기고 이후 액션은 모두 건너뜁니다.','디버깅',()=>conditional('current',[act('print',{text:'현재 분기에서 이후 액션 패스'}),act('passAll')])),

    // 입력/좌표 +4
    tpl('keyF1','input','F1 키 1회 입력','현재 이미지가 호출되면 F1 키를 한 번 입력합니다.','기능키',()=>conditional('current',[act('key',{text:'<F1>',speed:'FASTER',type:'MKEVENT'})])),
    tpl('keyF10','input','F10 키 1회 입력','앱 복구나 사용자 지정 단축키 등에 자주 쓰는 F10 입력 템플릿입니다.','기능키',()=>conditional('current',[act('key',{text:'<F10>',speed:'FASTER',type:'MKEVENT'})])),
    tpl('clickPaste','input','좌표 클릭 → 클립보드 붙여넣기','입력창을 클릭하고 준비한 문자열을 Ctrl+V로 붙여넣습니다.','폼 입력',()=>conditional('current',[act('mouse',{x:100,y:100,randX:0,randY:0}),act('clipboardSet',{text:'붙여넣을 텍스트',unicode:'true'}),act('key',{text:'<Ctrl_Press>v<Ctrl_Release>',speed:'FASTER',type:'MKEVENT'})])),
    tpl('dragThenKey','input','드래그 → 키 입력','스크롤/스와이프 동작 후 키 입력을 이어서 수행합니다.','연속 입력',()=>conditional('current',[act('drag',{x1:300,y1:300,x2:300,y2:100,press1:.5,press2:.5}),act('key',{text:'<Enter>',speed:'FASTER',type:'MKEVENT'})])),

    // 알림/기록 +4
    tpl('soundLog','utility','사운드 알림 + 로그','중요 상황을 소리로 알리고 동시에 로그에 기록합니다.','알림',()=>conditional('current',[act('sound',{file:'alarm.wav',sec:3}),act('print',{text:'알림 발생'})])),
    tpl('telegramShotPass','utility','텔레그램 스크린샷 전송 → 이후 액션 패스','결과 전송을 마친 뒤 현재 이미지의 남은 액션을 실행하지 않습니다.','결과 전송',()=>conditional('current',[act('telegramShot',{token:'token',chatId:'chat_id',text:'결과'}),act('passAll')])),
    tpl('discordShotPass','utility','디스코드 스크린샷 전송 → 이후 액션 패스','Discord 결과 전송 후 현재 액션 흐름을 종료합니다.','결과 전송',()=>conditional('current',[act('discordShot',{url:'https://discord.com/api/webhooks/...',name:'ImageMax',text:'결과'}),act('passAll')])),
    tpl('kakaoShotPass','utility','카카오톡 스크린샷 전송 → 이후 액션 패스','카카오톡 결과 전송을 시도한 뒤 현재 이미지의 남은 액션을 건너뜁니다.','결과 전송',()=>conditional('current',[act('kakao',{room:'채팅방 이름',text:'',screenshot:'true'}),act('passAll')])),

    // 데이터/환경 +4
    tpl('clipboardNotEquals','data','클립보드 내용이 다르면 실행','클립보드 문자열이 원하는 값과 다를 때 복구/입력 동작을 실행합니다.','클립보드',()=>conditional('clipboard',[act('setVar',{varName:'clipboard_mismatch',value:'1'})],[],{operator:'~=',value:'확인 문자열'})),
    tpl('iniNotEquals','data','INI 설정값이 다르면 실행','현재 INI 설정이 기준값과 다를 때 상태 변수를 설정합니다.','INI',()=>conditional('ini',[act('setVar',{varName:'ini_mismatch',value:'1'})],[],{app:'설정',key:'mode',file:'default.ini',operator:'~=',value:'1'})),
    tpl('pixelElseFail','data','픽셀 RGB 일치 → 클릭 / 불일치 → 실패','한 픽셀의 RGB를 비교해 맞으면 현재 이미지를 클릭하고 아니면 실패 액션으로 이동합니다.','픽셀 분기',()=>conditional('pixel',[act('currentClick')],[act('fail')],{x:100,y:100,r:255,g:255,b:255})),
    tpl('windowFoundElseRecover','data','윈도우 발견 → 로그 / 없음 → 복구 스크립트','대상 창 존재 여부에 따라 정상/복구 루트를 명확히 나눕니다.','윈도우 분기',()=>conditional('windowFound',[act('print',{text:'대상 창 정상'})],[act('openScript',{name:'복구'})],{className:'',windowName:'창 이름'}))
  );

  return T;
}

export function validateTemplatePack(pack,options={}){
  const allowedKinds=new Set(['conditional','counter','retry','elapsed','once','cooldown','randomFound','bestMatch']);
  const allowedConditions=new Set(['current','found','notfound','enabled','disabled','variable','multi','pixel','clipboard','ini','windowFound','windowNotFound','targetWidth','targetHeight','stopped','paused']);
  const allowedActions=new Set(['currentClick','click','forceClick','enable','goto','key','mouse','drag','setVar','addVar','subVar','toggleVar','clipboardSet','sleep','openScript','stop','sound','screenshot','screenshotNamed','print','printVar','telegram','telegramShot','discord','discordShot','kakao','passAct','passAll','fail']);
  const allowedCategories=new Set(Object.keys(CATEGORY_LABELS));
  const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
  const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).byteLength;
  const string=(value,where,max,required=false)=>{assert(value==null||typeof value==='string',`${where}: 문자열이 필요합니다.`);const text=String(value??'');assert(!required||text.trim().length>0,`${where}: 값이 비어 있습니다.`);assert(text.length<=max,`${where}: 최대 ${max}자입니다.`);return text};
  const actions=(arr,where)=>{assert(Array.isArray(arr),`${where}: 행동 배열 형식이 잘못되었습니다.`);assert(arr.length<=30,`${where}: 행동은 최대 30개입니다.`);for(const [i,a] of arr.entries()){assert(a&&typeof a==='object'&&!Array.isArray(a),`${where}[${i}]: 행동 객체가 필요합니다.`);assert(allowedActions.has(a.type),`${where}[${i}]: 지원하지 않는 행동 '${a.type}' 입니다.`);assert(a.params==null||(typeof a.params==='object'&&!Array.isArray(a.params)),`${where}[${i}]: params 형식이 잘못되었습니다.`);for(const [key,value] of Object.entries(a.params||{})){string(key,`${where}[${i}] params key`,80,true);if(typeof value==='string')string(value,`${where}[${i}].${key}`,1500);else assert(value==null||typeof value==='number'||typeof value==='boolean',`${where}[${i}].${key}: 문자열·숫자·논리값만 사용할 수 있습니다.`)}}};
  const rule=(r,where)=>{assert(r&&typeof r==='object'&&!Array.isArray(r),`${where}: 규칙 객체가 필요합니다.`);assert(allowedKinds.has(r.kind),`${where}: 지원하지 않는 규칙 '${r.kind}' 입니다.`);if(r.kind==='conditional'){assert(r.condition&&allowedConditions.has(r.condition.type),`${where}: 지원하지 않는 조건입니다.`);actions(r.then||[],`${where}.then`);actions(r.else||[],`${where}.else`)}else if(r.kind==='retry'){string(r.image||'',`${where}.image`,200);actions(r.foundActions||[],`${where}.foundActions`);actions(r.exhaustedActions||[],`${where}.exhaustedActions`)}else if(['counter','elapsed','once','cooldown'].includes(r.kind)){actions(r.actions||[],`${where}.actions`)}else if(['randomFound','bestMatch'].includes(r.kind)){assert(Array.isArray(r.images)&&r.images.length<=20,`${where}: 후보 이미지는 최대 20개입니다.`);r.images.forEach((name,i)=>string(name,`${where}.images[${i}]`,200))}};
  const maxTemplates=Math.max(1,Number(options.maxTemplates)||50),maxPackBytes=Math.max(0,Number(options.maxPackBytes)||0);
  assert(pack&&typeof pack==='object','템플릿 데이터가 객체가 아닙니다.');
  assert(pack.format===TEMPLATE_FORMAT,`format은 '${TEMPLATE_FORMAT}' 이어야 합니다.`);
  assert(Number(pack.version)===TEMPLATE_VERSION,`지원하지 않는 템플릿 버전입니다: ${pack.version}`);
  string(pack.name||'','name',120);string(pack.description||'','description',1000);string(pack.author||'','author',80);
  assert(Array.isArray(pack.templates)&&pack.templates.length,'templates 배열이 비어 있습니다.');
  assert(pack.templates.length<=maxTemplates,`템플릿은 최대 ${maxTemplates}개입니다.`);
  if(maxPackBytes)assert(bytes(pack)<=maxPackBytes,`템플릿 팩은 최대 ${maxPackBytes}바이트입니다.`);
  const seen=new Set();
  for(const [i,t] of pack.templates.entries()){
    assert(t&&typeof t==='object'&&!Array.isArray(t),`${i+1}번째 템플릿 형식이 잘못되었습니다.`);
    assert(String(t.id||'').match(/^[a-z0-9][a-z0-9_-]{2,79}$/),`${i+1}번째 템플릿 id가 잘못되었습니다.`);
    assert(!seen.has(t.id),`${t.id}: 같은 id가 팩 안에 중복되어 있습니다.`);seen.add(t.id);
    string(t.title,`${t.id}.title`,100,true);string(t.desc||'',`${t.id}.description`,1000);string(t.tag||'',`${t.id}.tag`,80);string(t.author||'',`${t.id}.author`,80);
    assert(allowedCategories.has(t.category||'custom'),`${t.id}: 지원하지 않는 category 입니다.`);
    assert(Array.isArray(t.rules)&&t.rules.length&&t.rules.length<=30,`${t.id}: rules는 1~30개여야 합니다.`);
    t.rules.forEach((r,j)=>rule(r,`${t.id}.rules[${j}]`));
    assert(bytes(t)<=30000,`${t.id}: 템플릿은 최대 30000바이트입니다.`);
  }
  return pack;
}

export function makeTemplatePack(templates,meta={}){
  return {
    format:TEMPLATE_FORMAT,
    version:TEMPLATE_VERSION,
    name:meta.name||'ImageMax Template Pack',
    description:meta.description||'',
    author:meta.author||'',
    exportedAt:new Date().toISOString(),
    templates
  };
}
