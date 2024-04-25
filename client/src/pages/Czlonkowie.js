import React, {useState, useEffect} from 'react';
import axios from 'axios';

const Czlonkowie = () => {

  const [people, setPeople] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/members')
    .then(res => setPeople(res.data))
    .catch(err => console.error("Błąd pobierania użytkowników: ",err));
  },[])
  console.log(people);

  return (
    <div className='content'>
      <div className='contentTop'>
        <h1>Czlonkowie</h1>
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
              <span>{member.imienazw}</span> 
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