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

- `GET /api/health` - Check if backend is running

## Next Steps

1. Create additional models (Product, Order, etc.)
2. Implement routes for authentication
3. Build product and order management endpoints
4. Add validation and error handling
5. Implement payment processing
