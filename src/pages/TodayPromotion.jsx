import { getTodayDayNumber } from '../utils/storage.js';

export default function TodayPromotion({ data, updateDay }) {
  const { plan, serviceInfo, startDate } = data;
  const todayDay = getTodayDayNumber(startDate);
  const todayItem = plan.find((d) => d.day === todayDay);

  return (
    <div>
      <h1>오늘의 홍보</h1>
      <p>
        오늘은 30일 계획 중 <strong>{todayDay}일차</strong> 입니다.
      </p>

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
