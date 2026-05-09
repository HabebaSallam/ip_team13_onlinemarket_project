# Quick Start: Using the Map to Create Delivery Zones

## ⚡ 30-Second Version

1. Go to **Delivery Zones** page
2. Click **+ Add Delivery Zone**
3. Click **🗺️ Map Method** tab
4. Search for your city OR click on map
5. Drag marker to center, slide radius adjuster
6. Enter zone name
7. Click **Create Zone**
8. Done! ✅

---

## 📖 Step-by-Step Guide

### Step 1: Open Delivery Zones
```
Seller Dashboard → Left Sidebar → "Delivery Zones"
```

### Step 2: Start Creating Zone
```
Click "+ Add Delivery Zone" button
```

### Step 3: Choose Map Method
```
In the form, click "🗺️ Map Method" tab
(Alternative: Use "📍 Search Method" for text-based entry)
```

### Step 4: Set Zone Location (Choose One)

**Option A: Search**
```
1. Type city name in search box: "Mumbai"
2. Hit Enter or wait for suggestions
3. Map auto-centers on location
```

**Option B: Click Map**
```
1. Click directly on map where you want zone center
2. Red marker appears at clicked location
3. Circle shows coverage area
```

**Option C: Drag Marker**
```
1. Click and hold the marker
2. Drag to desired location
3. Circle follows in real-time
```

### Step 5: Adjust Coverage Radius
```
Find "Delivery Radius" slider below map
Drag to desired radius (0.1 - 50 km)
→ Circle on map expands/contracts in real-time
```

### Step 6: Enter Zone Name
```
Zone Name field: Enter name like "Downtown" or "North Area"
```

### Step 7: Review Coordinates
```
Below the slider, you'll see:
  Latitude: 28.6139
  Longitude: 77.2090
  Radius: 5.5 km
These auto-update as you interact with map
```

### Step 8: Create Zone
```
Click "Create Zone" button
Success message appears!
Zone now active for accepting orders
```

---

## 🎮 Map Controls Reference

| Action | How To | Result |
|--------|-------|--------|
| **Move Zone Center** | Click on map OR drag marker | Position changes, circle moves |
| **Adjust Radius** | Slide radius slider left/right | Circle grows/shrinks |
| **Search Location** | Type in search box, press Enter | Map centers there |
| **See Coordinates** | Look at display above slider | Shows exact lat/lon/radius |
| **Fine Tune Position** | Type in Latitude/Longitude fields | Updates map marker position |

---

## 💡 Pro Tips

✨ **Tip 1**: Start broad, then refine
```
Create large zone first (10 km radius)
Later, add specific neighborhood zones (3-5 km radius)
```

✨ **Tip 2**: Use multiple zones for better coverage
```
Zone 1: Downtown - 3 km radius
Zone 2: Suburbs - 8 km radius
Zone 3: Airport Area - 6 km radius
```

✨ **Tip 3**: Test from buyer perspective
```
1. Open buyer app
2. Add item to cart
3. If zone active, purchase succeeds ✅
4. If out of zone, get error message ❌
```

✨ **Tip 4**: View on OpenStreetMap
```
After zone created:
- Find zone in list
- Click "View on Map"
- Opens in new tab to verify coverage
```

✨ **Tip 5**: Edit anytime
```
Find zone in list below form
Click "Edit" to modify coordinates/radius/name
Click "Delete" to remove zone
```

---

## ❓ Frequently Asked Questions

**Q: What's the maximum radius I can set?**
A: 50 km - covers most urban areas

**Q: Can I have overlapping zones?**
A: Yes! Buyer just needs to be in ONE zone to purchase

**Q: What happens if I don't have any zones?**
A: Buyers will get "Out of delivery zone" error for your products

**Q: Can I change coordinates manually?**
A: Yes! Edit Latitude/Longitude fields directly

**Q: Do zones require the seller to be there?**
A: No! Zones can be anywhere - it's the delivery area you cover

**Q: How accurate is the distance calculation?**
A: Within 0.5% - uses standard Haversine formula

**Q: Can buyers see my zones?**
A: No - zones are internal. They just see "out of delivery zone" error if not serviceable

---

## 🚀 Example Scenarios

### Scenario A: Single City Seller
```
1. Zone Name: "Bangalore City"
2. Search: "Bangalore"
3. Radius: 8 km (covers entire metro area)
4. Create Zone
```

### Scenario B: Multi-Neighborhood
```
Zone 1: "North Bangalore" - radius 4 km
Zone 2: "South Bangalore" - radius 5 km
Zone 3: "East Bangalore" - radius 6 km
→ Total coverage: Entire city without gaps
```

### Scenario C: Precise Coverage
```
1. Search warehouse location
2. Click map to place exact center
3. Drag marker to fine-tune
4. Set radius to actual delivery distance
5. Example: 28.5355°N, 77.3910°E, radius 3 km
```

---

## ⚠️ Common Issues

**Issue**: Map not showing
- **Fix**: Refresh page, check internet connection

**Issue**: Search not working
- **Fix**: Use city name instead of full address, check connection

**Issue**: Radius slider not moving circle
- **Fix**: Refresh page, try different browser

**Issue**: Can't create zone
- **Fix**: Ensure Zone Name is filled, coordinates not empty

---

## 📞 Need Help?

1. **Check the full guide**: MAP_FEATURE_GUIDE.md in project root
2. **Test with buyer app**: Verify zones work from buyer perspective
3. **Review coordinates**: Double-check lat/lon values
4. **Check radius**: Ensure within 0.1-50 km range

---

**Remember**: Zones control who can buy from you!
Set wisely based on your delivery capabilities.

Happy mapping! 🗺️✨
