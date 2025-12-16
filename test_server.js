/**
 * Backend Test Script: Server Health & Endpoint Check
 * --------------------------------------------------
 * This file is ONLY for backend testing.
 * Do NOT import or use this file in frontend code.
 */

const axios = require('axios');
require('dotenv').config();

// =======================
// Configuration
// =======================
const API_BASE_URL =
  process.env.API_BASE_URL || 'https://luxehub-7.onrender.com';

// =======================
// Test Function
// =======================
async function testServer() {
  try {
    console.log('🚀 Testing server endpoints...\n');
    console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);

    // -----------------------
    // Test 1: Public endpoint
    // -----------------------
    console.log('1️⃣ Testing public email status endpoint...');
    try {
      await axios.get(
        `${API_BASE_URL}/api/communication/email-status`
      );
      console.log('✅ Server is running and responding');
    } catch (error) {
      console.log(
        '⚠️ Server may not be running or endpoint requires authentication'
      );
    }

    // -----------------------
    // Test 2: Leaderboard endpoint (auth expected)
    // -----------------------
    console.log('\n2️⃣ Testing leaderboard endpoint...');
    try {
      await axios.get(
        `${API_BASE_URL}/api/team-performance`
      );
      console.log('✅ Leaderboard endpoint responded');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(
          '✅ Leaderboard endpoint exists (401 auth required – expected)'
        );
      } else {
        console.log(
          '❌ Leaderboard endpoint error:',
          error.response?.status,
          error.response?.statusText
        );
      }
    }

    console.log('\n🎉 Server endpoint tests completed!');
  } catch (error) {
    console.error('\n❌ Server test failed:', error.message);
  }
}

// =======================
// Run Test
// =======================
testServer();
