const { Sequelize } = require('sequelize');

// 환경변수에서 DATABASE_URL 사용 (PostgreSQL 연결 문자열)
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
  : new Sequelize('chat_analyzer', 'root', '', {
      host: 'localhost',
      dialect: 'mysql',
      logging: false,
      timezone: '+09:00',
      define: {
        timestamps: false,
        underscored: true,
      }
    });

// 데이터베이스 연결 테스트
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
  }
};

testConnection();

module.exports = sequelize;