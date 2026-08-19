# ImageMax Web Tools V6

ImageMax XML / 이미지 폴더 / PreScript.lua를 읽어 **이미지별 1회 실행 Lua**와 **ImageMax 사용자 GUI**를 시각적으로 구성하는 정적 웹 도구입니다.

## V6 핵심 변경

- Script Builder를 **이미지 → 생성 Lua → 블록 편집** 중심으로 재배치했습니다.
- 템플릿 라이브러리는 우측 고정 패널로 분리해 항상 찾기 쉽지만 생성 코드보다 큰 영역을 차지하지 않습니다.
- `코드 집중` 모드로 이미지/템플릿 패널을 숨기고 Lua + 블록만 크게 볼 수 있습니다.
- 블록 편집 / 실행 흐름 / 이미지·기존 Action List를 탭으로 분리했습니다.
- 기본 템플릿 120개, 내 템플릿, 커뮤니티 템플릿, 즐겨찾기, 검색/카테고리 필터를 유지합니다.
- GUI 미리보기에서 360×320을 **폼 외곽 크기**가 아니라 ImageMax의 **X/Y 좌표 범위**로 처리합니다.
- 실제 ImageMax 폼의 우측/하단 여백을 미리보기에 반영해 정상 Lua가 웹 화면에서 잘려 보이던 문제를 수정했습니다.
- `w/h=-1` 자동폭은 글자수 추정이 아니라 브라우저의 `Malgun Gothic` 텍스트 폭 측정값으로 계산합니다.
- 미리보기 확대/축소 시 글꼴, 체크박스, 콤보 화살표도 같은 비율로 확대됩니다.
- PreScript 가져오기 후 자동 `화면 맞춤`을 수행합니다.
- GUI의 `동작 테스트`에서 체크·라디오·콤보·Edit·버튼과 콜백/노코드 규칙 로그를 브라우저에서 확인할 수 있습니다.
- Script Builder의 `모의 실행`에서 발견 이미지와 변수 초기값을 지정하고 1회 호출 상태·조건 분기·실행 예정 명령을 확인할 수 있습니다.

## 실행

GitHub Pages처럼 정적 파일로 배포할 수 있습니다. 저장소 루트에 전체 파일을 올리면 `.github/workflows/pages.yml`이 Pages artifact를 배포합니다.

주요 경로:

- `/script/` Script Builder
- `/gui/` GUI Builder Pro
- `/reference/` 함수 사전
- `/templates/` 공유 템플릿

## ImageMax 스크립트 실행 모델

생성 Lua는 독립 프로그램이 아니라 ImageMax의 `스크립트 입력` 액션에서 **호출 1회 후 즉시 반환**되는 코드입니다. 무한 루프 대신 전역 상태 변수 / 다음 ImageMax 리스트 순회를 사용합니다.

브라우저 모의 실행은 생성 규칙을 안전하게 검증하는 기능이며 실제 마우스, 키보드, 메시지 전송, ImageMax API를 호출하지 않습니다. 실제 프로그램 연동 최종 확인은 저장한 Lua를 ImageMax 프로젝트에 넣어 수행해야 합니다.

## 템플릿

기본 120개 템플릿을 제공합니다.

- 기본 19
- 이미지 연계 26
- 상태/횟수 27
- 액션 흐름 13
- 입력/좌표 11
- 알림/기록 13
- 데이터/환경 11

사용자가 만든 템플릿은 `.imxtpl.json` 또는 `.imxtplpack.json`으로 내보내고 다시 불러올 수 있습니다. 커뮤니티 제출 구조는 `docs/COMMUNITY_SHARING.md`를 참고하세요.


ImageMax 웹 도구, 이미지 인식 자동화, 화면 인식 매크로, 이미지 매칭 자동화, 반복 작업 자동화, 클릭 자동화, 마우스·키보드 자동화, Windows 업무 자동화, GUI 자동화, RPA 도구, 웹 자동화 프로그램, 무료 자동화 도구, 오픈소스 매크로, GitHub 자동화 도구, 이미지 기반 자동 클릭, 화면 이미지 탐색, 템플릿 매칭, PC 반복 작업 자동화, 생산성 향상 도구를 찾는 사용자를 위한 ImageMax Web Tools입니다.


#ImageMax #ImageMaxTools #ImageMaxWebTools #이미지맥스 #이미지맥스툴 #웹도구 #웹툴 #자동화도구 #업무자동화 #웹자동화 #이미지자동화 #매크로 #매크로프로그램 #자동화프로그램 #반복작업자동화 #PC자동화 #윈도우자동화 #GUI자동화 #화면자동화 #클릭자동화 #이미지인식 #이미지인식자동화 #화면인식 #화면인식자동화 #이미지매칭 #템플릿매칭 #ImageRecognition #ImageMatching #TemplateMatching #ComputerVision #Automation #WebAutomation #DesktopAutomation #GUIAutomation #RPA #RPA자동화 #WorkflowAutomation #TaskAutomation #ProductivityTools #DeveloperTools #OpenSource #오픈소스 #GitHub #깃허브 #GitHubTools #무료프로그램 #무료도구 #유틸리티 #웹유틸리티 #개발자도구 #생산성도구 #작업자동화 #반복작업 #단순작업자동화 #마우스자동화 #키보드자동화 #클릭매크로 #이미지매크로 #화면매크로 #컴퓨터자동화 #매크로툴 #자동화툴 #업무효율화 #업무효율 #생산성향상 #작업효율 #자동클릭 #자동입력 #자동실행 #스크립트자동화 #웹스크립트 #AutomationTools #MacroTools #ImageAutomation #ScreenAutomation #ClickAutomation #WindowsAutomation #FreeTools #WebTools

