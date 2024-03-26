const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());

app.get('/', (req, res) => {
  res.redirect('/pulpit');
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});