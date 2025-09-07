# Unified Project Structure

```
cvr-college-bus-tracker/
├── .github/workflows/           # CI/CD workflows
├── apps/
│   ├── mobile/                  # React Native application
│   │   ├── android/             # Native Android configuration
│   │   ├── ios/                 # Native iOS configuration
│   │   ├── src/
│   │   │   ├── components/      # UI components
│   │   │   ├── screens/         # Screen components
│   │   │   ├── services/        # API and external services
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── store/           # State management
│   │   │   └── types/           # TypeScript types
│   │   └── package.json
│   └── backend/                 # Express.js API server
│       ├── src/
│       │   ├── controllers/     # Request handlers
│       │   ├── routes/          # Route definitions
│       │   ├── services/        # Business logic
│       │   ├── middleware/      # Express middleware
│       │   ├── websocket/       # Socket.IO handlers
│       │   └── types/           # TypeScript types
│       ├── tests/               # Backend tests
│       └── package.json
├── packages/                    # Shared packages
│   ├── shared-types/            # Common TypeScript types
│   ├── utils/                   # Shared utility functions
│   └── config/                  # Shared configuration
├── scripts/                     # Development and build scripts
├── docs/                        # Project documentation
├── package.json                 # Root package.json with workspaces
└── README.md
```
