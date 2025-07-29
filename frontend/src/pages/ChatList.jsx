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

const ChatList = () => {
  return (
    <div className="friendListContainer">
      {chats.map(chat => (
        <div key={chat.id} className="friendItem">
          <div className="photoCircle" />
          <span className="friendName">{chat.name}</span>
          <span className="latestMessage">{chat.lastMessage}</span>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
