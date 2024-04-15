import React, { useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const Task = ({ id, title, status, onMoveTask }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id, status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div className="task" ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {title}
    </div>
  );
};

const Zadania = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Blad przy pobieraniu zadan', error);
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
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
        <div className={status.toLowerCase()}>{status}</div>
        {tasks.filter(task => task.status === status).map(task => (
          <Task key={task.zadanie_id} id={task.zadanie_id} title={task.tytul} status={task.status} />
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
          <Container status="DoZrobienia" />
          <Container status="Trwajace" />
          <Container status="Zrobione" />
        </DndProvider>
      </div>
    </div>
  );
};

export default Zadania;