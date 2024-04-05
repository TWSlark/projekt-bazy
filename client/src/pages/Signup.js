import React, {useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import valid from './SignupValid'
import axios from 'axios';
import './Signup.css';

function Signup() {

    const [values, setValues] = useState({
        imie:'',
        nazwisko:'',
        data:'',
        plec:'',
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
        const validErrors = valid(values);
        setErrors(validErrors);
        
        if(validErrors.imie ==="" && validErrors.nazwisko ==="" && validErrors.data ==="" 
        && validErrors.plec ==="" && validErrors.email ==="" && validErrors.haslo ==="") 
        {
            axios.post('http://localhost:5000/signup', values)
            .then(res => {
                navigate('/')
            })
            .catch(err => console.log(err))
        }
    };


  return (
    <div className="signup-container">
    <div>
        <form className='form' action="" onSubmit={handleSubmit}>
            <h1 className='header'>Rejestracja</h1>
            <div className="imie">
                {/* <label htmlFor="imie">Imie</label> */}
                <input type="text" placeholder="Imie" name='imie' onChange={handleInput}/>
                {errors.imie && <span> {errors.imie}</span>}
            </div>

            <div className="nazwisko">
                {/* <label htmlFor="nazwisko">Nazwisko</label> */}
                <input type="text" placeholder="Nazwisko" name='nazwisko' onChange={handleInput}/>
                {errors.nazwisko && <span> {errors.nazwisko}</span>}
            </div>

            <div className="data">
                {/* <label htmlFor="data">Data urodzenia</label> */}
                <input type="date" placeholder="Data urodzenia" name='data' onChange={handleInput}/>
                {errors.data && <span> {errors.data}</span>}
            </div>

            <div className="plec">
                {/* <label htmlFor="plec">PĹeÄ:</label> */}
                <div>
                    <input type="radio" name="plec" value="1" onChange={handleInput} />
                    Mężczyzna
                    </div>
               <div>
                    <input type="radio" name="plec" value="2" onChange={handleInput} />
                    Kobieta
                    </div>
                {errors.plec && <span> {errors.plec}</span>}
                
            </div>

            <div className="email">
                {/* <label htmlFor="email">Email</label> */}
                <input type="text" placeholder="Email" name="email" onChange={handleInput}/>
                {errors.email && <span> {errors.email}</span>}
            </div>

            <div className="haslo">
                {/* <label htmlFor="haslo">HasĹo</label> */}
                <input type="password" placeholder="Hasło" name="haslo" onChange={handleInput}/>
                {errors.haslo && <span> {errors.haslo}</span>}
            </div>

            <div className="buttons">
                <Link className='btn' to="/">Zaloguj</Link>
                <button className='btn' type="submit">Zarejestruj</button>
            </div>
        </form>
    </div>
</div>
  )
}

export default Signup