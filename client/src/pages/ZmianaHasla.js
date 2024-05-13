import React, { useEffect, useState } from 'react';
import './Verify.css';
import axios from 'axios';

function ZmianaHasla() {
    const [dane, setDane] = useState({
        haslo:'',
        newHaslo:''
    });


    const handleInput = (e) => {
        setDane(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    function validNewPass() {
        const passRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+=])[A-Za-z\d!@#$%^&*()-+=]{8,}$/;

        if (!passRe.test(dane.haslo)) {
            alert("Hasło nie spełnia wymagań")
            return false;
        }else if (dane.haslo !== dane.newHaslo) {
            alert("Hasła nie są ze sobą zgodne")
            return false;
        }
        return true;
    }

    const showAlert = () => {
        alert("Hasło zostało zmienione");
        window.location.href="http://localhost:3000";
    }

    const handleSubmit = async (e) =>{
        e.preventDefault();
    
        const accessToken = localStorage.getItem('accessToken');
        
        if(validNewPass(dane)){
            try {
            const response = await axios.post(`http://localhost:5000/newPass`, dane, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
            })

            if(response.data.success) {
              showAlert();
            } else {
              console.error("Błąd: ", response.data.error);
            }

            console.log('response: ', response);
        } catch(err){
            console.error("Błąd przy dodawaniu zadania", err);
        }}
    };

    return (
        <div className='verify-container'>
            <form method='POST' onSubmit={handleSubmit}>
                <input type='password' id='newPass' name='haslo' onChange={handleInput} placeholder='Podaj nowe hasło'/>
                <input type='password' id='reEntry' name='newHaslo' onChange={handleInput} placeholder='Podaj ponownie nowe hasło'/>
                <button type='submit'>Zaktualizuj Hasło</button>
            </form>
        </div>
      )
}

export default ZmianaHasla