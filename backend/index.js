import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// để build __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
  res.send("This is backend' root");
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

app.get(['/api/student'], (req, res) => {
  const studentsPath = path.join(__dirname, 'students.json');

  fs.readFile(studentsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error when read file:', err);
      return res.status(500).json({ error: 'Failed to read students data' });
    }

    try {
      const students = JSON.parse(data);
      return res.json(students);
    } catch (e) {
      console.error('Error when parse students.json:', e);
      return res.status(500).json({ error: 'Failed to parse students data' });
    }
  });
});

app.listen(8081, () => {
  console.log('Backend is running on port 8081');
});
