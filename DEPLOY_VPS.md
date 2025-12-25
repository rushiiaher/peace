# Deploying to Hostinger VPS (Ubuntu)

This guide will help you deploy the LMS Platform to a Linux VPS (Hostinger, DigitalOcean, AWS, etc.) using **PNPM**.

## Prerequisites

On your VPS, you need to install:
1. **Node.js** (v18 or higher)
2. **PNPM** (Package Manager)
3. **Nginx** (Web Server/Reverse Proxy)
4. **MongoDB** (Database) - *or use MongoDB Atlas*
5. **PM2** (Process Manager to keep the app running)
6. **Git**

---

## Step 1: Install Node.js & Tools

Access your VPS via SSH and run:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Curl
sudo apt install curl -y

# Install Node.js (v18 LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify install
node -v
npm -v

# Install PNPM globally
sudo npm install -g pnpm

# Install PM2 globally
sudo npm install -g pm2
```

## Step 2: Install MongoDB (If running locally)

If you are using MongoDB Atlas (Cloud), skip this step. If you want the database on the same server:

```bash
# Import public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Create list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and Enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Step 3: Setup the Project

```bash
# Clone your repository (or upload files via SFTP)
git clone <YOUR_REPO_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies using pnpm
pnpm install

# Setup Environment Variables
# Create a .env file and paste your secrets
nano .env
```

*Paste the content from your local `.env` or `.env.example` and fill in the values.*

```bash
# Build the application
pnpm run build
```

## Step 4: Start with PM2

We use PM2 to keep the app running in the background.

```bash
# Start the app using the ecosystem file we created
pm2 start ecosystem.config.js

# Save the PM2 list so it restarts on reboot
pm2 save
pm2 startup
```

## Step 5: Configure Nginx (Reverse Proxy)

Nginx will forward traffic from port 80 (HTTP) to your app on port 3000.

```bash
# Install Nginx
sudo apt install nginx -y

# Allow Nginx in Firewall
sudo ufw allow 'Nginx Full'

# Create a configuration block
sudo nano /etc/nginx/sites-available/lms-app
```

**Paste the following (replace `your_domain.com` with your actual domain or IP):**

```nginx
server {
    listen 80;
    server_name test.peaceindiaorg.in www.test.peaceindiaorg.in; # Or your VPS IP address

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**

```bash
# Link the config
sudo ln -s /etc/nginx/sites-available/lms-app /etc/nginx/sites-enabled/

# Check config syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 6: SSL (HTTPS) - Optional but Recommended

If you have a domain pointing to your VPS IP:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d test.peaceindiaorg.in -d www.test.peaceindiaorg.in
```

## Step 7: Seeding Data (First Time Only)

To populate the database with the initial Super Admin and demo data:

```bash
pnpm run seed-demo
```
