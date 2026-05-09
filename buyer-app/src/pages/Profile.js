import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const { showError, showSuccess } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/buyers/profile');
      setProfile(res.data);
      setFormData({ phone: res.data.phone || '' });
    } catch (err) {
      showError(err.response?.data?.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
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
      await api.put('/buyers/profile', formData);
      setProfile(prev => ({ ...prev, ...formData }));
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
              <label>Full Name</label>
              <input type="text" value={profile.name || ''} disabled />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={profile.email || ''} disabled />
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
            
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        ) : (
          <>
            <p><strong>Name:</strong> {profile.name || 'N/A'}</p>
            <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
            <p><strong>Detected Location:</strong> {profile.detectedLocation ? `${[profile.detectedLocation.address, profile.detectedLocation.city, profile.detectedLocation.state, profile.detectedLocation.zipCode].filter(Boolean).join(', ')}` : 'Not set'}</p>
            <p><strong>Flags Against You:</strong> {profile.buyerFlags || 0}</p>
            
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
