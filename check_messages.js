const mongoose = require('mongoose');
const CustomerMessage = require('./backend/models/CustomerMessage');

async function checkMessages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-automation');

    console.log('Checking customer messages in database...');

    // Find recent messages
    const messages = await CustomerMessage.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`Found ${messages.length} customer messages:`);

    messages.forEach((msg, index) => {
      console.log(`${index + 1}. From: ${msg.customer.name} (${msg.direction})`);
      console.log(`   Content: ${msg.content}`);
      console.log(`   Thread: ${msg.threadId}`);
      console.log(`   Created: ${msg.createdAt}`);
      console.log('---');
    });

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error checking messages:', error);
  }
}

checkMessages();