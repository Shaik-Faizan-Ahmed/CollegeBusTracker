# Testing Strategy

## Testing Pyramid
```
E2E Tests (Detox)
/        \
Integration Tests
/            \
Frontend Unit  Backend Unit
```

## Test Organization

### Frontend Tests
```
apps/mobile/__tests__/
├── components/
├── screens/
├── services/
└── __mocks__/
```

### Backend Tests
```
apps/backend/tests/
├── unit/
│   ├── controllers/
│   └── services/
├── integration/
│   └── routes/
└── fixtures/
```
