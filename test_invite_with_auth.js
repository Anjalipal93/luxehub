const axios = require('axios');

// Test with authentication
async function testInviteWithAuth() {
  try {
    console.log('Testing invite collaborators with authentication...\n');

    // First, try to login to get a token
    console.log('1. Attempting login...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@example.com',
        password: 'admin123'
      });

      const token = loginResponse.data.token;
      console.log('✅ Login successful, got token');

      // Set up headers for authenticated requests
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Try to send an invite
      console.log('\n2. Sending collaborator invite...');
      const inviteResponse = await axios.post('http://localhost:5000/api/invite-collaborator',
        { email: 'test@example.com' },
        config
      );

      console.log('✅ Invite response:', inviteResponse.data);

      // Check if email was sent
      if (inviteResponse.data.emailSent) {
        console.log('✅ Email was sent successfully!');
      } else {
        console.log('⚠️ Email was not sent:', inviteResponse.data.emailError);
      }

    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data || loginError.message);
      console.log('Status:', loginError.response?.status);
      console.log('Note: You may need to update the email/password in the test script');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInviteWithAuth();