const db = require('../config/database');

exports.createOrder = async (orderData) => {
  const { customer_email, items, total_amount, customer_name, customer_phone } =
    orderData;
  const order_number = 'ORD-' + Date.now();

  let conn;
  try {
    conn = await db.getConnection;
    await conn.beginTransaction();

    const result = await conn.query(
      `
      INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, total_amount) 
      VALUES (?, ?, ?, ?, ?)`,
      [order_number, customer_email, customer_name, customer_phone, total_amount]
    );
    const orderId = result.insertId;

    for (const item of items) {
      await conn.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    await conn.query(
      `
      INSERT IGNORE INTO newsletter_emails (email, source) VALUES (?, "checkout")`,
      [customer_email]
    );

    await conn.commit();
    sendOrderConfirmation(customer_email, order_number, items, total_amount);
    return { orderId, orderNumber: order_number };
  } catch (error) {
    console.error('Error processing order:', error);
    await conn.rollback();
    throw new Error('Error processing order');
  } finally {
    if (conn) conn.release();
  }
};

exports.getOrders = async () => {
  let conn;
  try {
    conn = await db.getConnection();
    const result = await conn.query('SELECT * FROM orders');
    return result;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw new Error('Error getting orders');
  } finally {
    if (conn) conn.release();
  }
};

exports.getOrderById = async (orderId) => {
  let conn;
  try {
    conn = await db.getConnection();
    const result = await conn.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    return result[0];
  } catch (error) {
    console.error('Error getting order by id:', error);
    throw new Error('Error getting order by id');
  } finally {
    if (conn) conn.release();
  }
};

const sendOrderConfirmation = async (email, orderNumber, items, total) => {
  const itemsList = items
    .map(({ name, quantity, price }) => `${name} x${quantity} - $${price.toFixed(2)}`)
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
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Error sending email');
  }
};
