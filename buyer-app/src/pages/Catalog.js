import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, categoriesAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Catalog.css';

function Catalog({ addToCart }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsToShow, setItemsToShow] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const fetchCategoriesAndItems = useCallback(async () => {
    try {
      const query = {};
      if (filters.search) query.search = filters.search;
      if (filters.category) query.category = filters.category;
      if (filters.minPrice) query.minPrice = filters.minPrice;
      if (filters.maxPrice) query.maxPrice = filters.maxPrice;

      const [catRes, itemsRes] = await Promise.all([
        categoriesAPI.getAll(),
        itemsAPI.getAll(query),
      ]);
      setCategories((catRes.data.categories || []).map(category => category.name));
      setItems(itemsRes.data);
      setItemsToShow(10); // Reset to initial count when filters change
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.category, filters.minPrice, filters.maxPrice, showError]);

  useEffect(() => {
    fetchCategoriesAndItems();
  }, [fetchCategoriesAndItems]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    showSuccess('Item added to cart!');
  };

  const handleCategoryClick = (category) => {
    if (!category) {
      setFilters(prev => ({ ...prev, category: '' }));
      return;
    }

    navigate(`/category/${encodeURIComponent(category)}`);
  };

  const totalProducts = items.length;
  const totalCategories = categories.length;
  const featuredCategory = categories[0] || 'All products';

  const getSellerName = (item) => {
    if (!item?.sellerId) return 'Unknown seller';
    if (typeof item.sellerId === 'object') {
      return item.sellerId.businessName || item.sellerId.name || 'Unknown seller';
    }
    return 'Unknown seller';
  };

  const getRatingText = (item) => {
    if (item?.rating && typeof item.rating === 'object') {
      const average = Number(item.rating.average ?? 0);
      const count = Number(item.rating.count ?? 0);
      return `⭐ ${average.toFixed(1)} (${count})`;
    }

    const ratingValue = Number(item?.rating ?? 0);
    return `⭐ ${ratingValue.toFixed(1)} (0)`;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="page-title">Marketplace Catalog</div>

      <div className="category-hero">
        <div className="category-hero-copy">
          <p className="category-hero-kicker">Shop by category</p>
          <h2>Choose a category</h2>
          <p>Tap any category to open a page with everything inside it.</p>
          <div className="category-hero-pill-row">
          </div>
        </div>
        <div className="category-hero-panel">
          <div className="category-hero-stat">
            <strong>{totalProducts}</strong>
            <span>products</span>
          </div>
          <div className="category-hero-stat">
            <strong>{totalCategories}</strong>
            <span>categories</span>
          </div>
        </div>
      </div>

      <div className="category-strip">
        <button
          type="button"
          className="category-chip category-chip-wide"
          onClick={() => handleCategoryClick('')}
        >
          <span className="category-chip-label">All Categories</span>
          <span className="category-chip-count">Browse everything</span>
        </button>
        {categories.map(cat => (
          <button
            type="button"
            key={cat}
            className="category-chip category-chip-wide"
            onClick={() => handleCategoryClick(cat)}
          >
            <span className="category-chip-label">{cat}</span>
            <span className="category-chip-count">
              {items.filter((item) => (item.category || 'Uncategorized') === cat).length} item
              {items.filter((item) => (item.category || 'Uncategorized') === cat).length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>
      
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
      
      {items.length === 0 ? (
        <div className="card">
          <p>No products found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {items.slice(0, itemsToShow).map(item => {
                const outOfStock = Number(item.stock ?? 0) <= 0;
                return (
                <div key={item._id} className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
                  {item.images?.[0] && <img src={item.images[0]} alt={item.name} className="product-image" />}
                  {outOfStock && <div className="out-of-stock-badge">Out of stock</div>}
                  <div className="product-info">
                    <div className="product-category">{item.category || 'Uncategorized'}</div>
                    <div className="product-name">{item.name}</div>
                    <div className="product-seller">{getSellerName(item)}</div>
                    <div className="product-price">${Number(item.price || 0).toFixed(2)}</div>
                    <div className="product-rating">{getRatingText(item)}</div>
                    <div className="product-delivery">Delivery: {item.deliveryTimeEstimate || 'TBD'} days</div>
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
                        disabled={outOfStock}
                        aria-disabled={outOfStock}
                      >
                        {outOfStock ? 'Out of stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {itemsToShow < items.length && (
            <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '30px' }}>
              <button 
                className="btn-primary" 
                onClick={() => setItemsToShow(prev => prev + 5)}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Catalog;
