const express = require('express');
const router = express.Router();
const { Message, User, Room, UserRoom } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');

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

/**
 * @swagger
 * /api/analysis/chat/{roomId}:
 *   post:
 *     summary: 채팅방의 최근 30개 메시지 AI 분석
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 분석할 채팅방 ID
 *     responses:
 *       200:
 *         description: AI 분석 결과
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.post('/chat/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 사용자가 해당 채팅방에 참여하고 있는지 확인
    const userRoom = await UserRoom.findOne({
      where: {
        user_id: userId,
        room_id: roomId
      }
    });

    if (!userRoom) {
      return res.status(403).json({
        success: false,
        message: '해당 채팅방에 접근할 권한이 없습니다.'
      });
    }

    // 채팅방 정보 조회
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다.'
      });
    }

    // 최근 30개 메시지 조회
    const messages = await Message.findAll({
      where: { room_id: roomId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'DESC']],
      limit: 30
    });

    if (messages.length === 0) {
      return res.json({
        success: true,
        message: '분석할 메시지가 없습니다.',
        data: {
          roomInfo: {
            id: room.id,
            name: room.name,
            messageCount: 0
          },
          analysis: null
        }
      });
    }

    // 메시지를 시간순으로 정렬 (오래된 것부터)
    const sortedMessages = messages.reverse();

    // AI 분석 실행
    console.log('🤖 OpenAI로 채팅 분석 시작...');
    const analysis = await analyzeChatWithOpenAI(sortedMessages, room);

    // 분석 결과 저장
    const analysisId = `${roomId}-${Date.now()}`;
    analysisResults.set(analysisId, {
      id: analysisId,
      roomId: parseInt(roomId),
      analysis,
      messageCount: sortedMessages.length,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'AI 채팅 분석이 완료되었습니다.',
      data: {
        roomInfo: {
          id: room.id,
          name: room.name,
          messageCount: sortedMessages.length
        },
        analysis
      }
    });

  } catch (error) {
    console.error('채팅 분석 오류:', error);
    res.status(500).json({
      success: false,
      message: '채팅 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// === AI 분석 함수 ===

// OpenAI로 채팅 전체 분석
async function analyzeChatWithOpenAI(messages, room) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.log('OpenAI API 키가 없어서 로컬 분석을 사용합니다.');
    return analyzeConversationLocal(messages);
  }

  try {
    // 메시지를 텍스트로 변환
    const conversationText = messages
      .map(msg => `[${msg.user.username}] ${msg.message}`)
      .join('\n');

    const prompt = `다음은 채팅방 "${room.name}"의 대화 내용입니다. 이 대화를 종합적으로 분석해주세요.

대화 내용:
${conversationText}

다음 항목들을 분석하여 JSON으로 응답해주세요:
{
  "overall_summary": "대화의 전반적인 요약 (3-5문장)",
  "sentiment_analysis": {
    "overall_mood": "전체적인 분위기 (긍정적/부정적/중립/혼재)",
    "mood_changes": "분위기 변화가 있었다면 설명",
    "sentiment_score": -5에서 5 사이의 전체 감정 점수
  },
  "conversation_topics": [
    "주요 대화 주제들"
  ],
  "participant_analysis": {
    "interaction_style": "참여자들의 상호작용 스타일 설명",
    "communication_balance": "대화 균형도 (골고루 참여/한쪽이 주도/등)",
    "engagement_level": "참여도 (1-10 점수)"
  },
  "conversation_insights": [
    "대화에서 발견한 흥미로운 인사이트들"
  ],
  "recommendations": [
    "더 나은 대화를 위한 추천사항들"
  ]
}

분석할 때 다음을 고려하세요:
- 한국어 대화의 뉘앙스와 문화적 맥락
- 이모티콘과 이모지의 의미
- 대화의 흐름과 맥락`;

    const axios = require('axios');
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    console.log('🤖 OpenAI 분석 완료');
    
    // JSON 파싱 시도
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      
      // 메타데이터 추가
      analysis.metadata = {
        analyzed_at: new Date(),
        message_count: messages.length,
        analysis_method: 'openai_gpt35',
        room_name: room.name
      };
      
      return analysis;
    } catch (parseError) {
      console.error('JSON 파싱 실패, 원본 텍스트 반환:', parseError.message);
      return {
        raw_analysis: content,
        metadata: {
          analyzed_at: new Date(),
          message_count: messages.length,
          analysis_method: 'openai_gpt35_raw',
          room_name: room.name,
          parse_error: parseError.message
        }
      };
    }

  } catch (error) {
    console.error('OpenAI 분석 실패:', error.response?.data || error.message);
    // 실패시 로컬 분석으로 fallback
    return analyzeConversationLocal(messages);
  }
}

// 로컬 분석 (fallback)
function analyzeConversationLocal(messages) {
  return {
    overall_summary: `총 ${messages.length}개의 메시지로 구성된 대화입니다. (로컬 분석)`,
    sentiment_analysis: {
      overall_mood: "중립",
      mood_changes: "분위기 변화 감지 불가 (로컬 분석)",
      sentiment_score: 0
    },
    conversation_topics: ["일반 대화"],
    participant_analysis: {
      interaction_style: "분석 불가 (로컬 분석)",
      communication_balance: "분석 불가",
      engagement_level: 5
    },
    conversation_insights: ["AI 분석이 필요한 항목입니다."],
    recommendations: ["OpenAI API 키를 설정하면 더 자세한 분석이 가능합니다."],
    metadata: {
      analyzed_at: new Date(),
      message_count: messages.length,
      analysis_method: 'local_fallback'
    }
  };
}

// === 기존 분석 함수들 (임시 구현) ===

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