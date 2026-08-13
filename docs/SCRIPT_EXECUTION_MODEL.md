# ImageMax Script Builder — 실행 모델과 권장 사용법

## 핵심 원칙

ImageMax가 이미지 목록을 순회하고, 각 이미지에 등록된 액션을 순서대로 실행한다.
Lua는 그 액션 목록 중 `스크립트 입력` 한 칸에 들어가는 **1회 실행 코드 조각**이다.

따라서 웹 Builder는 일반 Lua 프로그램을 만들지 않는다.

```text
ImageMax 리스트 순회
  ↓
현재 이미지 인식
  ↓
Act_1
  ↓
Act_2: 스크립트 입력 → Lua 1회 실행
  ↓
Act_3
  ↓
다음 이미지 / 다음 순회
```

## 생성 금지 패턴

기본 생성기에서는 아래 패턴을 만들지 않는다.

```lua
while true do
  ...
end
```

```lua
repeat
  ...
until condition
```

```lua
for i = 1, 1000 do
  ImageSearch(...)
end
```

이런 코드는 ImageMax 리스트의 순회를 오래 점유하거나 사실상 멈출 수 있기 때문이다.

## 현재 이미지 컨텍스트

현재 이미지의 `스크립트 입력` 액션이 실행되었다는 것은 보통 해당 리스트 이미지가 이미 인식되어 액션 단계에 들어왔다는 의미다.

따라서 같은 이미지를 다시 검색하는 다음 형태는 기본 생성 패턴으로 쓰지 않는다.

```lua
if ImageSearch('현재이미지') == 1 then
  ImageClick('현재이미지')
end
```

현재 인식 결과를 클릭하면 다음처럼 짧게 생성한다.

```lua
ImageClick()
```

## N회 인식

N회 감지는 한 실행 안에서 반복하지 않는다. 호출될 때마다 상태만 누적한다.

```lua
found_count = found_count or 0
found_count = found_count + 1

if found_count >= 3 then
  -- 동작
  found_count = 0
end
```

즉 1회차 ImageMax 순회에서 +1, 다음 순회에서 다시 인식되면 +1 하는 구조다.

## 다른 이미지 재확인

다른 이미지를 확인해야 해도 한 호출에서 `ImageSearch()`는 1회만 수행하는 것을 기본으로 한다.

```lua
recheck_count = recheck_count or 0
local ret = ImageSearch('다른이미지')

if ret == 1 then
  recheck_count = 0
  -- 발견 행동
else
  recheck_count = recheck_count + 1

  if recheck_count >= 5 then
    -- 최대 순회 횟수 도달 행동
    recheck_count = 0
  end
end
```

실패하면 즉시 Lua가 끝나고 제어권을 ImageMax에 돌려준다.

## 기본 액션과 Lua의 역할 분리

가능하면 ImageMax 기본 액션을 먼저 사용한다.

### 기본 액션 사용 권장

- 마우스 클릭 / 드래그
- 키보드 입력
- 딜레이
- 이미지 활성/비활성
- 인식 순서 변경
- 인식 실패시 처리
- Multi Image 등 UI에서 직접 구성 가능한 액션

### Lua 사용 권장

- 여러 변수 조합 조건
- 누적 횟수 / 상태 저장
- GUI 설정값과 이미지 활성상태 연동
- 기본 액션으로 표현하기 어려운 다중 분기
- 결과값을 계산한 뒤 다음 액션에 전달해야 하는 경우

## PreScript와 이미지별 Lua의 역할

### PreScript.lua

- 사용자 GUI 생성
- GUI 콜백 함수
- GUI 값에 따른 이미지 Enable/Disable
- 프로젝트 전체에서 유지할 공통 함수 / 변수 초기화

### Image_n의 스크립트 입력 Lua

- 해당 이미지 액션 단계에서 필요한 짧은 계산
- 상태 변수 업데이트
- 조건 분기
- 다음 액션을 위한 값 변경

## Builder 안전장치

Script Builder는 다음을 적용한다.

1. 생성 Lua 첫 줄에 ImageMax 스크립트 식별 주석 유지
2. 자체 무한/반복 검색 루프 생성 금지
3. 현재 이미지 기본 조건에서 재검색 제거
4. N회 인식을 순회 기반 상태 변수 방식으로 생성
5. 다른 이미지 재확인도 1회 Search / 호출 방식으로 생성
6. 저장/복사 전 반복문 패턴 안전검사
7. XML의 기존 Act 순서를 보여주어 Lua가 어디에 들어가는 코드인지 이해 가능하게 표시

## 브라우저 모의 실행

Script Builder의 `모의 실행`은 현재 블록을 위에서 아래로 한 번 평가하고 다음을 로그에 남긴다.

- 호출 횟수, 가상 경과 시간, 유지 변수
- 조건의 참/거짓과 선택된 분기
- 발견으로 지정한 이미지의 `ImageSearch` 결과
- N회, 재확인, 1회 실행, 경과 시간, 쿨타임 상태 변화
- 실행 예정 ImageMax 명령과 `Print` 결과

마우스·키보드 입력, 파일/스크립트 열기, 메시지 전송, 실제 ImageMax API는 호출하지 않는다. 미지원 외부 상태 조건은 거짓으로 표시해 실제 동작처럼 오인하지 않게 한다.
