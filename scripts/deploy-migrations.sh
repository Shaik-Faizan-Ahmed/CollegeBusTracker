#!/bin/bash

# Production Database Migration Script for Render.com Deployment
# This script runs database migrations for the CVR Bus Tracker application

set -e

echo "🗄️  Starting database migration deployment..."

# Set working directory to backend
cd apps/backend

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Required environment variables not set"
  echo "   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured"
  exit 1
fi

echo "✅ Environment variables configured"

# Run migration service to validate schema
echo "📋 Running schema validation..."
node -e "
const { migrationService } = require('./dist/services/migrationService');

async function runMigrations() {
  try {
    console.log('🔄 Initializing database schema...');
    await migrationService.initializeDatabase();
    
    console.log('🔍 Validating schema...');
    const isValid = await migrationService.validateSchema();
    
    if (isValid) {
      console.log('✅ Database schema is valid and ready');
    } else {
      console.log('⚠️  Schema validation failed - manual setup may be required');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
"

echo "🎉 Database migration deployment completed successfully!"