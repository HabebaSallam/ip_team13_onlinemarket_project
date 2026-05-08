import React, { useState, useEffect } from 'react';
import { serviceabilityAPI } from '../api';
import ZoneMapSelector from '../components/ZoneMapSelector';
import './DeliveryZones.css';

function DeliveryZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [useMap, setUseMap] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: 5,
    city: '',
    state: '',
  });
  const [searchLocation, setSearchLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await serviceabilityAPI.getZones();
      setZones(res.data.zones || []);
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      alert('Failed to fetch delivery zones');
    } finally {
      setLoading(false);
    }
  };

  // Geocode address to coordinates using Nominatim
  const geocodeLocation = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return [];
    }
  };

  const handleSearchLocation = async (e) => {
    const value = e.target.value;
    setSearchLocation(value);

    if (value.length > 2) {
      const suggestions = await geocodeLocation(value);
      setLocationSuggestions(suggestions);
    } else {
      setLocationSuggestions([]);
    }
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    const address = location.address || {};
    setFormData((prev) => ({
      ...prev,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      city: address.city || address.town || address.village || '',
      state: address.state || '',
    }));
    setSearchLocation('');
    setLocationSuggestions([]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'radius' ? parseFloat(value) : value,
    }));
  };

  const handleMapZoneSelected = (zone) => {
    setFormData((prev) => ({
      ...prev,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
    }));
  };

  const getMapInitialZone = () => ({
    latitude: formData.latitude === '' ? 40.7128 : Number.parseFloat(formData.latitude),
    longitude: formData.longitude === '' ? -74.0060 : Number.parseFloat(formData.longitude),
    radius: Number.parseFloat(formData.radius),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.latitude === '' || formData.longitude === '') {
      alert('Please fill in all required fields (Name, Location)');
      return;
    }

    try {
      if (editingZone) {
        await serviceabilityAPI.updateZone(editingZone._id, formData);
        alert('Delivery zone updated successfully');
      } else {
        await serviceabilityAPI.createZone(formData);
        alert('Delivery zone created successfully');
      }
      resetForm();
      fetchZones();
    } catch (err) {
      console.error('Failed to save zone:', err);
      alert(err.response?.data?.error || 'Failed to save delivery zone');
    }
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
      city: zone.city || '',
      state: zone.state || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this delivery zone?')) return;

    try {
      await serviceabilityAPI.deleteZone(zoneId);
      alert('Delivery zone deleted successfully');
      fetchZones();
    } catch (err) {
      console.error('Failed to delete zone:', err);
      alert('Failed to delete delivery zone');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      radius: 5,
      city: '',
      state: '',
    });
    setEditingZone(null);
    setShowForm(false);
    setUseMap(false);
    setSearchLocation('');
    setLocationSuggestions([]);
    setSelectedLocation(null);
  };

  if (loading) {
    return <div className="container">Loading delivery zones...</div>;
  }

  return (
    <div className="container">
      <div className="page-title">Delivery Zones</div>

      <button
        className="btn-primary"
        onClick={() => (showForm ? resetForm() : setShowForm(true))}
        style={{ marginBottom: '20px' }}
      >
        {showForm ? 'Cancel' : '+ Add Delivery Zone'}
      </button>

      {showForm && (
        <div className="card form-card">
          <h3>{editingZone ? 'Edit Delivery Zone' : 'Create Delivery Zone'}</h3>

          <div className="form-tabs">
            <button
              type="button"
              className={`tab-button ${!useMap ? 'active' : ''}`}
              onClick={() => setUseMap(false)}
            >
              📍 Search Method
            </button>
            <button
              type="button"
              className={`tab-button ${useMap ? 'active' : ''}`}
              onClick={() => setUseMap(true)}
            >
              🗺️ Map Method
            </button>
          </div>

          <form onSubmit={handleSubmit} className="delivery-zone-form">
            <div className="form-group">
              <label>Zone Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g., Downtown, North Area"
                required
              />
            </div>

            <div className="form-group">
              <label>Delivery Radius (km) *</label>
              <input
                type="number"
                name="radius"
                value={formData.radius}
                onChange={handleFormChange}
                min="0.1"
                step="0.1"
                placeholder="5"
                required
              />
            </div>

            {!useMap ? (
              <>
                <div className="form-group">
                  <label>Search Location *</label>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={handleSearchLocation}
                    placeholder="Enter city, address, or coordinates (lat, lon)"
                  />
                  {locationSuggestions.length > 0 && (
                    <div className="location-suggestions">
                      {locationSuggestions.map((location, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onClick={() => selectLocation(location)}
                        >
                          <div className="suggestion-address">{location.display_name}</div>
                          <div className="suggestion-coords">
                            Lat: {location.lat}, Lon: {location.lon}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedLocation && (
                  <div className="selected-location">
                    <strong>Selected Location:</strong>
                    <p>{selectedLocation.display_name}</p>
                    <p>Coordinates: ({formData.latitude}, {formData.longitude})</p>
                  </div>
                )}
              </>
            ) : (
              <div className="map-selector-section">
                <ZoneMapSelector
                  onZoneSelected={handleMapZoneSelected}
                  initialZone={getMapInitialZone()}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Latitude *</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleFormChange}
                  step="0.0001"
                  placeholder="Enter latitude"
                  required
                />
              </div>
              <div className="form-group">
                <label>Longitude *</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleFormChange}
                  step="0.0001"
                  placeholder="Enter longitude"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  placeholder="City name"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleFormChange}
                  placeholder="State name"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              {editingZone ? 'Update Zone' : 'Create Zone'}
            </button>
          </form>
        </div>
      )}

      <div className="zones-list">
        {zones.length === 0 ? (
          <div className="card">
            <p>No delivery zones created yet. Add your first delivery zone to start accepting orders.</p>
          </div>
        ) : (
          zones.map((zone) => (
            <div key={zone._id} className="zone-card card">
              <div className="zone-header">
                <h3>{zone.name}</h3>
                <span className={`status-badge ${zone.isActive ? 'active' : 'inactive'}`}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="zone-details">
                <p>
                  <strong>Location:</strong> {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                </p>
                {zone.city && <p><strong>City:</strong> {zone.city}</p>}
                {zone.state && <p><strong>State:</strong> {zone.state}</p>}
                <p>
                  <strong>Delivery Radius:</strong> {zone.radius} km
                </p>
                <p>
                  <strong>Created:</strong> {new Date(zone.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="zone-actions">
                <button className="btn-secondary" onClick={() => handleEdit(zone)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(zone._id)}>
                  Delete
                </button>
              </div>

              <div className="zone-map-preview">
                <a
                  href={`https://www.openstreetmap.org/?zoom=12&lat=${zone.latitude}&lon=${zone.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-small"
                >
                  View on Map
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DeliveryZones;
