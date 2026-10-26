const http = require('node:http');

const PORT = Number(process.env.PORT) || 3000;

let requestCount = 0;

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function handleRequest(req, res) {
  requestCount++;

  // One log line per request, written when the response has been sent.
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - startedAt} ms)`);
  });

  // req.url is only the path and query ("/api/greet?name=Amina"), so a base is
  // needed to parse it. A fixed base is used because the Host header is sent
  // by the client and may be missing or wrong.
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  if (url.pathname === '/') {
    if (req.method !== 'GET') return methodNotAllowed(res);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('Hello, this is my first Node.js server!');
  }

  if (url.pathname === '/api/health') {
    if (req.method !== 'GET') return methodNotAllowed(res);
    return sendJson(res, 200, { status: 'ok' });
  }

  if (url.pathname === '/api/greet') {
    if (req.method !== 'GET') return methodNotAllowed(res);
    // get() returns null when the parameter is missing; an empty ?name= is also treated as missing.
    const name = url.searchParams.get('name')?.trim() || 'stranger';
    return sendJson(res, 200, { message: `Hello, ${name}!` });
  }

  if (url.pathname === '/api/stats') {
    if (req.method !== 'GET') return methodNotAllowed(res);
    return sendJson(res, 200, { requestsHandled: requestCount });
  }

  sendJson(res, 404, { error: 'Not found', path: url.pathname });
}

function methodNotAllowed(res) {
  res.setHeader('Allow', 'GET');
  sendJson(res, 405, { error: 'Method not allowed' });
}

function createAppServer() {
  return http.createServer(handleRequest);
}

// Only start listening when run directly (node server.js / npm start), so tests can import this file.
if (require.main === module) {
  const server = createAppServer();

  server.on('error', (err) => {
    // The most common start-up failure: another process already uses the port.
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or run: PORT=3001 npm start`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = { createAppServer };
