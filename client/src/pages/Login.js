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
        setValues(prev => ({...prev, [e.target.name]: [e.target.value]}));
    };

    const handleSubmit = (e) =>{
        e.preventDefault();
        setErrors(valid(values));
        
            axios.post('http://localhost:5000/login', values)
            .then(res => {
                if (res.data === "Git") {
                    navigate('/pulpit')
                } else {
                    alert("Nie istnieje konto o podanych poświadczeniach");
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
                        {errors.email && <span> {errors.email}</span>}
                    </div>
        
                    <div className="haslo">
                        {/* <label htmlFor="haslo">HasĹo</label> */}
                        <input type="password" placeholder="Hasło" name='haslo' onChange={handleInput}/>
                        {errors.password && <span> {errors.password}</span>}
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