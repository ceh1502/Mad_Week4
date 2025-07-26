const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false
});

// 비밀번호 해싱 메서드
User.prototype.hashPassword = async function() {
  this.password = await bcrypt.hash(this.password, 10);
};

// 비밀번호 검증 메서드
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 사용자 생성 전 비밀번호 해싱
User.beforeCreate(async (user) => {
  await user.hashPassword();
});

module.exports = User;