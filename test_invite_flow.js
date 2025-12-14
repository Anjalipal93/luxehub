const axios = require('axios');

async function testInviteFlow() {
  try {
    console.log('Testing invite collaborators flow...\n');

    // Test 1: Try to get collaborators (should require auth)
    console.log('1. Testing GET /api/invite-collaborators (should require auth)...');
    try {
      await axios.get('http://localhost:5000/api/invite-collaborators');
      console.log('❌ Should have required authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Test 2: Try to send invite (should require auth)
    console.log('\n2. Testing POST /api/invite-collaborator (should require auth)...');
    try {
      await axios.post('http://localhost:5000/api/invite-collaborator', {
        email: 'test@example.com'
      });
      console.log('❌ Should have required authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Test 3: Check if CollaboratorInvite model exists
    console.log('\n3. Testing database model...');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-automation');

    const CollaboratorInvite = require('./backend/models/CollaboratorInvite');
    const count = await CollaboratorInvite.countDocuments();
    console.log(`✅ Found ${count} existing invites in database`);

    await mongoose.disconnect();

    console.log('\n🎉 Invite flow tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInviteFlow();