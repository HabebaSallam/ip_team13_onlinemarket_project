import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState({});
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getSellerOrders();
      setOrders(res.data.orders || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus || updating[orderId]) return;
    
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      showSuccess('Order status updated!');
      fetchOrders();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const filteredOrders = statusFilter 
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  return (
    <div className="container">
      <div className="page-title">My Orders</div>
      
      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="card">
          <p>No orders {statusFilter ? `with status "${statusFilter}"` : 'yet'}.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id}>
                <td>{order.orderNumber || order._id?.substring(0, 8)}</td>
                <td>{order.user?.name || 'Buyer'}</td>
                <td>${Number(order.totalPrice || 0).toFixed(2)}</td>
                <td>
                  <span className={`status status-${order.status}`}>{order.status}</span>
                </td>
                <td>
                  <select 
                    onChange={(e) => handleStatusChange(order._id, e.target.value)} 
                    defaultValue={order.status}
                    disabled={updating[order._id]}
                  >
                    <option value="">-- Select --</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Orders;
