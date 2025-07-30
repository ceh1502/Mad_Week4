const express = require('express');
const router = express.Router();
const { User, Friendship } = require('../models');
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

    // 친구 관계 조회
    const friendships = await Friendship.findAll({
      where: {
        user_id: currentUserId,
        status: 'accepted'
      },
      include: [{
        model: User,
        as: 'friend',
        attributes: ['id', 'name', 'username', 'email', 'created_at']
      }],
      order: [['created_at', 'DESC']]
    });

    const friends = friendships.map(friendship => friendship.friend);

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
 * /api/friends/search-user:
 *   get:
 *     summary: 사용자 검색 (아이디로 정확히 검색)
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 사용자 아이디
 *     responses:
 *       200:
 *         description: 사용자 정보
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get('/search-user', authenticateToken, async (req, res) => {
  try {
    const { username } = req.query;
    const currentUserId = req.user.id;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '검색할 사용자 아이디를 입력해주세요.'
      });
    }

    // 정확한 사용자명으로 검색
    const user = await User.findOne({
      where: {
        username: username.trim(),
        id: {
          [require('sequelize').Op.ne]: currentUserId // 자기 자신 제외
        }
      },
      attributes: ['id', 'name', 'username', 'email', 'created_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '해당 아이디의 사용자를 찾을 수 없습니다.'
      });
    }

    // 이미 친구인지 확인
    const existingFriendship = await Friendship.findOne({
      where: {
        user_id: currentUserId,
        friend_id: user.id
      }
    });

    res.json({
      success: true,
      message: '사용자를 찾았습니다.',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        isAlreadyFriend: !!existingFriendship
      }
    });

  } catch (error) {
    console.error('사용자 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 검색 중 오류가 발생했습니다.',
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

    // 빈 검색어도 허용 (모든 사용자 표시)
    // if (!q || q.trim().length < 2) {
    //   return res.status(400).json({
    //     success: false,
    //     message: '검색어는 2글자 이상 입력해주세요.'
    //   });
    // }

    let whereCondition = {
      id: {
        [require('sequelize').Op.ne]: currentUserId
      }
    };
    
    // 검색어가 있으면 사용자명 필터링
    if (q.trim().length > 0) {
      whereCondition.username = {
        [require('sequelize').Op.iLike]: `%${q.trim()}%`
      };
    }
    
    const users = await User.findAll({
      where: whereCondition,
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

/**
 * @swagger
 * /api/friends/add:
 *   post:
 *     summary: 친구 추가
 *     tags: [Friends]
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
 *                 description: 추가할 친구의 사용자 아이디(username)
 *     responses:
 *       200:
 *         description: 친구 추가 성공
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 친구임
 */
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { friendUsername } = req.body;

    if (!friendUsername || friendUsername.trim() === '' || friendUsername === req.user.username) {
      return res.status(400).json({
        success: false,
        message: '유효한 친구 아이디를 입력해주세요.'
      });
    }

    // 친구로 추가할 사용자 확인 (username으로 검색)
    const friendUser = await User.findOne({
      where: { username: friendUsername.trim() }
    });
    
    if (!friendUser) {
      return res.status(404).json({
        success: false,
        message: '해당 아이디의 사용자를 찾을 수 없습니다.'
      });
    }

    // 이미 친구인지 확인
    const existingFriendship = await Friendship.findOne({
      where: {
        user_id: currentUserId,
        friend_id: friendUser.id
      }
    });

    if (existingFriendship) {
      return res.status(409).json({
        success: false,
        message: '이미 친구로 추가된 사용자입니다.'
      });
    }

    // 양방향 친구 관계 생성
    await Friendship.bulkCreate([
      {
        user_id: currentUserId,
        friend_id: friendUser.id,
        status: 'accepted'
      },
      {
        user_id: friendUser.id,
        friend_id: currentUserId,
        status: 'accepted'
      }
    ]);

    res.json({
      success: true,
      message: `${friendUser.username}님을 친구로 추가했습니다.`,
      data: {
        id: friendUser.id,
        name: friendUser.name,
        username: friendUser.username,
        email: friendUser.email
      }
    });

  } catch (error) {
    console.error('친구 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '친구 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;