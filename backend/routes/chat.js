const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 메모리 저장소 (나중에 DB로 교체)
const chatRooms = new Map();
const messages = new Map();

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: 새 채팅방 생성
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomName:
 *                 type: string
 *                 example: "썸타는 상대와의 대화"
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["나", "상대방"]
 *     responses:
 *       201:
 *         description: 채팅방 생성 성공
 */
router.post('/rooms', (req, res) => {
  try {
    const { roomName, participants } = req.body;
    const roomId = uuidv4();
    
    const newRoom = {
      id: roomId,
      name: roomName || '새로운 대화',
      participants: participants || ['나', '상대방'],
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    chatRooms.set(roomId, newRoom);
    messages.set(roomId, []);
    
    res.status(201).json({
      success: true,
      message: '채팅방이 생성되었습니다.',
      data: newRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '채팅방 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: 모든 채팅방 조회
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: 채팅방 목록 조회 성공
 */
router.get('/rooms', (req, res) => {
  try {
    const rooms = Array.from(chatRooms.values());
    res.json({
      success: true,
      message: '채팅방 목록을 가져왔습니다.',
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '채팅방 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: 특정 채팅방의 메시지 조회
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 메시지 목록 조회 성공
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.get('/rooms/:roomId/messages', (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!chatRooms.has(roomId)) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다.'
      });
    }
    
    const roomMessages = messages.get(roomId) || [];
    const room = chatRooms.get(roomId);
    
    res.json({
      success: true,
      message: '메시지를 가져왔습니다.',
      data: {
        room,
        messages: roomMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '메시지 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   post:
 *     summary: 메시지 저장 (Socket 대신 HTTP로도 가능)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "안녕하세요!"
 *               sender:
 *                 type: string
 *                 example: "나"
 *     responses:
 *       201:
 *         description: 메시지 저장 성공
 */
router.post('/rooms/:roomId/messages', (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, sender } = req.body;
    
    if (!chatRooms.has(roomId)) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다.'
      });
    }
    
    const newMessage = {
      id: uuidv4(),
      message,
      sender,
      timestamp: new Date(),
      roomId
    };
    
    // 메시지 저장
    const roomMessages = messages.get(roomId) || [];
    roomMessages.push(newMessage);
    messages.set(roomId, roomMessages);
    
    // 채팅방 마지막 활동 시간 업데이트
    const room = chatRooms.get(roomId);
    room.lastActivity = new Date();
    chatRooms.set(roomId, room);
    
    res.status(201).json({
      success: true,
      message: '메시지가 저장되었습니다.',
      data: newMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '메시지 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 데이터 초기화 (개발용)
router.delete('/reset', (req, res) => {
  chatRooms.clear();
  messages.clear();
  res.json({
    success: true,
    message: '모든 데이터가 초기화되었습니다.'
  });
});

module.exports = router;
