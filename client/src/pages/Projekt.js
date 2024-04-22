import React, { useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams } from 'react-router-dom';

const Task = ({ id, title, description, status, onMoveTask }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id, status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div className="task" ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

const Projekt = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);

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
          <Task key={task.zadanie_id} id={task.zadanie_id} title={task.tytul} description={task.opis} status={task.status} />
        ))}
      </div>
    );
  };

  return (
    <div className='content'>
      <div className='contentTop'>
        <h1>Zadania</h1>
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