// src/pages/FriendList.jsx
import React from 'react';
import '../styles/MainPage.css';

const friends = [
  { id: 1, name: 'Ken' },
  { id: 2, name: 'Siyeon' },
  { id: 3, name: 'Boyeon' },
  { id: 4, name: 'Jinwoong' },
];

const FriendList = () => {
  return (
    <div className="friendListContainer">
      {friends.map(friend => (
        <div key={friend.id} className="friendItem">
          <div className="photoCircle" />
          <span className="friendName">{friend.name}</span>
        </div>
      ))}
    </div>
  );
};

export default FriendList;
