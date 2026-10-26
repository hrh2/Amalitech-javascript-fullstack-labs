const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

// A JWT is three base64url parts: header.payload.signature.
// The payload is ENCODED, NOT ENCRYPTED: anyone can read it, so it holds no secrets.
// The signature (HMAC-SHA256 with our secret) proves the payload was not changed.
const ALGORITHM = 'HS256';

function signToken(user) {
  return jwt.sign(
    { role: user.role }, // custom claim
    env.JWT_SECRET,
    { algorithm: ALGORITHM, subject: String(user.id), expiresIn: env.JWT_EXPIRES_IN }, // sub + exp claims
  );
}

// Pinning `algorithms` matters: without it a token can pick its own algorithm
// (the classic "alg: none" and HS/RS confusion attacks). Throws JsonWebTokenError / TokenExpiredError.
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
}

module.exports = { signToken, verifyToken, ALGORITHM };
