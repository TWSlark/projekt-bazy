import React, { useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Modal, Button, Avatar, Tooltip } from 'antd';
import socketIOClient from 'socket.io-client';

const Task = ({ id, title, description, status, priority, assignedUser, onMoveTask, onDeleteTask, projectId }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id, status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const stringToColor = (str) => {
    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let color = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        color += value.toString(16).padStart(2, '0')
    }
    return color
};

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
      <Link to={`/projekt/${projectId}/zadanie/${id}`} className="project-link">
        <h3>{title}</h3>
      </Link>
      <div className="priority">{priority}</div>
      <p>{description}</p>
      <Button type="primary" onClick={showModal} icon={<MinusCircleOutlined />}>
        Usuń
      </Button>
      <Modal title="Usuwanie zadania" open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>Czy na pewno chcesz usunąć to zadanie?</p>
      </Modal>
      <div className="assignedUser">
        {assignedUser && (
          <Tooltip title={`${assignedUser.imie} ${assignedUser.nazwisko}`} placement="top">
            <Avatar style={{ backgroundColor: stringToColor(assignedUser.imie || '') }}>
              {assignedUser.imie.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const Projekt = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [logi, setLogi] = useState([]);
  const [logModal, setLogModal] = useState(false);

  const showLogModal = () => {
    setLogModal(true);
  };

  const hideLogModal = () => {
    setLogModal(false);
  };

  const showDeleteModal = (userId) => {
    setUserIdToDelete(userId);
    setIsDeleteModalVisible(true);
  };

  const hideDeleteModal = () => {
    setUserIdToDelete(null);
    setIsDeleteModalVisible(false);
  };

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
    isUserAssigned();

    const socket = socketIOClient('http://localhost:4000');

    socket.on('taskUpdate', (data) => {
      //console.log('Task update received:', data);
      fetchTasks();
      fetchLogi();
    });

    return () => socket.disconnect();
  }, [projectId]);

  const fetchLogi = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:5000/logi/${projectId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLogi(data.logi);
        console.log(data.logi);
      } else {
        throw new Error('Nie udało się pobrać logów');
      }
    } catch (error) {
      console.error('Błąd przy pobieraniu logów', error);
    }
  };

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
          fetchTasks();
          fetchLogi();
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

  const fetchTasks = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:5000/tasks/${projectId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      const assignedUsers = data.tasks.map(task => ({
        ...task,
        assignedUser: data.users.find(user => user.uzytkownik_id === task.uzytkownik_id),
      }));
      setTasks(assignedUsers);
      setUsers(data.users);
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

  const handleDrop = async (taskId, newStatus) => {
    const accessToken = localStorage.getItem('accessToken');

    if (newStatus === 'Trwajace') {
      try {
        await fetch(`http://localhost:5000/tasks/${taskId}/assign`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
      } catch (error) {
        console.error('Blad z przypisaniem uzyt do zad', error);
      }
    } else if (newStatus === 'Do zrobienia') {
      try {
        await fetch(`http://localhost:5000/tasks/${taskId}/unassign`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Blad z przypisaniem uzyt do zad', error);
      }
    } else if (newStatus === 'Zrobione') {
      try {
        const taskResponse = await fetch(`http://localhost:5000/tasks/${projectId}/${taskId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const taskData = await taskResponse.json();
        const currentStatus = taskData[0].status;
  
        if (currentStatus === 'Trwajace') {
          await fetch(`http://localhost:5000/tasks/${taskId}/complete`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
        } else {
          console.error('Nie mozna przeniesc z "Do zrobienia" do "Zrobione"');
          return;
        }
      } catch (error) {
        console.error('Blad z przypisaniem uzyt do zad', error);
      }
    }

    moveTask(taskId, newStatus);
  };

  const deleteUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      await fetch(`http://localhost:5000/assign/${projectId}/${userIdToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      fetchTasks();
    }
    catch (error) {
      console.error('Blad przy usuwaniu uzytkownika', error);
    }

    console.log(`Usuwanie uzytkownika z ID: ${userIdToDelete}`);
    setUserIdToDelete(null);
    hideDeleteModal();
  };

  const stringToColor = (str) => {
    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let color = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        color += value.toString(16).padStart(2, '0')
    }
    return color
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
          <Task key={task.zadanie_id} id={task.zadanie_id} title={task.tytul} description={task.opis} status={task.status} priority={task.priorytet} assignedUser={task.assignedUser} projectId={projectId} onDeleteTask={deleteTask} />
        ))}
      </div>
    );
  };

  return (
    <div className='content'>
      <div className='contentTop'>
        <h1>Zadania</h1>
        <div className='users'>
          <Avatar.Group>
          {users.map(user => (
            <Tooltip title={user.imie + " " + user.nazwisko}  placement="top">
              <Avatar key={user.uzytkownik_id} style={{ backgroundColor: stringToColor(user.imie || '')}} onClick={() => showDeleteModal(user.uzytkownik_id)}>{user.imie.charAt(0).toUpperCase()}</Avatar>
            </Tooltip>
          ))}
          </Avatar.Group>
          <Modal title="Usuwanie użytkownika" open={isDeleteModalVisible} onOk={deleteUser} onCancel={hideDeleteModal}>
            <p>Czy na pewno chcesz usunąć tego użytkownika?</p>
          </Modal>
        </div>
        <div>
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
          <Button onClick={showLogModal}>Ostatnie zmiany</Button>
            <Modal title="Ostatnie zmiany" open={logModal} onOk={hideLogModal} onCancel={hideLogModal} >
            {logi.map((log) => (
              <p key={log.log_id} style={{ marginBottom: '0.1rem' }}>
                Zmiana zadania "{log.tytul}" na: {log.status} ({log.imie} {log.nazwisko})
                {log.czas_rozpoczecia && (
                  <>
                    <br />
                    Rozpoczęcie: {new Date(log.czas_rozpoczecia).toLocaleString()}
                  </>
                )}
                {log.czas_zakonczenia && (
                  <>
                    <br />
                    Zakończenie: {new Date(log.czas_zakonczenia).toLocaleString()}
                  </>
                )}
              </p>
            ))}
            </Modal>
        </div>
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