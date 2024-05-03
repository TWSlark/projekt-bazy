import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { SortAscendingOutlined, DownOutlined, SortDescendingOutlined, 
  ArrowDownOutlined, ArrowUpOutlined, AlignLeftOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Modal } from 'antd';

const Czlonkowie = () => {
  const [people, setPeople] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const showModal = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    console.log("Project Title:", selectedProject.tytul);
    console.log("User ID:", selectedUserId);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/assign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUserId, projectTytul: selectedProject.tytul }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się przypisać użytkownika do projektu');
      }

    } catch (error) {
      console.error('Błąd przy przypisywaniu użytkownika do projektu', error);
    }
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    axios.get('http://localhost:5000/members')
    .then(res => setPeople(res.data))
    .catch(err => console.error("Błąd pobierania użytkowników: ",err));
    fetchProjects();
  },[]);

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
      setProjects(data);
    } catch (error) {
      console.error("Bład przy pobieraniu projektow" ,error);
    }
  };

  //console.table(people);

  const handleMenuClick = (e) => {
    let sortedPeople = [...people];
    switch (e.key){
      case '1': 
      sortedPeople.sort((a,b) => a.imie.localeCompare(b.imie));
      break;

      case '2': 
      sortedPeople.sort((a,b) => b.imie.localeCompare(a.imie));
      break;

      case '3': 
      sortedPeople.sort((a,b) => a.nazw.localeCompare(b.nazw));
      break;

      case '4': 
      sortedPeople.sort((a,b) => b.nazw.localeCompare(a.nazw));
      break;

      case '5': 
      sortedPeople.sort((a,b) => a.status.localeCompare(b.status));
      break;

      case '6': 
      sortedPeople.sort((a,b) => b.status.localeCompare(a.status));
      break;

      case '7': 
      sortedPeople.sort((a,b) => a.wiek - b.wiek);
      break;

      case '8': 
      sortedPeople.sort((a,b) => b.wiek - a.wiek);
      break;

      default:
    }
    setPeople(sortedPeople);
  };

  const items = [
    {
      label: 'Imie A-Z',
      key: '1',
      icon: <SortAscendingOutlined />,
    },
    {
      label: 'Imie Z-A',
      key: '2',
      icon: <SortDescendingOutlined />,
    },
    {
      label: 'Nazwisko A-Z',
      key: '3',
      icon: <SortAscendingOutlined />,
    },
    {
      label: 'Nazwisko Z-A',
      key: '4',
      icon: <SortDescendingOutlined />,
    },
    {
      label: 'Status A-Z',
      key: '5',
      icon: <SortAscendingOutlined />,
    },
    {
      label: 'Status Z-A',
      key: '6',
      icon: <SortDescendingOutlined />,
    },
    {
      label: 'Wiek: rosnąco',
      key: '7',
      icon: <ArrowUpOutlined />,
    },
    {
      label: 'Wiek: malejąco',
      key: '8',
      icon: <ArrowDownOutlined />,
    },
  ];

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <div className='content'>
      <div className='contentTop'>
        <div className='contentTop-left'>
          <h1>Czlonkowie</h1>
          <Dropdown menu={menuProps}>
            <Button>
              <Space>
              <AlignLeftOutlined />Sortuj
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>
      <div className='contentBottom-czlonkowie'>
        <div className='czlonkowie-header'>
          <div className='czl-imie'>Imie i nazwisko</div>
          <div className='czl-imie'>Status</div>
          <div className='czl-imie'>Wiek</div>
        </div>
        <div className='czlonkowie-container'>
          {people.map(member =>(
            <div key={member.uzytkownik_id} className='czlonkowie-item'>
              <span>{member.imie} {member.nazw}</span> 
              <span>{member.status}</span> 
              <span>{member.wiek}
              <Button type="secondary" onClick={() => showModal(member.uzytkownik_id)} icon={<PlusCircleOutlined />}>
              </Button>
              <Modal title="Dodaj do projektu" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <form className='formZadania'>
                  <label>Wybierz projekt: 
                    <input list='projekty' name="nazwaProjektu" onChange={(e) => {
                      const selected = projects.find(project => project.tytul === e.target.value);
                      setSelectedProject(selected);}}/>
                    <datalist id='projekty'>
                      {projects.map(project => (
                      <option key={project.id}>{project.tytul}</option>
                      ))}
                    </datalist>
                  </label>
                </form>
              </Modal></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Czlonkowie;