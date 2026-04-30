import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../api';
import './MyOrders.css';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getBuyerOrders();
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="page-title">My Orders</div>
      
      {orders.length === 0 ? (
        <div className="card">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Seller</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} onClick={() => window.location.href = `/orders/${order._id}`} style={{ cursor: 'pointer' }}>
                <td>{order.orderNumber}</td>
                <td>{order.sellerId.businessName}</td>
                <td>${order.totalPrice}</td>
                <td><span className={`status status-${order.status}`}>{order.status}</span></td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyOrders;
