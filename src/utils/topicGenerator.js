// STEP 4: SNS+국가 조합에 맞는 홍보 주제 자동 배정 (규칙 기반, AI 사용 안 함)
//
// - STEP 3에서 만들어진 monthlySchedule(day/SNS/country/language)은 그대로 두고
//   각 슬롯에 topic만 추가한다. 국가 배정 자체는 다시 만들지 않는다.
// - 주제 선정 우선순위: 1) 국가 관심사와 맞는 주제 → 2) 실생활/기초 한국어 같은 범용 주제
//   → 3) 아무 주제나(반복이라도 fallback으로 반드시 하나는 고른다)
// - 반복 방지: 같은 SNS 연속 금지, 같은 SNS+국가는 최근 5회 안에 재사용 금지(가능하면),
//   같은 날 다른 SNS와도 가능하면 겹치지 않게.

import { COUNTRIES } from '../config/countries.js';
import { COUNTRY_INTERESTS } from '../config/countryInterests.js';
import { TOPICS } from '../config/topics.js';

const RECENT_WINDOW = 5;

const COUNTRY_BY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.nameEn, c]));

const GENERIC_TAGS = ['실생활 한국어', '기초 한국어', 'Korean for beginners', 'Useful Korean expressions'];

function getInterestsForCountryName(countryName) {
  const def = COUNTRY_BY_NAME[countryName];
  if (!def) return [];
  return COUNTRY_INTERESTS[def.code] || [];
}

function getTopicTitle(topic, countryName) {
  const def = COUNTRY_BY_NAME[countryName];
  return def?.code === 'english' ? topic.titleEn : topic.titleKo;
}

// 우선순위 + 반복 방지 규칙을 적용해서 주제 하나를 고른다.
// 조건을 만족하는 주제가 없으면 점점 조건을 완화해서 반드시 하나는 반환한다(무한루프/오류 방지).
function pickTopic({ interests, excludeConsecutive, excludeRecent, excludeToday }) {
  const matched = TOPICS.filter((t) => t.tags.some((tag) => interests.includes(tag)));
  const generic = TOPICS.filter((t) => t.tags.some((tag) => GENERIC_TAGS.includes(tag)));
  const pools = [matched, generic, TOPICS];

  const filters = [
    (t) => !excludeConsecutive.has(t.id) && !excludeRecent.has(t.id) && !excludeToday.has(t.id),
    (t) => !excludeConsecutive.has(t.id) && !excludeRecent.has(t.id),
    (t) => !excludeConsecutive.has(t.id),
    () => true,
  ];

  for (const filter of filters) {
    for (const pool of pools) {
      const candidates = pool.filter(filter);
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
  }
  return TOPICS[0];
}

// STEP 3 일정 전체에 topic을 새로 배정한다 (국가/언어는 그대로 유지).
// [30일 계획 만들기]/[다시 만들기] 직후, 또는 [주제 다시 배정] 버튼에서 사용한다.
export function generateTopicsForSchedule(schedule) {
  const lastTopicBySns = {};
  const recentBySnsCountry = {}; // key: `${sns}::${country}` -> 최근 topic id 배열(최대 5개)

  return schedule.map((day) => {
    const usedToday = new Set();
    const socials = {};

    Object.entries(day.socials).forEach(([sns, slot]) => {
      const interests = getInterestsForCountryName(slot.country);
      const excludeConsecutive = new Set(lastTopicBySns[sns] ? [lastTopicBySns[sns]] : []);
      const key = `${sns}::${slot.country}`;
      const excludeRecent = new Set(recentBySnsCountry[key] || []);

      const topic = pickTopic({ interests, excludeConsecutive, excludeRecent, excludeToday: usedToday });

      socials[sns] = {
        ...slot,
        topic: { id: topic.id, title: getTopicTitle(topic, slot.country) },
      };

      usedToday.add(topic.id);
      lastTopicBySns[sns] = topic.id;

      const window = recentBySnsCountry[key] || [];
      window.push(topic.id);
      if (window.length > RECENT_WINDOW) window.shift();
      recentBySnsCountry[key] = window;
    });

    return { ...day, socials };
  });
}

// 특정 날짜의 특정 SNS 슬롯 하나만 다른 주제로 변경한다. (국가/언어는 그대로)
export function changeTopicForSlot(schedule, day, sns) {
  const dayIndex = schedule.findIndex((d) => d.day === day);
  if (dayIndex === -1) return schedule;

  const slot = schedule[dayIndex].socials[sns];
  if (!slot) return schedule;

  const interests = getInterestsForCountryName(slot.country);

  // 하루 전 같은 SNS의 주제 (연속 방지용)
  const prevDay = schedule[dayIndex - 1];
  const excludeConsecutive = new Set();
  if (prevDay?.socials?.[sns]?.topic?.id) excludeConsecutive.add(prevDay.socials[sns].topic.id);
  if (slot.topic?.id) excludeConsecutive.add(slot.topic.id); // 반드시 지금과 다른 주제로 바뀌어야 함

  // 같은 SNS + 같은 국가의 최근 5회 (이전 날짜들 기준)
  const excludeRecent = new Set();
  for (let i = dayIndex - 1; i >= 0 && excludeRecent.size < RECENT_WINDOW; i--) {
    const pastSlot = schedule[i].socials[sns];
    if (pastSlot && pastSlot.country === slot.country && pastSlot.topic?.id) {
      excludeRecent.add(pastSlot.topic.id);
    }
  }

  // 같은 날 다른 SNS에서 이미 쓰인 주제
  const excludeToday = new Set();
  Object.entries(schedule[dayIndex].socials).forEach(([otherSns, otherSlot]) => {
    if (otherSns !== sns && otherSlot.topic?.id) excludeToday.add(otherSlot.topic.id);
  });

  const topic = pickTopic({ interests, excludeConsecutive, excludeRecent, excludeToday });

  const newSchedule = [...schedule];
  newSchedule[dayIndex] = {
    ...newSchedule[dayIndex],
    socials: {
      ...newSchedule[dayIndex].socials,
      [sns]: { ...slot, topic: { id: topic.id, title: getTopicTitle(topic, slot.country) } },
    },
  };
  return newSchedule;
}
