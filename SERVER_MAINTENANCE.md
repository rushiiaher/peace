# Server Maintenance & CPU Management Guide

This guide helps you monitor and manage the resources of your host to ensure stability for 7000 students.

## 1. Real-Time Monitoring (The Dashboard)
The best tool is already installed: **PM2 Monitor**.
Run this on the server whenever you want to check health:
```bash
pm2 monit
```
- **Left Panel**: Shows your running processes.
- **Right Panel**: Shows real-time logs.
- **Metadata**: Shows CPU % and Memory usage per core.

**Goal**: CPU should stay below 80% during normal load. Brief spikes to 100% are fine.

## 2. Global System View
To see everything (including MongoDB and Nginx):
```bash
htop
```
(If not installed: `sudo apt install htop`)
- **Green Bars**: CPU Usage per core.
- **Mem**: RAM usage.
- Press `F10` to exit.

## 3. Automatic Safety Valves (Configured)
We have configured two automatic safeguards:
1.  **MongoDB Limit**: Restricted to 3GB RAM. This prevents the database from eating the CPU's ability to switch tasks by clogging RAM.
2.  **PM2 Memory Cap (New)**: I just updated your config to restart any Node.js instance if it exceeds 1.5GB RAM. High RAM usage often causes high CPU usage (due to Garbage Collection). This keeps it fresh.

## 4. Emergency Action: "The Reset"
If CPU gets stuck at 100% and the site is slow, release the pressure by reloading:

```bash
# Reloads code without downtime (zero-downtime reload)
pm2 reload all
```

If that doesn't work:
```bash
# Hard restart
pm2 restart all
```

## 5. Log Rotation (Prevent Disk Full = CPU Hang)
Full disks cause CPU spikes. Install this module to auto-delete old logs:
```bash
pm2 install pm2-logrotate
# Keep last 10 log files, max 10MB each
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
```

## 6. Exam Load Management (The Human Factor)
**The #1 cause of CPU death is 7000 people clicking "Start" at exactly 10:00:00 AM.**
- **Solution**: Batches.
- Tell Group A (2000 students) to start at 10:00.
- Tell Group B (2000 students) to start at 10:15.
- This keeps your 2 Cores happy.
