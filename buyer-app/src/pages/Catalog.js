import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../api';
import './Catalog.css';

function Catalog({ addToCart }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategoriesAndItems();
  }, [filters]);

  const fetchCategoriesAndItems = async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        itemsAPI.getCategories(),
        itemsAPI.getAll(filters.search ? { search: filters.search } : {}),
      ]);
      setCategories(catRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    alert('Item added to cart!');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="page-title">Marketplace Catalog</div>
      
      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Search products..."
          value={filters.search}
          onChange={handleFilterChange}
          className="search-input"
        />
        
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <input
          type="number"
          name="minPrice"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />
        
        <input
          type="number"
          name="maxPrice"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />
      </div>
      
      <div className="product-grid">
        {items.map(item => (
          <div key={item._id} className="product-card">
            {item.images?.[0] && <img src={item.images[0]} alt={item.name} className="product-image" />}
            <div className="product-info">
              <div className="product-name">{item.name}</div>
              <div className="product-seller">{item.sellerId.businessName}</div>
              <div className="product-price">${item.price.toFixed(2)}</div>
              <div className="product-rating">⭐ {item.rating.average.toFixed(1)} ({item.rating.count})</div>
              <div className="product-delivery">Delivery: {item.deliveryTimeEstimate} days</div>
              <div className="product-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => navigate(`/product/${item._id}`)}
                >
                  View
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {items.length === 0 && <p style={{ textAlign: 'center', marginTop: '20px' }}>No products found</p>}
    </div>
  );
}

export default Catalog;
