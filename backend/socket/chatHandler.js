const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');

// 간단한 메모리 저장소 (나중에 Redis나 DB로 교체)
const activeRooms = new Map();
const userSessions = new Map();

function handleChatEvents(io, socket) {
  console.log('🔗 클라이언트 연결:', socket.id);
  
  // 채팅방 입장
  socket.on('join-room', (data) => {
    try {
      const { roomId, username } = data;
      
      // 이전 방에서 나가기
      const previousRoom = userSessions.get(socket.id);
      if (previousRoom) {
        socket.leave(previousRoom.roomId);
        updateRoomUsers(io, previousRoom.roomId, socket.id, 'leave');
      }
      
      // 새 방 입장
      socket.join(roomId);
      userSessions.set(socket.id, { roomId, username, joinedAt: new Date() });
      
      // 방 정보 업데이트
      updateRoomUsers(io, roomId, socket.id, 'join', username);
      
      console.log(`👤 ${username}(${socket.id})가 방 ${roomId}에 입장`);
      
      // 입장 확인 메시지 전송
      socket.emit('room-joined', {
        success: true,
        roomId,
        message: `${roomId} 방에 입장했습니다.`,
        timestamp: new Date()
      });
      
      // 다른 사용자들에게 입장 알림
      socket.to(roomId).emit('user-joined', {
        username,
        message: `${username}님이 입장했습니다.`,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('방 입장 오류:', error);
      socket.emit('error', { message: '방 입장 중 오류가 발생했습니다.' });
    }
  });
  
  // 메시지 전송
  socket.on('send-message', async (data) => {
    try {
      const { roomId, message, sender, messageType = 'text' } = data;
      const userSession = userSessions.get(socket.id);
      
      if (!userSession || userSession.roomId !== roomId) {
        socket.emit('error', { message: '먼저 채팅방에 입장해주세요.' });
        return;
      }
      
      // 메시지 객체 생성
      const messageObj = {
        id: uuidv4(),
        message: message.trim(),
        sender: sender || userSession.username,
        messageType, // text, emoji, image 등
        timestamp: new Date(),
        roomId
      };
      
      // 입력 검증
      if (!messageObj.message || messageObj.message.length > 1000) {
        socket.emit('error', { message: '메시지는 1-1000자 사이여야 합니다.' });
        return;
      }
      
      console.log(`💬 [${roomId}] ${messageObj.sender}: ${messageObj.message}`);
      
      // 같은 방의 모든 사용자에게 메시지 전송
      io.to(roomId).emit('receive-message', messageObj);
      
      // AI 분석 요청 (비동기)
      setTimeout(async () => {
        await requestAnalysis(io, roomId, messageObj, messages.get(roomId) || []);
      }, 500);
      
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다.' });
    }
  });
  
  // 타이핑 상태 알림
  socket.on('typing-start', (data) => {
    const { roomId } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession && userSession.roomId === roomId) {
      socket.to(roomId).emit('user-typing', {
        username: userSession.username,
        isTyping: true
      });
    }
  });
  
  socket.on('typing-stop', (data) => {
    const { roomId } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession && userSession.roomId === roomId) {
      socket.to(roomId).emit('user-typing', {
        username: userSession.username,
        isTyping: false
      });
    }
  });
  
  // 메시지 읽음 처리
  socket.on('mark-read', (data) => {
    const { roomId, messageId } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession && userSession.roomId === roomId) {
      socket.to(roomId).emit('message-read', {
        messageId,
        readBy: userSession.username,
        timestamp: new Date()
      });
    }
  });
  
  // 연결 해제
  socket.on('disconnect', (reason) => {
    try {
      const userSession = userSessions.get(socket.id);
      
      if (userSession) {
        const { roomId, username } = userSession;
        
        // 방에서 나가기
        updateRoomUsers(io, roomId, socket.id, 'leave');
        
        // 다른 사용자들에게 퇴장 알림
        socket.to(roomId).emit('user-left', {
          username,
          message: `${username}님이 퇴장했습니다.`,
          timestamp: new Date()
        });
        
        console.log(`👋 ${username}(${socket.id}) 연결 해제: ${reason}`);
      }
      
      // 세션 정리
      userSessions.delete(socket.id);
      
    } catch (error) {
      console.error('연결 해제 처리 오류:', error);
    }
  });
}

// 방 사용자 정보 업데이트
function updateRoomUsers(io, roomId, socketId, action, username = null) {
  try {
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, {
        users: new Map(),
        createdAt: new Date()
      });
    }
    
    const room = activeRooms.get(roomId);
    
    if (action === 'join' && username) {
      room.users.set(socketId, {
        username,
        joinedAt: new Date(),
        lastActivity: new Date()
      });
    } else if (action === 'leave') {
      room.users.delete(socketId);
    }
    
    // 현재 접속자 수 브로드캐스트
    const userCount = room.users.size;
    const userList = Array.from(room.users.values()).map(user => user.username);
    
    io.to(roomId).emit('room-info', {
      roomId,
      userCount,
      users: userList,
      timestamp: new Date()
    });
    
    // 빈 방 정리
    if (userCount === 0) {
      activeRooms.delete(roomId);
      console.log(`🗑️ 빈 방 삭제: ${roomId}`);
    }
    
  } catch (error) {
    console.error('방 사용자 업데이트 오류:', error);
  }
}

// AI 분석 요청
async function requestAnalysis(io, roomId, messageObj, messages) {
  try {
    const analysisResult = await aiService.analyzeConversation(messages, messageObj);
    
    io.to(roomId).emit('analysis-result', analysisResult);
    
  } catch (error) {
    console.error('분석 요청 오류:', error);
    
    // 실패시 기본 분석 전송
    io.to(roomId).emit('analysis-result', {
      messageId: messageObj.id,
      suggestions: generateQuickSuggestions(messageObj.message),
      sentiment: { type: 'neutral', confidence: 0.5 },
      interestLevel: { score: 5.0, level: 'MEDIUM' },
      error: '분석 서비스 오류'
    });
  }
}

// 빠른 답변 추천 생성
function generateQuickSuggestions(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('안녕') || lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
    return ['안녕하세요! 😊', '반가워요!', '좋은 하루 보내세요!'];
  }
  
  if (lowerMsg.includes('고마워') || lowerMsg.includes('감사')) {
    return ['천만에요!', '별말씀을요 😊', '도움이 되어서 기뻐요!'];
  }
  
  if (lowerMsg.includes('힘들') || lowerMsg.includes('피곤')) {
    return ['많이 힘드시겠어요 😔', '푹 쉬세요!', '무리하지 마세요'];
  }
  
  if (lowerMsg.includes('좋') || lowerMsg.includes('행복') || lowerMsg.includes('😊')) {
    return ['정말 좋으시겠어요! 😊', '저도 기분 좋아져요!', '축하해요! 🎉'];
  }
  
  return [
    '재미있네요! 😄',
    '그래서 어떻게 되었나요?',
    '더 자세히 얘기해주세요!'
  ];
}

// 간단한 감정 분석
function analyzeSentiment(message) {
  const positive = ['좋', '행복', '최고', '사랑', '😊', '😍', '👍', '🎉'];
  const negative = ['힘들', '싫', '화나', '우울', '😢', '😔', '💔', '😡'];
  
  let score = 0;
  positive.forEach(word => {
    if (message.includes(word)) score += 1;
  });
  negative.forEach(word => {
    if (message.includes(word)) score -= 1;
  });
  
  if (score > 0) return { type: 'positive', score, confidence: 0.8 };
  if (score < 0) return { type: 'negative', score, confidence: 0.8 };
  return { type: 'neutral', score: 0, confidence: 0.6 };
}

// 관심도 계산
function calculateQuickInterest(message) {
  const length = message.length;
  const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu.test(message);
  const hasQuestion = message.includes('?');
  
  let interest = Math.min(length / 20, 5); // 길이 기반
  if (hasEmoji) interest += 2;
  if (hasQuestion) interest += 1;
  
  return Math.min(Math.round(interest * 10) / 10, 10);
}

// 주제 추출
function extractQuickTopics(message) {
  const topicKeywords = {
    '음식': ['밥', '음식', '맛있', '요리', '레스토랑', '카페'],
    '일상': ['오늘', '어제', '내일', '하루', '시간'],
    '감정': ['기분', '느낌', '생각', '마음'],
    '취미': ['영화', '음악', '게임', '운동', '책'],
    '일': ['회사', '업무', '일', '회의', '프로젝트']
  };
  
  const foundTopics = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      foundTopics.push(topic);
    }
  }
  
  return foundTopics.length > 0 ? foundTopics : ['일반'];
}

module.exports = { handleChatEvents };