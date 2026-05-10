import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsAPI, cartAPI, serviceabilityAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Catalog.css';

function CategoryPage({ addToCart: addToCartFromParent }) {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingItemId, setAddingItemId] = useState(null);
  const [sellerServiceability, setSellerServiceability] = useState({});
  const [checkingServiceability, setCheckingServiceability] = useState({});

  const getSellerName = (item) => {
    if (!item?.sellerId) return 'Unknown seller';
    if (typeof item.sellerId === 'object') {
      return item.sellerId.businessName || item.sellerId.name || 'Unknown seller';
    }
    return 'Unknown seller';
  };

  const getSellerId = (item) => {
    if (!item?.sellerId) return null;
    return typeof item.sellerId === 'object' ? item.sellerId._id : item.sellerId;
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

  useEffect(() => {
    let cancelled = false;
    const uniqueSellerIds = [...new Set(items.map(getSellerId).filter(Boolean))];

    if (uniqueSellerIds.length === 0) {
      setSellerServiceability({});
      setCheckingServiceability({});
      return () => {};
    }

    setCheckingServiceability((prev) => {
      const next = { ...prev };
      uniqueSellerIds.forEach((sellerId) => {
        next[sellerId] = true;
      });
      return next;
    });

    Promise.allSettled(
      uniqueSellerIds.map(async (sellerId) => {
        const response = await serviceabilityAPI.checkServiceability(sellerId);
        return {
          sellerId,
          isServiceable: response.data?.isServiceable !== false,
        };
      })
    ).then((results) => {
      if (cancelled) return;

      setSellerServiceability((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            next[result.value.sellerId] = result.value.isServiceable;
          }
        });
        return next;
      });

      setCheckingServiceability((prev) => {
        const next = { ...prev };
        uniqueSellerIds.forEach((sellerId) => {
          delete next[sellerId];
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const isOutOfDeliveryZone = (item) => {
    const sellerId = getSellerId(item);
    if (!sellerId) return false;
    return sellerServiceability[sellerId] === false;
  };

  const isCheckingDeliveryZone = (item) => {
    const sellerId = getSellerId(item);
    if (!sellerId) return false;
    return Boolean(checkingServiceability[sellerId]);
  };

  const handleAddToCart = async (item) => {
    setAddingItemId(item._id);
    try {
      if (isOutOfDeliveryZone(item)) {
        showError('This item is outside your delivery zone');
        return;
      }

      const response = await cartAPI.addToCart(item._id, 1);
      showSuccess('Item added to cart!');
      // Call parent addToCart to sync state if needed
      if (addToCartFromParent) {
        addToCartFromParent(item, response.data.cart);
      }
      showSuccess('Item added to cart!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      showError(errorMessage);
      console.error('Error adding to cart:', err);
    } finally {
      setAddingItemId(null);
    }
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
            const outOfZone = isOutOfDeliveryZone(item);
            const checkingZone = isCheckingDeliveryZone(item);
            return (
            <div key={item._id} className={`product-card ${outOfStock ? 'out-of-stock' : ''} ${outOfZone ? 'out-of-zone' : ''}`}>
              {item.images?.[0] && <img src={item.images[0]} alt={item.name} className="product-image" />}
              {outOfStock && <div className="out-of-stock-badge">Out of stock</div>}
              {outOfZone && <div className="out-of-zone-badge">Out of delivery zone</div>}
              <div className="product-info">
                <div className="product-category">{item.category?.name || item.category || 'Uncategorized'}</div>
                <div className="product-name">{item.name}</div>
                <div className="product-seller">{getSellerName(item)}</div>
                <div className="product-price">${Number(item.price || 0).toFixed(2)}</div>
                <div className="product-delivery">Delivery: {item.deliveryTimeEstimate || 'TBD'} days</div>
                <div className="product-actions">
                  <button className="btn-primary" onClick={() => navigate(`/product/${item._id}`)}>View</button>
                  <button className="btn-secondary" onClick={() => handleAddToCart(item)} disabled={outOfStock || outOfZone || checkingZone || addingItemId === item._id} aria-disabled={outOfStock || outOfZone || checkingZone || addingItemId === item._id}>{addingItemId === item._id ? 'Adding...' : outOfStock ? 'Out of stock' : outOfZone ? 'Out of zone' : checkingZone ? 'Checking zone...' : 'Add to Cart'}</button>
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