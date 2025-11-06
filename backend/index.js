import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('This is backend\' root');
});

app.get('/api', (req, res) => {
  res.send('Calling backend API...');
});

app.get(['/hello', '/api/hello'], (req, res) => {
  const data = {
    message: 'Hello from App Server!',
  };
  res.json(data); 
});

app.listen(8081, () => {
  console.log('Backend is running on port 8081');
});