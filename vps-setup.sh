#!/bin/bash

# ==========================================
# Peace LMS - VPS Setup Script (Ubuntu)
# ==========================================
# This script installs all necessary dependencies for the Peace LMS project.
# Run this on your fresh Ubuntu VPS.
#
# Requirements:
# - Ubuntu 20.04 / 22.04 / 24.04
# - Root access (sudo)
# ==========================================

set -e # Exit immediately if a command exits with a non-zero status

echo "Starting VPS Setup..."

# 1. System Update & Basic Tools
echo ">>> Updating System..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw build-essential libssl-dev

# 2. Setup Swap Memory (4GB) - CRITICAL for 8GB RAM servers
if [ ! -f /swapfile ]; then
    echo ">>> Setting up 4GB Swap File..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
else
    echo ">>> Swap file already exists. Skipping..."
fi

# 3. Install Node.js (via NVM for flexibility, or NodeSource for system-wide)
# Using NodeSource for a stable system-wide installation of Node 20 LTS
echo ">>> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install pnpm (Project uses pnpm-lock.yaml)
echo ">>> Installing pnpm..."
sudo npm install -g pnpm pm2

# 5. Install MongoDB Community Edition
echo ">>> Installing MongoDB..."
# Import the public key used by the package management system
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
# Reload local package database
sudo apt update
# Install the MongoDB packages
sudo apt install -y mongodb-org

# 6. Optimize MongoDB Configuration (Limit RAM usage)
echo ">>> Optimizing MongoDB Configuration..."
# We limit WiredTiger cache to 3GB to leave 5GB for Next.js app + OS
# This prevents MongoDB from eating all RAM and crashing the server
CONFIG_FILE="/etc/mongod.conf"
if grep -q "wiredTiger:" "$CONFIG_FILE"; then
    echo "MongoDB config already has wiredTiger settings."
else
    sudo bash -c "cat >> $CONFIG_FILE" <<EOL

storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 3
EOL
fi

# Start and Enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 7. Install Nginx & Certbot
echo ">>> Installing Nginx & Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 8. Configure Firewall (UFW)
echo ">>> Configuring Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "=========================================="
echo "VPS Setup Complete!"
echo "Next Steps:"
echo "1. Clone your repo: git clone <your-repo-url> /var/www/peace-lms"
echo "2. Setup .env file"
echo "3. Run 'pnpm install' and 'pnpm build'"
echo "4. Use PM2 to start the app"
echo "=========================================="
