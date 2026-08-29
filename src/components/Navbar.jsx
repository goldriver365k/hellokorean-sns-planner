const PAGES = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'plan', label: '30일 계획' },
  { key: 'today', label: '오늘의 홍보' },
  { key: 'settings', label: '설정' },
];

export default function Navbar({ current, onNavigate }) {
  return (
    <nav className="navbar">
      <span className="brand">HelloKorean SNS Planner</span>
      {PAGES.map((p) => (
        <button
          key={p.key}
          className={current === p.key ? 'active' : ''}
          onClick={() => onNavigate(p.key)}
        >
          {p.label}
        </button>
      ))}
    </nav>
  );
}
