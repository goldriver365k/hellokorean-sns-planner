import { COUNTRIES } from '../config/countries.js';
import { getDateForDay, formatDisplayDate } from '../utils/storage.js';

export default function Plan30Days({
  data,
  updateDay,
  generateSchedule,
  regenerateTopics,
  changeTopic,
  changeCountry,
  regenerateDay,
}) {
  const { plan, serviceInfo, countries, snsChannels, monthlySchedule, startDate } = data;

  const enabledCountryCodes = Object.keys(countries).filter((code) => countries[code]);
  const enabledSnsNames = Object.keys(snsChannels).filter((name) => snsChannels[name]);
  const canGenerate = enabledCountryCodes.length > 0 && enabledSnsNames.length > 0;

  // STEP 5: 국가 select에는 현재 ON 상태인 국가만 노출
  const enabledCountryOptions = COUNTRIES.filter((c) => countries[c.code]);

  const todayStr = formatDisplayDate(new Date());

  const handleGenerateClick = () => {
    if (monthlySchedule) {
      const ok = window.confirm('기존 30일 일정이 모두 사라집니다. 새로 만들까요?');
      if (!ok) return;
    }
    generateSchedule();
  };

  return (
    <div>
      <h1>30일 계획</h1>

      {/* STEP 5: 상단 요약 */}
      <div className="card">
        <h2>30일 홍보계획</h2>
        <p>
          활성 국가: {enabledCountryCodes.length} · 활성 SNS: {enabledSnsNames.length} · 예정 홍보:{' '}
          {enabledSnsNames.length * 30}
        </p>
        {!canGenerate && (
          <p style={{ color: '#b91c1c', fontSize: 14 }}>
            설정 화면에서 홍보 국가와 SNS를 최소 1개 이상 켜주세요.
          </p>
        )}
        <button type="button" disabled={!canGenerate} onClick={handleGenerateClick}>
          {monthlySchedule ? '30일 다시 만들기' : '30일 계획 만들기'}
        </button>{' '}
        {monthlySchedule && (
          <button type="button" onClick={regenerateTopics}>
            주제만 다시 배정
          </button>
        )}
      </div>

      {monthlySchedule && (
        <div className="day-grid">
          {monthlySchedule.map((d) => {
            const dayDate = getDateForDay(startDate, d.day);
            const dayDateStr = dayDate ? formatDisplayDate(dayDate) : '';
            const isToday = dayDateStr && dayDateStr === todayStr;

            return (
              <div key={d.day} className="schedule-day">
                <h3>
                  DAY {String(d.day).padStart(2, '0')}
                  {isToday && <span className="today-badge">오늘</span>}
                </h3>
                {dayDateStr && <p className="day-date">{dayDateStr}</p>}

                {Object.entries(d.socials)
                  .filter(([sns]) => enabledSnsNames.includes(sns))
                  .map(([sns, info]) => {
                    const countryDef = COUNTRIES.find((c) => c.nameEn === info.country);
                    return (
                      <div key={sns} className="sns-slot">
                        <strong>{sns}</strong>
                        <div>{countryDef ? countryDef.nameKo : info.country}</div>
                        <div className="slot-language">{info.language}</div>
                        <div className="slot-topic">{info.topic?.title}</div>
                        <div className="slot-actions">
                          <label className="visually-hidden" htmlFor={`country-${d.day}-${sns}`}>
                            {sns} 국가 변경
                          </label>
                          <select
                            id={`country-${d.day}-${sns}`}
                            aria-label={`${sns} 국가 변경`}
                            className="small-select"
                            value={countryDef ? countryDef.code : ''}
                            onChange={(e) => changeCountry(d.day, sns, e.target.value)}
                          >
                            {enabledCountryOptions.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.nameKo}
                              </option>
                            ))}
                          </select>
                          <button type="button" className="small-btn" onClick={() => changeTopic(d.day, sns)}>
                            주제 변경
                          </button>
                        </div>
                      </div>
                    );
                  })}

                <button type="button" className="small-btn day-regen-btn" onClick={() => regenerateDay(d.day)}>
                  이 날짜 다시 배정
                </button>
              </div>
            );
          })}
        </div>
      )}

      <h2>홍보 내용 입력</h2>
      <p>{serviceInfo.name} 홍보를 위한 30일 SNS 게시 계획표입니다. (채널/내용은 직접 입력)</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>일차</th>
              <th>채널</th>
              <th>홍보 내용</th>
              <th>완료</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((item) => (
              <tr key={item.day} className={item.done ? 'done-row' : ''}>
                <td>Day {item.day}</td>
                <td>
                  <select
                    value={item.channel}
                    onChange={(e) => updateDay(item.day, { channel: e.target.value })}
                  >
                    <option value="">선택</option>
                    {serviceInfo.channels.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={item.content}
                    placeholder="예: 무료 한국어 공부 시작하기"
                    onChange={(e) => updateDay(item.day, { content: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => updateDay(item.day, { done: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
