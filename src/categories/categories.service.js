const db = require('../config/database');

exports.getCategories = async () => {
  let conn;
  try {
    conn = await db.getConnection();
    return await conn.query('SELECT * FROM categories ORDER BY name');
  } catch (error) {
    console.error(error);
    throw new Error(`Error getting categories: ${error.message}`);
  } finally {
    if (conn) conn.release();
  }
};

exports.getCategoryById = async (id) => {
  let conn;
  try {
    conn = await db.getConnection();
    return await conn.query('SELECT * FROM categories WHERE id = ?', [id]);
  } catch (error) {
    console.error(error);
    throw new Error(`Error getting category by ID: ${error.message}`);
  } finally {
    if (conn) conn.release();
  }
};
