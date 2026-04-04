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
    };

    console.log('[MONGODB] Attempting to connect...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MONGODB] Connected successfully');
      return mongoose;
    }).catch((err) => {
      console.error('[MONGODB] Connection error:', err.message);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
