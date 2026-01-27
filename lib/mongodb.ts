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
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m
    }).catch((error: any) => {
      cached.promise = null
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
