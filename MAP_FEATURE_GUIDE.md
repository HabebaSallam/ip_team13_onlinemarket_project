# Delivery Zones Map Integration Guide

## Overview
The seller app now includes an interactive map interface for creating and managing delivery zones. Sellers can choose between two methods: **Search-based** (address lookup) or **Map-based** (interactive visualization).

## Feature Highlights

### 🗺️ Interactive Map Interface
- **Leaflet.js**: Professional mapping library using OpenStreetMap tiles
- **Draggable Marker**: Click and drag to reposition zone center
- **Click-to-Place**: Click anywhere on map to set zone center
- **Live Radius Visualization**: Circle updates in real-time as radius slider changes
- **Address Search**: Type city/address to auto-center map
- **Coordinate Display**: Real-time lat/lon/radius values shown

### 📱 Responsive Design
- Works seamlessly on desktop, tablet, and mobile
- Map height: 450px (desktop), 350px (mobile)
- Tab interface adapts to screen size
- Touch-friendly controls

### 🔍 Two Input Methods

#### Method 1: Search-Based (📍 Search Method)
1. Enter city or address in search box
2. Select from dropdown suggestions (powered by Nominatim)
3. Coordinates auto-populate
4. Set radius using slider or text input
5. Submit form

#### Method 2: Map-Based (🗺️ Map Method)
1. Map loads with default center (NYC)
2. Search for location OR click map to place zone
3. Drag marker to fine-tune position
4. Adjust radius slider to set coverage area
5. Coordinates display in real-time
6. Submit form when satisfied

## How to Use

### Creating a New Delivery Zone

1. Navigate to **Delivery Zones** in seller navigation
2. Click **+ Add Delivery Zone** button
3. Fill in **Zone Name** (required)
4. Choose input method:
   - Click **📍 Search Method** for address lookup
   - Click **🗺️ Map Method** for interactive map

#### Using Map Method (Recommended)
```
1. Map appears with default center
2. Click search box and type "Mumbai" or "New York" → Map centers there
3. OR click directly on map to place zone center
4. Drag red marker if needed for fine adjustment
5. Adjust radius slider below map (0.1 - 50 km range)
   - Real-time circle shows coverage area
6. View coordinates display: Latitude, Longitude, Radius
7. Enter zone name and click "Create Zone"
```

#### Using Search Method
```
1. Type city name in "Search Location" input
2. Wait for dropdown suggestions (from OpenStreetMap)
3. Click suggestion to populate coordinates
4. Review latitude/longitude in text fields
5. Adjust radius slider
6. Enter zone name and click "Create Zone"
```

### Editing Existing Zones
1. Navigate to **Delivery Zones**
2. Find zone in list below form
3. Click **Edit** button
4. Modify name/radius/location
5. Use map or search to change location
6. Click **Update Zone**

### Deleting Zones
1. Find zone in list
2. Click **Delete** button
3. Confirm deletion in popup
4. Zone removed immediately

## Technical Details

### Coordinates & Distance
- **Format**: WGS84 (World Geodetic System)
- **Latitude**: -90 to +90 (North/South)
- **Longitude**: -180 to +180 (East/West)
- **Radius**: 0.1 - 50 km
- **Distance Calculation**: Haversine formula (accurate within 0.5%)

### Map API Details
- **Tile Provider**: OpenStreetMap (free, no API key needed)
- **Map Library**: Leaflet.js v1.9.4 (via CDN)
- **Search Service**: Nominatim API (free, OpenStreetMap project)

### Zone Validation
- Buyer location checked against all seller's zones
- Distance calculated from buyer coords to zone center
- If buyer within ANY zone's radius → Can purchase
- If buyer outside ALL zones → "Out of delivery zone" error

## Common Use Cases

### Scenario 1: Seller in Single City
1. Create one large zone covering entire city
2. Set radius to include whole service area (e.g., 8-10 km)
3. Or create multiple smaller zones for different neighborhoods

### Scenario 2: Multi-Area Seller
1. Create separate zones for each service area
2. Zone 1: Downtown (smaller radius: 3 km)
3. Zone 2: Airport Area (larger radius: 8 km)
4. Zone 3: Suburbs (radius: 12 km)

### Scenario 3: Precise Coverage
1. Use map to pinpoint exact zone center
2. Fine-tune with marker drag
3. Adjust radius to match actual delivery capability
4. View on OpenStreetMap to verify coverage

## Map Features Explained

### Search Box
- **Input**: City name, address, or street
- **Source**: Nominatim (OpenStreetMap)
- **Output**: Map centers on location, coordinates populate
- **Press Enter**: Executes search

### Marker
- **Color**: Red/blue depending on state
- **Draggable**: Yes - drag to reposition
- **Behavior**: Circle follows marker position

### Circle
- **Color**: Blue with semi-transparent fill
- **Represents**: Delivery zone coverage area
- **Radius**: Matches "Delivery Radius" setting

### Coordinates Display
```
Latitude: 28.6139
Longitude: 77.2090
Radius: 5.5 km
```
- **Updates**: Real-time as you interact with map
- **Purpose**: Visual confirmation of zone settings
- **Manual Edit**: Can type directly in text fields

### Instructions Overlay
- **Location**: Bottom-left corner of map
- **Content**: 
  - Click on map to move zone center
  - Drag marker to reposition zone
  - Use radius slider to adjust coverage area
  - Search box to quickly center on city/address

## Troubleshooting

### Map Not Loading
- Check internet connection (Leaflet CDN required)
- Clear browser cache and reload
- Try different browser if issue persists

### Search Not Working
- Ensure internet connection
- Use common city/place names
- Nominatim may have rate limits if too many searches done

### Radius Not Updating
- Verify slider is moving (visual feedback)
- Check that coordinates display changes
- Refresh page if issues persist

### Can't Save Zone
- Verify zone name is entered
- Confirm coordinates are populated (not blank)
- Check radius is within 0.1 - 50 km range
- Look for error message from server

## Tips & Best Practices

✅ **DO:**
- Test zone coverage by checking from buyer app
- Use multiple zones for better coverage precision
- Center zones on actual warehouses/distribution points
- Set realistic radius based on delivery capability
- Regularly review and update zones

❌ **DON'T:**
- Create overlapping zones (wastes data, no real benefit)
- Set radius too small (limits buyer base unnecessarily)
- Set radius too large (accept orders you can't fulfill)
- Forget to test zone visibility from buyer perspective

## Data Saved
When you create a zone, the following data is stored:
- Zone name
- Latitude (accurate to 4 decimal places ≈ 11 meters)
- Longitude (accurate to 4 decimal places ≈ 11 meters)
- Radius (in kilometers)
- City (optional)
- State (optional)
- Is Active (true/false)
- Created date/time
- Last updated date/time

## Integration with Buyer App

### Buyer Experience
1. Buyer location captured on first login (with permission)
2. When buyer tries to purchase:
   - System checks if buyer in ANY seller's delivery zone
   - Distance calculated using Haversine formula
   - If distance ≤ radius → Purchase allowed ✅
   - If distance > radius → "Out of delivery zone" error ❌

### Real-Time Validation
- Cart validation runs BEFORE payment
- Gives buyer immediate feedback
- Prevents failed orders at checkout
- Toast notifications show error messages

## API Endpoints (Behind the Scenes)

```
GET    /api/serviceability/zones              → Fetch seller's zones
POST   /api/serviceability/zones              → Create new zone
PUT    /api/serviceability/zones/:zoneId     → Update zone
DELETE /api/serviceability/zones/:zoneId     → Delete zone
GET    /api/serviceability/check/:sellerId   → Check if buyer in zone
POST   /api/serviceability/check-cart        → Validate cart items
```

All endpoints require authentication via Bearer token.

## Support

For issues or questions:
1. Check troubleshooting section above
2. Verify internet connection
3. Clear browser cache
4. Try different browser
5. Contact support with screenshot of issue

---

**Last Updated**: 2024
**Version**: 1.0 with interactive map support
