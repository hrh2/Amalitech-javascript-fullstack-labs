// npm run create-admin -- "<name>" <email> <password>
// (or set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD). Creates an admin, or promotes an existing user to admin.
// This is the only way to get an admin: /auth/register always creates a plain 'user'.
// Note: a password typed on the command line ends up in your shell history; use the env variables for anything real.
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/passwords');
const { validateRegistration } = require('../utils/validators');

async function main() {
  const name = process.argv[2] ?? process.env.ADMIN_NAME;
  const email = process.argv[3] ?? process.env.ADMIN_EMAIL;
  const password = process.argv[4] ?? process.env.ADMIN_PASSWORD;

  const { value, errors } = validateRegistration({ name, email, password });
  if (errors) {
    console.error(`Usage: npm run create-admin -- "<name>" <email> <password>\n${errors.join('\n')}`);
    process.exit(1);
  }

  await connectDB();
  const existing = await User.findOne({ email: value.email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log(`Promoted existing user ${value.email} to admin (password unchanged).`);
  } else {
    await User.create({ name: value.name, email: value.email, password: await hashPassword(value.password), role: 'admin' });
    console.log(`Created admin ${value.email}.`);
  }
  await disconnectDB();
}

main().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
