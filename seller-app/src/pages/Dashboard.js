import React, { useState, useEffect, useCallback } from 'react';
import { sellerAPI, ordersAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingOrders: 0,
    totalOrders: 0,
    profile: null,
  });
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      const profileRes = await sellerAPI.getProfile();
      const itemsRes = await sellerAPI.getItems();
      const ordersRes = await ordersAPI.getSellerOrders();

      const sellerOrders = ordersRes.data.orders || [];
      const pendingOrders = sellerOrders.filter(o => o.status === 'pending').length;

      setStats({
        totalItems: itemsRes.data.length || 0,
        pendingOrders,
        totalOrders: sellerOrders.length || 0,
        profile: profileRes.data,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="page-title">Seller Dashboard</div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalItems}</h3>
          <p>Total Items Listed</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalOrders}</h3>
          <p>Total Orders</p>
        </div>
        <div className="stat-card">
          <h3>{stats.pendingOrders}</h3>
          <p>Pending Orders</p>
        </div>
      </div>
      
      <div className="card">
        <h2>Welcome, {stats.profile?.businessName || 'Seller'}!</h2>
        <p>Manage your store, items, and orders from this dashboard.</p>
      </div>
    </div>
  );
}

export default Dashboard;
