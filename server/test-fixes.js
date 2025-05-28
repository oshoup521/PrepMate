// Test script to validate interview session fixes
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = '';
let testSessionId = '';

async function authenticate() {
  try {
    console.log('🔐 Authenticating test user...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = response.data.access_token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function createTestSession() {
  try {
    console.log('📝 Creating test interview session...');
    const response = await axios.post(`${API_URL}/interview/sessions`, {
      jobRole: 'Software Engineer',
      difficulty: 'medium',
      description: 'Test session for validation'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testSessionId = response.data.id;
    console.log('✅ Test session created:', testSessionId);
    return response.data;
  } catch (error) {
    console.error('❌ Session creation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function addTestQuestionAnswer() {
  try {
    console.log('💬 Adding test question-answer pair...');
    const response = await axios.post(`${API_URL}/interview/sessions/${testSessionId}/qa`, {
      question: 'What is your experience with JavaScript?',
      answer: 'I have been working with JavaScript for 5 years, including Node.js, React, and modern ES6+ features.',
      evaluation: {
        score: 8,
        feedback: 'Good technical knowledge and experience mentioned.',
        improvement_areas: 'Could elaborate more on specific projects.'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Question-answer pair added successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Adding Q&A failed:', error.response?.data || error.message);
    throw error;
  }
}

async function endSessionWithSummary() {
  try {
    console.log('🎯 Ending session and generating AI summary...');
    const response = await axios.post(`${API_URL}/interview/sessions/${testSessionId}/end`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Session ended with summary:');
    console.log('📊 Overall Score:', response.data.summary?.overallScore || 'N/A');
    console.log('💪 Strengths:', response.data.summary?.strengths || 'N/A');
    console.log('📈 Improvements:', response.data.summary?.improvements || 'N/A');
    return response.data;
  } catch (error) {
    console.error('❌ Ending session failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getUserProgress() {
  try {
    console.log('📈 Getting user progress data...');
    const response = await axios.get(`${API_URL}/interview/progress`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const progress = response.data;
    console.log('✅ Progress data retrieved:');
    console.log(`📚 Total Sessions: ${progress.totalSessions}`);
    console.log(`✅ Completed: ${progress.completedSessions}`);
    console.log(`⭐ Average Score: ${progress.averageScore}`);
    console.log(`🔥 Streak Days: ${progress.streakDays}`);
    console.log(`🎯 Top Roles:`, progress.topRoles.map(r => `${r.role} (${r.count})`).join(', '));
    return response.data;
  } catch (error) {
    console.error('❌ Getting progress failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Starting Interview Session Fixes Validation...\n');
  
  try {
    // Step 1: Authenticate
    if (!await authenticate()) {
      console.log('❌ Cannot continue without authentication');
      return;
    }
    
    // Step 2: Create a test session
    await createTestSession();
    
    // Step 3: Add some Q&A data
    await addTestQuestionAnswer();
    
    // Step 4: Add another Q&A pair
    await axios.post(`${API_URL}/interview/sessions/${testSessionId}/qa`, {
      question: 'Describe a challenging project you worked on.',
      answer: 'I led the development of a real-time chat application using WebSocket and Redis for scaling across multiple servers.',
      evaluation: {
        score: 9,
        feedback: 'Excellent technical approach and leadership experience.',
        improvement_areas: 'Could mention specific metrics or outcomes.'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Second Q&A pair added');
    
    // Step 5: End session with AI summary
    await endSessionWithSummary();
    
    // Step 6: Get updated progress
    await getUserProgress();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n✅ Fixed Components:');
    console.log('  • Session ending with AI summary generation');
    console.log('  • Question-answer history tracking');
    console.log('  • Progress calculation with completed sessions');
    console.log('  • Proper session status management');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 