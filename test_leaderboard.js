/**
 * Backend Test Script: Team Performance / Leaderboard
 * --------------------------------------------------
 * This file is ONLY for backend testing.
 * Do NOT use this in frontend code.
 */

const axios = require('axios');
require('dotenv').config();

// =======================
// Configuration
// =======================
const API_BASE_URL =
  process.env.API_BASE_URL || 'http://localhost:5000';

// =======================
// Test Function
// =======================
async function testLeaderboard() {
  try {
    console.log('🚀 Testing leaderboard functionality...\n');
    console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);

    // Test leaderboard endpoint
    console.log('1️⃣ Calling GET /api/team-performance');
    const response = await axios.get(
      `${API_BASE_URL}/api/team-performance`
    );

    console.log('✅ Leaderboard API responded successfully');
    console.log(
      '📊 Leaderboard data:\n',
      JSON.stringify(response.data, null, 2)
    );
  } catch (error) {
    console.error('❌ Leaderboard test failed');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);

      if (error.response.status === 401) {
        console.log(
          '⚠️ Note: API requires authentication. This is expected behavior.'
        );
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

// =======================
// Run Test
// =======================
testLeaderboard();
