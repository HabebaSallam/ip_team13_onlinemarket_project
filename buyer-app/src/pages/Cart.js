import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, api } from '../api';
import './Cart.css';

function Cart({ cart, removeFromCart, updateQuantity }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/buyers/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!profile) {
      alert('Please complete your profile first');
      navigate('/profile');

          // Validate that all required address fields are filled
          if (!profile.address || !profile.city || !profile.state || !profile.zipCode) {
            alert('Please complete all address fields in your profile (Address, City, State, Zip Code)');
            navigate('/profile');
            return;
          }
      return;
    }

    setLoading(true);
    try {
      const items = cart.map(item => ({
        itemId: item._id,
        quantity: item.quantity,
        price: item.price,
      }));

      const response = await ordersAPI.create({
        items,
        deliveryAddress: {
          street: profile.address,
          city: profile.city,
          state: profile.state,
          zipCode: profile.zipCode,
          country: 'USA',
        },
      });

      alert('Order placed successfully!');
      localStorage.setItem('cart', JSON.stringify([]));
      navigate(`/orders/${response.data.order._id}`);
    } catch (err) {
      alert('Error placing order: ' + err.message);
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
                  <td>${item.price}</td>
                  <td>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                      style={{ width: '50px' }}
                    />
                  </td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
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
