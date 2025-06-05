const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [admin] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      admin: { id: admin.id, username: admin.username },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (_, res) => {
  res.clearCookie('adminToken');
  res.status(200).json({ message: 'Logout successful' });
};

exports.verify = (req, res) => {
  res.status(200).res.json({ admin: req.admin });
};
