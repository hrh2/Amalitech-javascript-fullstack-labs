const bcrypt = require('bcrypt');
const { env } = require('../config/env');

// bcrypt generates a random SALT for every hash and stores it inside the hash string
// ("$2b$12$<22-char salt><31-char hash>"), so two users with the same password get different hashes
// and nothing else needs to be stored.
function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

// compare() re-hashes the plain password with the salt found inside the stored hash and compares in constant time.
function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Used when the email is not registered: one bcrypt comparison is still done, so that
// "unknown email" and "wrong password" take about the same time (no timing side channel).
let dummyHash;
async function verifyAgainstDummy(plain) {
  dummyHash ??= await hashPassword('dummy-password-for-timing');
  await bcrypt.compare(plain, dummyHash);
  return false;
}

module.exports = { hashPassword, verifyPassword, verifyAgainstDummy };
