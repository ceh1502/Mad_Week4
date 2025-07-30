const express = require('express');
const router = express.Router();
const { Room, UserRoom, User, Message } = require('../models');
const sequelize = require('../config/database'); // === 고침 - sequelize 인스턴스 정확히 import ===
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
    console.log(`📋 사용자 ${userId}의 채팅방 목록 조회 요청`);

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

    console.log(`💬 찾은 UserRoom 개수: ${userRooms.length}`);
    
    if (userRooms.length > 0) {
      console.log(`🏠 채팅방 목록:`, userRooms.map(ur => ({
        roomId: ur.room_id,
        roomName: ur.room?.name,
        joinedAt: ur.joined_at
      })));
    }

    const rooms = userRooms.map(userRoom => ({
      id: userRoom.room.id,
      name: userRoom.room.name,
      description: userRoom.room.description,
      created_at: userRoom.room.created_at,
      last_message: userRoom.room.messages[0] || null,
      joined_at: userRoom.joined_at
    }));

    console.log(`📤 응답할 채팅방 데이터:`, rooms);

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
 * /api/rooms/direct:
 *   post:
 *     summary: 1:1 채팅방 찾기/생성
 *     description: 두 사용자 간의 1:1 채팅방을 찾거나 새로 생성합니다. 이미 존재하면 기존 방을 반환하고, 없으면 새로 생성합니다.
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
 *               friendUsername:
 *                 type: string
 *                 example: "ceh1502"
 *                 description: 채팅할 친구의 사용자 아이디(username)
 *     responses:
 *       200:
 *         description: 기존 1:1 채팅방 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     created_at:
 *                       type: string
 *       201:
 *         description: 새 1:1 채팅방 생성 성공
 *       400:
 *         description: 입력 오류
 *       404:
 *         description: 친구를 찾을 수 없음
 */
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { friendUsername } = req.body;
    const userId = req.user.id;

    // 입력 검증
    if (!friendUsername || friendUsername.trim() === '' || friendUsername === req.user.username) {
      return res.status(400).json({
        success: false,
        message: '유효한 친구 아이디를 입력해주세요.'
      });
    }

    // 친구 존재 확인 (username으로 검색)
    const friend = await User.findOne({
      where: { username: friendUsername.trim() }
    });
    
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: '해당 아이디의 사용자를 찾을 수 없습니다.'
      });
    }

    const friendId = friend.id;

    // === 고침 - 1:1 채팅방 찾기 로직 단순화 (테이블명 수정) ===
    // 두 사용자가 모두 참여한 방 중에서 참여자가 정확히 2명인 방 찾기
    const userRoomsQuery = `
      SELECT room_id, COUNT(*) as participant_count
      FROM user_rooms 
      WHERE room_id IN (
        SELECT DISTINCT ur1.room_id 
        FROM user_rooms ur1
        INNER JOIN user_rooms ur2 ON ur1.room_id = ur2.room_id
        WHERE ur1.user_id = ? AND ur2.user_id = ?
      )
      GROUP BY room_id
      HAVING COUNT(*) = 2
      LIMIT 1
    `;
    
    const roomResults = await sequelize.query(userRoomsQuery, {
      replacements: [userId, friendId],
      type: sequelize.QueryTypes.SELECT
    });
    
    let existingRoom = null;
    if (roomResults && roomResults.length > 0) {
      existingRoom = await Room.findByPk(roomResults[0].room_id);
    }

    if (existingRoom) {
      // 기존 채팅방이 있으면 반환
      return res.json({
        success: true,
        message: '기존 채팅방을 찾았습니다.',
        data: {
          id: existingRoom.id,
          name: existingRoom.name,
          created_at: existingRoom.created_at
        }
      });
    }

    // 새 1:1 채팅방 생성
    const roomName = `${req.user.username}님과 ${friend.username}님의 채팅`;
    const newRoom = await Room.create({
      name: roomName,
      description: '1:1 개인 채팅방',
      created_by: userId
    });

    // 두 사용자를 채팅방에 참여시키기
    await UserRoom.bulkCreate([
      {
        user_id: userId,
        room_id: newRoom.id,
        joined_at: new Date()
      },
      {
        user_id: friendId,
        room_id: newRoom.id,
        joined_at: new Date()
      }
    ]);

    res.status(201).json({
      success: true,
      message: '새 채팅방이 생성되었습니다.',
      data: {
        id: newRoom.id,
        name: newRoom.name,
        created_at: newRoom.created_at
      }
    });

  } catch (error) {
    console.error('1:1 채팅방 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '1:1 채팅방 생성에 실패했습니다.',
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