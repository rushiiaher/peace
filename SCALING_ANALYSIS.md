# System Scalability Analysis

## Current Configuration
- **Hardware**: 2 CPU Cores, 8GB RAM, 100GB Disk (VPS)
- **Software**: Next.js (Node.js), MongoDB (Self-hosted on same VPS)
- **Target Load**: 7000 Students Daily

## Capability Assessment
Can this configuration handle 7000 students?

### Scenario A: Distributed Load (Daily Usage)
**YES.**
If 7000 students use the system throughout an 8-10 hour day:
- Average: ~700-900 users per hour.
- Concurrent: ~100-200 active users at any given moment.
- **Verdict**: 2 Cores and 8GB RAM is sufficient for this load, provided the code is optimized (which we have started doing).

### Scenario B: Peak Concurrency (Simultaneous Exams)
**RISKY.**
If 7000 students start an exam at the exact same time (e.g., 10:00 AM):
- **Impact**: 7000 requests hitting the server within seconds.
- **Result**: The 2 CPU cores will likely hit 100% usage. Requests may time out (504 Gateway Time-out). MongoDB might struggle to return queries instantly.
- **Verdict**: You need to implement strict "Staggered Entry" (Batches) or upgrade hardware for this specific scenario.

---

## Action Plan: Optimizations Implemented

We have already applied the following critical fixes to your codebase:

1.  **Database Indexing (Critical)**
    - Modified `lib/models/ExamResult.ts` to index `{ examId: 1, studentId: 1 }`.
    - Modified `lib/models/Exam.ts` to index `{ courseId: 1, instituteId: 1 }`.
    - **Why**: Without these, MongoDB would inspect every single document for every student submission, crushing your CPU. Now it's instant.

2.  **Cluster Mode (PM2)**
    - Updated `ecosystem.config.js` to `instances: 'max'` and `exec_mode: 'cluster'`.
    - **Why**: Node.js is single-threaded. By default, it ignores your 2nd CPU core. This change forces it to use BOTH cores, effectively doubling your request handling capacity.

---

## Further Recommendations (To Execute on VPS)

### 1. Database Optimization (MongoDB)
Since you are hosting MongoDB on the same server:
- **Limit Cache**: Create a `mongod.conf` and restrict `wiredTiger` cache to ~3GB.
  ```yaml
  storage:
    wiredTiger:
      engineConfig:
        cacheSizeGB: 3
  ```
- **Why**: By default, MongoDB takes 50% of (RAM - 1GB). On an 8GB server, it might take 3.5GB+. Next.js needs the rest. If they fight for RAM, the server crashes.

### 2. Enable Swap Memory
Run these commands on your Ubuntu VPS to add 4GB of safety memory (Swap):
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
**Why**: If 7000 students login, RAM usage will spike. Swap prevents the server from crashing by using disk space as temporary RAM.

### 3. Nginx Reverse Proxy
Install Nginx and configure it to cache static files (`/_next/static/`).
- This offloads serving images/CSS/JS from your detailed Next.js Node process to the highly efficient Nginx process.

### 4. Exam Batches
**Do not** allow 7000 students to start at 10:00:00 AM strictly.
- Schedule batches:
  - Batch A (2000 students): 10:00 AM
  - Batch B (2000 students): 10:15 AM
  - ...
- This flattens the spike and makes the 2-core server comfortable.

## Conclusion
With the code changes I just made and the `Swap` + `Nginx` configuration on server setup, your logic **can** handle the daily load. For concurrent exams, **please verify usage patterns** or upgrade to 4 Cores.
