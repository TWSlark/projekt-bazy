import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Zadanie = () => {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState();

  useEffect(() => {
    fetchTask(projectId, taskId);
  }, [projectId, taskId]);

  const fetchTask = async (projectId, taskId) => {
      const accessToken = localStorage.getItem('accessToken');
    try {

      const response = await axios.get(`http://localhost:5000/tasks/${projectId}/${taskId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      
      setTask(response.data);
    } catch (error) {
      console.error('Blad przy pobieraniu zadania w jego zakladce', error);
    }
};

const zadanie = task;

  return (
    <div>
      <h1>Szczegóły zadania</h1>
      {zadanie && (
        <div>
          <h2>{zadanie[0].tytul}</h2>
          <p>{zadanie[0].opis}</p>
        </div>
      )}
    </div>
  );
};

export default Zadanie;
