# Logistics Module

Delivery quote, booking, and shipping-integration utilities. The fare-estimate endpoint is public and does not require authentication. All other endpoints require authentication.

---

## Shared Schemas

### `FareEstimateRequest`

```json
{
  "seller_id": "uuid",
  "customer_latitude": 31.5204,
  "customer_longitude": 74.3587
}
```

| Field | Type | Required | Notes |
|------|------|----------|------|
| `seller_id` | `string` | yes | Seller whose registered location is used as the pickup point |
| `customer_latitude` | `float64` | yes | Delivery destination latitude |
| `customer_longitude` | `float64` | yes | Delivery destination longitude |

### `DeliveryPartner`

Currently supported values:

- `Bykea`
- `PostEx`

### `DeliveryOption`

```json
{
  "name": "Bykea",
  "estimated_fare": 250,
  "estimated_delivery_time": "Same day"
}
```

| Field | Type | Notes |
|------|------|------|
| `name` | `DeliveryPartner` | Courier identifier |
| `estimated_fare` | `float64` | Estimated delivery cost |
| `estimated_delivery_time` | `string` | Human-readable ETA such as `Same day` or `1-3 days` |

### `DeliveryBooking`

This schema represents confirmed shipment records.

```json
{
  "id": "booking_123",
  "order_id": "order_123",
  "delivery_partner": "Bykea",
  "status": "pending",
  "tracking_number": "TRK123456",
  "booking_time": "2026-03-31T12:00:00Z"
}
```

| Field | Type | Notes |
|------|------|------|
| `id` | `string` | Unique booking identifier |
| `order_id` | `string` | Associated order ID |
| `delivery_partner` | `DeliveryPartner` | Courier service |
| `status` | `string` | One of: `pending`, `booked`, `picked_up`, `in_transit`, `delivered`, `failed` |
| `tracking_number` | `string` | Tracking reference |
| `booking_time` | `timestamp` | When booking was created |

### `BookDeliveryRequest`

```json
{
  "order_id": "order_123",
  "delivery_partner": "Bykea",
  "delivery_address": {
    "latitude": 31.5204,
    "longitude": 74.3587,
    "address_line": "123 Main St, Lahore"
  }
}
```

| Field | Type | Required | Notes |
|------|------|----------|------|
| `order_id` | `string` | yes | Order to ship |
| `delivery_partner` | `DeliveryPartner` | yes | `Bykea` or `PostEx` |
| `pickup_address` | `Address` | no | Defaults to seller location |
| `delivery_address` | `Address` | yes | Customer delivery location |

### `Address`

```json
{
  "latitude": 31.5204,
  "longitude": 74.3587,
  "address_line": "123 Main St, Lahore"
}
```

### `UpdateBookingStatusRequest`

```json
{
  "status": "booked",
  "location": "Lahore Hub",
  "notes": "Package picked up"
}
```

| Field | Type | Required | Notes |
|------|------|----------|------|
| `status` | `string` | yes | New booking status |
| `location` | `string` | no | Current package location |
| `notes` | `string` | no | Additional information |

### `TrackingInfo`

```json
{
  "id": "booking_123",
  "order_id": "order_123",
  "delivery_partner": "Bykea",
  "status": "in_transit",
  "tracking_number": "TRK123456",
  "current_location": "Lahore Distribution Center",
  "estimated_delivery": "2026-04-15T18:00:00Z",
  "booking_time": "2026-04-13T12:00:00Z",
  "tracking_history": [
    {
      "timestamp": "2026-04-13T12:00:00Z",
      "status": "pending",
      "location": "",
      "notes": "Booking created"
    },
    {
      "timestamp": "2026-04-13T14:00:00Z",
      "status": "booked",
      "location": "Lahore Hub",
      "notes": "Courier assigned"
    }
  ]
}
```

### `BookingListResponse`

```json
{
  "bookings": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "has_next": true
}
```

---

## Endpoints

### Get Fare Estimate
`POST /api/v2/logistics/fare-estimate`

Auth: public

Returns available delivery options with estimated fares and ETAs for a given seller-to-customer route. The seller's registered location is used as the pickup/origin point.

**Body**: [`FareEstimateRequest`](#fareestimaterequest)

**Response `200`**

```json
[
  {
    "name": "Bykea",
    "estimated_fare": 250,
    "estimated_delivery_time": "Same day"
  },
  {
    "name": "PostEx",
    "estimated_fare": 180,
    "estimated_delivery_time": "1-3 days"
  }
]
```

Response shape: `DeliveryOption[]`

**Common errors**

- `400 INVALID_BODY` — malformed JSON
- `400 BAD_REQUEST` — missing required fields or invalid seller/location input

---

### Book Delivery
`POST /api/v2/logistics/book`

Auth: Seller JWT

Books a delivery for an order with the selected courier service. Returns the created booking with a tracking number.

**Body**: [`BookDeliveryRequest`](#bookdeliveryrequest)

**Response `201`**

```json
{
  "id": "booking_123",
  "order_id": "order_123",
  "delivery_partner": "Bykea",
  "status": "pending",
  "tracking_number": "TRK1713000000",
  "booking_time": "2026-04-13T12:00:00Z"
}
```

Response shape: [`DeliveryBooking`](#deliverybooking)

**Common errors**

- `400 INVALID_BODY` — malformed JSON
- `400 BAD_REQUEST` — invalid delivery partner
- `404 NOT_FOUND` — order not found

---

### Track Shipment
`GET /api/v2/logistics/track/{bookingId}`

Auth: User or Seller JWT

Returns detailed tracking information for a delivery booking, including current status and tracking history.

**Response `200`**

```json
{
  "id": "booking_123",
  "order_id": "order_123",
  "delivery_partner": "Bykea",
  "status": "in_transit",
  "tracking_number": "TRK123456",
  "current_location": "Lahore Distribution Center",
  "estimated_delivery": "2026-04-15T18:00:00Z",
  "booking_time": "2026-04-13T12:00:00Z",
  "tracking_history": [
    {
      "timestamp": "2026-04-13T12:00:00Z",
      "status": "pending",
      "notes": "Booking created"
    }
  ]
}
```

Response shape: [`TrackingInfo`](#trackinginfo)

**Common errors**

- `404 NOT_FOUND` — booking not found

---

### Update Booking Status
`PUT /api/v2/logistics/book/{id}/status`

Auth: Seller or Admin JWT

Updates the status of a delivery booking. Automatically adds a tracking event and triggers notification to the customer.

**Body**: [`UpdateBookingStatusRequest`](#updatebookingstatusrequest)

**Response `200`**

```json
{
  "id": "booking_123",
  "order_id": "order_123",
  "delivery_partner": "Bykea",
  "status": "booked",
  "tracking_number": "TRK123456",
  "booking_time": "2026-04-13T12:00:00Z"
}
```

Response shape: [`DeliveryBooking`](#deliverybooking)

**Common errors**

- `400 INVALID_BODY` — malformed JSON
- `400 BAD_REQUEST` — invalid status transition
- `404 NOT_FOUND` — booking not found

---

### List Bookings
`GET /api/v2/logistics/bookings`

Auth: Seller JWT

Returns a paginated list of delivery bookings with optional filtering.

**Query Parameters**:
- `order_id` (optional): Filter by order ID
- `status` (optional): Filter by status
- `from_date` (optional): Filter from date (YYYY-MM-DD)
- `to_date` (optional): Filter to date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response `200`**

```json
{
  "bookings": [
    {
      "id": "booking_123",
      "order_id": "order_123",
      "delivery_partner": "Bykea",
      "status": "delivered",
      "tracking_number": "TRK123456",
      "booking_time": "2026-04-13T12:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "has_next": true
}
```

Response shape: [`BookingListResponse`](#bookinglistresponse)

**Common errors**

- `400 BAD_REQUEST` — invalid query parameters

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400 BAD_REQUEST` | Missing required fields or invalid quote input |
