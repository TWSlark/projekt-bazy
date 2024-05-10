import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {  Button, Input, Space  } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';

const { Dragger } = Upload;

const Zadanie = () => {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState({});
  const [comments, setComm] = useState([]);
  const [newComm, setNewComm] = useState('');
  const [pliki, setPlik] = useState([]);
  const [listaPlikow, setListaPlikow] = useState([]);
  
  useEffect(() => {
    fetchTask(projectId, taskId);
    fetchComm(taskId);
    fetchPliki(taskId)
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

const fetchPliki= async (taskId) => {
  const accessToken = localStorage.getItem('accessToken');
try {

  const response = await axios.get(`http://localhost:5000/files/${taskId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  setListaPlikow(response.data);
} catch (error) {
  console.error('Blad przy pobieraniu listy plików', error);
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

  const accessToken = localStorage.getItem('accessToken');
  const props = {
    name: 'file',
    multiple: true,
    action: `http://localhost:5000/upload/${taskId}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        message.success(`${info.file.name} plik został pomyślnie przesłany.`);
        setPlik(info.fileList);
      } else if (status === 'error') {
        message.error(`${info.file.name} przesyłanie pliku nie powiodło się.`);
      }
    },
    onDrop(e) {
      console.log('Upuszczone pliki', e.dataTransfer.files);
    },
  };

const zadanie = task;

  return (
    <>
    <div className='zadanie-header'>
      {zadanie && zadanie[0] && (
        <div>
          <h1>{zadanie[0].tytul}</h1>
          <p>{zadanie[0].opis}</p>
        </div>
      )}
    </div>
    <div className='contentBottom'>
      <div className='zadanie-comments'
      style={{
        width: '50%'
      }}>
        <div style={{
          height: '32rem',
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
      <Dragger className='dragger' style={{ width: '96%' }} {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ color: '#5030E5' }}/>
      </p>
      <p className="ant-upload-text">Kliknij lub przeciągnij plik do tego obszaru, aby przesłać</p>
      <p className="ant-upload-hint">
        Obsługa pojedynczego lub masowego przesyłania. Surowo zabronione jest przesyłanie danych firmowych lub innych zakazanych plików.
      </p>
      </Dragger>
        <h1 style={{padding: 0,margin:0, color: '#5030E5'}}>Załączniki:</h1>
        <div className='files-list'>
          {listaPlikow.map((plik, index)=>(
            <div className='file' key={index}>
              <a style={{ color: '#5030E5', width: '30%' }} href={`http://localhost:5000/download/${plik.nazwa}`} download={plik.nazwa}>{plik.nazwa}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Zadanie;
