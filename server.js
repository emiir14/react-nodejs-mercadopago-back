const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ecommerce_template'
});

// Test database connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

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
app.get('/api/products', (req, res) => {
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
  
  db.query(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Get single product
app.get('/api/products/:slug', (req, res) => {
  const query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.slug = ? AND p.is_active = true
  `;
  
  db.query(query, [req.params.slug], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(results[0]);
  });
});

// === CATEGORY ROUTES ===

// Get all categories
app.get('/api/categories', (req, res) => {
  const query = 'SELECT * FROM categories ORDER BY name';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// === ORDER ROUTES ===

// Create order
app.post('/api/orders', [
  body('customer_email').isEmail().normalizeEmail(),
  body('items').isArray().notEmpty(),
  body('total_amount').isNumeric()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { customer_email, items, total_amount, customer_name, customer_phone } = req.body;
  const order_number = 'ORD-' + Date.now();
  
  const orderQuery = `
    INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, total_amount) 
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(orderQuery, [order_number, customer_email, customer_name, customer_phone, total_amount], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const orderId = result.insertId;
    
    // Insert order items
    const itemPromises = items.map(item => {
      return new Promise((resolve, reject) => {
        const itemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
        db.query(itemQuery, [orderId, item.id, item.quantity, item.price], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    
    Promise.all(itemPromises)
      .then(() => {
        // Send confirmation email
        sendOrderConfirmation(customer_email, order_number, items, total_amount);
        
        // Save email to newsletter
        const emailQuery = 'INSERT IGNORE INTO newsletter_emails (email, source) VALUES (?, "checkout")';
        db.query(emailQuery, [customer_email], () => {});
        
        res.json({ order_id: orderId, order_number });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
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
  
  const query = 'SELECT * FROM admins WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const admin = results[0];
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.cookie('adminToken', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ message: 'Login successful', admin: { id: admin.id, username: admin.username } });
  });
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
app.get('/api/admin/products', authenticateAdmin, (req, res) => {
  const query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Create product (admin)
app.post('/api/admin/products', authenticateAdmin, [
  body('name').notEmpty(),
  body('price').isNumeric(),
  body('stock').isInt({ min: 0 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, stock, category_id, image_url } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  
  const query = `
    INSERT INTO products (name, slug, description, price, stock, category_id, image_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [name, slug, description, price, stock, category_id, image_url], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: result.insertId, message: 'Product created successfully' });
  });
});

// Update product (admin)
app.put('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const { name, description, price, stock, category_id, image_url, is_active } = req.body;
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : undefined;
  
  const query = `
    UPDATE products 
    SET name = ?, slug = ?, description = ?, price = ?, stock = ?, category_id = ?, image_url = ?, is_active = ?
    WHERE id = ?
  `;
  
  db.query(query, [name, slug, description, price, stock, category_id, image_url, is_active, req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product updated successfully' });
  });
});

// Delete product (admin)
app.delete('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const query = 'UPDATE products SET is_active = false WHERE id = ?';
  db.query(query, [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Get all orders (admin)
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
  const query = `
    SELECT o.*, 
           GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ') as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Get newsletter emails (admin)
app.get('/api/admin/emails', authenticateAdmin, (req, res) => {
  const query = 'SELECT * FROM newsletter_emails ORDER BY subscribed_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// === NEWSLETTER ROUTE ===
app.post('/api/newsletter', [
  body('email').isEmail().normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  const query = 'INSERT IGNORE INTO newsletter_emails (email, source) VALUES (?, "newsletter")';
  
  db.query(query, [email], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Subscribed successfully' });
  });
});

// === UTILITY FUNCTIONS ===

const sendOrderConfirmation = (email, orderNumber, items, total) => {
  const itemsList = items.map(item => `${item.name} x${item.quantity} - $${item.price.toLocaleString()}`).join('\n');
  
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
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Email error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});