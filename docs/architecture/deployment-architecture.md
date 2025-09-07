# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Local builds for development, future app store distribution
- **Build Command:** `cd apps/mobile && npx react-native build-android`
- **Output Directory:** `apps/mobile/android/app/build/outputs/apk/`

**Backend Deployment:**
- **Platform:** Render.com (Free Tier)
- **Build Command:** `yarn install && yarn workspace backend build`
- **Deployment Method:** Git-based continuous deployment

## CI/CD Pipeline
```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend
on:
  push:
    branches: [main]
    paths: ['apps/backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Run tests
        run: yarn workspace backend test
      - name: Deploy to Render
        uses: render-deploy/render-deploy-action@v1.0.0
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## Environments
| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | localhost:8081 | localhost:3000 | Local development |
| Production | Local builds | cvr-bus-tracker.onrender.com | Live environment |
