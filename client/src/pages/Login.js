import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import valid from './LoginValid';
import axios from 'axios';
import './Login.css';

function Login() {

    const [values, setValues] = useState({
        email:'',
        haslo:''
    });

    const navigate = useNavigate();

    const [errors, setErrors] = useState({})
    
    const handleInput = (e) => {
        setValues(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e) =>{
        e.preventDefault();
        setErrors(valid(values));
        
            axios.post('http://localhost:5000/login', values)
            .then(res => {
                if (res.data.accessToken) {
                    localStorage.setItem('accessToken', res.data.accessToken);
                    const tokenExpiration = new Date().getTime() + 300000;
                    localStorage.setItem('tokenExpiration', tokenExpiration);
                    navigate('/pulpit');
                } else {
                    if (res.data === "Konto nieaktywne" || res.data === "Nie ma takich poswiadczen") {
                        alert("Konto nieaktywne lub nie ma takich poswiadczen");
                    }
                }
            })
            .catch(err => console.log(err))
        
    };
    
    return (
        <div className="login-container">
            <div>
                <form className='form1' action="" onSubmit={handleSubmit}>
                    <h1 className='header'>Zaloguj</h1>
                    <div className="email">
                        {/* <label htmlFor="email">Login</label> */}
                        <input type="text" placeholder="Email" name='email' onChange={handleInput}/>
                        {errors.email && <p> {errors.email}</p>}
                    </div>
        
                    <div className="haslo">
                        {/* <label htmlFor="haslo">HasĹo</label> */}
                        <input type="password" placeholder="Hasło" name='haslo' onChange={handleInput}/>
                        {errors.password && <p> {errors.password}</p>}
                    </div>
        
                    <div className="buttons">
                        <button className='btn' type='submit'>Zaloguj</button>
                        <Link className='btn' to="/signup">Zarejestruj</Link>
                    </div>
                </form>
            </div>
        </div>
  )
}   

export default Login