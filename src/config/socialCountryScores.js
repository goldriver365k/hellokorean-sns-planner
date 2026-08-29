// STEP 2: SNS별 국가 우선순위 데이터 (정적 config, 실시간 API 없음)
//
// 주의: 이 숫자는 실제 SNS 시장점유율이 아니다.
// 30일 홍보 일정을 배정할 때 참고할 내부 우선순위 점수일 뿐이며,
// 현재 STEP에서는 화면에 표시하지 않는다.

export const SOCIAL_COUNTRY_SCORES = {
  japan: { Threads: 80, Facebook: 35, Instagram: 100, Telegram: 20 },
  taiwan: { Threads: 100, Facebook: 90, Instagram: 90, Telegram: 25 },
  vietnam: { Threads: 50, Facebook: 100, Instagram: 60, Telegram: 45 },
  thailand: { Threads: 55, Facebook: 100, Instagram: 90, Telegram: 35 },
  indonesia: { Threads: 55, Facebook: 95, Instagram: 95, Telegram: 50 },
  mongolia: { Threads: 25, Facebook: 100, Instagram: 75, Telegram: 55 },
  russian: { Threads: 20, Facebook: 25, Instagram: 50, Telegram: 100 },
  english: { Threads: 85, Facebook: 85, Instagram: 100, Telegram: 55 },
};
