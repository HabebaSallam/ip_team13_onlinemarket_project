import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Items.css';

function Items() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    deliveryTimeEstimate: '',
    images: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const sellerId = user?.id;
      const res = await itemsAPI.getAll(sellerId ? { sellerId } : {});
      setItems(res.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Item name is required';
    if (!formData.category?.trim()) errors.category = 'Category is required';
    if (!formData.price || Number(formData.price) <= 0) errors.price = 'Valid price is required';
    if (!formData.stock || Number(formData.stock) < 0) errors.stock = 'Valid stock quantity is required';
    if (!formData.deliveryTimeEstimate || Number(formData.deliveryTimeEstimate) <= 0) errors.deliveryTimeEstimate = 'Valid delivery time is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError('Please fix the errors below');
      return;
    }
    
    setSubmitting(true);
    try {
      await itemsAPI.create(formData);
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        deliveryTimeEstimate: '',
        images: [],
      });
      setShowForm(false);
      showSuccess('Item created successfully!');
      fetchItems();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(id);
        showSuccess('Item deleted successfully!');
        fetchItems();
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="page-title">My Items</div>
      
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add New Item'}
      </button>
      
      {showForm && (
        <div className="card">
          <h2>Add New Item</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item Name <span className="required">*</span></label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Enter item name"
              />
              {formErrors.name && <p className="error-text">{formErrors.name}</p>}
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                placeholder="Item description"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>Category <span className="required">*</span></label>
              <input 
                type="text" 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                placeholder="e.g., Electronics, Clothing"
              />
              {formErrors.category && <p className="error-text">{formErrors.category}</p>}
            </div>
            
            <div className="form-group">
              <label>Price ($) <span className="required">*</span></label>
              <input 
                type="number" 
                step="0.01" 
                name="price" 
                value={formData.price} 
                onChange={handleChange}
                placeholder="0.00"
              />
              {formErrors.price && <p className="error-text">{formErrors.price}</p>}
            </div>
            
            <div className="form-group">
              <label>Stock Quantity <span className="required">*</span></label>
              <input 
                type="number" 
                name="stock" 
                value={formData.stock} 
                onChange={handleChange}
                placeholder="0"
              />
              {formErrors.stock && <p className="error-text">{formErrors.stock}</p>}
            </div>
            
            <div className="form-group">
              <label>Delivery Time Estimate (days) <span className="required">*</span></label>
              <input 
                type="number" 
                name="deliveryTimeEstimate" 
                value={formData.deliveryTimeEstimate} 
                onChange={handleChange}
                placeholder="0"
              />
              {formErrors.deliveryTimeEstimate && <p className="error-text">{formErrors.deliveryTimeEstimate}</p>}
            </div>
            
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Add Item'}
            </button>
          </form>
        </div>
      )}
      
      {items.length === 0 ? (
        <div className="card">
          <p>No items yet. <button className="link-btn" onClick={() => setShowForm(true)}>Create your first item</button></p>
        </div>
      ) : (
        <div className="grid">
          {items.map(item => (
            <div key={item._id} className="item-card">
              {item.images?.[0] && <img src={item.images[0]} alt={item.name} />}
              <h3>{item.name}</h3>
              <p className="category">{item.category}</p>
              <p className="price">${Number(item.price || 0).toFixed(2)}</p>
              <p className="stock">Stock: {item.stock}</p>
              <p className="delivery">Delivery: {item.deliveryTimeEstimate} days</p>
              <div className="card-actions">
                <button className="btn-secondary" onClick={() => navigate(`/items/${item._id}`)}>View</button>
                <button className="btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Items;
