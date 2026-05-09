import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../api';
import { groupItemsBySeller } from '../utils/orderView';
import { useToast } from '../context/ToastContext';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [comment, setComment] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await ordersAPI.getOrder(id);
      setOrder(res.data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.addComment(id, comment);
      setComment('');
      fetchOrder();
    } catch (err) {
      console.error('Error adding comment:', err);
      showError(err.response?.data?.error || 'Failed to add comment');
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    try {
      await ordersAPI.cancelOrder(id);
      showSuccess('Order cancelled successfully');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to cancel order');
      setCancelling(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!order) return <div className="container">Order not found</div>;

  const sellerGroups = groupItemsBySeller(order.items);
  const shippingAddress = order.shippingAddress || {};

  return (
    <div className="container">
      <div className="page-title">Order Details</div>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Order: {order.orderNumber}</h2>
          {order.status === 'pending' && (
            <button 
              onClick={handleCancelOrder} 
              disabled={cancelling}
              className="btn-danger"
              style={{ padding: '8px 16px' }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
        <p><strong>Status:</strong> <span className={`status status-${order.status}`}>{order.status}</span></p>
        <p><strong>Payment Method:</strong> {order.paymentMethod || 'cash'}</p>
        <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
        <p><strong>Total:</strong> ${Number(order.totalPrice || 0).toFixed(2)}</p>
        <div style={{ margin: '12px 0' }}>
          <p><strong>Delivery Address:</strong></p>
          <p>{shippingAddress.recipientName || 'Recipient not set'}</p>
          <p>{shippingAddress.phone || 'Phone not set'}</p>
          <p>{shippingAddress.street || 'Street not set'}</p>
          {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
          {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
          <p>{[shippingAddress.city, shippingAddress.state, shippingAddress.zipCode].filter(Boolean).join(', ')}</p>
          {shippingAddress.landmark && <p>{shippingAddress.landmark}</p>}
          {shippingAddress.notes && <p>{shippingAddress.notes}</p>}
        </div>
        <p><strong>Estimated Delivery:</strong> {(() => {
          const ed = order?.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate) : null;
          return ed && !isNaN(ed) ? ed.toLocaleDateString() : 'Not set';
        })()}</p>
        
        <hr style={{ margin: '16px 0', borderColor: '#ccc' }} />
        
        <h3>Items</h3>
        {sellerGroups.map((group) => (
          <div key={group.sellerKey} style={{ marginBottom: '18px' }}>
            <h4 style={{ marginBottom: '8px' }}>{group.sellerLabel}</h4>
            <ul>
              {group.items.map((item) => (
                <li key={item._id}>{item.product?.name || 'Item'} x{item.quantity} - ${Number(item.price || 0).toFixed(2)}</li>
              ))}
            </ul>
            <p><strong>Seller subtotal:</strong> ${Number(group.total || 0).toFixed(2)}</p>
          </div>
        ))}
        
        <h3>Communication</h3>
        {order.comments?.map((c, i) => (
          <div key={i} className="comment">
            <p><strong>{c.userType === 'seller' ? 'Seller' : 'You'}:</strong> {c.text}</p>
          </div>
        ))}
        
        <form onSubmit={handleAddComment}>
          <div className="form-group">
            <label>Add Message</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              placeholder="Send a message to the seller..."
            ></textarea>
          </div>
          <button type="submit" className="btn-primary">Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default OrderDetail;
