# Serviceability Feature Implementation Guide

## Overview
The serviceability feature allows sellers to define delivery zones using real geographic locations, and buyers can only purchase products from sellers whose delivery zones cover their location.

---

## Backend Implementation

### 1. New Database Models

#### DeliveryZone Model (`models/DeliveryZone.js`)
Stores seller delivery zones with real coordinates and radius:
- `sellerId`: Reference to the seller user
- `name`: Zone name (e.g., "Downtown", "North Area")
- `latitude` & `longitude`: Center point coordinates
- `radius`: Delivery radius in kilometers
- `city` & `state`: Location info
- `isActive`: Toggle zones on/off without deleting

#### BuyerLocation Model (`models/BuyerLocation.js`)
Stores buyer's current location:
- `buyerId`: Reference to the buyer user (unique)
- `latitude` & `longitude`: Buyer's current coordinates
- `address`, `city`, `state`, `zipCode`: Location details
- `accuracy`: GPS accuracy in meters

### 2. ServiceabilityController (`controllers/serviceabilityController.js`)

Key functions:
- **`checkServiceability()`** - Check if buyer is within a seller's delivery zone
- **`checkCartServiceability()`** - Validate all items in cart for delivery
- **`getSellerZones()`** - Get seller's delivery zones
- **`createDeliveryZone()`** - Create new zone
- **`updateDeliveryZone()`** - Modify zone details
- **`deleteDeliveryZone()`** - Remove zone
- **`updateBuyerLocation()`** - Save buyer's location
- **`getBuyerLocation()`** - Retrieve buyer's location

**Distance Calculation**: Uses Haversine formula for accurate distance calculations between coordinates:
```
Distance (km) = 2 * R * arcsin(√sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2))
```

### 3. Updated CartController
Enhanced `addToCart()` to:
- Check if buyer has location enabled
- Verify seller has delivery zones configured
- Calculate distance from buyer to each zone
- Reject items with error "Out of delivery zone" if not serviceable

### 4. API Endpoints

**Serviceability Routes** (`routes/serviceability.js`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/serviceability/location` | Get buyer's saved location |
| POST | `/api/serviceability/location` | Update buyer's location |
| GET | `/api/serviceability/check/:sellerId` | Check serviceability for seller |
| POST | `/api/serviceability/check-cart` | Validate entire cart |
| GET | `/api/serviceability/zones` | Get seller's zones (seller auth) |
| POST | `/api/serviceability/zones` | Create zone |
| PUT | `/api/serviceability/zones/:zoneId` | Update zone |
| DELETE | `/api/serviceability/zones/:zoneId` | Delete zone |

---

## Frontend Implementation

### Buyer App Changes

#### 1. Location Utilities (`buyer-app/src/utils/location.js`)
Helper functions:
- `getBuyerLocation()` - Request browser geolocation
- `reverseGeocode()` - Convert coordinates to address (OpenStreetMap API)
- `calculateDistance()` - Calculate distance between points
- `formatDistance()` - Format distance for display

#### 2. LocationSetup Component (`buyer-app/src/components/LocationSetup.js`)
Modal that:
- Requests location permission on first login
- Shows loading state while retrieving coordinates
- Allows user to skip and set up later
- Stores location in backend for serviceability checks
- Can be dismissed and shown again

#### 3. Updated App.js
- Added location setup state management
- Shows LocationSetup modal for unauthenticated users without saved location
- Checks location status on login

#### 4. Enhanced Cart Controller
- Validates serviceability before adding items
- Shows error messages for out-of-delivery-zone items
- Automatically enforces location requirement

#### 5. API Integration (`buyer-app/src/api.js`)
Added serviceability API endpoints:
```javascript
serviceabilityAPI = {
  updateLocation(data),
  getLocation(),
  checkServiceability(sellerId),
  checkCartServiceability(cartItems)
}
```

---

### Seller App Changes

#### 1. DeliveryZones Page (`seller-app/src/pages/DeliveryZones.js`)
Complete management interface:
- **View Zones**: List all delivery zones with details
- **Create Zone**: 
  - Search locations using Nominatim API (OpenStreetMap)
  - Auto-populate coordinates from search results
  - Set delivery radius in km
  - Specify zone name, city, state
- **Edit Zone**: Modify any zone details
- **Delete Zone**: Remove zones with confirmation
- **Map Link**: Quick link to view zone on OpenStreetMap

Location search uses Nominatim (free, open-source geocoding):
- Real-time suggestions as user types
- Displays address and coordinates
- One-click selection to populate form

#### 2. DeliveryZones CSS (`seller-app/src/pages/DeliveryZones.css`)
Responsive styling for:
- Form inputs and searches
- Location suggestions dropdown
- Zone cards with details
- Action buttons
- Mobile-friendly layout

#### 3. Updated Navbar (`seller-app/src/components/Navbar.js`)
Added "Delivery Zones" link for easy navigation

#### 4. API Integration (`seller-app/src/api.js`)
Added serviceability endpoints:
```javascript
serviceabilityAPI = {
  getZones(),
  createZone(data),
  updateZone(zoneId, data),
  deleteZone(zoneId)
}
```

---

## How It Works

### From Seller Perspective
1. **Setup Delivery Zones**:
   - Go to "Delivery Zones" in seller app
   - Click "+ Add Delivery Zone"
   - Search for location (e.g., "New York, Downtown")
   - Set delivery radius (e.g., 5 km)
   - Save zone
   - Multiple zones can be created for different areas

2. **Manage Zones**:
   - View all active zones
   - Edit zones to adjust radius or location
   - Delete zones that are no longer serviced
   - View zone on map for verification

### From Buyer Perspective
1. **First Login**:
   - Location permission modal appears
   - Browser requests access to geolocation
   - Coordinates and address auto-filled
   - Can skip and set location later

2. **Add to Cart**:
   - Backend checks seller's delivery zones
   - If zones exist, validates buyer is within range
   - If out of range: error "Out of delivery zone"
   - If in range: item added successfully
   - If seller has no zones: item added (seller delivers everywhere)

3. **View Location**:
   - Buyer can check saved location in account
   - Location used for all serviceability checks

---

## Real Location Features

### Geocoding
- Uses **Nominatim API** (OpenStreetMap)
- Free and unlimited (no API key required)
- Supports address search, reverse geocoding
- Real coordinates for actual locations

### Distance Calculation
- Uses **Haversine formula** for accuracy
- Accounts for Earth's curvature
- Results accurate to within 0.5%
- Supports decimal precision (0.0001° ≈ 11 meters)

### Map Integration
- OpenStreetMap links for visualization
- Buyers can verify delivery zones
- Uses standard map coordinates (WGS84)

---

## Testing the Feature

### Setup Test Scenario
1. **Create Seller Zones**:
   - Login as seller
   - Go to Delivery Zones
   - Search for "New York" or your city
   - Create zones with 5km radius

2. **Add Buyer Location**:
   - Login as buyer
   - Enable location when prompted
   - Or update in settings

3. **Test Purchase**:
   - Try adding items from seller
   - If buyer in zone: succeeds
   - If buyer out of zone: shows error

### Example Test Data
**Seller Zone**: New York (40.7128, -74.0060) with 5km radius
**Buyer In Zone**: Manhattan (40.7580, -73.9855) - ~5km away ✓
**Buyer Out of Zone**: New Jersey (40.7282, -74.0076) - ~8km away ✗

---

## Browser Compatibility
- Modern browsers with Geolocation API support
- Firefox, Chrome, Safari, Edge
- HTTPS required for geolocation (except localhost)
- User must grant location permission

---

## Performance Considerations
1. **Distance Calculation**: O(n) where n = number of seller zones
2. **Geocoding**: Nominatim is rate-limited (1 request/sec for free tier)
3. **Location Storage**: Minimal data (just coordinates)
4. **Database Indexes**: Add indexes on `sellerId` and `buyerId` for queries

---

## Security Notes
- Location data stored server-side (not exposed in responses unnecessarily)
- Buyers can't see other buyers' locations
- Sellers can only manage their own zones
- CORS configured to allow legitimate requests

---

## Future Enhancements
1. **Interactive Map Drawing**: Draw zones visually on map
2. **Multiple Service Types**: Different zones for different item types
3. **Dynamic Pricing**: Adjust shipping cost based on distance
4. **Holiday Schedules**: Pause/enable zones seasonally
5. **Coverage Analytics**: Visualize buyer distribution vs. zones
6. **SMS Notifications**: Notify buyers when entering/leaving zones

---

## API Response Examples

### Create Zone (Seller)
```json
POST /api/serviceability/zones
{
  "name": "Downtown Service Area",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 5,
  "city": "New York",
  "state": "NY"
}

Response (201):
{
  "success": true,
  "zone": {
    "_id": "...",
    "name": "Downtown Service Area",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 5,
    "isActive": true,
    "createdAt": "2024-05-09T..."
  }
}
```

### Check Serviceability (Buyer)
```json
GET /api/serviceability/check/SELLER_ID
Response (200):
{
  "success": true,
  "isServiceable": true,
  "buyerLocation": {
    "latitude": 40.7580,
    "longitude": -73.9855,
    "address": "Manhattan, New York"
  }
}
```

### Check Cart Serviceability
```json
POST /api/serviceability/check-cart
{
  "cartItems": [
    {"productId": "PRODUCT_ID_1", "quantity": 1},
    {"productId": "PRODUCT_ID_2", "quantity": 2}
  ]
}

Response (200):
{
  "success": true,
  "allServiceable": true,
  "serviceabilityStatus": {
    "SELLER_ID_1": {
      "isServiceable": true,
      "products": [{"_id": "PRODUCT_ID_1", "name": "Product 1"}]
    }
  }
}
```

---

## Troubleshooting

### Issue: "Location required" error
**Solution**: Buyer needs to enable location services. Show LocationSetup modal.

### Issue: "Out of delivery zone" error
**Solution**: 
- Verify buyer location is saved
- Check seller has zones created and active
- Verify distance calculation (buyer within radius)

### Issue: Geocoding not working
**Solution**:
- Nominatim API may be rate-limited
- Try again after delay
- Check network connectivity

### Issue: Coordinates not found
**Solution**:
- Try different search terms (city name, address)
- Verify location exists
- Use direct coordinate input as fallback

---

## Deployment Notes
1. Ensure MongoDB indexes created:
   ```javascript
   db.deliveryzones.createIndex({ sellerId: 1 })
   db.buyerlocations.createIndex({ buyerId: 1 })
   ```

2. HTTPS requirement for geolocation
3. No additional environment variables needed
4. Nominatim API is free and public (no key required)
5. Rate limiting handled by frontend (debounce search)

---
