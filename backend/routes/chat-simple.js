const express = require('express');
const router = express.Router();
const { User, Room, Message, UserRoom } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/chat/direct/{userId}:
 *   post:
 *     summary: 1:1 채팅 시작 (단순 버전)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 */
router.post('/direct/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId);

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: '자기 자신과는 채팅할 수 없습니다.'
      });
    }

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '상대방을 찾을 수 없습니다.'
      });
    }

    // 새 채팅방 생성 (단순 버전)
    const chatRoom = await Room.create({
      name: `${req.user.username}, ${targetUser.username}`,
      description: '1:1 채팅방'
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

    res.json({
      success: true,
      message: '채팅방이 생성되었습니다.',
      data: {
        room: {
          id: chatRoom.id,
          name: targetUser.username,
          description: chatRoom.description,
          participant: targetUser
        },
        messages: []
      }
    });

  } catch (error) {
    console.error('1:1 채팅 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;