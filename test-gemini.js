const axios = require('axios');

async function testGeminiAPI() {
  try {
    // Check if API key is available
    const apiKey = process.env.EXPO_PUBLIC_GEMINI;
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      console.log('No API key found in environment variables.');
      return;
    }
    
    // Test prompt
    const prompt = 'Hey, how are you?';
    console.log('Testing Gemini API with prompt:', prompt);
    
    // Make API call
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }
    );
    
    // Log response
    console.log('Gemini API Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Error testing Gemini API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGeminiAPI();
