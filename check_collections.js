const mongoose = require('mongoose');

async function checkCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-automation');

    console.log('Checking database collections...');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('Collections:');
    collections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name}`);
    });

    // Check if customermessages collection exists
    const customerMessagesCollection = collections.find(col => col.name === 'customermessages');
    if (customerMessagesCollection) {
      console.log('\nChecking customermessages collection:');
      const count = await mongoose.connection.db.collection('customermessages').countDocuments();
      console.log(`Documents in customermessages: ${count}`);
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error checking collections:', error);
  }
}

checkCollections();