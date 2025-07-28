const express = require('express');
const router = express.Router();
const { Room, UserRoom, User, Message } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: 사용자가 참여한 채팅방 목록 조회
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 채팅방 목록 조회 성공
 *       401:
 *         description: 인증 실패
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

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
            attributes: ['username']
          }]
        }]
      }]
    });

    const rooms = userRooms.map(userRoom => ({
      id: userRoom.room.id,
      name: userRoom.room.name,
      description: userRoom.room.description,
      created_at: userRoom.room.created_at,
      last_message: userRoom.room.messages[0] || null,
      joined_at: userRoom.joined_at
    }));

    res.json({
      success: true,
      data: rooms
    });

  } catch (error) {
    console.error('채팅방 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 목록을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: 새 채팅방 생성
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "새 채팅방"
 *               description:
 *                 type: string
 *                 example: "새로운 채팅방입니다"
 *     responses:
 *       201:
 *         description: 채팅방 생성 성공
 *       400:
 *         description: 입력 오류
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: '채팅방 이름을 입력해주세요.'
      });
    }

    // 채팅방 생성
    const newRoom = await Room.create({
      name: name.trim(),
      description: description || '',
      created_by: userId
    });

    // 생성자를 채팅방에 자동 참여
    await UserRoom.create({
      user_id: userId,
      room_id: newRoom.id,
      joined_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: '채팅방이 생성되었습니다.',
      data: {
        id: newRoom.id,
        name: newRoom.name,
        description: newRoom.description,
        created_at: newRoom.created_at
      }
    });

  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 생성에 실패했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/join:
 *   post:
 *     summary: 채팅방 참여
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 채팅방 참여 성공
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.post('/:roomId/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 채팅방 존재 확인
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다.'
      });
    }

    // 이미 참여 중인지 확인
    const existingUserRoom = await UserRoom.findOne({
      where: {
        user_id: userId,
        room_id: roomId
      }
    });

    if (existingUserRoom) {
      return res.json({
        success: true,
        message: '이미 참여 중인 채팅방입니다.'
      });
    }

    // 채팅방 참여
    await UserRoom.create({
      user_id: userId,
      room_id: roomId,
      joined_at: new Date()
    });

    res.json({
      success: true,
      message: '채팅방에 참여했습니다.'
    });

  } catch (error) {
    console.error('채팅방 참여 오류:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 참여에 실패했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/messages:
 *   get:
 *     summary: 채팅방 메시지 조회
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 메시지 조회 성공
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.get('/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

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

    // 메시지 조회
    const messages = await Message.findAll({
      where: { room_id: roomId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'ASC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('메시지 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '메시지를 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

module.exports = router;