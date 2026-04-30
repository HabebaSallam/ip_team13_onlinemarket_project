import React, { useState, useEffect } from 'react';
import { sellerAPI } from '../api';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await sellerAPI.getProfile();
      setProfile(res.data);
      setFormData(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
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
      await sellerAPI.updateProfile(formData);
      setProfile(formData);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
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
              <label>Business Name</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} />
            </div>
            
            <button type="submit" className="btn-primary">Save Changes</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        ) : (
          <>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Business:</strong> {profile.businessName}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <p><strong>Address:</strong> {profile.address}, {profile.city}, {profile.state}</p>
            <p><strong>Rating:</strong> {profile.averageRating.toFixed(1)} / 5</p>
            <p><strong>Flags:</strong> {profile.flags}</p>
            
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
