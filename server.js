const http = require('http');
const path = require('path');
const fs = require('fs/promises');

const ROOT_DIR = __dirname;
const USERS_FILE = path.join(ROOT_DIR, 'users.json');
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
]);

async function ensureUsersFile() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');

    if (!raw.trim()) {
      await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2) + '\n', 'utf8');
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.users)) {
      await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2) + '\n', 'utf8');
    }
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2) + '\n', 'utf8');
  }
}

async function readUsersStore() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');

    if (!raw.trim()) {
      return { users: [] };
    }

    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.users)) {
      return parsed;
    }
  } catch {
    // Fall through to the default store.
  }

  return { users: [] };
}

async function writeUsersStore(store) {
  await fs.writeFile(USERS_FILE, JSON.stringify(store, null, 2) + '\n', 'utf8');
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function resolvePath(requestPath) {
  const normalizedPath = requestPath === '/' ? '/login.html' : requestPath;
  const filePath = path.resolve(ROOT_DIR, `.${normalizedPath}`);
  const relativePath = path.relative(ROOT_DIR, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

async function serveStaticFile(res, requestPath) {
  const filePath = resolvePath(requestPath);

  if (!filePath) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const resolvedPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const contents = await fs.readFile(resolvedPath);
    const contentType = MIME_TYPES.get(path.extname(resolvedPath).toLowerCase()) || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': contents.length,
    });
    res.end(contents);
  } catch {
    sendText(res, 404, 'Not found');
  }
}

async function handleUsersRequest(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let rawBody = '';

  for await (const chunk of req) {
    rawBody += chunk;

    if (rawBody.length > 1024 * 1024) {
      sendJson(res, 413, { error: 'Request body too large' });
      req.destroy();
      return;
    }
  }

  let parsedBody;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const username = typeof parsedBody.username === 'string' ? parsedBody.username.trim() : '';
  const password = typeof parsedBody.password === 'string' ? parsedBody.password : '';

  if (!username || !password) {
    sendJson(res, 400, { error: 'Username and password are required' });
    return;
  }

  const store = await readUsersStore();
  store.users.push({ username, password });
  await writeUsersStore(store);

  sendJson(res, 201, {
    ok: true,
    user: { username, password },
    users: store.users,
  });
}

async function main() {
  await ensureUsersFile();

  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (requestUrl.pathname === '/api/users') {
      await handleUsersRequest(req, res);
      return;
    }

    await serveStaticFile(res, requestUrl.pathname);
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});