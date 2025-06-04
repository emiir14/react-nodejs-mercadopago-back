const db = require('../config/database');

exports.createProduct = async (productData) => {
  const {
    name,
    slug,
    description,
    price,
    stock = 1,
    categoryId,
    imageUrl,
    isActive = true,
  } = productData;

  if (!name || !slug || !description || !price || !categoryId) {
    throw new Error(
      'Missing required fields: name, slug, description, price, or categoryId.'
    );
  }

  if (isNaN(price) || isNaN(stock)) {
    throw new Error('Price and stock must be numbers.');
  }

  // Check slug uniqueness
  const conn = await db.getConnection();
  const [existing] = await conn.query('SELECT id FROM products WHERE slug = ?', [slug]);
  if (existing.length > 0) throw new Error('Slug already in use.');

  try {
    const query = `
      INSERT INTO products
        (name, slug, description, price, stock, category_id, image_url, is_active)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      name,
      slug,
      description,
      price,
      stock,
      categoryId,
      imageUrl ?? null,
      isActive,
    ];

    const [result] = await conn.query(query, values);
    return result.insertId;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error(`Failed to create product: ${error.message}`);
  } finally {
    if (conn) conn.release();
  }
};

// Get all products with search and filters
exports.getProducts = async (rawQuery) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 20,
    offset = 0,
  } = rawQuery;

  // Whitelist sort fields and orders to prevent SQL injection
  const validSortFields = ['name', 'price', 'created_at', 'updated_at'];
  const validSortOrders = ['ASC', 'DESC'];
  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase())
    ? sortOrder.toUpperCase()
    : 'DESC';

  let baseQuery = `
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.is_active = true
  `;

  const filters = [];
  const params = [];

  if (search) {
    filters.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    filters.push('c.slug = ?');
    params.push(category);
  }

  if (minPrice) {
    filters.push('p.price >= ?');
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    filters.push('p.price <= ?');
    params.push(Number(maxPrice));
  }

  if (filters.length > 0) {
    baseQuery += ' AND ' + filters.join(' AND ');
  }

  let conn;
  try {
    conn = await db.getConnection();

    // Total count
    const [countResult] = await conn.query(
      `SELECT COUNT(*) as total ${baseQuery}`,
      params
    );
    const total = Number(countResult.total);

    // Main query
    const productQuery = `
      SELECT p.*, c.name as category_name 
      ${baseQuery}
      ORDER BY p.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    const paginatedParams = [...params, Number(limit), Number(offset)];
    const rows = await conn.query(productQuery, paginatedParams);

    return { total, rows };
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw new Error('Failed to retrieve products.');
  } finally {
    if (conn) conn.release();
  }
};

// Get product by id
exports.getProductById = async (id) => {
  const query = `SELECT * FROM products WHERE id = ? AND is_active = true`;

  let conn;
  try {
    conn = await db.getConnection();
    const result = await conn.query(query, [id]);
    return result[0];
  } catch (error) {
    console.error(error);
    throw new Error('Failed to retrieve product.');
  } finally {
    if (conn) conn.release();
  }
};

// Update product by id
exports.updateProduct = async (id, updateData) => {
  if (!id || isNaN(id)) throw new Error('Invalid product ID.');

  const allowedFields = [
    'name',
    'slug',
    'description',
    'price',
    'stock',
    'categoryId',
    'imageUrl',
    'isActive',
  ];

  const setClauses = [];
  const values = [];

  for (const key in updateData) {
    if (!allowedFields.includes(key)) continue;

    const dbKey =
      {
        categoryId: 'category_id',
        imageUrl: 'image_url',
        isActive: 'is_active',
      }[key] || key;

    setClauses.push(`${dbKey} = ?`);
    values.push(updateData[key]);
  }

  if (setClauses.length === 0) throw new Error('No valid fields provided for update.');

  const query = `
    UPDATE products
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  values.push(id);

  try {
    const conn = await db.getConnection();
    const result = await conn.query(query, values);
    conn.release();
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product.');
  }
};

// Soft delete by id
exports.softDeleteProduct = async (id) => {
  if (!id || isNaN(id)) throw new Error('Invalid product ID.');

  const query = `
    UPDATE products 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  try {
    const conn = await db.getConnection();
    const result = await conn.query(query, [id]);
    conn.release();
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error soft deleting product:', error);
    throw new Error('Failed to soft delete product.');
  }
};
