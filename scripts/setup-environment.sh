#!/bin/bash

# Environment Setup Script for CVR Bus Tracker
# Sets up environment configuration for different deployment stages

set -e

echo "🔧 CVR Bus Tracker Environment Setup"
echo "======================================"

# Check if environment argument is provided
ENV=${1:-development}

case $ENV in
  development|staging|production|test)
    echo "📋 Setting up $ENV environment..."
    ;;
  *)
    echo "❌ Invalid environment: $ENV"
    echo "   Valid options: development, staging, production, test"
    exit 1
    ;;
esac

# Create environment-specific files if they don't exist
BACKEND_ENV_FILE="apps/backend/.env.$ENV"

if [ ! -f "$BACKEND_ENV_FILE" ]; then
  echo "📄 Creating $BACKEND_ENV_FILE..."
  
  case $ENV in
    development)
      cat > "$BACKEND_ENV_FILE" << EOF
# Development Environment Configuration
NODE_ENV=development
PORT=3001

# Supabase Configuration (replace with your actual keys)
SUPABASE_URL=https://bmhruvfthinvkebgavk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_development_service_role_key
SUPABASE_ANON_KEY=your_development_anon_key

# API Configuration
API_BASE_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:8081

# Logging
LOG_LEVEL=debug

# Development Features
DEBUG=true
EOF
      ;;
      
    staging)
      cat > "$BACKEND_ENV_FILE" << EOF
# Staging Environment Configuration
NODE_ENV=staging
PORT=3001

# Supabase Configuration
SUPABASE_URL=https://bmhruvfthinvkebgavk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}

# API Configuration
API_BASE_URL=https://cvr-bus-tracker-staging.onrender.com
CORS_ORIGINS=https://staging-mobile-app.example.com

# Monitoring
SENTRY_DSN=\${SENTRY_DSN}

# Logging
LOG_LEVEL=info

# Production-like settings
DEBUG=false
EOF
      ;;
      
    production)
      cat > "$BACKEND_ENV_FILE" << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Supabase Configuration (use environment variables in production)
SUPABASE_URL=\${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}

# API Configuration
API_BASE_URL=\${API_BASE_URL:-https://cvr-bus-tracker.onrender.com}
CORS_ORIGINS=\${CORS_ORIGINS:-https://cvr-bus-tracker.app}

# Monitoring
SENTRY_DSN=\${SENTRY_DSN}

# Logging
LOG_LEVEL=warn

# Production settings
DEBUG=false
EOF
      ;;
      
    test)
      cat > "$BACKEND_ENV_FILE" << EOF
# Test Environment Configuration
NODE_ENV=test
PORT=3002

# Supabase Configuration
SUPABASE_URL=https://bmhruvfthinvkebgavk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
SUPABASE_ANON_KEY=your_test_anon_key

# API Configuration
API_BASE_URL=http://localhost:3002
CORS_ORIGINS=http://localhost:8081

# Logging
LOG_LEVEL=error

# Test settings
DEBUG=false
EOF
      ;;
  esac
  
  echo "✅ Created $BACKEND_ENV_FILE"
else
  echo "📄 $BACKEND_ENV_FILE already exists"
fi

# Copy the active environment file to .env
echo "📋 Setting active environment to $ENV..."
cp "$BACKEND_ENV_FILE" "apps/backend/.env"
echo "✅ Copied $BACKEND_ENV_FILE to apps/backend/.env"

# Validate environment setup
echo "🔍 Validating environment setup..."

# Check if required variables are present
REQUIRED_VARS=("NODE_ENV" "PORT" "SUPABASE_URL")
MISSING_VARS=()

for var in "\${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var=" "apps/backend/.env" 2>/dev/null; then
    MISSING_VARS+=("$var")
  fi
done

if [ \${#MISSING_VARS[@]} -eq 0 ]; then
  echo "✅ Environment validation passed"
else
  echo "⚠️  Missing required variables: \${MISSING_VARS[*]}"
  echo "   Please update apps/backend/.env with the missing values"
fi

# Display current configuration (without sensitive values)
echo ""
echo "📊 Current Environment Configuration:"
echo "   Environment: $ENV"
echo "   Config File: $BACKEND_ENV_FILE"
echo "   Active File: apps/backend/.env"

if [ -f "apps/backend/.env" ]; then
  echo ""
  echo "📋 Active Configuration Summary:"
  grep -E "^(NODE_ENV|PORT|API_BASE_URL|LOG_LEVEL)=" "apps/backend/.env" 2>/dev/null || true
fi

echo ""
echo "🎉 Environment setup completed successfully!"
echo ""
echo "📝 Next Steps:"
echo "   1. Update Supabase keys in apps/backend/.env if needed"
echo "   2. Configure any additional environment-specific variables"
echo "   3. Test the configuration by running: cd apps/backend && yarn dev"
echo ""
echo "🔒 Security Note:"
echo "   Never commit .env files with real credentials to version control!"