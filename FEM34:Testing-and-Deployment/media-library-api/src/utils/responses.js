// One success shape for the whole API: { "status": "success", "data": ... }
// (the error shape is built in middlewares/errorHandler.js)
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: 'success', data });
}

module.exports = { sendSuccess };
