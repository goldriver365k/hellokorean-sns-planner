// STEP 8: HelloKorean SNS 문구 생성 - 서버 측 AI 호출 (Netlify Function)
//
// React → 이 함수 → AI API 순서로만 호출한다. API KEY는 여기(서버 환경변수)에서만 읽는다.
// 절대 프론트엔드 코드에 API KEY를 넣지 않는다.
//
// 환경변수:
//   AI_API_KEY   - AI 제공업체 API KEY (필수)
//   AI_MODEL     - 사용할 모델명 (필수)
//   AI_PROVIDER  - 'anthropic'(기본값) | 'openai'

import { SOCIAL_CONFIG } from '../../src/config/socialConfig.js';
import { DEFAULT_SERVICE_INFO } from '../../src/utils/storage.js';

// SNS별로 AI 응답에 반드시 있어야 하는 필드
// keywords: 대상 언어로 된 검색어(해시태그 "#" 없이, SNS 내 검색용) — 4개 SNS 공통
const REQUIRED_FIELDS = {
  Threads: ['body', 'keywords'],
  Facebook: ['hook', 'body', 'keywords'],
  Instagram: ['hook', 'body', 'hashtags', 'keywords'],
  Telegram: ['title', 'body', 'keywords'],
};

const ARRAY_FIELDS = new Set(['hashtags', 'keywords']);

// 짧고 고정된 공통 instruction (매 요청마다 긴 설명을 반복하지 않는다)
const SYSTEM_PROMPT = `You create localized social media posts for HelloKorean.

Goal: Provide useful Korean-learning content first and naturally encourage a visit to HelloKorean.
HelloKorean: Free Korean learning website.

Rules:
- Write naturally for the target country.
- The "language" field tells you the ONLY language to write your output in. This is mandatory.
- The "topic" field is given in Korean as a content hint only, not as text to copy or leave untranslated.
  Never leave any Korean (or English) words in your output unless the requested language IS Korean or English.
- Fully rewrite/adapt the topic into the target language and culture — do not machine-translate word for word.
- Do not literally translate Korean advertising copy.
- Make the post useful first.
- Mention free Korean learning naturally.
- Avoid exaggerated advertising.
- Avoid spammy wording.
- Avoid excessive emoji.
- Avoid excessive hashtags.
- Match the platform style.
- Use the supplied topic.
- Do not invent another URL.
- "keywords" = 3-5 short plain search terms (NOT hashtags, no "#") in the target language that someone
  would actually type into that platform's search bar to find this kind of post. Keep them realistic
  and specific to the topic/country, not generic filler words.
- Return only the requested structured content.
- Return raw JSON only. Do not use markdown code fences.`;

function getFormatInstruction(platform) {
  if (platform === 'Threads') {
    return 'Return JSON exactly as {"body": "...", "keywords": ["...", "..."]}. Style: short, conversational, natural opening line, 2-4 short lines, no heavy hashtags.';
  }
  if (platform === 'Facebook') {
    return 'Return JSON exactly as {"hook": "...", "body": "...", "keywords": ["...", "..."]}. hook = one natural attention line (not a bold headline). body is slightly more detailed than Threads.';
  }
  if (platform === 'Instagram') {
    return 'Return JSON exactly as {"hook": "...", "body": "...", "hashtags": ["...", "..."], "keywords": ["...", "..."]}. Short hook, short caption, a few line breaks, 3-6 hashtags. Do not force the URL into the caption; a natural CTA like "learn for free via the link in bio" is fine. keywords are separate from hashtags (no "#").';
  }
  if (platform === 'Telegram') {
    return 'Return JSON exactly as {"title": "...", "body": "...", "keywords": ["...", "..."]}. title: short and clear. body: information-focused.';
  }
  return '';
}

function buildUserMessage({ service, url, benefit, platform, country, language, topic }) {
  return [
    `service: ${service}`,
    `url: ${url}`,
    `benefit: ${benefit}`,
    `platform: ${platform}`,
    `country: ${country}`,
    `language: ${language}`,
    `topic (Korean, hint only — do not leave untranslated): ${topic}`,
    '',
    getFormatInstruction(platform),
    '',
    `Write every field of your JSON response entirely in ${language}. Do not mix in Korean or English words unless ${language} is Korean or English.`,
  ].join('\n');
}

function stripCodeFences(text) {
  return String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
}

function safeParseJson(text) {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    return null;
  }
}

// AI가 만든 JSON에서 플랫폼별 필수 필드만 검증해서 골라낸다 (없으면 null).
// 이 과정에서 AI가 임의로 만든 url 같은 필드는 자동으로 버려진다.
function validateContent(platform, obj) {
  const required = REQUIRED_FIELDS[platform];
  if (!required || !obj || typeof obj !== 'object') return null;

  const result = {};
  for (const field of required) {
    const value = obj[field];
    if (ARRAY_FIELDS.has(field)) {
      if (!Array.isArray(value) || value.length === 0) return null;
      const cleaned = value.map((v) => String(v).trim()).filter(Boolean);
      if (cleaned.length === 0) return null;
      result[field] = cleaned;
    } else {
      if (typeof value !== 'string' || !value.trim()) return null;
      result[field] = value.trim();
    }
  }
  return result;
}

async function callAnthropic({ apiKey, model, systemPrompt, userMessage }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_http_${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text || '';
}

async function callOpenAI({ apiKey, model, systemPrompt, userMessage }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai_http_${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: '허용되지 않은 요청입니다.', code: 'METHOD_NOT_ALLOWED' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: '잘못된 요청입니다.', code: 'BAD_REQUEST' });
  }

  const { platform, country, language, topic } = payload;
  if (!SOCIAL_CONFIG[platform] || !country || !language || !topic) {
    return jsonResponse(400, { error: '잘못된 요청입니다.', code: 'BAD_REQUEST' });
  }

  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const provider = process.env.AI_PROVIDER || 'anthropic';

  if (!apiKey || !model) {
    // AI 자체의 실패(설정 누락)는 "정상적으로 처리된 응답"으로 200 + success:false로 반환한다.
    // (405/400과 달리 이 경우는 정상 사용 흐름에서도 발생할 수 있는 상태라, HTTP 에러 상태로
    //  응답하면 브라우저 콘솔에 불필요한 네트워크 에러 로그가 남는다)
    return jsonResponse(200, { success: false, error: 'AI API 설정이 필요합니다.', code: 'CONFIG_MISSING' });
  }

  const userMessage = buildUserMessage({
    service: payload.service || DEFAULT_SERVICE_INFO.name,
    url: payload.url || DEFAULT_SERVICE_INFO.url,
    benefit: payload.benefit || DEFAULT_SERVICE_INFO.coreMessageEn,
    platform,
    country,
    language,
    topic,
  });

  let rawText;
  try {
    rawText =
      provider === 'openai'
        ? await callOpenAI({ apiKey, model, systemPrompt: SYSTEM_PROMPT, userMessage })
        : await callAnthropic({ apiKey, model, systemPrompt: SYSTEM_PROMPT, userMessage });
  } catch (err) {
    // 진단용 로그: HTTP 상태 코드만 남긴다 (API KEY, 응답 본문 등 민감 정보는 절대 남기지 않음)
    console.error('[hellokorean] AI upstream call failed:', provider, err?.message);
    return jsonResponse(200, { success: false, error: 'AI 응답을 처리할 수 없습니다.', code: 'UPSTREAM_ERROR' });
  }

  const parsed = safeParseJson(rawText);
  const validated = validateContent(platform, parsed);
  if (!validated) {
    // 진단용 로그: 응답 길이/파싱 성공 여부만 남긴다 (본문 내용은 남기지 않음)
    console.error(
      '[hellokorean] AI response invalid:',
      provider,
      'length=' + (rawText ? rawText.length : 0),
      'parsedOk=' + !!parsed
    );
    return jsonResponse(200, { success: false, error: 'AI 응답을 처리할 수 없습니다.', code: 'UPSTREAM_ERROR' });
  }

  return jsonResponse(200, { success: true, ...validated });
};
