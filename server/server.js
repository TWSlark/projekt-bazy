const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

const tokenKey = process.env.TOKENKEY;

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
      token,
      0,
      null
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

  db.query(sql, [req.body.email], (err, data) => {
    console.log(data[0]);
    if (err) {
      return res.json("Error");
    }
    if (data.length > 0) {
      if (data[0].active === 1) {
        bcrypt.compare(req.body.haslo.toString(), data[0].haslo, (err, result) => {
          if (err) {
            return res.json("Błąd");
          }
          if (result) {
            const refreshToken = jwt.sign({ email: req.body.email }, tokenKey, { expiresIn: '1h' });
            const accessToken = jwt.sign({ email: req.body.email }, tokenKey, { expiresIn: '5m' });
            const updateRefreshToken = "UPDATE uzytkownik SET refreshToken = ? WHERE email = ?";
            db.query(updateRefreshToken, [refreshToken, req.body.email], (updateErr, updateResult) => {
              if (updateErr) {
                return res.json({ error: "Błąd zapisu refreshToken w bazie danych" });
              }
              return res.json({ accessToken, refreshToken });
            });
          } else {
            return res.json("Nie ma takich poswiadczen");
          }
        });
      } else {
        return res.json("Konto nieaktywne");
      }
    }
  });
});

app.get('/verify', (req, res) => {
  const { token } = req.query;
  
  jwt.verify(token, tokenKey, (err, decoded) => {
    if (err) {
      return res.json({ error: "Weryfikacja nieudana" });
    } else {
      const email = decoded.email;
      const updateSql = "UPDATE uzytkownik SET active = 1 WHERE email = ?";

      db.query(updateSql, [email], (updateErr, updateResult) => {
        if (updateErr) {
          return res.json({ error: "Błąd aktualizacji konta" });
        } else {
          return res.redirect('http://localhost:3000/');
        }
      });
    }
  });
});

const verifyAccessToken = (req, res, next) => {
  const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ error: 'Brak accessToken' });
  }

  jwt.verify(accessToken, tokenKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Nieprawidłowy accessToken' });
    }
    req.user = decoded;
    next();
  });
};

app.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Brak refreshToken' });
  }

  jwt.verify(refreshToken, tokenKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Nieprawidłowy refreshToken' });
    }

    const email = decoded.email;

    const checkRefreshToken = "SELECT * FROM uzytkownik WHERE email = ? AND refreshToken = ?";
    db.query(checkRefreshToken, [email, refreshToken], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({ error: 'Problem z bazą - refreshToken' });
      }

      if (checkResult.length === 0) {
        return res.status(403).json({ error: 'Nieprawidłowy refreshToken' });
      }

      const newAccessToken = jwt.sign({ email: email }, tokenKey, { expiresIn: '5m' });
      return res.json({ accessToken: newAccessToken });
    });
  });
});

app.get('/projects', verifyAccessToken, (req, res) => {
  db.query('SELECT * FROM projekty', (error, results, fields) => {
    if (error) throw error;
    res.json(results);
  });
});

app.get('/tasks/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;

  db.query('SELECT * FROM zadania WHERE projekt_id = ?', [projectId], (error, results, fields) => {
    if (error) throw error;
    res.json(results);
  });
});

app.put('/tasks/:taskId', verifyAccessToken, (req, res) => {
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

app.post('/tasks/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;
  const { nazwa, opis, status, priorytet, termin } = req.body;

  const insertQuery = 'INSERT INTO zadania (tytul, opis, status, priorytet, do_kiedy, data_utworzenia, projekt_id) VALUES (?, ?, ?, ?, ?, NOW(), ?)';

  db.query(insertQuery, [nazwa, opis, status, priorytet, termin, projectId], (error, results) => {
    if (error) {
      console.error('Blad dodawania zadania', error);
      res.status(500).json({ error: 'Internal Server Error z /tasks/:projectId' });
    } else {
      res.status(200).json({ message: 'Udane dodanie zadania' });
    }
  });
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});


//! ALTER TABLE uzytkownik AUTO_INCREMENT = 1; resetowanie auto increment

//     console.log("SQL Query:", sql);
//     console.log(values);                //! W razie debugowania
//     console.log(req.body);
