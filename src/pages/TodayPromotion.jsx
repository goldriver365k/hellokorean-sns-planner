import { useState } from 'react';
import { getTodayDayNumber, getRawDayOffset, getDateForDay, formatDisplayDate } from '../utils/storage.js';
import { COUNTRIES } from '../config/countries.js';
import SocialCard from '../components/SocialCard.jsx';

function clampDay(n) {
  return Math.min(30, Math.max(1, n));
}

function toIsoDateInput(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TodayPromotion({ data, updateDay, toggleCompletion, onNavigateToPlan }) {
  const { plan, serviceInfo, startDate, monthlySchedule, snsChannels } = data;

  // STEP 6: 오늘 날짜에 해당하는 DAY 자동 선택 (계획 범위를 벗어나면 1 또는 30으로 시작)
  const rawOffset = getRawDayOffset(startDate);
  const [selectedDay, setSelectedDay] = useState(() => clampDay(rawOffset ?? 1));

  const enabledSnsNames = Object.keys(snsChannels).filter((name) => snsChannels[name]);
  const selectedDayObj = monthlySchedule ? monthlySchedule.find((d) => d.day === selectedDay) : null;
  const selectedDate = getDateForDay(startDate, selectedDay);

  const socialEntries = selectedDayObj
    ? Object.entries(selectedDayObj.socials).filter(([sns]) => enabledSnsNames.includes(sns))
    : [];
  const completedCount = socialEntries.filter(([, slot]) => slot.completed).length;

  const handleDateInputChange = (e) => {
    if (!e.target.value || !startDate) return;
    const chosen = new Date(e.target.value);
    const start = new Date(startDate);
    chosen.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diff = Math.round((chosen - start) / (1000 * 60 * 60 * 24)) + 1;
    setSelectedDay(clampDay(diff));
  };

  // STEP 1의 "오늘의 홍보" 입력 화면(채널/내용 직접 입력)에서 쓰던 항목 — 그대로 유지
  const todayDay = getTodayDayNumber(startDate);
  const todayItem = plan.find((d) => d.day === todayDay);

  return (
    <div>
      <h1>오늘의 홍보</h1>

      {!monthlySchedule && (
        <div className="card">
          <p>아직 30일 계획이 없습니다. 먼저 30일 계획을 만들어 주세요.</p>
          <button type="button" onClick={onNavigateToPlan}>
            30일 계획 보기
          </button>
        </div>
      )}

      {monthlySchedule && (
        <>
          <div className="card">
            {selectedDate && <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{formatDisplayDate(selectedDate)}</p>}
            <p style={{ margin: '4px 0 0' }}>
              오늘 예정 게시물: {socialEntries.length}개 · 완료: {completedCount}개 · 남음:{' '}
              {socialEntries.length - completedCount}개
            </p>
          </div>

          {rawOffset !== null && rawOffset < 1 && (
            <div className="card">
              <p>홍보 계획이 아직 시작되지 않았습니다.</p>
              <button type="button" onClick={onNavigateToPlan}>
                30일 계획 보기
              </button>
            </div>
          )}
          {rawOffset !== null && rawOffset > 30 && (
            <div className="card">
              <p>현재 30일 홍보 계획이 종료되었습니다.</p>
              <button type="button" onClick={onNavigateToPlan}>
                30일 계획 보기
              </button>
            </div>
          )}

          <div className="day-nav">
            <button type="button" disabled={selectedDay <= 1} onClick={() => setSelectedDay((d) => clampDay(d - 1))}>
              ← 이전
            </button>
            <strong>DAY {String(selectedDay).padStart(2, '0')}</strong>
            <button type="button" disabled={selectedDay >= 30} onClick={() => setSelectedDay((d) => clampDay(d + 1))}>
              다음 →
            </button>
            <label className="visually-hidden" htmlFor="today-date-picker">
              날짜 직접 선택
            </label>
            <input
              id="today-date-picker"
              type="date"
              aria-label="날짜 직접 선택"
              value={toIsoDateInput(selectedDate)}
              onChange={handleDateInputChange}
              disabled={!startDate}
            />
          </div>

          {selectedDayObj && (
            <div className="day-grid">
              {socialEntries.map(([sns, slot]) => {
                const countryDef = COUNTRIES.find((c) => c.nameEn === slot.country);
                return (
                  <SocialCard
                    key={sns}
                    sns={sns}
                    countryLabel={countryDef ? countryDef.nameKo : slot.country}
                    language={slot.language}
                    topic={slot.topic}
                    completed={slot.completed}
                    serviceInfo={serviceInfo}
                    onToggleComplete={() => toggleCompletion(selectedDay, sns)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <h2>홍보 내용 입력</h2>
      <div className="card">
        <label htmlFor="today-channel">채널</label>
        <select
          id="today-channel"
          value={todayItem.channel}
          onChange={(e) => updateDay(todayItem.day, { channel: e.target.value })}
        >
          <option value="">선택</option>
          {serviceInfo.channels.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label htmlFor="today-content">홍보 내용</label>
        <textarea
          id="today-content"
          rows={5}
          value={todayItem.content}
          placeholder={`예: ${serviceInfo.coreMessageKo} - ${serviceInfo.url}`}
          onChange={(e) => updateDay(todayItem.day, { content: e.target.value })}
        />

        <label>
          <input
            type="checkbox"
            checked={todayItem.done}
            onChange={(e) => updateDay(todayItem.day, { done: e.target.checked })}
          />{' '}
          오늘 게시 완료
        </label>
      </div>

      <p style={{ color: '#666', fontSize: 14 }}>
        ※ 이 화면은 게시 내용을 정리하는 용도입니다. 실제 SNS 게시는 직접 진행해 주세요. (자동 게시 기능 없음)
      </p>
    </div>
  );
}
