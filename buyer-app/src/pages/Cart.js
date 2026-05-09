import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, api } from '../api';
import { useToast } from '../context/ToastContext';
import './Cart.css';

function Cart({ cart, removeFromCart, updateQuantity }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/buyers/profile');
      setProfile(res.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch profile');
    }
  }, [showError]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showError('Cart is empty');
      return;
    }

    if (!profile) {
      showError('Please complete your profile first');
      setTimeout(() => navigate('/profile'), 1500);
      return;
    }

    if (!profile.address || !profile.city || !profile.state || !profile.zipCode) {
      showError('Please complete all address fields (Address, City, State, Zip Code)');
      setTimeout(() => navigate('/profile'), 1500);
      return;
    }

    setLoading(true);
    try {
      const items = cart.map(item => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order with paymentStatus pending and then navigate to checkout
      const response = await ordersAPI.create({
        items,
        shippingAddress: {
          street: profile.address,
          city: profile.city,
          state: profile.state,
          zipCode: profile.zipCode,
          country: 'USA',
        },
      });

      const createdOrder = response.data.order || response.data;
      showSuccess('Order created. Proceed to payment.');
      setTimeout(() => navigate(`/checkout/${createdOrder._id}`), 800);
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-title">Shopping Cart</div>
      
      {cart.length === 0 ? (
        <div className="card">
          <p>Your cart is empty</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>${Number(item.price || 0).toFixed(2)}</td>
                  <td>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity}
                      onChange={async (e) => {
                        const qty = parseInt(e.target.value, 10) || 1;
                        try {
                          await updateQuantity(item._id, qty);
                        } catch (err) {
                          showError(err.response?.data?.error || err.response?.data?.message || 'Could not update quantity');
                        }
                      }}
                      style={{ width: '50px' }}
                    />
                  </td>
                  <td>${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                  <td>
                    <button 
                      className="btn-danger" 
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <p><strong>Subtotal:</strong> ${total.toFixed(2)}</p>
            <p><strong>Total:</strong> ${total.toFixed(2)}</p>
            <button 
              className="btn-primary btn-large" 
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
