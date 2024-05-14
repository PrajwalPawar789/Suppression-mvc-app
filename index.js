const express = require('express');
const app = express();
const fileRoutes = require('./routes/fileRoutes');

app.set('view engine', 'ejs');
app.use('/', fileRoutes);

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});