# ImageMax GUI Builder Pro — 규격 및 사용 원칙

이 문서는 ImageMax 내장 GUI 함수 문서와 실제 `PreScript.lua` 예제를 기준으로 웹 GUI Builder가 지켜야 할 규칙을 정리한다.

## 1. 기본 모델

ImageMax 사용자 GUI는 일반 웹 UI 프레임워크가 아니라 **PreScript에서 GUI 함수를 호출해 탭과 컨트롤을 생성하는 구조**다.

```lua
GUIAddTab('사용자')
GUISetCurTab('사용자')
GUIAddCheck(10, 20, -1, -1, '체크', 'onCheck', 'check1')
GUIShow()
```

따라서 웹 Builder도 HTML 화면을 만드는 도구가 아니라 **ImageMax가 이해하는 PreScript.lua를 시각적으로 작성하는 도구**여야 한다.

## 2. 탭 좌표 규격

- 기본 탭 좌표: X `0~360`, Y `0~320`
- Builder는 편집 편의를 위해 100/125/150/200% 미리보기 배율을 제공하지만 Lua 출력 좌표는 항상 원본 논리 좌표다.
- `w=-1`, `h=-1`은 ImageMax 자동 크기 사용으로 보존한다.
- 자동 크기 컨트롤이 화면 밖으로 넘을 가능성이 있으면 경고한다.

### ImageMax 2.67 실측 미리보기 규격

웹 미리보기의 기준은 문서상 좌표 범위만이 아니라 Windows에서 실행한 ImageMax 2.67의 실제 화면이다.

| 영역 | 실측값 |
|---|---:|
| 웹에서 표시하는 사용자 GUI 영역 | 382 × 346px |
| 일반 컨트롤 기준점 | Lua 좌표에서 사용자 영역 기준 X +10 / Y +7 |
| GroupBox 외곽 | 일반 기준에서 X -8 / Y -11, W +16 / H +18 |
| 글자가 있는 CheckBox | 체크 사각형 뒤 2px 간격으로 텍스트 표시 |
| 글자가 없는 CheckBox | Windows 자동 크기의 X +1 / Y +5 내부 오프셋 반영 |

- 100%가 실제 실행 크기다. 75/125/150/200%는 웹 편집 화면만 확대하며 Lua 좌표와 크기를 바꾸지 않는다.
- `화면 맞춤`은 실제 크기보다 확대하지 않는다.
- 편집선이 꺼진 상태에서는 좌표 경계와 그리드를 숨겨 실제 실행 화면과 같은 상태를 보여준다.
- GroupBox 보정은 미리보기에만 적용하며 생성되는 `GUIAddGroup` 인자는 원본을 그대로 유지한다.
- ImageMax 제목 표시줄, 기본 탭, 설정파일과 START/STOP 영역은 Lua 사용자 좌표와 무관하므로 웹 편집 미리보기에서 표시하지 않는다.

## 3. 컨트롤과 값 변수

| 컨트롤 | 핵심 연결 |
|---|---|
| Text | 표시 텍스트 |
| Group | 시각적 구획 |
| Button | 콜백 함수 |
| Check | 콜백 + 값 변수(0/1) |
| Radio | 콜백 + 그룹 첫 라디오의 값 변수 |
| Combo | 항목 테이블 + 콜백 + 선택 인덱스 변수 |
| Edit | 초기 텍스트 + 콜백(없어도 됨) + 문자열 변수 |
| Picture / Link | Dialog parent_id 버전에서 사용 |

## 4. 컨트롤 ID 변수

실전 PreScript에서는 다음처럼 GUIAdd* 반환값을 변수에 저장한다.

```lua
check_Cri1 = GUIAddCheck(...)
Edit_Pickn = GUIAddEdit(...)
```

이 ID는 이후 아래 함수의 대상으로 사용한다.

```lua
GUIItemEnable(check_Cri1, true)
GUIItemUpdate(check_Cri1, 0)
GUIItemShow(check_Cri1, false)
```

따라서 Builder의 `컨트롤 ID 변수`는 단순 표시용 ID와 다르며, 실제 Lua에서 의미가 있는 속성이다.

## 5. GUIItemUpdate 규칙

스크립트에서 GUI 값을 강제로 바꾼 뒤에는 `GUIUpdate()`를 호출해 화면을 갱신한다.

Builder의 노코드 `GUI 값 변경` 동작은 이 호출을 자동으로 붙인다.

## 6. 라디오 버튼

동일 라디오 그룹의 **첫 번째 라디오에만 var를 지정**하고 나머지 라디오에는 var를 생략하는 형태가 문서상 권장 규칙이다.

Builder Validator는 같은 `라디오 그룹 이름` 안에서 var가 둘 이상이면 오류로 표시한다.

## 7. Dialog

Dialog는 탭과 다른 parent_id 오버로드를 사용한다.

```lua
dlg = GUIAddDialog('옵션', '옵션', 300, 200)
GUIAddButton(dlg, 10, 10, 80, 25, '확인', 'onConfirm')
```

Picture / Link는 Builder에서 Dialog에만 배치하도록 제한한다.

## 8. 노코드 동작 규칙

초보 사용자는 콜백 함수를 직접 작성하지 않고 다음을 조합할 수 있다.

- 현재 Check/Combo/Radio/Edit 변수 값 조건
- ImageMax 이미지 `EnableImage(true/false, imageName)`
- 다른 GUI 컨트롤 `GUIItemEnable`
- 다른 GUI 값 `GUIItemUpdate + GUIUpdate`
- GUI 표시/숨김 `GUIItemShow`
- 로그 출력 `Print`
- GUI 콜백에서 `MessageBox`
- 고급 Lua 한 줄

ImageMax XML을 함께 불러오면 이미지 활성/비활성 대상은 XML 이미지 목록에서 고를 수 있다.

## 9. 기존 PreScript 가져오기

Builder Pro는 단순한 Lua 전체 파서가 아니라 **ImageMax GUI 레이아웃에 특화된 importer**다.

지원 범위:

- `GUIAddTab`, `GUISetCurTab`
- `GUIAddText`, `GUIAddGroup`, `GUIAddButton`, `GUIAddCheck`, `GUIAddRadio`, `GUIAddCombo`, `GUIAddEdit`
- 숫자 좌표 변수 및 `x + 10`, `y + 27` 형태의 간단한 산술
- `local x, y, w, h = ...` 형태의 레이아웃 변수
- GUIAdd* 반환 ID 변수
- GUI 생성부 앞의 기존 함수 코드는 고급 Lua 영역에 보존
- `GUIShow()` 뒤 초기화 호출도 보존

지원하지 않는 복잡한 동적 Lua 레이아웃은 고급 Lua로 보존하고 시각적 레이아웃 변환 대상에서 제외하는 것이 안전하다.

## 10. 권장 사용 방식

### 초보 모드
1. XML 불러오기
2. 탭 추가
3. Check / Combo / Edit 배치
4. 연결 값 변수 자동 생성
5. `+ 규칙`으로 ImageMax 이미지 활성화 등의 동작 연결
6. Validator가 오류 0인지 확인
7. `PreScript.lua 저장`

### 기존 프로젝트 수정
1. 기존 `PreScript.lua` 가져오기
2. 실제 탭과 컨트롤 레이아웃 확인
3. 필요한 위치/텍스트 수정
4. 기존 콜백 함수는 고급 Lua 영역에서 보존
5. 새 컨트롤은 노코드 규칙으로 추가
6. ID 변수/함수명 일치 검사
7. 새 PreScript 저장 후 원본은 별도 백업

## 11. 안전한 제한 정책

Builder가 **문서에서 확인되지 않은 임의의 최대 컨트롤 수, 최대 탭 수**를 강제로 만들지는 않는다. 대신 확실히 확인 가능한 제약만 강제한다.

- 탭 좌표 범위 360×320
- w/h는 -1 또는 양수
- Dialog parent_id 호출 형태
- 라디오 var 규칙
- 반환 ID 변수 중복 금지
- Lua 변수/함수 식별자 검사
- GUIItemUpdate 후 GUIUpdate 자동 생성
- MessageBox 사용 경고

성능상 컨트롤 수가 매우 많아질 경우에는 경고만 제공하고, ImageMax 버전별 실제 한계가 공식적으로 확인되면 `functions.json`의 capability 데이터로 버전별 제한을 추가하는 방향을 권장한다.

## 12. 실제 예제에서 확인되는 실무 배치 패턴

첨부 `PreScript.lua`와 실제 ImageMax GUI 화면은 공식 최대치가 아니라 **실사용 패턴**을 보여준다.

- 탭 1개 안에 여러 Group을 두고 밀도 높게 배치할 수 있다.
- 예제는 좌측 선택 영역을 약 94px 폭, 우측 설정 영역을 130px 이후 좌표부터 배치한다.
- 체크박스 세로 간격은 약 27px, 콤보 행 간격은 약 26px로 사용한다.
- 결과전송 탭처럼 `GUIAddGroup(8, 12, 345, 51, ...)` 형태로 거의 전체 너비를 사용할 수 있다.
- `GUIAddEdit(..., nil, 'Edit_Page')`처럼 콜백 함수가 필요 없는 Edit도 정상적인 패턴이다.
- 컨트롤 반환 ID를 저장한 항목과 저장하지 않은 항목을 섞어 사용한다. **다른 함수에서 제어할 컨트롤만 ID 변수를 저장하는 방식**이 가장 깔끔하다.

Builder는 이 값들을 하드 제한으로 강제하지 않고, 새 화면 생성 시 정렬 가이드/권장 간격으로만 사용한다.

## 13. 콜백과 상태 설계 권장안

ImageMax GUI는 React 같은 상시 상태 렌더링 구조가 아니다. Check/Combo/Edit가 값을 변수에 저장하고 콜백 함수가 필요할 때 ImageMax 이미지 또는 다른 GUI 항목을 갱신한다.

권장 흐름:

```text
사용자 Check/Combo 변경
        ↓
연결 var 값 갱신
        ↓
콜백 1회 호출
        ↓
EnableImage / GUIItemEnable / GUIItemUpdate
        ↓
값을 강제로 바꾼 경우 GUIUpdate
        ↓
콜백 종료
```

따라서 GUI Builder의 노코드 동작 규칙도 반복 루프를 만들지 않고 **이벤트 1회 처리 함수**만 생성한다.

## 14. 동작 테스트 범위

`동작 테스트`는 편집 좌표를 변경하지 않는 별도 모드다.

- 테스트 모드도 편집 모드와 같은 Win32풍 체크/라디오/콤보 지오메트리를 유지하며 브라우저 기본 폼 크기로 교체하지 않는다.
- 테스트 로그는 사용자 GUI 영역 아래에 별도로 배치해 382×346 미리보기를 가리지 않는다.
- 생성 Lua에는 `IMAGEMAX_GUI_PROJECT_V1` 주석 메타데이터를 함께 저장한다. 웹 빌더가 만든 Lua를 다시 불러와도 컨트롤 ID, 원래 콜백명, 라디오 그룹, 노코드 규칙을 복원하며 ImageMax는 이 주석을 무시한다.
- 같은 기존 콜백명을 여러 컨트롤이 공유하면서 각기 다른 노코드 규칙을 가질 때는 컨트롤별 래퍼 함수를 생성한다. 래퍼는 `item_id`를 기존 콜백으로 전달한 뒤 해당 컨트롤의 규칙만 실행한다.
- Check/Radio 값은 0/1, Combo는 선택 인덱스, Edit는 문자열로 연결 변수에 반영한다.
- Button/Check/Radio/Combo/Edit 이벤트마다 연결 콜백 이름과 컨트롤 ID를 로그에 표시한다.
- 노코드 `EnableImage`, `GUIItemEnable`, `GUIItemShow`, `GUIItemUpdate`, `Print`, `MessageBox` 규칙을 브라우저 상태와 로그로 확인한다.
- 가져온 임의 Lua는 브라우저에서 실행하지 않고 실행 예정 코드만 로그에 표시한다.

실제 ImageMax 프로세스, 등록 이미지, 대상 창에 접근하는 통합 테스트는 아니므로 최종 확인은 저장한 `PreScript.lua`를 ImageMax에 적용해 수행한다.
