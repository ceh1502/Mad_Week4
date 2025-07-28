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
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
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
    swagger: `${protocol}://${host}/api-docs`,
    timestamp: new Date().toISOString(),
    status: 'healthy',
    frontend_url: 'https://minecrafton.shop',
    test_accounts: [
      { username: '김철수', password: 'password123' },
      { username: '이영희', password: 'password123' },
      { username: '박민수', password: 'password123' }
    ]
  });
});

// 데이터베이스 관리 페이지
app.get('/admin', async (req, res) => {
  try {
    const { User, Room, Message, UserRoom } = require('./models');
    
    // 통계 정보 수집
    const [userCount, roomCount, messageCount, userRoomCount] = await Promise.all([
      User.count(),
      Room.count(), 
      Message.count(),
      UserRoom.count()
    ]);
    
    // 최근 사용자들
    const recentUsers = await User.findAll({
      attributes: ['id', 'name', 'username', 'email', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    // 최근 채팅방들
    const recentRooms = await Room.findAll({
      attributes: ['id', 'name', 'description', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.send(\`
      <!DOCTYPE html>
      <html>
      <head>
          <title>데이터베이스 관리자</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
              .container { max-width: 1200px; margin: 0 auto; }
              .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
              .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
              .table-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f8f9fa; font-weight: bold; }
              .refresh-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>📊 데이터베이스 관리자</h1>
              <button class="refresh-btn" onclick="location.reload()">🔄 새로고침</button>
              
              <div class="stats">
                  <div class="stat-card">
                      <div class="stat-number">\${userCount}</div>
                      <div>총 사용자</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">\${roomCount}</div>
                      <div>총 채팅방</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">\${messageCount}</div>
                      <div>총 메시지</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">\${userRoomCount}</div>
                      <div>총 참여</div>
                  </div>
              </div>
              
              <div class="table-section">
                  <h2>👤 최근 가입 사용자</h2>
                  <table>
                      <tr><th>ID</th><th>실명</th><th>사용자명</th><th>이메일</th><th>가입일</th></tr>
                      \${recentUsers.map(user => \`
                          <tr>
                              <td>\${user.id}</td>
                              <td>\${user.name || 'N/A'}</td>
                              <td>\${user.username}</td>
                              <td>\${user.email || 'N/A'}</td>
                              <td>\${new Date(user.created_at).toLocaleString('ko-KR')}</td>
                          </tr>
                      \`).join('')}
                  </table>
              </div>
              
              <div class="table-section">
                  <h2>💬 최근 생성 채팅방</h2>
                  <table>
                      <tr><th>ID</th><th>방 이름</th><th>설명</th><th>생성일</th></tr>
                      \${recentRooms.map(room => \`
                          <tr>
                              <td>\${room.id}</td>
                              <td>\${room.name}</td>
                              <td>\${room.description || 'N/A'}</td>
                              <td>\${new Date(room.created_at).toLocaleString('ko-KR')}</td>
                          </tr>
                      \`).join('')}
                  </table>
              </div>
              
              <div class="table-section">
                  <h2>🔗 유용한 링크</h2>
                  <ul>
                      <li><a href="/api-docs">API 문서</a></li>
                      <li><a href="/debug">디버그 페이지</a></li>
                      <li><a href="/api/auth/users">전체 사용자 JSON</a></li>
                      <li><a href="/health">서버 상태</a></li>
                  </ul>
              </div>
          </div>
      </body>
      </html>
    \`);
  } catch (error) {
    res.status(500).send('데이터베이스 연결 오류: ' + error.message);
  }
});

// 프론트엔드 디버깅용 라우트
app.get('/debug', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>디버그 페이지</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .test-btn { padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .result { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>API 테스트 페이지</h1>
            <button class="test-btn" onclick="testRegister()">회원가입 테스트</button>
            <button class="test-btn" onclick="testLogin()">로그인 테스트</button>
            <button class="test-btn" onclick="getUserList()">사용자 목록 조회</button>
            <button class="test-btn" onclick="getRooms()">채팅방 목록 조회</button>
            <button class="test-btn" onclick="clearStorage()">localStorage 초기화</button>
            <div id="result" class="result"></div>
        </div>
        
        <script>
            function log(message) {
                document.getElementById('result').innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
            }
            
            function clearStorage() {
                localStorage.clear();
                sessionStorage.clear();
                log('Storage 초기화 완료');
            }
            
            async function testRegister() {
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: 'test' + Date.now(),
                            password: 'test123'
                        })
                    });
                    const data = await response.json();
                    log('회원가입 결과: ' + JSON.stringify(data));
                } catch (error) {
                    log('회원가입 에러: ' + error.message);
                }
            }
            
            async function testLogin() {
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: '김철수',
                            password: 'password123'
                        })
                    });
                    const data = await response.json();
                    log('로그인 결과: ' + JSON.stringify(data));
                    
                    if (data.success && data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        log('토큰과 사용자 정보가 localStorage에 저장됨');
                    }
                } catch (error) {
                    log('로그인 에러: ' + error.message);
                }
            }
            
            async function getUserList() {
                try {
                    const response = await fetch('/api/auth/users');
                    const data = await response.json();
                    log('사용자 목록: ' + JSON.stringify(data, null, 2));
                } catch (error) {
                    log('사용자 목록 조회 에러: ' + error.message);
                }
            }
            
            async function getRooms() {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        log('로그인이 필요합니다.');
                        return;
                    }
                    
                    const response = await fetch('/api/rooms', {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    const data = await response.json();
                    log('채팅방 목록: ' + JSON.stringify(data, null, 2));
                } catch (error) {
                    log('채팅방 목록 조회 에러: ' + error.message);
                }
            }
        </script>
    </body>
    </html>
  `);
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// 데이터베이스 모델 초기화
require('./models');

// 초기 데이터 생성
const initData = async () => {
  try {
    const { User, Room, UserRoom } = require('./models');
    
    // 기존 사용자 수 확인
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('🔧 초기 사용자 생성 중...');
      
      // 테스트 사용자 생성
      const users = [];
      const testUsers = [
        { name: '김철수', username: 'kimcheolsu', password: 'password123' },
        { name: '이영희', username: 'leeyounghee', password: 'password123' },
        { name: '박민수', username: 'parkminsu', password: 'password123' }
      ];
      
      for (const userData of testUsers) {
        const user = await User.create(userData);
        users.push(user);
      }
      
      // 기본 채팅방 생성
      const room = await Room.create({
        name: '일반 대화방',
        description: '자유롭게 대화하는 공간입니다.',
        created_by: users[0].id
      });
      
      // 모든 사용자를 기본 채팅방에 참여시키기
      for (const user of users) {
        await UserRoom.create({
          user_id: user.id,
          room_id: room.id,
          joined_at: new Date()
        });
      }
      
      console.log('✅ 초기 데이터 생성 완료');
    }
  } catch (error) {
    console.error('❌ 초기 데이터 생성 실패:', error);
  }
};

// 서버 시작 후 초기 데이터 생성
setTimeout(initData, 2000);

// API 라우트 연결
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));
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