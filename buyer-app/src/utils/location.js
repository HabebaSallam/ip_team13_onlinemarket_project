// Get buyer's current location using HTML5 Geolocation API

const readPosition = (options) =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported in this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const messages = {
          1: 'Location access was denied. Allow location in the browser address bar, or enter coordinates below.',
          2: 'Your position could not be determined.',
          3: 'Getting your location timed out. Try again or enter coordinates manually.',
        };
        reject(new Error(messages[error.code] || error.message || 'Unable to get location'));
      },
      options
    );
  });

/**
 * Tries a high-accuracy read first, then a faster/cached read if the first fails.
 * Many desktops fail or time out with enableHighAccuracy: true only.
 */
export const getBuyerLocation = async () => {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error(
      'Location only works on HTTPS or http://localhost. Open the buyer app from localhost or use HTTPS.'
    );
  }

  try {
    return await readPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  } catch (firstErr) {
    try {
      return await readPosition({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000,
      });
    } catch {
      throw firstErr;
    }
  }
};

// Reverse geocode coordinates to get address (using a free service like Nominatim)
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Geocode HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      address: data.address?.road || data.address?.street || '',
      city: data.address?.city || data.address?.town || data.address?.county || '',
      state: data.address?.state || '',
      zipCode: data.address?.postcode || '',
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return {
      address: '',
      city: '',
      state: '',
      zipCode: '',
    };
  }
};

// Calculate distance between two coordinates (in km)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance for display
export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${Math.round(km * 10) / 10} km`;
};
