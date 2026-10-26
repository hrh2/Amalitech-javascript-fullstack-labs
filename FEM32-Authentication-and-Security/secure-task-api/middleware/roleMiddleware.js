const { sendError } = require('../utils/responses');

/**
 * authorizeRole('admin'): a middleware FACTORY. It returns the middleware that lets only the given roles through.
 * It must run AFTER authenticateToken, because it reads req.user.
 *
 * 401 = "I don't know who you are".  403 = "I know who you are, and you may not do this".
 */
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, `Forbidden. This action requires the ${allowedRoles.join(' or ')} role.`);
    }
    next();
  };
}

module.exports = { authorizeRole };
