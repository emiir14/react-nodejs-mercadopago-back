const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  try {
    console.log('⚠️  Deleting admin table...');
    await db.query('DELETE FROM admins');
    await db.query('TRUNCATE TABLE admins');
    await db.query('ALTER TABLE admins AUTO_INCREMENT=1');
    console.log(`✅  Admin table deleted successfully.`);
  } catch (error) {
    console.error('❌  Error deleting admins:', error.message);
  } finally {
    rl.close();
    process.exit();
  }
})();
