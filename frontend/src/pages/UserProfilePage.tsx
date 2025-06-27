import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';

import './UserProfilePage.css';

Modal.setAppElement('#root');
const API_BASE = 'http://localhost:5000/api';

type User = {
  username: string;
  email: string;
  password: string;
};

const modalStyle = {
  content: {
    backgroundColor: '#112240',
    color: '#ccd6f6',
    padding: '2rem',
    maxWidth: '420px',
    margin: 'auto',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(100,255,218,0.5)',
  },
};

const inputStyle = {
  width: '100%',
  marginBottom: '1rem',
  padding: '0.6rem',
  borderRadius: '6px',
  border: '1.5px solid #64ffda',
  backgroundColor: '#0a192f',
  color: '#64ffda',
  fontSize: '1rem',
};

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [formData, setFormData] = useState<Partial<User>>({});
  const [passwordInput, setPasswordInput] = useState('');

  // ✅ 加载用户信息
useEffect(() => {
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('未登录或token缺失');
        return;
      }else{
        console.log('token:',token)
      }

      const res = await axios.get(`${API_BASE}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('接口返回数据:', res.data);

      setUser(res.data.user);
    } catch (err) {
      console.error('获取用户信息失败', err);
    }
  };

  fetchUserInfo();
}, []);


  // ✅ 验证密码
  const handleVerify = () => {
    if (passwordInput === 'myRealPassword123') { // 实际项目中不要前端比对密码
      setShowVerifyModal(false);
      setPasswordInput('');
      if (user) {
        setFormData({ username: user.username, email: user.email });
      }
      setShowEditModal(true);
    } else {
      alert('密码错误');
    }
  };

  // ✅ 更新信息（可拓展为后端 PUT /api/user/info）
  const handleUpdate = () => {
    if (user) {
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      setShowEditModal(false);
      alert('信息已更新');
    }
  };

  // ✅ 登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <p className="text-white mt-10 text-center">加载中...</p>;

    
  return (
    <div className="form-container max-w-sm mx-auto mt-10 p-8 bg-[#1e293b] rounded-2xl shadow-lg text-white">

  <div className="form-group mb-6">
    <label className="block text-sm font-semibold mb-1">用户名</label>
    <p className="input-field bg-transparent border border-[#64ffda] rounded-md p-3 text-[#64ffda] font-semibold">{user.username}</p>
  </div>

  <div className="form-group mb-6">
    <label className="block text-sm font-semibold mb-1">邮箱</label>
    <p className="input-field bg-transparent border border-[#64ffda] rounded-md p-3 text-[#64ffda] font-semibold">{user.email}</p>
  </div>

  <div className="form-group mb-6">
    <label className="block text-sm font-semibold mb-1">密码</label>
    <p className="input-field bg-transparent border border-[#64ffda] rounded-md p-3 text-[#64ffda] font-semibold">********</p>
  </div>
      
        <div
          className="flex justify-center mt-6"
          style={{ gap: '16px', maxWidth: '450px', margin: '0 auto' }}
        >
          <button className="query-button-profile" onClick={() => setShowLogoutModal(true)}>退出登录</button>
          <button className="query-button-profile" onClick={() => setShowVerifyModal(true)}>修改信息</button>
        </div>


      {/* 验证身份模态框 */}
<Modal
  isOpen={showVerifyModal}
  onRequestClose={() => setShowVerifyModal(false)}
  style={{
    ...modalStyle,
    content: {
      ...modalStyle.content,
      padding: '1rem 1.5rem',
      height:'250px',
      maxHeight: '220px',
      overflow: 'hidden',
    }
  }}
>
  <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.8rem' }}>身份验证</h3>
  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>请输入密码：</label>
  <input
    type="password"
    value={passwordInput}
    onChange={(e) => setPasswordInput(e.target.value)}
    style={{
      ...inputStyle,
      fontSize: '0.9rem',
      padding: '6px 8px',
      margin: '0.3rem 0 1rem 0',
      height: '30px',
    }}
  />
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
    <button
      style={{ ...buttonStyleOutline, padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
      onClick={() => setShowVerifyModal(false)}
      onMouseEnter={(e) => hoverButtonIn(e)}
      onMouseLeave={(e) => hoverButtonOut(e)}
    >
      取消
    </button>
    <button
      style={{ ...buttonStyleSolid, padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
      onClick={handleVerify}
    >
      确认
    </button>
  </div>
</Modal>

{/* 编辑信息模态框 */}
<Modal
  isOpen={showEditModal}
  onRequestClose={() => setShowEditModal(false)}
  style={{
    ...modalStyle,
    content: {
      ...modalStyle.content,
      padding: '1rem 1.5rem',
      height:'200px',
      maxHeight: '320px',
      overflowY: 'auto', // 因为内容多，允许纵向滚动
    }
  }}
>
  <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.8rem' }}>编辑信息</h3>

  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>用户名：</label>
  <input
    type="text"
    value={formData.username || ''}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
    style={{
      ...inputStyle,
      fontSize: '0.9rem',
      padding: '6px 8px',
      marginBottom: '0.8rem',
      height: '30px',
    }}
  />

  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>邮箱：</label>
  <input
    type="email"
    value={formData.email || ''}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
    style={{
      ...inputStyle,
      fontSize: '0.9rem',
      padding: '6px 8px',
      marginBottom: '1rem',
      height: '30px',
    }}
  />

  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
    <button
      style={{ ...buttonStyleOutline, padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
      onClick={() => setShowEditModal(false)}
      onMouseEnter={(e) => hoverButtonIn(e)}
      onMouseLeave={(e) => hoverButtonOut(e)}
    >
      取消
    </button>
    <button
      style={{ ...buttonStyleSolid, padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
      onClick={handleUpdate}
    >
      保存修改
    </button>
  </div>
</Modal>


      {/* 退出确认模态框 */}
      <Modal
  isOpen={showLogoutModal}
  onRequestClose={() => setShowLogoutModal(false)}
  style={{
    ...modalStyle,
    content: {
      ...modalStyle.content,
      padding: '1rem 1.5rem',    // 缩小内边距
      height: '200px',           // 自动高度
      overflow: 'hidden',       // 隐藏溢出内容，避免太高
    }
  }}
>
  <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.8rem' }}>确认退出</h3>
  <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>你确定要退出登录吗？</p>
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
    <button
      style={{ ...buttonStyleOutline, padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
      onClick={() => setShowLogoutModal(false)}
      onMouseEnter={(e) => hoverButtonIn(e)}
      onMouseLeave={(e) => hoverButtonOut(e)}
    >
      取消
    </button>
    <button
      style={{ ...buttonStyleSolid, padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
      onClick={handleLogout}
    >
      确定
    </button>
  </div>
</Modal>

    </div>
  );
};

// 通用按钮样式
const buttonStyleOutline: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#64ffda',
  border: '1.5px solid #64ffda',
  fontWeight: 600,
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const buttonStyleSolid: React.CSSProperties = {
  backgroundColor: '#64ffda',
  border: 'none',
  borderRadius: '6px',
  padding: '0.5rem 1.2rem',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '1rem',
  color: '#0a192f',
  transition: 'all 0.3s ease',
};

function hoverButtonIn(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.backgroundColor = '#64ffda';
  e.currentTarget.style.color = '#0a192f';
}
function hoverButtonOut(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.backgroundColor = 'transparent';
  e.currentTarget.style.color = '#64ffda';
}

export default UserProfilePage;
