# Peace LMS - Peacexperts Academy

A robust Learning Management System built with Next.js, MongoDB, and Razorpay.

## Deployment Guide

### 1. Environment Variables
Copy `.env.example` to `.env.local` (for local dev) or set them in your deployment platform (Vercel, Railway, etc.):

- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A secure random string for authentication.
- `RAZORPAY_KEY_ID`: Your Razorpay Live/Test Key ID.
- `RAZORPAY_KEY_SECRET`: Your Razorpay Live/Test Key Secret.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Same as `RAZORPAY_KEY_ID` (required for client-side).

### 2. Build & Start
```bash
npm install
npm run build
npm start
```

### 3. Production Readiness
- Ensured all sensitive keys are handled via environment variables.
- Implemented single-session enforcement for security.
- Standardized document generation (ID Cards, Admit Cards, Certificates).
- Configured Razorpay with live-ready verification logic.

## Technology Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Mongoose (MongoDB)
- **Payments**: Razorpay Node SDK & Checkout JS
- **Auth**: Custom JWT-based Authentication
