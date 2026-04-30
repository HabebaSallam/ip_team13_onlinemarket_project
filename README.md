# Online Market Backend - Node.js & MongoDB

This is the backend for the Team 13 Online Marketplace project.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Project Structure
```
├── models/          # MongoDB schemas
├── routes/          # API routes
├── controllers/     # Business logic
├── middleware/      # Custom middleware (auth, validation, etc.)
├── server.js        # Entry point
├── .env             # Environment variables
├── .gitignore       # Git ignore rules
└── package.json     # Dependencies
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/online_market
PORT=5000
JWT_SECRET=your_secret_key_here
```

### 3. Start MongoDB
Make sure MongoDB is running on your system.

### 4. Run the Server

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## Available API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - Get all products (with filtering & search)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (protected, sellers only)
- `PUT /api/products/:id` - Update product (protected, seller only)
- `DELETE /api/products/:id` - Delete product (protected, seller only)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get single order (protected)
- `PUT /api/orders/:id` - Update order status (protected)
- `DELETE /api/orders/:id` - Cancel order (protected)

## Next Steps

1. Create additional models (Product, Order, etc.)
2. Implement routes for authentication
3. Build product and order management endpoints
4. Add validation and error handling
5. Implement payment processing
