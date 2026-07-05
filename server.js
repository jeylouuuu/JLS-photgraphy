const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const rootDir = __dirname;
const uploadsDir = path.join(rootDir, 'uploads');
const dataFile = path.join(rootDir, 'data', 'posts.json');

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(path.dirname(dataFile), { recursive: true });

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]', 'utf8');
}

function readPosts() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2), 'utf8');
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': getContentType(filePath),
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(filePath).pipe(res);
}

function parseBase64Image(imageData) {
  const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data.');
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/gif' ? 'gif' : 'png';
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${fileName}`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/api/images') {
    if (req.method === 'GET') {
      sendJson(res, 200, readPosts());
      return;
    }
  }

  if (pathname === '/api/upload') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const title = payload.title?.toString().trim();
          const category = payload.category?.toString() || 'engagement';
          const description = payload.description?.toString().trim() || '';
          const imageData = payload.image?.toString();

          if (!title || !imageData) {
            sendJson(res, 400, { error: 'Title and image are required.' });
            return;
          }

          const imagePath = parseBase64Image(imageData);
          const posts = readPosts();
          const newPost = {
            id: randomUUID(),
            title,
            category,
            description,
            image: imagePath,
            createdAt: new Date().toISOString()
          };

          posts.unshift(newPost);
          writePosts(posts);
          sendJson(res, 200, newPost);
        } catch (error) {
          sendJson(res, 400, { error: error.message || 'Unable to save image.' });
        }
      });
      return;
    }
  }

  if (pathname.startsWith('/uploads/')) {
    const filePath = path.join(rootDir, pathname.replace(/^\/+/, ''));
    serveStatic(res, filePath);
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.join(rootDir, relativePath);
  serveStatic(res, filePath);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Photo storage server running at http://localhost:${port}`);
});
