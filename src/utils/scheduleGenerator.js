// STEP 3: SNS별 국가 자동 배정 (규칙 기반, AI/외부 패키지 사용 안 함)
//
// - 기존 STEP 2 데이터(countries.js, socialCountryScores.js)만 사용한다.
// - 국가 배정은 socialCountryScores의 점수 비율에 따른 weighted distribution 방식이다.
// - 랜덤 요소는 "약간의 순서 분산"에만 쓰이고, 30일 전체 총 배정 횟수는
//   점수 비율로 먼저 확정한 뒤 순서만 섞는다 (그래서 비율이 무너지지 않는다).

import { COUNTRIES } from '../config/countries.js';
import { SOCIAL_COUNTRY_SCORES } from '../config/socialCountryScores.js';

function getCountryDef(code) {
  return COUNTRIES.find((c) => c.code === code);
}

// 특정 SNS에서 각 국가가 30일 동안 받아야 할 배정 횟수를 계산한다.
// (점수 비율 → 목표 횟수, 반올림 오차는 largest remainder 방식으로 보정해서
//  총합이 정확히 days가 되도록 맞춘다)
function computeCountryCounts(enabledCountryCodes, sns, days) {
  const scores = enabledCountryCodes.map((code) => ({
    code,
    score: SOCIAL_COUNTRY_SCORES[code]?.[sns] ?? 0,
  }));

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  // 점수가 전부 0인 예외 상황이면 균등 배분으로 대체
  if (totalScore <= 0) {
    return computeEqualCounts(enabledCountryCodes, days);
  }

  const entries = scores.map((s) => {
    const raw = (s.score / totalScore) * days;
    return { code: s.code, count: Math.floor(raw), frac: raw - Math.floor(raw) };
  });

  let assigned = entries.reduce((sum, e) => sum + e.count, 0);
  let remainder = days - assigned;

  // 소수점 오차가 큰(=더 받아야 할) 국가부터 1회씩 추가 배정
  const byFrac = [...entries].sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) {
    byFrac[i % byFrac.length].count += 1;
  }

  const counts = {};
  entries.forEach((e) => {
    counts[e.code] = e.count;
  });
  return counts;
}

function computeEqualCounts(enabledCountryCodes, days) {
  const counts = {};
  enabledCountryCodes.forEach((code) => {
    counts[code] = 0;
  });
  for (let i = 0; i < days; i++) {
    counts[enabledCountryCodes[i % enabledCountryCodes.length]] += 1;
  }
  return counts;
}

// 배열을 무작위로 섞는다 (Fisher-Yates) — 정렬 시 동점 후보의 순서를 매번 다르게 만들어서
// "국가 순서가 완전히 고정되지 않도록" 약간의 분산을 준다.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MAX_RUN = 2; // 같은 국가 3일 연속 금지 → 연속 허용 최대치는 2

// counts(국가별 목표 횟수)를 days 길이의 순서로 펼친다.
// - 매 자리마다 "남은 배정 횟수가 가장 많은 국가"를 우선 배치해서 점수 비율을 지킨다
//   (동점일 때는 무작위로 섞어서 순서에 약간의 분산을 준다).
// - 단, 그 국가를 배치하면 3일 연속이 되는 경우에는 건너뛰고 그다음 후보를 쓴다.
//   (남은 국가가 하나뿐인 극단적인 경우에만 예외적으로 3연속을 허용한다)
function buildSequence(counts, days) {
  const remaining = { ...counts };
  const result = [];

  for (let i = 0; i < days; i++) {
    const last = result[result.length - 1];
    let run = 0;
    for (let j = result.length - 1; j >= 0 && result[j] === last; j--) run++;

    const candidates = shuffle(Object.keys(remaining).filter((c) => remaining[c] > 0)).sort(
      (a, b) => remaining[b] - remaining[a]
    );

    let picked = candidates.find((c) => !(c === last && run >= MAX_RUN));
    if (!picked) picked = candidates[0]; // 예외: 선택지가 그 국가뿐인 경우

    result.push(picked);
    remaining[picked] -= 1;
  }

  return result;
}

// STEP 3 핵심 함수
// settings: { enabledCountries: string[], enabledSocials: string[], days?: number }
// 반환: [{ day, socials: { [snsName]: { country, language } } }, ...]
export function generateMonthlySchedule(settings) {
  const { enabledCountries = [], enabledSocials = [], days = 30 } = settings || {};

  const schedule = Array.from({ length: days }, (_, i) => ({ day: i + 1, socials: {} }));

  if (enabledCountries.length === 0 || enabledSocials.length === 0) {
    return schedule;
  }

  enabledSocials.forEach((sns) => {
    const counts = computeCountryCounts(enabledCountries, sns, days);
    const sequence = buildSequence(counts, days);

    sequence.forEach((countryCode, index) => {
      const countryDef = getCountryDef(countryCode);
      if (!countryDef) return;
      schedule[index].socials[sns] = {
        country: countryDef.nameEn,
        language: countryDef.language,
      };
    });
  });

  return schedule;
}

// STEP 5: 하루치 "이 날짜 다시 배정"에서 쓰는 국가 1개 가중 랜덤 선택.
// socialCountryScores 점수에 비례해서 뽑되, avoidCodes(이웃 날짜와 같은 국가)는 가능하면 피한다.
export function pickWeightedCountry(enabledCountryCodes, sns, avoidCodes = []) {
  const scored = enabledCountryCodes.map((code) => ({
    code,
    score: SOCIAL_COUNTRY_SCORES[code]?.[sns] ?? 0,
  }));

  let pool = scored.filter((c) => !avoidCodes.includes(c.code));
  if (pool.length === 0) pool = scored; // 선택지가 없으면(모두 회피 대상) 예외적으로 전체 허용

  const total = pool.reduce((sum, c) => sum + c.score, 0);
  if (total <= 0) {
    return pool[Math.floor(Math.random() * pool.length)].code;
  }

  let r = Math.random() * total;
  for (const c of pool) {
    r -= c.score;
    if (r <= 0) return c.code;
  }
  return pool[pool.length - 1].code;
}

// 개발 확인용: SNS별 국가 배정 횟수 집계 (console.log 등으로만 확인하면 충분)
export function getScheduleStats(schedule) {
  const stats = {};
  schedule.forEach((day) => {
    Object.entries(day.socials).forEach(([sns, info]) => {
      if (!stats[sns]) stats[sns] = {};
      stats[sns][info.country] = (stats[sns][info.country] || 0) + 1;
    });
  });
  return stats;
}
