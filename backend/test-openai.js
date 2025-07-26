require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  console.log('🧪 OpenAI API 간단 테스트...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('API 키:', apiKey ? `${apiKey.substring(0, 20)}...` : '없음');
  
  if (!apiKey) {
    console.log('❌ API 키가 없습니다.');
    return;
  }
  
  try {
    console.log('📡 API 호출 중...');
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: '안녕하세요!' }
      ],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API 호출 성공!');
    console.log('응답:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ API 호출 실패');
    console.log('상태 코드:', error.response?.status);
    console.log('에러 메시지:', error.response?.data?.error?.message);
    console.log('에러 타입:', error.response?.data?.error?.type);
    console.log('에러 코드:', error.response?.data?.error?.code);
    
    if (error.response?.status === 429) {
      console.log('\n💡 해결 방법:');
      console.log('1. https://platform.openai.com/usage 에서 크레딧 확인');
      console.log('2. https://platform.openai.com/account/billing 에서 결제 정보 추가');
      console.log('3. 새 계정이라면 전화번호 인증 필요할 수 있음');
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 API 키 문제:');
      console.log('1. API 키가 올바른지 확인');
      console.log('2. https://platform.openai.com/api-keys 에서 새 키 발급');
    }
  }
}

testOpenAI();