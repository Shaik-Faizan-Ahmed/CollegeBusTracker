# Backend Architecture

## Controller/Route Organization
```
backend/src/
├── controllers/
│   ├── busController.ts
│   ├── trackerController.ts
│   └── healthController.ts
├── routes/
│   ├── busRoutes.ts
│   ├── trackerRoutes.ts
│   └── healthRoutes.ts
├── services/
│   ├── trackingService.ts
│   ├── databaseService.ts
│   └── websocketService.ts
├── middleware/
│   ├── validation.ts
│   ├── errorHandler.ts
│   └── rateLimiter.ts
└── websocket/
    ├── handlers/
    │   ├── trackingHandlers.ts
    │   └── connectionHandlers.ts
    └── rooms.ts
```

## Authentication and Authorization

Session-based authentication without persistent user accounts:

```typescript
// Session validation middleware
export const requireValidSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sessionId = req.body.sessionId || req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({
      error: { code: 'MISSING_SESSION', message: 'Session ID required' }
    });
  }
  
  const session = await databaseService.findSessionById(sessionId);
  
  if (!session || !session.is_active) {
    return res.status(401).json({
      error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' }
    });
  }
  
  req.sessionId = sessionId;
  req.session = session;
  next();
};
```
