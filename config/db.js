// ============================================================================
// CONFIG/DB.JS - MONGODB DATABASE CONNECTION
// ============================================================================
// This file connects our Express server to the local MongoDB database using
// Mongoose (an Object Data Modeling library for Node.js).
// ============================================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 1. Read MongoDB connection URI from .env file (or fall back to local default)
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/web_ass_2';

    // 2. Connect to MongoDB using Mongoose
    const conn = await mongoose.connect(uri);

    console.log(`✓ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // 3. Listen for connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB runtime error: ${err.message}`);
    });

    // 4. Listen if connection drops
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Reconnecting...');
    });

    // 5. Graceful shutdown: Close MongoDB connection if user stops server with CTRL+C
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination.');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`✕ MongoDB Connection Failed: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;
