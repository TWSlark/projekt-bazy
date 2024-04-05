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
                    navigate('/home')
                } else {
                    alert("Nie istnieje konto o podanych poświadczeniach"); //Można usunąć w sumie
                }
            })
            .catch(err => console.log(err))
        
    };
    
    return (
        <div className='loginBody'>
        <div>
            <form className='form1' action="" onSubmit={handleSubmit}>
                <h1 className='header'>Zaloguj</h1>
                <div className="email">
                    <input type="text" placeholder="Email" name='email' onChange={handleInput}/>
                    {errors.email && <p> {errors.email}</p>}
                </div>
    
                <div className="haslo">
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