# V5 Community / Template Release

## 주요 변경
- 기본 템플릿 **120개**
- 추천 / 전체 / 내 템플릿 / 커뮤니티
- 검색 + 카테고리 필터 + 즐겨찾기
- 현재 블록을 커스텀 템플릿으로 저장하는 전용 입력창
- 작성자 / 설명 / 태그 / 카테고리 저장
- `.imxtpl.json` 단일 내보내기
- `.imxtplpack.json` 팩 내보내기/가져오기
- Community Template Hub
- GitHub Issue → Action → PR 자동화
- 선택형 Serverless 직접 업로드 endpoint
- 브라우저 검증 + Action 서버측 이중 검증

## 기본 템플릿 수
| 카테고리 | 수 |
|---|---:|
| 기본 | 19 |
| 이미지 연계 | 26 |
| 상태/횟수 | 27 |
| 액션 흐름 | 13 |
| 입력/좌표 | 11 |
| 알림/기록 | 13 |
| 데이터/환경 | 11 |
| **합계** | **120** |

## 공유 배포 전 저장소 설정
- Issues 활성화
- Actions 활성화
- `template-submission.yml` 기본 브랜치에 존재
- Actions workflow token이 `contents: write`, `issues: write`, `pull-requests: write`를 사용할 수 있도록 저장소 정책 확인
- Action의 PR 자동 생성이 정책상 막혀 있으면 workflow가 compare URL을 Issue 댓글에 남기므로 수동으로 PR 생성 가능

## 중요한 원칙
공유된 템플릿은 자동 Merge하지 않습니다. Action은 형식 검증과 branch/PR 생성까지만 담당하고 최종 등록은 maintainer Merge로 결정합니다.
