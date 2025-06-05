const mariadb = require('mariadb');
require('dotenv').config({ path: '.env' });

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_template',
  connectionLimit: 10,
});

module.exports = pool;
