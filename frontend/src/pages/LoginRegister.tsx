import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import './LoginRegister.css';

const API_BASE = 'http://localhost:5000/api';

export default function LoginRegister() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const endpoint = isLogin ? 'login' : 'register';
      console.log('提交数据:', formData);
  
      const res = await axios.post(`${API_BASE}/${endpoint}`, formData);
      alert(res.data.message);
  
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        // 登录成功，保存用户信息
        localStorage.setItem('user', JSON.stringify(res.data.user));
  
        // 将字符串角色转换为数字并保存
        const roleMap: Record<string, number> = {
          user: 1,
          farmer: 2,
          admin: 3,
        };
        const roleString = res.data.user?.role || formData.role;
        const roleNumber = roleMap[roleString];
        localStorage.setItem('role', roleNumber.toString());
  
        if(roleNumber==2){
            navigate('/MainFarmer');
        window.location.href = '/MainFarmer';

        }else{
          navigate('/MainPage');
        window.location.href = '/MainPage';

        }
        // 跳转页面
        
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '出错了');
    }
  };
  

  return (
    <div className="form-container">
      <h2 className="form-title">{isLogin ? '登录' : '注册'}</h2>

      <div className="form-group">
        <input
          className="input-field"
          name="username"
          placeholder="用户名"
          value={formData.username}
          onChange={handleChange}
          autoComplete="username"
        />
      </div>

      {!isLogin && (
        <div className="form-group">
          <input
            className="input-field"
            name="email"
            type="email"
            placeholder="邮箱"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>
      )}

      <div className="form-group password-group">
        <input
          className="input-field"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="密码"
          value={formData.password}
          onChange={handleChange}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? '隐藏密码' : '显示密码'}
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      </div>

      <div className="form-group">
      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        className="input-field"
        >
        <option value="user">普通用户</option>
        <option value="farmer">养殖户</option>
        <option value="admin">管理人员</option>
        </select>

      </div>

      <button className="query-button" onClick={handleSubmit}>
        {isLogin ? '登录' : '注册'}
      </button>

      <div className="toggle-text">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="toggle-button"
        >
          {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
        </button>
      </div>
    </div>
  );
}
