const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const salt = 10;

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "taskify",
  port: 3306,
  authPlugin: 'mysql_native_password'
})

app.post('/signup', (req, res) => {
  const sql = "INSERT INTO uzytkownik (`email`, `haslo`, `imie`, `nazwisko`, `data_urodzenia`, `plec`, `typ_konta`) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const password = req.body.haslo;
  bcrypt.hash(password.toString(), salt, (err,hash) =>{
    if (err) {
      console.log(err);
    }
    const values = [
      req.body.email,
      hash,
      req.body.imie,
      req.body.nazwisko,
      req.body.data,
      req.body.plec,
      'manager'
    ];
    console.log("SQL Query:", sql);
    console.log(values);                //! W razie debugowania
    console.log(req.body);
    
    db.query(sql, values, (err,data) => {
      if (err) {
        return res.json("Error");
      }
      return res.json(data);
    })
  })
  
});

db.connect((err) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err);
    return;
  }
  console.log('Połączenie z bazą danych zostało ustanowione');
});


app.post('/login', (req, res) => {
  const sql = "SELECT * FROM uzytkownik WHERE `email` = ?";

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
          const token = jwt.sign({ email: req.body.email }, 'your-secret-key', { expiresIn: '5m' });
          return res.json({ token });
        } else {
          return res.json("Nie git")
        }
      })
  }}) 
});

app.get('/projects', (req, res) => {
  db.query('SELECT * FROM projekty', (error, results, fields) => {
    if (error) throw error;
    res.json(results);
  });
});

app.get('/tasks', (req, res) => {
  db.query('SELECT * FROM zadania', (error, results, fields) => {
    if (error) throw error;
    res.json(results);
  });
});

app.put('/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  const updateQuery = 'UPDATE zadania SET status = ? WHERE zadanie_id = ?';

  db.query(updateQuery, [status, taskId], (error, results) => {
    if (error) {
      console.error('Blad aktualizacji statusu zadania', error);
      res.status(500).json({ error: 'Internal Server Error z /tasks/:taskID' });
    } else {
      res.status(200).json({ message: 'Udana aktualizacja statusu zadania' });
    }
  });
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});


//! ALTER TABLE uzytkownik AUTO_INCREMENT = 1; resetowanie auto increment