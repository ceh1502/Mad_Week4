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

  const prompt = `당신은 연애 상담 전문가입니다. 다음은 썸을 타고 있는 사람들의 1:1 채팅 대화입니다. 이 대화를 분석해주세요.

대화 내용:
${conversationText}

분석 요청사항:
1. Comment: "지금 썸을 타고있는 상대방이랑 이야기 중인데 너가 보기에는 상황이 어때? 3줄로 설명해줘" 라는 질문에 답하듯이 현실적이고 구체적으로 분석해주세요.

2. 전체 대화 흐름과 맥락을 파악한 후, 상대방의 마지막 메시지에 자연스럽게 이어질 수 있는 실제 사용할 수 있는 답변 3개를 추천해주세요. 대화의 주제, 분위기, 상대방의 관심사를 모두 고려해주세요.

다음 형식의 JSON으로만 응답해주세요:
{
  "comment": "3줄로 현재 상황 분석 (예: '상대방이 대화에 적극적으로 참여하고 있어요.\\n이모티콘이나 질문을 자주 써서 관심을 보이는 것 같아요.\\n하지만 아직 깊은 이야기보다는 가벼운 대화 수준이에요.')",
  "analysis": {
    "호감도": 0-100 사이의 숫자,
    "관심도": 0-100 사이의 숫자,
    "친밀도": 0-100 사이의 숫자
  },
  "suggestions": [
    "전체 대화 맥락을 고려한 자연스러운 답변 1",
    "대화 주제와 분위기에 맞는 답변 2", 
    "상대방 관심사를 반영한 매력적인 답변 3"
  ]
}

분석 기준:
- 호감도: 이모티콘, 칭찬, 관심 표현, 대화 지속 노력
- 관심도: 질문, 개인적 이야기, 적극적 반응
- 친밀도: 편안한 말투, 농담, 개인정보 공유
- 추천 답변: 전체 대화 맥락, 주제, 분위기를 종합적으로 고려하여 상대방의 마지막 메시지에 자연스럽게 이어지는 실용적이고 매력적인 답변

반드시 JSON 형식으로만 응답하고, comment는 \\n으로 줄바꿈해주세요.`;

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
  const otherMessages = messages.filter(msg => msg.user_id !== currentUserId);
  const myMessages = messages.filter(msg => msg.user_id === currentUserId);
  const lastMessage = messages[messages.length - 1];
  const lastOtherMessage = otherMessages[otherMessages.length - 1];
  
  // 상대방의 특성 분석
  let 호감도 = 40;
  let 관심도 = 40;
  let 친밀도 = 40;
  
  // 이모티콘 사용도 (호감도)
  const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|😊|😍|❤️|💕|👍|😄|😆|🥰|ㅎㅎ|ㅋㅋ|ㅜㅜ|ㅠㅠ/gu;
  const emojiCount = otherMessages.reduce((count, msg) => {
    const content = msg.content || msg.message || '';
    return count + (content.match(emojiPattern) || []).length;
  }, 0);
  호감도 += Math.min(30, emojiCount * 8);
  
  // 질문 개수 (관심도)
  const questionCount = otherMessages.reduce((count, msg) => {
    const content = msg.content || msg.message || '';
    return count + (content.includes('?') || content.includes('뭐') || content.includes('어떻') || content.includes('언제') || content.includes('어디') ? 1 : 0);
  }, 0);
  관심도 += Math.min(35, questionCount * 15);
  
  // 메시지 길이와 빈도 (친밀도)
  const avgLength = otherMessages.length > 0 ? 
    otherMessages.reduce((sum, msg) => sum + (msg.content || msg.message || '').length, 0) / otherMessages.length : 0;
  친밀도 += Math.min(25, avgLength * 1.5);
  
  // 대화 균형 체크
  const messageRatio = otherMessages.length / Math.max(myMessages.length, 1);
  if (messageRatio > 0.8) 관심도 += 10; // 상대방이 많이 말함
  
  // 범위 제한
  호감도 = Math.max(20, Math.min(90, 호감도));
  관심도 = Math.max(20, Math.min(90, 관심도));
  친밀도 = Math.max(20, Math.min(90, 친밀도));
  
  // 현실적인 상황 분석 코멘트 생성
  let situationComment = '';
  if (호감도 >= 70) {
    situationComment += '상대방이 이모티콘이나 긍정적인 반응을 많이 보이고 있어요.\\n';
  } else if (호감도 >= 50) {
    situationComment += '상대방이 대화에 어느 정도 관심을 보이고 있는 것 같아요.\\n';
  } else {
    situationComment += '상대방이 아직은 조금 조심스럽게 대화하는 느낌이에요.\\n';
  }
  
  if (관심도 >= 70) {
    situationComment += '질문도 자주 하고 대화를 이어가려고 노력하는 게 보여요.\\n';
  } else if (관심도 >= 50) {
    situationComment += '가끔 질문하면서 관심을 표현하고 있어요.\\n';
  } else {
    situationComment += '아직 깊은 관심보다는 가벼운 대화 수준인 것 같아요.\\n';
  }
  
  if (친밀도 >= 70) {
    situationComment += '대화가 자연스럽고 편안한 분위기예요.';
  } else if (친밀도 >= 50) {
    situationComment += '서서히 편해지고 있는 단계인 것 같아요.';
  } else {
    situationComment += '아직은 서로 탐색하는 단계인 것 같아요.';
  }
  
  // 전체 대화 맥락을 고려한 추천 답변 생성
  let suggestions = [];
  
  // 전체 대화에서 주요 키워드와 주제 추출
  const allOtherContent = otherMessages.map(msg => msg.content || msg.message || '').join(' ');
  const conversationTopics = {
    food: /음식|밥|먹|맛|요리|카페|커피|술|맥주|치킨/i.test(allOtherContent),
    work: /일|회사|직장|업무|출근|퇴근|힘들|바빠/i.test(allOtherContent),
    hobby: /취미|좋아|관심|영화|음악|게임|운동|책|드라마/i.test(allOtherContent),
    weather: /날씨|춥|덥|비|눈|햇살|바람/i.test(allOtherContent),
    weekend: /주말|토요일|일요일|휴일|쉬/i.test(allOtherContent),
    personal: /가족|친구|어릴|학교|집|고향/i.test(allOtherContent)
  };
  
  if (lastOtherMessage) {
    const lastContent = lastOtherMessage.content || lastOtherMessage.message || '';
    
    // 대화 맥락과 마지막 메시지를 종합적으로 고려
    if (lastContent.includes('?')) {
      // 질문에 대한 답변 (주제별로 다르게)
      if (conversationTopics.food) {
        suggestions = [
          "저도 그거 좋아해요! 어디서 먹어봤어요?",
          "맛있겠다~ 저도 가보고싶네요",
          "다음에 같이 먹으러 가요?"
        ];
      } else if (conversationTopics.hobby) {
        suggestions = [
          "오~ 저도 그런 거 관심있어요!",
          "어떤 게 제일 재미있던가요?",
          "언제부터 시작하셨어요?"
        ];
      } else {
        suggestions = [
          "좋은 질문이네요! 저는 " + (conversationTopics.work ? "요즘 일이 좀 바빠서..." : "평소에는..."),
          "음.. 생각해보니 " + (conversationTopics.weekend ? "주말에는..." : "그런 건..."),
          "그런 건 어떤가요? " + (친밀도 > 60 ? "같이 해볼까요?" : "")
        ];
      }
    } else if (lastContent.includes('ㅎㅎ') || lastContent.includes('ㅋㅋ')) {
      // 웃음 표현에 대한 반응 (대화 분위기 고려)
      if (친밀도 > 60) {
        suggestions = [
          "ㅋㅋㅋ 진짜 웃기네요!",
          "저도 빵 터졌어요 😂",
          "아 너무 재밌다 ㅎㅎㅎ"
        ];
      } else {
        suggestions = [
          "ㅋㅋ 맞아요!",
          "정말 재미있네요 😄",
          "저도 웃음이 나와요 ㅎㅎ"
        ];
      }
    } else if (emojiPattern.test(lastContent)) {
      // 이모티콘이 있는 메시지 (호감도에 따라)
      if (호감도 > 70) {
        suggestions = [
          "저도 그런 생각이에요 😊",
          "완전 공감해요! 👍",
          "그러게요~ 좋네요 ㅎㅎ"
        ];
      } else {
        suggestions = [
          "맞아요 😊",
          "공감해요!",
          "그렇네요 ㅎㅎ"
        ];
      }
    } else {
      // 일반적인 메시지 (대화 주제와 친밀도 고려)
      if (conversationTopics.food && 친밀도 > 50) {
        suggestions = [
          "와 맛있겠다! 저도 먹고싶어요",
          "다음에 추천해주세요 😊",
          "같이 먹으러 가요!"
        ];
      } else if (conversationTopics.work) {
        suggestions = [
          "고생 많으셨어요!",
          "저도 요즘 바빠서 공감돼요",
          "푹 쉬시고 힘내세요 😊"
        ];
      } else if (conversationTopics.weekend) {
        suggestions = [
          "주말 잘 보내세요!",
          "저도 쉬고싶네요 ㅎㅎ",
          "뭐 하실 예정이에요?"
        ];
      } else {
        suggestions = [
          "오~ 그렇구나요!",
          "더 자세히 얘기해주세요",
          "흥미롭네요! " + (친밀도 > 60 ? "저도 관심있어요" : "")
        ];
      }
    }
  } else {
    suggestions = [
      "안녕하세요! 반갑습니다 😊",
      "오늘 어떤 하루 보내셨나요?",
      "날씨가 좋네요!"
    ];
  }
  
  return {
    comment: situationComment,
    analysis: {
      호감도,
      관심도,
      친밀도
    },
    suggestions
  };
}

module.exports = router;