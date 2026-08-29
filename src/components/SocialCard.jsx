import { useEffect, useState } from 'react';
import { SOCIAL_CONFIG } from '../config/socialConfig.js';
import { getSampleContent, buildCopyText } from '../utils/sampleContent.js';

// STEP 6: SNS 하나(오늘의 홍보 카드)를 표시하는 공통 컴포넌트.
// 국가/언어/주제 표시 + 플랫폼별 복사 버튼 구조 + 홍보 완료 체크를 담당한다.
export default function SocialCard({ sns, countryLabel, language, topic, completed, serviceInfo, onToggleComplete }) {
  const [message, setMessage] = useState('');
  const config = SOCIAL_CONFIG[sns] || { copyMode: 'full', titleSeparate: false };
  const content = getSampleContent(sns, topic, serviceInfo);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 1500);
    return () => clearTimeout(timer);
  }, [message]);

  const copy = async (text) => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setMessage('복사되었습니다');
    } catch {
      setMessage('복사에 실패했습니다.');
    }
  };

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

      <div className="copy-actions">
        {config.copyMode === 'full' && (
          <button type="button" onClick={() => copy(buildCopyText(sns, content, 'full'))}>
            전체 복사
          </button>
        )}
        {config.copyMode === 'caption' && (
          <button type="button" onClick={() => copy(buildCopyText(sns, content, 'caption'))}>
            캡션 전체 복사
          </button>
        )}
        {config.copyMode === 'separate' && (
          <>
            <button type="button" onClick={() => copy(buildCopyText(sns, content, 'title'))}>
              제목 복사
            </button>
            <button type="button" onClick={() => copy(buildCopyText(sns, content, 'body'))}>
              본문 복사
            </button>
          </>
        )}
      </div>

      {message && <p className="copy-message">{message}</p>}

      <label className="complete-toggle">
        <input type="checkbox" checked={!!completed} onChange={onToggleComplete} /> 홍보 완료
      </label>
    </div>
  );
}
