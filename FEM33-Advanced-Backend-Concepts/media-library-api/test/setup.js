// Shared set-up. Must be required BEFORE the app: it points the app at a SEPARATE database and a temporary upload folder.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test'; // silences the logger
process.env.DB_URI = process.env.TEST_DB_URI || 'mongodb://127.0.0.1:27017/media_library_test';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'media-library-test-')); // never the real ./uploads

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const { env } = require('../src/config/env');
const Media = require('../src/models/Media');

// These tests delete every media record: refuse to run against anything that is not clearly a test database.
const dbName = new URL(env.DB_URI).pathname.slice(1);
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to run tests against database "${dbName}": its name must end with "_test".`);
}

async function connect() {
  await connectDB();
  await Media.init(); // builds the text index
}

async function disconnect() {
  await disconnectDB();
  fs.rmSync(env.UPLOAD_DIR, { recursive: true, force: true });
}

/** Empties the collection and the upload folder between tests. */
async function reset() {
  await Media.deleteMany({});
  for (const name of fs.readdirSync(env.UPLOAD_DIR)) fs.rmSync(path.join(env.UPLOAD_DIR, name), { force: true });
}

const uploadedFiles = () => fs.readdirSync(env.UPLOAD_DIR);

async function startServer(app) {
  const server = app.listen(0); // port 0 = any free port
  await new Promise((resolve) => server.once('listening', resolve));
  return { server, base: `http://localhost:${server.address().port}` };
}

async function parse(res) {
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, headers: res.headers, text, json };
}

/** Plain JSON request. */
async function call(base, method, urlPath, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return parse(await fetch(`${base}${urlPath}`, options));
}

// Tiny but valid-looking sample files (the API checks the declared type and size, not the content).
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const PDF = Buffer.from('%PDF-1.4\n%test\n');

/**
 * POST /media as multipart/form-data. fields: { title, tags, category }. file: { content, type, name } or null.
 * An array value sends the field several times (like repeated form fields).
 */
async function upload(base, fields = {}, file = { content: PNG, type: 'image/png', name: 'logo.png' }, fileField = 'file') {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [].concat(value)) form.append(key, v);
  }
  if (file) form.append(fileField, new Blob([file.content], { type: file.type }), file.name);
  return parse(await fetch(`${base}/media`, { method: 'POST', body: form }));
}

module.exports = { connect, disconnect, reset, startServer, call, upload, uploadedFiles, mongoose, Media, PNG, PDF, env };
