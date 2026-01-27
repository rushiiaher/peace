---
description: Deploy code changes to production server at /home/deploy/
---

# Deploy to Production Server

Follow these steps to deploy the latest changes to your production environment:

## Prerequisites
- SSH access to your server
- Git repository configured with remote origin
- PM2 or similar process manager running on server

## Deployment Steps

### 1. Commit and Push Changes Locally
```bash
git add .
git commit -m "Fix: User management - increase limit and improve error handling"
git push origin main
```

### 2. SSH into Your Server
```bash
ssh your-username@your-server-ip
```

### 3. Navigate to Deploy Directory
```bash
cd /home/deploy/
```

### 4. Pull Latest Changes
```bash
git pull origin main
```

### 5. Install Dependencies (if package.json changed)
```bash
npm install
```

### 6. Build the Application
```bash
npm run build
```

### 7. Restart the Application
If using PM2:
```bash
pm2 restart all
# OR for specific app
pm2 restart ecosystem.config.js
```

If using systemd:
```bash
sudo systemctl restart your-app-name
```

### 8. Verify Deployment
```bash
pm2 logs
# OR
pm2 status
```

### 9. Check Application
- Open your production URL in a browser
- Navigate to User Management
- Verify that all users are now visible
- Try creating a new user to test error messages

## Quick Deploy Command (One-Liner)
If you want to deploy in one command from your server:
```bash
cd /home/deploy/ && git pull origin main && npm install && npm run build && pm2 restart all
```

## Rollback (If Needed)
If something goes wrong:
```bash
cd /home/deploy/
git log --oneline -5  # See recent commits
git reset --hard COMMIT_HASH  # Replace with previous commit hash
npm run build
pm2 restart all
```

## Notes
- Always test in a staging environment first if available
- The database is shared, so schema changes take effect immediately
- Consider creating a database backup before major deployments
- Monitor PM2 logs for any errors after deployment
