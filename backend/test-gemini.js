require('dotenv').config();
const axios = require('axios');

async function testGemini() {
  console.log('🧪 Gemini API 간단 테스트...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API 키:', apiKey ? `${apiKey.substring(0, 20)}...` : '없음');
  
  if (!apiKey) {
    console.log('❌ API 키가 없습니다.');
    return;
  }
  
  try {
    console.log('📡 API 호출 중...');
    
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      contents: [{
        parts: [{
          text: '안녕하세요! 간단한 인사말로 답변해주세요.'
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API 호출 성공!');
    console.log('응답:', response.data.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.log('❌ API 호출 실패');
    console.log('상태 코드:', error.response?.status);
    console.log('에러 메시지:', error.response?.data);
    console.log('전체 에러:', error.message);
  }
}

testGemini();