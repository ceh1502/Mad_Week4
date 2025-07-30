const express = require('express');
const router = express.Router();
const { Message, User, Room, UserRoom } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/analysis/flirto/{roomId}:
 *   post:
 *     summary: Flirto 채팅 분석 (호감도/관심도/친밀도 점수 + 추천 답변)
 *     description: 최근 30개 메시지를 분석하여 호감도/관심도/친밀도를 점수화하고 추천 답변 3개를 제공합니다.
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
 *         description: Flirto 분석 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     comment:
 *                       type: string
 *                       description: 한-두줄 요약 코멘트
 *                       example: "상대방이 장난스럽고 상냥한 대화를 주도하고 있습니다."
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         호감도:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 100
 *                           example: 81
 *                         관심도:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 100
 *                           example: 47
 *                         친밀도:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 100
 *                           example: 90
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       minItems: 3
 *                       maxItems: 3
 *                       example: ["오늘 날씨가 좋네요!", "취미가 무엇인가요?", "하지메마시떼!"]
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.post('/flirto/:roomId', authenticateToken, async (req, res) => {
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

    // 메시지 수 체크 (최소 5개 필요)
    if (messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: '분석할 메시지가 없습니다. 대화를 시작해주세요.'
      });
    }

    if (messages.length < 5) {
      return res.status(400).json({
        success: false,
        message: `분석하기에는 메시지가 너무 적습니다. (현재: ${messages.length}개, 최소: 5개 필요)`
      });
    }

    // 메시지를 시간순으로 정렬 (오래된 것부터)
    const sortedMessages = messages.reverse();

    // Flirto 분석 실행
    console.log('💕 Flirto 채팅 분석 시작...');
    const flirtoAnalysis = await analyzeFlirtoChat(sortedMessages, userId);

    res.json({
      success: true,
      message: 'Flirto 분석이 완료되었습니다.',
      data: flirtoAnalysis
    });

  } catch (error) {
    console.error('Flirto 분석 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Flirto 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// === Flirto 전용 분석 함수 ===

async function analyzeFlirtoChat(messages, currentUserId) {
  try {
    // Gemini API 키가 있으면 Gemini 분석, 없으면 로컬 분석
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      return await analyzeFlirtoWithGemini(messages, currentUserId);
    } else {
      console.log('Gemini API 키가 없어서 로컬 Flirto 분석을 사용합니다.');
      return analyzeFlirtoLocal(messages, currentUserId);
    }
  } catch (error) {
    console.error('Flirto 분석 실패, 로컬 분석으로 fallback:', error.message);
    return analyzeFlirtoLocal(messages, currentUserId);
  }
}

async function analyzeFlirtoWithGemini(messages, currentUserId) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  // 상대방과 나의 메시지 구분
  const otherMessages = messages.filter(msg => msg.user_id !== currentUserId);
  const otherUser = otherMessages.length > 0 ? otherMessages[0].user.username : '상대방';
  
  // 대화 텍스트 생성
  const conversationText = messages
    .map(msg => `[${msg.user_id === currentUserId ? '나' : otherUser}] ${msg.content || msg.message}`)
    .join('\n');

  const prompt = `다음은 1:1 채팅 대화입니다. 이 대화를 분석하여 상대방의 호감도, 관심도, 친밀도를 점수화해주세요.

대화 내용:
${conversationText}

다음 형식의 JSON으로만 응답해주세요:
{
  "comment": "대화의 전반적인 요약을 한-두 문장으로 (예: '상대방이 장난스럽고 상냥한 대화를 주도하고 있습니다.')",
  "analysis": {
    "호감도": 0-100 사이의 숫자 (상대방이 나에게 얼마나 호감을 보이는지),
    "관심도": 0-100 사이의 숫자 (상대방이 나에게 얼마나 관심을 보이는지),
    "친밀도": 0-100 사이의 숫자 (우리 사이가 얼마나 친밀한지)
  },
  "suggestions": [
    "추천 답변 1 (자연스럽고 매력적인 답변)",
    "추천 답변 2 (관심을 보이는 답변)",
    "추천 답변 3 (유머러스하거나 재미있는 답변)"
  ]
}

분석 기준:
- 호감도: 이모티콘 사용, 칭찬, 관심 표현, 대화 지속 의지
- 관심도: 질문하기, 개인적인 이야기 나누기, 적극적인 반응
- 친밀도: 편안한 말투, 농담, 개인적 정보 공유, 대화의 깊이
- 추천 답변: 대화 맥락에 맞고 관계 발전에 도움이 되는 답변

반드시 JSON 형식으로만 응답하고, 다른 설명은 하지 마세요.`;

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('💎 Gemini AI로 Flirto 분석 시작...');
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    
    console.log('💎 Gemini Flirto 분석 완료');
    
    // JSON 파싱 시도
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      
      // 점수 검증 (0-100 범위)
      const scores = analysis.analysis;
      scores.호감도 = Math.max(0, Math.min(100, Math.floor(scores.호감도)));
      scores.관심도 = Math.max(0, Math.min(100, Math.floor(scores.관심도)));
      scores.친밀도 = Math.max(0, Math.min(100, Math.floor(scores.친밀도)));
      
      // 추천 답변 검증 (3개 보장)
      if (!Array.isArray(analysis.suggestions) || analysis.suggestions.length < 3) {
        analysis.suggestions = [
          "재미있네요! 더 자세히 알려주세요 😊",
          "오~ 그래서 어떻게 되었나요?",
          "정말요? 신기하네요 ㅎㅎ"
        ];
      }
      
      return analysis;
      
    } catch (parseError) {
      console.error('Gemini JSON 파싱 실패:', parseError.message);
      console.log('원본 응답:', content);
      return analyzeFlirtoLocal(messages, currentUserId);
    }

  } catch (error) {
    console.error('Gemini Flirto 분석 실패:', error.message);
    return analyzeFlirtoLocal(messages, currentUserId);
  }
}

function analyzeFlirtoLocal(messages, currentUserId) {
  // 로컬 분석 로직
  const otherMessages = messages.filter(msg => msg.user_id !== currentUserId);
  
  // 간단한 점수 계산
  let 호감도 = 50;
  let 관심도 = 50;
  let 친밀도 = 50;
  
  // 이모티콘 사용도 체크
  const emojiCount = otherMessages.reduce((count, msg) => {
    const content = msg.content || msg.message || '';
    return count + (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|😊|😍|❤️|💕|👍|😄|😆|🥰/gu) || []).length;
  }, 0);
  
  호감도 += Math.min(30, emojiCount * 5);
  
  // 질문 개수 체크 (관심도)
  const questionCount = otherMessages.reduce((count, msg) => {
    const content = msg.content || msg.message || '';
    return count + (content.includes('?') || content.includes('까') || content.includes('나요') ? 1 : 0);
  }, 0);
  
  관심도 += Math.min(25, questionCount * 8);
  
  // 메시지 길이 (친밀도)
  const avgLength = otherMessages.length > 0 ? 
    otherMessages.reduce((sum, msg) => sum + (msg.content || msg.message || '').length, 0) / otherMessages.length : 0;
  
  친밀도 += Math.min(20, avgLength * 2);
  
  // 범위 제한
  호감도 = Math.max(10, Math.min(95, 호감도));
  관심도 = Math.max(10, Math.min(95, 관심도));
  친밀도 = Math.max(10, Math.min(95, 친밀도));
  
  return {
    comment: `총 ${messages.length}개의 메시지로 이루어진 대화입니다. 상대방이 적극적으로 대화에 참여하고 있습니다.`,
    analysis: {
      호감도,
      관심도,
      친밀도
    },
    suggestions: [
      "재미있네요! 더 자세히 알려주세요 😊",
      "오늘 어떤 하루를 보내셨나요?",
      "취미가 뭐예요? 저도 관심있어요!"
    ]
  };
}

module.exports = router;