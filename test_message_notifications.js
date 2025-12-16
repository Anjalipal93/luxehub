/**
 * Backend Test Script: Customer Message Notifications
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
async function testMessageNotifications() {
  try {
    console.log('🚀 Testing customer message notification system...\n');
    console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);

    // -----------------------
    // Test: Receive customer message
    // -----------------------
    console.log('1️⃣ Sending test customer message...');

    const testMessage = {
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1234567890',
      },
      subject: 'Test Message',
      content: 'This is a test message from a customer',
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/customer-messages/receive`,
      testMessage
    );

    console.log('✅ Message received successfully');
    console.log('Response:', response.data);

    // -----------------------
    // Notification note
    // -----------------------
    console.log(
      '\nℹ️ Note: Notification creation depends on backend logic and admin authentication.'
    );
    console.log(
      'ℹ️ To fully test notifications, authenticate and call /api/notifications.'
    );

    console.log('\n🎉 Customer message notification test completed!');
  } catch (error) {
    console.error('\n❌ Test failed');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// =======================
// Run Test
// =======================
testMessageNotifications();
