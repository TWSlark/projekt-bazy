import { UserOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { Avatar, Tooltip, Row, Col, Progress } from 'antd';


const Pulpit = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await fetch('http://localhost:5000/projects');
    const data = await response.json();
    setProjects(data);
  };

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
        <Row gutter={[16, 16]}>
          {projects.map(project => (
            <Col key={project.projekt_id}>
              <div className='progressBox'>
                <h2>{project.tytul}</h2>
                <Progress type="circle" percent={90} />
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Pulpit;