import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { SortAscendingOutlined, DownOutlined, SortDescendingOutlined, 
  ArrowDownOutlined, ArrowUpOutlined, AlignLeftOutlined } from '@ant-design/icons';
import { Button, Dropdown,  Space  } from 'antd';


const Zadania = () => {

  const [zadania, setZadania] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/zadania')
    .then(res => setZadania(res.data))
    .catch(err => console.error("Błąd pobierania użytkowników: ",err));
  },[])

  console.table(zadania);

  const handleMenuClick = (e) => {
    let sortedZadania = [...zadania];
    switch (e.key){
      case '1': 
      sortedZadania.sort((a,b) => a.nazwzad.localeCompare(b.nazwzad));
      break;

      case '2': 
      sortedZadania.sort((a,b) => b.nazwzad.localeCompare(a.nazwzad));
      break;

      case '3': 
      sortedZadania.sort((a,b) => a.nazwproj.localeCompare(b.nazwproj));
      break;

      case '4': 
      sortedZadania.sort((a,b) => b.nazwproj.localeCompare(a.nazwproj));
      break;

      case '5': 
      sortedZadania.sort((a,b) => new Date(a.ut) - new Date(b.ut));
      break;

      case '6': 
      sortedZadania.sort((a,b) => new Date(b.ut) - new Date(a.ut));
      break;

      case '7': 
      sortedZadania.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
      break;

      case '8': 
      sortedZadania.sort((a,b) => new Date(b.deadline) - new Date(a.deadline));
      break;

      default:
    }
    setZadania(sortedZadania);
  };

  const items = [
    {
      label: 'Nazwa A-Z',
      key: '1',
      icon: <SortAscendingOutlined />,
    },
    {
      label: 'Nazwa Z-A',
      key: '2',
      icon: <SortDescendingOutlined />,
    },
    {
      label: 'Projekt A-Z',
      key: '3',
      icon: <SortAscendingOutlined />,
    },
    {
      label: 'Projekt Z-A',
      key: '4',
      icon: <SortDescendingOutlined />,
    },
    {
      label: 'Data utworzenia: rosnąco',
      key: '5',
      icon: <SortAscendingOutlined />,
    },
    {
      label: 'Data utworzenia: malejąco',
      key: '6',
      icon: <SortDescendingOutlined />,
    },
    {
      label: 'Termin ostateczny: rosnąco',
      key: '7',
      icon: <ArrowUpOutlined />,
    },
    {
      label: 'Termin ostateczny: malejącoo',
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
          <h1>Zadania</h1>
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
        <div className='czl-imie zadania'>Nazwa</div>
          <div className='czl-imie zadania'>Projekt</div>
          <div className='czl-imie zadania'>Data utworzenia</div>
          <div className='czl-imie zadania'>Termin ostateczny</div>
        </div>
        <div className='czlonkowie-container'>
          {zadania.map(task =>(
            <div key={task.id} className='czlonkowie-item'>
              <span>{task.nazwzad}</span> 
              <span>{task.nazwproj}</span> 
              <span>{new Date(task.ut).toLocaleDateString()}</span>
              <span>{new Date(task.deadline).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Zadania;