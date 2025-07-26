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