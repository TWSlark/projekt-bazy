import { UserOutlined } from '@ant-design/icons';
import React from 'react';
import { Avatar, Tooltip, Row, Col } from 'antd';


const Pulpit = () => {
  return (
    <div className='content'>
      <div className='contentTop'>
        <h1>Pulpit</h1>
        <Row justify="end">
          <Col>
            <Avatar.Group>
              <Tooltip title="Ant User" placement="top">
                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
              </Tooltip>
              <Tooltip title="Ant User" placement="top">
                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
              </Tooltip>
              <Tooltip title="Ant User" placement="top">
                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
              </Tooltip>
              <Tooltip title="Ant User" placement="top">
                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
              </Tooltip>
            </Avatar.Group>
          </Col>
        </Row>
      </div>
      <div className='contentBottom'>
        <h2>Zawartość pulpitu</h2>
      </div>
    </div>
  );
};

export default Pulpit;