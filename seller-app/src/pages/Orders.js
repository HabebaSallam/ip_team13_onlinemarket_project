import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, flagsAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { filterOrderForCurrentSeller } from '../utils/orderView';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState({});
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersAPI.getSellerOrders();
      const sellerOrders = (res.data.orders || [])
        .map(filterOrderForCurrentSeller)
        .filter(Boolean);
      setOrders(sellerOrders);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleFlagBuyer = async (order) => {
    if (!window.confirm('Flag this buyer for not receiving the package?')) return;

    try {
      await flagsAPI.flagOrderBuyer(order._id, {
        reason: 'package_not_received',
        description: `Buyer flagged from order ${order.orderNumber || order._id} for package not received.`,
      });
      showSuccess('Buyer flagged successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to flag buyer');
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
              <th>Payment Method</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id}>
                <td>{order.orderNumber || order._id?.substring(0, 8)}</td>
                <td>{order.user?.name || 'Buyer'}</td>
                <td>${Number(order.totalPrice || 0).toFixed(2)}</td>
                <td>{order.paymentMethod || 'cash'}</td>
                <td>
                  <span className={`status status-${order.status}`}>{order.status}</span>
                </td>
                <td>
                  {order.comments?.length > 0 ? (
                    <div>
                      <div>{order.comments.length} comment{order.comments.length > 1 ? 's' : ''}</div>
                      <small>
                        Latest: {order.comments[0]?.text || 'No comment text'}
                      </small>
                    </div>
                  ) : (
                    <span>No comments</span>
                  )}
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
                  <button
                    type="button"
                    className="btn-danger"
                    style={{ marginLeft: '10px' }}
                    onClick={() => handleFlagBuyer(order)}
                  >
                    Flag Buyer
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginLeft: '10px' }}
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    View
                  </button>
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
