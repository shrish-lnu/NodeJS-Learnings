// Exercise 4: A simple HTTP server — no Express, just Node's built-in http module

const http = require('http');

const PORT = 3000;

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function handleHealth(res) {
  sendJSON(res, 200, { status: 'ok', time: new Date().toISOString() });
}

async function handleEcho(req, res) {
  try {
    const body = await readBody(req);

    if (!body) {
      sendJSON(res, 400, { error: 'Body is empty' });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      sendJSON(res, 400, { error: 'Not valid JSON' });
      return;
    }

    sendJSON(res, 200, { echo: parsed });
  } catch (err) {
    console.error('Echo error:', err.message);
    sendJSON(res, 500, { error: 'Something went wrong' });
  }
}

const server = http.createServer(async (req, res) => {
  console.log(req.method, req.url);

  try {
    if (req.method === 'GET' && req.url === '/health') {
      handleHealth(res);
    } else if (req.method === 'POST' && req.url === '/echo') {
      await handleEcho(req, res);
    } else {
      sendJSON(res, 404, { error: 'Route not found' });
    }
  } catch (err) {
    console.error('Server error:', err.message);
    if (!res.headersSent) {
      sendJSON(res, 500, { error: 'Internal server error' });
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('\nTest it:');
  console.log('  curl http://localhost:3000/health');
  console.log('  curl -X POST http://localhost:3000/echo -H "Content-Type: application/json" -d \'{"name":"Shrishti"}\'');
});

process.on('SIGINT', () => {
  console.log('\nStopping server...');
  server.close(() => process.exit(0));
});
