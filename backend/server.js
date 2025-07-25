const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4444", // 프론트엔드 주소
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '채팅 분석 API',
      version: '1.0.0',
      description: '실시간 채팅 분석 웹서비스 API 문서',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '개발 서버',
      },
    ],
  },
  apis: ['./routes/*.js'], // API 문서가 있는 파일 경로
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: '채팅 분석 API 서버가 실행중입니다!',
    swagger: `http://localhost:${PORT}/api-docs`
  });
});

// API 라우트 연결 (나중에 추가)
// app.use('/api/chat', require('./routes/chat'));
// app.use('/api/analysis', require('./routes/analysis'));
// app.use('/api/user', require('./routes/user'));

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log('클라이언트가 연결되었습니다:', socket.id);
  
  // 채팅방 입장
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`클라이언트 ${socket.id}가 방 ${roomId}에 입장했습니다.`);
  });
  
  // 메시지 수신 및 분석
  socket.on('send-message', async (data) => {
    try {
      const { roomId, message, sender } = data;
      
      // 메시지를 같은 방의 모든 사용자에게 전송
      io.to(roomId).emit('receive-message', {
        id: Date.now(),
        message,
        sender,
        timestamp: new Date(),
      });
      
      // AI 분석 결과 전송 (임시)
      setTimeout(() => {
        io.to(roomId).emit('analysis-result', {
          suggestions: [
            "재미있네요! 더 자세히 얘기해주세요",
            "그런 일이 있었군요. 어떤 기분이셨나요?",
            "오~ 대박! 👍"
          ],
          sentiment: "긍정적",
          interest_level: 8.5,
          topic: "일상 대화"
        });
      }, 1000);
      
    } catch (error) {
      console.error('메시지 처리 오류:', error);
      socket.emit('error', { message: '메시지 처리 중 오류가 발생했습니다.' });
    }
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    console.log('클라이언트가 연결을 해제했습니다:', socket.id);
  });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '서버 내부 오류가 발생했습니다.' 
  });
});

// 404 핸들링
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '요청한 리소스를 찾을 수 없습니다.' 
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT}에서 실행중입니다.`);
  console.log(`📚 API 문서: http://localhost:${PORT}/api-docs`);
});