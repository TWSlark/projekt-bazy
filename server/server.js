const express = require('express');
const mysql = require('mysql2');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');

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
  const sql = "INSERT INTO uzytkownik (`email`, `haslo`, `imie`, `nazwisko`, `data_urodzenia`, `plec`, `typ_konta`) VALUES (?, ?, ?, ?, ?, ?, 'manager');";
  const values = [
    req.body.email,
    req.body.haslo,
    req.body.imie,
    req.body.nazwisko,
    req.body.data,
    req.body.plec,
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
});

db.connect((err) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err);
    return;
  }
  console.log('Połączenie z bazą danych zostało ustanowione');
});


app.post('/login', (req, res) => {
  const sql = "SELECT * FROM uzytkownik WHERE `email` = ? AND `haslo` = BINARY ?";

  db.query(sql, [req.body.email, req.body.haslo], (err,data) => {
    if (err) {
      return res.json("Error");
    }
    if (data.length > 0) {
      return res.json("Git");
    } else {
      return res.json("Nie git");
    }
  })
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