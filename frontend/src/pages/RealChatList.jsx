// === 고침3 - 채팅 탭 전용 컴포넌트 생성 (실제 채팅방 목록) ===
import React, { useState, useEffect } from 'react';
import '../styles/MainPage.css';

const RealChatList = ({ onSelect }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 실제 채팅방 목록 가져오기 (나중에 구현)
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: 실제 채팅방 목록 API 호출
      // 현재는 빈 배열로 설정
      setChatRooms([]);
      
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
      setError('채팅방 목록을 불러오는데 실패했습니다.');
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  if (loading) {
    return (
      <div className="friendListContainer">
        <div className="friendItem">
          <span className="friendName">채팅방 목록 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friendListContainer">
        <div className="friendItem">
          <span className="friendName" style={{color: '#ff6b6b'}}>{error}</span>
        </div>
      </div>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <div className="friendListContainer">
        <div className="friendItem">
          <span className="friendName">채팅방이 없습니다</span>
          <span className="latestMessage">친구와 채팅을 시작해보세요</span>
        </div>
      </div>
    );
  }

  return (
    <div className="friendListContainer">
      {chatRooms.map((room) => (
        <div key={room.id} className="friendItem" 
             onClick={() => onSelect(room)}>
          <div className="photoCircle" />
          <span className="friendName">{room.name}</span>
          <span className="latestMessage">{room.lastMessage || '메시지 없음'}</span>
        </div>
      ))}
    </div>
  );
};

export default RealChatList;