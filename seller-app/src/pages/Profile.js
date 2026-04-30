import React, { useState, useEffect } from 'react';
import { sellerAPI } from '../api';
import { useToast } from '../context/ToastContext';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await sellerAPI.getProfile();
      setProfile(res.data);
      setFormData(res.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.businessName?.trim()) errors.businessName = 'Business name is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.address?.trim()) errors.address = 'Address is required';
    if (!formData.city?.trim()) errors.city = 'City is required';
    if (!formData.state?.trim()) errors.state = 'State is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError('Please fix the errors below');
      return;
    }
    
    setSubmitting(true);
    try {
      await sellerAPI.updateProfile(formData);
      setProfile(formData);
      setEditing(false);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="container">Profile not found</div>;

  return (
    <div className="container">
      <div className="page-title">My Profile</div>
      
      <div className="card">
        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Business Name <span className="required">*</span></label>
              <input 
                type="text" 
                name="businessName" 
                value={formData.businessName || ''} 
                onChange={handleChange}
                placeholder="Your business name"
              />
              {formErrors.businessName && <p className="error-text">{formErrors.businessName}</p>}
            </div>
            
            <div className="form-group">
              <label>Phone <span className="required">*</span></label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone || ''} 
                onChange={handleChange}
                placeholder="Phone number"
              />
              {formErrors.phone && <p className="error-text">{formErrors.phone}</p>}
            </div>
            
            <div className="form-group">
              <label>Address <span className="required">*</span></label>
              <input 
                type="text" 
                name="address" 
                value={formData.address || ''} 
                onChange={handleChange}
                placeholder="Street address"
              />
              {formErrors.address && <p className="error-text">{formErrors.address}</p>}
            </div>
            
            <div className="form-group">
              <label>City <span className="required">*</span></label>
              <input 
                type="text" 
                name="city" 
                value={formData.city || ''} 
                onChange={handleChange}
                placeholder="City"
              />
              {formErrors.city && <p className="error-text">{formErrors.city}</p>}
            </div>
            
            <div className="form-group">
              <label>State <span className="required">*</span></label>
              <input 
                type="text" 
                name="state" 
                value={formData.state || ''} 
                onChange={handleChange}
                placeholder="State"
              />
              {formErrors.state && <p className="error-text">{formErrors.state}</p>}
            </div>
            
            <div className="form-group">
              <label>Zip Code</label>
              <input 
                type="text" 
                name="zipCode" 
                value={formData.zipCode || ''} 
                onChange={handleChange}
                placeholder="Zip code"
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        ) : (
          <>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Business:</strong> {profile.businessName || 'Not set'}</p>
            <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
            <p><strong>Address:</strong> {profile.address && profile.city && profile.state ? `${profile.address}, ${profile.city}, ${profile.state}` : 'Not set'}</p>
            <p><strong>Rating:</strong> {Number(profile.rating || 0).toFixed(1)} / 5</p>
            <p><strong>Flags:</strong> {profile.flags || 0}</p>
            
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
