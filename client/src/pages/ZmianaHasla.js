import React, { useEffect, useState } from 'react';
import './Verify.css';
import axios from 'axios';

function ZmianaHasla() {
    const [dane, setDane] = useState({
        email:'',
        haslo:'',
        newHaslo:''
    });

    const [err, setErr] = useState({})

    const handleInput = (e) => {
        setDane(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    function validNewPass(dane) {
        let error = {}
        const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const passRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+=])[A-Za-z\d!@#$%^&*()-+=]{8,}$/;

        if (!emailRe.test(dane.email)) {
            error.email = "Email jest nie poprawny"
        }
        else {
            error.email = "";
        }
    
        if (!passRe.test(dane.haslo)) {
            error.password = "Hasło nie spełnia wymagań"
        }
        else {
            error.password = "";
        }

        if (dane.haslo !== dane.newHaslo) {
            error.newpassword = "Hasła się nie zgadzają"
        }
        else {
            error.newpassword = "";
        }
    
        return error;
    }

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setErr(validNewPass(dane));
        const accessToken = localStorage.getItem('accessToken');

        try {
            const response = await axios.post(`http://localhost:5000/newPass`, dane, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
            })
            console.log('response: ', response);

        } catch(err){
            console.error("Błąd przy dodawaniu zadania", err);
        }
    };

    return (
        <div className='verify-container'>
            <form method='POST' onSubmit={handleSubmit}>
                <input type="text" placeholder="Email" name='email' onChange={handleInput}/>
                {err.email && <p> {err.email}</p>}
                <input type='password' id='newPass' name='haslo' onChange={handleInput} placeholder='Podaj nowe hasło'/>
                {err.password && <p> {err.password}</p>}
                <input type='password' id='reEntry' name='newHaslo' onChange={handleInput} placeholder='Podaj ponownie nowe hasło'/>
                {err.newpassword && <p> {err.newpassword}</p>}
                <button type='submit'>Zaktualizuj Hasło</button>
            </form>
        </div>
      )
}

export default ZmianaHasla