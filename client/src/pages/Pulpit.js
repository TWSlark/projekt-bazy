import React, { useEffect, useState } from 'react';
import { Row, Col, Progress, Modal, Button } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const Pulpit = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    const newProjectTitle = document.querySelector('input[name="title"]').value;
    createProject(newProjectTitle);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchProjects();
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

      const progress = data.map(project => {
        const tasks = project.zadania.length;
        const doneTasks = project.zadania.filter(task => task.status === 'Zrobione').length;
        const wynik = Math.round((doneTasks / tasks) * 100);
        return { ...project, wynik };
      });

      setProjects(progress);
    } catch (error) {
      console.error("Bład przy pobieraniu projektow" ,error);
    }
  };

  const createProject = async (newProjectTitle) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:5000/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newProjectTitle })
      });

      if (!response.ok) {
        throw new Error('Nie udało się dodać projektu');
      }

      fetchProjects();
    } catch (error) {
      console.error("Błąd przy dodawaniu projektu:", error);
    }
  };

  return (
    <div className='content'>
      <div className='contentTop'>
        <h1>Pulpit</h1>
        <Button type="primary" onClick={showModal} icon={<PlusCircleOutlined />}>
          Dodaj projekt
        </Button>
        <Modal title="Dodawanie projektu" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
          <form className='formZadania'>
            <label>Tytuł:
              <input type="text" name="title" />
            </label>
          </form>
        </Modal>
      </div>
      <div className='contentBottom'>
        <Row gutter={[16, 16]}>
          {projects.map(project => (
            <Col key={project.projekt_id}>
              <Link to={`/projekt/${project.projekt_id}`} className="project-link">
                <div className='progressBox'>
                  <h2>{project.tytul}</h2>
                  <Progress type="circle" percent={project.wynik} />
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Pulpit;