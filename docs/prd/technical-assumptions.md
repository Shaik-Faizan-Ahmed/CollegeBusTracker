# Technical Assumptions

## Repository Structure: Monorepo
Single repository containing both React Native mobile application and backend API with shared utilities, data models, and configuration. This approach supports the rapid development timeline (3-4 months) and single developer team by simplifying dependency management and deployment coordination.

## Service Architecture
**Monolith with Real-time Services:** Core application built as a Node.js monolith with Express framework for rapid development, enhanced with dedicated WebSocket service for real-time location streaming. This hybrid approach balances development speed with the performance requirements for live tracking while avoiding microservices complexity that would overwhelm a single developer team.

## Testing Requirements: Unit + Integration
Comprehensive testing strategy including unit tests for business logic, integration tests for API endpoints and WebSocket connections, and basic end-to-end testing for critical user flows. Manual testing convenience methods for location simulation and tracker state management during development. Focus on automated testing for core tracking functionality and error scenarios.

## Additional Technical Assumptions and Requests

**Frontend Technology:**
- React Native for cross-platform mobile development (Android primary, iOS secondary)
- Native GPS APIs for accurate location tracking and sharing
- React Native Maps with Google Maps integration for interactive mapping functionality

**Backend Infrastructure:**
- Node.js with Express for rapid development and JavaScript ecosystem consistency
- WebSocket implementation using Socket.IO for real-time location broadcasting
- MongoDB for flexible location data storage with TTL collections for data cleanup
- Redis for session management and real-time location caching

**Hosting and Deployment:**
- Cloud platform (AWS or Google Cloud) with auto-scaling capabilities for academic period usage spikes
- Docker containerization for consistent deployment across development and production environments
- CI/CD pipeline supporting rapid iteration and deployment cycles

**Security and Privacy:**
- HTTPS/WSS encryption for all data transmission
- Location data stored with 24-hour retention using MongoDB TTL collections for automatic cleanup
- Tracker session data retained for 24 hours with automatic expiration
- No persistent personal identification storage - session-based user management only
- Clear consent flow for location sharing with ability to revoke permissions

**Development Tools:**
- Git with feature branch workflow for single developer efficiency
- Environment-based configuration management (development, staging, production)
- Automated deployment pipeline triggered by main branch updates
- Basic monitoring and error tracking for production stability
