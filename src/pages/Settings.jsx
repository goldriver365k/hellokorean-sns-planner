import { useState } from 'react';
import { getDefaultData, SNS_CHANNELS } from '../utils/storage.js';
import { COUNTRIES } from '../config/countries.js';

export default function Settings({
  data,
  updateServiceInfo,
  updateStartDate,
  updateCountry,
  updateSnsChannel,
  resetAll,
}) {
  const { serviceInfo, startDate, countries, snsChannels } = data;
  const [channelsText, setChannelsText] = useState(serviceInfo.channels.join(', '));

  const handleChannelsBlur = () => {
    const list = channelsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    updateServiceInfo({ channels: list });
  };

  const handleReset = () => {
    if (window.confirm('모든 데이터를 초기값으로 되돌릴까요? (30일 계획 입력 내용이 사라집니다)')) {
      resetAll();
      setChannelsText(getDefaultData().serviceInfo.channels.join(', '));
    }
  };

  return (
    <div>
      <h1>설정</h1>

      <div className="card">
        <h2>서비스 기본 정보</h2>

        <label htmlFor="s-name">서비스명</label>
        <input
          id="s-name"
          type="text"
          value={serviceInfo.name}
          onChange={(e) => updateServiceInfo({ name: e.target.value })}
        />

        <label htmlFor="s-url">사이트 URL</label>
        <input
          id="s-url"
          type="url"
          value={serviceInfo.url}
          onChange={(e) => updateServiceInfo({ url: e.target.value })}
        />

        <label htmlFor="s-msg-ko">핵심 메시지 (한글)</label>
        <input
          id="s-msg-ko"
          type="text"
          value={serviceInfo.coreMessageKo}
          onChange={(e) => updateServiceInfo({ coreMessageKo: e.target.value })}
        />

        <label htmlFor="s-msg-en">핵심 메시지 (영문)</label>
        <input
          id="s-msg-en"
          type="text"
          value={serviceInfo.coreMessageEn}
          onChange={(e) => updateServiceInfo({ coreMessageEn: e.target.value })}
        />

        <label htmlFor="s-channels">홍보 채널 (쉼표로 구분)</label>
        <input
          id="s-channels"
          type="text"
          value={channelsText}
          onChange={(e) => setChannelsText(e.target.value)}
          onBlur={handleChannelsBlur}
        />
      </div>

      <div className="card">
        <h2>홍보 국가</h2>
        {COUNTRIES.map((c) => (
          <div className="toggle-row" key={c.code}>
            <span>{c.nameKo}</span>
            <button
              type="button"
              className={countries[c.code] ? 'toggle-on' : 'toggle-off'}
              onClick={() => updateCountry(c.code, !countries[c.code])}
            >
              {countries[c.code] ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>사용 SNS</h2>
        {SNS_CHANNELS.map((name) => (
          <div className="toggle-row" key={name}>
            <span>{name}</span>
            <button
              type="button"
              className={snsChannels[name] ? 'toggle-on' : 'toggle-off'}
              onClick={() => updateSnsChannel(name, !snsChannels[name])}
            >
              {snsChannels[name] ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>30일 계획 시작일</h2>
        <label htmlFor="s-start">시작일</label>
        <input
          id="s-start"
          type="date"
          value={startDate || ''}
          onChange={(e) => updateStartDate(e.target.value)}
        />
        <p style={{ color: '#666', fontSize: 14 }}>
          시작일을 지정하면 '오늘의 홍보' 화면이 자동으로 해당 일차를 보여줍니다.
        </p>
      </div>

      <div className="card">
        <h2>데이터 초기화</h2>
        <button onClick={handleReset}>모든 데이터 초기화</button>
      </div>
    </div>
  );
}
