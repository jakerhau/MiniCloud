import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import swaggerUi from 'swagger-ui-express';

const app = express();

const ISSUER = process.env.OIDC_ISSUER;
const AUDIENCE = process.env.OIDC_AUDIENCE;
const ALGORITHMS = ['RS256'];

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
    /^\/api-docs.*/
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

app.listen(8081, () => {
  console.log('Backend is running on port 8081');
});
