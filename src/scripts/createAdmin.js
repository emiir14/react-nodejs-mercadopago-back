const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  try {
    console.log('⚠️  Checking if the environment variables are set...');
    const username = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      console.log('Missing admin credentials. Make sure to set them in the .env file.');
      process.exit();
    }

    console.log('✅  Environment variables are set.');
    console.log('⚠️  Checking if the username is available...');
    const [existing] = await db.query('SELECT id FROM admins WHERE username = ?', [
      username,
    ]);

    if (existing) {
      console.log('⚠️  Username already exists.');
      return rl.close();
    }

    console.log('✅  Username is available.');
    console.log('⚠️  Creating admin with pre-set credentials...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    console.log(`✅  Admin created with ID: ${result.insertId}`);
  } catch (error) {
    console.error('❌  Error creating admin:', error.message);
  } finally {
    rl.close();
    process.exit();
  }
})();
