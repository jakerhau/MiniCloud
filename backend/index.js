import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import mysql from 'mysql2/promise';
import swaggerUi from 'swagger-ui-express';

const app = express();

const ISSUER = process.env.OIDC_ISSUER;
const AUDIENCE = process.env.OIDC_AUDIENCE;
const ALGORITHMS = ['RS256'];

const DB_HOST = process.env.DB_HOST || 'database';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'root';
const DB_NAME = process.env.DB_NAME || 'Mini_Cloud';
const DB_POOL_LIMIT = Number(process.env.DB_POOL_LIMIT || 5);

const missingEnv = Object.entries({ OIDC_ISSUER: ISSUER, OIDC_AUDIENCE: AUDIENCE })
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}


console.log(`OIDC Configuration:`);
console.log(`  ISSUER: ${ISSUER}`);
console.log(`  AUDIENCE: ${AUDIENCE}`);

const JWKS_URI = `${ISSUER.replace(/\/$/, '')}/protocol/openid-connect/certs`;
console.log(`  JWKS URI: ${JWKS_URI}`);

console.log('Database configuration:');
console.log(`  HOST: ${DB_HOST}`);
console.log(`  PORT: ${DB_PORT}`);
console.log(`  USER: ${DB_USER}`);
console.log(`  DB NAME: ${DB_NAME}`);
console.log(`  POOL LIMIT: ${DB_POOL_LIMIT}`);

let dbPool;
const initDbPool = async () => {
  try {
    dbPool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: DB_POOL_LIMIT,
    });
    await dbPool.query('SELECT 1');
    console.log('MySQL connection established');
  } catch (error) {
    console.error('Failed to initialize MySQL pool:', error.message);
  }
};

const getPool = () => {
  if (!dbPool) {
    throw new Error('Database pool not initialized or connection failed');
  }
  return dbPool;
};

initDbPool();

const jwtMiddleware = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: JWKS_URI,
  }),
  audience: AUDIENCE,
  algorithms: ALGORITHMS,
  credentialsRequired: true,
  clockTolerance: 300, // 5 Mins
}).unless({ 
  path: [
    '/hello',
    '/api/student',
    '/api/hello',
    '/health',
    /^\/api-docs.*/,
    '/api/db-test',
    '/api/subjects',
  ]
});

// Error handler for JWT errors
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('JWT Error:', err.message);
    if (err.message.includes('expired')) {
      return res.status(401).json({ error: 'Token has expired', details: err.message });
    }
    if (err.message.includes('invalid token')) {
      return res.status(401).json({ error: 'Invalid token', details: err.message });
    }
    return res.status(401).json({ error: 'Unauthorized', details: err.message });
  }
  next(err);
};

app.use(jwtMiddleware);
app.use(jwtErrorHandler);

// Load OpenAPI spec for Swagger UI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openapiPath = path.join(__dirname, 'openapi.json');
let openapiSpec = {};
try {
  openapiSpec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
} catch (e) {
  console.error('Failed to load openapi.json:', e.message);
}

// Serve Swagger UI at /api-docs with OAuth2 init (Keycloak)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }, null, null, null, {
  clientId: 'swagger-ui',
  appName: 'MiniCloud Swagger UI',
  usePkceWithAuthorizationCodeGrant: true
}));

app.get(['/hello', '/api/hello'], (req, res) => {
  res.json({ message: 'Hello, world!' });
});

app.get(['/secure'], (req, res) => {
  const user = req.auth;

  if (!user) {
    return res.status(500).json({ error: 'Missing auth payload' });
  }

  return res.json({
    message: 'Secure resource OK',
    preferred_username: user.preferred_username,
    email: user.email,
    sub: user.sub,
    iss: user.iss,
    aud: user.aud,
  });
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

app.get('/api/db-test', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT NOW() AS serverTime');
    return res.json({
      connected: true,
      serverTime: rows?.[0]?.serverTime,
    });
  } catch (error) {
    console.error('DB test failed:', error);
    return res.status(500).json({
      error: 'Database connection failed',
      details: error.message,
    });
  }
});

app.get('/api/subjects', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT subject_id AS id, subject_name AS name FROM subjects ORDER BY subject_id ASC',
    );
    return res.json(rows);
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    return res.status(500).json({
      error: 'Failed to read subjects from database',
      details: error.message,
    });
  }
});

app.listen(8081, () => {
  console.log('Backend is running on port 8081');
});
