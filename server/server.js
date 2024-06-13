const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
const { sequelize, Projekty, Uzytkownik, Zadania, ProjektyUzytkownik } = require('./database.js');
const Sequelize = require('sequelize');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const http = require('http');

const server = http.createServer();
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {});
});

const tokenKey = process.env.TOKENKEY;

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/uploads', express.static('uploads'));

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '/uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('Synchronizacja poprawna, sequelize.');
  })
  .catch(err => {
    console.error('Synchronizacja niepoprawna, sequelize:', err);
});

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

    bcrypt.hash(token, salt, (err,hashToken) =>{
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
      hashToken,
      0,
      null
    ];
    
    db.query("START TRANSACTION", (err) => {
      if (err) {
        console.log("Error starting transaction", err);
        return res.json("Error");
      }

      db.query(sql, values, (err, data) => {
        if (err) {
          console.log(err);
          db.query("ROLLBACK", (rollbackErr) => {
            if (rollbackErr) {
              console.log("Rollback, rejestracja", rollbackErr);
            }
            return res.json("Error");
          });
        } else {
          transport.sendMail({
            from: 'noreply@taskify',
            to: req.body.email,
            subject: "Taskify: Weryfikacja konta",
            html: `Kliknij w link aby dokończyć weryfikację konta: <a href="http://localhost:5000/verify?hashToken=${hashToken}">Zweryfikuj konto</a>`
          }, (mailErr, info) => {
            if (mailErr) {
              console.log("Nie wyslano maila", mailErr);
              db.query("ROLLBACK", (rollbackErr) => {
                if (rollbackErr) {
                  console.log("Rollback, rejestracja", rollbackErr);
                }
                return res.json("Error");
              });
            } else {
              db.query("COMMIT", (commitErr) => {
                if (commitErr) {
                  console.log("Rollback, rejestracja", commitErr);
                  return res.json("Error");
                }
                return res.json(data);
              });
            }
          });
        }
      });
    });
  });
});
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
    //console.log(data[0]);
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
            const accessToken = jwt.sign({ email: req.body.email }, tokenKey, { expiresIn: '15m' });
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
  const { hashToken } = req.query;
  //console.log(hashToken);
  const searchSql = "SELECT email, token FROM uzytkownik WHERE `token` = ?"

  db.query(searchSql,[hashToken], (err,result)=>{
    if (err) {
      return res.json({ error: "Błąd szukania użytkownika" });
    }
    //console.log(result[0])

    if (result.length>0) {

      const user = result[0];

      if (user.token === hashToken) {
        
      const updateSql = "UPDATE uzytkownik SET active = 1 WHERE email = ?";

      db.query(updateSql, [user.email], (updateErr, updateResult) => {
        if (updateErr) {
          return res.json({ error: "Błąd aktualizacji konta" });
        } else {
          return res.redirect('http://localhost:3000/');
        }
      });
      }
    }
  })
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
    io.emit('refreshToken');
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

    const checkRefreshToken = "SELECT active FROM uzytkownik WHERE email = ? AND refreshToken = ?";
    db.query(checkRefreshToken, [email, refreshToken], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({ error: 'Problem z bazą - refreshToken' });
      }

      if (checkResult.length === 0) {
        return res.status(403).json({ error: 'Nieprawidłowy refreshToken' });
      }

      const newAccessToken = jwt.sign({ email: email }, tokenKey, { expiresIn: '15m' });
      return res.json({ accessToken: newAccessToken });
    });
  });
});

app.put('/logout', (req, res) => {
  const authHeader = req.headers.authorization;

    let userEmail = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const decoded = jwt.verify(token, tokenKey);
      userEmail = decoded.email;
    }

    const querry = 'UPDATE uzytkownik SET refreshToken = NULL WHERE email = ?';

    db.query(querry, [userEmail], (error, results) => {
      if (error) {
        console.error('Blad wylogowania', error);
        res.status(500).json({ error: 'Internal Server Error z /logout' });
      } else {
        res.status(200).json({ message: 'Udane wylogowanie' });
      }
    });
});

app.get('/manager', verifyAccessToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    let userEmail = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const decoded = jwt.verify(token, tokenKey);
      userEmail = decoded.email;
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'Brak tokena' });
    }

    const user = await Uzytkownik.findOne({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono uzytkownika' });
    }

    const query = 'SELECT p.* FROM projekty p JOIN projekty_uzytkownik pu ON p.projekt_id = pu.projekt_id WHERE pu.uzytkownik_id = :userId AND pu.manager = 1;';

    const projects = await sequelize.query(query, {
      replacements: { userId: user.uzytkownik_id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json(projects);
  } catch (error) {
    console.error('Internal server error z /projects', error);
    res.status(500).json({ error: 'Internal server error z /projects' });
  }
});

app.get('/isAssociated/:projectId', verifyAccessToken, async (req, res) => {
  const { projectId } = req.params;
  const authHeader = req.headers.authorization;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }

  querry = 'SELECT * FROM projekty_uzytkownik WHERE projekt_id = ? AND uzytkownik_id = (SELECT uzytkownik_id FROM uzytkownik WHERE email = ?)';

  db.query(querry, [projectId, userEmail], (error, results) => {
    if (error) {
      console.error('Blad sprawdzania przypisania uzytkownika do projektu', error);
      res.status(500).json({ error: 'Internal Server Error z /isAssociated/:projectId' });
    } else {
      res.json({ isAssociated: results.length > 0 });
    }
  });
});

app.get('/projects', verifyAccessToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    let userEmail = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const decoded = jwt.verify(token, tokenKey);
      userEmail = decoded.email;
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'Brak tokena' });
    }

    const user = await Uzytkownik.findOne({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono uzytkownika' });
    }

    const projects = await Projekty.findAll({
      include: [{
        model: Uzytkownik,
        where: { uzytkownik_id: user.uzytkownik_id },
      },
      {
        model: Zadania,
        attributes: ['zadanie_id', 'status']
      }]
    });

    res.json(projects);
  } catch (error) {
    console.error('Internal server error z /projects', error);
    res.status(500).json({ error: 'Internal server error z /projects' });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { title } = req.body;
    const authHeader = req.headers.authorization;

    let userEmail = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const decoded = jwt.verify(token, tokenKey);
      userEmail = decoded.email;
    }

    const newProject = await Projekty.create({ tytul: title });

    if (userEmail) {
      const user = await Uzytkownik.findOne({ where: { email: userEmail } });
      if (user) {
        await user.addProjekty(newProject, { through: { manager: 1 } });
      } else {
        console.error('Nie znaleziono uzytkownika');
      }
    }

    io.emit('projectUpdate');
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Nie stworzono projektu:', error);
    res.status(500).json({ error: 'Nie stworzono projektu' });
  }
});

app.delete('/projects/:projectId', verifyAccessToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const authHeader = req.headers.authorization;
    let userEmail = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const decoded = jwt.verify(token, tokenKey);
      userEmail = decoded.email;
    }

    const isManagerQuery = 'SELECT manager FROM projekty_uzytkownik WHERE projekt_id = ? AND uzytkownik_id = (SELECT uzytkownik_id FROM uzytkownik WHERE email = ?)';

    db.query(isManagerQuery, [projectId, userEmail], (error, results) => {
      if (error) {
        console.error('Błąd sprawdzania czy użytkownik jest managerem projektu', error);
        return res.status(500).json({ error: 'Błąd sprawdzania czy użytkownik jest managerem projektu' });
      }

      if (results.length === 0 || results[0].manager !== 1) {
        return res.status(403).json({ error: 'Brak uprawnień do usunięcia projektu' });
      }

      const querry = 'DELETE FROM projekty WHERE projekt_id = ?';

      db.query(querry, [projectId], (error, results) => {
        if (error) {
          console.error('Nie usunięto projektu:', error);
          res.status(500).json({ error: 'Nie usunięto projektu' });
        } else {
          io.emit('projectUpdate');
          res.status(200).json({ message: 'Projekt usunięty' });
        }
      });
    });
  } catch (error) {
    console.error('Nie usunięto projektu:', error);
    res.status(500).json({ error: 'Nie usunięto projektu' });
  }
});

app.get('/tasks/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;
  const authHeader = req.headers.authorization;
  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }

  const usersQuery = 'SELECT uzytkownik_id, imie, nazwisko FROM uzytkownik WHERE uzytkownik_id IN (SELECT uzytkownik_id FROM projekty_uzytkownik WHERE projekt_id = ?)';
  db.query(usersQuery, [projectId, userEmail], (error, usersData) => {
    if (error) {
      console.error('Blad pobierania uzytkownikow z projektu', error);
      res.status(500).json({ error: 'Internal Server Error z /tasks/:projectId' });
    } else {
      const users = usersData.map(user => ({ uzytkownik_id: user.uzytkownik_id, imie: user.imie, nazwisko: user.nazwisko }));

      const proceduraQuery = `CALL pozostaly_czas(?)`;
      db.query(proceduraQuery, [projectId], (error, tasksProcedura, fields) => {
        if (error) {
          console.error('Blad pobierania zadan', error);
          res.status(500).json({ error: 'Internal Server Error z /tasks/:projectId' });
        } else {
          db.query("SELECT * FROM zadania WHERE projekt_id = ?", [projectId], (error, tasksData) => {
            if (error) {
              console.error('Blad pobierania zadan', error);
              res.status(500).json({ error: 'Internal Server Error z /tasks/:projectId' });
            } else {
              const tasks = tasksData.map(task => {
                const procedura = tasksProcedura[0].find(t => t.zadanie_id === task.zadanie_id);
                return {
                  zadanie_id: task.zadanie_id,
                  tytul: task.tytul,
                  opis: task.opis,
                  status: task.status,
                  priorytet: task.priorytet,
                  do_kiedy: task.do_kiedy,
                  szacowany_czas: task.szacowany_czas,
                  pozostaly_czas: procedura.pozostaly_czas,
                  uzytkownik_id: task.uzytkownik_id
                };
              });
              //console.log(tasks);
              res.json({ tasks, users });
            }
          });
        }
      });
    }
  });
});

app.get('/tasks/:projectId/:taskId', verifyAccessToken, (req, res) => {
  const { projectId, taskId } = req.params;

  db.query('SELECT * FROM zadania WHERE projekt_id = ? AND zadanie_id = ?', [projectId,taskId], (error, results, fields) => {
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
      io.emit('taskUpdate', { action: 'create/update/delete' });
      res.status(200).json({ message: 'Udana aktualizacja statusu zadania' });
    }
  });
});

app.post('/tasks/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;
  const { nazwa, opis, status, godziny, minuty, priorytet, termin } = req.body;

  const szacowanyCzas = `${godziny}` + ':' + `${minuty}` + ':' + '00';

  const insertQuery = 'INSERT INTO zadania (tytul, opis, status, priorytet, do_kiedy, data_utworzenia, szacowany_czas, projekt_id) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)';

  db.query(insertQuery, [nazwa, opis, status, priorytet, termin, szacowanyCzas, projectId], (error, results) => {
    if (error) {
      console.error('Blad dodawania zadania', error);
      res.status(500).json({ error: 'Internal Server Error z /tasks/:projectId' });
    } else {
      io.emit('taskUpdate', { action: 'create/update/delete' });
      res.status(200).json({ message: 'Udane dodanie zadania' });
    }
  });
});

app.delete('/tasks/:taskId', verifyAccessToken, (req, res) => {
  const { taskId } = req.params;

  const deleteQuery = 'DELETE FROM zadania WHERE zadanie_id = ?';

  db.query(deleteQuery, [taskId], (error, results) => {
    if (error) {
      console.error('Blad usuwania zadania', error);
      res.status(500).json({ error: 'Internal Server Error z /tasks/:taskId' });
    } else {
      io.emit('taskUpdate', { action: 'create/update/delete' });
      res.status(200).json({ message: 'Udane usuniecie zadania' });
    }
  });
});

app.put('/tasks/:taskId/assign', verifyAccessToken, async (req, res) => {
  const { taskId } = req.params;
  const authHeader = req.headers.authorization;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }

  try {
    const findUserQuery = 'SELECT uzytkownik_id FROM uzytkownik WHERE email = ?';
    const [userResult] = await db.promise().query(findUserQuery, [userEmail]);
    const userId = userResult[0]?.uzytkownik_id;

    const updateQuery = 'UPDATE zadania SET uzytkownik_id = ?, rozpoczecie_pracy = NOW(), zakonczenie_pracy = NULL WHERE zadanie_id = ?';
    db.query(updateQuery, [userId, taskId]);

    res.status(200).json({ message: 'Zadanie przypisane do uzytkownika' });
  } catch (error) {
    console.error('Nie udalo sie przypisac zadania do uzytkownika', error);
    res.status(500).json({ error: 'Internal server error z /tasks/:taskId/assign' });
  }
});

app.put('/tasks/:taskId/unassign', verifyAccessToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    const updateQuery = 'UPDATE zadania SET rozpoczecie_pracy = NULL, zakonczenie_pracy = NULL WHERE zadanie_id = ?';
    db.query(updateQuery, [taskId]);

    res.status(200).json({ message: 'Reset przypisane do uzytkownika' });
  } catch (error) {
    console.error('Reset udalo sie przypisac zadania do uzytkownika', error);
    res.status(500).json({ error: 'Internal server error z /tasks/:taskId/unassign' });
  }
});

app.put('/tasks/:taskId/complete', verifyAccessToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    const updateQuery = 'UPDATE zadania SET zakonczenie_pracy = CURRENT_TIMESTAMP WHERE zadanie_id = ?';
    db.query(updateQuery, [taskId]);

    res.status(200).json({ message: 'Task completion date updated successfully' });
  } catch (error) {
    console.error('Error updating task completion date', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/kalendarz', verifyAccessToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    let userEmail = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const decoded = jwt.verify(token, tokenKey);
      userEmail = decoded.email;
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'Brak tokena' });
    }

    const user = await Uzytkownik.findOne({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono uzytkownika' });
    }

    const projects = await Projekty.findAll({
      include: {
        model: Uzytkownik,
        where: { uzytkownik_id: user.uzytkownik_id },
        through: { attributes: [] }
      }
    });

    const projectIds = projects.map(project => project.projekt_id);

    const tasks = await Zadania.findAll({
      where: { projekt_id: projectIds }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Internal server error z /kalendarz', error);
    res.status(500).json({ error: 'Internal server error z /kalendarz' });
  }
});

app.get('/members', (req, res) => {

  const {sortCol, sortOrd} = req.query;

  const col = sortCol || 'imie';
  const order = sortOrd === 'DESC' ? 'DESC' : 'ASC';

  const membersQuery = `SELECT uzytkownik_id, imie, nazwisko nazw, YEAR(CURRENT_DATE) - YEAR(data_urodzenia) wiek from uzytkownik ORDER BY ${col} ${order};`;

  db.query(membersQuery, (error, results) => {
    if (error) {
      console.error('Błąd pobierania użytkowników z bazy danych', error);
      res.status(500).json({ error: 'Błąd pobierania użytkowników z bazy danych' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.post('/assign', (req, res) => {
  const { userId, projectTytul } = req.body;

  const assignQuery = 'INSERT INTO projekty_uzytkownik (uzytkownik_id, projekt_id) VALUES (?, (SELECT projekt_id FROM projekty WHERE tytul = ?))';

  db.query(assignQuery, [userId, projectTytul], (error, results) => {
    if (error) {
      console.error('Błąd przypisywania użytkownika do projektu', error);
      res.status(500).json({ error: 'Błąd przypisywania użytkownika do projektu' });
    } else {
      res.status(200).json({ message: 'Udane przypisanie użytkownika do projektu' });
    }
  }
  );
});

app.delete('/assign/:projectId/:userId', verifyAccessToken, (req, res) => {
  const { projectId, userId } = req.params;

  let email;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    email = decoded.email;
  }

  const isManagerQuery = 'SELECT manager FROM projekty_uzytkownik WHERE projekt_id = ? AND uzytkownik_id = (SELECT uzytkownik_id FROM uzytkownik WHERE email = ?)';

  db.query(isManagerQuery, [projectId, email], (error, results) => {
    if (error) {
      console.error('Błąd sprawdzania czy użytkownik jest managerem projektu', error);
      return res.status(500).json({ error: 'Błąd sprawdzania czy użytkownik jest managerem projektu' });
    }

    if (results.length === 0 || results[0].manager !== 1) {
      return res.status(403).json({ error: 'Brak uprawnień do usunięcia użytkownika z projektu' });
    }

    const deleteQuery = 'DELETE FROM projekty_uzytkownik WHERE projekt_id = ? AND uzytkownik_id = ? AND manager = 0';

    db.query(deleteQuery, [projectId, userId], (error, results) => {
      if (error) {
        console.error('Błąd usuwania użytkownika z projektu', error);
        res.status(500).json({ error: 'Błąd usuwania użytkownika z projektu' });
      } else {
        res.status(200).json({ message: 'Udane usunięcie użytkownika z projektu' });
      }
    });
  });
});

app.get('/zadania', verifyAccessToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    let userEmail = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const decoded = jwt.verify(token, tokenKey);
      userEmail = decoded.email;
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'Brak tokena' });
    }

    const user = await Uzytkownik.findOne({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono uzytkownika' });
    }
    const {column, order} = req.query;

    const sortCol = column || 'z.tytul';
    const sortOrd = order === 'DESC' ? 'DESC' : 'ASC';
    const zadaniaQuery = `SELECT z.tytul nazwzad, p.tytul nazwproj, z.do_kiedy, z.data_utworzenia FROM zadania z JOIN projekty p ON z.projekt_id = p.projekt_id order by ${sortCol} ${sortOrd};`;
  
    db.query(zadaniaQuery, (error, results) => {
      if (error) {
        console.error('Błąd pobierania zadań z bazy danych', error);
        res.status(500).json({ error: 'Błąd pobierania zadań z bazy danych' });
      } else {
        res.status(200).json(results);
      }
    });
    
  } catch (error) {
    console.error('Internal server error z /zadania', error);
    res.status(500).json({ error: 'Internal server error z /zadania' });
  }
});

app.get('/comments/:taskId', verifyAccessToken, (req, res) => {
  const taskId = req.params.taskId;

  const commentsQuery = 'SELECT k.komentarz_id, k.komentarz, k.data, u.imie, u.nazwisko FROM komentarze k JOIN uzytkownik u ON u.uzytkownik_id = k.uzytkownik_id WHERE zadanie_id = ?;';

  db.query(commentsQuery, [taskId], (error, results) => {
    if (error) {
      console.error('Błąd pobierania komentarzy', error);
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/files/:taskId', verifyAccessToken, (req, res) => {
  const taskId = req.params.taskId;

  const filesQuery = 'SELECT zalacznik_id id, nazwa_pliku nazwa, sciezka_pliku sciezka FROM zalaczniki WHERE zadanie_id = ?;';

  db.query(filesQuery, [taskId], (error, results) => {
    if (error) {
      console.error('Błąd pobierania plików', error);
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/download/:nazwa', (req, res) => {
  const nazwaPliku = req.params.nazwa;
  const sciezkaFolderu = path.join(__dirname, 'uploads');
  const sciezkaPliku = path.join(sciezkaFolderu, nazwaPliku);

  res.setHeader('Content-Disposition', 'attachment; filename=' + nazwaPliku);
  res.setHeader('Content-Type', 'application/octet-stream');

  res.download(sciezkaPliku, nazwaPliku, (err) => {
    if (err) {
      console.error('Wystąpił błąd podczas pobierania pliku:', err);
      res.status(500).send('Nie można pobrać pliku.');
    }
  });
});

app.post('/comments', verifyAccessToken, (req, res) => {
  const authHeader = req.headers.authorization;
  const {komentarz, zadanie_id} = req.body;
  //console.log(req.body);

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }

  const userSql = "SELECT uzytkownik_id FROM uzytkownik WHERE email=?;";
  let userId = null;
  
  db.query(userSql, [userEmail], (err, userRes) => {
    if (err) {
      return res.json("Błąd pobierania id usera");
    }
    
    userId = userRes[0].uzytkownik_id;

    const sql = 'INSERT INTO komentarze (komentarz, data, zadanie_id, uzytkownik_id) VALUES (?, NOW(), ?, ?)';

    db.query(sql, [komentarz, zadanie_id, userId], (err, data) => {
      if (err) {
        return res.json("Błąd dodawania komentarza (serwer)");
      }
    });
  });
  
});

const upload = multer({ storage: storage });

app.post('/upload/:taskId', upload.single('file'), verifyAccessToken, async (req, res) => {
  const authHeader = req.headers.authorization;
  let userEmail = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }

  if (!userEmail) {
    return res.status(401).json({ error: 'Brak tokena' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Brak pliku (serwer)' });
  }

  const zadanie_id = req.params.taskId;
  const danePliku = {
    nazwa_pliku: req.file.filename,
    sciezka_pliku: `http://localhost:5000/uploads/${req.file.filename}`
  };

  try {
    const sql = 'INSERT INTO zalaczniki (nazwa_pliku, sciezka_pliku, zadanie_id) VALUES (?, ?, ?)';
    db.query(sql, [danePliku.nazwa_pliku, danePliku.sciezka_pliku, zadanie_id], (err, data) => {
      if (err) {
        console.error('Błąd przy zapisie do bazy:', err);
        return res.status(500).json({ error: 'Error przy zapisie do bazy' });
      }
      res.json("Plik przesłano pomyślnie");
    });
  } catch (err) {
    console.error("Błąd przy zapisie do bazy ", err);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
});


app.get('/profil', verifyAccessToken, (req, res) => {
  const authHeader = req.headers.authorization;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }

  if (!userEmail) {
    return res.status(401).json({ error: 'Brak tokena' });
  }

  const sql = "SELECT u.email, u.imie, u.nazwisko, DATE_FORMAT(u.data_urodzenia, '%d-%m-%Y') AS data_urodzenia, u.plec, COUNT(pu.projekt_id) AS liczba_projektow " +
              "FROM uzytkownik u LEFT JOIN projekty_uzytkownik pu ON u.uzytkownik_id = pu.uzytkownik_id WHERE u.email = ? GROUP BY u.uzytkownik_id;";

  db.query(sql, [userEmail], (err, data) => {
    if (err) {
      return res.json("Error");
    }
    res.json(data[0]);
  });
});

app.put('/updateProfil', verifyAccessToken, async(req, res) => {
  const authHeader = req.headers.authorization;
  const { imie, nazwisko, data_urodzenia, plec } = req.body;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }

  try {
    const updateProfileSql = "UPDATE uzytkownik SET imie=?, nazwisko=?, data_urodzenia=?, plec=? WHERE email = ?;";
    db.query(updateProfileSql, [imie, nazwisko, data_urodzenia, plec, userEmail], (err, result) => {
      if (err) {
        console.error('Błąd przy aktualizacji profilu:', err);
        return res.status(500).send('Wewnętrzny błąd serwera');
      }
      res.status(200).send('Dane zostały zaktualizowane');
    });
  } catch (error) {
    console.error('Błąd przy aktualizacji profilu:', error);
    res.status(500).send('Wewnętrzny błąd serwera');
  }
});

app.post('/requestNewPass', (req, res) => {

  const {email} = req.body;
  //console.log(email);
  
  const sql = "SELECT IsUser(?) as IsUser;";

  db.query(sql,[email],(err,result)=>{
    if (err) {
      console.error('Błąd pobierania użytkownika', err);
    } 

    if (result[0].IsUser === 0) {
      console.error('Użytkownik nie znaleziony');
      return res.status(404);
    }

    bcrypt.genSalt(10, (err, salt)=>{
      if (err) {
        console.log("Błąd generowania soli", err);
        return;
      }
    const userEmail = email;
    const token = jwt.sign({email: userEmail},tokenKey,{ expiresIn: '30min' });

    bcrypt.hash(token, salt, (err,hashedToken) =>{
      if (err) {
        console.log(err);
      }
      const sql = "UPDATE uzytkownik SET passToken = ? WHERE email = ?;";

      db.query(sql, [hashedToken,userEmail], (err,data) => {
        if (err) {
          console.log(err);
          return res.json("Error");
        }
      transport.sendMail({
        from: 'noreply@taskify',
        to: userEmail,
        subject: "Taskify: Zmiana hasła użytkownika",
        html: `Kliknij w link aby zmienić swoje hasło: <a href="http://localhost:5000/changePass?hashToken=${hashedToken}">Zmień hasło</a>`
      });
    });
  })
})
})
})

app.get('/changePass', (req, res) => {
  const { hashToken } = req.query;
  const searchSql = "SELECT passToken, email FROM uzytkownik WHERE `passToken` = ?"

  db.query(searchSql,[hashToken], (err,result)=>{
    if (err) {
      return res.json({ error: "Błąd szukania użytkownika" });
    }
    if (result.length>0) {

      const userToken = result[0].passToken;
      const userEmail = result[0].email

      if (userToken === hashToken) {
        res.redirect(`http://localhost:3000/zmianahasla?userToken=${encodeURIComponent(userToken)}`);
      }
    }
  })
});


app.post('/newPass', (req, res) => {

  const authHeader = req.headers.authorization;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Brak tokena' });
  }
  
  const { newHaslo } = req.body
  //console.log('req.body: ', req.body);
  //console.log('userEmail : ', userEmail );
  const sql = process.env.SQL_LOGIN_QUERY;

  db.query(sql, [userEmail], (err, data) => {
    if (err) {
      return res.json("Error");
    }
    if (data.length > 0) {
          bcrypt.genSalt(10, (err, salt) => {
            if (err) {
              console.log("Błąd generowania soli", err);
              return;
            }
            bcrypt.hash(newHaslo.toString(), salt, (err, hash) => {
              if (err) {
                console.log(err);
              }
              const setNewPassQuery = "UPDATE uzytkownik SET haslo = ? WHERE email = ?";
              db.query(setNewPassQuery, [hash, userEmail], (updateErr, updateResult) => {
                if (updateErr) {
                  return res.json({ error: "Błąd zapisu refreshToken w bazie danych" });
                }
                res.json({ success: "Hasło zostało zaktualizowane" });
              });           
            });
          });
        }
      });
    })

app.get('/time/:taskId', verifyAccessToken, (req, res) => {
  const taskId = req.params.taskId;

  const procedure = 'call czas(?);';

  db.query(procedure, [taskId], (error, results) => {
    if (error) {
      console.error('Błąd pobierania czasów użytkowników', error);
    } else {
      res.status(200).json(results);
    }
  });
});

app.post('/reqnewEmail', (req, res) => {

  const {email} = req.body;
  //console.log("email użytkownik",email);
  
  const sql = "SELECT IsUser(?) as IsUser;";

  db.query(sql,[email],(err,result)=>{
    if (err) {
      console.error('Błąd pobierania użytkownika', err);
    } 
    
    if (result[0].IsUser === 0) {
      console.error('Użytkownik nie znaleziony');
      return res.status(404);
    }
    bcrypt.genSalt(10, (err, salt)=>{
      if (err) {
        console.log("Błąd generowania soli", err);
        return;
      }
    const userEmail = email;
    const token = jwt.sign({email: userEmail},tokenKey,{ expiresIn: '30min' });

    bcrypt.hash(token, salt, (err,hashedToken) =>{
      if (err) {
        console.log(err);
      }
      const sql = "UPDATE uzytkownik SET passToken = ? WHERE email = ?;";

      db.query(sql, [hashedToken,userEmail], (err,data) => {
        if (err) {
          console.log(err);
          return res.json("Error");
        }
        res.json({ url: `http://localhost:5000/changeEmail?hashToken=${encodeURIComponent(hashedToken)}` });
      });
    });
  })
})
})

app.get('/changeEmail', (req, res) => {
  const { hashToken } = req.query;
  const searchSql = "SELECT passToken FROM uzytkownik WHERE `passToken` = ?"

  db.query(searchSql,[hashToken], (err,result)=>{
    if (err) {
      return res.json({ error: "Błąd szukania użytkownika" });
    }
    if (result.length>0) {

      const userToken = result[0].passToken;

      if (userToken === hashToken) {
        res.redirect(`http://localhost:3000/zmianaemail?userToken=${encodeURIComponent(userToken)}`);
      }
    }
  })
});

app.post('/newEmail', (req, res) => {
  
  const authHeader = req.headers.authorization;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Brak tokena' });
  }
  
  const { newEmail, haslo } = req.body
  //console.log('req.body: ', req.body);
  const sql = process.env.SQL_LOGIN_QUERY;

  db.query(sql, [userEmail], (err, data) => {
    if (err) {
      return res.json("Error");
    }
    if (data.length > 0) {
      bcrypt.compare(haslo.toString(), data[0].haslo, (err, result) => {
        if (err) {
          return res.json("Błąd");
        }
        if (result) {
          const setNewPassQuery = "UPDATE uzytkownik SET email = ? WHERE email = ?";
        db.query(setNewPassQuery, [newEmail, userEmail], (updateErr, updateResult) => {
          if (updateErr) {
            return res.json({ error: "Błąd zmiany email" });
          }
          res.json({ success: "Email został zaktualizowany" });
        }); 
        } else {
          return res.json({ error: "Błędne hasło" });
        }
      })
    }          
  });
});

app.get('/logi/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;

  const querry = "SELECT l.*, z.tytul, u.imie, u.nazwisko FROM logi l JOIN zadania z ON l.zadanie_id = z.zadanie_id JOIN projekty p ON z.projekt_id = p.projekt_id LEFT JOIN uzytkownik u ON l.uzytkownik_id = u.uzytkownik_id WHERE p.projekt_id = ? ORDER BY l.log_id DESC;";
  db.query(querry, [projectId], (error, results) => {
    if (error) {
      console.error('Błąd pobierania logów', error);
      res.status(500).json({ error: 'Internal Server Error z /logi/:taskId' });
    } else {
      const logi = results.map((row) => ({
        log_id: row.log_id,
        status: row.status,
        tytul: row.tytul,
        czas_rozpoczecia: row.czas_rozpoczecia,
        czas_zakonczenia: row.czas_zakonczenia,
        zadanie_id: row.zadanie_id,
        uzytkownik_id: row.uzytkownik_id,
        imie: row.imie,
        nazwisko: row.nazwisko,
      }));

      //console.log(logi);
      res.json({ logi: logi });
    }
  });
});

app.get('/logi2/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;

  const querry = `
    SELECT
        u.imie,
        u.nazwisko,
        z.tytul,
        pp.zadanie_id,
        pp.czas_rozpoczecia,
        pp.czas_zakonczenia,
        TIMESTAMPDIFF(SECOND, pp.czas_rozpoczecia, pp.czas_zakonczenia) AS czas_trwania,
        p.data_utworzenia AS data_utworzenia_projektu
    FROM (
        SELECT
            logi.uzytkownik_id,
            logi.zadanie_id,
            logi.czas_rozpoczecia,
            LEAD(logi.czas_zakonczenia) OVER (
                PARTITION BY logi.uzytkownik_id, logi.zadanie_id ORDER BY logi.log_id
            ) AS czas_zakonczenia
        FROM logi
    ) AS pp
    JOIN zadania z ON pp.zadanie_id = z.zadanie_id
    JOIN uzytkownik u ON pp.uzytkownik_id = u.uzytkownik_id
    JOIN projekty p ON z.projekt_id = p.projekt_id
    WHERE pp.czas_zakonczenia IS NOT NULL
    AND z.projekt_id = ?;`;

  db.query(querry, [projectId], (error, results) => {
    if (error) {
      console.error('Błąd pobierania logów', error);
      res.status(500).json({ error: 'Internal Server Error z /logi/:taskId' });
    } else {
      const logi = results.map((row) => ({
        imie: row.imie,
        nazwisko: row.nazwisko,
        zadanie_id: row.zadanie_id,
        tytul: row.tytul,
        czas_rozpoczecia: row.czas_rozpoczecia,
        czas_zakonczenia: row.czas_zakonczenia,
        czas_trwania: row.czas_trwania,
        data_utworzenia_projektu: row.data_utworzenia_projektu
      }));

      res.json({ logi: logi });
    }
  });
});

app.get('/raport/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;

  const raportQuery = 'CALL raport(?)';
  const zadaniaQuery = `
    SELECT z.tytul, z.zadanie_id, COUNT(DISTINCT k.komentarz_id) AS komentarzy, COUNT(DISTINCT zal.zalacznik_id) AS zalacznikow 
    FROM zadania z 
    LEFT JOIN komentarze k ON z.zadanie_id = k.zadanie_id 
    LEFT JOIN zalaczniki zal ON z.zadanie_id = zal.zadanie_id 
    WHERE z.projekt_id = ?
    GROUP BY z.tytul, z.zadanie_id;`;

  db.query(raportQuery, [projectId], (error, results) => {
    if (error) {
      console.error('Błąd pobierania raportu', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    db.query(zadaniaQuery, [projectId], (error, results3) => {
      if (error) {
        console.error('Błąd pobierania raportu', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      const raport = results[0];
      const zadania = results3;

      res.json({ raport, zadania });
    });
  });
});

app.get('/raport2', verifyAccessToken, (req, res) => {

  const authHeader = req.headers.authorization;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Brak tokena' });
  }

  const userIdQuery = 'SELECT uzytkownik_id FROM uzytkownik WHERE email = ?';

  const raportQuery = 'CALL raport2(?)';

  db.query(userIdQuery, [userEmail], (error, results) => {
    if (error) {
      console.error('Błąd pobierania id użytkownika', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const userId = results[0].uzytkownik_id;

    db.query(raportQuery, [userId], (error, results2) => {
      if (error) {
        console.error('Błąd pobierania raportu', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      res.json(results2);
    });
  });
});

app.get('/userId', verifyAccessToken, (req, res) => {
  const authHeader = req.headers.authorization;

  let userEmail = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwt.verify(token, tokenKey);
    userEmail = decoded.email;
  }
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Brak tokena' });
  }

  const userIdQuery = 'SELECT uzytkownik_id FROM uzytkownik WHERE email = ?';

  db.query(userIdQuery, [userEmail], (error, results) => {
    if (error) {
      console.error('Błąd pobierania id użytkownika', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.json(results[0]);
  });
});

app.post('/sendMessage', verifyAccessToken, (req, res) => {
  const { tresc, uzytkownik_id, projekt_id } = req.body;

  if (!tresc || !uzytkownik_id || !projekt_id) {
    console.error('Invalid message data:', { tresc, uzytkownik_id, projekt_id });
    return res.status(400).json({ error: 'Invalid message data' });
  }

  const infoQuery = 'SELECT u.imie, u.nazwisko FROM uzytkownik u WHERE uzytkownik_id = ?';
  const insertMessageSql = 'INSERT INTO wiadomosci (tresc, uzytkownik_id, projekt_id) VALUES (?, ?, ?)';

  db.query(infoQuery, [uzytkownik_id], (err, result) => {
    if (err) {
      console.error('Error fetching user info:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      console.error('User not found with ID:', uzytkownik_id);
      return res.status(404).json({ error: 'User not found' });
    }

    const { imie, nazwisko } = result[0];

    db.query(insertMessageSql, [tresc, uzytkownik_id, projekt_id], (err, result) => {
      if (err) {
        console.error('Error inserting message:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const newMessage = { tresc, imie, nazwisko, uzytkownik_id, projekt_id };
      io.emit('receiveMessage', newMessage);

      res.status(200).json({ success: true, messageId: result.insertId });
    });
  });
});

app.get('/messages/:projectId', verifyAccessToken, (req, res) => {
  const { projectId } = req.params;

  const messagesSql = 'SELECT w.wiadomosc_id, w.tresc, w.data_utworzenia, u.imie, u.nazwisko FROM wiadomosci w JOIN uzytkownik u ON w.uzytkownik_id = u.uzytkownik_id WHERE w.projekt_id = ? ORDER BY w.data_utworzenia ASC';
  db.query(messagesSql, [projectId], (err, messages) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(messages);
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});


app.listen(5000, () => {
    console.log('Server is running on port 5000');
});


//* ALTER TABLE uzytkownik AUTO_INCREMENT = 1; resetowanie auto increment


//TODO Dodać reload po utworzeniu projektu
//TODO Dodać reszte zapytań do .env