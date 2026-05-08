import React, { useEffect, useState } from 'react';
import { getBuyerLocation, reverseGeocode } from '../utils/location';
import { serviceabilityAPI } from '../api';
import { useToast } from '../context/ToastContext';

export const LocationSetup = ({ onLocationReady, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    // Auto-request location on component mount
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setLoading(true);
    setLocationRequested(true);
    try {
      const { latitude, longitude, accuracy } = await getBuyerLocation();

      // Get address from coordinates
      const addressData = await reverseGeocode(latitude, longitude);

      // Save to backend
      await serviceabilityAPI.updateLocation({
        latitude,
        longitude,
        accuracy,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
      });

      showSuccess('Location detected successfully');
      if (onLocationReady) {
        onLocationReady({
          latitude,
          longitude,
          ...addressData,
        });
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      showError(err.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Enable Location Services</h2>
        <p>To check delivery availability, we need your location.</p>
        {locationRequested && (
          <div style={styles.status}>
            {loading ? (
              <>
                <p>⏳ Getting your location...</p>
                <p style={styles.hint}>Please allow location access when prompted</p>
              </>
            ) : (
              <p>Location setup</p>
            )}
          </div>
        )}
        {!locationRequested && (
          <button onClick={requestLocation} style={styles.button} disabled={loading}>
            {loading ? 'Getting Location...' : 'Enable Location'}
          </button>
        )}
        {locationRequested && (
          <button onClick={onClose} style={styles.skipButton}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  status: {
    margin: '20px 0',
    padding: '15px',
    backgroundColor: '#f0f4f8',
    borderRadius: '4px',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    margin: '10px 0 0 0',
  },
  button: {
    width: '100%',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '15px',
  },
  skipButton: {
    width: '100%',
    padding: '10px 20px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
  },
};
