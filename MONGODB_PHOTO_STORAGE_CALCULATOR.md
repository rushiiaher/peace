# MongoDB Photo Storage Calculator

## 📊 **Quick Answer**

**MongoDB Atlas Free Tier (M0):**
- **Total Storage:** 512 MB
- **Students with Photos (realistic):** ~800-1,200 students
- **Students with Photos (optimized):** ~1,500-2,000 students

---

## 🔢 **Detailed Calculation**

### **Photo Size Breakdown**

#### **Original Photo (Before Base64):**
```
Typical passport/ID photo:
- High Quality (JPEG):     150-250 KB
- Medium Quality (JPEG):   80-150 KB
- Low Quality (JPEG):      40-80 KB
- Compressed (JPEG):       20-40 KB

Recommended: Medium Quality (100 KB average)
```

#### **After Base64 Encoding:**
```
Base64 increases size by ~33%

Original 100 KB → Base64 133 KB
Original 50 KB  → Base64 66 KB
Original 200 KB → Base64 266 KB

Formula: Base64 Size = Original Size × 1.33
```

---

## 💾 **Storage Per Student**

### **Complete User Document Size:**

```javascript
// Typical User document in MongoDB:
{
  // Basic Info
  email: "student@example.com",           // ~30 bytes
  password: "hashed_bcrypt_password",     // ~60 bytes
  name: "Student Full Name",              // ~50 bytes
  firstName: "First",                     // ~20 bytes
  middleName: "Middle",                   // ~20 bytes
  lastName: "Last",                       // ~20 bytes
  role: "student",                        // ~10 bytes
  
  // References
  instituteId: ObjectId,                  // ~24 bytes
  rollNo: "VIS0001",                      // ~20 bytes
  
  // Contact
  phone: "+919876543210",                 // ~20 bytes
  address: "Complete Address String",     // ~100 bytes
  
  // Personal
  dateOfBirth: ISODate,                   // ~24 bytes
  guardianName: "Guardian Name",          // ~50 bytes
  guardianPhone: "+919876543210",         // ~20 bytes
  motherName: "Mother Name",              // ~40 bytes
  bloodGroup: "O+",                       // ~5 bytes
  aadhaarCardNo: "123456789012",         // ~15 bytes
  
  // Courses (1 course enrolled)
  courses: [{
    courseId: ObjectId,                   // ~24 bytes
    booksIncluded: false,                 // ~5 bytes
    enrolledAt: ISODate,                  // ~24 bytes
    accessExpiresAt: ISODate,            // ~24 bytes
    status: "Active",                     // ~10 bytes
    royaltyPaid: true,                    // ~5 bytes
    royaltyPaidAt: ISODate,              // ~24 bytes
    royaltyAmount: 50,                    // ~8 bytes
    booksDispatched: false,               // ~5 bytes
    booksReceived: false                  // ~5 bytes
  }],                                     // ~158 bytes
  
  // Documents (THE BIG ONE!)
  documents: {
    photo: "data:image/jpeg;base64,/9j/4AAQ...",  // 133 KB (base64)
    idProof: "",                          // ~0 bytes (optional)
    idProofType: "Aadhar",               // ~10 bytes
    certificates: []                      // ~5 bytes
  },                                      // ~133 KB
  
  // Metadata
  status: "Active",                       // ~10 bytes
  lastLogin: ISODate,                     // ~24 bytes
  lastActiveAt: ISODate,                  // ~24 bytes
  sessionToken: "token_string",           // ~50 bytes
  createdAt: ISODate,                     // ~24 bytes
  
  // MongoDB Internal
  _id: ObjectId,                          // ~24 bytes
  __v: 0                                  // ~4 bytes
}

TOTAL PER STUDENT:
├─ Photo (base64):           133 KB
├─ User data:                1.2 KB
└─ TOTAL:                    ~134 KB per student
```

---

## 📈 **Maximum Students Calculation**

### **Scenario 1: Only Student Data**

**If 100% of MongoDB is used for students:**

```
Total Storage: 512 MB = 524,288 KB
Per Student: 134 KB

Max Students = 524,288 KB ÷ 134 KB
             = 3,912 students

✅ Theoretical Maximum: ~3,900 students
```

### **Scenario 2: Realistic Production Use**

**Storage breakdown:**

```
Total: 512 MB (100%)

├─ Students:           ~350 MB (68%)  → ~2,600 students
├─ Courses:            ~20 MB  (4%)   → ~500 course documents
├─ Institutes:         ~5 MB   (1%)   → ~100 institutes
├─ Exams:             ~50 MB  (10%)  → ~1,000 exams
├─ Admit Cards:        ~30 MB  (6%)   → ~10,000 cards
├─ Results:            ~25 MB  (5%)   → ~5,000 results
├─ Question Banks:     ~15 MB  (3%)   → ~500 question sets
├─ Feedback Forms:     ~5 MB   (1%)   → ~200 forms
└─ Other (indexes):    ~12 MB  (2%)   → System overhead

Students with photos = 350 MB ÷ 134 KB
                     = ~2,600 students

✅ Realistic Maximum: ~2,600 students with photos
```

### **Scenario 3: Optimized Photos**

**Using compressed photos (50 KB original → 66 KB base64):**

```
Per Student with optimized photo:
├─ Photo (base64):           66 KB
├─ User data:                1.2 KB
└─ TOTAL:                    ~67 KB per student

Students = 350 MB ÷ 67 KB
         = ~5,200 students

✅ Optimized Maximum: ~5,200 students with compressed photos
```

---

## 🎯 **Photo Size Recommendations**

### **Quality vs Storage Trade-off:**

| Photo Quality | Original Size | Base64 Size | Students/350MB | Visual Quality |
|--------------|---------------|-------------|----------------|----------------|
| **Uncompressed** | 250 KB | 333 KB | ~1,050 | Excellent ⭐⭐⭐⭐⭐ |
| **High Quality** | 150 KB | 200 KB | ~1,750 | Very Good ⭐⭐⭐⭐ |
| **Medium Quality** | 100 KB | 133 KB | ~2,600 | Good ⭐⭐⭐ |
| **Compressed** | 50 KB | 66 KB | ~5,200 | Acceptable ⭐⭐ |
| **Highly Compressed** | 30 KB | 40 KB | ~8,750 | Poor ⭐ |

**Recommended:** 
- **Production:** 50-80 KB (compressed, good quality)
- **Stores:** ~4,000-5,000 students
- **Visual Quality:** Professional and acceptable

---

## 💡 **Optimization Strategies**

### **1. Client-Side Image Compression** ⭐⭐⭐

**Implement before upload:**

```typescript
// Add to your upload component
async function compressImage(file: File, maxSizeKB: number = 50): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Resize if too large
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        
        // Compress with quality adjustment
        let quality = 0.7
        let base64 = canvas.toDataURL('image/jpeg', quality)
        
        // Adjust quality to meet size target
        while (base64.length / 1024 > maxSizeKB && quality > 0.1) {
          quality -= 0.05
          base64 = canvas.toDataURL('image/jpeg', quality)
        }
        
        resolve(base64)
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

// Usage:
const compressedPhoto = await compressImage(file, 50) // Target 50 KB
```

**Benefits:**
- ✅ Reduces upload size by 50-70%
- ✅ Faster uploads
- ✅ 2-3x more students in same storage
- ✅ Better user experience

---

### **2. Lazy Loading Photos** ⭐⭐

**Don't load photos unless needed:**

```typescript
// Modify API to exclude photos by default
export async function GET(req: Request) {
  const includePhotos = searchParams.get('includePhotos') === 'true'
  
  const query = {
    instituteId,
    role: 'student'
  }
  
  const projection = includePhotos 
    ? {} // Include all fields
    : { 'documents.photo': 0 } // Exclude photo
  
  const students = await User.find(query)
    .select(projection)
    .lean()
  
  return NextResponse.json(students)
}

// Load photos only when viewing student details
```

**Benefits:**
- ✅ 10x faster list loading
- ✅ Reduces bandwidth
- ✅ Better performance

---

### **3. Optional Photos** ⭐

**Make photos optional for some students:**

```typescript
// Only require photos for:
- Students needing admit cards
- Certificate generation
- ID card printing

// Don't require for:
- Casual enrollments
- Demo accounts
- Test accounts
```

---

### **4. External Storage (Future)** ⭐⭐⭐

**When you outgrow MongoDB:**

```
Option A: Vercel Blob Storage
- First 1GB free
- $0.15/GB after
- Direct upload from client
- CDN included

Option B: AWS S3
- First 5GB free (12 months)
- $0.023/GB after
- Industry standard

Option C: Cloudinary
- 25GB free
- Image transformations
- Automatic optimization

Migration Strategy:
1. Keep existing photos in MongoDB
2. New uploads go to external storage
3. Gradually migrate old photos
```

---

## 📊 **Monitoring Storage Usage**

### **Check Current Usage:**

```javascript
// MongoDB Shell or Compass
db.stats()
// Look for: dataSize, storageSize

// Or via Node.js API
const stats = await mongoose.connection.db.stats()
console.log('Data Size:', stats.dataSize / 1024 / 1024, 'MB')
console.log('Storage Size:', stats.storageSize / 1024 / 1024, 'MB')
console.log('Usage:', (stats.dataSize / (512 * 1024 * 1024) * 100).toFixed(2), '%')
```

### **Per-Collection Analysis:**

```javascript
// Check student collection size
db.users.stats()

// Count students with photos
db.users.countDocuments({ 
  role: 'student', 
  'documents.photo': { $exists: true, $ne: '' } 
})

// Average photo size
db.users.aggregate([
  { $match: { role: 'student', 'documents.photo': { $exists: true } }},
  { $project: { photoSize: { $strLenBytes: '$documents.photo' }}},
  { $group: { _id: null, avgSize: { $avg: '$photoSize' }}}
])
```

---

## 🎯 **Recommended Strategy**

### **Phase 1: Start with MongoDB (0-2,000 students)**

```
✅ Store photos as base64 in MongoDB
✅ Implement client-side compression (50-80 KB)
✅ Use lazy loading for lists
✅ Monitor usage monthly

Cost: $0/month
Capacity: ~4,000 students with compressed photos
```

### **Phase 2: Optimize (2,000-5,000 students)**

```
✅ Upgrade to MongoDB Atlas M2 ($9/month) → 2GB storage
✅ Continue compression strategy
✅ ~30,000 students capacity

Cost: $9/month
Capacity: 30,000+ students
```

### **Phase 3: Hybrid (5,000+ students)**

```
✅ Keep MongoDB Atlas M2/M5
✅ Move photos to Vercel Blob or S3
✅ Unlimited student capacity

Cost: $9-25/month (MongoDB) + $0-5/month (storage)
Capacity: Unlimited
```

---

## 📝 **Implementation Checklist**

### **Immediate Actions:**

- [ ] Add image compression to upload component
- [ ] Set max photo size to 80 KB (60 KB after compression)
- [ ] Add photo size validation before save
- [ ] Implement lazy loading for student lists
- [ ] Monitor storage usage in Atlas dashboard

### **Code Changes:**

```typescript
// 1. Add to your upload handler:
const MAX_PHOTO_SIZE_KB = 80

if (base64Photo.length / 1024 > MAX_PHOTO_SIZE_KB) {
  return NextResponse.json({
    error: `Photo too large. Maximum ${MAX_PHOTO_SIZE_KB}KB allowed.`
  }, { status: 400 })
}

// 2. Add compression utility:
// (Use the compressImage function from above)

// 3. Update student list API:
const students = await User.find(query)
  .select('-documents.photo') // Exclude photos from list
  .lean()
```

---

## 💰 **Cost Comparison**

### **MongoDB Storage:**

| Tier | Storage | Students w/ Photos | Cost/Month |
|------|---------|-------------------|------------|
| M0 (Free) | 512 MB | ~4,000 | $0 |
| M2 | 2 GB | ~16,000 | $9 |
| M5 | 5 GB | ~40,000 | $25 |
| M10 | 10 GB | ~80,000 | $60 |

### **External Storage (for comparison):**

| Service | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| Vercel Blob | 1 GB | $0.15/GB |
| AWS S3 | 5 GB (1st year) | $0.023/GB |
| Cloudinary | 25 GB | Free tier enough! |

---

## ✅ **Final Recommendations**

### **For Your Use Case:**

1. **Now (0-2,000 students):**
   ```
   ✅ MongoDB M0 (Free)
   ✅ Compress photos to 50-80 KB
   ✅ Stores ~4,000 students
   ✅ Zero cost
   ```

2. **Growth (2,000-10,000 students):**
   ```
   ✅ MongoDB M2 ($9/month)
   ✅ 2 GB storage
   ✅ Stores ~16,000 students
   ✅ Still using MongoDB for photos
   ```

3. **Scale (10,000+ students):**
   ```
   ✅ MongoDB M5 ($25/month)
   ✅ Move photos to Cloudinary (free 25GB)
   ✅ Unlimited capacity
   ✅ Total cost: $25/month
   ```

---

## 🔢 **Quick Reference Table**

| Photo Size (original) | Photo Size (base64) | Students per 512 MB | Students per 350 MB (realistic) |
|----------------------|---------------------|---------------------|---------------------------------|
| 250 KB | 333 KB | 1,537 | 1,051 |
| 150 KB | 200 KB | 2,560 | 1,750 |
| **100 KB** | **133 KB** | **3,912** | **2,600** |
| **50 KB** | **66 KB** | **7,824** | **5,200** ⭐ |
| 30 KB | 40 KB | 13,107 | 8,750 |

**Recommended:** 50-80 KB compressed photos = **4,000-5,000 students** on free tier!

---

## 🎬 **Bottom Line**

**Current Setup:** Base64 photos in MongoDB  
**Free Tier Capacity:** ~4,000 students (with 50 KB photos)  
**Action Required:** Add client-side compression  
**Cost:** $0 until you hit ~4,000 students  
**Then:** Upgrade to M2 for $9/month (16,000 students)

**You're good for years!** 🎉

---

## 📞 **Monitoring Alert**

Set up alerts when you reach:
- [ ] 80% storage (410 MB) → ~3,200 students
- [ ] 90% storage (460 MB) → ~3,600 students
- [ ] 95% storage (486 MB) → ~3,800 students

This gives you time to:
1. Upgrade to M2, or
2. Implement external storage, or
3. Further compress images
