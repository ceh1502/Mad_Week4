const express = require('express');
const router = express.Router();
const { User, Room, Message, UserRoom } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/chat/direct/{userId}:
 *   post:
 *     summary: 1:1 채팅 시작 (채팅방 자동 생성/접속)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅할 상대방 사용자 ID
 *     responses:
 *       200:
 *         description: 채팅방 생성/접속 성공
 *       404:
 *         description: 상대방을 찾을 수 없음
 */
router.post('/direct/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId);

    // 자기 자신과는 채팅할 수 없음
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: '자기 자신과는 채팅할 수 없습니다.'
      });
    }

    // 상대방 사용자 확인
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '상대방을 찾을 수 없습니다.'
      });
    }

    // 이미 존재하는 1:1 채팅방 찾기
    // 두 사용자가 모두 참여하고 있는 방 중에서 참여자가 정확히 2명인 방
    const existingRooms = await Room.findAll({
      include: [{
        model: User,
        as: 'users',
        where: {
          id: [currentUserId, targetUserId]
        },
        through: { attributes: [] }
      }]
    });

    let chatRoom = null;
    for (const room of existingRooms) {
      const userCount = await UserRoom.count({
        where: { room_id: room.id }
      });
      if (userCount === 2) {
        chatRoom = room;
        break;
      }
    }

    // 채팅방이 없으면 새로 생성
    if (!chatRoom) {
      chatRoom = await Room.create({
        name: `${req.user.username}, ${targetUser.username}`,
        description: '1:1 채팅방',
        is_direct: true
      });

      // 두 사용자를 채팅방에 추가
      await UserRoom.bulkCreate([
        {
          user_id: currentUserId,
          room_id: chatRoom.id,
          joined_at: new Date()
        },
        {
          user_id: targetUserId,
          room_id: chatRoom.id,
          joined_at: new Date()
        }
      ]);
    }

    // 채팅방 정보와 최근 메시지 조회
    const roomWithMessages = await Room.findByPk(chatRoom.id, {
      include: [{
        model: Message,
        as: 'messages',
        limit: 30,
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }]
      }, {
        model: User,
        as: 'users',
        attributes: ['id', 'username', 'email'],
        through: { attributes: [] }
      }]
    });

    // 메시지 순서를 시간순으로 정렬 (오래된 것부터)
    const messages = roomWithMessages.messages.reverse();

    res.json({
      success: true,
      message: '채팅방에 입장했습니다.',
      data: {
        room: {
          id: roomWithMessages.id,
          name: roomWithMessages.name,
          description: roomWithMessages.description,
          is_direct: roomWithMessages.is_direct,
          users: roomWithMessages.users,
          participant: targetUser // 상대방 정보
        },
        messages
      }
    });

  } catch (error) {
    console.error('1:1 채팅 시작 오류:', error);
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
        }, {
          model: User,
          as: 'users',
          attributes: ['id', 'username'],
          through: { attributes: [] }
        }]
      }],
      order: [['joined_at', 'DESC']]
    });

    const rooms = await Promise.all(userRooms.map(async userRoom => {
      const room = userRoom.room;
      
      // 1:1 채팅방인 경우 상대방 이름으로 표시
      let displayName = room.name;
      let participant = null;
      
      if (room.is_direct && room.users.length === 2) {
        // 상대방 찾기
        participant = room.users.find(user => user.id !== userId);
        if (participant) {
          displayName = participant.username;
        }
      }
      
      return {
        id: room.id,
        name: displayName,
        originalName: room.name,
        description: room.description,
        is_direct: room.is_direct,
        participant: participant,
        joinedAt: userRoom.joined_at,
        lastMessage: room.messages[0] || null
      };
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