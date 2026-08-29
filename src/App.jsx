import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Plan30Days from './pages/Plan30Days.jsx';
import TodayPromotion from './pages/TodayPromotion.jsx';
import Settings from './pages/Settings.jsx';
import { loadData, saveData, getDefaultData } from './utils/storage.js';
import { generateMonthlySchedule } from './utils/scheduleGenerator.js';
import { generateTopicsForSchedule, changeTopicForSlot } from './utils/topicGenerator.js';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState(loadData);

  // 데이터가 바뀔 때마다 LocalStorage에 저장
  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateDay = (day, patch) => {
    setData((prev) => ({
      ...prev,
      plan: prev.plan.map((item) => (item.day === day ? { ...item, ...patch } : item)),
    }));
  };

  const updateServiceInfo = (patch) => {
    setData((prev) => ({
      ...prev,
      serviceInfo: { ...prev.serviceInfo, ...patch },
    }));
  };

  const updateStartDate = (value) => {
    setData((prev) => ({ ...prev, startDate: value }));
  };

  // STEP 2: 홍보 국가 ON/OFF
  const updateCountry = (code, enabled) => {
    setData((prev) => ({
      ...prev,
      countries: { ...prev.countries, [code]: enabled },
    }));
  };

  // STEP 2: 사용 SNS ON/OFF
  const updateSnsChannel = (name, enabled) => {
    setData((prev) => ({
      ...prev,
      snsChannels: { ...prev.snsChannels, [name]: enabled },
    }));
  };

  const resetAll = () => {
    const def = getDefaultData();
    setData(def);
  };

  // STEP 3: SNS별 30일 국가 자동 배정 생성 (버튼을 눌렀을 때만 새로 생성/덮어쓰기)
  // STEP 4: 국가 배정 직후, 그 위에 주제(topic)도 함께 배정한다 (국가 배정 로직 자체는 그대로 사용)
  const generateSchedule = () => {
    setData((prev) => {
      const enabledCountries = Object.keys(prev.countries).filter((code) => prev.countries[code]);
      const enabledSocials = Object.keys(prev.snsChannels).filter((name) => prev.snsChannels[name]);
      const schedule = generateMonthlySchedule({ enabledCountries, enabledSocials, days: 30 });
      const scheduleWithTopics = generateTopicsForSchedule(schedule);
      return { ...prev, monthlySchedule: scheduleWithTopics };
    });
  };

  // STEP 4: 국가/언어는 그대로 두고 주제만 전체 다시 배정
  const regenerateTopics = () => {
    setData((prev) => {
      if (!prev.monthlySchedule) return prev;
      return { ...prev, monthlySchedule: generateTopicsForSchedule(prev.monthlySchedule) };
    });
  };

  // STEP 4: 특정 날짜의 특정 SNS 슬롯만 다른 주제로 변경
  const changeTopic = (day, sns) => {
    setData((prev) => {
      if (!prev.monthlySchedule) return prev;
      return { ...prev, monthlySchedule: changeTopicForSlot(prev.monthlySchedule, day, sns) };
    });
  };

  return (
    <div className="app">
      <Navbar current={page} onNavigate={setPage} />
      <main>
        {page === 'dashboard' && <Dashboard data={data} />}
        {page === 'plan' && (
          <Plan30Days
            data={data}
            updateDay={updateDay}
            generateSchedule={generateSchedule}
            regenerateTopics={regenerateTopics}
            changeTopic={changeTopic}
          />
        )}
        {page === 'today' && <TodayPromotion data={data} updateDay={updateDay} />}
        {page === 'settings' && (
          <Settings
            data={data}
            updateServiceInfo={updateServiceInfo}
            updateStartDate={updateStartDate}
            updateCountry={updateCountry}
            updateSnsChannel={updateSnsChannel}
            resetAll={resetAll}
          />
        )}
      </main>
    </div>
  );
}
