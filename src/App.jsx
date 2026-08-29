import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Plan30Days from './pages/Plan30Days.jsx';
import TodayPromotion from './pages/TodayPromotion.jsx';
import Settings from './pages/Settings.jsx';
import { loadData, saveData, getDefaultData } from './utils/storage.js';
import { generateMonthlySchedule, pickWeightedCountry } from './utils/scheduleGenerator.js';
import { generateTopicsForSchedule, changeTopicForSlot, changeCountryForSlot } from './utils/topicGenerator.js';
import { COUNTRIES } from './config/countries.js';

// 국가 표시명(nameEn, 예: "Taiwan")으로부터 country code("taiwan")를 찾기 위한 조회용
const COUNTRY_CODE_BY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.nameEn, c.code]));

function todayISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  // STEP 5: 시작일이 비어있으면 계획을 생성하는 오늘 날짜를 기본 시작일로 저장한다
  const generateSchedule = () => {
    setData((prev) => {
      const enabledCountries = Object.keys(prev.countries).filter((code) => prev.countries[code]);
      const enabledSocials = Object.keys(prev.snsChannels).filter((name) => prev.snsChannels[name]);
      const schedule = generateMonthlySchedule({ enabledCountries, enabledSocials, days: 30 });
      const scheduleWithTopics = generateTopicsForSchedule(schedule);
      return {
        ...prev,
        monthlySchedule: scheduleWithTopics,
        startDate: prev.startDate || todayISODate(),
      };
    });
  };

  // STEP 4/5: 국가/언어는 그대로 두고 주제만 전체 다시 배정
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

  // STEP 5: 특정 날짜의 특정 SNS 슬롯의 국가를 변경 (SNS는 그대로, 언어/주제는 새 국가에 맞게 자동 갱신)
  const changeCountry = (day, sns, newCountryCode) => {
    setData((prev) => {
      if (!prev.monthlySchedule) return prev;
      return { ...prev, monthlySchedule: changeCountryForSlot(prev.monthlySchedule, day, sns, newCountryCode) };
    });
  };

  // STEP 5: 특정 날짜 하나만 (활성 SNS 전체) 국가+언어+주제를 다시 배정. 다른 날짜는 건드리지 않는다.
  const regenerateDay = (day) => {
    setData((prev) => {
      if (!prev.monthlySchedule) return prev;
      const enabledCountries = Object.keys(prev.countries).filter((code) => prev.countries[code]);
      const enabledSocials = Object.keys(prev.snsChannels).filter((name) => prev.snsChannels[name]);
      if (enabledCountries.length === 0 || enabledSocials.length === 0) return prev;

      const dayIndex = day - 1;
      let schedule = prev.monthlySchedule;

      enabledSocials.forEach((sns) => {
        const avoidCodes = [];
        const prevCountry = schedule[dayIndex - 1]?.socials?.[sns]?.country;
        const nextCountry = schedule[dayIndex + 1]?.socials?.[sns]?.country;
        if (prevCountry && COUNTRY_CODE_BY_NAME[prevCountry]) avoidCodes.push(COUNTRY_CODE_BY_NAME[prevCountry]);
        if (nextCountry && COUNTRY_CODE_BY_NAME[nextCountry]) avoidCodes.push(COUNTRY_CODE_BY_NAME[nextCountry]);

        const newCountryCode = pickWeightedCountry(enabledCountries, sns, avoidCodes);
        schedule = changeCountryForSlot(schedule, day, sns, newCountryCode);
      });

      return { ...prev, monthlySchedule: schedule };
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
            changeCountry={changeCountry}
            regenerateDay={regenerateDay}
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
