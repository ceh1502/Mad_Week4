const axios = require('axios');
const { analyzeEmotion, extractTopics, calculateInterestLevel } = require('../utils/helpers');

class AIService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!this.geminiApiKey) {
      console.log('🤖 Gemini API 키가 없어서 로컬 분석을 사용합니다.');
    }
  }

  // 메인 대화 분석 함수
  async analyzeConversation(messages, newMessage, options = {}) {
    try {
      const analysis = {
        timestamp: new Date(),
        messageId: newMessage.id,
        roomId: newMessage.roomId
      };

      // 병렬로 여러 분석 실행
      const [
        suggestions,
        sentiment,
        interestLevel,
        topics,
        conversationFlow
      ] = await Promise.all([
        this.generateSuggestions(messages, newMessage),
        this.analyzeSentiment(newMessage.message),
        this.calculateInterestLevel(newMessage.message, messages),
        this.extractTopics(newMessage.message),
        this.analyzeConversationFlow(messages)
      ]);

      return {
        ...analysis,
        suggestions,
        sentiment,
        interestLevel,
        topics,
        conversationFlow,
        success: true
      };

    } catch (error) {
      console.error('대화 분석 오류:', error);
      return this.getFailbackAnalysis(newMessage);
    }
  }

  // 답변 추천 생성
  async generateSuggestions(messages, newMessage) {
    if (this.geminiApiKey) {
      return await this.generateSuggestionsWithGemini(messages, newMessage);
    }
    
    return this.generateLocalSuggestions(newMessage.message);
  }

  // Gemini API로 답변 추천
  async generateSuggestionsWithGemini(messages, newMessage) {
    try {
      const conversationContext = this.buildConversationContext(messages);

      const prompt = `채팅 대화에서 마지막 메시지에 대한 자연스러운 답변 3개를 추천해주세요.

대화 맥락:
${conversationContext}

새 메시지: "${newMessage.message}" (${newMessage.sender})

답변 조건:
- 감정을 고려한 적절한 반응
- 대화를 이어갈 수 있는 내용  
- 한국어, 30자 이내
- JSON 형태로만 응답: {"suggestions": ["답변1", "답변2", "답변3"]}`;

      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
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

      const content = response.data.candidates[0].content.parts[0].text;
      // 마크다운 코드 블록 제거
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return parsed.suggestions || this.generateLocalSuggestions(newMessage.message);

    } catch (error) {
      console.error('Gemini API 오류:', error.response?.data || error.message);
      return this.generateLocalSuggestions(newMessage.message);
    }
  }

  // 로컬 답변 추천 (키워드 기반)
  generateLocalSuggestions(message) {
    const lowerMsg = message.toLowerCase();
    
    // 감정별 답변 패턴
    if (this.isPositiveMessage(lowerMsg)) {
      return [
        '정말 좋으시겠어요! 😊',
        '저도 기분이 좋아져요!',
        '축하해요! 🎉'
      ];
    }
    
    if (this.isNegativeMessage(lowerMsg)) {
      return [
        '많이 힘드시겠어요 😔',
        '괜찮으신가요? 들어드릴게요',
        '푹 쉬시고 힘내세요!'
      ];
    }
    
    if (this.isQuestionMessage(lowerMsg)) {
      return [
        '좋은 질문이네요!',
        '음.. 어떻게 생각하세요?',
        '저도 궁금해요!'
      ];
    }
    
    // 기본 답변
    return [
      '재미있네요! 😄',
      '그래서 어떻게 되었나요?',
      '더 자세히 얘기해주세요!'
    ];
  }

  // 감정 분석
  async analyzeSentiment(message) {
    // 로컬 분석 사용
    return analyzeEmotion(message);
  }

  // 관심도 계산
  async calculateInterestLevel(message, messages) {
    const localResult = calculateInterestLevel(message);
    
    // 대화 맥락 고려
    const contextBonus = this.calculateContextBonus(message, messages);
    
    return {
      ...localResult,
      score: Math.min(localResult.score + contextBonus, 10),
      contextFactors: {
        messageSequence: messages.length,
        timeRelevance: this.isTimeRelevant(message),
        personalContent: this.hasPersonalContent(message)
      }
    };
  }

  // 주제 추출
  async extractTopics(message) {
    return extractTopics(message);
  }

  // 대화 흐름 분석
  analyzeConversationFlow(messages) {
    const totalMessages = messages.length;
    if (totalMessages === 0) return null;

    const avgLength = messages.reduce((sum, msg) => sum + msg.message.length, 0) / totalMessages;
    const questionCount = messages.filter(msg => msg.message.includes('?')).length;
    const emojiCount = messages.reduce((count, msg) => {
      return count + (msg.message.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    }, 0);

    return {
      totalMessages,
      avgMessageLength: Math.round(avgLength),
      questionRate: Math.round((questionCount / totalMessages) * 100),
      emojiUsage: emojiCount,
      conversationPace: this.calculateConversationPace(messages),
      engagement: this.calculateEngagement(messages)
    };
  }

  // 헬퍼 메서드들
  buildConversationContext(messages, limit = 10) {
    return messages
      .slice(-limit)
      .map(msg => `[${msg.sender}] ${msg.message}`)
      .join('\n');
  }

  isPositiveMessage(message) {
    const positiveWords = ['좋', '행복', '최고', '사랑', '감사', '기쁘', '😊', '😍', '👍'];
    return positiveWords.some(word => message.includes(word));
  }

  isNegativeMessage(message) {
    const negativeWords = ['힘들', '싫', '화나', '우울', '슬프', '😢', '😔', '💔'];
    return negativeWords.some(word => message.includes(word));
  }

  isQuestionMessage(message) {
    return message.includes('?') || message.includes('어떻') || message.includes('왜') || message.includes('언제');
  }

  calculateContextBonus(message, messages) {
    let bonus = 0;
    
    // 연속 대화 보너스
    if (messages.length > 3) bonus += 0.5;
    
    // 개인적 내용 보너스
    if (this.hasPersonalContent(message)) bonus += 1;
    
    // 시의성 보너스
    if (this.isTimeRelevant(message)) bonus += 0.5;
    
    return bonus;
  }

  hasPersonalContent(message) {
    const personalWords = ['나', '내', '저', '제', '우리', '내가', '나는'];
    return personalWords.some(word => message.includes(word));
  }

  isTimeRelevant(message) {
    const timeWords = ['오늘', '지금', '방금', '현재', '이번', '어제', '내일'];
    return timeWords.some(word => message.includes(word));
  }

  calculateConversationPace(messages) {
    // 대화 속도 계산 로직
    return 'normal'; // 임시
  }

  calculateEngagement(messages) {
    // 참여도 계산 로직
    return 7.5; // 임시
  }

  // 실패시 기본 분석 결과
  getFailbackAnalysis(newMessage) {
    return {
      timestamp: new Date(),
      messageId: newMessage.id,
      roomId: newMessage.roomId,
      suggestions: this.generateLocalSuggestions(newMessage.message),
      sentiment: analyzeEmotion(newMessage.message),
      interestLevel: calculateInterestLevel(newMessage.message),
      topics: extractTopics(newMessage.message),
      conversationFlow: null,
      success: false,
      error: 'AI 분석 실패, 로컬 분석 사용'
    };
  }
}

module.exports = new AIService();