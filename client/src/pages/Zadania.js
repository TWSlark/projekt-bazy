import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { SortAscendingOutlined, DownOutlined, SortDescendingOutlined, 
  ArrowDownOutlined, ArrowUpOutlined, AlignLeftOutlined } from '@ant-design/icons';
import { Button, Dropdown,  Space  } from 'antd';

const Zadania = () => {

  // const [zadania, setZadania] = useState([]);

  // useEffect(() => {
  //   axios.get('http://localhost:5000/zadania')
  //   .then(res => setZadania(res.data))
  //   .catch(err => console.error("Błąd pobierania użytkowników: ",err));
  // },[])

  const [zadania, setZadania] = useState([]);
  const [projekty, setProjekty] = useState([]);

  useEffect(() => {
    fetchZadania();
  }, []);

  const fetchZadania = async (sortParams = {}) => {
    const accessToken = localStorage.getItem('accessToken');
    const { column, order } = sortParams;
   
    try {
      const response = await axios.get(`http://localhost:5000/zadania`, {
        params: {
          column,
          order
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      setZadania(response.data.zadania);
      setProjekty(response.data.projekty);

    } catch (error) {
      console.error('Błąd przy pobieraniu zadań', error);
    }
  };
  
  //console.table(zadania);
  //console.table(projekty);

  const handleMenuClick = (e) => {
    const sortOpt = {
      '1': {column: 'tytul', order: 'ASC'},
      '2': {column: 'tytul', order: 'DESC'},
      '3': {column: 'projekty.tytul', order: 'ASC'},
      '4': {column: 'projekty.tytul', order: 'DESC'},
      '5': {column: 'data_utworzenia', order: 'ASC'},
      '6': {column: 'data_utworzenia', order: 'DESC'},
      '7': {column: 'do_kiedy', order: 'ASC'},
      '8': {column: 'do_kiedy', order: 'DESC'}
    };
    const sortParams = sortOpt[e.key];
    fetchZadania(sortParams);
    }

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
              <span>{task.tytul}</span> 
              <span>{task.projekty.tytul}</span> 
              <span>{new Date(task.data_utworzenia).toLocaleDateString()}</span>
              <span>{new Date(task.do_kiedy).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Zadania;