import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, api, serviceabilityAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Cart.css';

function Cart({ cart, removeFromCart, updateQuantity }) {
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: '',
    phone: '',
    street: '',
    addressLine2: '',
    apartment: '',
    building: '',
    floor: '',
    landmark: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    notes: '',
  });
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/buyers/profile');
      const detectedLocation = res.data.detectedLocation || {};
      
      // Fetch saved addresses
      const addressRes = await api.get('/buyers/addresses');
      const addresses = addressRes.data.addresses || [];
      setSavedAddresses(addresses);
      
      // If user has saved addresses, use first one or default
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
        setShippingAddress(prev => ({
          ...prev,
          recipientName: defaultAddress.recipientName || res.data.name || prev.recipientName,
          phone: defaultAddress.phone || res.data.phone || prev.phone,
          street: defaultAddress.street || '',
          apartment: defaultAddress.apartment || '',
          landmark: defaultAddress.landmark || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          zipCode: defaultAddress.zipCode || '',
          notes: defaultAddress.notes || '',
        }));
      } else {
        // No saved addresses, use detected location
        setShowAddressForm(true);
        setShippingAddress(prev => ({
          ...prev,
          recipientName: res.data.name || prev.recipientName,
          phone: res.data.phone || prev.phone,
          street: prev.street || detectedLocation.address || '',
          city: prev.city || detectedLocation.city || '',
          state: prev.state || detectedLocation.state || '',
          zipCode: prev.zipCode || detectedLocation.zipCode || '',
        }));
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch profile');
    }
  }, [showError]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSelectAddress = (addressId) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(addr => addr._id === addressId);
    if (selected) {
      setShippingAddress(prev => ({
        ...prev,
        recipientName: selected.recipientName,
        phone: selected.phone,
        street: selected.street,
        apartment: selected.apartment,
        landmark: selected.landmark,
        city: selected.city,
        state: selected.state,
        zipCode: selected.zipCode,
        notes: selected.notes,
      }));
      setShowAddressForm(false);
    }
  };

  const handleSaveNewAddress = async () => {
    try {
      const requiredFields = [
        ['recipientName', 'Recipient name'],
        ['phone', 'Phone number'],
        ['street', 'Street address'],
        ['city', 'City'],
        ['state', 'State'],
        ['zipCode', 'Zip code'],
      ];

      const missingField = requiredFields.find(([key]) => !shippingAddress[key]?.trim());
      if (missingField) {
        showError(`Please complete the address field: ${missingField[1]}`);
        return;
      }

      await api.post('/buyers/addresses', {
        recipientName: shippingAddress.recipientName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        apartment: shippingAddress.apartment,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        landmark: shippingAddress.landmark,
        notes: shippingAddress.notes,
        isDefault: false,
      });

      showSuccess('Address saved to profile');
      setSaveNewAddress(false);
      await fetchProfile();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save address');
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showError('Cart is empty');
      return;
    }

    const requiredFields = [
      ['recipientName', 'Recipient name'],
      ['phone', 'Phone number'],
      ['street', 'Street address'],
      ['city', 'City'],
      ['state', 'State'],
      ['zipCode', 'Zip code'],
    ];

    const missingField = requiredFields.find(([key]) => !shippingAddress[key]?.trim());
    if (missingField) {
      showError(`Please complete the full delivery address (${missingField[1]})`);
      return;
    }

    // If not using a saved address and should save, save it first
    if (!selectedAddressId && saveNewAddress) {
      setLoading(true);
      try {
        await api.post('/buyers/addresses', {
          recipientName: shippingAddress.recipientName,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          landmark: shippingAddress.landmark,
          notes: shippingAddress.notes,
          isDefault: false,
        });
        showSuccess('Address saved to profile');
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to save address');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const serviceabilityRes = await serviceabilityAPI.checkCartServiceability(
        cart.map(item => ({ productId: item._id, quantity: item.quantity }))
      );

      if (!serviceabilityRes.data?.allServiceable) {
        showError('One or more items in your cart are outside your delivery zone');
        return;
      }

      const items = cart.map(item => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order with paymentStatus pending and then navigate to checkout
      const response = await ordersAPI.create({
        items,
        shippingAddress,
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

          <div className="card" style={{ marginTop: '20px' }}>
            <h3>Delivery Address</h3>
            
            {savedAddresses.length > 0 && (
              <div className="form-group">
                <label>Saved Addresses</label>
                <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      style={{
                        border: selectedAddressId === addr._id ? '2px solid #3498db' : '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        backgroundColor: selectedAddressId === addr._id ? '#f0f8ff' : '#f9f9f9',
                      }}
                      onClick={() => handleSelectAddress(addr._id)}
                    >
                      <div style={{ fontWeight: 'bold' }}>{addr.recipientName}</div>
                      <div style={{ fontSize: '0.9em', color: '#64748b' }}>
                        {[addr.street, addr.apartment, addr.city, addr.state, addr.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      {addr.isDefault && (
                        <div style={{ fontSize: '0.85em', color: '#10b981', marginTop: '4px' }}>
                          ★ Default Address
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddressForm(!showAddressForm);
                    setSelectedAddressId(null);
                  }}
                  style={{ marginBottom: '20px' }}
                >
                  {showAddressForm ? 'Use Saved Address' : 'Add New Address'}
                </button>
              </div>
            )}

            {showAddressForm && (
              <>
                <div className="form-group">
                  <label>Recipient Name</label>
                  <input
                    type="text"
                    value={shippingAddress.recipientName}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Street name, building, and number"
                  />
                </div>
                <div className="form-group">
                  <label>Apartment / Unit / Floor</label>
                  <input
                    type="text"
                    value={shippingAddress.apartment}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, apartment: e.target.value }))}
                    placeholder="Apartment, unit, or floor"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="Postal code"
                    />
                  </div>
                  <div className="form-group">
                    <label>Landmark</label>
                    <input
                      type="text"
                      value={shippingAddress.landmark}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, landmark: e.target.value }))}
                      placeholder="Nearby landmark"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Delivery Notes</label>
                  <textarea
                    value={shippingAddress.notes}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Gate code, directions, or extra delivery instructions"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                    />
                    Save this address to my profile for future use
                  </label>
                </div>
                <p style={{ marginTop: 0, color: '#64748b', fontSize: '0.9em' }}>
                  Complete the form and optionally save it to use for future orders.
                </p>
              </>
            )}
          </div>
          
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
