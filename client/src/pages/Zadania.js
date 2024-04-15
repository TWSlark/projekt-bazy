import React, { useEffect, useState } from 'react';
import dragula from 'dragula';

const Zadania = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const containers = document.querySelectorAll('.drag-container');
    const drake = dragula(Array.from(containers));
    fetchTasks();

    return () => {
      drake.destroy();
    };

  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  return (
    <div className='content'>
      <div className='contentTop'>
        <h1>Zadania</h1>
      </div>
      <div className='contentBottom'>
        <div className="drag-container">
          <div className='to-do'>Do zrobienia</div>
          {tasks.filter(task => task.status === 'DoZrobienia').map(task => (
            <div key={task.zadanie_id} className='task'>{task.tytul}</div>
          ))}
        </div>
        <div className="drag-container">
          <div className='in-progress'>W trakcie</div>
          {tasks.filter(task => task.status === 'Trwajace').map(task => (
            <div key={task.zadanie_id} className='task'>{task.tytul}</div>
          ))}
        </div>
        <div className="drag-container">
          <div className='done'>Zrobione</div>
          {tasks.filter(task => task.status === 'Zrobione').map(task => (
            <div key={task.zadanie_id} className='task'>{task.tytul}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Zadania;