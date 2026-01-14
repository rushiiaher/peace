# Deploying to VPS (Ubuntu via Hostinger)

This guide assumes you have a fresh Ubuntu VPS and SSH access.

## Step 1: Initialize the Server
1.  **SSH into your VPS**:
    ```bash
    ssh root@<your-vps-ip>
    ```
2.  **Upload the setup script**:
    You can copy-paste the content of `vps-setup.sh` or upload it.
    ```bash
    # (On your local machine, inside project folder)
    scp vps-setup.sh root@<your-vps-ip>:~/
    ```
3.  **Run the script**:
    ```bash
    chmod +x vps-setup.sh
    ./vps-setup.sh
    ```
    *This will take 5-10 minutes to install Node.js, MongoDB, Nginx, setup Firewall, and create Swap memory.*

## Step 2: Deploy the Code
1.  **Clone your project**:
    ```bash
    # Navigate to web directory
    cd /var/www
    # Clone (replace with your actual git URL)
    git clone https://github.com/rushiiaher/peace.git peace-lms
    cd peace-lms
    ```
2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
3.  **Setup Environment Variables**:
    Create a `.env` file with your production secrets.
    ```bash
    nano .env
    ```
    Paste your production variables:
    ```env
    MONGODB_URI=mongodb://localhost:27017/peace_lms
    NEXT_PUBLIC_APP_URL=http://<your-domain-or-ip>
    AUTH_SECRET=<generate-a-secure-random-string>
    # ... add other keys from .env.local ...
    ```
4.  **Build the Project**:
    ```bash
    pnpm build
    ```

## Step 3: Start the Application (PM2)
We configured `ecosystem.config.js` to use all cores.
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# (Run the command output by 'pm2 startup' to make it auto-restart on boot)
```

## Step 4: Configure Nginx (Reverse Proxy)
1.  **Create Config**:
    ```bash
    nano /etc/nginx/sites-available/peace-lms
    ```
2.  **Paste Configuration**:
    Copy the content from `nginx.conf.template` in your project.
    **IMPORTANT**: Change `server_name` to your actual domain name (e.g., `lms.myschool.com`) or IP address.
3.  **Activate Config**:
    ```bash
    ln -s /etc/nginx/sites-available/peace-lms /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default  # Remove default welcome page
    nginx -t  # Test config
    systemctl restart nginx
    ```

## Step 5: SSL (HTTPS) - Optional but Recommended
If you have a domain name pointed to this VPS IP:
```bash
certbot --nginx -d yourdomain.com
```

## Maintenance & Monitoring
- **Check Logs**: `pm2 logs`
- **Check Status**: `pm2 status`
- **Database Backup**: `mongodump --out /backup/path`
- **Update Code**:
  ```bash
  cd /var/www/peace-lms
  git pull
  pnpm install
  pnpm build
  pm2 restart lms-platform
  ```

---
**Note on 7000 Users Scalability**:
The `vps-setup.sh` script automatically limits MongoDB to 3GB RAM and creates a 4GB Swap file. This effectively reserves the remaining ~4GB RAM + Swap for your Node.js application, allowing it to handle concurrent exam submissions without crashing the server.
