// === 고침3 - 채팅 탭 전용 컴포넌트 생성 (실제 채팅방 목록) ===
import React, { useState, useEffect } from 'react';
import '../styles/MainPage.css';

const RealChatList = ({ onSelect }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 실제 채팅방 목록 가져오기
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('🔑 저장된 토큰 확인:', token ? '토큰 있음' : '토큰 없음');
      console.log('🔑 토큰 길이:', token ? token.length : 0);
      
      if (!token) {
        setError('로그인이 필요합니다.');
        setChatRooms([]);
        return;
      }

      const serverUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4444'
        : 'https://chat-analyzer-backend.onrender.com';

      console.log('🔗 채팅방 목록 API 호출:', `${serverUrl}/api/rooms`);
      console.log('🔑 사용할 Authorization 헤더:', `Bearer ${token.substring(0, 20)}...`);

      const response = await fetch(`${serverUrl}/api/rooms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 응답 상태:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('💬 채팅방 목록 응답:', result);

      if (result.success) {
        // 채팅방 데이터를 ChatDetail에서 사용할 수 있는 형태로 변환
        const formattedRooms = result.data.map(room => ({
          id: room.id,
          name: room.name,
          description: room.description,
          lastMessage: room.last_message?.message || '',
          lastMessageTime: room.last_message?.created_at || room.created_at,
          created_at: room.created_at
        }));
        
        setChatRooms(formattedRooms);
      } else {
        setError(result.message || '채팅방 목록을 불러오는데 실패했습니다.');
        setChatRooms([]);
      }
      
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
          <span className="friendName">채팅방이 없습니다</span>        </div>
      </div>
    );
  }

  return (
    <div className="friendListContainer">
      {chatRooms.map((room) => (
        <div key={room.id} className="friendItem" 
             onClick={() => {
               console.log('💬 채팅방 선택:', room);
               onSelect(room);
             }}>
          <div className="photoCircle" />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span className="friendName">{room.name}</span>
            <span style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
              {room.lastMessage || '새 채팅방'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RealChatList;