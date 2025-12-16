/**
 * Backend Test Script: Invite Collaborator WITH Authentication
 * -----------------------------------------------------------
 * This file is ONLY for backend testing.
 * DO NOT import or use this file in frontend code.
 */

const axios = require('axios');
require('dotenv').config();

// =======================
// Configuration
// =======================
const API_BASE_URL =
  process.env.API_BASE_URL || 'https://luxehub-7.onrender.com';

// Test credentials (update if needed)
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

// =======================
// Test Function
// =======================
async function testInviteWithAuth() {
  try {
    console.log('🚀 Testing Invite Collaborators WITH Authentication\n');
    console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);

    // -----------------------
    // Step 1: Login
    // -----------------------
    console.log('1️⃣ Attempting admin login...');
    let token;

    try {
      const loginResponse = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          email: TEST_ADMIN_EMAIL,
          password: TEST_ADMIN_PASSWORD,
        }
      );

      token = loginResponse.data.token;

      if (!token) {
        console.log('❌ Login succeeded but no token returned');
        return;
      }

      console.log('✅ Login successful, token received');
    } catch (loginError) {
      console.log('❌ Login failed');
      console.log('Status:', loginError.response?.status);
      console.log('Message:', loginError.response?.data || loginError.message);
      console.log(
        '⚠️ Check TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in your .env'
      );
      return;
    }

    // -----------------------
    // Step 2: Auth Header
    // -----------------------
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    // -----------------------
    // Step 3: Send Invite
    // -----------------------
    console.log('\n2️⃣ Sending collaborator invite...');
    try {
      const inviteResponse = await axios.post(
        `${API_BASE_URL}/api/invite-collaborator`,
        { email: 'test@example.com' },
        config
      );

      console.log('✅ Invite API response:', inviteResponse.data);

      if (inviteResponse.data.emailSent) {
        console.log('📧 Email sent successfully!');
      } else if (inviteResponse.data.emailError) {
        console.log('⚠️ Email NOT sent:', inviteResponse.data.emailError);
      } else {
        console.log('ℹ️ Invite created, email status unknown');
      }
    } catch (inviteError) {
      console.log('❌ Invite request failed');
      console.log('Status:', inviteError.response?.status);
      console.log(
        'Message:',
        inviteError.response?.data || inviteError.message
      );
    }

    console.log('\n🎉 Authenticated invite test completed!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

// =======================
// Run Test
// =======================
testInviteWithAuth();
