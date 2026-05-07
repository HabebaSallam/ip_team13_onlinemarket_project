import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, categoriesAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Items.css';

function Items() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [stockEdits, setStockEdits] = useState({});
  const [updatingStock, setUpdatingStock] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    customCategory: '',
    price: '',
    stock: '',
    deliveryTimeEstimate: '',
    images: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const sellerId = user?.id;
      const [itemsRes, categoriesRes] = await Promise.all([
        itemsAPI.getAll(sellerId ? { sellerId } : {}),
        categoriesAPI.getAll(),
      ]);
      setItems(itemsRes.data);
      setCategories((categoriesRes.data.categories || []).map(category => category.name));
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Item name is required';
    if (!formData.description?.trim()) errors.description = 'Description is required';
    const selectedCategory = formData.category === '__new__' ? formData.customCategory : formData.category;
    if (!selectedCategory?.trim()) errors.category = 'Category is required';
    if (formData.price === '' || Number(formData.price) <= 0) errors.price = 'Valid price is required';
    if (formData.stock === '' || Number(formData.stock) < 0) errors.stock = 'Valid stock quantity is required';
    if (formData.deliveryTimeEstimate === '' || Number(formData.deliveryTimeEstimate) <= 0) errors.deliveryTimeEstimate = 'Valid delivery time is required';
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

    const category = formData.category === '__new__' ? formData.customCategory.trim() : formData.category.trim();
    
    setSubmitting(true);
    try {
      await itemsAPI.create({
        ...formData,
        category,
      });
      setFormData({
        name: '',
        description: '',
        category: '',
        customCategory: '',
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

  const handleStockChange = (id, value) => {
    setStockEdits(prev => ({ ...prev, [id]: value }));
  };

  const saveStock = async (id) => {
    const value = stockEdits[id];
    if (value === undefined || value === '') {
      showError('Please enter a valid stock quantity');
      return;
    }
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) {
      showError('Stock must be a non-negative number');
      return;
    }

    setUpdatingStock(prev => ({ ...prev, [id]: true }));
    try {
      await itemsAPI.update(id, { stock: qty });
      showSuccess('Stock updated');
      fetchItems();
      setStockEdits(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setUpdatingStock(prev => ({ ...prev, [id]: false }));
    }
  };

  const groupedItems = items.reduce((groups, item) => {
    const category = item.category?.trim() || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));
  const totalItems = items.length;
  const totalCategories = sortedCategories.length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <section className="items-banner">
        <div className="items-banner-copy">
          <p className="items-banner-kicker">Inventory categories</p>
          <h1>My Items</h1>
          <p>
            Grouped by category so you can see what is stocked, what needs attention, and what is ready to sell.
          </p>
        </div>

        <div className="items-banner-panel">
          <div className="items-banner-stat">
            <strong>{totalItems}</strong>
            <span>items</span>
          </div>
          <div className="items-banner-stat">
            <strong>{totalCategories}</strong>
            <span>categories</span>
          </div>
          <div className="items-banner-stat accent">
            <strong>{items.filter(item => Number(item.stock || 0) <= 5).length}</strong>
            <span>low stock</span>
          </div>
        </div>
      </section>
      
      <div className="items-toolbar">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Item'}
        </button>
      </div>
      
      {showForm && (
        <div className="card items-form-card">
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
              {formErrors.description && <p className="error-text">{formErrors.description}</p>}
            </div>
            
            <div className="form-group">
              <label>Category <span className="required">*</span></label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="__new__">Create a new category...</option>
              </select>
              {formData.category === '__new__' && (
                <input
                  type="text"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleChange}
                  placeholder="Type a new category name"
                  style={{ marginTop: '10px' }}
                />
              )}
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
        <div className="category-groups">
          {sortedCategories.map((category) => (
            <section key={category} className="category-group">
              <div className="category-group-header">
                <div>
                  <p className="category-group-kicker">Category</p>
                  <h2>{category}</h2>
                </div>
                <span className="category-group-count">{groupedItems[category].length} item{groupedItems[category].length === 1 ? '' : 's'}</span>
              </div>
              <p className="category-group-description">
                All items in {category} are grouped here so you can review, compare, and manage them quickly.
              </p>
              <div className="grid">
                {groupedItems[category].map(item => (
                  <div key={item._id} className="item-card">
                    {item.images?.[0] && <img src={item.images[0]} alt={item.name} />}
                    <h3>{item.name}</h3>
                    <p className="category">{item.category}</p>
                    <p className="price">${Number(item.price || 0).toFixed(2)}</p>
                    <p className="stock">Stock: {item.stock}</p>
                    <p className="delivery">Delivery: {item.deliveryTimeEstimate} days</p>
                    <div className="stock-edit-row">
                      <input
                        type="number"
                        min="0"
                        className="stock-input"
                        value={stockEdits[item._id] ?? ''}
                        placeholder={String(item.stock)}
                        onChange={(e) => handleStockChange(item._id, e.target.value)}
                      />
                      <button
                        className="btn-primary"
                        onClick={() => saveStock(item._id)}
                        disabled={updatingStock[item._id]}
                      >
                        {updatingStock[item._id] ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    <div className="card-actions">
                      <button className="btn-secondary" onClick={() => navigate(`/items/${item._id}`)}>View</button>
                      <button className="btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default Items;
