const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('chat_analyzer', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // SQL \ø D0
  timezone: '+09:00', // \m Ü
  define: {
    timestamps: false, // createdAt, updatedAt Ù Ý1 D0
    underscored: true, // snake_case ¬©
  }
});

// pt0 t¤ ð° L¤¸
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' MySQL pt0 t¤ ð° 1õ');
  } catch (error) {
    console.error('L pt0 t¤ ð° ä(:', error);
  }
};

testConnection();

module.exports = sequelize;