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

  const prompt = `너는 연애 고수 친구야. 내가 썸 타는 사람이랑 나눈 대화를 보여줄게. 솔직하게 이 상황이 어떤지 분석해주고, 뭐라고 답장하면 좋을지 추천해줘.

대화 내용:
${conversationText}

요청사항:
1. 이 대화 상황을 보고 솔직하게 어떤지 3줄 정도로 말해줘. 마치 친한 친구가 "야 이거 봐봐, 어떻게 생각해?" 하고 물어보는 것처럼 자연스럽게 답해줘.

2. 상대방의 호감도, 관심도, 친밀도를 0-100 점수로 매겨줘.

3. 이 대화 흐름 보고 뭐라고 답장하면 좋을지 3개 추천해줘. 너무 뻔하거나 어색하지 않은, 실제로 쓸 수 있는 자연스러운 답변으로.

다음 JSON 형식으로만 답해줘:
{
  "comment": "친구처럼 자연스럽게 상황 분석 (3줄 정도, \\n으로 줄바꿈)",
  "analysis": {
    "호감도": 0-100 점수,
    "관심도": 0-100 점수,
    "친밀도": 0-100 점수
  },
  "suggestions": [
    "자연스러운 답변 1",
    "자연스러운 답변 2", 
    "자연스러운 답변 3"
  ]
}

분석할 때 이런 거 봐줘:
- 호감도: 이모티콘, 긍정적 반응, 대화 지속 의지
- 관심도: 질문하기, 개인적 얘기, 적극적 반응
- 친밀도: 편한 말투, 농담, 개인정보 공유
- 답변 추천: 대화 맥락에 자연스럽게 이어지면서 관계 발전에 도움되는 실용적인 답변

JSON만 응답하고 다른 말은 하지 마.`;

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
  
  // 친구처럼 자연스러운 상황 분석 코멘트 생성
  let situationComment = '';
  
  // 첫 번째 줄 - 전반적인 느낌
  if (호감도 >= 70 && 관심도 >= 70) {
    situationComment += '음.. 이 대화 보니까 상대방이 당신한테 꽤 관심있어 보이는데?\n';
  } else if (호감도 >= 50 || 관심도 >= 50) {
    situationComment += '이 대화 흐름 보면 나쁘지 않은 것 같아.\n';
  } else {
    situationComment += '아직은 서로 탐색하는 단계인 것 같네.\n';
  }
  
  // 두 번째 줄 - 구체적인 행동 분석
  if (emojiCount > 2 && questionCount > 1) {
    situationComment += '이모티콘도 쓰고 질문도 던지면서 대화 이어가려고 하잖아.\n';
  } else if (emojiCount > 0 || questionCount > 0) {
    situationComment += '반응도 나쁘지 않고 어느 정도 관심 보이는 느낌이야.\n';
  } else {
    situationComment += '아직은 조심스럽게 대화하는 느낌이네.\n';
  }
  
  // 세 번째 줄 - 현재 단계와 조언
  if (친밀도 >= 70) {
    situationComment += '분위기도 편해 보이니까 좀 더 적극적으로 가도 될 것 같아!';
  } else if (친밀도 >= 50) {
    situationComment += '서서히 친해지고 있는 단계인 것 같으니까 천천히 가봐.';
  } else {
    situationComment += '아직 초기 단계니까 너무 부담스럽지 않게 대화해봐.';
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
      // 질문에 대한 자연스러운 답변
      if (conversationTopics.food) {
        suggestions = [
          "저도 그거 완전 좋아해요! 어디 맛집 아세요?",
          "와 맛있겠다ㅠㅠ 저도 가보고싶어요",
          친밀도 > 60 ? "다음에 같이 먹으러 갈까요?" : "추천해주세요!"
        ];
      } else if (conversationTopics.hobby) {
        suggestions = [
          "헐 저도 그거 관심있었는데!",
          "어떤 게 제일 재미있어요?",
          "저도 해보고싶네요 ㅎㅎ"
        ];
      } else if (conversationTopics.work) {
        suggestions = [
          "아 저도 요즘 일이 좀 바빠서 공감돼요",
          "고생 많으시네요ㅠㅠ",
          "일 끝나고 뭐하면서 스트레스 푸세요?"
        ];
      } else {
        suggestions = [
          "좋은 질문이네요! 저는 평소에...",
          "음.. 생각해보니 그런 것 같아요",
          "그건 어떻게 생각하세요?"
        ];
      }
    } else if (lastContent.includes('ㅎㅎ') || lastContent.includes('ㅋㅋ')) {
      // 웃음 표현에 자연스럽게 반응
      if (친밀도 > 60) {
        suggestions = [
          "ㅋㅋㅋ 진짜 웃기네요",
          "저도 빵터졌어요 😂",
          "아ㅋㅋ 너무 재밌어요"
        ];
      } else {
        suggestions = [
          "ㅋㅋ 맞아요!",
          "정말 재미있네요 😄",
          "저도 웃음이 나와요 ㅎㅎ"
        ];
      }
    } else if (emojiPattern.test(lastContent)) {
      // 이모티콘에 자연스럽게 반응
      if (호감도 > 70) {
        suggestions = [
          "저도 완전 공감이에요 😊",
          "맞아요! 정말 그래요 👍",
          "그러게요~ 좋네요"
        ];
      } else {
        suggestions = [
          "맞아요 😊",
          "저도 그렇게 생각해요",
          "그렇네요 ㅎㅎ"
        ];
      }
    } else {
      // 일반 메시지에 자연스럽게 반응
      if (conversationTopics.food && 친밀도 > 50) {
        suggestions = [
          "와 완전 맛있겠다! 저도 먹고싶어요",
          "그거 어디서 파는 거예요?",
          친밀도 > 70 ? "다음에 같이 먹으러 가요!" : "추천해주세요!"
        ];
      } else if (conversationTopics.work) {
        suggestions = [
          "헉 고생 많으시네요ㅠㅠ",
          "저도 요즘 일이 바빠서 완전 공감이에요",
          "얼른 퇴근하시고 푹 쉬세요!"
        ];
      } else if (conversationTopics.weekend) {
        suggestions = [
          "주말 뭐하세요? 부럽네요",
          "저도 쉬고싶어요ㅠㅠ",
          "주말 계획 있으세요?"
        ];
      } else {
        suggestions = [
          "오 그래요? 신기하네요",
          "더 자세히 알려주세요!",
          친밀도 > 60 ? "저도 완전 관심있어요" : "흥미로워요"
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