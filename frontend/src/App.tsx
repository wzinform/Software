
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate,useLocation ,Navigate } from 'react-router-dom';
import MainPage from './pages/main';
import AdminPage from './pages/AdminPage';  // 新加的管理员页面
import LoginRegister from './pages/LoginRegister';
import Price from './pages/Price';
import AIcenter from './pages/AIcenter';
import DataCenter from './pages/DataCenter';
import UnderwaterSystem from './pages/UnderWater';
import UserProfilePage from './pages/UserProfilePage';
import MainFarmer from './pages/mainFarmer'
;

function getFormattedTime(): string {
  const date = new Date();
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const Y = date.getFullYear();
  const M = date.getMonth() + 1;
  const D = date.getDate();
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const week = weekDays[date.getDay()];
  return `${Y}年${M}月${D}日 ${week} ${h}:${m}:${s}`;
}

const userPermission = Number(localStorage.getItem('role')) || 1;

console.log(userPermission)

const navItems = [
  { label: '主要信息', path: '/MainPage', permission: [1, 2, 3] },
  { label: '水下系统', path: '/UnderWater', permission: [1, 2, 3] },
  { label: '数据中心', path: '/DataCenter', permission: [2, 3] },
  { label: '智能中心', path: '/AICenter', permission: [2, 3] },
  { label: '管理员管理页面', path: '/admin', permission: [3] },  // 仅管理员3能看
  { label: '今日价格', path: '/Price', permission: [1, 2] },
];


// 单独写一个带跳转按钮的布局组件
function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(getFormattedTime());
  const [activeIndex, setActiveIndex] = useState(0);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{ 
      backgroundColor: '#0a192f', 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'Roboto, sans-serif'
    }}>
      
        {/* 系统标题 */}
  <div style={{
    textAlign: 'center',
    marginBottom: '2rem',
    position: 'relative'
  }}>
    <h1 style={{
      color: '#64ffda',
      fontSize: '2.5rem',
      fontWeight: '700',
      textShadow: '0 0 15px rgba(100,255,218,0.5)',
      letterSpacing: '2px'
    }}>
      海洋牧场监控系统
      <div style={{
        position: 'absolute',
        bottom: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120px',
        height: '3px',
        background: 'linear-gradient(90deg, transparent, #64ffda, transparent)'
      }}/>
    </h1>

  <button
  style={{
    position: 'absolute',
    right: '2rem',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '0.75rem 1.5rem',
    fontSize: '1.1rem',
    backgroundColor: 'transparent',
    border: '2px solid #64ffda',
    borderRadius: '10px',
    color: '#64ffda',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }}
  onMouseOver={e => e.currentTarget.style.backgroundColor = '#64ffda'}
  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
  onClick={() => navigate('/UserProfile')}
>
  个人中心
</button>

  </div>

  {!isLoginPage && (
    <>
      {/* 导航栏 */}
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(10, 25, 47, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '1rem 2rem',
    borderRadius: '12px',
    margin: '2rem auto',
    maxWidth: '1200px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
    border: '1px solid rgba(100,255,218,0.15)'
  }}>
        {/* 左侧导航项 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
        {navItems.map((item, index) => {
  if (!item.permission.includes(userPermission)) {
    return null; // 权限不符不显示
  }
  return (
    <button
      key={item.label}
      onClick={() => {
        setActiveIndex(index);
        navigate(item.path);
      }}
      style={{
        background: 'rgba(100,255,218,0.05)',
        border: '1px solid rgba(100,255,218,0.2)',
        color: '#ccd6f6',
        padding: '0.8rem 1.5rem',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1rem',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(100,255,218,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(100,255,218,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: '2px',
          background: '#64ffda',
          transform: activeIndex === index ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 0.3s ease',
        }}
      />
            {/* 图标系统 */}
            <svg 
  width="20" 
  height="20" 
  viewBox="0 0 24 24"
  fill="none" 
  stroke="#64ffda" 
  strokeWidth="2"
>
  {index === 0 && <path d="M3 12h18M12 3v18"/>}
  {index === 1 && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
  {index === 2 && <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>}
  {index === 3 && (
    // 使用分组标签包裹多个元素
    <g>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.51-1H11a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1 1.51 1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V12"/>
    </g>
  )}
  {index === 4 && <path d="M12 2L3 7v7c0 5 3 7 9 7s9-2 9-7V7l-9-5zM12 12v5" />}
  {index === 5 && (
  <>
    <circle cx="12" cy="12" r="10" fill="#FFD700" />
    <text x="12" y="16" fontSize="12" fill="#000" textAnchor="middle" fontWeight="bold">$</text>
  </>
)}
</svg>
      {item.label}
    </button>
  );
})}

</div>


        {/* 右侧时间显示 */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      color: '#64ffda',
      background: 'rgba(100,255,218,0.1)',
      padding: '0.8rem 1.5rem',
      borderRadius: '8px',
      border: '1px solid rgba(100,255,218,0.2)'
    }}>
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#64ffda" 
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <div style={{
        fontSize: '1.1rem',
        fontWeight: '500',
        textShadow: '0 0 8px rgba(100,255,218,0.3)'
      }}>
        {currentTime}
      </div>
    </div>
  </div>
  </>
    )}

      {/* 页面内容区域 */}
      <Routes>
       <Route path="/MainPage" element={<MainPage />} />
       <Route path="/MainFarmer" element={<MainFarmer />} />
       <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/Price" element={<Price />} />
        <Route path="/AICenter" element={<AIcenter />} />
        <Route path="/DataCenter" element={<DataCenter />} />
        <Route path="/UnderWater" element={<UnderwaterSystem />} />
        <Route path="/UserProfile" element={<UserProfilePage />} />

      </Routes>
    </div>

  );
}

// App 根组件需要包裹 Router
function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
