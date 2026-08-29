export default function Plan30Days({ data, updateDay }) {
  const { plan, serviceInfo } = data;

  return (
    <div>
      <h1>30일 계획</h1>
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
