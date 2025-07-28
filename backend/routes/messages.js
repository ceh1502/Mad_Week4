const express = require('express');
const router = express.Router();
const { Message, User, Room } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/messages/{roomId}:
 *   get:
 *     summary: 특정 채팅방의 메시지 조회
 *     tags: [Messages]
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
 *         description: 메시지 조회 성공
 *       403:
 *         description: 접근 권한 없음
 */
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 사용자가 해당 채팅방에 접근할 수 있는지 확인
    const { UserRoom } = require('../models');
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
      limit: 100
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