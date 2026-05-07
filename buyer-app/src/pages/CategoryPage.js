import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Catalog.css';

function CategoryPage({ addToCart }) {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const getSellerName = (item) => {
    if (!item?.sellerId) return 'Unknown seller';
    if (typeof item.sellerId === 'object') {
      return item.sellerId.businessName || item.sellerId.name || 'Unknown seller';
    }
    return 'Unknown seller';
  };

  const categoryLabel = decodeURIComponent(categoryName || '');
  const sellerCount = new Set(
    items
      .map(item => getSellerName(item))
      .filter(name => name && name !== 'Unknown seller')
  ).size;
  const prices = items
    .map(item => Number(item.price || 0))
    .filter(price => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);
  const lowestPrice = prices[0] ?? null;
  const highestPrice = prices.length > 0 ? prices[prices.length - 1] : null;

  const fetchCategoryItems = useCallback(async () => {
    try {
      const res = await itemsAPI.getAll({ category: categoryLabel });
      setItems(res.data || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load category products');
    } finally {
      setLoading(false);
    }
  }, [categoryLabel, showError]);

  useEffect(() => {
    fetchCategoryItems();
  }, [fetchCategoryItems]);

  const handleAddToCart = (item) => {
    addToCart(item);
    showSuccess('Item added to cart!');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container category-shell">
      <section className="category-banner">
        <div className="category-banner-copy">
          <p className="category-page-kicker">Category browse</p>
          <h1>{categoryLabel}</h1>
          <p className="category-page-subtitle">
            A cleaner view of everything in this category, with a quick summary of sellers, pricing, and product count.
          </p>
          <div className="category-banner-pill-row">
            <span className="category-banner-pill">Curated category view</span>
            <span className="category-banner-pill muted">Updated live from inventory</span>
          </div>
        </div>

        <div className="category-banner-panel">
          <div className="category-banner-stat">
            <strong>{items.length}</strong>
            <span>products</span>
          </div>
          <div className="category-banner-stat">
            <strong>{sellerCount}</strong>
            <span>sellers</span>
          </div>
          <div className="category-banner-stat price">
            <strong>
              {lowestPrice !== null && highestPrice !== null
                ? `${lowestPrice.toFixed(2)} - ${highestPrice.toFixed(2)}`
                : 'N/A'}
            </strong>
            <span>price range</span>
          </div>
        </div>
      </section>

      <div className="category-toolbar">
        <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Back to categories</button>
        <p className="category-toolbar-note">Browse products below or open a product for details.</p>
      </div>

      {items.length === 0 ? (
        <div className="category-empty card">
          <p className="category-empty-title">No products found in this category.</p>
          <p className="category-empty-subtitle">Try a different category or come back later when more items are added.</p>
        </div>
      ) : (
        <div className="product-grid category-results-grid">
          {items.map(item => {
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
                <div className="product-delivery">Delivery: {item.deliveryTimeEstimate || 'TBD'} days</div>
                <div className="product-actions">
                  <button className="btn-primary" onClick={() => navigate(`/product/${item._id}`)}>View</button>
                  <button className="btn-secondary" onClick={() => handleAddToCart(item)} disabled={outOfStock} aria-disabled={outOfStock}>{outOfStock ? 'Out of stock' : 'Add to Cart'}</button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryPage;