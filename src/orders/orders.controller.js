const { createOrder, getOrders, getOrderById } = require('./orders.service');

exports.create = async (req, res) => {
  try {
    const newOrder = await createOrder(req.body);
    res.status(201).json({ message: 'Order created successfully', data: newOrder });
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAll = async (_, res) => {
  try {
    const orders = await getOrders();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error getting orders:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    console.error('Error getting order by ID:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
