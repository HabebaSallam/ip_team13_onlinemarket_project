import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../api';
import './Items.css';

function Items() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    deliveryTimeEstimate: '',
    images: [],
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await itemsAPI.getAll({ sellerId: localStorage.getItem('userId') });
      setItems(res.data);
    } catch (err) {
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      fetchItems();
    } catch (err) {
      setError('Failed to create item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await itemsAPI.delete(id);
        fetchItems();
      } catch (err) {
        setError('Failed to delete item');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="page-title">My Items</div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add New Item'}
      </button>
      
      {showForm && (
        <div className="card">
          <h2>Add New Item</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Price ($)</label>
              <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Stock Quantity</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Delivery Time Estimate (days)</label>
              <input type="number" name="deliveryTimeEstimate" value={formData.deliveryTimeEstimate} onChange={handleChange} required />
            </div>
            
            <button type="submit" className="btn-primary">Add Item</button>
          </form>
        </div>
      )}
      
      <div className="grid">
        {items.map(item => (
          <div key={item._id} className="item-card">
            {item.images?.[0] && <img src={item.images[0]} alt={item.name} />}
            <h3>{item.name}</h3>
            <p className="category">{item.category}</p>
            <p className="price">${item.price.toFixed(2)}</p>
            <p className="stock">Stock: {item.stock}</p>
            <p className="delivery">Delivery: {item.deliveryTimeEstimate} days</p>
            <div className="card-actions">
              <button className="btn-secondary" onClick={() => navigate(`/items/${item._id}`)}>View</button>
              <button className="btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Items;
