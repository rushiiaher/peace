---
description: Clone production database from /home/deploy/ to local MongoDB
---

# Sync Production Database to Local

This workflow helps you clone your production MongoDB database to your local development environment.

## Prerequisites
- MongoDB tools installed locally (`mongodump`, `mongorestore`)
- SSH access to production server
- Local MongoDB instance running
- Backup your local data first (if needed)

---

## Method 1: Using SSH Tunnel (Recommended)

### Step 1: Get Production MongoDB Connection String
SSH into your server and check the `.env` file:
```bash
ssh your-username@your-server-ip
cd /home/deploy/
cat .env | grep MONGODB_URI
```

### Step 2: Export Production Database
On the production server:
```bash
cd /home/deploy/
mongodump --uri="YOUR_PRODUCTION_MONGODB_URI" --out=./db_backup
```

### Step 3: Download Backup to Local Machine
From your local machine (Windows):
```powershell
scp -r your-username@your-server-ip:/home/deploy/db_backup ./db_backup
```

### Step 4: Drop Local Database (Clean)
```powershell
# Connect to local MongoDB
mongosh

# In mongosh:
use lmsdb
db.dropDatabase()
exit
```

### Step 5: Restore Production Data Locally
```powershell
# Make sure your local MongoDB is running
# Restore the backup
mongorestore --uri="mongodb://localhost:27017/lmsdb" ./db_backup/lmsdb
```

### Step 6: Cleanup
```powershell
# Remove backup files
Remove-Item -Recurse -Force ./db_backup
```

On server:
```bash
rm -rf /home/deploy/db_backup
```

---

## Method 2: Direct URI to URI (Faster)

If both databases are accessible via connection strings:

### Step 1: Get Both Connection Strings
- Production: From `/home/deploy/.env`
- Local: From your local `.env` or `mongodb://localhost:27017/lmsdb`

### Step 2: One-Command Sync
```powershell
mongodump --uri="PRODUCTION_MONGODB_URI" --archive | mongorestore --uri="mongodb://localhost:27017/lmsdb" --archive --drop
```

**Note**: The `--drop` flag will drop existing collections before restoring.

---

## Method 3: Using MongoDB Atlas (If Using Cloud)

### Step 1: Export from Production Atlas
1. Log into MongoDB Atlas
2. Go to your production cluster
3. Click "..." → "Command Line Tools"
4. Copy the `mongodump` connection string
5. Run locally:
```powershell
mongodump --uri="PRODUCTION_ATLAS_URI" --out=./prod_backup
```

### Step 2: Import to Local
```powershell
# Drop local database first
mongosh mongodb://localhost:27017/lmsdb --eval "db.dropDatabase()"

# Restore
mongorestore --uri="mongodb://localhost:27017/lmsdb" ./prod_backup/lmsdb

# Cleanup
Remove-Item -Recurse -Force ./prod_backup
```

---

## Quick Script (PowerShell)

Save this as `sync-db.ps1`:

```powershell
# Configuration
$PROD_SERVER = "your-username@your-server-ip"
$PROD_DB_URI = "YOUR_PRODUCTION_MONGODB_URI"
$LOCAL_DB_URI = "mongodb://localhost:27017/lmsdb"
$BACKUP_DIR = ".\db_backup"

Write-Host "🔄 Starting database sync..." -ForegroundColor Cyan

# Step 1: Create backup directory
Write-Host "📁 Creating backup directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

# Step 2: Export from production
Write-Host "📤 Exporting production database..." -ForegroundColor Yellow
ssh $PROD_SERVER "cd /home/deploy && mongodump --uri='$PROD_DB_URI' --out=./db_backup"

# Step 3: Download backup
Write-Host "⬇️  Downloading backup files..." -ForegroundColor Yellow
scp -r "${PROD_SERVER}:/home/deploy/db_backup/*" $BACKUP_DIR

# Step 4: Drop local database
Write-Host "🗑️  Cleaning local database..." -ForegroundColor Yellow
mongosh $LOCAL_DB_URI --eval "db.dropDatabase()" --quiet

# Step 5: Restore to local
Write-Host "📥 Restoring to local database..." -ForegroundColor Yellow
mongorestore --uri="$LOCAL_DB_URI" "$BACKUP_DIR\lmsdb"

# Step 6: Cleanup
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $BACKUP_DIR
ssh $PROD_SERVER "rm -rf /home/deploy/db_backup"

Write-Host "✅ Database sync completed successfully!" -ForegroundColor Green
```

Run with:
```powershell
.\sync-db.ps1
```

---

## Important Notes

⚠️ **Before Syncing:**
1. **Backup your local data** if you need it
2. **Stop your local development server** to avoid conflicts
3. **Update .env** if connection strings changed

⚠️ **After Syncing:**
1. **Verify data** in your local MongoDB
2. **Restart your development server**
3. **Check that all features work** with production data

⚠️ **Security:**
- Never commit production connection strings to Git
- Use environment variables
- Restrict database access by IP if possible

---

## Verify Sync Success

After syncing, verify your data:

```powershell
# Connect to local MongoDB
mongosh mongodb://localhost:27017/lmsdb

# Check databases
show dbs

# Check collections
use lmsdb
show collections

# Count documents in key collections
db.users.countDocuments()
db.institutes.countDocuments()
db.courses.countDocuments()
db.students.countDocuments()

exit
```

---

## Troubleshooting

**Error: "mongodump not found"**
- Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools
- Add to PATH: `C:\Program Files\MongoDB\Tools\100\bin`

**Error: "connection refused"**
- Ensure local MongoDB is running: `mongod` or check Windows Services
- Verify connection string is correct

**Error: "authentication failed"**
- Check username/password in connection string
- Verify user has correct permissions

**Partial data restored:**
- Ensure you're using the correct database name
- Check if production has multiple databases
- Verify backup completed successfully

---

## Manual Database Inspection

If you want to manually check the databases:

```bash
# On production server
ssh your-username@your-server-ip
mongosh YOUR_PRODUCTION_MONGODB_URI
show dbs
use lmsdb
show collections
db.users.countDocuments()
exit
```

```powershell
# On local machine
mongosh mongodb://localhost:27017
show dbs
use lmsdb
show collections
db.users.countDocuments()
exit
```
