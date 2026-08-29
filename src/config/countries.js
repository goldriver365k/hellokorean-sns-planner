// STEP 2: 홍보 대상 국가/언어 설정 (고정 config, AI 판단 없음)
// 향후 국가를 추가하려면 이 배열에 항목을 추가하면 된다.
// (예: 영어권을 미국/영국/캐나다/호주로 세분화하고 싶을 때도 이 배열에 항목만 추가하면 됨)

export const COUNTRIES = [
  { code: 'japan', nameEn: 'Japan', nameKo: '일본', language: 'Japanese' },
  { code: 'taiwan', nameEn: 'Taiwan', nameKo: '대만', language: 'Traditional Chinese' },
  { code: 'vietnam', nameEn: 'Vietnam', nameKo: '베트남', language: 'Vietnamese' },
  { code: 'thailand', nameEn: 'Thailand', nameKo: '태국', language: 'Thai' },
  { code: 'indonesia', nameEn: 'Indonesia', nameKo: '인도네시아', language: 'Indonesian' },
  { code: 'mongolia', nameEn: 'Mongolia', nameKo: '몽골', language: 'Mongolian' },
  { code: 'russian', nameEn: 'Russian', nameKo: '러시아어권', language: 'Russian' },
  { code: 'english', nameEn: 'English', nameKo: '영어권', language: 'English' },
];
