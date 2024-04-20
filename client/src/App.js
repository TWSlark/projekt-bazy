import React, { useEffect, useState } from 'react';
import './App.css';
import { AppstoreOutlined, CalendarOutlined , CalculatorOutlined, UserOutlined, SettingOutlined, BuildOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

import Pulpit from './pages/Pulpit';
import Kalendarz from './pages/Kalendarz';
import Zadania from './pages/Zadania';
import Czlonkowie from './pages/Czlonkowie';
import Ustawienia from './pages/Ustawienia';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';

const { Header, Content, Sider } = Layout;

const App = () => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  useEffect(() => {
    const currentPath = window.location.pathname;
    
    if (currentPath !== '/signup' && currentPath !== '/verify' && !accessToken) {
      navigate('/');
    } else if (accessToken && currentPath !== '/signup' && currentPath !== '/verify') {
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      const currentTime = new Date().getTime();
      if (currentTime > parseInt(tokenExpiration)) {
        refreshAccessToken();
      }
    }
  }, [accessToken, navigate]);

  const refreshAccessToken = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      navigate('/');
      return;
    }

    fetch('http://localhost:5000/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to refresh access token');
        }
        return response.json();
      })
      .then(data => {
        const newAccessToken = data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        const tokenExpiration = new Date().getTime() + 150000;
        localStorage.setItem('tokenExpiration', tokenExpiration);
        console.log('Odświeżono accessToken');
        setAccessToken(newAccessToken);
      })
      .catch(error => {
        console.error('Nieodswieżono accessToken:', error);
        navigate('/');
      });
  };

  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route element={<MainLayout />}>
          <Route path="/pulpit" element={<Pulpit />} />
          <Route path="/kalendarz" element={<Kalendarz />} />
          <Route path="/zadania" element={<Zadania />} />
          <Route path="/czlonkowie" element={<Czlonkowie />} />
          <Route path="/ustawienia" element={<Ustawienia />} />
        </Route>
      </Routes>
  );
};

function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

const items = [
  getItem(<Link to="/pulpit">Pulpit</Link>, '1', <AppstoreOutlined />),
  getItem(<Link to="/kalendarz">Kalendarz</Link>, '2', <CalendarOutlined />),
  getItem(<Link to="/zadania">Zadania</Link>, '3', <CalculatorOutlined />),
  getItem(<Link to="/czlonkowie">Członkowie</Link>, '4', <UserOutlined />),
  getItem(<Link to="/ustawienia">Ustawienia</Link>, '5', <SettingOutlined />),
  { type: 'divider' },
  getItem('Moje projekty', 'grp', null, [
    getItem('Projekt 1', '11'), getItem('Projekt 2', '12')
  ], 'group'),
];

const MainLayout = () => {

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={256} className="sider">
      <div className="logo">
          <BuildOutlined style={{ color: '#5503da', fontSize: '32px', marginRight: '16px' }} />
          <span className="app-name">Taskify</span>
        </div>
        <Menu
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1']}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="header" />
          <Content className="content">
            <Routes>
              <Route path="/pulpit" element={<Pulpit />} />
              <Route path="/kalendarz" element={<Kalendarz />} />
              <Route path="/zadania" element={<Zadania />} />
              <Route path="/czlonkowie" element={<Czlonkowie />} />
              <Route path="/ustawienia" element={<Ustawienia />} />
            </Routes>
          </Content>
      </Layout>
    </Layout>
  );
};

export default App;