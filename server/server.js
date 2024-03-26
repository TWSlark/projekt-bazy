const express = require('express');
const mysql = require('mysql2');
const app = express();
const cors = require('cors');

app.use(cors());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskify'
});

app.get('/projects', (req, res) => {
  connection.query('SELECT * FROM projekty', (error, results, fields) => {
    if (error) throw error;
    res.json(results);
  });
});

app.get('/', (req, res) => {
  res.redirect('/pulpit');
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});