# ImageMax Web Tools

ImageMax XML 프로젝트와 내장함수를 기준으로 만든 브라우저용 Script Builder / GUI Builder입니다.

## 핵심 기능

### Script Builder
- ImageMax XML(EUC-KR/CP949/UTF-8) 읽기
- `GENERAL > Image_n` 목록, `Name`, `Rect`, `ROI`, `Enable`, `Group`, `Trg.Acc`, `Act_n` 분석
- 기존 `스크립트 입력` 액션의 `LuaFile` / `Text` 확인
- 이미지 선택 후 Lua 비전문가용 1회 실행 블록 생성
  - 현재 액션 / 다른 이미지 1회 조건 블록
  - 현재 이미지 N회 인식 상태 블록
  - 다른 이미지 순회 재확인 블록(1회/순회, 자체 루프 없음)
- 행동 선택으로 `ImageClick`, `EnableImage`, `GotoImage`, `Keybd`, `Mouse`, `MouseDrag`, `Sleep`, `OpenScript`, `Stop`, `PlaySound`, `SaveScreenshot`, `PassAct` 등 생성
- 선택 이미지별 작업 자동 저장
- `.lua`, `.imxweb.json` 출력
- 로컬 이미지 폴더 선택 시 이미지명과 파일명이 같은 이미지 미리보기

### GUI Builder
- ImageMax 기본 탭 좌표 360×320 기반 2배 확대 캔버스
- 탭 / Dialog 생성
- Text, Group, Button, Check, Radio, Combo, Edit
- Dialog 전용 Picture / Link
- 드래그 / 리사이즈 / 속성 편집
- 실제 ImageMax 시그니처 기반 Lua 생성
- Dialog는 `parent_id`를 첫 인수로 사용하는 오버로드 생성
- 프로젝트 JSON 저장/불러오기

### Function Reference
- 첨부 `이맥 내장함수.txt`에서 추출한 시그니처를 범주/검색어로 조회

## GitHub Pages 배포

이 프로젝트는 빌드가 필요 없는 정적 HTML/CSS/JS입니다.

1. 저장소 루트에 파일 전체 업로드
2. GitHub 저장소 Settings → Pages
3. Source를 GitHub Actions 또는 `Deploy from a branch`로 지정
4. branch 방식은 `main / (root)` 선택

`.github/workflows/pages.yml`도 포함되어 있어 Actions 방식으로 배포할 수 있습니다.

## 중요

- XML은 현재 **읽기 전용**입니다. 원본 XML을 재작성하지 않습니다.
- 생성 Lua는 ImageMax 리스트의 `스크립트 입력` 액션에 넣는 **1회 실행 코드**입니다. ImageMax가 리스트 순회를 담당하며 생성기는 `while true`/자체 재검색 루프를 만들지 않습니다.
- 현재 리스트 이미지가 이미 인식된 컨텍스트에서는 기본적으로 같은 이미지를 다시 `ImageSearch()`하지 않고 `ImageClick()` 등 최근 인식 결과를 활용합니다.
- ImageMax 버전에 따라 내장함수 시그니처가 달라질 수 있으므로 `data/functions.json`을 업데이트하면 함수 사전도 갱신할 수 있습니다.
- GUI 코드는 ImageMax 문서의 `GUIAddTab`, `GUISetCurTab`, `GUIAdd*`, `GUIShow` 규격을 기준으로 생성합니다.

스크립트 실행 원칙: `docs/SCRIPT_EXECUTION_MODEL.md`
