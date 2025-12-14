const mongoose = require('mongoose');
const Notification = require('./backend/models/Notification');

async function checkNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-automation');

    console.log('Checking for new message notifications...');

    // Find all recent notifications
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email role');

    console.log(`Found ${notifications.length} new message notifications:`);

    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. User: ${notif.user?.name} (${notif.user?.role})`);
      console.log(`   Title: ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Read: ${notif.isRead}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log(`   Metadata:`, JSON.stringify(notif.metadata, null, 2));
      console.log('---');
    });

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  }
}

checkNotifications();