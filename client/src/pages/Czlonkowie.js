import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { SortAscendingOutlined, DownOutlined, SortDescendingOutlined, 
  ArrowDownOutlined, ArrowUpOutlined, AlignLeftOutlined } from '@ant-design/icons';
import { Button, Dropdown,  Space  } from 'antd';

const Czlonkowie = () => {

  const [people, setPeople] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/members')
    .then(res => setPeople(res.data))
    .catch(err => console.error("Błąd pobierania użytkowników: ",err));
  },[])

  console.table(people);

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
            <div key={member.id} className='czlonkowie-item'>
              <span>{member.imie} {member.nazw}</span> 
              <span>{member.status}</span> 
              <span>{member.wiek}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Czlonkowie;