const mongoose = require('mongoose');
const CollaboratorInvite = require('./backend/models/CollaboratorInvite');

async function checkInvites() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-automation');

    console.log('Checking existing invites in database...');

    // Find all invites
    const invites = await CollaboratorInvite.find({})
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${invites.length} invites:`);

    invites.forEach((invite, index) => {
      console.log(`${index + 1}. Email: ${invite.email}`);
      console.log(`   Status: ${invite.status}`);
      console.log(`   Invited by: ${invite.invitedBy?.name || 'Unknown'} (${invite.invitedBy?.email || 'Unknown'})`);
      console.log(`   Created: ${invite.createdAt}`);
      console.log(`   Expires: ${invite.expiresAt}`);
      console.log(`   Token: ${invite.token.substring(0, 10)}...`);
      console.log('---');
    });

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error checking invites:', error);
  }
}

checkInvites();