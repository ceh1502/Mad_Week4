// src/pages/FriendList.jsx
import React from 'react';
import '../styles/MainPage.css';

const chats= [
  { id: 1, name: 'Ken' ,lastMessage:'안녕하세요!'},
  { id: 2, name: 'Siyeon', lastMessage:'안녕하세요!'},
  { id: 3, name: 'Boyeon', lastMessage:'안녕하세요!'},
  { id: 4, name: 'Jinwoong', lastMessage:'안녕하세요!'},
    { id: 5, name: 'Yujin', lastMessage:'안녕하세요!'},
    { id: 6, name: 'Byungjoo', lastMessage:'안녕하세요!'},
];

const ChatList = ({ onSelect }) => {
    // === 이건고침: 실제 채팅방 데이터로 교체 (더미 데이터에 roomId 추가) ===
    const chatsWithRoomId = chats.map(chat => ({
      ...chat,
      id: chat.id, // roomId로 사용 
      messages: [] // 빈 메시지 배열로 초기화
    }));

    return (
      <div className="friendListContainer">
        {chatsWithRoomId.map(chat => (
          <div key={chat.id} className="friendItem" 
  onClick={()=>onSelect(chat)}>
            <div className="photoCircle" />
            <span className="friendName">{chat.name}</span>
            <span className="latestMessage">{chat.lastMessage}</span>
          </div>
        ))}
      </div>
    );
  };

export default ChatList;
