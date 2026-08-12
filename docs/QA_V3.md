# V3 QA 결과

테스트 기준 파일: `BA_KOR.xml`, `PreScript.lua`

## GUI Import

- PreScript 자동 인코딩 판별: `CP949 / EUC-KR`
- 탭 복원: 2개
  - `리세마라 세팅`: 52 controls
  - `결과전송 세팅`: 18 controls
- 총 controls: 70
- 미해석 GUI 구문: 0
- Validator: 정상
- 생성 Lua에서 한글 탭 이름 보존 확인
- `check_Cri1 = GUIAddCheck(79, 45, ...)` 형태 반환 ID 보존 확인

## Script Builder

- XML 이미지: 435개 로드
- `히마리` 선택 및 기존 Action List 표시 확인
- 제공 템플릿: 14개
- `현재 이미지 → 클릭` 결과: `ImageClick()`
- `다른 이미지 발견 → 클릭`: ImageSearch 1회 후 최근 찾은 이미지 클릭
- `현재 이미지 N회 인식 후 실행`: 상태 변수 누적 방식
- 생성 결과에 대표적인 blocking loop (`while true`, 무한 repeat) 없음 확인

## 이미지 폴더 매핑

- 파일명 확장자를 제외하고 XML 이미지명과 연결
- 중복 파일명 감지 및 상태 표시 확인
- Object URL 기반 브라우저 미리보기 로직 확인

## 정적 검사

- `assets/common.js`: Node syntax check 통과
- `script/script-builder.js`: Node syntax check 통과
- `gui/gui-builder.js`: Node syntax check 통과
