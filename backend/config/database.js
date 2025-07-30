const { Sequelize } = require('sequelize');

// PostgreSQL 연결 설정
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      define: {
        timestamps: false,
        underscored: true,
      }
    })
  : process.env.DB_HOST 
    ? new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        define: {
          timestamps: false,
          underscored: true,
        }
      })
    : new Sequelize('chat_analyzer', process.env.USER || 'postgres', '', {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: false,
        define: {
          timestamps: false,
          underscored: true,
        }
      });

// 데이터베이스 연결 및 테이블 생성
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 연결된 데이터베이스 정보 출력
    const dbConfig = sequelize.config;
    console.log('🏢 연결된 데이터베이스:', {
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      ssl: !!dbConfig.dialectOptions?.ssl
    });
    
    // 환경변수 확인
    console.log('🔍 환경변수 확인:', {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DB_HOST: !!process.env.DB_HOST,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // 테이블 자동 생성
    await sequelize.sync({ force: false, alter: true });
    console.log('🔧 데이터베이스 테이블 동기화 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
  }
};

initDatabase();

module.exports = sequelize;