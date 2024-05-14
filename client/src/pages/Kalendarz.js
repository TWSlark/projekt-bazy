import React, { useEffect, useState } from 'react';
import { Badge, Calendar } from 'antd';

const Kalendarz = () => {
  const [dates, setDates] = useState([]);

  useEffect(() => {
    fetchDates();
  }, []);

  const fetchDates = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:5000/kalendarz`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      //console.log(data);
      setDates(data);

    } catch (error) {
      console.error('Blad przy pobieraniu dat, kalendarz', error);
    }
  };

  const getListData = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    const filteredDates = dates.filter(date => date.do_kiedy.substring(0, 10) === dateString);
  
    return filteredDates.map(date => {
      let color;
      if (date.status === 'Do zrobienia') {
        color = 'magenta';
      } else if (date.status === 'Trwajace') {
        color = 'yellow';
      } else if (date.status === 'Zrobione') {
        color = 'green';
      }
      return {
        color: color,
        content: date.tytul,
      };
    });
  };

  const getMonthData = (value) => {
    // jesli beda notatki w miesiacu to tutaj trzeba dane podac
    return null;
  };

  const monthCellRender = (value) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section></section>
        <span></span>
      </div>
    ) : null;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge color={item.color} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    if (info.type === 'month') return monthCellRender(current);
    return info.originNode;
  };

  return <Calendar cellRender={cellRender} />;
};

export default Kalendarz;