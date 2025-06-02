🛒 Store Backend - Node.js + Mercado Pago
This is the backend for an e-commerce template built with Node.js and Express, featuring Mercado Pago integration for handling payments in Argentina.

📦 Features
RESTful API for products, carts, orders

Secure payment integration via Mercado Pago

Environment-based configuration

CORS enabled for frontend communication

Ready for deployment (Render, Railway, etc.)

⚙️ Technologies
Node.js, Express.js, Mercado Pago SDK, dotenv, and optionally MongoDB or PostgreSQL.

🚀 Getting Started
Clone the repo: git clone https://github.com/emiir14/react-nodejs-mercadopago-back.git && cd react-nodejs-mercadopago-back
Install dependencies: npm install
Create a .env file and add:
PORT=3000
MERCADO_PAGO_ACCESS_TOKEN=your_mercadopago_token
Then run the server: npm start
The backend will be running at http://localhost:3000.

📡 API Endpoints (example)
POST /create-order – Create a Mercado Pago payment preference
GET /products – Fetch list of products
(You can expand this section based on your implementation.)

🌐 Frontend
The frontend repo for this project is available at: https://github.com/emiir14/react-nodejs-mercadopago-front

📄 License
This project is open-source and available under the MIT License.
