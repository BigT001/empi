import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
  conn: null,
  promise: null,
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let globalWithMongo = global as typeof globalThis & {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!globalWithMongo.mongoose) {
  globalWithMongo.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB(): Promise<typeof mongoose> {
  if (globalWithMongo.mongoose.conn) {
    console.log('[MongoDB] ✅ Using cached connection');
    return globalWithMongo.mongoose.conn;
  }

  if (!globalWithMongo.mongoose.promise) {
    console.log('[MongoDB] Attempting new connection...');
    
    const opts = {
      bufferCommands: false, // Prevent buffering during connection issues
      serverSelectionTimeoutMS: 10000, // 10 seconds for server selection
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      connectTimeoutMS: 10000, // 10 seconds for connection
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      w: 'majority' as const,
      maxIdleTimeMS: 30000,
      family: 4, // Use IPv4
    };

    globalWithMongo.mongoose.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('[MongoDB] ✅ Connected successfully');
        return mongoose;
      })
      .catch((err) => {
        globalWithMongo.mongoose.promise = null;
        console.error('[MongoDB] ❌ Connection error:', err.message);
        throw err;
      });
  }

  try {
    globalWithMongo.mongoose.conn = await globalWithMongo.mongoose.promise;
  } catch (e) {
    globalWithMongo.mongoose.promise = null;
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error('[MongoDB] ❌ Failed to establish connection:', errorMsg);
    throw e;
  }

  return globalWithMongo.mongoose.conn;
}

export default connectDB;
