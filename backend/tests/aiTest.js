require('dotenv').config();
const aiService = require('../services/aiService');

// 테스트 메시지들
const testMessages = [
  { id: '1', message: '안녕하세요!', sender: '상대방', timestamp: new Date() },
  { id: '2', message: '반가워요! 오늘 어떻게 지내세요?', sender: '나', timestamp: new Date() },
  { id: '3', message: '오늘 회사에서 프레젠테이션이 있어서 너무 긴장돼요 😰', sender: '상대방', timestamp: new Date() }
];

const newMessage = {
  id: '4',
  message: '오늘 정말 힘든 하루였어요... 상사가 계속 화내서 스트레스 받았어요 😔',
  sender: '상대방',
  timestamp: new Date(),
  roomId: 'test-room'
};

async function testAIService() {
  console.log('🤖 AI 서비스 테스트 시작...\n');
  
  try {
    // 1. 전체 대화 분석 테스트
    console.log('📊 전체 대화 분석 테스트:');
    console.log('새 메시지:', newMessage.message);
    console.log('분석 중...\n');
    
    const startTime = Date.now();
    const analysis = await aiService.analyzeConversation(testMessages, newMessage);
    const endTime = Date.now();
    
    console.log('✅ 분석 완료 (소요시간:', endTime - startTime, 'ms)');
    console.log('결과:', JSON.stringify(analysis, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 답변 추천 테스트
    console.log('💬 답변 추천 테스트:');
    const suggestions = await aiService.generateSuggestions(testMessages, newMessage);
    console.log('추천 답변들:');
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. 감정 분석 테스트
    console.log('😊 감정 분석 테스트:');
    const sentiment = await aiService.analyzeSentiment(newMessage.message);
    console.log('감정 분석 결과:', sentiment);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. 관심도 계산 테스트
    console.log('📈 관심도 계산 테스트:');
    const interest = await aiService.calculateInterestLevel(newMessage.message, testMessages);
    console.log('관심도 분석:', interest);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 5. 주제 추출 테스트
    console.log('🏷️ 주제 추출 테스트:');
    const topics = await aiService.extractTopics(newMessage.message);
    console.log('추출된 주제들:', topics);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 6. 다양한 메시지 테스트
    console.log('🔄 다양한 메시지 타입 테스트:');
    
    const testCases = [
      '오늘 너무 행복해요! 승진했어요 🎉',
      '뭐 하고 계세요?',
      '오늘 날씨 정말 좋네요',
      '미안해요... 늦었어요 😅',
      '내일 시간 있으세요?'
    ];
    
    for (const testMsg of testCases) {
      console.log(`\n메시지: "${testMsg}"`);
      const quickSuggestions = await aiService.generateSuggestions([], {
        id: Date.now().toString(),
        message: testMsg,
        sender: '상대방'
      });
      console.log('추천:', quickSuggestions.slice(0, 2).join(', '));
    }
    
    console.log('\n✅ 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    
    if (error.response) {
      console.error('API 응답 오류:', error.response.data);
    }
    
    if (error.message.includes('API key')) {
      console.log('\n💡 해결방법:');
      console.log('1. .env 파일에서 OPENAI_API_KEY 확인');
      console.log('2. API 키가 올바른지 확인');
      console.log('3. OpenAI 계정에 충분한 크레딧이 있는지 확인');
    }
  }
}

// 테스트 실행
if (require.main === module) {
  testAIService();
}

module.exports = { testAIService };