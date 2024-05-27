import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import valid from './LoginValid';
import axios from 'axios';
import './Login.css';

function Login() {

    useEffect(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }, []);

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
                    localStorage.setItem('refreshToken', res.data.refreshToken);
                    navigate('/pulpit');
                } else {
                    if (res.data === "Konto nieaktywne" || res.data === "Nie ma takich poswiadczen") {
                        notification.error({
                            message: 'Błąd',
                            description: 'Nie istnieje konto o takich poświadczeniach.',
                            duration: 2
                          });
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