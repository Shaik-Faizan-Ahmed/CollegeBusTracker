#!/bin/bash

# Database Backup Script for CVR Bus Tracker
# Creates automated backups of the Supabase PostgreSQL database

set -e

echo "💾 Starting database backup..."

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Required environment variables not set"
  echo "   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured"
  exit 1
fi

# Create backup directory if it doesn't exist
BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

echo "📂 Backup directory: $BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/cvr-bus-tracker-backup-$(date +%Y%m%d-%H%M%S).sql"

echo "📋 Creating database backup..."

# For Supabase, we'll create a data export using the API
node -e "
const fs = require('fs');
const databaseService = require('./apps/backend/dist/services/databaseService').default;

async function createBackup() {
  try {
    await databaseService.connect();
    const client = databaseService.getClient();
    
    // Export bus_sessions table data
    const { data: sessions, error } = await client
      .from('bus_sessions')
      .select('*');
    
    if (error) throw error;
    
    const backupData = {
      timestamp: new Date().toISOString(),
      tables: {
        bus_sessions: sessions || []
      },
      metadata: {
        version: '1.0',
        source: 'cvr-bus-tracker',
        record_count: sessions?.length || 0
      }
    };
    
    fs.writeFileSync('$BACKUP_FILE.json', JSON.stringify(backupData, null, 2));
    
    console.log(\`✅ Backup completed: \${sessions?.length || 0} records exported\`);
    console.log(\`📁 Backup saved to: $BACKUP_FILE.json\`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

createBackup();
"

echo "🎉 Database backup completed successfully!"
echo "📍 Backup location: $BACKUP_FILE.json"