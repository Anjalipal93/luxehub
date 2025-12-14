const axios = require('axios');

async function testServer() {
  try {
    console.log('Testing server endpoints...');

    // Test a public endpoint first
    try {
      const response = await axios.get('http://localhost:5000/api/communication/email-status');
      console.log('✅ Server is running and responding');
    } catch (error) {
      console.log('⚠️ Server may not be running or endpoint requires auth');
    }

    // Test leaderboard endpoint (will fail due to auth, but should get 401)
    try {
      const response = await axios.get('http://localhost:5000/api/team-performance');
      console.log('✅ Leaderboard endpoint exists and responded');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Leaderboard endpoint exists (401 auth required - expected)');
      } else {
        console.log('❌ Leaderboard endpoint error:', error.response?.status, error.response?.statusText);
      }
    }

  } catch (error) {
    console.error('❌ Server test failed:', error.message);
  }
}

testServer();