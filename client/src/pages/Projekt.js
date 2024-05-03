import React, { useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, Link } from 'react-router-dom';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Modal, Button } from 'antd';

const Task = ({ id, title, description, status, onMoveTask, onDeleteTask,projectId }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id, status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    onDeleteTask(id);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="task" ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Link to={`/projekt/${projectId}/zadanie/${id}`}>
        <h3>{title}</h3>
      </Link>
      <p>{description}</p>
      <Button type="primary" onClick={showModal} icon={<MinusCircleOutlined />}>
        Usuń
      </Button>
      <Modal title="Usuwanie zadania" open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>Czy na pewno chcesz usunąć to zadanie?</p>
      </Modal>
    </div>
  );
};

const Projekt = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    const title = document.querySelector('input[name="title"]').value;
    const description = document.querySelector('input[name="description"]').value;
    const status = document.querySelector('select[name="status"]').value;
    const priority = document.querySelector('select[name="priority"]').value;
    const deadline = document.querySelector('input[name="deadline"]').value;

    createTask({ title, description, status, priority, deadline });

    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:5000/tasks/${projectId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Blad przy pobieraniu zadan', error);
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      fetchTasks();
    } catch (error) {
      console.error('Blad przy aktualizowaniu zadania', error);
    }
  };

  const createTask = async ({ title, description, status, priority, deadline }) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      await fetch(`http://localhost:5000/tasks/${projectId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nazwa: title, opis: description, status, priorytet: priority, termin: deadline }),
      });

      fetchTasks();
    } catch (error) {
      console.error('Blad przy tworzeniu zadania', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      fetchTasks();
    } catch (error) {
      console.error('Blad przy usuwaniu zadania', error);
    }
  };

  const handleDrop = (taskId, newStatus) => {
    moveTask(taskId, newStatus);
  };

  const Container = ({ status }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'TASK',
      drop: (item) => handleDrop(item.id, status),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    return (
      <div ref={drop} className="drag-container" data-status={status}>
        <div className={status.replace(/\s/g, '').toLowerCase()}>{status}</div>
        {tasks.filter(task => task.status === status).map(task => (
          <Task key={task.zadanie_id} id={task.zadanie_id} title={task.tytul} description={task.opis} status={task.status} projectId={projectId} onDeleteTask={deleteTask} />
        ))}
      </div>
    );
  };

  return (
    <div className='content'>
      <div className='contentTop'>
        <h1>Zadania</h1>
        <Button type="primary" onClick={showModal} icon={<PlusCircleOutlined />}>
          Dodaj zadanie
        </Button>
        <Modal title="Dodawanie zadania" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
          <form className='formZadania'>
            <label>
              Tytuł:
              <input type="text" name="title" />
            </label>
            <label>
              Opis:
              <input type="text" name="description" />
            </label>
            <label>
              Status:
              <select name="status">
                <option value="Do zrobienia">Do zrobienia</option>
                <option value="Trwajace">Trwajace</option>
                <option value="Zrobione">Zrobione</option>
              </select>
            </label>
            <label>
              Priorytet:
              <select name="priority">
                <option value="Niski">Niski</option>
                <option value="Sredni">Średni</option>
                <option value="Wysoki">Wysoki</option>
              </select>
            </label>
            <label>
              Termin:
              <input type="date" name="deadline" />
            </label>
          </form>
        </Modal>
      </div>
      <div className='contentBottom'>
        <DndProvider backend={HTML5Backend}>
          <Container status="Do zrobienia" />
          <Container status="Trwajace" />
          <Container status="Zrobione" />
        </DndProvider>
      </div>
    </div>
  );
};

export default Projekt;