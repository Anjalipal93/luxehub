const axios = require('axios');

async function testLeaderboard() {
  try {
    console.log('Testing leaderboard functionality...');

    // Test leaderboard endpoint (this will require authentication in real use)
    const response = await axios.get('http://localhost:5000/api/team-performance');

    console.log('✅ Leaderboard API responded successfully');
    console.log('Leaderboard data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Leaderboard test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('Note: API requires authentication. This is expected.');
    }
  }
}

testLeaderboard();