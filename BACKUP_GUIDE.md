# Database Backup Guide (Atlas)

Since you are storing images as Base64 in the Database (which is heavy), and you want to save space on your Cloud Backup (Atlas), we have created a custom backup script.

## How it works
The script `scripts/backup-to-atlas.ts` does the following:
1.  Connects to your VPS Database (Source).
2.  Connects to your MongoDB Atlas Database (Destination).
3.  Copies all data **EXCEPT** the following heavy fields:
    -   `documents.photo`
    -   `documents.idProof`
    -   `documents.certificates`
4.  It uses "Upsert" (Update or Insert), so you can run it every night and it will just update changed data.

## Setup Instructions

### 1. Get your Atlas Connection String
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Click **Connect** -> **Drivers**.
3.  Copy the connection string (e.g., `mongodb+srv://<user>:<password>@cluster0.exmpl.mongodb.net/?retryWrites=true&w=majority`).

### 2. Configure Environment
On your VPS, open your `.env` file:
```bash
nano .env
```
Add this new line at the bottom:
```env
ATLAS_URI='your_connection_string_here'
```
(Replace with your real Atlas string).

### 3. Run the Backup Manually (Test)
To test if it works, run this on your VPS:
```bash
npx tsx scripts/backup-to-atlas.ts
```

### 4. Schedule Automatic Nightly Backups
To run this automatically every night at 3:00 AM:

1.  Open Crontab:
    ```bash
    crontab -e
    ```
2.  Add this line at the bottom:
    ```bash
    0 3 * * * cd /var/www/peace/current && /usr/bin/npx tsx scripts/backup-to-atlas.ts >> /var/log/db-backup.log 2>&1
    ```
    *(Note: Adjust the path `/var/www/peace` to wherever you cloned the repo).*

## Restore Strategy
If your VPS crashes:
1.  Re-install MongoDB on the VPS.
2.  Run a script (reverse of the backup) or simply use `mongodump` from Atlas and `mongorestore` to VPS.
    *   *Note: The restored students will not have photos. They will need to re-upload them.*
