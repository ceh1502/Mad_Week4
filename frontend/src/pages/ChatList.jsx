// src/pages/FriendList.jsx
import React from 'react';
import '../styles/MainPage.css';

// === 고침: 백엔드에 실제 존재하는 사용자명으로 수정 ===
const friends = [
  { username: '김철수', name: 'Ken', lastMessage:'친구와 채팅하기'},
  { username: '이영희', name: 'Siyeon', lastMessage:'친구와 채팅하기'},
  { username: '박민수', name: 'Boyeon', lastMessage:'친구와 채팅하기'},
  { username: 'ceh1502', name: 'Jinwoong', lastMessage:'친구와 채팅하기'},
  { username: 'testuser', name: 'Yujin', lastMessage:'친구와 채팅하기'},
  { username: 'testuser2', name: 'Byungjoo', lastMessage:'친구와 채팅하기'},
];

const ChatList = ({ onSelect }) => {
  // === 고침: 1:1 채팅방 생성/연결 로직 추가 ===
  const handleFriendClick = async (friend) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 1:1 채팅방 생성/찾기 API 호출
      const serverUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4444'
        : 'https://chat-analyzer-backend.onrender.com';

      console.log('🔗 API 호출 URL:', `${serverUrl}/api/rooms/direct`);
      const response = await fetch(`${serverUrl}/api/rooms/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          friendUsername: friend.username
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 채팅방 정보를 onSelect에 전달
        const chatRoom = {
          id: result.data.id, // 실제 채팅방 ID
          name: friend.name, // 친구 이름 표시
          messages: [] // 빈 메시지 배열
        };
        console.log('💬 1:1 채팅방 생성/연결:', result);
        onSelect(chatRoom);
      } else {
        alert('채팅방 생성에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      alert('채팅방 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="friendListContainer">
      {friends.map((friend) => (
        <div key={friend.username} className="friendItem" 
             onClick={() => handleFriendClick(friend)}>
          <div className="photoCircle" />
          <span className="friendName">{friend.name}</span>
          <span className="latestMessage">{friend.lastMessage}</span>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
