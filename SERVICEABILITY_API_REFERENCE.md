# Serviceability API Reference

## Base URL
```
http://localhost:5000/api/serviceability
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer {token}
```

---

## Buyer Location Endpoints

### Update or Create Buyer Location
**POST** `/location`

Save buyer's current location to backend.

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "Manhattan, New York",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "accuracy": 20
}
```

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `address` (string, optional): Full address
- `city` (string, optional): City name
- `state` (string, optional): State/Province
- `zipCode` (string, optional): Postal code
- `accuracy` (number, optional): GPS accuracy in meters

**Response (200):**
```json
{
  "success": true,
  "location": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "buyerId": "64a1b2c3d4e5f6g7h8i9j0k0",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Manhattan, New York",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "accuracy": 20,
    "updatedAt": "2024-05-09T12:00:00Z",
    "createdAt": "2024-05-09T12:00:00Z"
  }
}
```

---

### Get Buyer Location
**GET** `/location`

Retrieve saved buyer location.

**Response (200):**
```json
{
  "success": true,
  "location": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "buyerId": "64a1b2c3d4e5f6g7h8i9j0k0",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Manhattan, New York",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "accuracy": 20
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Buyer location not found"
}
```

---

## Serviceability Check Endpoints

### Check Single Seller Serviceability
**GET** `/check/:sellerId`

Check if buyer can purchase from specific seller.

**URL Parameters:**
- `sellerId` (string, required): ID of the seller

**Response (200) - In Delivery Zone:**
```json
{
  "success": true,
  "isServiceable": true,
  "buyerLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Manhattan, New York"
  },
  "nearestZone": null
}
```

**Response (200) - Out of Delivery Zone:**
```json
{
  "success": true,
  "isServiceable": false,
  "buyerLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Manhattan, New York"
  },
  "nearestZone": {
    "name": "Downtown District",
    "distance": 15.5
  }
}
```

**Response (400) - No Location Set:**
```json
{
  "success": false,
  "error": "Buyer location not found. Please enable location services."
}
```

---

### Check Cart Serviceability
**POST** `/check-cart`

Validate entire cart for serviceability across multiple sellers.

**Request Body:**
```json
{
  "cartItems": [
    {
      "productId": "64a1b2c3d4e5f6g7h8i9j0a1",
      "quantity": 2
    },
    {
      "productId": "64a1b2c3d4e5f6g7h8i9j0a2",
      "quantity": 1
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "allServiceable": true,
  "serviceabilityStatus": {
    "64a1b2c3d4e5f6g7h8i9j0s1": {
      "isServiceable": true,
      "products": [
        {
          "_id": "64a1b2c3d4e5f6g7h8i9j0a1",
          "name": "Product 1"
        }
      ]
    },
    "64a1b2c3d4e5f6g7h8i9j0s2": {
      "isServiceable": false,
      "products": [
        {
          "_id": "64a1b2c3d4e5f6g7h8i9j0a2",
          "name": "Product 2"
        }
      ]
    }
  },
  "buyerLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Manhattan, New York"
  }
}
```

---

## Seller Delivery Zone Endpoints

### Get All Delivery Zones
**GET** `/zones`

Retrieve all delivery zones for authenticated seller.

**Response (200):**
```json
{
  "success": true,
  "zones": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0z1",
      "sellerId": "64a1b2c3d4e5f6g7h8i9j0s1",
      "name": "Downtown District",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 5,
      "city": "New York",
      "state": "NY",
      "isActive": true,
      "createdAt": "2024-05-09T10:00:00Z",
      "updatedAt": "2024-05-09T10:00:00Z"
    },
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0z2",
      "sellerId": "64a1b2c3d4e5f6g7h8i9j0s1",
      "name": "Suburbs Area",
      "latitude": 40.6501,
      "longitude": -73.9496,
      "radius": 10,
      "city": "Brooklyn",
      "state": "NY",
      "isActive": true,
      "createdAt": "2024-05-09T11:00:00Z",
      "updatedAt": "2024-05-09T11:00:00Z"
    }
  ]
}
```

---

### Create Delivery Zone
**POST** `/zones`

Create new delivery zone for seller.

**Request Body:**
```json
{
  "name": "Downtown District",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 5,
  "city": "New York",
  "state": "NY"
}
```

**Parameters:**
- `name` (string, required): Zone name
- `latitude` (number, required): Center latitude
- `longitude` (number, required): Center longitude
- `radius` (number, optional): Radius in km (default: 5)
- `city` (string, optional): City name
- `state` (string, optional): State name

**Response (201):**
```json
{
  "success": true,
  "zone": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0z1",
    "sellerId": "64a1b2c3d4e5f6g7h8i9j0s1",
    "name": "Downtown District",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 5,
    "city": "New York",
    "state": "NY",
    "isActive": true,
    "createdAt": "2024-05-09T12:00:00Z",
    "updatedAt": "2024-05-09T12:00:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Name, latitude, and longitude are required"
}
```

---

### Update Delivery Zone
**PUT** `/zones/:zoneId`

Update existing delivery zone.

**URL Parameters:**
- `zoneId` (string, required): ID of zone to update

**Request Body:**
```json
{
  "name": "Updated Zone Name",
  "radius": 8,
  "isActive": false
}
```

**All fields optional** - only provided fields will be updated.

**Response (200):**
```json
{
  "success": true,
  "zone": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0z1",
    "sellerId": "64a1b2c3d4e5f6g7h8i9j0s1",
    "name": "Updated Zone Name",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 8,
    "city": "New York",
    "state": "NY",
    "isActive": false,
    "createdAt": "2024-05-09T12:00:00Z",
    "updatedAt": "2024-05-09T13:00:00Z"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Not authorized to update this zone"
}
```

---

### Delete Delivery Zone
**DELETE** `/zones/:zoneId`

Delete a delivery zone.

**URL Parameters:**
- `zoneId` (string, required): ID of zone to delete

**Response (200):**
```json
{
  "success": true,
  "message": "Zone deleted"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Zone not found"
}
```

---

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 200 | Success | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing required fields |
| 403 | Forbidden | Not authorized for this action |
| 404 | Not Found | Resource not found |
| 500 | Internal Error | Server error |

---

## JavaScript Usage Examples

### Using serviceabilityAPI in Frontend

#### Update Buyer Location
```javascript
import { serviceabilityAPI } from './api';

const updateLocation = async () => {
  try {
    const response = await serviceabilityAPI.updateLocation({
      latitude: 40.7128,
      longitude: -74.0060,
      address: "New York, NY",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    });
    console.log('Location saved:', response.data.location);
  } catch (error) {
    console.error('Error:', error.response?.data?.error);
  }
};
```

#### Check if Seller Delivers to Buyer
```javascript
const checkServiceability = async (sellerId) => {
  try {
    const response = await serviceabilityAPI.checkServiceability(sellerId);
    if (response.data.isServiceable) {
      console.log('Seller can deliver!');
    } else {
      console.log('Out of delivery zone');
      console.log('Nearest zone:', response.data.nearestZone);
    }
  } catch (error) {
    console.error('Error:', error.response?.data?.error);
  }
};
```

#### Validate Full Cart
```javascript
const validateCart = async (cartItems) => {
  try {
    const response = await serviceabilityAPI.checkCartServiceability(cartItems);
    response.data.serviceabilityStatus.forEach((seller, sellerId) => {
      if (!seller.isServiceable) {
        console.warn(`Cannot deliver to seller ${sellerId}`);
      }
    });
  } catch (error) {
    console.error('Validation failed:', error.response?.data?.error);
  }
};
```

#### Create Delivery Zone (Seller)
```javascript
import { serviceabilityAPI } from './api';

const createZone = async () => {
  try {
    const response = await serviceabilityAPI.createZone({
      name: "Manhattan",
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 5,
      city: "New York",
      state: "NY"
    });
    console.log('Zone created:', response.data.zone);
  } catch (error) {
    console.error('Error:', error.response?.data?.error);
  }
};
```

#### Get All Seller Zones
```javascript
const loadZones = async () => {
  try {
    const response = await serviceabilityAPI.getZones();
    setZones(response.data.zones);
  } catch (error) {
    console.error('Error loading zones:', error);
  }
};
```

---

## cURL Examples

### Create Zone (Seller)
```bash
curl -X POST http://localhost:5000/api/serviceability/zones \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 5,
    "city": "New York",
    "state": "NY"
  }'
```

### Update Location (Buyer)
```bash
curl -X POST http://localhost:5000/api/serviceability/location \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Manhattan",
    "city": "New York",
    "state": "NY"
  }'
```

### Check Serviceability
```bash
curl -X GET http://localhost:5000/api/serviceability/check/SELLER_ID \
  -H "Authorization: Bearer TOKEN_HERE"
```

### Get All Zones
```bash
curl -X GET http://localhost:5000/api/serviceability/zones \
  -H "Authorization: Bearer TOKEN_HERE"
```

### Delete Zone
```bash
curl -X DELETE http://localhost:5000/api/serviceability/zones/ZONE_ID \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## Rate Limiting
- Nominatim geocoding: 1 request/second (free tier)
- API endpoints: No limit (implement as needed)

## CORS
All endpoints support CORS for browser requests.

---
