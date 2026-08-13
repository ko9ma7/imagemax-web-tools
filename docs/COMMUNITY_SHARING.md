# Community Template Sharing Architecture

## 결론
GitHub Pages는 정적 웹사이트이므로 브라우저에서 업로드한 파일을 저장소에 직접 저장할 수 없습니다. 또한 `workflow_dispatch`/`repository_dispatch`를 브라우저에서 직접 호출하려면 GitHub 쓰기 권한 토큰이 필요하므로, PAT/토큰을 Pages JavaScript에 넣는 설계는 사용하지 않습니다.

이 프로젝트는 다음 두 경로를 제공합니다.

## A. 기본 모드 — 서버/비밀키 0개

```text
사용자
  ↓ .imxtpl.json 선택
ImageMax Web Tools
  ↓ 브라우저 1차 검증
GitHub Issue 제출
  ↓ issues: opened
GitHub Action
  ↓ 2차 엄격 검증
community/templates/<id>.json 생성
community/index.json 갱신
community/index.js 오프라인 사본 갱신
  ↓
제출 전용 branch + PR
  ↓ 관리자 검토/Merge
GitHub Pages 배포
  ↓
공유 템플릿 탭 노출
```

### 장점
- 별도 서버/DB 없음
- Pages에 비밀키 없음
- GitHub 계정/Issue 이력이 제출 기록 역할
- 제출 JSON을 곧바로 `main`에 넣지 않음
- 관리자 Merge 전에는 커뮤니티에 공개되지 않음

### UX
작은 단일 템플릿은 `공유 신청`을 누르면 제목/본문이 미리 채워진 GitHub Issue 화면을 엽니다.
본문이 길어 URL에 안전하게 넣기 어려우면 웹앱이 제출 본문을 클립보드에 복사하고 빈 Issue 화면을 엽니다. 이 경우 사용자가 한 번 붙여넣어야 합니다.

## B. 직접 업로드 모드 — 권장 서버리스 중계기
`optional-worker/worker.js`를 Cloudflare Worker 등에 배포하면 사용자는 GitHub Issue 화면으로 이동하지 않아도 됩니다.

```text
페이지의 "공유 신청" + Turnstile 확인
  ↓ 검증 토큰과 JSON POST
Serverless Worker
  ↓ Origin + Turnstile 검증
GitHub Issues API
GitHub Issue 자동 생성
  ↓
기존 GitHub Action → 검증 → PR → Merge
```

Worker의 GitHub credential은 **대상 저장소 1곳 + Issues write만** 허용하는 최소 권한 credential로 제한합니다. Worker는 Origin 없는 요청을 거부하고 Cloudflare Turnstile 검증을 통과한 요청만 중계합니다. repository contents는 직접 수정하지 않으며 저장소 변경 권한은 GitHub 내부에서 실행되는 Action의 `GITHUB_TOKEN`에만 둡니다.

### 설정
1. `optional-worker/worker.js` 배포
2. Worker secret `GITHUB_TOKEN` 설정
3. Worker secret `TURNSTILE_SECRET_KEY` 설정
4. `GITHUB_REPO=ko9ma7/imagemax-web-tools`
5. `ALLOWED_ORIGIN=https://ko9ma7.github.io`
6. Pages에 Turnstile 위젯을 연결하고 `IMAGEMAX_GET_TURNSTILE_TOKEN` 함수 제공
7. `assets/share-config.js`에 Worker URL 지정

```js
window.IMAGEMAX_SHARE_ENDPOINT = 'https://your-worker.example.workers.dev';
window.IMAGEMAX_GET_TURNSTILE_TOKEN = async () => turnstile.getResponse(widgetId);
```

## 왜 Worker가 repository_dispatch를 바로 호출하지 않나요?
기술적으로 가능합니다. 하지만 repository dispatch는 저장소 Contents write 권한을 요구합니다. 반면 Issue 생성 방식은 Worker credential에 Issues write만 주면 됩니다. 공개 커뮤니티 업로드 서비스에서는 Worker가 저장소 쓰기 권한을 갖지 않는 구조가 더 안전합니다.

## 왜 자동 Merge하지 않나요?
템플릿은 허용된 rule/condition/action JSON만 받아 JavaScript 자체를 실행하지 않도록 검증하지만, 생성되는 ImageMax 동작 자체가 잘못되었거나 의미상 위험할 수 있습니다. 따라서 자동 검증 통과 후에도 PR 리뷰 한 번을 거치는 것을 기본 정책으로 합니다.

## Action 서버측 검증
`scripts/process-template-submission.mjs`는 브라우저 검사를 신뢰하지 않고 다시 검사합니다.

- 제출 JSON 최대 60 KB
- 1회 공유 제출 최대 20개 템플릿
- 템플릿 ID: 영문 소문자/숫자/`_`/`-`만 허용
- 팩 내부/기존 community ID 중복 거부
- 허용된 rule kind만 허용
- 허용된 condition/action 타입만 허용
- 템플릿당 최대 30 rules
- action 배열 최대 30개
- 다중 이미지 후보 최대 20개
- 템플릿 하나 최대 30 KB
- 파일 경로는 검증된 template id에서만 생성

## 대안 설계

### 1. GitHub App + Serverless
커뮤니티가 커지면 PAT 대신 GitHub App installation token을 Worker가 발급받는 구조가 가장 관리하기 좋습니다. 설치 저장소와 권한을 세밀하게 관리할 수 있습니다.

### 2. Supabase / Firebase + 승인 DB
템플릿을 Git 저장소에 넣지 않고 DB에 `pending/approved/rejected` 상태로 저장합니다. 규모가 커지고 검색/평점/댓글/사용량 통계가 필요해지면 이 구조가 더 적합합니다. GitHub Pages는 승인된 데이터를 API로 읽기만 합니다.

### 3. Cloudflare D1/R2 + Worker
GitHub을 커뮤니티 DB로 사용하지 않고 Worker + D1/R2에 직접 저장하는 방식입니다. GitHub Action/PR이 필요 없어지지만 별도 데이터 백업·관리 정책이 필요합니다.

## 이 프로젝트의 권장 단계
- 현재/소규모: **Issue → Action → PR**
- 페이지 안에서 완전한 업로드 UX가 필요: **Worker → Issue → Action → PR**
- 공개 커뮤니티가 커짐: **GitHub App 또는 별도 DB**
