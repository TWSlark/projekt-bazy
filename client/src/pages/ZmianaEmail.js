import React, { useEffect, useState } from 'react';
import './Verify.css';
import axios from 'axios';

function ZmianaEmail() {
    const [dane, setDane] = useState({
        newEmail:'',
        haslo:''
    });


    const handleInput = (e) => {
        setDane(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    function validNewCreds() {
        const passRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+=])[A-Za-z\d!@#$%^&*()-+=]{8,}$/;
        const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailRe.test(dane.newEmail)) {
            alert("Email nie spełnia wymagań")
            return false;
        } else if (dane.haslo === '' || dane.newEmail==='') 
        {
            alert("Pola nie mogą być puste");
            return false;
        }
        return true;
    }

    const showAlert = () => {
        alert("Email został zmieniony");
        window.location.href="http://localhost:3000";
    }

    const handleSubmit = async (e) =>{
        e.preventDefault();
    
        const accessToken = localStorage.getItem('accessToken');
        
        if(validNewCreds(dane)){
            try {
            const response = await axios.post(`http://localhost:5000/newEmail`, dane, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
            })

            if(response.data.success) {
              showAlert();
            } else {
              alert(response.data.error);
            }

            console.log('response: ', response);
        } catch(err){
            console.error("Błąd przy dodawaniu zadania", err);
        }}
    };

    return (
        <div className='verify-container'>
            <form method='POST' onSubmit={handleSubmit}>
                <input type='email' id='newEmail' name='newEmail' onChange={handleInput} placeholder='Podaj nowy email'/>
                <input type='password' id='newPass' name='haslo' onChange={handleInput} placeholder='Podaj swoje hasło'/>
                <button type='submit'>Zaktualizuj Email</button>
            </form>
        </div>
      )
}

export default ZmianaEmail