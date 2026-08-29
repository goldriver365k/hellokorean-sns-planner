// STEP 6: SNS 샘플 문구 생성 (AI/번역 사용 안 함, UI·복사 기능 테스트용)
// 국가별 현지어 번역은 하지 않는다 (STEP 8의 AI 단계에서 처리).

import { DEFAULT_SERVICE_INFO } from './storage.js';

// getSampleContent(platform, topic, serviceInfo)
// Threads/Facebook/Instagram → { body, link }
// Telegram → { title, body, link }
export function getSampleContent(platform, topic, serviceInfo = DEFAULT_SERVICE_INFO) {
  const topicTitle = topic?.title || '오늘의 한국어 표현';
  const { url, coreMessageKo } = serviceInfo;

  if (platform === 'Threads') {
    return {
      body: `${topicTitle}, 어렵게 느껴지시나요?\n오늘 필요한 한국어 표현을 연습해 보세요.`,
      link: url,
    };
  }

  if (platform === 'Facebook') {
    return {
      body: `${topicTitle}\n\n한국 카페나 식당에서 바로 사용할 수 있는\n기초 한국어 표현을 연습해 보세요.\n\n${coreMessageKo}:`,
      link: url,
    };
  }

  if (platform === 'Instagram') {
    return {
      body: `${topicTitle} ✨\n\n오늘 바로 사용할 수 있는\n간단한 한국어 표현을 연습해 보세요.\n\n#한국어공부 #한국여행 #LearnKorean`,
      link: '', // 현재 단계 샘플은 링크 미포함 (실제 운영 방식은 향후 변경 가능)
    };
  }

  if (platform === 'Telegram') {
    return {
      title: `오늘의 ${coreMessageKo}`,
      body: `${topicTitle}\n한국 생활에서 바로 사용할 수 있는\n기초 한국어 표현을 공부해 보세요.`,
      link: url,
    };
  }

  return { body: topicTitle, link: url };
}

// 플랫폼 + 버튼 종류(part)에 맞는 최종 복사 텍스트를 조립한다.
// part: 'full' | 'caption' | 'title' | 'body'
export function buildCopyText(platform, content, part) {
  if (part === 'title') return content.title || '';

  if (part === 'body') {
    // Telegram [본문 복사]: 본문 + 링크
    return content.link ? `${content.body}\n\n${content.link}` : content.body;
  }

  // full ([전체 복사]) / caption ([캡션 전체 복사])
  if (platform === 'Instagram') return content.body; // 캡션 자체가 완결된 텍스트 (해시태그 포함)
  return content.link ? `${content.body}\n\n${content.link}` : content.body;
}
