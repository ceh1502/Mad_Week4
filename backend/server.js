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
    origin: "http://localhost:3000", // 프론트엔드 주소
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 4444;

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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
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

// 데이터베이스 모델 초기화
require('./models');

// API 라우트 연결
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/setup', require('./routes/setup'));

// Socket.io 연결 처리
const { handleChatEvents } = require('./socket/chatHandler');

io.on('connection', (socket) => {
  handleChatEvents(io, socket);
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