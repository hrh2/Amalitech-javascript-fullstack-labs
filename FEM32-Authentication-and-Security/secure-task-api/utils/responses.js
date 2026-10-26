// One response shape for the whole API, so clients never have to guess:
//   success: { "status": "success", "data": { ... } }
//   error:   { "status": "error",   "message": "Unauthorized access" }   (+ "errors": [...] for validation details)
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: 'success', data });
}

function sendError(res, statusCode, message, errors) {
  const body = { status: 'error', message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
