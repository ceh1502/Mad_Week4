const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('chat_analyzer', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // SQL \� D0
  timezone: '+09:00', // \m �
  define: {
    timestamps: false, // createdAt, updatedAt �� �1 D0
    underscored: true, // snake_case ��
  }
});

// pt0�t� � L��
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' MySQL pt0�t� � 1�');
  } catch (error) {
    console.error('L pt0�t� � �(:', error);
  }
};

testConnection();

module.exports = sequelize;