import { useEffect, useRef, useState } from 'react';
import { SOCIAL_CONFIG } from '../config/socialConfig.js';
import { buildCopyText } from '../utils/sampleContent.js';
import { generateUtmUrl } from '../utils/utmGenerator.js';
import { generateSocialContent } from '../services/aiService.js';
import { buildContentCacheKey, getCachedContent, setCachedContent } from '../storage/contentStorage.js';

// STEP 6: SNS 하나(오늘의 홍보 카드)를 표시하는 공통 컴포넌트.
// 국가/언어/주제 표시 + 플랫폼별 복사 버튼 구조 + 홍보 완료 체크를 담당한다.
// STEP 7: country/date를 받아 SNS+국가+날짜 기준 UTM 링크를 함께 생성한다.
// STEP 8: [문구 생성] 버튼을 눌렀을 때만 서버(Netlify Function)에 AI 문구를 요청하고,
//         결과는 LocalStorage(contentStorage)에 캐시해서 같은 조합이면 재사용한다.
//         페이지 진입/새로고침/날짜 이동/국가 변경만으로는 절대 자동 생성하지 않는다.
export default function SocialCard({
  sns,
  countryLabel,
  country,
  language,
  topic,
  completed,
  serviceInfo,
  date,
  onToggleComplete,
}) {
  const [message, setMessage] = useState('');
  const [aiContent, setAiContent] = useState(null);
  const [aiStatus, setAiStatus] = useState('idle'); // idle | loading | error
  const [aiError, setAiError] = useState('');
  const requestingRef = useRef(false);

  const config = SOCIAL_CONFIG[sns] || { copyMode: 'full', titleSeparate: false };
  const utmUrl = generateUtmUrl({ platform: sns, country, date, baseUrl: serviceInfo.url });
  const cacheKey = buildContentCacheKey({ date, sns, country, language, topicId: topic?.id });

  // 캐시 key(날짜/SNS/국가/언어/주제)가 바뀌면 LocalStorage 캐시만 다시 읽는다 — API 호출 아님.
  useEffect(() => {
    setAiContent(getCachedContent(cacheKey));
    setAiStatus('idle');
    setAiError('');
  }, [cacheKey]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 1500);
    return () => clearTimeout(timer);
  }, [message]);

  const copy = async (text, successMessage = '복사되었습니다') => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch {
      setMessage('복사에 실패했습니다.');
    }
  };

  const handleGenerate = async (isRegenerate) => {
    if (requestingRef.current) return; // 연속 클릭으로 인한 중복 호출 방지
    if (isRegenerate) {
      const ok = window.confirm('새 문구를 다시 생성하면 AI 사용량이 발생합니다. 계속하시겠습니까?');
      if (!ok) return;
    }

    requestingRef.current = true;
    setAiStatus('loading');
    setAiError('');

    try {
      const result = await generateSocialContent({
        service: serviceInfo.name,
        url: serviceInfo.url,
        benefit: serviceInfo.coreMessageEn,
        platform: sns,
        country,
        language,
        topic: topic?.title,
      });
      setCachedContent(cacheKey, result);
      setAiContent(result);
      setAiStatus('idle');
    } catch (e) {
      setAiStatus('error');
      setAiError(e.code === 'CONFIG_MISSING' ? 'AI API 설정이 필요합니다.' : '문구 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      requestingRef.current = false;
    }
  };

  const displayContent = aiContent ? { ...aiContent, utmUrl } : null;

  return (
    <div className={`card social-card${completed ? ' completed' : ''}`}>
      <h3>
        {sns.toUpperCase()} {completed && <span className="done-badge">완료</span>}
      </h3>
      <p>
        <strong>대상:</strong> {countryLabel}
      </p>
      <p>
        <strong>언어:</strong> {language}
      </p>
      <p>
        <strong>오늘의 주제:</strong> {topic?.title}
      </p>

      {/* STEP 8: AI 생성 문구 영역 */}
      {displayContent ? (
        <div className="ai-content">
          {sns === 'Facebook' && <p className="ai-hook">{displayContent.hook}</p>}
          {sns === 'Instagram' && <p className="ai-hook">{displayContent.hook}</p>}
          {sns === 'Telegram' && <p className="ai-hook">{displayContent.title}</p>}
          <p className="ai-body">{displayContent.body}</p>
          {sns === 'Instagram' && displayContent.hashtags && (
            <p className="ai-hashtags">{displayContent.hashtags.join(' ')}</p>
          )}
        </div>
      ) : (
        <p className="ai-placeholder">아직 실제 문구가 생성되지 않았습니다.</p>
      )}

      {aiStatus === 'error' && <p className="ai-error">{aiError}</p>}

      <div className="copy-actions">
        <button type="button" disabled={aiStatus === 'loading'} onClick={() => handleGenerate(!!aiContent)}>
          {aiStatus === 'loading' ? '생성 중...' : aiContent ? '다시 생성' : '문구 생성'}
        </button>

        {displayContent && config.copyMode === 'full' && (
          <button type="button" onClick={() => copy(buildCopyText(sns, displayContent, 'full'))}>
            전체 복사
          </button>
        )}
        {displayContent && config.copyMode === 'caption' && (
          <button type="button" onClick={() => copy(buildCopyText(sns, displayContent, 'caption'))}>
            캡션 전체 복사
          </button>
        )}
        {displayContent && config.copyMode === 'separate' && (
          <>
            <button type="button" onClick={() => copy(buildCopyText(sns, displayContent, 'title'))}>
              제목 복사
            </button>
            <button type="button" onClick={() => copy(buildCopyText(sns, displayContent, 'body'))}>
              본문 복사
            </button>
          </>
        )}
      </div>

      {message && <p className="copy-message">{message}</p>}

      {displayContent?.keywords?.length > 0 && (
        <div className="link-row">
          <span className="link-label">검색어</span>
          <span className="link-value" title={displayContent.keywords.join(', ')}>
            {displayContent.keywords.join(', ')}
          </span>
          <button
            type="button"
            className="small-btn"
            onClick={() => copy(displayContent.keywords.join(', '), '검색어가 복사되었습니다')}
          >
            검색어 복사
          </button>
        </div>
      )}

      <div className="link-row">
        <span className="link-label">홍보 링크</span>
        <span className="link-value" title={utmUrl}>
          {utmUrl}
        </span>
        <button type="button" className="small-btn" onClick={() => copy(utmUrl, '링크가 복사되었습니다')}>
          링크 복사
        </button>
      </div>

      <label className="complete-toggle">
        <input type="checkbox" checked={!!completed} onChange={onToggleComplete} /> 홍보 완료
      </label>
    </div>
  );
}
