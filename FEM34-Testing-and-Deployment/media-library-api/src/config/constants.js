// Values that the validators, the upload middleware and the model all agree on live here, once.
// (The maximum file size is configuration, not a constant: see MAX_FILE_SIZE_MB in config/env.js.)
const CATEGORIES = ['marketing', 'product', 'design', 'documentation', 'other'];

// Allowed upload types and the file extension we give each one. The extension comes from this table, never from
// the uploaded file name, so a client cannot choose what the saved file is called.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

const SORT_FIELDS = ['createdAt', 'title', 'fileSize', 'category'];

const PAGINATION = { defaultPage: 1, defaultLimit: 10, maxLimit: 50 };

module.exports = { CATEGORIES, ALLOWED_TYPES, SORT_FIELDS, PAGINATION };
