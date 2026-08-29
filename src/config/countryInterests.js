// STEP 4: 국가별 관심사 config (AI 판단 없음, 고정 데이터)
// countries.js의 country code를 key로 사용한다.
// 이 목록은 topics.js의 tags와 매칭해서 주제를 자동 배정하는 데 쓰인다.

export const COUNTRY_INTERESTS = {
  japan: ['한국 여행', 'K-POP', 'K-드라마', '한국 음식', '한국 카페', '쇼핑', '기초 한국어'],
  taiwan: ['한국 여행', '부산 여행', '한국 음식', '한국 카페', '쇼핑', '실생활 한국어', 'K-콘텐츠'],
  vietnam: ['한국 생활', '한국 유학', '한국 학교', '한국 취업', '실생활 한국어', '기초 한국어', '한국 문화'],
  thailand: ['K-POP', 'K-드라마', '한국 여행', '한국 음식', '한국 문화', '기초 한국어'],
  indonesia: ['K-POP', 'K-드라마', '한국 문화', '한국 여행', '한국 음식', '기초 한국어'],
  mongolia: ['한국 생활', '한국 학교', '한국 취업', '실생활 한국어', '한국 문화', '기초 한국어'],
  russian: ['한국 문화', '한국 여행', '한국 음식', '기초 한국어', '한국어 학습', 'K-콘텐츠'],
  english: [
    'Korean for beginners',
    'Korean travel phrases',
    'Korean food',
    'Korean cafe phrases',
    'K-pop Korean',
    'K-drama Korean',
    'Useful Korean expressions',
    'Korean culture',
    'Learn Hangul',
    'Free Korean learning',
  ],
};
