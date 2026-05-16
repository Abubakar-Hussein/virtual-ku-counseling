import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Cached connection for serverless environments
let cached = (global as any).__mongoose_cache;

if (!cached) {
  cached = (global as any).__mongoose_cache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,   // increased from 5 — prevents queuing on concurrent dashboard loads
      minPoolSize: 2,    // keep 2 warm connections so cold starts are faster
      socketTimeoutMS: 20000,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MONGODB] Connected');
      return mongoose;
    }).catch((err) => {
      cached.promise = null; // Allow retry on next request
      console.error('[MONGODB] Connection error:', err.message);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
