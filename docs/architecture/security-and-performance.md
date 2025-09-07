# Security and Performance

## Security Requirements

**Frontend Security:**
- GPS permissions handled with clear user consent
- API calls over HTTPS in production
- No persistent personal data storage

**Backend Security:**
- Input validation using express-validator
- Rate limiting via express-rate-limit
- CORS policy restricting origins

**Authentication Security:**
- Session-based anonymous tracking
- No user accounts or passwords
- TTL-based session expiration

## Performance Optimization

**Frontend Performance:**
- Bundle size optimized with Metro bundler
- Map rendering optimized for mobile devices
- Location updates throttled to 10-15 seconds

**Backend Performance:**
- Database queries optimized with indexes
- In-memory caching for session data
- WebSocket rooms for efficient broadcasting
