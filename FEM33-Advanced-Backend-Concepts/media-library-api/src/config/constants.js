// Values that the validators, the upload middleware and the model all agree on live here, once.
const CATEGORIES = ['marketing', 'product', 'design', 'documentation', 'other'];

// Allowed upload types and the file extension we give each one. The extension comes from this table, never from
// the uploaded file name, so a client cannot choose what the saved file is called.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const SORT_FIELDS = ['createdAt', 'title', 'fileSize', 'category'];

const PAGINATION = { defaultPage: 1, defaultLimit: 10, maxLimit: 50 };

module.exports = { CATEGORIES, ALLOWED_TYPES, MAX_FILE_SIZE, SORT_FIELDS, PAGINATION };
