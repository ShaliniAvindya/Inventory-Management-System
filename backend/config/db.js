const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory';

    if (!process.env.MONGO_URI) {
      console.warn('Warning: MONGO_URI is not set. Falling back to local MongoDB:', uri);
      console.warn('If you intended to connect to a remote DB, create a backend/.env with MONGO_URI.');
    }

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected:: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB:: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
