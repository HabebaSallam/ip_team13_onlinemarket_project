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

  if (loading) return <div className="loading">Loading...</div>;
  if (!order) return <div className="container">Order not found</div>;

  return (
    <div className="container">
      <div className="page-title">Order Details</div>
      
      <div className="card">
        <h2>Order: {order.orderNumber}</h2>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Buyer:</strong> {order.user?.name || 'Buyer'}</p>
        <p><strong>Total:</strong> ${Number(order.totalPrice || 0).toFixed(2)}</p>
        <p><strong>Delivery Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
        
        <h3>Items</h3>
        <ul>
          {order.items.map(item => (
            <li key={item._id}>{item.product?.name || 'Item'} x{item.quantity} - ${Number(item.price || 0).toFixed(2)}</li>
          ))}
        </ul>
        
        <h3>Comments</h3>
        {order.comments?.map((c, i) => (
          <div key={i} className="comment">
            <p><strong>{c.userType === 'buyer' ? 'Buyer' : 'You'}:</strong> {c.text}</p>
          </div>
        ))}
        
        <form onSubmit={handleAddComment}>
          <div className="form-group">
            <label>Add Comment</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment..."
            ></textarea>
          </div>
          <button type="submit" className="btn-primary">Add Comment</button>
        </form>
      </div>
    </div>
  );
}

export default OrderDetail;
