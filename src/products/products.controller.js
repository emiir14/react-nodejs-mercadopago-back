const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
} = require('./products.service');

exports.create = async (req, res) => {
  try {
    const id = await createProduct(req.body);
    res.status(201).json({ message: 'Product created', id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const products = await getProducts(req.query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ message: 'Product updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await softDeleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ message: 'Product soft deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete' });
  }
};
