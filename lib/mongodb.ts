import mongoose from 'mongoose'
import { getEnv } from './env'

const MONGODB_URI = getEnv('MONGODB_URI')

declare global {
  var mongoose: any
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  // Reuse the cached connection ONLY if it is actually alive (readyState 1).
  // Previously we returned cached.conn unconditionally — after the pool closed
  // an idle socket, that stale/dead connection made every query hang on server
  // reselection until Vercel's 10s function limit fired a 504.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // Connection is gone/broken — drop it so we establish a fresh one.
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null
    cached.promise = null
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Fail server-selection BEFORE the 10s function limit so the route can
      // return its own error instead of a raw Vercel 504.
      serverSelectionTimeoutMS: 8000,
      // Allow concurrency; don't force-hold or tear down idle sockets in a
      // serverless pool. Removing maxIdleTimeMS/socketTimeoutMS keeps the
      // connection warm across invocations (the core fix).
      maxPoolSize: 10,
      minPoolSize: 0,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((m) => {
        console.log('MongoDB connected')
        return m
      })
      .catch((error: any) => {
        console.error('MongoDB connection failed:', error?.message)
        cached.promise = null
        throw new Error(`DB connection failed: ${error?.message}`)
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e: any) {
    cached.promise = null
    throw new Error(`DB error: ${e?.message}`)
  }

  return cached.conn
}

export default connectDB
