import React, { useEffect, useState } from 'react';
import './App.css';
import { AppstoreOutlined, CalendarOutlined , CalculatorOutlined, UserOutlined, BuildOutlined, 
  BookOutlined, DownOutlined, LogoutOutlined } from '@ant-design/icons';
import { Layout, Menu, Button, Space, Dropdown, Avatar } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import socketIOClient from 'socket.io-client';

import ProtectedRoute from './ProtectedRoute';
import Pulpit from './pages/Pulpit';
import Kalendarz from './pages/Kalendarz';
import Zadania from './pages/Zadania';
import Czlonkowie from './pages/Czlonkowie';
import Projekt from './pages/Projekt';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Profil from './pages/Profil';
import Zadanie from './pages/Zadanie';
import ZmianaHasla from './pages/ZmianaHasla';

const { Header, Content, Sider } = Layout;

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/zmianahasla" element={<ZmianaHasla />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/pulpit" element={<Pulpit />} />
            <Route path="/kalendarz" element={<Kalendarz />} />
            <Route path="/zadania" element={<Zadania />} />
            <Route path="/czlonkowie" element={<Czlonkowie />} />
            <Route path="/projekt/:projectId" element={<Projekt />} />
            <Route path="/projekt/:projectId/zadanie/:taskId" element={<Zadanie/>}/>
            <Route path="/profil" element={<Profil />} />
          </Route>
        </Route>
      </Routes>
  );
};

const MainLayout = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [data, setData] = useState({});

  useEffect(() => {
    fetchProjects();
    getProfile();

    const socket = socketIOClient('http://localhost:4000');

    socket.on('projectUpdate', () => {
      console.log('Project update received:');
      fetchProjects();
    });

    socket.on('refreshToken', () => {
      //console.log('Token refreshed');
      refreshAccessToken();
    });
  }, []);

  const fetchProjects = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
  
      const response = await fetch('http://localhost:5000/projects', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Nie udało się pobrać projektów');
      }
  
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Bład przy pobieraniu projektow" ,error);
    }
  };

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
        //console.log('Odświeżono accessToken');
        setAccessToken(newAccessToken);
      })
      .catch(error => {
        console.error('Nieodswieżono accessToken:', error);
        navigate('/');
      });
  };

  const getProfile = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch(`http://localhost:5000/profil`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        //console.log(data);
        setData(data);
    } catch (error) {
        console.error('Blad przy pobieraniu profilu', error);
    }
};

const stringToColor = (str) => {
    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let color = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        color += value.toString(16).padStart(2, '0')
    }
    return color
};

  const handleProfil = () => {
    navigate('/profil');
  };

  const handleLogout = () =>{

    fetch('http://localhost:5000/logout', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data =>{
        console.log(data.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/');
      })
      .catch(err => {
        console.error(err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
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
  
  const projectItems = projects.map((project, index) => (
    getItem(<Link to={`/projekt/${project.projekt_id}`}>{project.tytul}</Link>, `project-${index}`, <BookOutlined/>)
  ));
  
  const items = [
    getItem(<Link to="/pulpit">Pulpit</Link>, '1', <AppstoreOutlined />),
    getItem(<Link to="/kalendarz">Kalendarz</Link>, '2', <CalendarOutlined />),
    getItem(<Link to="/zadania">Zadania</Link>, '3', <CalculatorOutlined />),
    getItem(<Link to="/czlonkowie">Członkowie</Link>, '4', <UserOutlined />),
    { type: 'divider' },
    getItem('Moje projekty', 'grp', null, projectItems, 'group'),
  ];

  const menu = (
    <Menu>
      <Menu.Item onClick={handleProfil} key="0" icon={<UserOutlined />}>
        Profil
      </Menu.Item>
      <Menu.Item onClick={handleLogout} key="1" icon={<LogoutOutlined />}>
        Wyloguj
      </Menu.Item>
    </Menu>
  );

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
        <Header className="header" >
        <div className='logoutLayout'>
        <Dropdown overlay={menu}trigger={['click']}>
          <Space>
            <Avatar style={{ backgroundColor: stringToColor(data.imie || ''), fontSize: '12px' }}>{data.imie ? data.imie.charAt(0) : ''}</Avatar>
            <DownOutlined />
          </Space>
        </Dropdown>
        </div>
        </Header>
          <Content className="content">
            <Outlet />
          </Content>
      </Layout>
    </Layout>
  );
};

export default App;