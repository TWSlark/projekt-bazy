import React from 'react';
import './App.css';
import { AppstoreOutlined, CalendarOutlined , CalculatorOutlined, UserOutlined, SettingOutlined, BuildOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';

const { Header, Content, Sider } = Layout;

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
  getItem('Pulpit', '1', <AppstoreOutlined />),
  getItem('Kalendarz', '2', <CalendarOutlined />),
  getItem('Zadania', '3', <CalculatorOutlined />),
  getItem('Członkowie', '4', <UserOutlined />),
  getItem('Ustawienia', '5', <SettingOutlined />),
  { type: 'divider' },
  getItem('Moje projekty', 'grp', null, [
    getItem('Projekt 1', '11'), getItem('Projekt 2', '12')
  ], 'group'),
];

const App = () => {
  const [currentPage, setCurrentPage] = React.useState('Pulpit');

  const onClick = (e) => {
    console.log('click ', e);
  };
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={256} className="sider">
      <div className="logo">
          <BuildOutlined style={{ color: '#5503da', fontSize: '32px', marginRight: '16px' }} />
          <span className="app-name">Taskify</span>
        </div>
        <Menu
          onClick={onClick}
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1']}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="header" />
        <Content className="content">{currentPage}</Content>
      </Layout>
    </Layout>
  );
};

export default App;