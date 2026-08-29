// STEP 6: SNS 샘플 문구 생성 (AI/번역 사용 안 함, UI·복사 기능 테스트용)
// 국가별 현지어 번역은 하지 않는다 (STEP 8의 AI 단계에서 처리).
// STEP 7: 링크는 SNS+국가+날짜 기준 UTM URL로 생성한다 (utmGenerator.js 재사용, 문구와 링크는 분리해서 저장).

import { DEFAULT_SERVICE_INFO } from './storage.js';
import { generateUtmUrl } from './utmGenerator.js';

// getSampleContent(platform, topic, serviceInfo, { country, date })
// Threads/Facebook → { body, utmUrl }
// Instagram → { hook, body, hashtags, utmUrl }
// Telegram → { title, body, utmUrl }
export function getSampleContent(platform, topic, serviceInfo = DEFAULT_SERVICE_INFO, { country, date } = {}) {
  const topicTitle = topic?.title || '오늘의 한국어 표현';
  const { coreMessageKo } = serviceInfo;
  const utmUrl = generateUtmUrl({ platform, country, date, baseUrl: serviceInfo.url });

  if (platform === 'Threads') {
    return {
      body: `${topicTitle}, 어렵게 느껴지시나요?\n오늘 필요한 한국어 표현을 연습해 보세요.`,
      utmUrl,
    };
  }

  if (platform === 'Facebook') {
    return {
      body: `${topicTitle}\n\n한국 카페나 식당에서 바로 사용할 수 있는\n기초 한국어 표현을 연습해 보세요.\n\n${coreMessageKo}:`,
      utmUrl,
    };
  }

  if (platform === 'Instagram') {
    return {
      hook: `${topicTitle} ✨`,
      body: `오늘 바로 사용할 수 있는\n간단한 한국어 표현을 연습해 보세요.\n${coreMessageKo}는 프로필 링크에서 확인해 보세요.`,
      hashtags: ['#한국어공부', '#한국여행', '#LearnKorean'],
      utmUrl, // 캡션에는 기본적으로 넣지 않지만, 데이터로는 항상 보유(향후 설정으로 포함 여부 변경 가능)
    };
  }

  if (platform === 'Telegram') {
    return {
      title: `오늘의 ${coreMessageKo}`,
      body: `${topicTitle}\n한국 생활에서 바로 사용할 수 있는\n기초 한국어 표현을 공부해 보세요.`,
      utmUrl,
    };
  }

  return { body: topicTitle, utmUrl };
}

// 플랫폼 + 버튼 종류(part)에 맞는 최종 복사 텍스트를 조립한다.
// part: 'full' | 'caption' | 'title' | 'body'
export function buildCopyText(platform, content, part) {
  if (part === 'title') return content.title || '';

  if (part === 'body') {
    // Telegram [본문 복사]: 본문 + UTM 링크 (제목에는 URL을 넣지 않는다)
    return content.utmUrl ? `${content.body}\n\n${content.utmUrl}` : content.body;
  }

  if (platform === 'Instagram') {
    // [캡션 전체 복사]: 후킹 + 본문 + 해시태그 (URL은 캡션에 넣지 않음)
    return [content.hook, content.body, content.hashtags?.join(' ')].filter(Boolean).join('\n\n');
  }

  // [전체 복사] (Threads/Facebook): 본문 + UTM 링크
  return content.utmUrl ? `${content.body}\n\n${content.utmUrl}` : content.body;
}
