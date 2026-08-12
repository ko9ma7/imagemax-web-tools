# ImageMax Web Tools V5

ImageMax XML/PreScript를 읽어 Lua를 모르는 사용자도 이미지 기준으로 **1회 실행 액션 스크립트**와 사용자 GUI를 만들 수 있게 하는 정적 웹도구입니다.

## V5 핵심
- ImageMax XML(EUC-KR/CP949) 로드
- 이미지 폴더 연결 및 미리보기
- 현재 ImageMax Action List 표시
- **120개 기본 스크립트 템플릿**
- 추천 / 전체 / 내 템플릿 / 커뮤니티 탭 + 즐겨찾기
- 템플릿 검색 및 7개 카테고리 필터
- 블록 편집 + 사람이 읽는 실행 흐름 미리보기 + 최종 Lua 동시 표시
- 현재 블록을 이름/설명/카테고리/작성자와 함께 `내 템플릿`으로 저장
- `.imxtpl.json`, `.imxtplpack.json` 가져오기/내보내기
- GitHub Issue → Action → PR 기반 커뮤니티 템플릿 공유
- 선택형 Cloudflare Worker 직접 업로드
- 기존 PreScript.lua GUI 복원/편집
- 함수 사전 시그니처/예제 복사

## 실행 모델
생성 Lua는 ImageMax 전체 프로그램을 대신하지 않습니다.

```text
ImageMax 이미지 리스트 순회
→ 이미지 인식
→ 스크립트 입력 액션
→ V5 생성 Lua 1회 실행
→ 즉시 ImageMax로 반환
```

무한 `while true` / 무한 대기 구조는 생성하지 않습니다. 반복/재확인은 전역 상태 변수와 다음 ImageMax 순회를 이용합니다.

## 구조
```text
imagemax-web-tools/
├─ index.html
├─ script/
│  ├─ index.html
│  ├─ script-builder.js
│  └─ template-library.js
├─ gui/
├─ reference/
├─ templates/                 # Community Template Hub UI
├─ community/
│  ├─ index.json              # 승인된 공유 템플릿 색인
│  └─ templates/
├─ scripts/
│  └─ process-template-submission.mjs
├─ optional-worker/           # 직접 업로드용 선택 기능
├─ data/functions.json
├─ assets/
└─ .github/workflows/
   ├─ pages.yml
   └─ template-submission.yml
```

## GitHub Pages 배포
저장소 루트에 그대로 업로드한 뒤 `main` push로 `pages.yml`이 실행되도록 합니다.

## 커뮤니티 템플릿
기본 설정에서는 페이지에서 템플릿 파일을 선택하고 `공유 신청`을 누르면 GitHub Issue 작성 화면이 열립니다. Issue가 등록되면 `template-submission.yml`이 템플릿을 다시 검증하고 공유 브랜치/PR을 만듭니다.

GitHub 로그인 화면 없이 페이지에서 제출까지 끝내고 싶다면 `optional-worker/`를 배포하고 `assets/share-config.js`에 Worker URL을 지정합니다.

자세한 설명: `docs/COMMUNITY_SHARING.md`

## 템플릿 문서
`docs/TEMPLATES_V5.md`
