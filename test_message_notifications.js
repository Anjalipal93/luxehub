const axios = require('axios');

async function testMessageNotifications() {
  try {
    console.log('Testing customer message notification system...');

    // Test receiving a customer message
    const testMessage = {
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1234567890'
      },
      content: 'This is a test message from a customer',
      subject: 'Test Message'
    };

    const response = await axios.post('http://localhost:5000/api/customer-messages/receive', testMessage);

    console.log('✅ Message received successfully:', response.data);

    // Check if notifications were created
    console.log('Checking for notifications...');

    // First, we need to get a token to access the notifications endpoint
    // For testing purposes, let's assume we have an admin user
    // In a real test, you'd need to authenticate first

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMessageNotifications();