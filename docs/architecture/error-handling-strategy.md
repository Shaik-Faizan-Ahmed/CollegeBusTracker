# Error Handling Strategy

## Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

## Frontend Error Handling
```typescript
// Global error boundary and service-level error handling
try {
  await trackingService.startTracking(busNumber);
} catch (error) {
  if (error instanceof BusAlreadyTrackedError) {
    showError('Bus already has a tracker. Try a different bus.');
  } else {
    showError('Unable to start tracking. Please try again.');
  }
}
```
