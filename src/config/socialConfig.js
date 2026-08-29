// STEP 6: SNS별 복사 방식 config (AI 사용 없음, 고정 데이터)
//
// copyMode:
//  - "full": 본문+링크를 한 번에 복사하는 버튼 하나 ([전체 복사])
//  - "caption": 캡션(후킹+본문+해시태그)을 한 번에 복사하는 버튼 하나 ([캡션 전체 복사])
//  - "separate": 제목/본문을 따로 복사하는 버튼 두 개 ([제목 복사] [본문 복사])
// titleSeparate: 제목을 본문과 별도로 다루는지 여부

export const SOCIAL_CONFIG = {
  Threads: { copyMode: 'full', titleSeparate: false },
  Facebook: { copyMode: 'full', titleSeparate: false },
  Instagram: { copyMode: 'caption', titleSeparate: false },
  Telegram: { copyMode: 'separate', titleSeparate: true },
};
