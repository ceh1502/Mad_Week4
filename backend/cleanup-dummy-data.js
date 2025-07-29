// 더미 데이터 정리 스크립트
const { User, Room, UserRoom, Message, Friendship } = require('./models');

const cleanupDummyData = async () => {
  try {
    console.log('🧹 더미 데이터 정리 시작...');

    // 1. 더미 사용자들의 ID 찾기
    const dummyUsernames = ['김철수', '이영희', '박민수', 'kimcheolsu', 'leeyounghee', 'parkminsu'];
    const dummyUsers = await User.findAll({
      where: {
        username: dummyUsernames
      }
    });
    
    const dummyUserIds = dummyUsers.map(user => user.id);
    console.log('🔍 찾은 더미 사용자들:', dummyUsers.map(u => u.username));

    // 2. 더미 사용자들이 참여한 채팅방 찾기
    const dummyRooms = await Room.findAll({
      where: {
        name: ['일반 대화방', '개발 토론']
      }
    });
    
    const dummyRoomIds = dummyRooms.map(room => room.id);
    console.log('🔍 찾은 더미 채팅방들:', dummyRooms.map(r => r.name));

    // 3. 관련 데이터 삭제 (순서 중요!)
    if (dummyUserIds.length > 0) {
      // 3-1. 메시지 삭제
      const deletedMessages = await Message.destroy({
        where: {
          user_id: dummyUserIds
        }
      });
      console.log(`📝 삭제된 메시지: ${deletedMessages}개`);

      // 3-2. 친구 관계 삭제
      const deletedFriendships = await Friendship.destroy({
        where: {
          user_id: dummyUserIds
        }
      });
      console.log(`👥 삭제된 친구 관계: ${deletedFriendships}개`);

      // 3-3. 채팅방 참여 기록 삭제
      const deletedUserRooms = await UserRoom.destroy({
        where: {
          user_id: dummyUserIds
        }
      });
      console.log(`🏠 삭제된 채팅방 참여 기록: ${deletedUserRooms}개`);
    }

    // 3-4. 더미 채팅방 삭제
    if (dummyRoomIds.length > 0) {
      const deletedRooms = await Room.destroy({
        where: {
          id: dummyRoomIds
        }
      });
      console.log(`🏠 삭제된 채팅방: ${deletedRooms}개`);
    }

    // 3-5. 더미 사용자 삭제
    if (dummyUserIds.length > 0) {
      const deletedUsers = await User.destroy({
        where: {
          id: dummyUserIds
        }
      });
      console.log(`👤 삭제된 사용자: ${deletedUsers}개`);
    }

    console.log('✅ 더미 데이터 정리 완료!');
    console.log('💡 이제 깨끗한 상태에서 친구 추가 기능을 테스트할 수 있습니다.');

    // 현재 상태 출력
    const remainingUsers = await User.count();
    const remainingRooms = await Room.count();
    console.log(`📊 남은 사용자: ${remainingUsers}명, 남은 채팅방: ${remainingRooms}개`);

  } catch (error) {
    console.error('❌ 더미 데이터 정리 실패:', error);
  }
};

// 스크립트 실행
if (require.main === module) {
  cleanupDummyData().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('스크립트 실행 오류:', error);
    process.exit(1);
  });
}

module.exports = cleanupDummyData;