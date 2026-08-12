# ImageMax Web Tools

ImageMax의 XML 이미지 리스트와 PreScript GUI를 기준으로 동작하는 **초보자용 Script Builder + GUI Builder + Function Reference** 정적 웹서비스입니다.

> 일반 Lua IDE가 아닙니다. ImageMax가 이미지 리스트를 순회하고 각 `스크립트 입력` 액션을 호출한다는 실행 모델에 맞춰 설계했습니다.

## 주요 화면

### Script Builder

- EUC-KR/CP949 ImageMax XML 불러오기
- XML Image List 검색/선택
- ImageMax 이미지 폴더 연결 및 파일명 자동 매칭
- 선택 이미지 실제 파일 미리보기
- ROI / 정확도 / Enable / Group / 기존 Action List 확인
- `자주 쓰는 예문 / 템플릿`을 누르는 방식의 초보자 중심 생성
- 현재 이미지 컨텍스트에서는 불필요한 재검색 없이 `ImageClick()` 등 사용
- N회 감지 / 순회 재확인 / GUI 변수 / 비차단 타이머 / 랜덤 후보 / 최고정확도 후보 등 제공
- `.lua` 개별 저장 / 전체 Lua ZIP / 작업 프로젝트 JSON
- `while true` 등 ImageMax 리스트 순회를 막는 무한 루프 방지

### GUI Builder

- 기존 PreScript.lua Import
- **UTF-8 / CP949(EUC-KR) 자동 판별**
- 실제 탭 및 360×320 논리 좌표 복원
- 100~200% 미리보기 배율
- Text / Group / Button / Check / Radio / Combo / Edit
- Dialog / Picture / Link
- 컨트롤 반환 ID 변수 (`check_Cri1 = GUIAddCheck(...)`) 지원
- 값 변수 / 콜백 / GUIItemEnable / GUIItemUpdate / GUIItemShow / EnableImage 연계 규칙
- XML 연결 시 동작 대상 이미지를 드롭다운으로 선택
- 가져온 기존 Lua 함수/초기화 로직 보존
- 규격 Validator 후 PreScript.lua 출력

## 제공 예문

Script Builder 첫 화면에서 다음을 직접 선택할 수 있습니다.

1. 현재 이미지 → 클릭
2. 현재 이미지 → 키 입력
3. 현재 이미지 → 이후 액션 모두 패스
4. 다른 이미지 발견 → 클릭
5. 다른 이미지 없음 → 실패 액션
6. 다른 이미지 발견 → 다음 N개 액션 패스
7. 현재 이미지 N회 인식 후 실행
8. 다른 이미지 최대 N회 ImageMax 순회 재확인
9. GUI/전역 변수 조건
10. N초 경과 후 실행 (Sleep 없이)
11. 여러 이미지 중 발견된 후보 하나 랜덤 클릭
12. 여러 후보 중 최고 정확도 선택
13. 스크린샷 저장
14. 로그 출력

## 로컬 이미지 폴더

GitHub Pages 같은 일반 웹페이지는 보안상 사용자의 로컬 폴더를 자동으로 읽을 수 없습니다. 사용자가 Script Builder의 **이미지 폴더 선택** 버튼으로 폴더를 허용하면, 파일명(확장자 제외)과 XML 이미지명을 연결해 미리보기합니다.

이미지 파일 자체는 서버로 업로드하지 않습니다. 브라우저 새로고침 후에는 폴더를 다시 선택해야 합니다.

## 배포

백엔드 없이 GitHub Pages에서 동작하도록 구성했습니다.

```text
imagemax-web-tools/
├─ index.html
├─ script/
├─ gui/
├─ reference/
├─ assets/
├─ data/
├─ docs/
└─ .github/workflows/pages.yml
```

GitHub 저장소에 전체 폴더를 Push하고 Pages/Actions를 활성화하면 됩니다.

## 중요 설계 문서

- `docs/SCRIPT_EXECUTION_MODEL.md` — ImageMax 리스트 순회와 Lua 1회 실행 모델
- `docs/GUI_SPEC.md` — ImageMax GUI 규격/생성 규칙
- `docs/USABILITY_V3.md` — 초보자 UX, 이미지 폴더, Import/Validator 제한
- `docs/ARCHITECTURE.md` — 프로젝트 내부 구조

## 현재 제한

원본 ImageMax XML은 **읽기 전용**으로 다룹니다. XML 스키마 전체와 버전별 직렬화 규칙이 완전히 검증되기 전에 웹에서 XML Action을 직접 삽입/저장하면 실제 ImageMax 프로젝트가 손상될 수 있으므로, 현재 버전은 Lua/PreScript 출력과 연결 정보 생성에 집중합니다.
