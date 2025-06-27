import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

const API_BASE = 'http://localhost:5000/api';

interface OperationLog {
    username: string;
    action: string;
    timestamp: string;
  }

  
const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'settings'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);

  // 控制新增用户弹窗显示
  const [showAddUser, setShowAddUser] = React.useState(false);

  const [logSearch, setLogSearch] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  

  const [newUser, setNewUser] = React.useState({
    username: '',
    email: '',
    password:'',
    role: 'user',
  });

  
  useEffect(() => {
    Modal.setAppElement('#root');
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get(`${API_BASE}/admin/users`, {
      params: { page, per_page: 5, search }
    });
    setUsers(res.data.users);
    setTotalPages(res.data.pages);
  };


  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, page, search]);

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_BASE}/admin/users/${id}`);
    fetchUsers();
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    await axios.put(`${API_BASE}/admin/users/${selectedUser.id}`, selectedUser);
    setIsEditModalOpen(false);
    fetchUsers();
  };

    const fetchLogs = async () => {
    const res = await axios.get(`${API_BASE}/admin/logs`);
    setLogs(res.data.logs);
    };

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#64ffda' : 'transparent',
    border: 'none',
    color: active ? '#0a192f' : '#64ffda',
    padding: '0.8rem 1.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '1.2rem',
    transition: 'all 0.3s ease',
  });

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#64ffda',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#0a192f',
    fontWeight: '600',
    transition: 'background-color 0.3s ease',
  };

  const inputStyle: React.CSSProperties = {
    marginBottom: '1rem',
    padding: '0.6rem',
    width: '260px',
    borderRadius: '8px',
    border: '1.5px solid #64ffda',
    backgroundColor: '#112240',
    color: '#64ffda',
    fontSize: '1rem',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#0a192f',
        color: '#ccd6f6',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* 标签切换导航 */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <button style={tabButtonStyle(activeTab === 'users')} onClick={() => setActiveTab('users')}>
          用户管理
        </button>
        <button style={tabButtonStyle(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
          操作日志
        </button>
        <button style={tabButtonStyle(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
          系统设置
        </button>
      </div>

      {/* 内容区 */}
      <div
        style={{
          backgroundColor: 'rgba(100,255,218,0.07)',
          padding: '2rem',
          borderRadius: '10px',
          minHeight: '320px',
          boxShadow: '0 0 10px rgba(100,255,218,0.3)',
        }}
      >
        {activeTab === 'users' && (
  <section>
    {/* 搜索输入 */}
    <input
      placeholder="搜索用户名/邮箱"
      value={search}
      onChange={e => setSearch(e.target.value)}
      style={inputStyle}
    />

    {/* 新增用户按钮 */}
    <div style={{ margin: '1rem 0' }}>
      <button
        onClick={() => setShowAddUser(true)}
        style={{
          ...buttonStyle,
          backgroundColor: '#64ffda',
          color: '#0a192f',
          padding: '0.5rem 1rem',
          fontWeight: '700',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#52d7b8')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#64ffda')}
      >
        增加用户
      </button>
    </div>

    {/* 用户列表表格 */}
    <table
      style={{
        width: '100%',
        color: '#ccd6f6',
        marginTop: '1rem',
        borderCollapse: 'collapse',
        textAlign: 'center',
        fontSize: '1rem',
      }}
    >
      <thead>
        <tr style={{ borderBottom: '2px solid #64ffda' }}>
          <th style={{ padding: '0.8rem' }}>ID</th>
          <th style={{ padding: '0.8rem' }}>用户名</th>
          <th style={{ padding: '0.8rem' }}>邮箱</th>
          <th style={{ padding: '0.8rem' }}>角色</th>
          <th style={{ padding: '0.8rem' }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr
            key={user.id}
            style={{
              borderBottom: '1px solid #264653',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(100,255,218,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <td style={{ padding: '0.7rem' }}>{user.id}</td>
            <td style={{ padding: '0.7rem' }}>{user.username}</td>
            <td style={{ padding: '0.7rem' }}>{user.email}</td>
            <td style={{ padding: '0.7rem' }}>{user.role}</td>
            <td style={{ padding: '0.7rem' }}>
              <button
                onClick={() => handleEdit(user)}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  color: '#64ffda',
                  marginRight: '0.8rem',
                  fontWeight: '600',
                  padding: '0.3rem 0.7rem',
                  border: '1.5px solid #64ffda',
                  borderRadius: '6px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#64ffda';
                  e.currentTarget.style.color = '#0a192f';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64ffda';
                }}
              >
                编辑
              </button>
              <button
  onClick={() => {
    if (window.confirm('确定要删除该用户吗？')) {
      handleDelete(user.id);
    }
  }}
  style={{
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: 'tomato',
    border: '1.5px solid tomato',
    padding: '0.3rem 0.7rem',
    borderRadius: '6px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.backgroundColor = 'tomato';
    e.currentTarget.style.color = '#fff';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = 'tomato';
  }}
>
  删除
</button>

            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* 分页 */}
    <div
      style={{
        marginTop: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: '#64ffda',
        fontWeight: '600',
        fontSize: '1rem',
      }}
    >
      <button
        onClick={() => setPage(p => Math.max(p - 1, 1))}
        disabled={page === 1}
        style={{
          ...buttonStyle,
          padding: '0.4rem 1rem',
          opacity: page === 1 ? 0.4 : 1,
          cursor: page === 1 ? 'not-allowed' : 'pointer',
        }}
      >
        上一页
      </button>
      <span>
        第 {page} 页 / 共 {totalPages} 页
      </span>
      <button
        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
        style={{
          ...buttonStyle,
          padding: '0.4rem 1rem',
          opacity: page === totalPages ? 0.4 : 1,
          cursor: page === totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        下一页
      </button>
    </div>
  </section>
)}


{activeTab === 'logs' && (
  <div style={{ padding: '1rem', backgroundColor: '#0a192f', color: '#ccd6f6' }}>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>操作日志</h2>
    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
      {logs.map((log, index) => (
        <li key={index} style={{ marginBottom: '0.8rem', borderBottom: '1px solid #64ffda', paddingBottom: '0.5rem' }}>
          <div style={{ fontWeight: '600' }}>{log.username}</div>
          <div>{log.action}</div>
          <div style={{ fontSize: '0.85rem', color: '#8892b0' }}>{log.timestamp}</div>
        </li>
      ))}
    </ul>
  </div>
)}


        {activeTab === 'settings' && (
          <section>
            <p style={{ fontSize: '1rem' }}>配置系统参数，例如权限控制、公告发布等。</p>
            <button
              style={{
                ...buttonStyle,
                marginTop: '1.5rem',
                fontSize: '1rem',
                padding: '0.7rem 1.8rem',
              }}
              onClick={() => alert('设置保存成功！')}
            >
              保存设置
            </button>
          </section>
        )}
      </div>

{/* 新增用户模态框 */}
<Modal
  isOpen={showAddUser}
  onRequestClose={() => setShowAddUser(false)}
  style={{
    content: {
      backgroundColor: '#112240',
      color: '#ccd6f6',
      padding: '2rem',
      maxWidth: '420px',
      margin: 'auto',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(100,255,218,0.5)',
    },
  }}
>
  <h3 style={{ fontWeight: '700', fontSize: '1.6rem', marginBottom: '1rem' }}>新增用户</h3>

  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>用户名：</label>
  <input
    value={newUser.username}
    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
    style={{
      width: '100%',
      marginBottom: '1rem',
      padding: '0.6rem',
      borderRadius: '6px',
      border: '1.5px solid #64ffda',
      backgroundColor: '#0a192f',
      color: '#64ffda',
      fontSize: '1rem',
    }}
  />

  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>邮箱：</label>
  <input
    type="email"
    value={newUser.email}
    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
    style={{
      width: '100%',
      marginBottom: '1rem',
      padding: '0.6rem',
      borderRadius: '6px',
      border: '1.5px solid #64ffda',
      backgroundColor: '#0a192f',
      color: '#64ffda',
      fontSize: '1rem',
    }}
  />

  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>密码：</label>
  <input
    type="password"
    value={newUser.password}
    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
    style={{
      width: '100%',
      marginBottom: '1rem',
      padding: '0.6rem',
      borderRadius: '6px',
      border: '1.5px solid #64ffda',
      backgroundColor: '#0a192f',
      color: '#64ffda',
      fontSize: '1rem',
    }}
  />

  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>角色：</label>
  <select
    value={newUser.role || 'user'}
    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
    style={{
      width: '100%',
      marginBottom: '1.5rem',
      padding: '0.6rem',
      borderRadius: '6px',
      border: '1.5px solid #64ffda',
      backgroundColor: '#0a192f',
      color: '#64ffda',
      fontSize: '1rem',
    }}
  >
    <option value="user">普通用户</option>
    <option value="farmer">养殖户</option>
    <option value="admin">管理员</option>
  </select>

  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
    <button
      onClick={() => setShowAddUser(false)}
      style={{
        backgroundColor: 'transparent',
        color: '#64ffda',
        border: '1.5px solid #64ffda',
        fontWeight: '600',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = '#64ffda';
        e.currentTarget.style.color = '#0a192f';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#64ffda';
      }}
    >
      取消
    </button>
    <button
      style={{
        backgroundColor: '#64ffda',
        border: 'none',
        borderRadius: '6px',
        padding: '0.5rem 1.2rem',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '1rem',
        color: '#0a192f',
        transition: 'all 0.3s ease',
      }}
      onClick={async () => {
        if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
          alert('请填写所有字段');
          return;
        }
        try {
          await axios.post(`${API_BASE}/admin/addusers`, newUser);
          alert('新增成功');
          setShowAddUser(false);
          setNewUser({ username: '', email: '', password: '', role: '' });
          fetchUsers();
        } catch (err: any) {
          alert(err.response?.data?.error || '新增用户失败');
        }
      }}
    >
      确认添加
    </button>
  </div>
</Modal>


      {/* 编辑用户模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        style={{
          content: {
            backgroundColor: '#112240',
            color: '#ccd6f6',
            padding: '2rem',
            maxWidth: '420px',
            margin: 'auto',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(100,255,218,0.5)',
          },
        }}
      >
        <h3 style={{ fontWeight: '700', fontSize: '1.6rem', marginBottom: '1rem' }}>编辑用户</h3>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>用户名：</label>
        <input
          value={selectedUser?.username || ''}
          onChange={e => setSelectedUser({ ...selectedUser, username: e.target.value })}
          style={{ width: '100%', marginBottom: '1rem', padding: '0.6rem', borderRadius: '6px', border: '1.5px solid #64ffda', backgroundColor: '#0a192f', color: '#64ffda', fontSize: '1rem' }}
        />
        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>邮箱：</label>
        <input
          value={selectedUser?.email || ''}
          onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
          style={{ width: '100%', marginBottom: '1rem', padding: '0.6rem', borderRadius: '6px', border: '1.5px solid #64ffda', backgroundColor: '#0a192f', color: '#64ffda', fontSize: '1rem' }}
        />
        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>角色：</label>
        <select
          value={selectedUser?.role || 'user'}
          onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
          style={{ width: '100%', marginBottom: '1.5rem', padding: '0.6rem', borderRadius: '6px', border: '1.5px solid #64ffda', backgroundColor: '#0a192f', color: '#64ffda', fontSize: '1rem' }}
        >
          <option value="user">普通用户</option>
          <option value="farmer">养殖户</option>
          <option value="admin">管理员</option>
        </select>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            onClick={() => setIsEditModalOpen(false)}
            style={{
              ...buttonStyle,
              backgroundColor: 'transparent',
              color: '#64ffda',
              border: '1.5px solid #64ffda',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#64ffda';
              e.currentTarget.style.color = '#0a192f';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64ffda';
            }}
          >
            取消
          </button>
          <button style={buttonStyle} onClick={handleSaveEdit}>
            保存
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;