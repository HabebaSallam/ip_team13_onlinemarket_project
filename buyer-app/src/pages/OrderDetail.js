import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ordersAPI } from '../api';

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await ordersAPI.getOrder(id);
      setOrder(res.data);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <p><strong>Status:</strong> <span className={`status status-${order.status}`}>{order.status}</span></p>
        <p><strong>Seller:</strong> {order.sellerId.businessName}</p>
        <p><strong>Total:</strong> ${order.totalPrice}</p>
        <p><strong>Delivery Address:</strong> {order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
        <p><strong>Estimated Delivery:</strong> {new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>
        
        <h3>Items</h3>
        <ul>
          {order.items.map(item => (
            <li key={item._id}>{item.itemId.name} x{item.quantity} - ${item.price}</li>
          ))}
        </ul>
        
        <h3>Communication</h3>
        {order.comments.map((c, i) => (
          <div key={i} className="comment">
            <p><strong>{c.userType === 'buyer' ? 'You' : 'Seller'}:</strong> {c.text}</p>
            <small>{new Date(c.createdAt).toLocaleString()}</small>
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
