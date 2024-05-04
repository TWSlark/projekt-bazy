import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {  Button, Input, Space  } from 'antd';

const Zadanie = () => {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState();
  const [comments, setComm] = useState([]);
  const [newComm, setNewComm] = useState('');
  const [pliki, setPlik] = useState([]);
  
  useEffect(() => {
    fetchTask(projectId, taskId);
    fetchComm(taskId);
  }, [projectId, taskId,comments]);

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

const fetchComm= async (taskId) => {
  const accessToken = localStorage.getItem('accessToken');
try {

  const response = await axios.get(`http://localhost:5000/comments/${taskId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  setComm(response.data);
} catch (error) {
  console.error('Blad przy pobieraniu zadania w jego zakladce', error);
}
};

const addComm = async(e) => {
  const accessToken = localStorage.getItem('accessToken');
  try {
    e.preventDefault();
    const response = await axios.post(`http://localhost:5000/comments/`, {
      komentarz: newComm,
      zadanie_id: taskId,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    setNewComm('');
    fetchComm(taskId);
    console.log('response: ', response);

  } catch(err){
    console.error("Błąd przy dodawaniu zadania", err);
  }
  }

  const addFile = (e) => {
    setPlik(e.target.files);
  }

  const uploadPlik = async() => {
    const accessToken = localStorage.getItem('accessToken');
    const data = new FormData();

    if (pliki) {
      data.append('file', pliki[0]);
    }

    try {
      const response = await axios.post(`http://localhost:5000/upload/${taskId}`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('Dodano załączniki ', response);
    } catch(err){
      console.error("Błąd przy dodawaniu zadania", err);
    }
  }

const zadanie = task;

  return (
    <>
    <div className='zadanie-header'>
      {zadanie && (
        <div>
          <h1>{zadanie[0].tytul}</h1>
          <p>{zadanie[0].opis}</p>
        </div>
      )}
    </div>
    <div className='zadanie-comments'
    style={{
      width: '50%'
    }}>
      <div style={{
        height: '88%',
        overflow: 'auto'
      }}>
        {comments.length === 0 ? 
        (<h3>Brak komentarzy dla tego zadania</h3>) :
        (
          comments.map((comm) => (
            <div className='zadanie-comment' key={comm.komentarz_id}>
              <div className='zad-imieData'><h3>{comm.imie} {comm.nazwisko}</h3> 
                <span>{new Date(comm.data).toLocaleDateString()} {new Date(comm.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p>{comm.komentarz}</p>
            </div>
          ))
        )}
      </div>
          <form onSubmit={addComm}>
            <Input className='comm-input' value={newComm} onChange={(e) => setNewComm(e.target.value)} placeholder='Dodaj komentarz...' />
            <button type="submit">Dodaj</button>    
          </form>
    </div>
    
    <div className='zadanie-files'>
      <form onSubmit={(e) => {
        e.preventDefault();
        uploadPlik();
      }}>
        <input type="file" onChange={addFile} />
        <button type="submit">Dodaj plik</button>
      </form>
    </div>
    </>
  );
};

export default Zadanie;
