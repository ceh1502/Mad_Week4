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
    origin: [
      "http://localhost:3000", // 개발용
      "https://minecrafton.shop", // 운영용
      "https://www.minecrafton.shop" // www 서브도메인
    ],
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
app.use(cors({
  origin: [
    "http://localhost:3000", // 개발용
    "https://minecrafton.shop", // 운영용
    "https://www.minecrafton.shop" // www 서브도메인
  ],
  credentials: true
}));
// 요청 본문 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    body: req.body
  });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 (테스트용)
app.use(express.static('public'));

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 라우트
app.get('/', (req, res) => {
  const host = req.get('host');
  const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  
  res.json({ 
    message: '채팅 분석 API 서버가 실행중입니다!',
    swagger: `${protocol}://${host}/api-docs`
  });
});

// 데이터베이스 모델 초기화
require('./models');

// API 라우트 연결
app.use('/api/auth', require('./routes/auth'));
app.use('/api/friends', require('./routes/friends'));
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