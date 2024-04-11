const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const tokenKey = process.env.TOKENKEY;

const app = express();
app.use(cors());
app.use(express.json());


let transport = nodemailer.createTransport({
  host: process.env.HOSTMT,
  port: process.env.PORTMT,
  auth: {
    user: process.env.USERMT,
    pass: process.env.PASSMT 
  }
});


const db = mysql.createConnection({
  host: process.env.HOSTDB,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORTDB,
  authPlugin: 'mysql_native_password'
})

app.post('/signup', (req, res) => {

  const sql = process.env.SQL_SIGNUP_QUERY;
  const password = req.body.haslo;

  bcrypt.genSalt(10, (err, salt)=>{
  if (err) {
    console.log("Błąd generowania soli", err);
    return;
  }

  bcrypt.hash(password.toString(), salt, (err,hash) =>{
    if (err) {
      console.log(err);
    }
    const token = jwt.sign({email: req.body.email},tokenKey,{ expiresIn: '30min' });

    const values = [
      req.body.email,
      hash,
      req.body.imie,
      req.body.nazwisko,
      req.body.data,
      req.body.plec,
      token
    ];
    
    db.query(sql, values, (err,data) => {
      if (err) {
        return res.json("Error");
      }
      transport.sendMail({
        from: 'noreply@taskify',
        to: req.body.email,
        subject: "Taskify: Weryfikacja konta",
        html: `Kliknij w link aby dokończyć weryfikację konta: <a href="http://localhost:5000/verify?token=${token}">Zweryfikuj konto</a>`
      });
      return res.json(data);
    })
  })
  });
});

db.connect((err) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err);
    return;
  }
  console.log('Połączenie z bazą danych zostało ustanowione');
});


app.post('/login', (req, res) => {
  const sql = process.env.SQL_LOGIN_QUERY;

  db.query(sql, [req.body.email], (err,data) => {
    console.log(data[0]);
    if (err) {
      return res.json("Error");
    }
    if (data.length > 0) {
      bcrypt.compare(req.body.haslo.toString(),data[0].haslo,(err,result)=>{
        if (err) {
          return res.json("Błąd");
        }
        if (result) {
          return res.json("Git")
        } else {
          return res.json("Nie git")
        }
      })
  }}) 
});


app.get('/verify', (req, res) => {
  const { token } = req.query;
  
  jwt.verify(token, tokenKey, (err) => {
    if (err) {
      return res.json({ error: "Weryfikacja nieudana" });
    } else {
      return res.redirect('http://localhost:3000/')
    }
    });
  });


app.get('/projects', (req, res) => {
  db.query('SELECT * FROM projekty', (error, results, fields) => {
    if (error) throw error;
    res.json(results);
  });
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});


//! ALTER TABLE uzytkownik AUTO_INCREMENT = 1; resetowanie auto increment

//     console.log("SQL Query:", sql);
//     console.log(values);                //! W razie debugowania
//     console.log(req.body);
