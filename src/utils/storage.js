// STEP 1: LocalStorage 기본 저장 구조
// - 별도 서버/DB 없이 브라우저 LocalStorage만 사용 (비용 최소화 원칙)

import { COUNTRIES } from '../config/countries.js';

const STORAGE_KEY = 'hellokorean_sns_planner_v1';

// HelloKorean 기본 정보 (설정 화면에서 수정 가능)
export const DEFAULT_SERVICE_INFO = {
  name: 'HelloKorean',
  url: 'https://hellokorean.site',
  coreMessageKo: '무료 한국어 공부',
  coreMessageEn: 'Learn Korean for Free',
  channels: ['Threads', 'Facebook', 'Instagram', 'Telegram'],
};

// STEP 2: 설정 화면의 "사용 SNS" 목록 (고정 4개)
export const SNS_CHANNELS = ['Threads', 'Facebook', 'Instagram', 'Telegram'];

// STEP 2: 홍보 국가 ON/OFF 기본값 (COUNTRIES config 기준, 전부 true)
function createDefaultCountrySettings() {
  const result = {};
  COUNTRIES.forEach((c) => {
    result[c.code] = true;
  });
  return result;
}

// STEP 2: 사용 SNS ON/OFF 기본값 (SNS_CHANNELS 기준, 전부 true)
function createDefaultSnsSettings() {
  const result = {};
  SNS_CHANNELS.forEach((name) => {
    result[name] = true;
  });
  return result;
}

// 30일 홍보 계획의 하루 항목 기본값
function createEmptyDay(day) {
  return {
    day, // 1 ~ 30
    channel: '',
    content: '',
    done: false,
  };
}

function createDefaultPlan() {
  return Array.from({ length: 30 }, (_, i) => createEmptyDay(i + 1));
}

export function getDefaultData() {
  return {
    serviceInfo: { ...DEFAULT_SERVICE_INFO },
    plan: createDefaultPlan(),
    startDate: null, // 30일 계획 시작일 (YYYY-MM-DD), 설정에서 지정
    countries: createDefaultCountrySettings(), // STEP 2: 홍보 국가 ON/OFF
    snsChannels: createDefaultSnsSettings(), // STEP 2: 사용 SNS ON/OFF
  };
}

// 저장된 데이터와 기본 구조를 병합해 이후 필드가 추가되어도 안전하게 로드
function mergeWithDefaults(data) {
  const def = getDefaultData();
  return {
    ...def,
    ...data,
    serviceInfo: { ...def.serviceInfo, ...(data?.serviceInfo || {}) },
    plan: Array.isArray(data?.plan) && data.plan.length === 30 ? data.plan : def.plan,
    countries: { ...def.countries, ...(data?.countries || {}) },
    snsChannels: { ...def.snsChannels, ...(data?.snsChannels || {}) },
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = getDefaultData();
      saveData(def);
      return def;
    }
    return mergeWithDefaults(JSON.parse(raw));
  } catch (e) {
    console.error('[hellokorean] LocalStorage 로드 실패, 기본값 사용', e);
    return getDefaultData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[hellokorean] LocalStorage 저장 실패', e);
  }
}

// 오늘이 30일 계획 중 며칠째인지 계산 (startDate 미설정 시 1일차)
export function getTodayDayNumber(startDate) {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays < 1) return 1;
  if (diffDays > 30) return 30;
  return diffDays;
}
