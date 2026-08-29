// STEP 8: 프론트에서 AI 문구 생성을 요청하는 유일한 서비스 창구.
// 브라우저는 AI 제공업체에 직접 요청하지 않는다 — 항상 Netlify Function을 거친다.
// API KEY는 여기(프론트 코드)에 절대 존재하지 않는다.

const FUNCTION_URL = '/.netlify/functions/generate-content';

// generateSocialContent(payload)
// payload: { service, url, benefit, platform, country, language, topic }
// 반환: 플랫폼에 맞는 { body } | { hook, body } | { hook, body, hashtags } | { title, body }
// 실패 시 Error(message)를 던진다. error.code로 원인을 구분할 수 있다.
export async function generateSocialContent(payload) {
  let res;
  try {
    res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    const err = new Error('문구 생성에 실패했습니다. 다시 시도해 주세요.');
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // 서버는 CONFIG_MISSING/UPSTREAM_ERROR 같은 "AI 도메인" 실패도 HTTP 200 + success:false로 응답한다
  // (불필요한 브라우저 네트워크 에러 로그 없이 명확한 오류만 표시하기 위함).
  // 그 외(잘못된 요청 등) 순수 HTTP 오류는 res.ok로 걸러진다.
  if (!res.ok || !data || data.success === false) {
    const err = new Error(data?.error || '문구 생성에 실패했습니다. 다시 시도해 주세요.');
    err.code = data?.code || 'UNKNOWN_ERROR';
    throw err;
  }

  const { success, ...content } = data;
  return content;
}
