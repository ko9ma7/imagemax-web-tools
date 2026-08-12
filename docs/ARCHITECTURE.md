# ImageMax Web Tools 설계 문서

## 1. 이 서비스가 일반 Lua 생성기가 아닌 이유

ImageMax에서는 Lua가 독립 실행 앱의 중심이 아니라, ImageMax 프로젝트의 이미지 목록과 액션 흐름을 보완하는 스크립트 역할을 합니다.
따라서 Script Builder의 기준 엔티티는 `Lua file`이 아니라 `Image_n`입니다.

웹서비스의 흐름은 다음과 같습니다.

1. ImageMax XML 읽기
2. `GENERAL > Image_n` 분석
3. 사용자가 이미지 선택
4. 선택 이미지의 Rect / ROI / Acc / Enable / Group / Act_n 표시
5. 선택 이미지에 연결할 로직 블록 작성
6. ImageMax 내장함수 기반 Lua 생성
7. 이미지명 ↔ Lua 파일 매핑을 manifest와 함께 출력

원본 XML은 안전을 위해 읽기 전용입니다.

## 2. XML 모델

현재 파서는 다음을 읽습니다.

```text
GENERAL
 ├─ ImageCount
 └─ Image_n
     ├─ Name
     ├─ Rect
     ├─ ROI
     ├─ Enable
     ├─ Group
     ├─ Trg.Acc
     ├─ ActCount
     └─ Act_n
         ├─ Name
         ├─ Enable
         ├─ Param
         └─ Attr
             ├─ LuaFile
             └─ Text
```

특히 `스크립트 입력` 액션의 `LuaFile`, `Text`를 기존 스크립트 정보로 표시합니다.

## 3. Script Builder 실행 모델

ImageMax가 이미지 리스트를 순회하고 각 이미지의 액션을 실행하므로, 웹 Builder가 만드는 `.lua`는 **독립 실행 프로그램이 아니라 `스크립트 입력` 액션 1회분**입니다.

강제 원칙:

- 기본 스크립트는 호출 1회 후 즉시 반환합니다.
- 현재 리스트 이미지가 이미 인식된 상태에서 호출되므로 기본 동작은 같은 이미지를 다시 `ImageSearch()`하지 않습니다.
- 현재 인식 이미지를 클릭할 때는 `ImageClick()`처럼 최근 인식 결과를 재사용합니다.
- `while true`, `repeat ... until`, 자체 재검색 `for` 루프를 생성하지 않습니다.
- N회 감지/재시도는 전역 상태 변수만 유지하고 **다음 ImageMax 리스트 순회에서 이어서 평가**합니다.
- `Sleep()`은 사용자가 명시적으로 액션 딜레이를 넣을 때만 생성하며 반복 대기 수단으로 사용하지 않습니다.

### 현재 액션 / 조건 블록
- 현재 리스트 이미지가 인식되어 스크립트가 호출됨(기본)
- 다른 이미지 1회 발견 / 미발견 확인
- 이미지 활성 / 비활성
- MultiImage 조건식
- 변수 비교
- 픽셀 RGB
- 커서 영역
- Stop / Pause 상태

### 현재 이미지 N회 인식 상태 블록
현재 이미지의 `스크립트 입력` 액션이 호출될 때마다 카운터를 1 증가시킵니다. 같은 이미지를 다시 검색하지 않으며 N회 도달 시 행동 후 카운터를 초기화합니다.

### 다른 이미지 순회 재확인 블록
한 번 호출될 때 대상 `ImageSearch()`를 **1회만** 수행합니다. 실패 시 카운터만 증가시키고 즉시 반환하며 다음 ImageMax 리스트 순회에서 다시 평가합니다. 최대 순회 횟수 도달 시 별도 행동을 실행할 수 있습니다.

### 행동
- 현재 인식 이미지 `ImageClick()`
- 다른 이미지 ImageClick / ImageClickForce
- EnableImage
- GotoImage
- Keybd
- Mouse / MouseDrag
- Sleep
- OpenScript
- Stop
- PlaySound
- SaveScreenshot
- print
- PassAct / PassAllAct / GotoFailAct

## 4. GUI Builder 규칙

### 탭
기본 좌표는 360 × 320이며 웹 캔버스는 편집 편의를 위해 2배 크기로 표시합니다.

생성 형태:

```lua
GUIAddTab('사용자')
GUISetCurTab('사용자')
```

### 탭 컨트롤
- GUIAddText
- GUIAddGroup
- GUIAddButton
- GUIAddCheck
- GUIAddRadio
- GUIAddCombo
- GUIAddEdit

### Dialog
Dialog는 `GUIAddDialog()` 결과 ID를 보관하고, Dialog 내부 컨트롤은 `parent_id`를 첫 번째 인수로 생성합니다.

```lua
dlg_x = GUIAddDialog('옵션', '옵션', 300, 200)
GUIAddButton(dlg_x, 10, 50, 80, 25, '확인', 'onConfirm')
```

Dialog에서는 Picture와 Link도 지원합니다.

## 5. 저장 형식

### Script Project
`.imxweb.json`

브라우저 편집 상태와 이미지별 블록을 저장합니다.

### Script Bundle
`.zip`

```text
lua/
  이미지A_web.lua
  이미지B_web.lua
manifest.json
README.txt
```

### GUI Project
`.imxgui.json`

탭, Dialog, 컨트롤 좌표/크기/이벤트/변수를 저장합니다.

## 6. 안전한 확장 방향

원본 XML을 자동 수정하는 기능은 ImageMax 버전별 XML 스키마와 액션 직렬화 규칙을 충분히 검증한 뒤 별도 기능으로 추가하는 것이 좋습니다.
현재 버전은 XML을 손상시키지 않는 읽기 전용 구조를 채택합니다.
