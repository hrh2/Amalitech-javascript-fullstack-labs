const User = require('../models/User');
const { verifyToken } = require('../utils/tokens');
const { sendError } = require('../utils/responses');

function unauthorized(res, message) {
  // RFC 6750: a 401 should say which authentication scheme is expected.
  res.set('WWW-Authenticate', 'Bearer');
  return sendError(res, 401, message);
}

/**
 * authenticateToken: lets a request through only if it carries a valid JWT:
 *   Authorization: Bearer <token>
 * On success it sets req.user = { id, name, email, role } and calls next().
 *
 * The user is loaded from the database on every request (not trusted from the token), so
 *  - a deleted user's old token stops working immediately, and
 *  - a role change takes effect immediately, even for tokens issued before it.
 * The cost is one query per request: the usual trade-off against purely stateless tokens.
 */
async function authenticateToken(req, res, next) {
  const header = req.get('Authorization');
  if (!header) {
    return unauthorized(res, 'Access denied. No token provided.');
  }

  const [scheme, token, ...rest] = header.split(' ');
  if (scheme !== 'Bearer' || !token || rest.length > 0) {
    return unauthorized(res, 'Authorization header must be: Bearer <token>');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    // An expired token is worth telling apart ("log in again"); everything else (bad signature,
    // wrong algorithm, malformed) is simply invalid and gives away nothing more.
    if (error.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired. Please log in again.');
    }
    return unauthorized(res, 'Invalid token.');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return unauthorized(res, 'Invalid token.');
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
}

module.exports = { authenticateToken };
