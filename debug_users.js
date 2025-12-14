const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function debugUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-automation');

    console.log('Checking users in database...');

    // Find all users
    const users = await User.find({}).select('name email role isActive');

    console.log(`Found ${users.length} users:`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - ${user.email} - Role: ${user.role} - Active: ${user.isActive}`);
    });

    // Find staff/admin users specifically
    const staffUsers = await User.find({
      role: { $in: ['admin', 'employee'] },
      isActive: true
    }).select('_id name email role');

    console.log(`\nFound ${staffUsers.length} active staff/admin users:`);

    staffUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ID: ${user._id}`);
    });

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

debugUsers();