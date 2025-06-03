-- Admins
INSERT INTO admins (username, password)
VALUES
  ('admin1', 'hashed_password_1');

-- Categories
INSERT INTO categories (name, slug)
VALUES
  ('Electronics', 'electronics'),
  ('Books', 'books'),
  ('Clothing', 'clothing');

-- Products
INSERT INTO products (name, slug, description, price, stock, category_id, image_url, is_active)
VALUES
  ('Smartphone X', 'smartphone-x', 'High-end smartphone with OLED display.', 799.99, 50, 1, 'https://example.com/images/smartphone.jpg'),
  ('Science Fiction Book', 'sci-fi-book', 'Explore futuristic worlds.', 19.99, 200, 2, 'https://example.com/images/book.jpg'),
  ('T-Shirt Large', 'tshirt-large', 'Comfortable cotton t-shirt.', 12.50, 150, 3, 'https://example.com/images/tshirt.jpg');

-- Orders
INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, total_amount, status)
VALUES
  ('ORD-1001', 'alice@example.com', 'Alice Smith', '1234567890', 832.49, 'pending'),
  ('ORD-1002', 'bob@example.com', 'Bob Johnson', '0987654321', 25.00, 'processing');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
  (1, 1, 1, 799.99), -- Smartphone X
  (1, 2, 1, 19.99),  -- Sci-Fi Book
  (1, 3, 1, 12.50),  -- T-Shirt
  (2, 2, 1, 19.99),
  (2, 3, 1, 5.01);  -- Example promo price

-- Newsletter Emails
INSERT INTO newsletter_emails (email, source)
VALUES
  ('alice@example.com', 'checkout'),
  ('newsletterfan@example.com', 'newsletter');
