# API Error Handling Guide

**Location:** `src/api/errorHandling.ts`

---

## Response Format

The Juno API returns all responses in a consistent format:

### Success
```json
{
    "success": true,
    "data": {
        "connected": true,
        "shop": "mystore.myshopify.com"
    }
}
```

### Error
```json
{
    "success": false,
    "error": {
        "message": "Invalid email or password",
        "code": "UNAUTHORIZED",
        "details": {
            "field": "email",
            "reason": "not_found"
        }
    }
}
```

The `request()` function automatically unwraps these responses so you work directly with the data or error object.

---

## Error Codes

| Error Code | HTTP Status | Description | Example |
|------------|-------------|-------------|---------|
| `INVALID_BODY` | 400 | Malformed JSON | Missing Content-Type header |
| `BAD_REQUEST` | 400 | General validation error | Missing required field |
| `VALIDATION_ERROR` | 400 | Field-specific validation | Email format invalid |
| `UNAUTHORIZED` | 401 | Missing/invalid token | No Authorization header |
| `TOKEN_EXPIRED` | 401 | Token has expired | JWT past expiry |
| `FORBIDDEN` | 403 | Insufficient permissions | User accessing admin route |
| `NOT_FOUND` | 404 | Resource doesn't exist | Product ID not found |
| `CONFLICT` | 409 | Resource already exists | Duplicate email |
| `INTERNAL_ERROR` | 500 | Server error | Database connection failed |
| `SERVICE_UNAVAILABLE` | 503 | Service down | Maintenance mode |

---

## Error Handling Patterns

### 1. Basic Error Checking

```typescript
import { request } from './api';

const resp = await request('/catalog/products/123', 'GET');

if (!resp.ok) {
    // resp.body is APIError
    console.error(resp.body.message);
    console.error(resp.body.code);
} else {
    // resp.body is the unwrapped data
    console.log(resp.body); // Product object
}
```

### 2. Type Guards

```typescript
import {
    isValidationError,
    isAuthError,
    isNotFoundError,
    isConflictError,
    isServerError,
} from './api';

const resp = await Commerce.checkout(payload);

if (!resp.ok) {
    const error = resp.body;
    
    if (isAuthError(error)) {
        // Redirect to login
        navigate('/login');
    } else if (isValidationError(error)) {
        // Show field-specific errors
        const fields = extractFieldErrors(error);
        setFormErrors(fields);
    } else if (isNotFoundError(error)) {
        // Show 404 page
        navigate('/404');
    } else if (isConflictError(error)) {
        // Handle duplicate resource
        alert('This item already exists in your cart');
    } else if (isServerError(error)) {
        // Retry or show generic error
        alert('Server error. Please try again.');
    }
}
```

### 3. Form Validation Errors

```typescript
import { extractFieldErrors } from './api';

async function handleSubmit(formData: FormData) {
    const resp = await Auth.Register(formData);
    
    if (!resp.ok) {
        const error = resp.body;
        
        if (isValidationError(error)) {
            // Extract field-specific errors
            const fieldErrors = extractFieldErrors(error);
            // { 
            //   email: "Email already registered",
            //   password: "Must be at least 8 characters"
            // }
            
            setFormErrors(fieldErrors);
        } else {
            // Generic error
            setGlobalError(error.message);
        }
    }
}
```

### 4. User-Friendly Messages

```typescript
import { getUserFriendlyMessage } from './api';

const resp = await Catalog.filterProducts(filters);

if (!resp.ok) {
    const userMessage = getUserFriendlyMessage(resp.body);
    // "Invalid request format" instead of "INVALID_BODY: malformed JSON"
    
    toast.error(userMessage);
}
```

### 5. Toast Integration

```typescript
import { getErrorToastConfig } from './api';

const resp = await Orders.CreateOrder(checkoutData);

if (!resp.ok) {
    const config = getErrorToastConfig(resp.body);
    // { type: 'error', message: '...', duration: 4000 }
    
    toast.show(config.message, {
        type: config.type,
        duration: config.duration,
    });
}
```

### 6. Callback Pattern

```typescript
import { handleAPIResponse } from './api';

await handleAPIResponse(
    // Promise
    Catalog.getProduct(productId),
    
    // Success callback
    (product) => {
        setProduct(product);
        setLoading(false);
    },
    
    // Error callback (optional)
    (error) => {
        if (isNotFoundError(error)) {
            navigate('/404');
        } else {
            showErrorToast(error);
        }
    }
);
```

### 7. Retry Logic

```typescript
import { retryRequest } from './api';

// Automatically retry failed requests with exponential backoff
const resp = await retryRequest(
    () => Analytics.getOverview({ compare: 'previous_period' }),
    { maxRetries: 3, initialDelay: 1000 }
);

if (resp.ok) {
    setOverview(resp.body);
} else {
    // After 3 retries, show error
    showErrorToast(resp.body);
}
```

---

## Module-Specific Error Handling

### Authentication Errors

```typescript
import { isAuthError, isNotFoundError } from './api';

// Login
const resp = await Auth.Login(email, password);

if (!resp.ok) {
    if (isAuthError(resp.body)) {
        setFormError('credentials', 'Invalid email or password');
    } else if (isNotFoundError(resp.body)) {
        setFormError('email', 'No account found with this email');
    }
}
```

### Cart Errors

```typescript
import { isConflictError, isNotFoundError } from './api';

// Add to cart
const resp = await Commerce.addToCart({ product_id, variant_id, quantity: 1 });

if (!resp.ok) {
    if (isNotFoundError(resp.body)) {
        // Product doesn't exist
        toast.error('This product is no longer available');
    } else if (isConflictError(resp.body)) {
        // Already in cart (if that's an error condition)
        toast.info('Item already in cart');
    } else {
        toast.error(resp.body.message);
    }
}
```

### Checkout Errors

```typescript
import { isValidationError, isServerError } from './api';

// Checkout
const resp = await Commerce.checkout({ address_id, payment_method: 'cod' });

if (!resp.ok) {
    if (isValidationError(resp.body)) {
        const fields = extractFieldErrors(resp.body);
        // { address_id: "Invalid address", payment_method: "Required" }
        setCheckoutErrors(fields);
    } else if (isServerError(resp.body)) {
        // Server error - might be stock issue
        toast.error('Unable to complete checkout. Please try again.');
    } else {
        toast.error(resp.body.message);
    }
}
```

### File Upload Errors

```typescript
import { isValidationError } from './api';

// Upload image
try {
    const url = await uploadFileAndGetUrl(file, 'high_quality');
} catch (error) {
    if (error.message.includes('file size')) {
        toast.error('File is too large. Maximum size is 5MB');
    } else if (error.message.includes('type')) {
        toast.error('Only JPEG and PNG files are allowed');
    } else {
        toast.error('Upload failed. Please try again.');
    }
}
```

---

## Error Display Components

### Error Banner Component

```tsx
import { APIError, getUserFriendlyMessage } from './api';

interface ErrorBannerProps {
    error: APIError | null;
    onDismiss: () => void;
}

function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
    if (!error) return null;
    
    return (
        <div className="error-banner">
            <p>{getUserFriendlyMessage(error)}</p>
            <button onClick={onDismiss}>×</button>
        </div>
    );
}
```

### Form Error Component

```tsx
import { APIError, extractFieldErrors } from './api';

interface FormErrorsProps {
    error: APIError | null;
}

function FormErrors({ error }: FormErrorsProps) {
    if (!error) return null;
    
    const fieldErrors = extractFieldErrors(error);
    
    return (
        <div className="form-errors">
            {Object.entries(fieldErrors).map(([field, message]) => (
                <p key={field} className="field-error">
                    {field}: {message}
                </p>
            ))}
            {!Object.keys(fieldErrors).length && (
                <p className="global-error">{error.message}</p>
            )}
        </div>
    );
}
```

---

## Best Practices

1. **Always check `resp.ok` before using data**
   ```typescript
   const resp = await Catalog.getProduct(id);
   if (!resp.ok) {
       // Handle error
       return;
   }
   // Safe to use resp.body
   ```

2. **Use type guards for specific error handling**
   ```typescript
   if (isNotFoundError(error)) { ... }
   ```

3. **Show user-friendly messages, not raw error text**
   ```typescript
   toast.error(getUserFriendlyMessage(error));
   ```

4. **Extract field errors for forms**
   ```typescript
   const fieldErrors = extractFieldErrors(error);
   ```

5. **Handle token expiration globally**
   ```typescript
   if (resp.body.code === 'TOKEN_EXPIRED') {
       localStorage.clear();
       window.location.href = '/login';
   }
   ```

6. **Retry idempotent requests (GET)**
   ```typescript
   const resp = await retryRequest(() => Analytics.getOverview());
   ```

7. **Don't retry POST/PUT/DELETE without user confirmation**
   ```typescript
   // Let user decide to retry
   if (!resp.ok && isServerError(resp.body)) {
       const retry = await confirm('Retry?');
       if (retry) { /* retry */ }
   }
   ```

---

## Testing Error Handling

```typescript
// Mock API error response
const mockError: APIError = {
    message: 'Product not found',
    code: 'NOT_FOUND',
};

// Test error handling
test('handles product not found', async () => {
    (request as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
        body: mockError,
    });
    
    const resp = await Catalog.getProduct('invalid-id');
    
    expect(resp.ok).toBe(false);
    expect(isNotFoundError(resp.body)).toBe(true);
});
```
