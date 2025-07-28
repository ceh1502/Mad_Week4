const express = require('express');
const router = express.Router();
const { User, Room, Message, UserRoom } = require('../models');

/**
 * @swagger
 * /api/setup/init:
 *   post:
 *     summary: 데이터베이스 초기 데이터 생성
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: 초기 데이터 생성 성공
 */
router.post('/init', async (req, res) => {
  try {
    // 이미 데이터가 있는지 확인
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      return res.json({
        success: true,
        message: '이미 초기 데이터가 존재합니다.',
        data: { userCount: existingUsers }
      });
    }

    // 사용자 생성 (개별 생성으로 변경 - beforeCreate 훅 작동)
    const user1 = await User.create({
      username: '김철수',
      password: 'password123'
    });
    
    const user2 = await User.create({
      username: '이영희', 
      password: 'password123'
    });
    
    const user3 = await User.create({
      username: '박민수',
      password: 'password123'
    });
    
    const users = [user1, user2, user3];

    // 채팅방 생성
    const rooms = await Room.bulkCreate([
      {
        name: '일반 대화방',
        description: '자유롭게 대화하는 공간입니다.'
      },
      {
        name: '개발 토론',
        description: '개발 관련 이야기를 나누는 공간입니다.'
      }
    ]);

    // 사용자-채팅방 연결
    const userRooms = [];
    for (const user of users) {
      for (const room of rooms) {
        userRooms.push({
          user_id: user.id,
          room_id: room.id,
          joined_at: new Date()
        });
      }
    }
    await UserRoom.bulkCreate(userRooms);

    // 샘플 메시지 생성
    const messages = await Message.bulkCreate([
      {
        room_id: rooms[0].id,
        user_id: users[0].id,
        message: '안녕하세요! 처음 뵙겠습니다.'
      },
      {
        room_id: rooms[0].id,
        user_id: users[1].id,
        message: '안녕하세요~ 반갑습니다!'
      },
      {
        room_id: rooms[0].id,
        user_id: users[2].id,
        message: '다들 안녕하세요 ㅎㅎ'
      },
      {
        room_id: rooms[1].id,
        user_id: users[0].id,
        message: 'Node.js 프로젝트 진행 어떻게 하고 계신가요?'
      },
      {
        room_id: rooms[1].id,
        user_id: users[1].id,
        message: 'Express.js로 API 서버 만들고 있어요!'
      }
    ]);

    res.json({
      success: true,
      message: '초기 데이터 생성이 완료되었습니다.',
      data: {
        users: users.length,
        rooms: rooms.length,
        messages: messages.length,
        userRooms: userRooms.length
      }
    });

  } catch (error) {
    console.error('초기 데이터 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '초기 데이터 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/setup/reset:
 *   delete:
 *     summary: 모든 데이터 삭제 (개발용)
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: 데이터 삭제 성공
 */
router.delete('/reset', async (req, res) => {
  try {
    // 개발 환경에서만 허용
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: '프로덕션 환경에서는 데이터 초기화가 허용되지 않습니다.'
      });
    }

    await Message.destroy({ where: {} });
    await UserRoom.destroy({ where: {} });
    await Room.destroy({ where: {} });
    await User.destroy({ where: {} });

    res.json({
      success: true,
      message: '모든 데이터가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('데이터 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '데이터 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;