import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ordersAPI } from '../api';

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
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
    }
  };

  const getSellerName = () => {
    const seller = order?.items?.[0]?.product?.sellerId;
    if (!seller) return 'Unknown seller';
    if (typeof seller === 'object') {
      return seller.businessName || seller.name || 'Unknown seller';
    }
    return 'Unknown seller';
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!order) return <div className="container">Order not found</div>;

  return (
    <div className="container">
      <div className="page-title">Order Details</div>
      
      <div className="card">
        <h2>Order: {order.orderNumber}</h2>
        <p><strong>Status:</strong> <span className={`status status-${order.status}`}>{order.status}</span></p>
        <p><strong>Payment Method:</strong> {order.paymentMethod || 'cash'}</p>
        <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
        <p><strong>Seller:</strong> {getSellerName()}</p>
        <p><strong>Total:</strong> ${Number(order.totalPrice || 0).toFixed(2)}</p>
        <p><strong>Delivery Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
        <p><strong>Estimated Delivery:</strong> {(() => {
          const ed = order?.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate) : null;
          return ed && !isNaN(ed) ? ed.toLocaleDateString() : 'Not set';
        })()}</p>
        
        <h3>Items</h3>
        <ul>
          {order.items.map(item => (
            <li key={item._id}>{item.product?.name || 'Item'} x{item.quantity} - ${Number(item.price || 0).toFixed(2)}</li>
          ))}
        </ul>
        
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
