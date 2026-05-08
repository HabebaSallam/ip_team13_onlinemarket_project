# Serviceability Feature - Quick Start Guide

## Installation & Setup

### 1. Backend Setup
No additional dependencies needed - all calculations use native JavaScript/Node.js.

### 2. Database Migration
The new models will auto-create in MongoDB on first use. To manually set up indexes:

```bash
# In MongoDB shell
use online_market
db.deliveryzones.createIndex({ sellerId: 1 })
db.buyerlocations.createIndex({ buyerId: 1 })
```

### 3. Start the Backend
```bash
npm install  # If any new dependencies needed
npm start
# Backend running on http://localhost:5000
```

---

## Testing the Feature (Step-by-Step)

### Step 1: Create Test Accounts

**Seller Account:**
- Go to seller app: http://localhost:3000
- Click Register
- Fill in details (e.g., "Test Seller", test@seller.com, password)
- Select "Seller" role
- Add business name and info

**Buyer Account:**
- Go to buyer app: http://localhost:3001
- Click Register
- Fill in details (e.g., "Test Buyer", test@buyer.com, password)
- Select "Buyer" role

### Step 2: Seller - Set Up Delivery Zones

1. Login to seller app
2. Click "Delivery Zones" in navbar
3. Click "+ Add Delivery Zone"
4. Enter zone details:
   - **Name**: "Downtown District"
   - **Search Location**: Type "New York" or your city
   - **Select** from suggestions
   - **Radius**: 5 (km)
5. Click "Create Zone"
6. Repeat to create more zones (e.g., "Suburbs", "Airport")

**Quick Test Locations:**
- New York: Search "New York, United States"
- San Francisco: Search "San Francisco, CA"
- Los Angeles: Search "Los Angeles, CA"
- Your City: Search your actual city

### Step 3: Seller - Add Test Products

1. Go to "Items" section
2. Create products (e.g., "Sample Product 1")
3. Set prices, descriptions, images
4. Publish items

### Step 4: Buyer - Enable Location

1. Login to buyer app
2. **Location Modal appears** - Click "Enable Location"
3. Browser asks for location permission - **Allow** it
4. System saves your location

**To Set Manual Location:**
- If geolocation fails, you can manually enter coordinates
- New York: 40.7128, -74.0060
- San Francisco: 37.7749, -122.4194
- Los Angeles: 34.0522, -118.2437

### Step 5: Test Purchase - In Delivery Zone

1. Buyer: Go to Catalog/Products
2. Find seller's product
3. Try to "Add to Cart"
4. **If in zone**: ✓ Item added successfully
5. Go to Cart and proceed to checkout

### Step 6: Test Purchase - Out of Delivery Zone

1. Go back to seller app
2. Edit a zone to have smaller radius (e.g., 1 km)
3. Go to buyer app
4. Try adding same product again
5. **If out of zone**: ✗ Error: "Out of delivery zone"

---

## Testing Different Scenarios

### Scenario 1: Seller with Multiple Zones
- Create 3 zones in different areas
- Test that buyer in any zone can purchase
- Test that buyer outside all zones cannot

### Scenario 2: Seller with No Zones
- Create seller without any zones
- Buyer should be able to purchase (unlimited delivery)

### Scenario 3: Large vs Small Radius
- Create zone with 100km radius → Buyer far away can purchase
- Edit to 0.5km radius → Same buyer gets "out of zone" error

### Scenario 4: Location Updates
- Buyer "skips" location setup initially
- Later enables location in settings
- Can then purchase from zoned sellers

---

## Real Location Examples

### Indian Cities
```
Delhi: Search "Delhi, India" → 28.6139, 77.2090
Mumbai: Search "Mumbai, India" → 19.0760, 72.8777
Bangalore: Search "Bangalore, India" → 12.9716, 77.5946
Chennai: Search "Chennai, India" → 13.0827, 80.2707
Pune: Search "Pune, India" → 18.5204, 73.8567
```

### USA Cities
```
New York: 40.7128, -74.0060
Los Angeles: 34.0522, -118.2437
Chicago: 41.8781, -87.6298
Houston: 29.7604, -95.3698
Phoenix: 33.4484, -112.0742
```

### International
```
London: 51.5074, -0.1278
Tokyo: 35.6762, 139.6503
Sydney: -33.8688, 151.2093
Dubai: 25.2048, 55.2708
Toronto: 43.6532, -79.3832
```

---

## Verifying Implementation

### Check Backend API
```bash
# Test location endpoint
curl -X POST http://localhost:5000/api/serviceability/location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY",
    "city": "New York",
    "state": "NY"
  }'

# Create delivery zone
curl -X POST http://localhost:5000/api/serviceability/zones \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manhattan",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 5,
    "city": "New York",
    "state": "NY"
  }'

# Check serviceability
curl -X GET "http://localhost:5000/api/serviceability/check/SELLER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Frontend Features
- [ ] LocationSetup modal appears on first login
- [ ] Location search works (autocomplete appears)
- [ ] Can select location from suggestions
- [ ] Manual coordinate input works
- [ ] "Add to Cart" shows delivery zone error
- [ ] Seller can create/edit/delete zones
- [ ] Zone list shows all details correctly

---

## Troubleshooting

### Problem: "Location not found" or "Geolocation denied"
**Solution**: 
- Check browser HTTPS (required for geolocation, except localhost)
- Allow location permission in browser settings
- Use manual coordinate input as fallback

### Problem: "Out of delivery zone" on all purchases
**Solution**:
- Check seller has zones created
- Verify buyer location is set
- Check distance (should be ≤ radius)
- Try increasing zone radius

### Problem: Nominatim search returns no results
**Solution**:
- Try different search terms (city name, full address)
- Check internet connectivity
- Wait a moment (API might be rate-limited)
- Use direct coordinates instead

### Problem: Location modal keeps appearing
**Solution**:
- Complete location setup (allow and wait)
- Or manually enter coordinates in account settings

---

## Files Modified/Created

### Backend
- ✅ `models/DeliveryZone.js` (NEW)
- ✅ `models/BuyerLocation.js` (NEW)
- ✅ `controllers/serviceabilityController.js` (NEW)
- ✅ `routes/serviceability.js` (NEW)
- ✅ `controllers/cartController.js` (MODIFIED - added location check)
- ✅ `server.js` (MODIFIED - added route)

### Buyer App
- ✅ `src/utils/location.js` (NEW)
- ✅ `src/components/LocationSetup.js` (NEW)
- ✅ `src/api.js` (MODIFIED - added serviceability API)
- ✅ `src/App.js` (MODIFIED - added location setup)

### Seller App
- ✅ `src/pages/DeliveryZones.js` (NEW)
- ✅ `src/pages/DeliveryZones.css` (NEW)
- ✅ `src/api.js` (MODIFIED - added serviceability API)
- ✅ `src/App.js` (MODIFIED - added route)
- ✅ `src/components/Navbar.js` (MODIFIED - added link)

### Documentation
- ✅ `SERVICEABILITY_FEATURE.md` (NEW)
- ✅ `SERVICEABILITY_QUICK_START.md` (THIS FILE)

---

## Common Questions

**Q: Will existing sellers need to set up zones?**
A: No, sellers without zones will have unlimited delivery (backward compatible).

**Q: Can a buyer have multiple delivery addresses?**
A: Currently uses one location. Could be extended to support multiple addresses.

**Q: What happens if zone boundaries change?**
A: Sellers can edit zones anytime. Affects future purchases, not existing orders.

**Q: Is location data shared with other buyers?**
A: No, location is private. Only used for serviceability checks.

**Q: Can sellers see buyer locations?**
A: No, sellers only see if delivery is possible, not exact buyer location.

**Q: What's the maximum radius supported?**
A: No limit, but practical range is 0.1 - 1000 km.

**Q: Does it work offline?**
A: Geolocation works offline if browser has cached position. Nominatim search requires internet.

---

## Next Steps

1. ✅ Test the feature thoroughly
2. ✅ Verify error messages display correctly
3. ✅ Check mobile responsiveness
4. ✅ Monitor API performance
5. Consider enhancements:
   - Interactive map drawing for zones
   - Multiple zone types per seller
   - Distance-based shipping charges
   - Zone scheduling/holidays

---

For detailed implementation info, see `SERVICEABILITY_FEATURE.md`
