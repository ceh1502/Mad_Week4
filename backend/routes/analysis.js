const express = require('express');
const router = express.Router();

// 임시 분석 결과 저장소 (나중에 DB로 교체)
const analysisResults = new Map();

/**
 * @swagger
 * /api/analysis/conversation:
 *   post:
 *     summary: 대화 내용 분석
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: string
 *                 example: "room-123"
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     sender:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *               newMessage:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "오늘 날씨 좋네요!"
 *                   sender:
 *                     type: string
 *                     example: "상대방"
 *     responses:
 *       200:
 *         description: 분석 결과 반환
 */
router.post('/conversation', async (req, res) => {
  try {
    const { roomId, messages, newMessage } = req.body;
    
    // 임시 AI 분석 로직 (나중에 실제 AI API 연동)
    const analysis = await analyzeConversation(messages, newMessage);
    
    // 분석 결과 저장
    analysisResults.set(`${roomId}-${Date.now()}`, {
      ...analysis,
      roomId,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: '대화 분석이 완료되었습니다.',
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analysis/suggestions:
 *   post:
 *     summary: 답변 추천 생성
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               context:
 *                 type: string
 *                 example: "상대방이 '오늘 힘든 하루였어요'라고 했음"
 *               recentMessages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["안녕하세요!", "오늘 어떠셨나요?", "힘든 하루였어요"]
 *     responses:
 *       200:
 *         description: 답변 추천 목록
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { context, recentMessages } = req.body;
    
    const suggestions = await generateSuggestions(context, recentMessages);
    
    res.json({
      success: true,
      message: '답변 추천이 생성되었습니다.',
      data: { suggestions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '답변 추천 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analysis/sentiment:
 *   post:
 *     summary: 감정 분석
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "오늘 정말 행복한 하루였어요! 😊"
 *     responses:
 *       200:
 *         description: 감정 분석 결과
 */
router.post('/sentiment', async (req, res) => {
  try {
    const { message } = req.body;
    
    const sentiment = analyzeSentiment(message);
    
    res.json({
      success: true,
      message: '감정 분석이 완료되었습니다.',
      data: sentiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '감정 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analysis/stats/{roomId}:
 *   get:
 *     summary: 채팅방 통계 조회
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 채팅방 통계 정보
 */
router.get('/stats/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    
    // 해당 룸의 분석 결과들 가져오기
    const roomAnalyses = Array.from(analysisResults.values())
      .filter(analysis => analysis.roomId === roomId);
    
    const stats = calculateStats(roomAnalyses);
    
    res.json({
      success: true,
      message: '통계 정보를 가져왔습니다.',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// === 분석 함수들 (임시 구현) ===

async function analyzeConversation(messages, newMessage) {
  // 실제로는 OpenAI/Claude API 호출
  const messageCount = messages.length;
  const lastMessage = newMessage || messages[messages.length - 1];
  
  return {
    suggestions: generateResponseSuggestions(lastMessage),
    sentiment: analyzeSentiment(lastMessage.message),
    interest_level: calculateInterestLevel(messages),
    conversation_flow: analyzeConversationFlow(messages),
    topics: extractTopics(messages),
    response_time_analysis: analyzeResponseTimes(messages)
  };
}

function generateResponseSuggestions(lastMessage) {
  const suggestions = [];
  
  if (lastMessage.message.includes('힘들')) {
    suggestions.push("많이 힘드셨겠어요. 괜찮으신가요?");
    suggestions.push("무슨 일이 있으셨나요? 들어드릴게요");
    suggestions.push("힘든 하루였군요 😔 내일은 더 좋은 날이길!");
  } else if (lastMessage.message.includes('행복') || lastMessage.message.includes('좋')) {
    suggestions.push("정말 좋으시겠어요! 😊");
    suggestions.push("저도 듣기만 해도 기분이 좋네요!");
    suggestions.push("무슨 좋은 일이 있으셨나요?");
  } else {
    suggestions.push("재미있네요! 더 자세히 알려주세요");
    suggestions.push("그런 일이 있었군요 ㅎㅎ");
    suggestions.push("오~ 그래서 어떻게 되었나요?");
  }
  
  return suggestions;
}

function analyzeSentiment(message) {
  const positiveWords = ['좋', '행복', '최고', '감사', '사랑', '😊', '😍', '👍'];
  const negativeWords = ['힘들', '싫', '우울', '스트레스', '😢', '😔', '💔'];
  
  let score = 0;
  positiveWords.forEach(word => {
    if (message.includes(word)) score += 1;
  });
  negativeWords.forEach(word => {
    if (message.includes(word)) score -= 1;
  });
  
  let sentiment = '중립';
  if (score > 0) sentiment = '긍정적';
  else if (score < 0) sentiment = '부정적';
  
  return {
    sentiment,
    score,
    confidence: Math.min(Math.abs(score) * 0.3 + 0.5, 1.0)
  };
}

function calculateInterestLevel(messages) {
  // 메시지 길이, 빈도, 이모티콘 사용 등을 기반으로 관심도 계산
  const avgLength = messages.reduce((sum, msg) => sum + msg.message.length, 0) / messages.length;
  const emojiCount = messages.reduce((count, msg) => {
    return count + (msg.message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
  }, 0);
  
  let level = Math.min((avgLength / 20) + (emojiCount / messages.length * 2), 10);
  return Math.round(level * 10) / 10; // 소수점 1자리
}

function analyzeConversationFlow(messages) {
  return {
    total_messages: messages.length,
    avg_message_length: Math.round(messages.reduce((sum, msg) => sum + msg.message.length, 0) / messages.length),
    question_count: messages.filter(msg => msg.message.includes('?')).length,
    emoji_usage: messages.filter(msg => /[\u{1F600}-\u{1F64F}]/gu.test(msg.message)).length
  };
}

function extractTopics(messages) {
  const topics = ['일상', '음식', '여행', '취미', 'work', '연애'];
  // 간단한 키워드 기반 주제 추출
  return topics.slice(0, Math.min(3, Math.ceil(Math.random() * 3)));
}

function analyzeResponseTimes(messages) {
  // 응답 시간 분석 (임시)
  return {
    avg_response_time: '2분 30초',
    response_pattern: '일정함',
    active_hours: ['14:00-16:00', '20:00-22:00']
  };
}

function calculateStats(analyses) {
  if (analyses.length === 0) {
    return {
      total_analyses: 0,
      avg_interest_level: 0,
      sentiment_distribution: { positive: 0, negative: 0, neutral: 0 },
      common_topics: []
    };
  }
  
  const avgInterest = analyses.reduce((sum, a) => sum + a.interest_level, 0) / analyses.length;
  
  return {
    total_analyses: analyses.length,
    avg_interest_level: Math.round(avgInterest * 10) / 10,
    sentiment_distribution: {
      positive: analyses.filter(a => a.sentiment.sentiment === '긍정적').length,
      negative: analyses.filter(a => a.sentiment.sentiment === '부정적').length,
      neutral: analyses.filter(a => a.sentiment.sentiment === '중립').length
    },
    common_topics: ['일상', '취미', '음식'] // 임시
  };
}

module.exports = router;