import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { formatSellerSummary } from '../utils/orderView';
import './MyOrders.css';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersAPI.getBuyerOrders();
      setOrders(res.data.orders || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancelling(orderId);
    try {
      await ordersAPI.cancelOrder(orderId);
      showSuccess('Order cancelled successfully');
      fetchOrders(); // Refresh the orders list
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="page-title">My Orders</div>
      
      {orders.length === 0 ? (
        <div className="card">
          <p>You haven't placed any orders yet.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Start Shopping</button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Seller</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Estimated Arrival</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} onClick={() => navigate(`/orders/${order._id}`)} style={{ cursor: 'pointer' }}>
                <td>{order.orderNumber || order._id?.substring(0, 8)}</td>
                <td>{formatSellerSummary(order.items)}</td>
                <td>${Number(order.totalPrice || 0).toFixed(2)}</td>
                <td>{order.paymentMethod || 'cash'} / {order.paymentStatus || 'pending'}</td>
                <td><span className={`status status-${order.status}`}>{order.status}</span></td>
                <td>{(() => {
                  const arrivalDate = order?.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate) : null;
                  return arrivalDate && !isNaN(arrivalDate) ? arrivalDate.toLocaleDateString() : 'Not set';
                })()}</td>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {order.status === 'pending' && (
                    <button 
                      onClick={(e) => handleCancelOrder(e, order._id)}
                      disabled={cancelling === order._id}
                      className="btn-danger"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    >
                      {cancelling === order._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyOrders;
