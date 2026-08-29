export default function Plan30Days({ data, updateDay, generateSchedule }) {
  const { plan, serviceInfo, countries, snsChannels, monthlySchedule } = data;

  const enabledCountryCount = Object.values(countries).filter(Boolean).length;
  const enabledSnsCount = Object.values(snsChannels).filter(Boolean).length;
  const canGenerate = enabledCountryCount > 0 && enabledSnsCount > 0;

  return (
    <div>
      <h1>30일 계획</h1>

      {/* STEP 3: SNS별 국가 자동 배정 */}
      <div className="card">
        <h2>SNS별 국가 자동 배정</h2>
        {!canGenerate && (
          <p style={{ color: '#b91c1c', fontSize: 14 }}>
            설정 화면에서 홍보 국가와 SNS를 최소 1개 이상 켜주세요.
          </p>
        )}
        <button type="button" disabled={!canGenerate} onClick={generateSchedule}>
          {monthlySchedule ? '30일 다시 만들기' : '30일 계획 만들기'}
        </button>

        {monthlySchedule && (
          <div style={{ marginTop: 12 }}>
            {monthlySchedule.map((d) => (
              <div key={d.day} className="schedule-day">
                <h3>DAY {String(d.day).padStart(2, '0')}</h3>
                {Object.entries(d.socials).map(([sns, info]) => (
                  <p key={sns}>
                    <strong>{sns}</strong>
                    <br />
                    {info.country}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

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
