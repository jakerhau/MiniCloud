import express from 'express';

const app = express();

app.get('/hello', (req, res) => {
  res.send('Hello World');
});


app.listen(8081, () => {
  console.log('Backend is running on port 8081');
});