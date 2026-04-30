import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { itemsAPI, ratingsAPI, commentsAPI, flagsAPI } from '../api';
import './ProductDetail.css';

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [ratingData, setRatingData] = useState({ rating: 5, review: '' });
  const [flagData, setFlagData] = useState({ reason: 'Delivery Delay', description: '' });

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      const [itemRes, ratingsRes, commentsRes, summaryRes] = await Promise.all([
        itemsAPI.getById(id),
        ratingsAPI.getByItem(id),
        commentsAPI.getByItem(id),
        commentsAPI.getSummary(id),
      ]);
      setItem(itemRes.data);
      setRatings(ratingsRes.data);
      setComments(commentsRes.data);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      console.error('Error fetching product data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await ratingsAPI.create({
        itemId: id,
        ...ratingData,
      });
      setRatingData({ rating: 5, review: '' });
      setShowRatingForm(false);
      fetchProductData();
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    try {
      await flagsAPI.create({
        flaggedUserId: item.sellerId._id,
        ...flagData,
      });
      setFlagData({ reason: 'Delivery Delay', description: '' });
      setShowFlagForm(false);
      alert('Seller flagged successfully');
    } catch (err) {
      console.error('Error flagging seller:', err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!item) return <div className="container">Product not found</div>;

  return (
    <div className="container">
      <div className="page-title">Product Details</div>
      
      <div className="product-detail">
        <div className="product-image-section">
          {item.images?.[0] && <img src={item.images[0]} alt={item.name} />}
        </div>
        
        <div className="product-details-section">
          <h2>{item.name}</h2>
          <p className="seller-name">Sold by: <strong>{item.sellerId.businessName}</strong></p>
          <p className="price">${item.price.toFixed(2)}</p>
          <p className="rating">⭐ {item.rating.average.toFixed(1)} / 5 ({item.rating.count} reviews)</p>
          <p className="description">{item.description}</p>
          <p className="delivery">Delivery Time: {item.deliveryTimeEstimate} days</p>
          <p className="stock">Stock Available: {item.stock}</p>
          
          <div className="actions">
            <button className="btn-primary btn-large" onClick={() => addToCart(item)}>Add to Cart</button>
            <button className="btn-danger" onClick={() => setShowFlagForm(true)}>Flag Seller</button>
          </div>
        </div>
      </div>
      
      {/* Comments Summary Section */}
      <div className="card">
        <h3>📊 Customer Reviews Summary</h3>
        <p className="summary">{summary}</p>
      </div>
      
      {/* Ratings Section */}
      <div className="card">
        <h3>Reviews ({ratings.length})</h3>
        <button className="btn-primary" onClick={() => setShowRatingForm(!showRatingForm)}>
          {showRatingForm ? 'Cancel' : 'Add Review'}
        </button>
        
        {showRatingForm && (
          <form onSubmit={handleSubmitRating} className="rating-form">
            <div className="form-group">
              <label>Rating</label>
              <select 
                value={ratingData.rating} 
                onChange={(e) => setRatingData({...ratingData, rating: parseInt(e.target.value)})}
              >
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Review</label>
              <textarea 
                value={ratingData.review}
                onChange={(e) => setRatingData({...ratingData, review: e.target.value})}
                placeholder="Share your thoughts about this product..."
              ></textarea>
            </div>
            
            <button type="submit" className="btn-primary">Submit Review</button>
          </form>
        )}
        
        <div className="ratings-list">
          {ratings.map(rating => (
            <div key={rating._id} className="rating-item">
              <div className="rating-header">
                <strong>{rating.buyerId.name}</strong>
                <span className="rating-stars">⭐ {rating.rating}/5</span>
              </div>
              <p>{rating.review}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Flag Seller Form */}
      {showFlagForm && (
        <div className="card">
          <h3>Report Issue with Seller</h3>
          <form onSubmit={handleSubmitFlag}>
            <div className="form-group">
              <label>Issue Type</label>
              <select 
                value={flagData.reason}
                onChange={(e) => setFlagData({...flagData, reason: e.target.value})}
              >
                <option value="Delivery Delay">Delivery Delay</option>
                <option value="Item Not Received">Item Not Received</option>
                <option value="Item Damaged">Item Damaged</option>
                <option value="Item Mismatch">Item Doesn't Match Description</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={flagData.description}
                onChange={(e) => setFlagData({...flagData, description: e.target.value})}
                placeholder="Describe the issue in detail..."
              ></textarea>
            </div>
            
            <button type="submit" className="btn-danger">Submit Report</button>
            <button type="button" className="btn-secondary" onClick={() => setShowFlagForm(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
