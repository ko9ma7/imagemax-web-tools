// 선택 기능: Cloudflare Worker 등 서버리스 공유 API를 붙일 때 URL을 설정하세요.
// 비워두면 안전한 기본 모드(페이지 → GitHub Issue → GitHub Action → PR)를 사용합니다.
window.IMAGEMAX_SHARE_ENDPOINT = '';
// 직접 제출 모드는 Turnstile 위젯 연동 코드가 이 함수를 제공해야 합니다.
// window.IMAGEMAX_GET_TURNSTILE_TOKEN = async () => turnstile.getResponse(widgetId);
