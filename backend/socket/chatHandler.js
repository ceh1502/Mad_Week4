const jwt = require('jsonwebtoken');
const { User, Room, Message, UserRoom } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 온라인 사용자 관리
const onlineUsers = new Map(); // socketId -> { userId, username, roomId }
const userSockets = new Map(); // userId -> socketId

function handleChatEvents(io, socket) {
  console.log('🔗 클라이언트 연결:', socket.id);
  
  // JWT 인증
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      
      if (!token) {
        socket.emit('auth-error', { message: '토큰이 필요합니다.' });
        return;
      }
      
      // JWT 토큰 검증
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        socket.emit('auth-error', { message: '유효하지 않은 사용자입니다.' });
        return;
      }
      
      // 사용자 정보 저장
      onlineUsers.set(socket.id, {
        userId: user.id,
        username: user.username,
        email: user.email,
        authenticatedAt: new Date()
      });
      
      // 중복 연결 처리 (기존 소켓 연결 해제)
      const existingSocketId = userSockets.get(user.id);
      if (existingSocketId && existingSocketId !== socket.id) {
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.emit('duplicate-connection', { message: '다른 곳에서 로그인하여 연결이 해제됩니다.' });
          existingSocket.disconnect();
        }
      }
      
      userSockets.set(user.id, socket.id);
      
      console.log(`🔐 ${user.username}(${socket.id}) 인증 완료`);
      
      socket.emit('authenticated', {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('인증 오류:', error);
      socket.emit('auth-error', { message: '인증에 실패했습니다.' });
    }
  });
  
  // 채팅방 입장
  socket.on('join-room', async (data) => {
    console.log(`🚪 join-room 이벤트 수신:`, data);
    try {
      const { roomId } = data;
      const userSession = onlineUsers.get(socket.id);
      
      console.log(`👤 사용자 세션 확인:`, userSession);
      
      if (!userSession) {
        console.log(`❌ 인증되지 않은 사용자: ${socket.id}`);
        socket.emit('error', { message: '먼저 인증해주세요.' });
        return;
      }
      
      console.log(`🔍 채팅방 ${roomId} 검색 중...`);
      
      // 채팅방 존재 확인
      const room = await Room.findByPk(roomId);
      if (!room) {
        console.log(`❌ 채팅방 ${roomId}를 데이터베이스에서 찾을 수 없습니다.`);
        
        // 모든 채팅방 조회해서 디버깅
        const allRooms = await Room.findAll({ attributes: ['id', 'name'] });
        console.log(`📋 데이터베이스의 모든 채팅방:`, allRooms);
        
        socket.emit('error', { message: '존재하지 않는 채팅방입니다.' });
        return;
      }
      
      console.log(`✅ 채팅방 ${roomId} 확인됨:`, room.name);
      
      // 사용자가 참여한 채팅방인지 확인
      const userRoom = await UserRoom.findOne({
        where: {
          user_id: userSession.userId,
          room_id: roomId
        }
      });
      
      // 권한이 없으면 자동으로 참여시키기 (테스트용)
      if (!userRoom) {
        await UserRoom.create({
          user_id: userSession.userId,
          room_id: roomId,
          joined_at: new Date()
        });
        console.log(`📝 ${userSession.username}을 방 ${roomId}에 자동 추가`);
      }
      
      // 이전 방에서 나가기
      if (userSession.roomId) {
        socket.leave(userSession.roomId);
        socket.to(userSession.roomId).emit('user-left-room', {
          userId: userSession.userId,
          username: userSession.username
        });
      }
      
      // 새 방 입장
      socket.join(roomId);
      userSession.roomId = roomId;
      onlineUsers.set(socket.id, userSession);
      
      console.log(`👤 ${userSession.username}이 방 ${roomId}에 입장`);
      
      // 최근 메시지 가져오기
      console.log(`📨 채팅방 ${roomId}의 메시지 조회 중...`);
      const messages = await Message.findAll({
        where: { room_id: roomId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }],
        order: [['created_at', 'DESC']],
        limit: 50
      });
      
      console.log(`💬 찾은 메시지 개수: ${messages.length}`);
      if (messages.length > 0) {
        console.log(`📋 메시지 미리보기:`, messages.slice(0, 3).map(m => ({
          id: m.id,
          message: m.message.substring(0, 20),
          user: m.user?.username
        })));
      }
      
      const roomJoinedData = {
        success: true,
        roomId,
        room: room,
        messages: messages.reverse() // 시간순 정렬
      };
      
      console.log(`🏠 room-joined 이벤트 전송:`, {
        success: roomJoinedData.success,
        roomId: roomJoinedData.roomId,
        messagesCount: roomJoinedData.messages.length
      });
      
      // 입장 확인 및 메시지 전송
      socket.emit('room-joined', roomJoinedData);
      
      // 다른 사용자들에게 입장 알림
      socket.to(roomId).emit('user-joined-room', {
        userId: userSession.userId,
        username: userSession.username
      });
      
    } catch (error) {
      console.error(`❌ join-room 처리 중 오류:`, error);
      console.error(`❌ 오류 스택:`, error.stack);
      socket.emit('error', { message: '방 입장 중 오류가 발생했습니다: ' + error.message });
    }
  });
  
  // 메시지 전송
  socket.on('send-message', async (data) => {
    try {
      const { roomId, message } = data;
      const userSession = onlineUsers.get(socket.id);
      
      if (!userSession) {
        socket.emit('error', { message: '먼저 인증해주세요.' });
        return;
      }
      
      if (!userSession.roomId || userSession.roomId !== roomId) {
        socket.emit('error', { message: '먼저 채팅방에 입장해주세요.' });
        return;
      }
      
      // 메시지 유효성 검사
      if (!message || message.trim().length === 0) {
        socket.emit('error', { message: '메시지를 입력해주세요.' });
        return;
      }
      
      if (message.length > 1000) {
        socket.emit('error', { message: '메시지는 1000자 이하로 입력해주세요.' });
        return;
      }
      
      // 데이터베이스에 메시지 저장
      const newMessage = await Message.create({
        room_id: roomId,
        user_id: userSession.userId,
        message: message.trim()
      });
      
      // 사용자 정보와 함께 메시지 조회
      const messageWithUser = await Message.findByPk(newMessage.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }]
      });
      
      console.log(`💬 [${roomId}] ${userSession.username}: ${message.trim()}`);
      
      // 같은 방의 모든 사용자에게 실시간 메시지 전송
      io.to(roomId).emit('receive-message', messageWithUser);
      
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다.' });
    }
  });
  
  // 타이핑 상태 알림
  socket.on('typing-start', (data) => {
    const { roomId } = data;
    const userSession = onlineUsers.get(socket.id);
    
    if (userSession && userSession.roomId === roomId) {
      socket.to(roomId).emit('user-typing', {
        userId: userSession.userId,
        username: userSession.username,
        isTyping: true
      });
    }
  });
  
  socket.on('typing-stop', (data) => {
    const { roomId } = data;
    const userSession = onlineUsers.get(socket.id);
    
    if (userSession && userSession.roomId === roomId) {
      socket.to(roomId).emit('user-typing', {
        userId: userSession.userId,
        username: userSession.username,
        isTyping: false
      });
    }
  });
  
  // 메시지 읽음 표시
  socket.on('mark-read', (data) => {
    const { roomId, messageId } = data;
    const userSession = onlineUsers.get(socket.id);
    
    if (userSession && userSession.roomId === roomId) {
      socket.to(roomId).emit('message-read', {
        messageId,
        readBy: {
          userId: userSession.userId,
          username: userSession.username
        },
        timestamp: new Date()
      });
    }
  });
  
  // 온라인 사용자 목록 요청
  socket.on('get-online-users', (data) => {
    const { roomId } = data;
    const userSession = onlineUsers.get(socket.id);
    
    if (userSession && userSession.roomId === roomId) {
      // 해당 방의 온라인 사용자 찾기
      const roomUsers = [];
      for (const [socketId, session] of onlineUsers.entries()) {
        if (session.roomId === roomId) {
          roomUsers.push({
            userId: session.userId,
            username: session.username
          });
        }
      }
      
      socket.emit('online-users', {
        roomId,
        users: roomUsers,
        count: roomUsers.length
      });
    }
  });
  
  // 연결 해제
  socket.on('disconnect', (reason) => {
    try {
      const userSession = onlineUsers.get(socket.id);
      
      if (userSession) {
        console.log(`👋 ${userSession.username}(${socket.id}) 연결 해제: ${reason}`);
        
        // 채팅방에서 나가기 알림
        if (userSession.roomId) {
          socket.to(userSession.roomId).emit('user-left-room', {
            userId: userSession.userId,
            username: userSession.username
          });
        }
        
        // 사용자 소켓 매핑 제거
        userSockets.delete(userSession.userId);
      }
      
      // 세션 정리
      onlineUsers.delete(socket.id);
      
    } catch (error) {
      console.error('연결 해제 처리 오류:', error);
    }
  });
  
  // 에러 처리
  socket.on('error', (error) => {
    console.error('Socket 오류:', error);
  });
}

// 특정 사용자에게 메시지 전송 (다른 API에서 호출 가능)
function sendMessageToUser(userId, event, data) {
  const socketId = userSockets.get(userId);
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
  }
  return false;
}

// 특정 방의 모든 사용자에게 메시지 전송
function sendMessageToRoom(roomId, event, data) {
  io.to(roomId).emit(event, data);
}

// 온라인 사용자 수 조회
function getOnlineUserCount() {
  return onlineUsers.size;
}

// 특정 방의 온라인 사용자 조회
function getRoomUsers(roomId) {
  const roomUsers = [];
  for (const [socketId, session] of onlineUsers.entries()) {
    if (session.roomId === roomId) {
      roomUsers.push({
        userId: session.userId,
        username: session.username,
        socketId
      });
    }
  }
  return roomUsers;
}

module.exports = { 
  handleChatEvents,
  sendMessageToUser,
  sendMessageToRoom,
  getOnlineUserCount,
  getRoomUsers
};