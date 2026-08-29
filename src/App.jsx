import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Plan30Days from './pages/Plan30Days.jsx';
import TodayPromotion from './pages/TodayPromotion.jsx';
import Settings from './pages/Settings.jsx';
import { loadData, saveData, getDefaultData } from './utils/storage.js';

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

  return (
    <div className="app">
      <Navbar current={page} onNavigate={setPage} />
      <main>
        {page === 'dashboard' && <Dashboard data={data} />}
        {page === 'plan' && <Plan30Days data={data} updateDay={updateDay} />}
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
