# Getting Started - Complete Setup Guide

## Step-by-Step Installation

### Step 1: Clone/Setup MongoDB
```bash
# If using local MongoDB (Windows)
mongod

# Or use MongoDB Atlas (cloud):
# 1. Create account at https://www.mongodb.com/cloud/atlas
# 2. Create a cluster and get connection string
# 3. Update MONGODB_URI in backend/.env
```

### Backend

This repository no longer includes the backend server. The frontend apps expect a running API at the URL configured in each app's `.env` (`REACT_APP_API_URL`). If you are using an external or hosted API, set the frontend `.env` variables to that API's base URL (for example `https://api.example.com/api`).

If you want to restore a local backend later, re-add a `backend/` folder with the server implementation and update this document accordingly.

### Step 3: Setup Seller App (in new terminal)

```bash
cd seller-app
npm install
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the app:
```bash
npm start
```

✅ Seller app running at http://localhost:3000

### Step 4: Setup Buyer App (in new terminal)

```bash
cd buyer-app
npm install
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the app:
```bash
npm start
```

✅ Buyer app running at http://localhost:3001 (or next available)

## 🧪 Testing the Application

### Create a Seller Account
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in the form with userType as "seller"
4. Login with your credentials

### Create a Buyer Account
1. Go to http://localhost:3001
2. Click "Register"
3. Fill in the form with userType as "buyer"
4. Login with your credentials

### Test Workflow

**As Seller:**
1. Go to "Items" and click "Add New Item"
2. Fill in product details
3. Set price, stock, and delivery time
4. Submit

**As Buyer:**
1. Go to Marketplace (home page)
2. Search for products
3. Add items to cart
4. Go to checkout and place order

**Order Management:**
- **Seller:** View pending orders and update their status
- **Buyer:** Track order status and communicate with seller

## 📚 API Testing with Postman

1. Download Postman: https://www.postman.com/downloads/
2. Import the API endpoints from the README
3. Set Authorization header: `Bearer <your-jwt-token>`
4. Test endpoints

### Example: Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Seller",
  "email": "seller@test.com",
  "password": "password123",
  "userType": "seller",
  "businessName": "My Store",
  "phone": "1234567890",
  "city": "New York"
}
```

## 🐛 Troubleshooting

### Module Not Found
```bash
npm install
npm cache clean --force
```

### API / CORS Errors
- Ensure `REACT_APP_API_URL` in each frontend `.env` points to a reachable API endpoint.
- If you removed the local backend, use a hosted API or update frontends to use mock data.

## 📖 Project Structure Details

```
backend/
├── models/          # MongoDB schemas
├── routes/          # API endpoints
├── middleware/      # Auth and other middleware
├── controllers/     # Business logic (future)
└── server.js        # Main server file

seller-app/
├── src/
│   ├── pages/       # Dashboard, Items, Orders, Profile
│   ├── components/  # Navbar, common components
│   ├── api.js       # API calls
│   └── App.js       # Main app component

buyer-app/
├── src/
│   ├── pages/       # Catalog, Product, Cart, Orders
│   ├── components/  # Navbar, common components
│   ├── api.js       # API calls
│   └── App.js       # Main app component
```

## 🎓 Key Concepts

### Authentication Flow
1. User registers/logs in
2. Backend generates JWT token
3. Token stored in localStorage
4. Frontend includes token in Authorization header
5. Backend validates token on protected routes

### Order Flow
1. Buyer adds items to cart
2. Buyer proceeds to checkout
3. Backend creates order with "pending" status
4. Seller receives order notification
5. Seller updates order status through lifecycle
6. Buyer tracks order status in real-time

### Rating & Comments System
1. Buyer can rate item after order delivered
2. Buyers add comments on products
3. System generates AI summary of comments
4. Summary displayed on product page

### Flagging System
1. Buyer can flag seller for issues
2. Seller can flag buyer for non-receipt
3. Flags are recorded on user profile
4. Users with many flags may face restrictions

## 📞 Need Help?

- Check the console for error messages
- Review backend logs for API errors
- Check browser DevTools Network tab
- Refer to code comments in files

Happy coding! 🚀
