# Quick Vercel Deployment Guide

## 🚀 Deploy PEACE LMS to Vercel in 10 Minutes

### **Prerequisites:**
- ✅ Your code is ready (it is!)
- ✅ GitHub account
- ✅ Vercel account (free)
- ✅ MongoDB Atlas account (free)

---

## **Method 1: Deploy via GitHub (Recommended)**

### **Step 1: Setup MongoDB Atlas** (5 minutes)

1. **Create Free Cluster:**
   ```
   Go to: https://cloud.mongodb.com/
   Sign up/Login → Create Free Cluster (M0)
   Choose: AWS, Region closest to you
   Cluster Name: peace-lms
   ```

2. **Create Database User:**
   ```
   Security → Database Access → Add New User
   Username: peacelms
   Password: [Generate secure password]
   Privileges: Read and Write to any database
   ```

3. **Whitelist All IPs (for Vercel):**
   ```
   Security → Network Access → Add IP Address
   Enter: 0.0.0.0/0
   Comment: Vercel serverless functions
   ```

4. **Get Connection String:**
   ```
   Click: Connect → Connect your application
   Driver: Node.js
   Copy connection string:
   mongodb+srv://peacelms:<password>@peace-lms.xxxxx.mongodb.net/?retryWrites=true&w=majority
   
   Replace <password> with your actual password
   Add database name: /peacelms before ?retryWrites
   ```

5. **Import Your Data (if migrating from VPS):**
   ```bash
   # On your VPS:
   mongodump --uri="mongodb://localhost:27017/peacelms" --out=./backup
   
   # On your local machine:
   mongorestore --uri="YOUR_ATLAS_CONNECTION_STRING" ./backup/peacelms
   ```

---

### **Step 2: Push to GitHub** (2 minutes)

```bash
cd c:\Users\rushi\Desktop\Personal\proj4\main

# If not already a git repo:
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# Create GitHub repo (via web):
# Go to github.com → New Repository → peace-lms

# Push to GitHub:
git remote add origin https://github.com/YOUR_USERNAME/peace-lms.git
git branch -M main
git push -u origin main
```

---

### **Step 3: Deploy to Vercel** (3 minutes)

1. **Connect Vercel:**
   ```
   Go to: https://vercel.com
   Sign in with GitHub
   Click: Add New Project
   Import your "peace-lms" repository
   ```

2. **Configure Build Settings:**
   ```
   Framework Preset: Next.js (auto-detected)
   Root Directory: ./ (leave as is)
   Build Command: npm run build (default)
   Output Directory: .next (default)
   Install Command: npm install (default)
   ```

3. **Add Environment Variables:**
   Click "Environment Variables" and add:
   
   ```env
   # Database
   MONGODB_URI = mongodb+srv://peacelms:YOUR_PASSWORD@peace-lms.xxxxx.mongodb.net/peacelms?retryWrites=true&w=majority
   
   # JWT Secret (generate new)
   JWT_SECRET = [Run: openssl rand -base64 32]
   
   # Razorpay Production Keys
   RAZORPAY_KEY_ID = rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_live_xxxxxxxxxxxxx
   
   # Environment
   NODE_ENV = production
   ```

4. **Deploy:**
   ```
   Click: Deploy
   Wait 2-3 minutes...
   ✅ Success! You'll get: https://peace-lms.vercel.app
   ```

---

## **Method 2: Deploy via Vercel CLI** (Faster)

### **Quick Deploy:**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Navigate to project
cd c:\Users\rushi\Desktop\Personal\proj4\main

# 4. Deploy
vercel

# Follow prompts:
# → Link to existing project? No
# → What's your project's name? peace-lms
# → In which directory is your code located? ./
# → Want to override settings? No

# 5. Add environment variables
vercel env add MONGODB_URI production
# Paste your MongoDB Atlas connection string

vercel env add JWT_SECRET production
# Paste your JWT secret

vercel env add RAZORPAY_KEY_ID production
# Paste your Razorpay key

vercel env add RAZORPAY_KEY_SECRET production
# Paste your Razorpay secret

vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production
# Paste your Razorpay public key

vercel env add NODE_ENV production
# Type: production

# 6. Deploy to production
vercel --prod
```

**Done!** Your app is live! 🎉

---

## **Post-Deployment Checklist**

### **✅ Test These Features:**

1. **Login:**
   ```
   Super Admin: Use your credentials
   Test login flow
   Verify JWT authentication
   ```

2. **User Management:**
   ```
   Create new institute
   Add students
   Upload photos (test file upload)
   ```

3. **Exam System:**
   ```
   Schedule an exam
   Check system availability
   Generate admit cards
   ```

4. **Payments:**
   ```
   Test Razorpay integration
   Verify webhook handling (if using)
   ```

5. **Reports:**
   ```
   Export Excel
   Generate PDFs
   Check if large exports work
   ```

---

## **Monitoring & Logs**

### **View Logs:**
```
Vercel Dashboard → Your Project → Deployments → [Latest] → Function Logs
or
vercel logs [deployment-url]
```

### **Monitor Performance:**
```
Vercel Dashboard → Analytics
- Page views
- Function execution time
- Error rates
```

### **MongoDB Monitoring:**
```
MongoDB Atlas → Metrics
- Connections
- Operations
- Storage used
```

---

## **Custom Domain Setup** (Optional)

1. **Buy Domain** (optional):
   ```
   Namecheap, GoDaddy, etc.
   Example: peacelms.com
   ```

2. **Add to Vercel:**
   ```
   Vercel Dashboard → Settings → Domains
   Enter your domain: peacelms.com
   ```

3. **Update DNS:**
   ```
   Add CNAME record at your registrar:
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

4. **SSL:**
   ```
   Auto-provisioned by Vercel (free!)
   Wait 5-10 minutes for propagation
   ```

---

## **Continuous Deployment**

**Auto-deploy on Git push:**
```bash
# Make changes to code
git add .
git commit -m "Fix: Updated exam scheduling"
git push origin main

# Vercel auto-deploys! 🚀
# Check: https://vercel.com/[username]/peace-lms
```

**Preview deployments:**
```bash
# Create feature branch
git checkout -b feature/new-reports
# Make changes, then:
git push origin feature/new-reports

# Vercel creates preview URL!
# Test before merging to main
```

---

## **Rollback** (if something breaks)

**Via Dashboard:**
```
Vercel → Deployments → [Previous working version] → Promote to Production
```

**Via CLI:**
```bash
vercel rollback
```

---

## **Environment Variable Updates**

**Via Dashboard:**
```
Vercel → Settings → Environment Variables
Edit → Save
Redeploy for changes to take effect
```

**Via CLI:**
```bash
vercel env rm MONGODB_URI production
vercel env add MONGODB_URI production
# Paste new value
vercel --prod
```

---

## **Troubleshooting**

### **Build Fails:**
```bash
# Check build logs in Vercel dashboard
# Common issues:
1. Missing environment variables
2. TypeScript errors (you have ignoreBuildErrors: true, so unlikely)
3. Dependency issues (run npm install locally first)
```

### **500 Error on API Routes:**
```bash
# Check function logs
# Common issues:
1. MongoDB connection string wrong
2. Missing environment variable
3. MongoDB Atlas IP not whitelisted (use 0.0.0.0/0)
```

### **Slow First Load:**
```
Normal! Cold start latency
- Add loading states in UI
- Consider Vercel Pro for better performance
```

### **MongoDB Connection Issues:**
```bash
# Verify:
1. Connection string format correct
2. Password doesn't contain special chars needing URL encoding
3. Database name included in connection string
4. 0.0.0.0/0 whitelisted in Atlas
```

---

## **Cost Monitoring**

### **Vercel:**
```
Dashboard → Usage
- Check bandwidth usage
- Monitor function invocations
- Free tier: 100GB/month bandwidth
```

### **MongoDB Atlas:**
```
Dashboard → Metrics
- Check storage usage
- Monitor connection count
- Free tier: 512MB storage
```

**Set up alerts:**
```
Both platforms support usage alerts
Set at 80% of free tier limits
```

---

## **Upgrade Path** (When you grow)

### **When to upgrade:**

**Vercel:**
```
Free → Pro ($20/mo) when:
- >100GB bandwidth/month
- Need better cold start performance
- Need team collaboration
- Need password protection for preview
```

**MongoDB Atlas:**
```
M0 (Free) → M2 ($9/mo) when:
- >512MB data
- >500 concurrent connections
- Need better performance
```

---

## **Backup Strategy**

### **MongoDB Atlas Backups:**
```
Free tier: No automatic backups
Recommendation:
1. Manual exports weekly:
   mongodump --uri="YOUR_ATLAS_URI" --out=./backup-$(date +%Y%m%d)

2. Or upgrade to M2 for automatic backups ($9/mo)
```

### **Code Backups:**
```
Already backed up in GitHub! ✅
```

---

## **Support**

**Issues?**
- **Vercel:** https://vercel.com/support
- **MongoDB:** https://support.mongodb.com
- **Community:** https://github.com/vercel/next.js/discussions

---

## **Quick Commands Reference**

```bash
# Deploy
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Run locally with production env
vercel env pull .env.local
npm run dev

# Rollback
vercel rollback

# Remove deployment
vercel rm peace-lms
```

---

## **✅ You're Done!**

Your PEACE LMS is now:
- ✅ Live on global CDN
- ✅ Auto-scaling
- ✅ Free SSL
- ✅ Auto-deploying from Git
- ✅ Zero server maintenance

**Start URL:** `https://peace-lms.vercel.app`  
**Upgrade later:** Add custom domain!

---

**Questions?** Check `VERCEL_DEPLOYMENT_ANALYSIS.md` for detailed technical analysis.

**Happy deploying! 🚀**
