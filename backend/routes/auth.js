const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/auth');

// 테스트용 엔드포인트
router.post('/test', (req, res) => {
  console.log('테스트 요청:', {
    body: req.body,
    headers: req.headers,
    method: req.method
  });
  
  res.json({
    success: true,
    message: '테스트 성공',
    received: req.body,
    headers: req.headers['content-type']
  });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "김철수"
 *                 description: "실명 (선택사항)"
 *               username:
 *                 type: string
 *                 example: "kimcheolsu"
 *                 description: "사용자 ID"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       400:
 *         description: 입력 오류
 *       409:
 *         description: 이미 존재하는 사용자
 */
router.post('/register', async (req, res) => {
  try {
    console.log('회원가입 요청 받음:', {
      body: req.body,
      headers: req.headers['content-type'],
      method: req.method,
      rawBody: JSON.stringify(req.body)
    });
    
    // 요청 본문이 비어있는 경우 처리
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('요청 본문이 비어있음');
      return res.status(400).json({
        success: false,
        message: '요청 데이터가 없습니다. Content-Type을 확인해주세요.',
        debug: {
          contentType: req.headers['content-type'],
          contentLength: req.headers['content-length'],
          body: req.body
        }
      });
    }
    
    const { name, username, password } = req.body;

    // 입력 검증
    if (!username || !password) {
      console.log('입력 검증 실패:', { username, password });
      return res.status(400).json({
        success: false,
        message: '사용자명과 비밀번호를 입력해주세요.',
        received: { username, password }
      });
    }

    // 이미 존재하는 사용자 확인
    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 사용자명입니다.'
      });
    }

    // 새 사용자 생성
    const newUser = await User.create({
      name: name || null,  // name이 없으면 null
      username,
      password
    });

    // 토큰 생성
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username
      },
      token
    });

  } catch (error) {
    console.error('회원가입 오류 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "김철수"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 입력 검증
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '사용자명과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '존재하지 않는 사용자입니다.'
      });
    }

    // 비밀번호 검증
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '비밀번호가 올바르지 않습니다.'
      });
    }

    // 토큰 생성
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: '로그인 성공',
      user: {
        id: user.id,
        name: user.name,
        username: user.username
      },
      token
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          created_at: req.user.created_at
        }
      }
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: 모든 사용자 목록 조회 (개발용)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'username', 'email', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      message: '사용자 목록 조회 성공',
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록을 불러오는데 실패했습니다.'
    });
  }
});

module.exports = router;