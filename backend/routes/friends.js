const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: 친구 목록 조회 (현재는 모든 사용자)
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 친구 목록 조회 성공
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // 현재는 자신을 제외한 모든 사용자를 친구로 표시 (간단한 구현)
    const friends = await User.findAll({
      where: {
        id: {
          [require('sequelize').Op.ne]: currentUserId
        }
      },
      attributes: ['id', 'username', 'email', 'created_at'],
      order: [['username', 'ASC']]
    });

    res.json({
      success: true,
      message: '친구 목록을 가져왔습니다.',
      data: friends
    });

  } catch (error) {
    console.error('친구 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '친구 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/friends/search:
 *   get:
 *     summary: 친구 검색
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 사용자명
 *     responses:
 *       200:
 *         description: 검색 결과
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 2글자 이상 입력해주세요.'
      });
    }

    const users = await User.findAll({
      where: {
        id: {
          [require('sequelize').Op.ne]: currentUserId
        },
        username: {
          [require('sequelize').Op.iLike]: `%${q.trim()}%`
        }
      },
      attributes: ['id', 'username', 'email'],
      limit: 10
    });

    res.json({
      success: true,
      message: '검색 결과입니다.',
      data: users
    });

  } catch (error) {
    console.error('친구 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '친구 검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;