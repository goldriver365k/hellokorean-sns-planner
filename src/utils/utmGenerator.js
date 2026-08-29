// STEP 7: SNS + 국가 + 날짜 기준 UTM 링크 자동 생성 (AI 사용 안 함)
// 브라우저 기본 URL / URLSearchParams만 사용, 외부 URL 패키지 없음.

import { COUNTRIES } from '../config/countries.js';
import { DEFAULT_SERVICE_INFO } from './storage.js';

// utm_source는 SNS별로 소문자 고정
const UTM_SOURCE_BY_PLATFORM = {
  Threads: 'threads',
  Facebook: 'facebook',
  Instagram: 'instagram',
  Telegram: 'telegram',
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function findCountryCode(country) {
  // country는 nameEn("Taiwan")이나 code("taiwan") 둘 다 받을 수 있게 한다
  const def = COUNTRIES.find((c) => c.nameEn === country || c.code === country);
  return def ? def.code : null;
}

// generateUtmUrl({ platform, country, date, baseUrl })
// 반환값: 완성된 UTM URL 문자열. platform/country가 유효하지 않으면 기본 URL을 그대로 반환한다(빈 값 방어).
export function generateUtmUrl({ platform, country, date, baseUrl } = {}) {
  const url = baseUrl || DEFAULT_SERVICE_INFO.url;

  const source = UTM_SOURCE_BY_PLATFORM[platform];
  const countryCode = findCountryCode(country);
  if (!source || !countryCode) return url;

  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const campaign = `${countryCode}_${d.getFullYear()}_${pad2(d.getMonth() + 1)}`;

  try {
    const u = new URL(url);
    const params = new URLSearchParams(u.search);
    params.set('utm_source', source);
    params.set('utm_medium', 'social');
    params.set('utm_campaign', campaign);
    u.search = params.toString();
    return u.toString();
  } catch {
    return url;
  }
}
