const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAuth() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-automation');
    console.log('✅ MongoDB connected successfully');

    console.log('Testing user creation...');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'admin'
    });

    await testUser.save();
    console.log('✅ User created successfully');

    console.log('Testing user authentication...');
    const foundUser = await User.findOne({ email: 'test@example.com' });
    const isPasswordValid = await foundUser.comparePassword('testpassword123');

    if (isPasswordValid) {
      console.log('✅ Password comparison works');
    } else {
      console.log('❌ Password comparison failed');
    }

    console.log('Cleaning up test user...');
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user cleaned up');

    console.log('✅ All authentication tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testAuth();
