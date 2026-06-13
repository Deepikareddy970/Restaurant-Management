const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/epitome';
    console.log(`[Database] Connecting to: ${connString}`);
    
    await mongoose.connect(connString);
    
    console.log(`[Database] MongoDB Connected successfully.`);
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
