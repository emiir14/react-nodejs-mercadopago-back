const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('morgan');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: '.env' });
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(logger('dev'));
app.use(cors());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Auth middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.adminToken || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// === PRODUCT ROUTES ===

// Get all products with search and filters
app.get('/api/products', async (req, res) => {
  try {
    const conn = await db.getConnection();

    const { search, category, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;

    const params = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    query += ` ORDER BY p.${sortBy} ${sortOrder}`;

    const rows = await conn.query(query, params);
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('DB query error:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get single product
app.get('/api/products/:slug', async (req, res) => {
  const query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.slug = ? AND p.is_active = true
  `;
  try {
    const results = await db.query(query, [req.params.slug]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// === CATEGORY ROUTES ===

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const results = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ORDER ROUTES ===

// Create order
app.post('/api/orders', [
  body('customer_email').isEmail().normalizeEmail(),
  body('items').isArray().notEmpty(),
  body('total_amount').isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { customer_email, items, total_amount, customer_name, customer_phone } = req.body;
  const order_number = 'ORD-' + Date.now();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const result = await conn.query(`
      INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, total_amount) 
      VALUES (?, ?, ?, ?, ?)`,
      [order_number, customer_email, customer_name, customer_phone, total_amount]
    );
    const orderId = result.insertId;

    for (const item of items) {
      await conn.query(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    await conn.query(`
      INSERT IGNORE INTO newsletter_emails (email, source) VALUES (?, "checkout")`,
      [customer_email]
    );

    await conn.commit();
    sendOrderConfirmation(customer_email, order_number, items, total_amount);
    res.json({ order_id: orderId, order_number });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// === ADMIN ROUTES ===

// Admin login
app.post('/api/admin/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const results = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = results[0];
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ message: 'Login successful', admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ message: 'Logout successful' });
});

// Verify admin token
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({ admin: req.admin });
});


// Get all products (admin)
app.get('/api/admin/products', authenticateAdmin, async (req, res) => {
  try {
    const results = await db.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product (admin)
app.post('/api/admin/products', authenticateAdmin, [
  body('name').notEmpty(),
  body('price').isNumeric(),
  body('stock').isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, price, stock, category_id, image_url } = req.body;
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  try {
    const result = await db.query(`
      INSERT INTO products (name, slug, description, price, stock, category_id, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price, stock, category_id, image_url]
    );
    res.json({ id: result.insertId, message: 'Product created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product (admin)
app.put('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  const { name, description, price, stock, category_id, image_url, is_active } = req.body;
  const slug = name ? name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : undefined;

  try {
    await db.query(`
      UPDATE products 
      SET name = ?, slug = ?, description = ?, price = ?, stock = ?, category_id = ?, image_url = ?, is_active = ?
      WHERE id = ?`,
      [name, slug, description, price, stock, category_id, image_url, is_active, req.params.id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product (admin)
app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin)
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const results = await db.query(`
      SELECT o.*, 
             GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get newsletter emails (admin)
app.get('/api/admin/emails', authenticateAdmin, async (req, res) => {
  try {
    const results = await db.query('SELECT * FROM newsletter_emails ORDER BY subscribed_at DESC');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === NEWSLETTER ROUTE ===
app.post('/api/newsletter', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    await db.query('INSERT IGNORE INTO newsletter_emails (email, source) VALUES (?, "newsletter")', [req.body.email]);
    res.json({ message: 'Subscribed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === UTILITY FUNCTIONS ===

const sendOrderConfirmation = async (email, orderNumber, items, total) => {
  const itemsList = items
    .map(item => `${item.name} x${item.quantity} - $${item.price.toLocaleString()}`)
    .join('\n');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Confirmación de Pedido - ${orderNumber}`,
    text: `
      ¡Gracias por tu compra!
      
      Número de pedido: ${orderNumber}
      
      Productos:
      ${itemsList}
      
      Total: $${total.toLocaleString()}
      
      Te contactaremos pronto para coordinar la entrega.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Email error:', error);
  }
};


// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});