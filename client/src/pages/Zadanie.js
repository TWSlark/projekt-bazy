import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload, Button, Modal, Input} from 'antd';

const { Dragger } = Upload;

const Zadanie = () => {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState({});
  const [comments, setComm] = useState([]);
  const [newComm, setNewComm] = useState('');
  const [pliki, setPlik] = useState([]);
  const [listaPlikow, setListaPlikow] = useState([]);
  const [times, setTimes] = useState([]);
  
  useEffect(() => {
    isUserAssigned();
  }, [projectId, taskId, comments]);

  const isUserAssigned = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:5000/isAssociated/${projectId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isAssociated) {
          fetchTask(projectId, taskId);
          fetchComm(taskId);
          fetchPliki(taskId);
          fetchUserTime(taskId);
        } else {
          navigate('/pulpit');
        }
      } else {
        throw new Error('Nie udało się sprawdzić przypisania użytkownika do projektu');
      }
      
    } catch (error) {
      console.error('Błąd przy sprawdzaniu przypisania użytkownika do projektu', error);
    }
  };

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

  const fetchUserTime= async (taskId) => {
    const accessToken = localStorage.getItem('accessToken');
  try {
  
    const response = await axios.get(`http://localhost:5000/time/${taskId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    setTimes(response.data[0]);
  } catch (error) {
    console.error('Blad przy pobieraniu czasu użytkowników', error);
  }
  };

const zadanie = task;

const totalTime = (times) => {
  let totalTimeText = '';
  const totalSeconds = times.reduce((total, time) => total + Number(time.suma), 0);
  //console.log('totalSeconds: ', totalSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    totalTimeText += `${hours} godzin${hours > 1 ? '' : 'ę'}`;
  }
  if (minutes > 0) {
    totalTimeText += ` ${minutes} minut${minutes > 1 ? '' : 'ę'}`;
  }
  if (seconds > 0 || (hours === 0 && minutes === 0)) {
    totalTimeText += ` ${seconds} sekund${seconds > 1 ? '' : 'ę'}`;
  }
  return totalTimeText;
};
const totalTimeText = `Łączny czas pracy przez użytkowników: ${totalTime(times)}`
const info = () => {
  Modal.info({
    title: 'Raport czasu pracy',
    content: (
      <>
      <div className='usersTime'>
        {times.map((time) => {
          const { godziny, minuty, sekundy, imie, nazwisko } = time;
          let timeText = `${imie} ${nazwisko} pracował nad zadaniem `;
          if (godziny > 0) {
            timeText += `${godziny} godzin${godziny > 1 ? '' : 'ę'}`;
          }
          if (minuty > 0) {
            timeText += ` ${minuty} minut${minuty > 1 ? '' : 'ę'}`;
          }
          if (sekundy > 0 || (godziny === 0 && minuty === 0)) {
            timeText += ` ${sekundy} sekund${sekundy > 1 ? '' : 'ę'}`;
          }
          return (
            <>
            <div key={time.uzytkownik_id}>
              <p>{timeText}</p>
            </div>
            </>
          );
        })}
      </div>
        <h3>{totalTimeText}</h3>
        <div> {times.map((time, index, self) => {
          const isDuplicate = self.findIndex(t => t.szacowany_czas === time.szacowany_czas) < index;
          if (!isDuplicate) {
            let timeText ='';
            let czas = time.szacowany_czas;
            const hours = Math.floor(czas / 3600);
            const minutes = Math.floor((czas % 3600) / 60);
            const seconds = czas % 60;
            if (hours > 0) {
              timeText += `${hours} godzin${hours > 1 ? '' : 'ę'}`;
            }
            if (minutes > 0) {
              timeText += ` ${minutes} minut${minutes > 1 ? '' : 'ę'}`;
            }
            if (seconds > 0 || (hours === 0 && minutes === 0)) {
              timeText += ` ${seconds} sekund${seconds > 1 ? '' : 'ę'}`;
            }
            return (
              <h3 key={index}>
                <p>{`Szacowany czas pracy nad zadaniem wynosi: ${timeText}`}</p>
              </h3>
            );
          }
          return null;
        })}
        </div>
          <div>
          {
          times.map((time, index, self) => {
          const isDuplicate = self.findIndex(t => t.szacowany_czas === time.szacowany_czas) < index;
          if (!isDuplicate) {
            let calkowity = times.reduce((total, time) => total + Number(time.suma), 0);
            console.log('calkowity: ', calkowity);
            let timeText ='';
            const czas = time.szacowany_czas;
            const pozostalo = czas - calkowity;
            console.log('pozostalo: ', pozostalo);
            const hours = Math.floor(Math.abs(pozostalo) / 3600);
            const minutes = Math.floor((Math.abs(pozostalo) % 3600) / 60);
            const seconds = Math.abs(pozostalo) % 60;
            if (hours > 0) {
              timeText += `${hours} godzin${hours > 1 ? '' : 'ę'}`;
            }
            if (minutes > 0) {
              timeText += ` ${minutes} minut${minutes > 1 ? '' : 'ę'}`;
            }
            if (seconds > 0 || (hours === 0 && minutes === 0)) {
              timeText += ` ${seconds} sekund${seconds > 1 ? '' : 'ę'}`;
            }
            if (pozostalo < 0) {
              return (
                <h3 key={index}>
                  <p>{`Szacowany czas pracy został przekroczony o: ${timeText}`}</p>
                </h3>
              );
            } else {
              return (
                <h3 key={index}>
                  <p>{`Pozostało: ${timeText}`}</p>
                </h3>
              );
            }
          }
          return null;
        })}
          </div>
        </>
    ),
    onOk() {},
  });
};


  return (
    <>
    <div className='zadanie-header'>
      {zadanie && zadanie[0] && (
        <div>
          <h1>{zadanie[0].tytul}</h1>
          <p>{zadanie[0].opis}</p>
        </div>
      )}
      <Button onClick={() => info(taskId)}>Statystyki czasu pracy</Button>
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