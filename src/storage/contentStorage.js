// STEP 8: AI가 생성한 SNS 문구를 LocalStorage에 캐시하는 최소 저장 유틸.
// 별도 DB 없음. 모든 컴포넌트는 이 파일을 통해서만 AI 문구 캐시를 읽고 쓴다.

const CACHE_KEY = 'hellokorean_ai_content_cache_v1';

function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'no-date';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'none';
}

// 캐시 key는 날짜/SNS/국가/언어/주제 조합으로 구분한다.
export function buildContentCacheKey({ date, sns, country, language, topicId }) {
  return [toIsoDate(date), slugify(sns), slugify(country), slugify(language), slugify(topicId)].join('_');
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 저장 실패해도 화면이 깨지지 않도록 조용히 무시한다
  }
}

export function getCachedContent(cacheKey) {
  const cache = loadCache();
  return cache[cacheKey] || null;
}

export function setCachedContent(cacheKey, content) {
  const cache = loadCache();
  cache[cacheKey] = content;
  saveCache(cache);
}
