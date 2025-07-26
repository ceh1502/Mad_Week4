const express = require('express');
const router = express.Router();
const { User, Room, Message, UserRoom } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: 사용자의 채팅방 목록 조회
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 채팅방 목록 조회 성공
 */
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 사용자가 참여한 채팅방 목록 조회
    const userRooms = await UserRoom.findAll({
      where: { user_id: userId },
      include: [{
        model: Room,
        as: 'room',
        include: [{
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }]
        }]
      }],
      order: [['joined_at', 'DESC']]
    });

    const rooms = userRooms.map(userRoom => ({
      id: userRoom.room.id,
      name: userRoom.room.name,
      description: userRoom.room.description,
      joinedAt: userRoom.joined_at,
      lastMessage: userRoom.room.messages[0] || null
    }));

    res.json({
      success: true,
      message: '채팅방 목록을 가져왔습니다.',
      data: rooms
    });
  } catch (error) {
    console.error('채팅방 목록 조회 오류:', error);
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: 가져올 메시지 개수 (최근 30개가 기본)
 *     responses:
 *       200:
 *         description: 메시지 목록 조회 성공
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.get('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 30;
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

    // 메시지 조회 (최근 메시지부터)
    const roomMessages = await Message.findAll({
      where: { room_id: roomId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'DESC']],
      limit: limit
    });

    // 메시지 순서를 시간순으로 정렬 (오래된 것부터)
    const messages = roomMessages.reverse();

    res.json({
      success: true,
      message: '메시지를 가져왔습니다.',
      data: {
        room: {
          id: room.id,
          name: room.name,
          description: room.description
        },
        messages
      }
    });
  } catch (error) {
    console.error('메시지 조회 오류:', error);
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
 *     summary: 메시지 전송
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       201:
 *         description: 메시지 전송 성공
 */
router.post('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
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

    // 메시지 생성
    const newMessage = await Message.create({
      room_id: roomId,
      user_id: userId,
      message
    });

    // 사용자 정보와 함께 메시지 조회
    const messageWithUser = await Message.findByPk(newMessage.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }]
    });

    res.status(201).json({
      success: true,
      message: '메시지가 전송되었습니다.',
      data: messageWithUser
    });
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '메시지 전송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;