import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { itemsAPI, ratingsAPI, commentsAPI, flagsAPI } from '../api';
import './ProductDetail.css';

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [ratingData, setRatingData] = useState({ rating: 5, review: '' });
  const [commentText, setCommentText] = useState('');
  const [flagData, setFlagData] = useState({ reason: 'Delivery Delay', description: '' });

  const fetchProductData = useCallback(async () => {
    try {
      const [itemRes, ratingsRes, commentsRes] = await Promise.all([
        itemsAPI.getById(id),
        ratingsAPI.getByItem(id),
        commentsAPI.getByItem(id),
      ]);

      setItem(itemRes.data);
      setRatings(ratingsRes.data);
      setComments(commentsRes.data);
    } catch (err) {
      console.error('Error fetching product data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const summaryRes = await commentsAPI.getSummary(id);
      setSummary(summaryRes.data.summary || 'No summary available yet.');
    } catch (err) {
      console.error('Error fetching comment summary:', err);
      setSummary('');
      alert(err.response?.data?.error || 'Unable to generate AI summary. Make sure GROK_API_KEY is set.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const getSellerName = () => {
    if (!item?.sellerId) return 'Unknown seller';
    if (typeof item.sellerId === 'object') {
      return item.sellerId.businessName || item.sellerId.name || 'Unknown seller';
    }
    return 'Unknown seller';
  };

  const getRatingText = () => {
    if (item?.reviews !== undefined) {
      const average = Number(item?.rating ?? 0);
      const count = Number(item?.reviews ?? 0);
      return `⭐ ${average.toFixed(1)} / 5 (${count} reviews)`;
    }

    const ratingValue = Number(item?.rating ?? 0);
    return `⭐ ${ratingValue.toFixed(1)} / 5 (0 reviews)`;
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await ratingsAPI.create({
        itemId: id,
        rating: ratingData.rating,
        review: ratingData.review,
      });
      setRatingData({ rating: 5, review: '' });
      setShowRatingForm(false);
      await fetchProductData();
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert(err.response?.data?.error || 'Unable to submit review');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    try {
      await commentsAPI.create({
        productId: id,
        text: commentText,
      });
      setCommentText('');
      setShowCommentForm(false);
      await fetchProductData();
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert(err.response?.data?.error || 'Unable to submit comment');
    }
  };


  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    try {
      const sellerId = item?.sellerId && typeof item.sellerId === 'object' ? item.sellerId._id : item?.sellerId;
      if (!sellerId) throw new Error('Seller ID not available');

      await flagsAPI.create({
        flaggedUserId: sellerId,
        ...flagData,
      });
      setFlagData({ reason: 'Delivery Delay', description: '' });
      setShowFlagForm(false);
      alert('Seller flagged successfully');
    } catch (err) {
      console.error('Error flagging seller:', err);
      alert(err.response?.data?.error || 'Unable to flag seller');
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
          <p className="seller-name">Sold by: <strong>{getSellerName()}</strong></p>
          <p className="price">${Number(item.price || 0).toFixed(2)}</p>
          <p className="rating">{getRatingText()}</p>
          <p className="description">{item.description}</p>
          <p className="delivery">Delivery Time: {item.deliveryTimeEstimate} days</p>
          <p className="stock">Stock Available: {item.stock}</p>
          
          <div className="actions">
            <button className="btn-primary btn-large" onClick={() => addToCart(item)}>Add to Cart</button>
            <button className="btn-secondary" onClick={() => setShowRatingForm(!showRatingForm)}>
              {showRatingForm ? 'Hide Review Form' : 'Add Review'}
            </button>
            <button className="btn-secondary" onClick={() => setShowCommentForm(!showCommentForm)}>
              {showCommentForm ? 'Hide Comment Form' : 'Add Comment'}
            </button>
            <button className="btn-danger" onClick={() => setShowFlagForm(!showFlagForm)}>Flag Seller</button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>AI Summary of Comments</h3>
        <button
          type="button"
          className="btn-primary"
          onClick={handleGenerateSummary}
          disabled={summaryLoading}
        >
          {summaryLoading ? 'Generating Summary...' : 'Generate AI Summary'}
        </button>
        {summary ? (
          <p className="summary" style={{ marginTop: '15px' }}>{summary}</p>
        ) : (
          <p className="summary" style={{ marginTop: '15px' }}>
            Click the button to generate an AI summary from the comments.
          </p>
        )}
      </div>

      {showRatingForm && (
        <div className="card">
          <h3>Add Review</h3>
          <form onSubmit={handleSubmitRating} className="rating-form">
            <div className="form-group">
              <label>Rating</label>
              <select value={ratingData.rating} onChange={(e) => setRatingData({ ...ratingData, rating: parseInt(e.target.value, 10) })}>
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
                onChange={(e) => setRatingData({ ...ratingData, review: e.target.value })}
                placeholder="Share your thoughts about this product..."
              />
            </div>
            <button type="submit" className="btn-primary">Submit Review</button>
          </form>
        </div>
      )}

      {showCommentForm && (
        <div className="card">
          <h3>Add Comment</h3>
          <form onSubmit={handleSubmitComment}>
            <div className="form-group">
              <label>Comment</label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ask the seller or leave feedback..."
              />
            </div>
            <button type="submit" className="btn-primary">Submit Comment</button>
          </form>
        </div>
      )}

      {showFlagForm && (
        <div className="card">
          <h3>Flag Seller</h3>
          <form onSubmit={handleSubmitFlag}>
            <div className="form-group">
              <label>Reason</label>
              <select
                value={flagData.reason}
                onChange={(e) => setFlagData({ ...flagData, reason: e.target.value })}
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
                onChange={(e) => setFlagData({ ...flagData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
              />
            </div>
            <button type="submit" className="btn-danger">Submit Report</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Reviews ({ratings.length})</h3>
        <div className="ratings-list">
          {ratings.map((rating) => (
            <div key={rating._id} className="rating-item">
              <div className="rating-header">
                <strong>{rating.user?.name || 'Buyer'}</strong>
                <span className="rating-stars">⭐ {rating.rating}/5</span>
              </div>
              <p>{rating.comment}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Comments ({comments.length})</h3>
        <div className="ratings-list">
          {comments.map((comment) => (
            <div key={comment._id} className="rating-item">
              <div className="rating-header">
                <strong>{comment.user?.name || 'Buyer'}</strong>
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p>{comment.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
