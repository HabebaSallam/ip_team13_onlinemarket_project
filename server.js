const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const itemsRoutes = require('./routes/items');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const ratingsRoutes = require('./routes/ratings');
const commentsRoutes = require('./routes/comments');
const flagsRoutes = require('./routes/flags');
const reviewRoutes = require('./routes/reviews');
const sellersRoutes = require('./routes/sellers');
const buyersRoutes = require('./routes/buyers');
const paymentsRoutes = require('./routes/payments');
const serviceabilityRoutes = require('./routes/serviceability');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online_market', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/flags', flagsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/buyers', buyersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/serviceability', serviceabilityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
