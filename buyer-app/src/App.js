import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ToastProvider } from './context/ToastContext';
import { cartAPI } from './api';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

// Components
import Navbar from './components/Navbar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const syncCartFromServer = async () => {
      if (!isAuthenticated) return;

      try {
        const res = await cartAPI.getCart();
        const serverCart = res.data.cart;
        const normalizedCart = (serverCart?.items || []).map((item) => ({
          _id: item.product?._id,
          name: item.product?.name,
          price: item.product?.price,
          category: item.product?.category,
          images: item.product?.images,
          quantity: item.quantity,
        })).filter(item => item._id);

        setCart(normalizedCart);
      } catch (error) {
        console.error('Failed to sync cart from server:', error);
      }
    };

    syncCartFromServer();
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    setIsAuthenticated(false);
    setCart([]);
  };

  const addToCart = async (item) => {
    try {
      const res = await cartAPI.addToCart(item._id, 1);
      const serverCart = res.data.cart;
      const normalizedCart = (serverCart?.items || []).map((cartItem) => ({
        _id: cartItem.product?._id,
        name: cartItem.product?.name,
        price: cartItem.product?.price,
        category: cartItem.product?.category,
        images: cartItem.product?.images,
        quantity: cartItem.quantity,
      })).filter(cartItem => cartItem._id);
      setCart(normalizedCart);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      setCart(prev => {
        const existing = prev.find(c => c._id === item._id);
        if (existing) {
          return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
        }
        return [...prev, { ...item, quantity: 1 }];
      });
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await cartAPI.removeFromCart(itemId);
      const serverCart = res.data.cart;
      const normalizedCart = (serverCart?.items || []).map((cartItem) => ({
        _id: cartItem.product?._id,
        name: cartItem.product?.name,
        price: cartItem.product?.price,
        category: cartItem.product?.category,
        images: cartItem.product?.images,
        quantity: cartItem.quantity,
      })).filter(cartItem => cartItem._id);
      setCart(normalizedCart);
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      setCart(prev => prev.filter(c => c._id !== itemId));
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    try {
      const res = quantity === 0
        ? await cartAPI.removeFromCart(itemId)
        : await cartAPI.updateCartItem(itemId, quantity);

      const serverCart = res.data.cart;
      const normalizedCart = (serverCart?.items || []).map((cartItem) => ({
        _id: cartItem.product?._id,
        name: cartItem.product?.name,
        price: cartItem.product?.price,
        category: cartItem.product?.category,
        images: cartItem.product?.images,
        quantity: cartItem.quantity,
      })).filter(cartItem => cartItem._id);
      setCart(normalizedCart);
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      if (quantity === 0) {
        setCart(prev => prev.filter(c => c._id !== itemId));
      } else {
        setCart(prev => prev.map(c => c._id === itemId ? { ...c, quantity } : c));
      }
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
    } catch (error) {
      console.error('Failed to clear server cart:', error);
    } finally {
      setCart([]);
      localStorage.removeItem('cart');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <ToastProvider>
      <Router>
        {isAuthenticated && <Navbar cartCount={cart.length} onLogout={handleLogout} />}
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Catalog addToCart={addToCart} />} />
              <Route path="/category/:categoryName" element={<CategoryPage addToCart={addToCart} />} />
              <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} />} />
              <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateCartQuantity} clearCart={clearCart} />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/checkout/:id" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
