import { getTodayDayNumber } from '../utils/storage.js';

export default function Dashboard({ data }) {
  const { serviceInfo, plan, startDate } = data;
  const doneCount = plan.filter((d) => d.done).length;
  const todayDay = getTodayDayNumber(startDate);

  return (
    <div>
      <h1>대시보드</h1>

      <div className="card">
        <h2>{serviceInfo.name}</h2>
        <p>
          <a href={serviceInfo.url} target="_blank" rel="noreferrer">
            {serviceInfo.url}
          </a>
        </p>
        <p>
          핵심 메시지: {serviceInfo.coreMessageKo} / {serviceInfo.coreMessageEn}
        </p>
        <p>홍보 채널: {serviceInfo.channels.join(', ')}</p>
      </div>

      <div className="card">
        <h2>진행 현황</h2>
        <p>오늘은 30일 계획 중 <strong>{todayDay}일차</strong> 입니다.</p>
        <p>
          완료한 게시물: <strong>{doneCount}</strong> / 30
        </p>
      </div>
    </div>
  );
}
