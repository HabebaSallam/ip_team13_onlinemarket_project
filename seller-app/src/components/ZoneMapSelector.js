import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './ZoneMapSelector.css';

const normalizeZone = (zone) => ({
  latitude: Number.parseFloat(zone?.latitude ?? 40.7128),
  longitude: Number.parseFloat(zone?.longitude ?? -74.006),
  radius: Number.parseFloat(zone?.radius ?? 5),
});

function ZoneMapSelector({ onZoneSelected, initialZone = null }) {
  const [zone, setZone] = useState(normalizeZone(initialZone));
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    onZoneSelected(normalizeZone(initialZone));

    if (!L.Icon.Default.prototype.options.iconUrl) {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
      });
    }

    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    const mapInstance = L.map(mapContainerRef.current, {
      center: [zone.latitude, zone.longitude],
      zoom: 13,
      dragging: true,
      tap: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstance);

    const markerInstance = L.marker([zone.latitude, zone.longitude], {
      draggable: true,
      title: 'Drag to move zone center',
    }).addTo(mapInstance);

    const circleInstance = L.circle([zone.latitude, zone.longitude], {
      radius: zone.radius * 1000,
      color: '#007bff',
      fillColor: '#007bff',
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(mapInstance);

    markerInstance.on('drag', (e) => {
      const pos = e.target.getLatLng();
      const newZone = {
        ...zone,
        latitude: pos.lat,
        longitude: pos.lng,
      };
      setZone(newZone);
      circleInstance.setLatLng([pos.lat, pos.lng]);
      onZoneSelected(newZone);
    });

    mapInstance.on('click', (e) => {
      markerInstance.setLatLng(e.latlng);
      const newZone = {
        ...zone,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      };
      setZone(newZone);
      circleInstance.setLatLng([e.latlng.lat, e.latlng.lng]);
      onZoneSelected(newZone);
    });

    mapRef.current = mapInstance;
    markerRef.current = markerInstance;
    circleRef.current = circleInstance;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  const handleRadiusChange = (e) => {
    const newRadius = parseFloat(e.target.value);
    const newZone = { ...zone, radius: newRadius };
    setZone(newZone);

    if (circleRef.current) {
      circleRef.current.setRadius(newRadius * 1000);
    }

    onZoneSelected(newZone);
  };

  const handleSearchAndCenter = async (address) => {
    if (!address) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        const newZone = { ...zone, latitude: lat, longitude: lon };
        setZone(newZone);

        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 13);
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lon]);
        }

        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lon]);
        }

        onZoneSelected(newZone);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="zone-map-selector">
      <div className="map-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search location (city or address)..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchAndCenter(e.target.value);
              }
            }}
            className="search-input"
          />
        </div>

        <div className="radius-control">
          <label>Delivery Radius: {zone.radius} km</label>
          <input
            type="range"
            min="0.1"
            max="50"
            step="0.1"
            value={zone.radius}
            onChange={handleRadiusChange}
            className="radius-slider"
          />
          <small>Slide to adjust or type radius</small>
        </div>

        <div className="coordinates-display">
          <p><strong>Latitude:</strong> {Number(zone.latitude).toFixed(4)}</p>
          <p><strong>Longitude:</strong> {Number(zone.longitude).toFixed(4)}</p>
          <p><strong>Radius:</strong> {zone.radius} km</p>
        </div>
      </div>

      <div className="map-container-wrapper">
        <div ref={mapContainerRef} className="map-container"></div>
        <div className="map-instructions">
          <strong>Map Instructions:</strong>
          <ul>
            <li>Click on map to move zone center</li>
            <li>Drag marker to reposition zone</li>
            <li>Use radius slider to adjust coverage area</li>
            <li>Search box to quickly center on city/address</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ZoneMapSelector;
