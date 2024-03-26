const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

app.use(cors());

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/', (req, res) => {
  res.redirect('/pulpit');
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});