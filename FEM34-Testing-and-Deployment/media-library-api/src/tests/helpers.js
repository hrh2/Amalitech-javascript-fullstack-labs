const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const app = require('../app');
const Media = require('../models/Media');
const { connectDB, disconnectDB } = require('../config/db');
const { env } = require('../config/env');

// Tiny sample files. The API checks the declared type and the size, not the content.
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const PDF = Buffer.from('%PDF-1.4\n%test\n');
const FILES = {
  png: { content: PNG, type: 'image/png', name: 'logo.png' },
  jpeg: { content: PNG, type: 'image/jpeg', name: 'photo.jpeg' },
  pdf: { content: PDF, type: 'application/pdf', name: 'report.pdf' },
  text: { content: Buffer.from('hello'), type: 'text/plain', name: 'notes.txt' },
};

const connect = () => connectDB();

async function disconnect() {
  await disconnectDB();
  fs.rmSync(env.UPLOAD_DIR, { recursive: true, force: true });
}

/** Empties the collection and the upload folder (call it in beforeEach). */
async function reset() {
  await Media.deleteMany({});
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  for (const name of fs.readdirSync(env.UPLOAD_DIR)) fs.rmSync(path.join(env.UPLOAD_DIR, name), { force: true });
}

const uploadedFiles = () => (fs.existsSync(env.UPLOAD_DIR) ? fs.readdirSync(env.UPLOAD_DIR) : []);

/**
 * POST /media as multipart/form-data. fields: { title, tags, category } (an array value repeats the field).
 * file: one of FILES, a custom { content, type, name }, or null for "no file".
 */
function upload(fields = {}, file = FILES.png, fileField = 'file') {
  const req = request(app).post('/media');
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [].concat(value)) req.field(key, v);
  }
  if (file) req.attach(fileField, file.content, { filename: file.name, contentType: file.type });
  return req;
}

/** Creates items through the API and returns them. */
async function seed(items) {
  const created = [];
  for (const item of items) {
    const res = await upload(item);
    if (res.status !== 201) throw new Error(`seed failed: ${res.status} ${res.text}`);
    created.push(res.body.data.media);
  }
  return created;
}

const fieldMessage = (res, name) => res.body.details?.find((d) => d.field === name)?.message;

module.exports = { app, request, Media, connect, disconnect, reset, upload, seed, uploadedFiles, fieldMessage, FILES, PNG, PDF, env, NOT_FOUND_ID: 'a'.repeat(24) };
