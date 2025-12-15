/**
 * Backend Test Script: Invite Collaborators Flow
 * ----------------------------------------------
 * This file is ONLY for backend testing.
 * Do NOT import or use this file in frontend code.
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// =======================
// Configuration
// =======================
const API_BASE_URL =
  process.env.API_BASE_URL || 'http://localhost:5001';

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/business-automation';

// =======================
// Test Function
// =======================
async function testInviteFlow() {
  try {
    console.log('🚀 Testing Invite Collaborators Flow...\n');
    console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);

    // -----------------------
    // Test 1: GET collaborators (auth required)
    // -----------------------
    console.log('1️⃣ Testing GET /api/invite-collaborators (auth required)');
    try {
      await axios.get(`${API_BASE_URL}/api/invite-collaborators`);
      console.log('❌ ERROR: Request should have required authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ PASS: Authentication required');
      } else {
        console.log(
          '❌ FAIL:',
          error.response?.status || error.message
        );
      }
    }

    // -----------------------
    // Test 2: POST invite collaborator (auth required)
    // -----------------------
    console.log('\n2️⃣ Testing POST /api/invite-collaborator (auth required)');
    try {
      await axios.post(`${API_BASE_URL}/api/invite-collaborator`, {
        email: 'test@example.com',
      });
      console.log('❌ ERROR: Request should have required authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ PASS: Authentication required');
      } else {
        console.log(
          '❌ FAIL:',
          error.response?.status || error.message
        );
      }
    }

    // -----------------------
    // Test 3: Database Model Check
    // -----------------------
    console.log('\n3️⃣ Testing CollaboratorInvite model');
    await mongoose.connect(MONGO_URI);

    const CollaboratorInvite = require('../models/CollaboratorInvite');
    const count = await CollaboratorInvite.countDocuments();

    console.log(`✅ PASS: Found ${count} invite(s) in database`);

    await mongoose.disconnect();

    console.log('\n🎉 Invite flow tests completed successfully!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// =======================
// Run Tests
// =======================
testInviteFlow();
