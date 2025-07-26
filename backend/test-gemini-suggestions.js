require('dotenv').config();
const axios = require('axios');

async function testGeminiSuggestions() {
  console.log('🧪 Gemini 답변 추천 테스트...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  const prompt = `채팅 대화에서 마지막 메시지에 대한 자연스러운 답변 3개를 추천해주세요.

새 메시지: "오늘 정말 힘든 하루였어요... 상사가 계속 화내서 스트레스 받았어요 😔"

답변 조건:
- 감정을 고려한 적절한 반응
- 대화를 이어갈 수 있는 내용  
- 한국어, 30자 이내
- JSON 형태로만 응답: {"suggestions": ["답변1", "답변2", "답변3"]}`;

  try {
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API 호출 성공!');
    const content = response.data.candidates[0].content.parts[0].text;
    console.log('응답 내용:', content);
    
    try {
      const parsed = JSON.parse(content);
      console.log('✅ JSON 파싱 성공:', parsed.suggestions);
    } catch (parseError) {
      console.log('❌ JSON 파싱 실패:', parseError.message);
      console.log('원본 응답:', content);
    }
    
  } catch (error) {
    console.log('❌ API 호출 실패');
    console.log('에러:', error.response?.data || error.message);
  }
}

testGeminiSuggestions();