const User = require('./User');
const Room = require('./Room');
const Message = require('./Message');
const UserRoom = require('./UserRoom');

// 관계 설정
// User와 Room은 다대다 관계 (UserRoom을 통해)
User.belongsToMany(Room, {
  through: UserRoom,
  foreignKey: 'user_id',
  as: 'rooms'
});

Room.belongsToMany(User, {
  through: UserRoom,
  foreignKey: 'room_id',
  as: 'users'
});

// User와 Message는 일대다 관계
User.hasMany(Message, {
  foreignKey: 'user_id',
  as: 'messages'
});

Message.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Room과 Message는 일대다 관계
Room.hasMany(Message, {
  foreignKey: 'room_id',
  as: 'messages'
});

Message.belongsTo(Room, {
  foreignKey: 'room_id',
  as: 'room'
});

// UserRoom 관계
UserRoom.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserRoom.belongsTo(Room, {
  foreignKey: 'room_id',
  as: 'room'
});

module.exports = {
  User,
  Room,
  Message,
  UserRoom
};