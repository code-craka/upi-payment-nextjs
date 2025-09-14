# UPI Payment System API Endpoints

This document describes the API endpoints implemented for the UPI Payment System order creation and management functionality.

## Overview

The API provides endpoints for:

- Creating payment orders and generating UPI links
- Fetching order details with real-time status
- Submitting UTR numbers for payment verification
- Managing order expiration and cleanup

## Authentication

All endpoints (except public order details) require Clerk authentication. Include the authentication token in the request headers.

## Base URL

```
Development: http://localhost:3000
Production: [Your production URL]
```

## Endpoints

### 1. Create Order

**POST** `/api/orders`

Creates a new payment order and generates UPI payment links.

#### Request Headers

```
Content-Type: application/json
Authorization: Bearer <clerk-token>
```

#### Request Body

```json
{
  "amount": 100,
  "merchantName": "Test Merchant",
  "vpa": "merchant@upi"
}
```

#### Request Body Schema

- `amount` (number, required): Payment amount (1-100000)
- `merchantName` (string, required): Merchant name (1-100 chars, alphanumeric)
- `vpa` (string, required): UPI ID in format `username@bank`

#### Response (201 Created)

```json
{
  "success":e,
  "message": "Order created successfully",
  "data": {
    "orderId": "UPI1703123456789ABCDE",
    "paymentPageUrl": "http://localhost:3000/pay/UPI1703123456789ABCDE",
    "upiLinks": {
      "standard": "upi://pay?pa=merchant@upi&am=100&tn=Payment%20to%20Test%20Merchant",
      "gpay": "tez://upi/pay?pa=merchant@upi&am=100&tn=Payment%20to%20Test%20Merchant",
      "phonepe": "phonepe://pay?pa=merchant@upi&am=100&tn=Payment%20to%20Test%20Merchant",
      "paytm": "paytmmp://pay?pa=merchant@upi&am=100&tn=Payment%20to%20Test%20Merchant",
      "bhim": "upi://pay?pa=merchant@upi&am=100&tn=Payment%20to%20Test%20Merchant"
    },
    "expiresAt": "2023-12-21T10:09:00.000Z",
    "amount": 100,
    "merchantName": "Test Merchant",
    "vpa": "merchant@upi"
  }
}
```

#### Error Responses

- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Authentication required
- `409 Conflict`: Duplicate order (retry)
- `500 Internal Server Error`: Server error

---

### 2. Get Orders List

**GET** `/api/orders`

Retrieves orders for the authenticated user (merchants see their own, admins see all).

#### Request Headers

```
Authorization: Bearer <clerk-token>
```

#### Query Parameters

- `status` (optional): Filter by status (`pending`, `pending-verification`, `completed`, `expired`, `failed`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (1-100, default: 10)

#### Example Request

```
GET /api/orders?status=pending&page=1&limit=5
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "...",
        "orderId": "UPI1703123456789ABCDE",
        "amount": 100,
        "merchantName": "Test Merchant",
        "vpa": "merchant@upi",
        "status": "pending",
        "createdAt": "2023-12-21T09:00:00.000Z",
        "expiresAt": "2023-12-21T10:09:00.000Z",
        "paymentPageUrl": "http://localhost:3000/pay/UPI1703123456789ABCDE"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

---

### 3. Get Order Details

**GET** `/api/orders/{orderId}`

Retrieves detailed information about a specific order, including real-time expiration status.

#### Path Parameters

- `orderId` (string): The unique order identifier

#### Example Request

```
GET /api/orders/UPI1703123456789ABCDE
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "order": {
      "orderId": "UPI1703123456789ABCDE",
      "amount": 100,
      "merchantName": "Test Merchant",
      "vpa": "merchant@upi",
      "status": "pending",
      "utr": null,
      "createdAt": "2023-12-21T09:00:00.000Z",
      "expiresAt": "2023-12-21T10:09:00.000Z",
      "paymentPageUrl": "http://localhost:3000/pay/UPI1703123456789ABCDE"
    },
    "timeRemaining": 540,
    "upiLinks": {
      "standard": "upi://pay?pa=merchant@upi&am=100&tn=Payment%20to%20Test%20Merchant",
      "gpay": "tez://upi/pay?pa=merchant@upi&am=100&tn=Payment%20to%20Test%20Merchant"
    },
    "enabledApps": ["gpay", "phonepe", "paytm", "bhim"],
    "canSubmitUTR": true
  }
}
```

#### Response Fields

- `timeRemaining`: Seconds until expiration (0 if expired)
- `canSubmitUTR`: Whether UTR submission is allowed
- `enabledApps`: UPI apps enabled in system settings

#### Error Responses

- `404 Not Found`: Order not found
- `500 Internal Server Error`: Server error

---

### 4. Submit UTR

**POST** `/api/orders/{orderId}/utr`

Submits a UTR (UPI Transaction Reference) number for payment verification.

#### Path Parameters

- `orderId` (string): The unique order identifier

#### Request Body

```json
{
  "utr": "123456789012"
}
```

#### Request Body Schema

- `utr` (string, required): 12-digit alphanumeric UTR number

#### Response (200 OK)

```json
{
  "success": true,
  "message": "UTR submitted successfully. Your payment is now under verification.",
  "data": {
    "orderId": "UPI1703123456789ABCDE",
    "utr": "123456789012",
    "status": "pending-verification",
    "submittedAt": "2023-12-21T09:30:00.000Z"
  }
}
```

#### Error Responses

- `400 Bad Request`: Invalid UTR format or order expired
- `404 Not Found`: Order not found
- `409 Conflict`: UTR already submitted or used by another order
- `422 Unprocessable Entity`: Business logic error (e.g., wrong order status)

---

### 5. Get UTR Status

**GET** `/api/orders/{orderId}/utr`

Retrieves UTR submission status for an order.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "orderId": "UPI1703123456789ABCDE",
    "hasUTR": true,
    "utr": "123456789012",
    "status": "pending-verification",
    "canSubmitUTR": false,
    "submittedAt": "2023-12-21T09:30:00.000Z"
  }
}
```

---

### 6. Update Order Status (Admin Only)

**PATCH** `/api/orders/{orderId}`

Updates order status. Requires admin role.

#### Request Headers

```
Content-Type: application/json
Authorization: Bearer <admin-clerk-token>
```

#### Request Body

```json
{
  "status": "completed",
  "adminNotes": "Payment verified manually"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "orderId": "UPI1703123456789ABCDE",
    "status": "completed",
    "updatedAt": "2023-12-21T10:00:00.000Z"
  }
}
```

#### Error Responses

- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Admin access required
- `404 Not Found`: Order not found

---

### 7. Remove UTR (Admin Only)

**DELETE** `/api/orders/{orderId}/utr`

Removes UTR from an order for corrections. Requires admin role.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "UTR removed successfully",
  "data": {
    "orderId": "UPI1703123456789ABCDE",
    "status": "pending"
  }
}
```

---

### 8. Mark Expired Orders

**POST** `/api/orders/expire`

Marks expired orders as expired. Intended for cron jobs.

#### Request Headers (Optional)

```
Authorization: Bearer <cron-secret-token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Marked 5 orders as expired",
  "data": {
    "expiredCount": 5,
    "expiredOrderIds": ["UPI1703123456789ABCDE", "UPI1703123456789FGHIJ"]
  }
}
```

---

### 9. Get Expiration Statistics

**GET** `/api/orders/expire`

Retrieves order expiration statistics.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "totalPending": 25,
    "totalExpired": 150,
    "expiredToday": 12,
    "expiringSoon": 3
  }
}
```

## Order Status Flow

```
pending → pending-verification → completed
   ↓              ↓                  ↓
expired        failed            (final)
   ↓              ↓
(final)       (final)
```

## Order Expiration Logic

- Orders expire based on system settings (default: 9 minutes)
- Expired orders automatically change status from `pending` to `expired`
- UTR submission is only allowed for `pending` orders
- Expired orders cannot accept UTR submissions

## Error Handling

All endpoints use consistent error response format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

## Rate Limiting

Consider implementing rate limiting for:

- Order creation: 10 requests per minute per user
- UTR submission: 5 requests per minute per IP
- Admin operations: 100 requests per minute per admin

## Security Considerations

1. **Authentication**: All endpoints require valid Clerk tokens
2. **Authorization**: Role-based access control for admin operations
3. **Input Validation**: Comprehensive validation using Zod schemas
4. **UTR Uniqueness**: Prevents duplicate UTR submissions
5. **Order Ownership**: Users can only access their own orders (except admins)
6. **Audit Logging**: All operations are logged for security tracking

## Testing

Use the provided test script to verify endpoint functionality:

```bash
node test-api-endpoints.js
```

Note: Tests require a running development server and proper authentication setup.
