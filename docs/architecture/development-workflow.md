# Development Workflow

## Local Development Setup

### Prerequisites
```bash
# Install Node.js 18+
node --version

# Install Yarn
npm install -g yarn

# Install React Native CLI
npm install -g @react-native-community/cli
```

### Initial Setup
```bash
# Clone and setup project
git clone <repository-url>
cd cvr-college-bus-tracker
yarn install

# Setup environment variables
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/backend/.env.example apps/backend/.env

# Start development environment
yarn dev
```

### Development Commands
```bash
# Start all services
yarn dev

# Start frontend only
cd apps/mobile && yarn start

# Start backend only
cd apps/backend && yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

## Environment Configuration

### Mobile (.env.local)
```bash
API_BASE_URL=http://localhost:3000/api
WEBSOCKET_URL=ws://localhost:3000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
DEBUG=true
```

### Backend (.env)
```bash
NODE_ENV=development
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
