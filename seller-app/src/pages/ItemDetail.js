import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { itemsAPI } from '../api';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItem = useCallback(async () => {
    try {
      const res = await itemsAPI.getById(id);
      setItem(res.data);
    } catch (err) {
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!item) return <div className="container">Item not found</div>;

  const ratingValue = typeof item.rating === 'object'
    ? Number(item.rating.average || 0)
    : Number(item.rating || 0);
  const reviewCount = typeof item.rating === 'object'
    ? Number(item.rating.count || 0)
    : Number(item.reviews || 0);

  return (
    <div className="container">
      <div className="page-title">Item Details</div>
      
      <div className="card">
        {item.images?.[0] && <img src={item.images[0]} alt={item.name} style={{ maxWidth: '400px', marginBottom: '20px' }} />}
        <h2>{item.name}</h2>
        <p>{item.description}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p><strong>Price:</strong> ${Number(item.price || 0).toFixed(2)}</p>
        <p><strong>Stock:</strong> {item.stock}</p>
        <p><strong>Delivery Time:</strong> {item.deliveryTimeEstimate} days</p>
        <p><strong>Rating:</strong> {ratingValue.toFixed(1)} / 5 ({reviewCount} reviews)</p>
      </div>
    </div>
  );
}

export default ItemDetail;
